#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


SCRIPT = Path(__file__).with_name("ytracker_api.py")


def run_json(name: str, args: list[str], *, expected_failure: str | None = None, input_text: str | None = None) -> Any:
    command = [sys.executable, str(SCRIPT), "--compact", *args]
    result = subprocess.run(command, text=True, input=input_text, capture_output=True, check=False)
    output = f"{result.stdout}\n{result.stderr}"
    expected_failed = expected_failure is not None and result.returncode != 0 and expected_failure in output
    if result.returncode != 0 and not expected_failed:
        print(f"failed: {name}", file=sys.stderr)
        if result.stdout.strip():
            print(result.stdout.strip())
        if result.stderr.strip():
            print(result.stderr.strip(), file=sys.stderr)
        raise SystemExit(result.returncode)
    print(f"passed: {name}")
    if expected_failed:
        return {"expected_failure": expected_failure}
    if not result.stdout.strip():
        return {}
    return json.loads(result.stdout)


def issue_key(result: Any) -> str:
    key = result.get("key") if isinstance(result, dict) else None
    if not key:
        raise SystemExit(f"Could not read issue key: {result}")
    return str(key)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a live smoke test for ytracker_api.py on temporary issues.")
    parser.add_argument("--queue", default="SF")
    parser.add_argument("--out-dir", default="/tmp/ytracker_api_smoke")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    attachment_path = out_dir / "ytracker-smoke.txt"
    attachment_path.write_text("Codex Tracker smoke attachment\n", encoding="utf-8")
    comment_path = out_dir / "ytracker-smoke-comment.txt"
    comment_path.write_text("Smoke test comment from file\nSecond line\n", encoding="utf-8")

    primary = issue_key(
        run_json(
            "create primary issue",
            [
                "create-issue",
                "--queue",
                args.queue,
                "--summary",
                "Codex ytracker smoke primary",
                "--description",
                "Temporary issue created by ytracker_api smoke_test.py.",
            ],
        )
    )
    companion = issue_key(
        run_json(
            "create companion issue",
            [
                "create-issue",
                "--queue",
                args.queue,
                "--summary",
                "Codex ytracker smoke companion",
                "--description",
                "Temporary companion issue created by ytracker_api smoke_test.py.",
            ],
        )
    )

    user_id = "8000000000000005"
    try:
        run_json("my-issues", ["my-issues", "--queue", args.queue, "--per-page", "3"])
        run_json("get-issue", ["get-issue", primary, "--fields", "key", "summary", "status", "priority", "assignee"])
        run_json("request GET", ["request", "GET", f"/issues/{primary}", "--query", "fields=key,summary,status"])
        run_json("request PATCH guard", ["request", "PATCH", f"/issues/{primary}", "--body", '{"summary":"must not update"}'], expected_failure="requires --confirm-write")
        run_json("request PATCH", ["request", "PATCH", f"/issues/{primary}", "--body", '{"description":"Smoke generic PATCH"}', "--confirm-write"])
        run_json("confirm guard", ["set-summary", primary, "must not update"], expected_failure=f"requires --confirm {primary}")
        run_json("assign", ["assign", primary, "--user-id", user_id, "--confirm", primary])
        run_json("set-summary", ["set-summary", primary, "Codex ytracker smoke primary updated", "--confirm", primary])
        run_json("set-priority", ["set-priority", primary, "critical", "--confirm", primary])
        run_json("set-type bug", ["set-type", primary, "bug", "--confirm", primary])
        run_json("set-type task", ["set-type", primary, "task", "--confirm", primary])
        run_json("components", ["components"])
        run_json("set-components", ["set-components", primary, "Control", "Backend", "--confirm", primary])
        run_json("clear-components", ["clear-components", primary, "--confirm", primary])
        run_json("set-tags", ["set-tags", primary, "codex-api-smoke", "test-one", "--confirm", primary])
        run_json("add-tags", ["add-tags", primary, "test-two", "test-three", "--confirm", primary])
        run_json("clear-tags", ["clear-tags", primary, "--confirm", primary])
        run_json("set-checklist", ["set-checklist", primary, "first smoke item", "second smoke item", "--confirm", primary])
        run_json("checklist-complete by index", ["checklist-complete", primary, "--index", "1", "--confirm", primary])
        run_json("checklist-uncomplete by text", ["checklist-uncomplete", primary, "--text", "first smoke item", "--confirm", primary])
        run_json("checklist-complete by text", ["checklist-complete", primary, "--text", "second smoke item", "--confirm", primary])
        checklist = run_json("clear-checklist", ["clear-checklist", primary, "--confirm", primary])
        if checklist.get("checklistItems") or checklist.get("checklistTotal") or checklist.get("checklistDone"):
            raise SystemExit(f"clear-checklist did not clear checklist: {checklist}")
        comment = run_json("add-comment", ["add-comment", primary, "Smoke test comment", "--confirm", primary])
        comment_id = str(comment.get("id") or comment.get("longId"))
        run_json("comments", ["comments", primary, "--expand", "all"])
        run_json("edit-comment", ["edit-comment", primary, comment_id, "Smoke test comment edited", "--confirm", primary])
        run_json("delete-comment", ["delete-comment", primary, comment_id, "--confirm", primary])
        stdin_comment = run_json("add-comment stdin", ["add-comment", primary, "--stdin", "--confirm", primary], input_text="Smoke test comment from stdin\nSecond line\n")
        stdin_comment_id = str(stdin_comment.get("id") or stdin_comment.get("longId"))
        file_comment = run_json("add-comment text file", ["add-comment", primary, "--text-file", str(comment_path), "--confirm", primary])
        file_comment_id = str(file_comment.get("id") or file_comment.get("longId"))
        run_json("delete stdin comment", ["delete-comment", primary, stdin_comment_id, "--confirm", primary])
        run_json("delete file comment", ["delete-comment", primary, file_comment_id, "--confirm", primary])
        link = run_json("add-link", ["add-link", primary, companion, "--relationship", "relates", "--confirm", primary])
        link_id = str(link.get("id"))
        run_json("links", ["links", primary])
        run_json("delete-link", ["delete-link", primary, link_id, "--confirm", primary])
        run_json("upload-temp-file", ["upload-temp-file", str(attachment_path)])
        attachment = run_json("attach-file", ["attach-file", primary, str(attachment_path), "--confirm", primary])
        attachment_id = str(attachment.get("id"))
        run_json("attachments", ["attachments", primary])
        run_json("attachment-text", ["attachment-text", primary, attachment_id])
        run_json("download-attachment", ["download-attachment", primary, attachment_id, "--output", str(out_dir / "downloaded.txt")])
        run_json("attach-description-file", ["attach-description-file", primary, str(attachment_path), "--confirm", primary])
        for item in run_json("attachments cleanup list", ["attachments", primary]):
            run_json("delete-attachment", ["delete-attachment", primary, str(item["id"]), "--confirm", primary])
        run_json("transitions", ["request", "GET", f"/issues/{primary}/transitions"])
        run_json("change-status", ["change-status", primary, "selectedForDev", "--comment", "Smoke transition", "--confirm", primary])
    finally:
        for key in (primary, companion):
            run_json("cleanup " + key, ["change-status", key, "cancelled", "--resolution", "dontDo", "--comment", "Smoke cleanup", "--confirm", key])

    final_primary = run_json("verify primary cleanup", ["get-issue", primary, "--fields", "key", "status", "resolution", "tags", "components", "checklistItems", "checklistTotal", "checklistDone"])
    final_companion = run_json("verify companion cleanup", ["get-issue", companion, "--fields", "key", "status", "resolution"])
    links = run_json("verify links cleanup", ["links", primary])
    attachments = run_json("verify attachments cleanup", ["attachments", primary])
    results = {
        "primary": final_primary,
        "companion": final_companion,
        "links": links,
        "attachments": attachments,
    }
    (out_dir / "smoke_results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_dir / 'smoke_results.json'}")


if __name__ == "__main__":
    main()
