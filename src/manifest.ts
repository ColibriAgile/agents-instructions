import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseDocument } from 'yaml';
import type { Document } from 'yaml';
import { isMissing, record, skillName, stringList } from './catalog.js';

export interface Source { repo: string; skills: string[] }
export interface Manifest {
  document: Document;
  revision: string | null;
  bundles: string[];
  /** Skills of the catalog that are not in a bundle of the project. */
  skills: string[];
  /** Skills of other repositories. */
  sources: Source[];
}
export interface ManifestContent { bundles: string[]; skills: string[]; sources: Source[] }

export async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, 'wx', 0o600);
    try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

/** A repository of `sources:`: owner/name or a Git URL. Never an option of git (a leading "-"). */
export function repoName(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[\w.@:/~+#-]+$/.test(value) || value.startsWith('-') || value.split(/[/:]/).some(part => part === '.' || part === '..' || part.startsWith('-'))) {
    throw new Error(`Repositório inválido: ${String(value)}. Use owner/nome ou uma URL Git.`);
  }
}

export async function readManifest(path: string): Promise<Manifest> {
  let text: string | null = null;
  try { text = await readFile(path, 'utf8'); }
  catch (error) { if (!isMissing(error)) throw error; }
  const document = parseDocument(text ?? '', { uniqueKeys: true });
  if (document.errors.length) throw new Error(`Manifesto inválido ${path}: ${document.errors[0]!.message}`);
  const data: unknown = document.toJS({ maxAliasCount: 50 }) ?? {};
  if (!record(data)) throw new Error(`O manifesto ${path} deve ser um mapeamento YAML`);
  const bundles = data.bundles === undefined ? [] : stringList(data.bundles, 'bundles');
  const skills = data.skills === undefined ? [] : stringList(data.skills, 'skills');
  skills.forEach(skillName);
  if (data.sources !== undefined && !Array.isArray(data.sources)) throw new Error('sources deve ser uma lista');
  const sources = ((data.sources ?? []) as unknown[]).map(src => {
    if (!record(src)) throw new Error('Cada source exige um repo válido');
    repoName(src.repo);
    const names = stringList(src.skills, 'skills da source');
    names.forEach(skillName);
    return { repo: src.repo, skills: names };
  });
  const revision = text === null ? null : createHash('sha256').update(text).digest('hex');
  return { document, revision, bundles, skills, sources };
}

/**
 * The text of the manifest with new content. It keeps the comments and the unknown keys of the file.
 * Block style always: the engine and the mod read skills.yaml line by line.
 */
export function manifestText(manifest: Manifest, content: ManifestContent): string {
  const document = manifest.document.clone();
  const bundles = [...new Set(content.bundles)];
  if (bundles.length && !bundles.includes('core')) bundles.unshift('core');
  const block = (value: unknown) => { const node = document.createNode(value); (node as { flow?: boolean }).flow = false; return node; };
  document.set('bundles', block(bundles));
  const skills = [...new Set(content.skills)].sort();
  if (skills.length) document.set('skills', block(skills));
  else document.delete('skills');
  const sources = content.sources.filter(s => s.skills.length).map(s => ({ repo: s.repo, skills: [...new Set(s.skills)].sort() }));
  if (sources.length) {
    const node = block(sources) as { items?: { items?: { value?: { flow?: boolean } }[] }[] };
    for (const item of node.items ?? []) for (const pair of item.items ?? []) if (pair.value && typeof pair.value === 'object') pair.value.flow = false;
    document.set('sources', node);
  } else document.delete('sources');
  return document.toString();
}

export async function saveManifest(path: string, manifest: Manifest, text: string): Promise<void> {
  if ((await readManifest(path)).revision !== manifest.revision) {
    throw new Error(`O manifesto mudou desde a prévia: ${path}. Prepare uma nova prévia antes de aplicar as alterações.`);
  }
  await atomicWrite(path, text);
}
