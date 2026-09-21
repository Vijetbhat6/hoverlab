/**
 * The two things this CLI asks a person, and the one flag that answers for them.
 *
 * Until now nothing here needed to ask. `add` wrote files and printed a
 * hint, and a hint is the right amount of ceremony for a command that only
 * creates. Two things changed that:
 *
 *   - `add` can now install the packages an artifact needs, which is a change
 *     to package.json and node_modules the user did not spell out;
 *   - `remove` deletes files.
 *
 * Both are worth one question and neither is worth two.
 *
 * THE RULE THAT KEEPS THIS SAFE FOR SCRIPTS
 *
 * A prompt is only ever shown to a person. With no TTY on stdin or stdout —
 * a pipe, a CI job, an agent's shell tool, an editor extension spawning the
 * CLI — `confirm` does not wait on input that will never come and does not
 * assume yes. It answers no, and the caller prints what it would have done.
 * The same command in a pipeline therefore behaves exactly as it did before
 * this file existed, which is the property that lets it be added at all.
 *
 * `--yes` is the way to say yes without a keyboard: `hoverlab add pricing-tiers
 * --yes` installs the packages it needs, in CI or anywhere else.
 */

import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'

import { isSafePackageSpec } from './project.mjs'

/** True when a person can be asked and can answer. */
export function isInteractive(env = process.env) {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY) && !env.CI
}

/**
 * Ask a yes/no question.
 *
 * @param {string} question
 * @param {{ yes?: boolean, defaultYes?: boolean }} [options]
 *   `yes` answers for the user (`--yes`). `defaultYes` is what a bare Enter means.
 * @returns {Promise<boolean>}
 */
export async function confirm(question, { yes = false, defaultYes = true } = {}) {
  if (yes) return true
  if (!isInteractive()) return false

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = (await rl.question(`${question} ${defaultYes ? '[Y/n]' : '[y/N]'} `)).trim().toLowerCase()
    if (answer === '') return defaultYes
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

/**
 * Run the package manager to add packages.
 *
 * Resolves with the exit code rather than throwing on failure: a failed
 * install after files have already been written is not a reason to report
 * the whole `add` as failed, only to tell the user which command to run.
 *
 * Every spec is checked against the npm name grammar first. On Windows the
 * package managers are `.cmd` shims and can only be spawned through a shell,
 * and the list comes from an API whose origin `HOVERLAB_API_URL` can move —
 * so a name is never allowed to contain anything a shell would act on.
 */
export function runPackageManager({ command, args, cwd }) {
  const specs = args.slice(1)
  const unsafe = specs.filter((spec) => !isSafePackageSpec(spec))
  if (unsafe.length) {
    return Promise.reject(new Error(`Refusing to install unexpected package name: ${unsafe.join(', ')}`))
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', () => resolve({ code: 1, error: `Could not run ${command}. Is it installed?` }))
    child.on('close', (code) => resolve({ code: code ?? 1 }))
  })
}
