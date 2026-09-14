/**
 * Programmatic entry point, for scripts that want the catalog without
 * shelling out to the CLI.
 *
 *   import { searchAll, addArtifact } from 'hoverlab'
 *
 * The editor extension in `packages/vscode` is the main consumer and the
 * reason the licence-key functions are re-exported below. It could have
 * kept the key in the editor's own secret storage, and that would have been
 * two stores for one credential: a developer who ran `hoverlab login` in
 * the terminal would still be told to sign in by the sidebar, and revoking
 * the key would leave a copy behind. One key, one file, whichever surface
 * put it there.
 */

export {
  searchEffects,
  searchLevel,
  searchAll,
  getEffect,
  getArtifact,
  getTemplate,
  FRAMEWORKS,
  LEVELS,
  DEFAULT_ORIGIN,
  ApiError,
} from './api.mjs'
export { addArtifact, writeEffectFiles, safeRelativePath, WriteError } from './write.mjs'
export { initTemplate } from './scaffold.mjs'
export {
  detectFramework,
  detectArtifactRoot,
  detectOutputDir,
  detectReactSupport,
  findProjectRoot,
  missingDeps,
} from './detect.mjs'
export { startMcpServer, TOOLS as MCP_TOOLS } from './mcp.mjs'
export {
  CONFIG_FILE,
  clearKey,
  keySource,
  looksLikeKey,
  maskKey,
  resolveKey,
  saveKey,
} from './auth.mjs'
export { listKits, getDna, getRevisions, listSkills, getSkill, SITE_URL } from './api.mjs'
export {
  REVIEWABLE,
  RULES,
  STANDARD,
  UNCHECKED,
  coverage,
  fixSource,
  reviewFiles,
  reviewSource,
  violations,
} from './review/index.mjs'
