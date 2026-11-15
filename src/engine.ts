import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { packageRoot } from './catalog.js';

// The engine is the same file that the Herdr mod `skill-bundles` runs (ADR-002). It has every rule: the state of
// a project, the links, the clones of other repositories and the curation of the catalog. Never edit the copy
// here: see scripts/engine-sync.mjs. Its values are the contract of --json and stay in English.
export const enginePath = join(packageRoot, 'engine', 'link-skills.mjs');

/** Where the clones of other repositories (`sources:` of skills.yaml) are kept. The same folder as the mod. */
export const sourcesRoot = (): string =>
  process.env.COLIBRI_SKILLS_SOURCES?.trim() || join(homedir(), '.config', 'herdr-app', 'cache', 'skill-bundles', 'sources');

export type State = 'linked' | 'missing' | 'copy' | 'stale' | 'conflict' | 'absent' | 'unsupported' | 'extra' | 'local';
export interface Row { name: string; state: State; repo: string; from: string[]; tracked: boolean }
export interface EngineManifest { catalog: string | null; bundles: string[]; skills: string[]; sources: { repo: string; skills: string[] }[] }
export interface ProjectState {
  git: boolean; manifest: EngineManifest | null; catalogError: string | null; unknown: string[]; rows: Row[];
  /** `catalog:` of skills.yaml names another catalog than the one of the clone (or is not a catalog name). */
  catalogProblem: { code: 'catalog_invalid' | 'catalog_other'; wanted: string; have: string | null } | null;
  lockError: string | null; lockOther: number; oldGitignore: boolean; retired: number;
}
export interface Problem { code: string; name: string; text: string }
export interface Applied {
  linked: string[]; removed: string[]; converted: string[]; backedUp: string[]; deleted: string[]; retired: string[];
  errors: string[]; problems: Problem[];
}
export interface Change { action: 'create' | 'assign' | 'unassign' | 'delete_bundle' | 'delete_skill'; skill?: string; bundle?: string }
export interface Curated { changed: Change[]; errors: string[]; problems: Problem[] }
export interface Details { skills: { name: string; desc: string; bundles: string[] }[]; orphans: string[]; error: string | null }
export interface SourceClone { dir: string | null; url: string | null; exists: boolean; error?: string }

/** Runs the engine with one JSON input and returns its JSON. */
export async function engine<T>(input: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [enginePath, JSON.stringify(input)], { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) { reject(new Error(`O motor de links falhou: ${stderr.trim().slice(-2000) || `código ${code}`}`)); return; }
      try { resolve(JSON.parse(stdout) as T); }
      catch { reject(new Error('Resposta inválida do motor de links')); }
    });
  });
}
