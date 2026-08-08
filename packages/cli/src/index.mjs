/**
 * Programmatic entry point, for scripts that want the catalog without
 * shelling out to the CLI.
 *
 *   import { searchAll, addArtifact } from 'hoverlab'
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
