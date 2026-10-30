import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, readlink, rename, rm, lstat, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { agents } from './agents.js';
import type { Agent, Method, Scope } from './agents.js';
import { isMissing, record, skillName } from './catalog.js';

export interface Target { method: Method; hash: string }
export interface ManagedSkill { source: string; origin: 'catalog' | 'external'; targets: Partial<Record<Agent, Target>>; canonicalHash?: string }
export interface State { version: 1; preferences?: { agents: Agent[]; method: Method }; skills: Record<string, ManagedSkill> }

export function statePath(scope: Scope): string {
  return scope.global ? join(homedir(), '.colibri-agents', 'skills.json') : join(scope.cwd, '.colibri-skills.json');
}

export async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, 'wx', 0o600);
    try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

export async function loadState(scope: Scope): Promise<State> {
  const path = statePath(scope);
  let text: string;
  try { text = await readFile(path, 'utf8'); }
  catch (error) { if (isMissing(error)) return { version: 1, skills: {} }; throw error; }
  try {
    const state: unknown = JSON.parse(text);
    if (!record(state) || state.version !== 1 || !record(state.skills)) throw new Error('expected version 1 and skills mapping');
    for (const [name, value] of Object.entries(state.skills)) {
      skillName(name);
      if (!record(value) || !['catalog', 'external'].includes(String(value.origin)) || typeof value.source !== 'string' || !value.source || value.source.startsWith('-') || !record(value.targets)) throw new Error(`invalid skill ${name}`);
      if (value.canonicalHash !== undefined && (typeof value.canonicalHash !== 'string' || !/^[a-f0-9]{64}$/.test(value.canonicalHash))) throw new Error(`invalid canonical ownership ${name}`);
      for (const [agent, target] of Object.entries(value.targets)) {
        if (!Object.hasOwn(agents, agent) || !record(target) || !['copy', 'symlink'].includes(String(target.method)) || typeof target.hash !== 'string' || !/^[a-f0-9]{64}$/.test(target.hash)) throw new Error(`invalid target ${name}/${agent}`);
      }
    }
    if (state.preferences !== undefined) {
      const pref = state.preferences;
      if (!record(pref) || !Array.isArray(pref.agents) || pref.agents.some(a => typeof a !== 'string' || !Object.hasOwn(agents, a)) || !['copy', 'symlink'].includes(String(pref.method))) throw new Error('invalid preferences');
    }
    return state as unknown as State;
  } catch (error) { throw new Error(`Invalid Colibri state ${path}: ${(error as Error).message}`); }
}

export async function saveState(scope: Scope, state: State): Promise<void> {
  await atomicWrite(statePath(scope), `${JSON.stringify(state, null, 2)}\n`);
}

const signalCodes = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 } as const;
export type Interruption = keyof typeof signalCodes;

export class Interrupted extends Error {
  readonly signal: Interruption;
  constructor(signal: Interruption, detail = 'Run the command again to finish.') {
    super(`Operation interrupted by ${signal}. ${detail}`);
    this.signal = signal;
  }
}

export async function withScopeLock<T>(scope: Scope, action: (interruption: AbortSignal) => Promise<T>): Promise<T> {
  const path = `${statePath(scope)}.lock`;
  // Default signal termination would skip rollback and leave this lock behind; later signals must not skip them either.
  // Listening before the lock exists closes the window where a signal would orphan it.
  const interruption = new AbortController();
  const listener = (signal: Interruption) => { if (!interruption.signal.aborted) interruption.abort(new Interrupted(signal)); };
  for (const signal of Object.keys(signalCodes) as Interruption[]) process.on(signal, listener);
  let completed = false;
  try {
    await mkdir(dirname(path), { recursive: true });
    interruption.signal.throwIfAborted();
    let lock;
    try { lock = await open(path, 'wx', 0o600); }
    catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EEXIST') throw new Error(`Another Colibri operation holds ${path}. If interrupted, verify no process is running before deleting this lock.`);
      throw error;
    }
    try {
      await lock.writeFile(`pid=${process.pid}\n`);
      interruption.signal.throwIfAborted();
      const result = await action(interruption.signal);
      completed = true;
      return result;
    }
    finally { await lock.close(); await rm(path, { force: true }); }
  }
  finally {
    for (const signal of Object.keys(signalCodes) as Interruption[]) process.off(signal, listener);
    // The exit code reports what happened to the files: a signal that arrived after the last checkpoint changed nothing.
    if (interruption.signal.aborted) {
      const { signal } = interruption.signal.reason as Interrupted;
      if (completed) console.error(`Received ${signal} after all changes were applied; the operation completed.`);
      else process.exitCode = signalCodes[signal];
    }
  }
}

export async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; }
  catch (error) { if (isMissing(error)) return false; throw error; }
}

export async function directoryHash(path: string): Promise<string | null> {
  if (!await exists(path)) return null;
  const hash = createHash('sha256');
  let root: string;
  try { root = await realpath(path); }
  catch (error) { if (isMissing(error)) return null; throw error; }
  const walk = async (dir: string): Promise<void> => {
    for (const item of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = join(dir, item.name);
      const name = relative(root, file).split('\\').join('/');
      if (item.isSymbolicLink()) {
        hash.update(`link:${name}\0${await readlink(file)}\0`);
      } else if (item.isDirectory()) {
        hash.update(`dir:${name}\0`); await walk(file);
      } else if (item.isFile()) {
        hash.update(`file:${name}\0`); hash.update(await readFile(file)); hash.update('\0');
      }
    }
  };
  await walk(root);
  return hash.digest('hex');
}
