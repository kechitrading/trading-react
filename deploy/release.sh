#!/usr/bin/env bash
# Runs on the AWS host as the deploy user. Installs a dashboard build or rolls back.
#
#   release.sh deploy <sha> <tarball>   unpack into releases/<sha>, switch current, health check
#   release.sh rollback [<sha>]         switch current to <sha>, or to the previous release
#
# nginx serves $WEB_DIR/current (set up by aqta deploy/scripts/setup-nginx-ip.sh). The switch is
# an atomic symlink rename, so a page load never sees a half-copied build. The last 5 releases
# are kept for rollback. A failed health check after a deploy switches back automatically.
set -euo pipefail

WEB_DIR="${WEB_DIR:-/var/www/aqta-webapp}"
RELEASES="$WEB_DIR/releases"
KEEP=5
MARKER='AQTA Quant Desk'
HEALTH_BASE="${HEALTH_BASE:-https://127.0.0.1}"

log() { printf '==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ -d "$RELEASES" ]] || die "$RELEASES missing: run aqta deploy/scripts/setup-nginx-ip.sh first"

current_release() { basename "$(readlink -f "$WEB_DIR/current" 2>/dev/null || echo none)"; }

switch_to() {
  local target="$RELEASES/$1"
  [[ -f "$target/index.html" ]] || die "release $1 has no index.html"
  ln -sfn "$target" "$WEB_DIR/current.tmp"
  mv -T "$WEB_DIR/current.tmp" "$WEB_DIR/current"
  log "current -> $1"
}

healthy() {
  # Through nginx, as a browser would load it: the dashboard page and the API probe.
  local page
  page=$(curl -skf --max-time 10 "$HEALTH_BASE/") || return 1
  grep -q "$MARKER" <<<"$page" || return 1
  local asset
  asset=$(grep -oE '/assets/[^"]+\.js' <<<"$page" | head -1)
  [[ -z "$asset" ]] || curl -skf --max-time 10 -o /dev/null "$HEALTH_BASE$asset" || return 1
  curl -skf --max-time 10 -o /dev/null "$HEALTH_BASE/health" || log "warning: API /health not OK (dashboard is still served)"
}

prune() {
  local live old n=0
  live=$(current_release)
  # Newest first by mtime; keep the $KEEP newest builds (live one included, never pruned).
  # The placeholder stays.
  while IFS= read -r old; do
    [[ "$old" == "placeholder" ]] && continue
    n=$((n + 1))
    if ((n > KEEP)) && [[ "$old" != "$live" ]]; then
      rm -rf -- "${RELEASES:?}/$old"
      log "pruned $old"
    fi
  done < <(ls -1t "$RELEASES")
}

cmd="${1:-}"
case "$cmd" in
  deploy)
    sha="${2:?usage: release.sh deploy <sha> <tarball>}"
    tarball="${3:?usage: release.sh deploy <sha> <tarball>}"
    [[ "$sha" =~ ^[0-9a-f]{7,40}$ ]] || die "bad sha: $sha"
    previous=$(current_release)
    if [[ "$previous" == "$sha" ]] && healthy; then
      log "$sha is already live and healthy; nothing to do"
      rm -f -- "$tarball"
      exit 0
    fi
    stage="$RELEASES/.$sha.tmp"
    rm -rf -- "$stage" && mkdir -p "$stage"
    tar -xzf "$tarball" -C "$stage"
    [[ -f "$stage/index.html" ]] || die "tarball has no index.html at its root"
    chmod -R a+rX "$stage"
    rm -rf -- "${RELEASES:?}/$sha" && mv "$stage" "$RELEASES/$sha"
    touch "$RELEASES/$sha"
    rm -f -- "$tarball"
    switch_to "$sha"
    if healthy; then
      log "deployed $sha (previous: $previous)"
      echo "$previous" >"$WEB_DIR/.previous"
      prune
    else
      log "health check failed for $sha"
      if [[ -f "$RELEASES/$previous/index.html" ]]; then
        switch_to "$previous"
        die "rolled back to $previous"
      fi
      die "no previous release to roll back to"
    fi
    ;;
  rollback)
    target="${2:-$(cat "$WEB_DIR/.previous" 2>/dev/null || true)}"
    [[ -n "$target" ]] || die "no previous release recorded; pass a sha (ls $RELEASES)"
    [[ "$target" =~ ^([0-9a-f]{7,40}|placeholder)$ ]] || die "bad sha: $target"
    from=$(current_release)
    switch_to "$target"
    healthy || log "warning: health check failed after rollback"
    echo "$from" >"$WEB_DIR/.previous"
    log "rolled back $from -> $target"
    ;;
  *)
    die "usage: release.sh deploy <sha> <tarball> | rollback [<sha>]"
    ;;
esac
