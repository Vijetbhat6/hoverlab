#!/usr/bin/env bash
#
# Run `hoverlab review` twice - once for annotations, once for the comment
# body - and turn the results into step outputs and a step summary.
#
# This script never fails the job because of what the review found. Exit
# codes are the last step's business (fail-on), so that the comment and the
# summary still get written for a branch that has violations, which is
# exactly when they matter.
#
# WHY TWO RUNS
#
# `--format` takes one value. `github` emits `::error file=...` workflow
# commands, which the runner turns into annotations on the diff; `markdown`
# emits the comment body. The second run is cheap (the package is cached by
# npx, and the review is a diff, not a codebase). The `github` output also
# doubles as the finding counter: it prints exactly one `::error` or
# `::warning` line per finding and nothing when there are none.
#
# THE CONTRACT WITH THE CLI
#
#   --format markdown  prints a complete comment body whose FIRST LINE is
#                      <!-- hoverlab-review -->, even with zero findings.
#   exit code          1 when there is any violation, else 0.
#
# A run whose markdown output does not start with the marker is treated as
# "the reviewer did not run" (a crash, an old CLI, no network), never as a
# clean bill of health.
#
# Inputs (environment): INPUT_CLI INPUT_PATHS INPUT_ARGS BASE
#   GITHUB_STEP_SUMMARY GITHUB_OUTPUT RUNNER_TEMP
# Outputs: violations advisories findings clean has-violations tool-error body-file

set -o pipefail

MARKER='<!-- hoverlab-review -->'

esc() {
  local s="$1"
  s="${s//'%'/'%25'}"
  s="${s//$'\r'/'%0D'}"
  s="${s//$'\n'/'%0A'}"
  printf '%s' "$s"
}

emit() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s=%s\n' "$1" "$2" >> "$GITHUB_OUTPUT"
  else
    printf '%s=%s\n' "$1" "$2"
  fi
}

work="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/hoverlab-review"
rm -rf "$work"
mkdir -p "$work"

annotations="$work/annotations.txt"
body="$work/body.md"

# The command and the paths are split on whitespace, without globbing: the
# workflow author wrote them, and `*` must reach the CLI as a literal.
set -f
# shellcheck disable=SC2206
cli=(${INPUT_CLI:-npx --yes hoverlab@latest})
# shellcheck disable=SC2206
paths=(${INPUT_PATHS:-})
# shellcheck disable=SC2206
extra=(${INPUT_ARGS:-})
set +f

scope=()
if [ "${#paths[@]}" -gt 0 ]; then
  scope=("${paths[@]}")
elif [ -n "${BASE:-}" ]; then
  scope=("--base=${BASE}")
fi

run_cli() {
  # $1 = format, $2 = stdout file, $3 = stderr file. Sets rc.
  "${cli[@]}" review "${scope[@]}" "${extra[@]}" --format "$1" > "$2" 2> "$3"
  rc=$?
}

# --- annotations -----------------------------------------------------------

run_cli github "$annotations" "$work/annotations.err"
rc_github=$rc

# Print (not just capture) so the runner reads the workflow commands.
cat "$annotations"
if [ -s "$work/annotations.err" ]; then cat "$work/annotations.err" >&2; fi

violations="$(grep -c '^::error file=' "$annotations" || true)"
advisories="$(grep -c '^::warning file=' "$annotations" || true)"
violations="${violations:-0}"
advisories="${advisories:-0}"

# --- the comment body ------------------------------------------------------

run_cli markdown "$body" "$work/body.err"
rc_markdown=$rc

tool_error=false
first_line="$(head -n 1 "$body" 2> /dev/null | tr -d '\r\357\273\277')"

if [ "$first_line" != "$MARKER" ]; then
  tool_error=true
  : > "$work/reason.txt"
  {
    echo "hoverlab review did not produce a report (markdown exit $rc_markdown, github exit $rc_github)."
    if [ -s "$work/body.err" ]; then
      tail -n 20 "$work/body.err"
    elif [ -s "$work/annotations.err" ]; then
      tail -n 20 "$work/annotations.err"
    else
      echo "The first line of the markdown output was not ${MARKER}; is this hoverlab version new enough to support --format markdown?"
    fi
  } > "$work/reason.txt"
  printf '::error title=hoverlab review did not run::%s\n' "$(esc "$(cat "$work/reason.txt")")"
elif [ "$rc_markdown" -ne 0 ] && [ "$rc_markdown" -ne 1 ]; then
  tool_error=true
  printf '::error title=hoverlab review did not run::%s\n' "$(esc "hoverlab exited with status $rc_markdown")"
fi

# The exit code is the contract's word on violations; the count is a second witness.
has_violations=false
if [ "$tool_error" = false ] && { [ "$rc_markdown" -eq 1 ] || [ "$violations" -gt 0 ]; }; then
  has_violations=true
fi

findings=$((violations + advisories))
clean=false
if [ "$tool_error" = false ] && [ "$findings" -eq 0 ] && [ "$has_violations" = false ]; then
  clean=true
fi

# --- step summary ----------------------------------------------------------

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  if [ "$tool_error" = false ]; then
    # The summary is capped at 1 MiB per step; the comment is capped far lower, so this is a backstop.
    if [ "$(wc -c < "$body")" -gt 1000000 ]; then
      head -c 1000000 "$body" >> "$GITHUB_STEP_SUMMARY"
      printf '\n\n> Output truncated at 1 MB.\n' >> "$GITHUB_STEP_SUMMARY"
    else
      cat "$body" >> "$GITHUB_STEP_SUMMARY"
    fi
  else
    {
      printf '### Hoverlab review did not run\n\n```\n'
      cat "$work/reason.txt"
      printf '\n```\n'
    } >> "$GITHUB_STEP_SUMMARY"
  fi
fi

# --- outputs ---------------------------------------------------------------

if [ "$tool_error" = false ]; then
  echo "hoverlab review: ${violations} violation(s), ${advisories} advisory finding(s)."
  emit body-file "$body"
else
  emit body-file ''
fi

emit violations "$violations"
emit advisories "$advisories"
emit findings "$findings"
emit clean "$clean"
emit has-violations "$has_violations"
emit tool-error "$tool_error"

exit 0
