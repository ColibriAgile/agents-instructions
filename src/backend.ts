import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { record } from './catalog.js';
import type { Scope } from './agents.js';
import { onForceExit } from './storage.js';
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
    // Windows has no signals to forward: child.kill only terminates the direct child, and git or a credential
    // helper started by it would keep running and holding the pipes. Kill the tree once, while the child is
    // still alive, so the PID cannot have been reused by an unrelated process.
    let treeKilled = false;
    const killTree = () => {
      if (treeKilled || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
      treeKilled = true;
      // The system copy, not whatever "taskkill" a restricted or hostile PATH resolves to.
      const taskkill = process.env.SystemRoot ? join(process.env.SystemRoot, 'System32', 'taskkill.exe') : 'taskkill';
      const result = spawnSync(taskkill, ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      // Without the tree kill, at least stop the direct child, as child.kill did before.
      if (result.error || result.status !== 0) child.kill();
    };
    // Settle only after the child exits, so a rollback never races its writes.
    const forward = () => {
      if (process.platform === 'win32') killTree();
      else child.kill((interruption!.reason as Interrupted).signal);
    };
    // On a second signal the whole process tree must die: git or a credential helper may still hold the pipes.
    const stopForced = onForceExit(() => {
      if (process.platform === 'win32') killTree();
      else child.kill('SIGKILL');
    });
    interruption?.addEventListener('abort', forward, { once: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', error => { interruption?.removeEventListener('abort', forward); stopForced(); reject(error); });
    child.on('close', (code, signal) => {
      interruption?.removeEventListener('abort', forward);
      stopForced();
      if (interruption?.aborted) reject(interruption.reason);
      else if (code !== 0) reject(new Error(`o backend skills falhou (${signal ?? code}): ${[stderr.slice(-3000), stdout.slice(-3000)].filter(Boolean).join('\n')}`));
      else resolve(stdout);
    });
  });
}

export function jsonArray(text: string): Record<string, unknown>[] {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new Error('JSON inválido vindo do backend skills'); }
  if (!Array.isArray(value) || value.some(v => !record(v))) throw new Error('Resultado inválido do backend skills');
  return value as Record<string, unknown>[];
}

export async function listInstalled(scope: Scope): Promise<Record<string, unknown>[]> {
  return jsonArray(await backend(['list', '--json', ...(scope.global ? ['--global'] : [])], scope));
}
