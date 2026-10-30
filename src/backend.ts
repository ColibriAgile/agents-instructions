import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { record } from './catalog.js';
import type { Scope } from './agents.js';
import type { Interrupted } from './storage.js';

// Resolve only the documented executable, never import the backend's internal modules.
const require = createRequire(import.meta.url);
const executable = join(dirname(require.resolve('skills/package.json')), 'bin', 'cli.mjs');

export async function backend(args: string[], scope: Scope, interruption?: AbortSignal): Promise<string> {
  interruption?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [executable, ...args], {
      cwd: scope.cwd, shell: false, windowsHide: true,
      env: { ...process.env, DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Settle only after the child exits, so a rollback never races its writes.
    const forward = () => { child.kill((interruption!.reason as Interrupted).signal); };
    interruption?.addEventListener('abort', forward, { once: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', error => { interruption?.removeEventListener('abort', forward); reject(error); });
    child.on('close', (code, signal) => {
      interruption?.removeEventListener('abort', forward);
      if (interruption?.aborted) reject(interruption.reason);
      else if (code !== 0) reject(new Error(`skills backend failed (${signal ?? code}): ${[stderr.slice(-3000), stdout.slice(-3000)].filter(Boolean).join('\n')}`));
      else resolve(stdout);
    });
  });
}

export function jsonArray(text: string): Record<string, unknown>[] {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new Error('Invalid JSON from skills backend'); }
  if (!Array.isArray(value) || value.some(v => !record(v))) throw new Error('Invalid result from skills backend');
  return value as Record<string, unknown>[];
}

export async function listInstalled(scope: Scope): Promise<Record<string, unknown>[]> {
  return jsonArray(await backend(['list', '--json', ...(scope.global ? ['--global'] : [])], scope));
}
