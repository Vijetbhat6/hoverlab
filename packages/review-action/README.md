# Hoverlab design review (GitHub Action)

Reviews the components a pull request changes for the design defects that
survive code review because they are invisible to the person writing them:
missing accessible names, physical spacing that breaks in RTL, motion that
ignores `prefers-reduced-motion`, layout that overflows. It is
[`hoverlab review`](../cli/README.md) wrapped for CI:

- **Annotations** on the changed lines in "Files changed".
- A **step summary** with the full report.
- **One sticky comment** on the pull request, edited in place on every push.
- A **failing check** when there is a violation (advisories never fail a run).

It reviews the diff, not the codebase: findings on lines the pull request did
not touch are not reported, so the first thing a team sees is not a backlog.

## Use it

```yaml
# .github/workflows/hoverlab-review.yml
name: Hoverlab design review

on:
  pull_request:
    paths: ['**/*.tsx', '**/*.jsx', '**/*.css']

permissions:
  contents: read
  pull-requests: write # to post the comment; drop it and set comment: 'false' to only annotate

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # the review needs the merge base; see "History" below

      # Pin a tag or commit SHA rather than `main` once one exists.
      - uses: Vijetbhat6/hoverlab/packages/review-action@main # inside this repo: ./packages/review-action
```

Requirements: a runner with `bash`, `git` and Node 18.17 or newer (every
GitHub-hosted runner qualifies). Nothing is installed besides the `hoverlab`
package that `npx` fetches, and nothing is uploaded: the review reads your
files on the runner.

## Inputs

| Input | Default | What it does |
| --- | --- | --- |
| `base` | the PR's base branch (`github.base_ref`) | Branch or full commit SHA to review against. On a `push` event with no value, the push's `before` commit is used. Ignored when `paths` is set. |
| `paths` | _(empty)_ | Space-separated files or directories to review **in full** instead of the diff. Paths containing spaces are not supported. |
| `github-token` | `${{ github.token }}` | Posts the comment, and fetches history if the checkout did not keep its credentials. Needs `pull-requests: write` to comment. |
| `comment` | `true` | `false` annotates and writes the step summary only. |
| `comment-on-clean` | `true` | What to do when the review finds nothing at all. See below. |
| `fail-on` | `violation` | `violation` fails the job on any violation, or when the reviewer could not run. `never` never fails it. |
| `cli` | `npx --yes hoverlab@latest` | Command that runs the CLI, split on whitespace. Relative paths resolve from `working-directory`. Pin a version (`npx --yes hoverlab@<version>`) for reproducible checks: `@latest` means a new rule can turn a green branch red without a change from you. |
| `args` | _(empty)_ | Extra flags for `hoverlab review`, for example `--all-lines --violations-only`. |
| `working-directory` | `.` | Where to run. Annotation paths are repo-relative in diff mode; with `paths` and a non-default `working-directory` they are relative to that directory and may not land on the file. |

| Output | Meaning |
| --- | --- |
| `violations`, `advisories` | Counts. |
| `body-file` | Path to the Markdown report on the runner. Empty if the reviewer did not run. |
| `comment-action` | `created`, `updated`, `unchanged`, `skipped`, `forbidden`, `rate-limited` or `error`. |
| `comment-url` | The comment's URL when one was written or found. |

## What the comment looks like

```markdown
<!-- hoverlab-review -->
## Hoverlab design review

**2 violations** and 2 advisories in what this branch changes against origin/main (2 files read). Violations fail the check.

### Violations

- `src/Bad.tsx:4` · **svg-hidden-or-labelled** (WCAG 1.1.1) — <svg> neither aria-hidden nor named: `<svg width="16" height="16" />`
- `src/Bad.tsx:4` · **control-has-name** (WCAG 4.1.2) — <button> with an icon and no accessible name: `<button>`

<details>
<summary>2 advisories — questions the rules cannot close from source</summary>

- `src/Bad.tsx:3` · **physical-spacing-utility** (WCAG 1.3.2) — pl-4 is physical — it stays on the left in Arabic, Hebrew, Farsi and Urdu
  - Fix: Use ps-4, which resolves to the reading direction. No behaviour changes left-to-right.

</details>

<sub>Checked against 18 rules over 10 WCAG 2.2 Level AA criteria decidable from source. … This is evidence, not a claim of conformance.</sub>
```

The first line is an HTML comment, invisible when rendered. It is how the
action finds its own comment again. The CLI produces the body; this action
only posts it.

## The sticky comment, exactly

The comment is found by its first line (`<!-- hoverlab-review -->`) **and**
its author, then edited in place. If the new body is identical to what is
already there (ignoring line endings and trailing whitespace) nothing is
written, so a re-run that finds the same things sends no notification.

| Findings | Existing comment | `comment-on-clean` | Result |
| --- | --- | --- | --- |
| any | none | - | created |
| any | different | - | updated |
| any | identical | - | unchanged (no write) |
| none | none | `true` or `false` | **nothing posted** |
| none | none | `always` | created ("no findings") |
| none | different | `true` or `always` | updated to "no findings" |
| none | different | `false` | untouched (it may still list problems that are fixed) |
| none | identical | any | unchanged |

"Findings" counts advisories too: an advisory-only review still gets a
comment, because advisories are the questions a reviewer would want asked.

`true` is the default because it avoids both bad outcomes: a PR that was never
flagged does not grow a comment that says nothing, and a PR whose earlier
comment listed violations does not keep listing them after they are fixed. Use
`false` only if you would rather never edit a comment than risk a stale one.

**Whose comment is it?** A comment is edited only if its first line is the
marker and its author is a bot (`github-actions[bot]` for the default token,
`<app>[bot]` for a GitHub App token) or the account a personal access token
belongs to. A person who replies with a quote of the bot's comment can start
their message with the marker; matching on the marker alone would let a
write-access token overwrite their words. The trade-off is that a different
bot whose comment happens to begin with this exact marker would be adopted.
Pinning the login to `github-actions[bot]` instead would make App and PAT
tokens post a duplicate on every push, which is the likelier failure.

One sticky comment exists per pull request. Running the action twice in one
workflow (say, once per package) makes the two runs overwrite each other; run
it once with several `paths`, or set `comment: 'false'` on all but one.

A comment over GitHub's 65,536-character limit is truncated at a line
boundary, any open code fence or `<details>` is closed, and a note points at
the step summary, which has the whole report.

## History: `fetch-depth: 0`

`hoverlab review --base` measures from the **merge base**, not the tip of the
base branch, so commits other people landed on `main` are not reported as
yours. That needs the commits between the branch and the base, and
`actions/checkout` fetches one commit by default. On a `pull_request` run that
one commit is GitHub's synthetic merge commit with its parents cut off, so git
cannot find where the branches meet.

Set `fetch-depth: 0` on the checkout. The action also tolerates a shallow
checkout: it fetches the base branch, and if the two histories still do not
meet it deepens (50, 200, then 1000 commits, asking for both the base and
`HEAD`) and finally unshallows. That works, but it is extra network traffic on
every run and it needs the checkout to have kept its credentials
(`persist-credentials: true`, the default) or `github-token` to be able to
read the repo. If the history still cannot be found, the job fails with a
message that says so rather than reporting a clean review.

## Pull requests from forks

On a `pull_request` event from a fork, GitHub gives the workflow a read-only
`GITHUB_TOKEN`, so the comment cannot be written. The action does not fail:
the write is refused with a 403, the action prints a warning, and the review is
still delivered as annotations, the step summary and the job's status. The
same happens when your workflow forgot `pull-requests: write` (the warning says
so), and when GitHub's API rate limit is hit (the warning says when it resets).
Any other API failure (a rejected token, a 404, a 5xx) is also reported as a
warning. A comment never replaces the review's own verdict.

To comment on fork PRs too you need a second, trusted workflow (`workflow_run`)
that reads what the first produced. `post-comment.mjs` supports it
(`--body-file`, `--pr`, `--repo`), but take the PR number from the trusted
`workflow_run` payload, never from the artifact, and treat the artifact's body
as untrusted text. This action does not set that up for you.

## Versus the one-liner

```yaml
- run: npx --yes hoverlab review --base "origin/$BASE" --format github
  env:
    BASE: ${{ github.base_ref }}
```

That gives you annotations and a failing exit code, and it is a fine place to
start. This action adds what it does not do:

- makes the merge-base history exist on a shallow checkout (the one-liner needs
  `fetch-depth: 0` and an `origin/<base>` ref that a default checkout does not
  have), and fetches the base branch itself;
- writes the report to the step summary, where the annotations' 10-per-type,
  50-per-job cap cannot hide findings;
- posts and maintains the sticky comment, including the fork, permission,
  rate-limit and size cases above;
- keeps a branch name from reaching a shell (see below), and reports "the
  reviewer did not run" as a failure instead of a silent green check.

## Security

- **Do not use `pull_request_target` with a checkout of the pull request's
  code.** `pull_request_target` runs with the base repo's secrets and a
  write-scoped token; checking out the PR head and then running anything from
  that tree (`npx` reads the PR's `.npmrc` and can be pointed at a hostile
  registry; a `cli:` path or a local `uses: ./...` executes PR files) hands an
  attacker your secrets. This action is designed for `pull_request`, where a
  fork's PR has no secrets and a read-only token. It will run under
  `pull_request_target` and will comment, but the default checkout there is the
  _base_ branch, so there is no diff to review.
- Every workflow expression is passed through `env:`, never interpolated into a
  `run:` script. A branch name may legally contain `$(...)`, `;` and `%0A`, and
  a script that includes `${{ github.head_ref }}` would execute it. Keep to
  the same rule in your own workflow around this action.
- The token is sent only to the GitHub API (`GITHUB_API_URL`, so Enterprise
  Server works) and, as a fallback, to your repo's git host when a fetch is
  refused. `post-comment.mjs` refuses to post a body that does not start with
  the marker.

## Developing it

```sh
node --test packages/review-action/test/post-comment.test.mjs
```

`prepare.sh` (history) and `review.sh` (the two runs and the outputs) are plain
bash and can be run by hand with the environment variables named in their
headers.
