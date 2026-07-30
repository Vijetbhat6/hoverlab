/**
 * Programmatic entry point, for scripts that want the catalog without
 * shelling out to the CLI.
 *
 *   import { searchEffects, getEffect } from 'hoverlab'
 */

export { searchEffects, getEffect, FRAMEWORKS, DEFAULT_ORIGIN, ApiError } from './api.mjs'
export { writeEffectFiles, WriteError } from './write.mjs'
export { detectFramework, detectOutputDir, findProjectRoot } from './detect.mjs'
export { startMcpServer, TOOLS as MCP_TOOLS } from './mcp.mjs'
