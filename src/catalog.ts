import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import type { Manifest } from './manifest.js';
import type { Requirements, Platform } from './requirements.js';

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export interface Skill { name: string; description: string; path: string; bundles: string[]; requirements: Requirements | null }
export interface Bundle { description: string; skills: string[] }
export interface Catalog { root: string; source: string; repo: string; skills: Skill[]; bundles: Record<string, Bundle> }
export interface Selection { name: string; source: string; origin: 'catalog' | 'external'; requirements?: Requirements | null }

export function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function skillName(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(value)) throw new Error(`Invalid skill name: ${String(value)}`);
}

export function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) throw new Error(`${label} must be a list of nonempty strings`);
  return [...new Set(value as string[])];
}

export function yamlObject(text: string, label: string): Record<string, unknown> {
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`Invalid ${label}: ${doc.errors[0]!.message}`);
  const data: unknown = doc.toJS({ maxAliasCount: 50 });
  if (!record(data)) throw new Error(`${label} must be a YAML mapping`);
  return data;
}

export async function loadCatalog(root = packageRoot): Promise<Catalog> {
  root = resolve(root);
  const data = yamlObject(await readFile(join(root, 'bundles.yaml'), 'utf8'), 'bundles.yaml');
  if (typeof data.repo !== 'string' || !record(data.bundles)) throw new Error('Catalog requires repo and bundles');
  const source = join(root, 'SKILLS');
  const skills: Skill[] = [];
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const path = join(source, entry.name);
    let text: string;
    try { text = await readFile(join(path, 'SKILL.md'), 'utf8'); }
    catch (error) { if (isMissing(error)) continue; throw error; }
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!frontmatter) throw new Error(`Missing frontmatter: ${path}`);
    const meta = yamlObject(frontmatter[1]!, `${entry.name}/SKILL.md`);
    skillName(meta.name);
    if (meta.name !== entry.name || typeof meta.description !== 'string') throw new Error(`Invalid metadata: ${path}`);
    skills.push({ name: meta.name, description: meta.description, path, bundles: [], requirements: null });
  }
  const bundles: Record<string, Bundle> = {};
  for (const [name, value] of Object.entries(data.bundles)) {
    skillName(name);
    if (!record(value) || typeof value.description !== 'string') throw new Error(`Invalid bundle: ${name}`);
    const names = stringList(value.skills, `Bundle ${name} skills`);
    for (const skill of names) {
      const found = skills.find(s => s.name === skill);
      if (!found) throw new Error(`Bundle ${name} references missing skill: ${skill}`);
      found.bundles.push(name);
    }
    bundles[name] = { description: value.description, skills: names };
  }
  await readRequirements(root, skills);
  return { root, source, repo: data.repo, skills: skills.sort((a, b) => a.name.localeCompare(b.name)), bundles };
}

async function readRequirements(root: string, skills: Skill[]): Promise<void> {
  let text: string;
  try { text = await readFile(join(root, 'skill-requirements.yaml'), 'utf8'); }
  catch (error) { if (isMissing(error)) return; throw error; }
  const data = yamlObject(text, 'skill requirements');
  if (data.version !== 1 || !record(data.skills) || Object.keys(data).some(k => !['version', 'skills'].includes(k))) throw new Error('Invalid skill requirements: expected version 1 and skills mapping');
  for (const [name, value] of Object.entries(data.skills)) {
    const skill = skills.find(s => s.name === name);
    if (!skill) throw new Error(`Unknown skill in requirements: ${name}`);
    if (!record(value) || !Object.keys(value).length || Object.keys(value).some(k => !['platforms', 'tools', 'notes'].includes(k))) throw new Error(`Invalid requirements for ${name}`);
    const requirements: Requirements = {};
    for (const field of ['platforms', 'tools', 'notes'] as const) {
      if (value[field] === undefined) continue;
      const entries = stringList(value[field], `requirements ${name}.${field}`);
      if (!entries.length) throw new Error(`Empty requirements ${name}.${field}`);
      if (field === 'platforms') {
        if (entries.some(p => !['win32', 'darwin', 'linux'].includes(p))) throw new Error(`Invalid platform in requirements for ${name}`);
        requirements.platforms = entries as Platform[];
      } else requirements[field] = entries;
    }
    skill.requirements = requirements;
  }
}

export function resolveSelection(catalog: Catalog, options: { bundles?: string[]; skills?: string[]; manifest?: Manifest }): Selection[] {
  const result = new Map<string, Selection>();
  const add = (name: string, source: string, origin: Selection['origin']) => {
    skillName(name);
    const existing = result.get(name);
    if (existing && (existing.source !== source || existing.origin !== origin)) throw new Error(`Ambiguous skill ${name}: multiple source intents`);
    result.set(name, { name, source, origin, requirements: origin === 'catalog' ? catalog.skills.find(s => s.name === name)?.requirements ?? null : null });
  };
  const bundles = [...(options.manifest?.bundles ?? []), ...(options.bundles ?? [])];
  if (options.manifest && bundles.length && !bundles.includes('core')) bundles.unshift('core');
  const names = [...(options.manifest?.skills ?? []), ...(options.skills ?? [])];
  for (const bundle of bundles) {
    if (!Object.hasOwn(catalog.bundles, bundle)) throw new Error(`Unknown bundle: ${bundle}`);
    names.push(...catalog.bundles[bundle]!.skills);
  }
  for (const name of names) {
    skillName(name);
    if (!catalog.skills.some(s => s.name === name)) throw new Error(`Unknown skill: ${name}`);
    add(name, catalog.source, 'catalog');
  }
  for (const src of options.manifest?.sources ?? []) {
    for (const name of src.skills) add(name, src.repo, 'external');
  }
  return [...result.values()];
}

export function isMissing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
