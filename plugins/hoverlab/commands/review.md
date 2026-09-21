---
description: Review what this branch changes for accessibility, right-to-left, motion and layout defects, and explain each finding
argument-hint: "[base branch]"
allowed-tools: Bash(git symbolic-ref *) Bash(git rev-parse *) Bash(npx -y hoverlab review *) Read
disable-model-invocation: true
---

Run `hoverlab review` on the changes this branch proposes, then explain what it found.

## 1. Pick the base branch

- If the user gave one, use it: `$ARGUMENTS`
- Otherwise ask git for the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` (it prints `origin/main`; use the part after `origin/`).
- If that fails, try `git rev-parse --verify main`, then `master`.
- If none of them exists, say so and run `npx -y hoverlab review` with no `--base`, which reviews the uncommitted changes instead.

## 2. Run it

```bash
npx -y hoverlab review --base <base>
```

The review runs on this machine and uploads nothing. It measures from the merge base, so commits other people landed on the base branch are not reported as this branch's.

A non-zero exit code means it found violations. That is a result, not a failed command.

## 3. Explain the findings

Two kinds, and keep them apart:

- **Violations** are what the rule is confident is broken.
- **Advisories** are questions the rule cannot settle from source. Put them to the user as questions; do not present them as defects.

For each finding give the file and line, the rule, why it matters to a real user (a screen-reader user, an Arabic or Hebrew reader, someone with reduced motion on, a phone), and the fix. Group repeats of the same rule instead of listing every one.

## Rules

- Do not edit files unless the user asks. `--fix` applies only the physical-to-logical spacing rewrite and nothing else; run it only after the user agrees.
- The review reports evidence about the source. It cannot see rendered contrast or focus order. Never call the result a conformance claim, and never say the code is "accessible" because the report was clean.
- If nothing was found, say that and stop.
