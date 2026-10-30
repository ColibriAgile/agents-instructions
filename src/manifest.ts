import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseDocument } from 'yaml';
import type { Document } from 'yaml';
import { isMissing, record, skillName, stringList } from './catalog.js';
import { atomicWrite } from './storage.js';

export interface Manifest {
  document: Document;
  revision: string | null;
  bundles: string[];
  skills: string[];
  sources: { repo: string; skills: string[] }[];
}

export async function readManifest(path: string): Promise<Manifest> {
  let text: string | null = null;
  try { text = await readFile(path, 'utf8'); }
  catch (error) { if (!isMissing(error)) throw error; }
  const document = parseDocument(text ?? '', { uniqueKeys: true });
  if (document.errors.length) throw new Error(`Invalid manifest ${path}: ${document.errors[0]!.message}`);
  const data: unknown = document.toJS({ maxAliasCount: 50 }) ?? {};
  if (!record(data)) throw new Error(`Manifest ${path} must be a YAML mapping`);
  const bundles = data.bundles === undefined ? [] : stringList(data.bundles, 'bundles');
  const skills = data.skills === undefined ? [] : stringList(data.skills, 'skills');
  skills.forEach(skillName);
  if (data.sources !== undefined && !Array.isArray(data.sources)) throw new Error('sources must be a list');
  const sources = ((data.sources ?? []) as unknown[]).map(src => {
    if (!record(src) || typeof src.repo !== 'string' || !src.repo.trim() || src.repo.startsWith('-')) throw new Error('Each source requires a valid repo');
    const names = stringList(src.skills, 'source skills');
    names.forEach(skillName);
    return { repo: src.repo, skills: names };
  });
  const revision = text === null ? null : createHash('sha256').update(text).digest('hex');
  return { document, revision, bundles, skills, sources };
}

export async function saveManifest(path: string, manifest: Manifest, bundles: string[], skills: string[]): Promise<void> {
  if ((await readManifest(path)).revision !== manifest.revision) {
    throw new Error(`Manifest changed since preview: ${path}. Prepare a new preview before applying changes.`);
  }
  const document = manifest.document.clone();
  document.set('bundles', [...new Set(bundles.length ? ['core', ...bundles] : [])]);
  if (skills.length || document.has('skills')) document.set('skills', [...new Set(skills)]);
  await atomicWrite(path, document.toString());
}
