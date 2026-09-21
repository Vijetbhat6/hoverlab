#!/usr/bin/env bash
#
# Validate the inputs and make the git history `hoverlab review --base` needs.
#
# WHY HISTORY IS THE HARD PART
#
# `hoverlab review --base <ref>` runs `git merge-base HEAD <ref>` and then
# `git diff <merge-base>...HEAD`. Both need the commits between the branch
# and the base, and `actions/checkout` fetches one commit by default. On a
# pull_request event that one commit is GitHub's synthetic merge commit, and
# in a depth-1 clone its parents are cut off ("grafted"), so HEAD has no
# ancestry at all and merge-base finds nothing.
#
# The reliable fix is `fetch-depth: 0` on the checkout, and the README says
# so. This script exists so the action still works when someone forgets:
#
#   1. Fetch the base branch (shallow if this clone is shallow).
#   2. If HEAD and the base still share no ancestor, deepen in growing steps
#      (50, 200, 1000 commits). Deepening asks for the base branch AND HEAD's
#      own commit, because deepening only the base leaves the merge commit's
#      parents cut off and the two histories never meet.
#   3. Last resort: --unshallow, i.e. everything.
#
# Everything the script prints about refs goes through `esc`, because a
# branch name is attacker-controlled on a pull request and may contain `%0A`
# or newlines, which the runner would otherwise read as workflow commands.
#
# Inputs (environment, never interpolated into this file by the workflow):
#   INPUT_BASE INPUT_PATHS INPUT_FAIL_ON INPUT_COMMENT INPUT_COMMENT_ON_CLEAN
#   EVENT_NAME EVENT_BEFORE GITHUB_TOKEN GITHUB_SERVER_URL GITHUB_OUTPUT
# Outputs: base (a ref `--base` can take, empty when paths are named),
#          merge-base (the commit the diff starts from).

set -eo pipefail

esc() {
  local s="$1"
  s="${s//'%'/'%25'}"
  s="${s//$'\r'/'%0D'}"
  s="${s//$'\n'/'%0A'}"
  printf '%s' "$s"
}

fail() {
  printf '::error title=hoverlab review::%s\n' "$(esc "$1")"
  exit 1
}

emit() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s=%s\n' "$1" "$2" >> "$GITHUB_OUTPUT"
  else
    printf '%s=%s\n' "$1" "$2"
  fi
}

# --- validate the enumerated inputs before touching the network -----------

case "${INPUT_FAIL_ON:-violation}" in
  violation | never) ;;
  *) fail "fail-on must be 'violation' or 'never', got '${INPUT_FAIL_ON}'." ;;
esac
case "${INPUT_COMMENT:-true}" in
  true | false) ;;
  *) fail "comment must be 'true' or 'false', got '${INPUT_COMMENT}'." ;;
esac
case "${INPUT_COMMENT_ON_CLEAN:-true}" in
  true | false | always) ;;
  *) fail "comment-on-clean must be 'true', 'false' or 'always', got '${INPUT_COMMENT_ON_CLEAN}'." ;;
esac

git rev-parse --git-dir > /dev/null 2>&1 ||
  fail "Not a git repository. Run actions/checkout first, and check the working-directory input."

# Named paths are reviewed in full; there is no diff, so there is no history to find.
if [ -n "${INPUT_PATHS:-}" ]; then
  echo "paths is set: reviewing those paths in full, so no base is needed."
  emit base ''
  emit merge-base ''
  exit 0
fi

# --- decide what to compare against ---------------------------------------

base_input="${INPUT_BASE:-}"

if [ -z "$base_input" ]; then
  before="${EVENT_BEFORE:-}"
  if [ "${EVENT_NAME:-}" = push ] && [[ "$before" =~ ^[0-9a-f]{40,64}$ ]] && [[ ! "$before" =~ ^0+$ ]]; then
    base_input="$before"
    echo "push event: reviewing what the push changed, from ${before:0:7}."
  else
    fail "Nothing to compare against. On a pull_request event the base defaults to the PR's base branch; on other events set the 'base' input to a branch or commit, or set 'paths' to review files in full."
  fi
fi

server="${GITHUB_SERVER_URL:-https://github.com}"
shallow="$(git rev-parse --is-shallow-repository 2> /dev/null || echo false)"
head_sha="$(git rev-parse HEAD 2> /dev/null)" || fail "The repository has no commits checked out."

# --- fetching, with a token fallback for persist-credentials: false -------

auth_header=""
last_error=""

fetch() {
  local out
  if out="$(git fetch --no-tags --quiet "$@" 2>&1)"; then return 0; fi
  last_error="$out"

  if [ -z "$auth_header" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
    local b64
    b64="$(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 | tr -d '\n')"
    echo "::add-mask::$b64"
    if out="$(git -c "http.${server}/.extraheader=AUTHORIZATION: basic ${b64}" fetch --no-tags --quiet "$@" 2>&1)"; then
      auth_header="AUTHORIZATION: basic ${b64}"
      return 0
    fi
    last_error="$out"
  fi
  return 1
}

# git with the fallback credential applied once it has proved necessary.
fetch_with() {
  if [ -n "$auth_header" ]; then
    git -c "http.${server}/.extraheader=${auth_header}" fetch --no-tags --quiet "$@" 2> /dev/null
  else
    fetch "$@"
  fi
}

depth_arg=()
if [ "$shallow" = true ]; then depth_arg=(--depth=1); fi

ref=""
refspec=""

if [[ "$base_input" =~ ^[0-9a-fA-F]{7,64}$ ]] && git cat-file -e "${base_input}^{commit}" 2> /dev/null; then
  # A commit we already have.
  ref="$base_input"
  refspec=""
else
  name="${base_input#refs/heads/}"
  name="${name#origin/}"
  refspec="+refs/heads/${name}:refs/remotes/origin/${name}"

  if fetch "${depth_arg[@]}" origin "$refspec"; then
    ref="origin/${name}"
  elif [[ "$base_input" =~ ^[0-9a-f]{40,64}$ ]] && fetch "${depth_arg[@]}" origin "$base_input"; then
    ref="$base_input"
    refspec="$base_input"
  elif git rev-parse --verify --quiet "${base_input}^{commit}" > /dev/null; then
    ref="$base_input"
    refspec=""
  else
    fail "Could not fetch base '${base_input}': ${last_error:-unknown error}. Check that the branch exists, that actions/checkout kept its credentials (or pass github-token), and prefer fetch-depth: 0."
  fi
fi

have_merge_base() { git merge-base HEAD "$ref" > /dev/null 2>&1; }

# --- make sure HEAD and the base actually meet ----------------------------

if ! have_merge_base && [ "$(git rev-parse --is-shallow-repository)" = true ]; then
  echo "Shallow clone: HEAD and ${ref} share no known ancestor yet, deepening (fetch-depth: 0 on actions/checkout avoids this)."

  for step in 50 200 1000; do
    if [ -n "$refspec" ]; then
      fetch_with --deepen="$step" origin "$refspec" "$head_sha" || fetch_with --deepen="$step" origin "$refspec" || true
    else
      fetch_with --deepen="$step" origin "$head_sha" || true
    fi
    if have_merge_base; then break; fi
  done

  if ! have_merge_base && [ "$(git rev-parse --is-shallow-repository)" = true ]; then
    echo "Still no common ancestor after 1000 commits; fetching the full history."
    if [ -n "$refspec" ]; then
      fetch_with --unshallow origin "$refspec" "$head_sha" || fetch_with --unshallow origin || true
    else
      fetch_with --unshallow origin "$head_sha" || fetch_with --unshallow origin || true
    fi
  fi
fi

merge_base="$(git merge-base HEAD "$ref" 2> /dev/null)" ||
  fail "HEAD and '${base_input}' share no history in this checkout, so there is no diff to review. Set fetch-depth: 0 on actions/checkout, or check that the base is an ancestor of this branch."

echo "Reviewing ${merge_base:0:7}...${head_sha:0:7} (base ${ref})."
emit base "$ref"
emit merge-base "$merge_base"
