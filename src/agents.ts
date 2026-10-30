import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const agents = {
  'claude-code': { label: 'Claude Code', local: '.claude/skills', global: () => join(process.env.CLAUDE_CONFIG_DIR?.trim() || join(homedir(), '.claude'), 'skills') },
  codex: { label: 'Codex', local: '.agents/skills', global: () => join(homedir(), '.agents/skills') },
  cursor: { label: 'Cursor', local: '.agents/skills', global: () => join(homedir(), '.agents/skills') },
  'github-copilot': { label: 'GitHub Copilot', local: '.agents/skills', global: () => join(homedir(), '.agents/skills') },
  opencode: { label: 'OpenCode', local: '.agents/skills', global: () => join(homedir(), '.agents/skills') },
  windsurf: { label: 'Windsurf', local: '.windsurf/skills', global: () => join(homedir(), '.codeium/windsurf/skills') },
} as const;

export type Agent = keyof typeof agents;
export type Method = 'copy' | 'symlink';
export interface Scope { cwd: string; global: boolean }

export function validateAgents(values: string[]): Agent[] {
  if (!values.length) throw new Error('Select at least one agent (--agent)');
  for (const value of values) if (!Object.hasOwn(agents, value)) throw new Error(`Unsupported agent: ${value}. Supported: ${Object.keys(agents).join(', ')}`);
  return [...new Set(values)] as Agent[];
}

export function targetPath(scope: Scope, agent: Agent, name: string): string {
  return resolve(scope.cwd, scope.global ? agents[agent].global() : agents[agent].local, name);
}

export function canonicalPath(scope: Scope, name: string): string {
  return join(scope.global ? homedir() : scope.cwd, '.agents', 'skills', name);
}
