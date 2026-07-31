#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <expected-40-character-commit>" >&2
  exit 2
fi

expected_commit="$1"
deploy_target="${IVANOV_WORKS_DEPLOY_TARGET:-root@155.212.162.160}"
deploy_dir="${IVANOV_WORKS_DEPLOY_DIR:-/opt/ivanov.works}"

ssh -o BatchMode=yes -o ConnectTimeout=15 "$deploy_target" \
  bash -s -- "$deploy_dir" "$expected_commit" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

deploy_dir="$1"
expected_commit="$2"

cd "$deploy_dir"

on_error() {
  exit_code=$?
  echo "Production deployment failed; current Compose state:" >&2
  docker compose ps >&2 || true
  docker compose logs --tail=200 app caddy >&2 || true
  exit "$exit_code"
}
trap on_error ERR

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Remote worktree is not clean: $deploy_dir" >&2
  exit 1
fi

if [[ "$(git branch --show-current)" != "master" ]]; then
  echo "Remote repository must be on master" >&2
  exit 1
fi

git fetch --prune origin master
remote_commit="$(git rev-parse origin/master)"
if [[ "$remote_commit" != "$expected_commit" ]]; then
  echo "origin/master ($remote_commit) does not match release commit ($expected_commit)" >&2
  exit 1
fi

git pull --ff-only origin master
deployed_commit="$(git rev-parse HEAD)"
if [[ "$deployed_commit" != "$expected_commit" ]]; then
  echo "Checked-out commit ($deployed_commit) does not match release commit ($expected_commit)" >&2
  exit 1
fi

docker compose config --quiet
docker compose up -d --build

app_healthy=false
for _ in {1..12}; do
  app_container="$(docker compose ps -q app)"
  if [[ -n "$app_container" ]]; then
    app_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$app_container")"
    if [[ "$app_health" == "healthy" ]]; then
      app_healthy=true
      break
    fi
  fi
  sleep 5
done

if [[ "$app_healthy" != "true" ]]; then
  echo "Application did not become healthy within 60 seconds" >&2
  exit 1
fi

caddy_container="$(docker compose ps -q caddy)"
if [[ -z "$caddy_container" || "$(docker inspect --format '{{.State.Status}}' "$caddy_container")" != "running" ]]; then
  echo "Caddy is not running" >&2
  exit 1
fi

curl --fail --silent --show-error --max-time 20 https://ivanov.works/ >/dev/null

trap - ERR
echo "Production deployed successfully: $deployed_commit"
docker compose ps
REMOTE_SCRIPT
