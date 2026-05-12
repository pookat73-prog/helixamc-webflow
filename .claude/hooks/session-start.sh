#!/bin/bash
# ============================================================
# SessionStart hook — claude/* feature branch auto-rebase
#
# 목적: 새 세션이 origin/main 기반의 claude/* 브랜치에서 시작될 때,
# 자동으로 origin/staging 기반으로 재배치. CLAUDE.md 워크플로우상
# 모든 작업이 staging 으로 먼저 머지되므로 staging 을 기준으로 시작
# 해야 PR 시 충돌이 없음.
#
# 안전장치:
#   - claude/* 브랜치가 아니면 no-op
#   - working tree 에 uncommitted change 가 있으면 no-op
#   - HEAD 가 origin/main 의 ancestor 가 아니면 (=자체 커밋 있음) no-op
#   - origin/staging 이 없거나 이미 거기 있으면 no-op
#   - fetch 실패 시 지수 backoff 4회 retry 후 포기 (세션 차단 X)
# ============================================================
set -uo pipefail

# 사용자 메시지는 모두 stderr 로 — stdout 은 hook JSON 응답용
log() { echo "[session-start] $*" >&2; }

current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
case "$current_branch" in
  claude/*) ;;
  *) exit 0 ;;
esac

# 작업 중인 변경이 있으면 절대 건드리지 않음
if ! git diff --quiet HEAD 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  log "$current_branch has uncommitted changes — skip"
  exit 0
fi

# origin/staging + origin/main fetch (네트워크 불안 대비 지수 backoff)
attempt=0
while ! git fetch origin staging main >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 4 ]; then
    log "git fetch failed after 4 attempts — skip"
    exit 0
  fi
  sleep $((2 ** (attempt - 1)))
done

if ! git rev-parse --verify origin/staging >/dev/null 2>&1; then
  log "origin/staging not found — skip"
  exit 0
fi

head_sha=$(git rev-parse HEAD)
staging_sha=$(git rev-parse origin/staging)

if [ "$head_sha" = "$staging_sha" ]; then
  log "$current_branch already at origin/staging — skip"
  exit 0
fi

# HEAD 가 origin/main 의 ancestor 인지 = 자체 커밋 없는지
merge_base=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
if [ "$merge_base" != "$head_sha" ]; then
  log "$current_branch has commits beyond origin/main — skip rebase"
  exit 0
fi

log "rebasing $current_branch onto origin/staging ($staging_sha)"
git reset --hard origin/staging >/dev/null 2>&1 || {
  log "git reset failed"
  exit 0
}
log "done"
