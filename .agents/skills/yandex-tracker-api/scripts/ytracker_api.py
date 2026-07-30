#!/usr/bin/env python3
"""Small CLI wrapper for the direct Yandex Tracker REST API."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
from pathlib import Path
import re
import socket
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any
from uuid import uuid4


PROJECT_ROOT = Path(__file__).resolve().parents[4]


API_BASE_URL = "https://api.tracker.yandex.net/v3"
DEFAULT_QUEUE = "SF"
ENV_TOKEN = "YANDEX_TRACKER_TOKEN"
ENV_ORG = "YANDEX_TRACKER_ORG"
ENV_QUEUE = "YANDEX_TRACKER_QUEUE"
KNOWN_COMPONENTS = {
    "backend": {"id": "2", "display": "Backend"},
    "control": {"id": "4", "display": "Control"},
    "frontend": {"id": "1", "display": "Frontend"},
    "mobile": {"id": "5", "display": "Mobile"},
    "saas": {"id": "3", "display": "SaaS"},
}
TEXT_ATTACHMENT_EXTENSIONS = {
    ".csv",
    ".env",
    ".ini",
    ".json",
    ".log",
    ".md",
    ".markdown",
    ".sql",
    ".text",
    ".toml",
    ".tsv",
    ".txt",
    ".xml",
    ".yaml",
    ".yml",
}
TEXT_ATTACHMENT_MIMETYPES = {
    "application/csv",
    "application/json",
    "application/markdown",
    "application/sql",
    "application/toml",
    "application/x-yaml",
    "application/xml",
}
WRITE_COMMANDS_REQUIRING_CONFIRM = {
    "update-issue",
    "assign",
    "set-summary",
    "change-status",
    "set-type",
    "set-priority",
    "set-components",
    "clear-components",
    "set-tags",
    "add-tags",
    "clear-tags",
    "set-checklist",
    "clear-checklist",
    "checklist-complete",
    "checklist-uncomplete",
    "add-comment",
    "edit-comment",
    "delete-comment",
    "add-link",
    "delete-link",
    "attach-file",
    "delete-attachment",
    "attach-description-file",
}


class TrackerApiError(RuntimeError):
    """Raised when the direct Tracker API returns an error."""


class TrackerApiClient:
    def __init__(
        self,
        token: str,
        org_id: str,
        base_url: str = API_BASE_URL,
        timeout: float = 30.0,
        insecure: bool = True,
    ) -> None:
        self.token = token
        self.org_id = org_id
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.ssl_context = ssl._create_unverified_context() if insecure else None

    def request(
        self,
        method: str,
        path: str,
        *,
        body: Any | None = None,
        query: dict[str, str | int | None] | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        url = self._url(path, query)
        data = None
        request_headers = self._headers()
        if headers:
            request_headers.update(headers)
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            request_headers["Content-Type"] = "application/json"

        request = urllib.request.Request(url, data=data, headers=request_headers, method=method.upper())
        try:
            with urllib.request.urlopen(request, timeout=self.timeout, context=self.ssl_context) as response:
                return self._decode_response(response)
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise TrackerApiError(f"{exc.code} {exc.reason}: {details}") from exc
        except urllib.error.URLError as exc:
            raise TrackerApiError(format_url_error(exc.reason)) from exc

    def upload_attachment(self, issue_key: str, file_path: Path) -> Any:
        return self._upload_multipart(f"/issues/{quote(issue_key)}/attachments/", file_path)

    def upload_temp_attachment(self, file_path: Path) -> Any:
        return self._upload_multipart("/attachments/", file_path)

    def attach_description_file(self, issue_key: str, file_path: Path) -> Any:
        uploaded = self.upload_temp_attachment(file_path)
        attachment_id = uploaded.get("id")
        if not attachment_id:
            raise TrackerApiError(f"Could not read temporary attachment id: {uploaded}")
        self.update_issue(issue_key, {"descriptionAttachmentIds": [attachment_id]})
        return self.get_issue(issue_key, ["key", "summary", "description"])

    def _upload_multipart(self, path: str, file_path: Path) -> Any:
        if not file_path.is_file():
            raise TrackerApiError(f"Attachment file does not exist: {file_path}")

        boundary = f"----codex-tracker-{uuid4().hex}"
        filename = file_path.name
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        body = b"".join(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"),
                f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"),
                file_path.read_bytes(),
                f"\r\n--{boundary}--\r\n".encode("utf-8"),
            ]
        )
        request = urllib.request.Request(
            self._url(path),
            data=body,
            headers={
                **self._headers(),
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout, context=self.ssl_context) as response:
                return self._decode_response(response)
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise TrackerApiError(f"{exc.code} {exc.reason}: {details}") from exc
        except urllib.error.URLError as exc:
            raise TrackerApiError(format_url_error(exc.reason)) from exc

    def search_issues(self, query_body: dict[str, Any], per_page: int = 20, fields: list[str] | None = None) -> Any:
        query: dict[str, str | int | None] = {"perPage": per_page}
        if fields:
            query["fields"] = ",".join(fields)
        return self.request("POST", "/issues/_search", body=query_body, query=query)

    def my_issues(self, queue_key: str, per_page: int) -> Any:
        return self.search_issues(
            {
                "filter": {"queue": queue_key, "assignee": "me()"},
            },
            per_page=per_page,
            fields=["key", "summary", "status", "priority", "assignee"],
        )

    def get_issue(self, issue_key: str, fields: list[str] | None = None) -> Any:
        query = {"fields": ",".join(fields)} if fields else None
        return self.request("GET", f"/issues/{quote(issue_key)}", query=query)

    def create_issue(self, issue: dict[str, Any]) -> Any:
        return self.request("POST", "/issues/", body=issue)

    def update_issue(self, issue_key: str, fields: dict[str, Any]) -> Any:
        return self.request("PATCH", f"/issues/{quote(issue_key)}", body=fields)

    def assign_issue(self, issue_key: str, user_id: str) -> Any:
        self.update_issue(issue_key, {"assignee": {"id": user_id}})
        return self.get_issue(issue_key, ["key", "summary", "status", "assignee"])

    def set_components(self, issue_key: str, components: list[str]) -> Any:
        self.update_issue(issue_key, {"components": [normalize_component(component) for component in components]})
        return self.get_issue(issue_key, ["key", "summary", "components"])

    def clear_components(self, issue_key: str) -> Any:
        self.update_issue(issue_key, {"components": []})
        return self.get_issue(issue_key, ["key", "summary", "components"])

    def add_tags(self, issue_key: str, tags: list[str]) -> Any:
        issue = self.get_issue(issue_key, ["key", "summary", "tags"])
        existing = issue.get("tags", [])
        merged = list(dict.fromkeys([*existing, *tags]))
        self.update_issue(issue_key, {"tags": merged})
        return self.get_issue(issue_key, ["key", "summary", "tags"])

    def set_checklist(self, issue_key: str, items: list[str]) -> Any:
        checklist = [{"text": item, "checked": False} for item in items]
        self.update_issue(issue_key, {"checklistItems": checklist})
        return self.get_issue(issue_key, ["key", "summary", "checklistItems", "checklistTotal", "checklistDone"])

    def clear_checklist(self, issue_key: str) -> Any:
        delete_result = self.request("DELETE", f"/issues/{quote(issue_key)}/checklistItems")
        issue = self.get_issue(issue_key, ["key", "summary", "checklistItems", "checklistTotal", "checklistDone"])
        if issue.get("checklistItems") or issue.get("checklistTotal") or issue.get("checklistDone"):
            self.update_issue(issue_key, {"checklistItems": []})
            issue = self.get_issue(issue_key, ["key", "summary", "checklistItems", "checklistTotal", "checklistDone"])
            issue["cleanup_fallback"] = "update-issue checklistItems=[]"
        else:
            issue["cleanup_fallback"] = None
        issue["delete_result"] = delete_result
        return issue

    def set_checklist_item_state(
        self,
        issue_key: str,
        checked: bool,
        *,
        index: int | None = None,
        text: str | None = None,
    ) -> Any:
        issue = self.get_issue(issue_key, ["key", "summary", "checklistItems", "checklistTotal", "checklistDone"])
        items = issue.get("checklistItems") or []
        if not isinstance(items, list):
            raise TrackerApiError(f"Could not read checklistItems for {issue_key}: {items}")

        item_index = resolve_checklist_item_index(items, index=index, text=text)
        updated_items = []
        for position, item in enumerate(items):
            if not isinstance(item, dict):
                raise TrackerApiError(f"Unexpected checklist item at position {position + 1}: {item}")
            item_text = item.get("text")
            if not isinstance(item_text, str):
                raise TrackerApiError(f"Checklist item at position {position + 1} has no text: {item}")
            updated_items.append({"text": item_text, "checked": checked if position == item_index else bool(item.get("checked"))})

        self.update_issue(issue_key, {"checklistItems": updated_items})
        result = self.get_issue(issue_key, ["key", "summary", "checklistItems", "checklistTotal", "checklistDone"])
        result["changedChecklistItem"] = {
            "index": item_index + 1,
            "text": updated_items[item_index]["text"],
            "checked": checked,
        }
        return result

    def transitions(self, issue_key: str) -> Any:
        return self.request("GET", f"/issues/{quote(issue_key)}/transitions")

    def change_status(
        self,
        issue_key: str,
        status_or_transition: str,
        resolution: str | None = None,
        comment: str | None = None,
    ) -> Any:
        transition_id = self._resolve_transition(issue_key, status_or_transition)
        body: dict[str, Any] = {}
        if resolution is not None:
            body["resolution"] = resolution
        if comment is not None:
            body["comment"] = comment
        self.request("POST", f"/issues/{quote(issue_key)}/transitions/{quote(transition_id)}/_execute", body=body)
        return self.get_issue(issue_key, ["key", "summary", "status", "statusType", "resolution", "assignee"])

    def add_comment(self, issue_key: str, text: str) -> Any:
        return self.request("POST", f"/issues/{quote(issue_key)}/comments", body={"text": text})

    def list_comments(self, issue_key: str, per_page: int = 50, expand: str | None = None) -> Any:
        return self.request(
            "GET",
            f"/issues/{quote(issue_key)}/comments",
            query={"perPage": per_page, "expand": expand},
        )

    def edit_comment(self, issue_key: str, comment_id: str, text: str) -> Any:
        return self.request("PATCH", f"/issues/{quote(issue_key)}/comments/{quote(comment_id)}", body={"text": text})

    def delete_comment(self, issue_key: str, comment_id: str) -> Any:
        return self.request("DELETE", f"/issues/{quote(issue_key)}/comments/{quote(comment_id)}")

    def get_links(self, issue_key: str) -> Any:
        return self.request("GET", f"/issues/{quote(issue_key)}/links")

    def add_link(self, issue_key: str, linked_issue: str, relationship: str) -> Any:
        return self.request(
            "POST",
            f"/issues/{quote(issue_key)}/links",
            body={"relationship": relationship, "issue": linked_issue},
        )

    def delete_link(self, issue_key: str, link_id: str) -> Any:
        return self.request("DELETE", f"/issues/{quote(issue_key)}/links/{quote(link_id)}")

    def list_attachments(self, issue_key: str) -> Any:
        return self.request("GET", f"/issues/{quote(issue_key)}/attachments")

    def download_attachment(self, issue_key: str, attachment_id: str, file_path: Path) -> Any:
        data, metadata = self._download_attachment(issue_key, attachment_id)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(data)
        return {
            **metadata,
            "path": str(file_path),
            "size": len(data),
        }

    def read_attachment_text(
        self,
        issue_key: str,
        attachment_id: str,
        encoding: str = "utf-8",
        force: bool = False,
    ) -> Any:
        metadata = self._find_attachment(issue_key, attachment_id)
        if not force and not is_text_attachment(metadata):
            name = metadata.get("name") or attachment_id
            mimetype = metadata.get("mimetype") or "unknown"
            raise TrackerApiError(
                f"Attachment {name} has mimetype {mimetype}; refusing to download it as text. "
                "Use download-attachment for binary files or attachment-text --force for known text files."
            )

        data, metadata = self._download_attachment(issue_key, attachment_id, metadata=metadata)
        try:
            text = data.decode(encoding)
        except UnicodeDecodeError as exc:
            raise TrackerApiError(f"Attachment is not valid {encoding} text: {exc}") from exc
        return {
            **metadata,
            "encoding": encoding,
            "size": len(data),
            "text": text,
        }

    def delete_attachment(self, issue_key: str, attachment_id: str) -> Any:
        return self.request("DELETE", f"/issues/{quote(issue_key)}/attachments/{quote(attachment_id)}")

    def list_components(self) -> Any:
        return self.request("GET", "/components")

    def _resolve_transition(self, issue_key: str, status_or_transition: str) -> str:
        transitions = self.transitions(issue_key)
        if not isinstance(transitions, list):
            return status_or_transition

        for transition in transitions:
            if transition.get("id") == status_or_transition:
                return status_or_transition
            to_status = transition.get("to") or {}
            if to_status.get("key") == status_or_transition:
                return transition["id"]

        return status_or_transition

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"OAuth {self.token}",
            "X-Org-ID": self.org_id,
            "Accept": "application/json",
        }

    def _download_attachment(
        self,
        issue_key: str,
        attachment_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> tuple[bytes, dict[str, Any]]:
        if metadata is None:
            metadata = self._find_attachment(issue_key, attachment_id)
        path = self._attachment_download_path(issue_key, attachment_id, metadata)
        request = urllib.request.Request(
            self._url(path),
            headers={
                **self._headers(),
                "Accept": "*/*",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout, context=self.ssl_context) as response:
                headers = response.headers
                content_disposition = headers.get("Content-Disposition", "")
                return response.read(), {
                    "id": metadata.get("id"),
                    "name": metadata.get("name"),
                    "mimetype": metadata.get("mimetype"),
                    "contentType": headers.get("Content-Type"),
                    "filename": parse_content_disposition_filename(content_disposition) or metadata.get("name"),
                }
        except urllib.error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise TrackerApiError(f"{exc.code} {exc.reason}: {details}") from exc
        except urllib.error.URLError as exc:
            raise TrackerApiError(format_url_error(exc.reason)) from exc

    def _find_attachment(self, issue_key: str, attachment_id: str) -> dict[str, Any]:
        attachments = self.list_attachments(issue_key)
        if not isinstance(attachments, list):
            raise TrackerApiError(f"Could not read attachment list for {issue_key}: {attachments}")
        for attachment in attachments:
            if str(attachment.get("id")) == str(attachment_id):
                return attachment
        raise TrackerApiError(f"Attachment {attachment_id} was not found in {issue_key}")

    def _attachment_download_path(
        self,
        issue_key: str,
        attachment_id: str,
        metadata: dict[str, Any],
    ) -> str:
        content_url = metadata.get("content")
        if isinstance(content_url, str) and content_url:
            parsed = urllib.parse.urlparse(content_url)
            if parsed.path.startswith("/v3/"):
                return parsed.path[3:]
            return parsed.path

        name = metadata.get("name")
        if not isinstance(name, str) or not name:
            raise TrackerApiError(f"Attachment {attachment_id} has no content URL or file name")
        return f"/issues/{quote(issue_key)}/attachments/{quote(attachment_id)}/{quote(name)}"

    def _url(self, path: str, query: dict[str, str | int | None] | None = None) -> str:
        url = f"{self.base_url}/{path.lstrip('/')}"
        clean_query = {key: value for key, value in (query or {}).items() if value is not None}
        if clean_query:
            url = f"{url}?{urllib.parse.urlencode(clean_query)}"
        return url

    @staticmethod
    def _decode_response(response: Any) -> Any:
        if response.status == 204:
            return {"status": 204}
        raw = response.read().decode("utf-8")
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"text": raw}


def build_parser(default_queue: str = DEFAULT_QUEUE) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=API_BASE_URL, help="Tracker API base URL")
    parser.add_argument("--timeout", type=float, default=30.0, help="Request timeout in seconds")
    parser.add_argument("--verify-tls", action="store_true", help="Enable TLS certificate verification for this run")
    parser.add_argument("--compact", action="store_true", help="Print compact JSON")

    subparsers = parser.add_subparsers(dest="command", required=True)

    request = subparsers.add_parser("request", help="Call any Tracker API endpoint")
    request.add_argument("method", help="HTTP method")
    request.add_argument("path", help="API path, for example /issues/SF-1")
    request.add_argument("--body", default=None, help="JSON request body")
    request.add_argument("--query", action="append", default=[], help="Query pair key=value; can be repeated")
    request.add_argument("--confirm-write", action="store_true", help="Required for non-GET generic requests.")

    my_issues = subparsers.add_parser("my-issues", help=f"List my assigned issues in queue {default_queue}")
    my_issues.add_argument("--queue", default=default_queue, help=f"Queue key, defaults to ${ENV_QUEUE} or {DEFAULT_QUEUE}")
    my_issues.add_argument("--per-page", type=int, default=20, help="Number of issues to return")

    get_issue = subparsers.add_parser("get-issue", help="Read issue details")
    get_issue.add_argument("issue_key", help="Issue key")
    get_issue.add_argument("--fields", nargs="*", help="Fields to request")

    create_issue = subparsers.add_parser("create-issue", help="Create an issue")
    create_issue.add_argument("--summary", required=True, help="Issue summary")
    create_issue.add_argument("--description", default="", help="Issue description")
    create_issue.add_argument("--queue", default=default_queue, help=f"Queue key, defaults to ${ENV_QUEUE} or {DEFAULT_QUEUE}")
    create_issue.add_argument("--type", default="task", dest="issue_type", help="Issue type key")
    create_issue.add_argument("--priority", help="Priority key")
    create_issue.add_argument("--parent", help="Parent issue key")

    update_issue = subparsers.add_parser("update-issue", help="Patch issue fields from JSON")
    update_issue.add_argument("issue_key", help="Issue key")
    update_issue.add_argument("fields", help="JSON field object")
    add_confirm_arg(update_issue)

    assign = subparsers.add_parser("assign", help="Assign an issue to a user id")
    assign.add_argument("issue_key", help="Issue key")
    assign.add_argument("--user-id", required=True, help="Tracker user id")
    add_confirm_arg(assign)

    set_summary = subparsers.add_parser("set-summary", help="Change issue summary")
    set_summary.add_argument("issue_key", help="Issue key")
    set_summary.add_argument("summary", nargs="+", help="New issue summary")
    add_confirm_arg(set_summary)

    change_status = subparsers.add_parser("change-status", help="Change issue status through transitions")
    change_status.add_argument("issue_key", help="Issue key")
    change_status.add_argument("status", help="Target status key or transition id")
    change_status.add_argument("--resolution", help="Resolution key")
    change_status.add_argument("--comment", help="Transition comment")
    add_confirm_arg(change_status)

    subparsers.add_parser("components", help="List organization components")

    set_type = subparsers.add_parser("set-type", help="Change issue type")
    set_type.add_argument("issue_key", help="Issue key")
    set_type.add_argument("issue_type", help="Issue type key")
    add_confirm_arg(set_type)

    set_priority = subparsers.add_parser("set-priority", help="Change issue priority")
    set_priority.add_argument("issue_key", help="Issue key")
    set_priority.add_argument("priority", help="Priority key")
    add_confirm_arg(set_priority)

    set_components = subparsers.add_parser("set-components", help="Replace issue components")
    set_components.add_argument("issue_key", help="Issue key")
    set_components.add_argument("components", nargs="+", help="Component names or ids")
    add_confirm_arg(set_components)

    clear_components = subparsers.add_parser("clear-components", help="Clear issue components")
    clear_components.add_argument("issue_key", help="Issue key")
    add_confirm_arg(clear_components)

    set_tags = subparsers.add_parser("set-tags", help="Replace issue tags")
    set_tags.add_argument("issue_key", help="Issue key")
    set_tags.add_argument("tags", nargs="+", help="Tag values")
    add_confirm_arg(set_tags)

    add_tags = subparsers.add_parser("add-tags", help="Add issue tags without removing existing tags")
    add_tags.add_argument("issue_key", help="Issue key")
    add_tags.add_argument("tags", nargs="+", help="Tag values")
    add_confirm_arg(add_tags)

    clear_tags = subparsers.add_parser("clear-tags", help="Clear issue tags")
    clear_tags.add_argument("issue_key", help="Issue key")
    add_confirm_arg(clear_tags)

    set_checklist = subparsers.add_parser("set-checklist", help="Replace issue checklist")
    set_checklist.add_argument("issue_key", help="Issue key")
    set_checklist.add_argument("items", nargs="+", help="Checklist item text")
    add_confirm_arg(set_checklist)

    clear_checklist = subparsers.add_parser("clear-checklist", help="Clear issue checklist")
    clear_checklist.add_argument("issue_key", help="Issue key")
    add_confirm_arg(clear_checklist)

    checklist_complete = subparsers.add_parser("checklist-complete", help="Mark one checklist item complete")
    checklist_complete.add_argument("issue_key", help="Issue key")
    add_checklist_selector_args(checklist_complete)
    add_confirm_arg(checklist_complete)

    checklist_uncomplete = subparsers.add_parser("checklist-uncomplete", help="Mark one checklist item incomplete")
    checklist_uncomplete.add_argument("issue_key", help="Issue key")
    add_checklist_selector_args(checklist_uncomplete)
    add_confirm_arg(checklist_uncomplete)

    add_comment = subparsers.add_parser("add-comment", help="Add a comment")
    add_comment.add_argument("issue_key", help="Issue key")
    add_comment.add_argument("text", nargs="*", help="Comment text")
    add_comment.add_argument("--stdin", action="store_true", help="Read comment text from standard input")
    add_comment.add_argument("--text-file", help="Read comment text from a UTF-8 file")
    add_confirm_arg(add_comment)

    list_comments = subparsers.add_parser("comments", help="List issue comments")
    list_comments.add_argument("issue_key", help="Issue key")
    list_comments.add_argument("--per-page", type=int, default=50, help="Number of comments")
    list_comments.add_argument("--expand", help="Expansion mode, for example all")

    edit_comment = subparsers.add_parser("edit-comment", help="Edit an issue comment")
    edit_comment.add_argument("issue_key", help="Issue key")
    edit_comment.add_argument("comment_id", help="Comment id or longId")
    edit_comment.add_argument("text", nargs="+", help="New comment text")
    add_confirm_arg(edit_comment)

    delete_comment = subparsers.add_parser("delete-comment", help="Delete an issue comment")
    delete_comment.add_argument("issue_key", help="Issue key")
    delete_comment.add_argument("comment_id", help="Comment id or longId")
    add_confirm_arg(delete_comment)

    get_links = subparsers.add_parser("links", help="List issue links")
    get_links.add_argument("issue_key", help="Issue key")

    add_link = subparsers.add_parser("add-link", help="Create an issue link")
    add_link.add_argument("issue_key", help="Issue key")
    add_link.add_argument("linked_issue", help="Linked issue key")
    add_link.add_argument("--relationship", default="relates", help="Tracker relationship key")
    add_confirm_arg(add_link)

    delete_link = subparsers.add_parser("delete-link", help="Delete an issue link")
    delete_link.add_argument("issue_key", help="Issue key")
    delete_link.add_argument("link_id", help="Issue link id")
    add_confirm_arg(delete_link)

    attachments = subparsers.add_parser("attachments", help="List issue attachments")
    attachments.add_argument("issue_key", help="Issue key")

    download_attachment = subparsers.add_parser("download-attachment", help="Download an issue attachment")
    download_attachment.add_argument("issue_key", help="Issue key")
    download_attachment.add_argument("attachment_id", help="Attachment id")
    download_attachment.add_argument("--output", required=True, help="Path to write the downloaded file")

    attachment_text = subparsers.add_parser("attachment-text", help="Download an issue attachment and decode it as text")
    attachment_text.add_argument("issue_key", help="Issue key")
    attachment_text.add_argument("attachment_id", help="Attachment id")
    attachment_text.add_argument("--encoding", default="utf-8", help="Text encoding, defaults to utf-8")
    attachment_text.add_argument("--force", action="store_true", help="Decode even when metadata does not look text-like")

    upload = subparsers.add_parser("attach-file", help="Attach a file to an issue")
    upload.add_argument("issue_key", help="Issue key")
    upload.add_argument("file_path", help="File to attach")
    add_confirm_arg(upload)

    delete_attachment = subparsers.add_parser("delete-attachment", help="Delete an issue attachment")
    delete_attachment.add_argument("issue_key", help="Issue key")
    delete_attachment.add_argument("attachment_id", help="Attachment id")
    add_confirm_arg(delete_attachment)

    temp_upload = subparsers.add_parser("upload-temp-file", help="Upload a temporary attachment")
    temp_upload.add_argument("file_path", help="File to upload")

    description_file = subparsers.add_parser("attach-description-file", help="Attach a file to an issue description")
    description_file.add_argument("issue_key", help="Issue key")
    description_file.add_argument("file_path", help="File to attach to the description")
    add_confirm_arg(description_file)

    return parser


def add_confirm_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--confirm", help="Required for write commands; must equal ISSUE_KEY.")


def add_checklist_selector_args(parser: argparse.ArgumentParser) -> None:
    selector = parser.add_mutually_exclusive_group(required=True)
    selector.add_argument("--index", type=int, help="1-based checklist item index")
    selector.add_argument("--text", help="Exact checklist item text")


def require_confirm(args: argparse.Namespace) -> None:
    issue_key = getattr(args, "issue_key", None)
    if issue_key is None:
        return
    if getattr(args, "confirm", None) != issue_key:
        raise TrackerApiError(f"{args.command} requires --confirm {issue_key}")


def main() -> int:
    dotenv_values = load_dotenv_values()
    default_queue = resolve_queue(dotenv_values)
    args = build_parser(default_queue).parse_args()
    token = resolve_setting(ENV_TOKEN, dotenv_values)
    org_id = resolve_setting(ENV_ORG, dotenv_values)
    if not token:
        print(f"{ENV_TOKEN} is not set in shell environment or .env", file=sys.stderr)
        return 2
    if not org_id:
        print(f"{ENV_ORG} is not set in shell environment or .env", file=sys.stderr)
        return 2

    client = TrackerApiClient(
        token=token,
        org_id=org_id,
        base_url=args.base_url,
        timeout=args.timeout,
        insecure=not args.verify_tls,
    )
    try:
        result = run_command(args, client)
    except TrackerApiError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print_json(result, compact=args.compact)
    return 0


def run_command(args: argparse.Namespace, client: TrackerApiClient) -> Any:
    if args.command in WRITE_COMMANDS_REQUIRING_CONFIRM:
        require_confirm(args)
    if args.command == "request":
        is_readonly_search = args.method.upper() == "POST" and args.path.rstrip("/") == "/issues/_search"
        if args.method.upper() != "GET" and not is_readonly_search and not args.confirm_write:
            raise TrackerApiError("Non-GET request requires --confirm-write")
        return client.request(args.method, args.path, body=parse_json_object(args.body), query=parse_query(args.query))
    if args.command == "my-issues":
        return client.my_issues(args.queue, args.per_page)
    if args.command == "get-issue":
        return client.get_issue(args.issue_key, args.fields)
    if args.command == "create-issue":
        body: dict[str, Any] = {
            "summary": args.summary,
            "queue": args.queue,
            "type": args.issue_type,
        }
        if args.description:
            body["description"] = args.description
        if args.priority:
            body["priority"] = args.priority
        if args.parent:
            body["parent"] = args.parent
        return client.create_issue(body)
    if args.command == "update-issue":
        return client.update_issue(args.issue_key, parse_json_object(args.fields) or {})
    if args.command == "assign":
        return client.assign_issue(args.issue_key, args.user_id)
    if args.command == "set-summary":
        client.update_issue(args.issue_key, {"summary": " ".join(args.summary)})
        return client.get_issue(args.issue_key, ["key", "summary"])
    if args.command == "change-status":
        return client.change_status(args.issue_key, args.status, args.resolution, args.comment)
    if args.command == "components":
        return client.list_components()
    if args.command == "set-type":
        client.update_issue(args.issue_key, {"type": args.issue_type})
        return client.get_issue(args.issue_key, ["key", "summary", "type"])
    if args.command == "set-priority":
        client.update_issue(args.issue_key, {"priority": args.priority})
        return client.get_issue(args.issue_key, ["key", "summary", "priority"])
    if args.command == "set-components":
        return client.set_components(args.issue_key, args.components)
    if args.command == "clear-components":
        return client.clear_components(args.issue_key)
    if args.command == "set-tags":
        client.update_issue(args.issue_key, {"tags": args.tags})
        return client.get_issue(args.issue_key, ["key", "summary", "tags"])
    if args.command == "add-tags":
        return client.add_tags(args.issue_key, args.tags)
    if args.command == "clear-tags":
        client.update_issue(args.issue_key, {"tags": []})
        return client.get_issue(args.issue_key, ["key", "summary", "tags"])
    if args.command == "set-checklist":
        return client.set_checklist(args.issue_key, args.items)
    if args.command == "clear-checklist":
        return client.clear_checklist(args.issue_key)
    if args.command == "checklist-complete":
        return client.set_checklist_item_state(args.issue_key, True, index=args.index, text=args.text)
    if args.command == "checklist-uncomplete":
        return client.set_checklist_item_state(args.issue_key, False, index=args.index, text=args.text)
    if args.command == "add-comment":
        return client.add_comment(args.issue_key, read_comment_text(args))
    if args.command == "comments":
        return client.list_comments(args.issue_key, args.per_page, args.expand)
    if args.command == "edit-comment":
        return client.edit_comment(args.issue_key, args.comment_id, " ".join(args.text))
    if args.command == "delete-comment":
        return client.delete_comment(args.issue_key, args.comment_id)
    if args.command == "links":
        return client.get_links(args.issue_key)
    if args.command == "add-link":
        return client.add_link(args.issue_key, args.linked_issue, args.relationship)
    if args.command == "delete-link":
        return client.delete_link(args.issue_key, args.link_id)
    if args.command == "attachments":
        return client.list_attachments(args.issue_key)
    if args.command == "download-attachment":
        return client.download_attachment(args.issue_key, args.attachment_id, Path(args.output))
    if args.command == "attachment-text":
        return client.read_attachment_text(args.issue_key, args.attachment_id, args.encoding, args.force)
    if args.command == "attach-file":
        return client.upload_attachment(args.issue_key, Path(args.file_path))
    if args.command == "delete-attachment":
        return client.delete_attachment(args.issue_key, args.attachment_id)
    if args.command == "upload-temp-file":
        return client.upload_temp_attachment(Path(args.file_path))
    if args.command == "attach-description-file":
        return client.attach_description_file(args.issue_key, Path(args.file_path))
    raise TrackerApiError(f"Unsupported command: {args.command}")


def parse_json_object(raw: str | None) -> dict[str, Any] | None:
    if raw is None:
        return None
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise TrackerApiError(f"Invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise TrackerApiError("JSON value must be an object")
    return value


def parse_query(items: list[str]) -> dict[str, str]:
    query: dict[str, str] = {}
    for item in items:
        if "=" not in item:
            raise TrackerApiError(f"Query item must be key=value: {item}")
        key, value = item.split("=", 1)
        query[key] = value
    return query


def read_comment_text(args: argparse.Namespace) -> str:
    sources = int(bool(args.stdin)) + int(bool(args.text_file)) + int(bool(args.text))
    if sources != 1:
        raise TrackerApiError("add-comment requires exactly one text source: positional text, --stdin, or --text-file")
    if args.stdin:
        text = sys.stdin.read()
    elif args.text_file:
        text = Path(args.text_file).read_text(encoding="utf-8")
    else:
        text = " ".join(args.text)
    if not text:
        raise TrackerApiError("Comment text must not be empty")
    return text


def resolve_checklist_item_index(
    items: list[Any],
    *,
    index: int | None,
    text: str | None,
) -> int:
    if index is not None:
        if index < 1 or index > len(items):
            raise TrackerApiError(f"Checklist index {index} is out of range 1..{len(items)}")
        return index - 1

    matches = [position for position, item in enumerate(items) if isinstance(item, dict) and item.get("text") == text]
    if not matches:
        raise TrackerApiError(f"Checklist item with exact text was not found: {text}")
    if len(matches) > 1:
        positions = ", ".join(str(position + 1) for position in matches)
        raise TrackerApiError(f"Checklist item text is not unique; matching positions: {positions}")
    return matches[0]


def normalize_component(component: str) -> dict[str, str]:
    key = component.strip().lower()
    if key in KNOWN_COMPONENTS:
        return {"id": KNOWN_COMPONENTS[key]["id"]}
    if component.isdigit():
        return {"id": component}
    known = ", ".join(sorted(item["display"] for item in KNOWN_COMPONENTS.values()))
    raise TrackerApiError(f"Unknown component '{component}'. Use one of: {known}; or pass a numeric component id.")


def quote(value: str) -> str:
    return urllib.parse.quote(value, safe="")


def is_text_attachment(metadata: dict[str, Any]) -> bool:
    mimetype = metadata.get("mimetype")
    if isinstance(mimetype, str):
        clean_mimetype = mimetype.split(";", 1)[0].strip().lower()
        if clean_mimetype.startswith("text/") or clean_mimetype in TEXT_ATTACHMENT_MIMETYPES:
            return True

    name = metadata.get("name")
    if isinstance(name, str):
        return Path(name).suffix.lower() in TEXT_ATTACHMENT_EXTENSIONS
    return False


def parse_content_disposition_filename(value: str) -> str | None:
    match = re.search(r'filename\*?=(?:UTF-8\'\')?"?([^";]+)"?', value, flags=re.IGNORECASE)
    if not match:
        return None
    return urllib.parse.unquote(match.group(1))


def print_json(value: Any, compact: bool) -> None:
    if compact:
        print(json.dumps(value, ensure_ascii=False, separators=(",", ":")))
        return
    print(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True))


def format_url_error(reason: Any) -> str:
    message = str(reason)
    if is_network_dns_error(reason, message):
        return (
            f"{message}. This looks like a network/DNS sandbox failure; "
            "retry the same direct helper command with required escalation."
        )
    return message


def is_network_dns_error(reason: Any, message: str) -> bool:
    if isinstance(reason, socket.gaierror):
        return True
    markers = [
        "Name or service not known",
        "nodename nor servname provided",
        "Temporary failure in name resolution",
        "Network is unreachable",
    ]
    return any(marker in message for marker in markers)


def load_dotenv_values() -> dict[str, str]:
    env_path = PROJECT_ROOT / ".env"
    if not env_path.is_file():
        return {}

    values: dict[str, str] = {}
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key.strip()] = value
    return values


def resolve_setting(name: str, dotenv_values: dict[str, str]) -> str | None:
    return os.environ.get(name) or dotenv_values.get(name)


def resolve_queue(dotenv_values: dict[str, str]) -> str:
    queue = resolve_setting(ENV_QUEUE, dotenv_values)
    if not queue:
        return DEFAULT_QUEUE
    queue = queue.strip()
    return queue or DEFAULT_QUEUE


if __name__ == "__main__":
    sys.exit(main())
