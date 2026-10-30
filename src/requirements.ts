import type { Catalog } from './catalog.js';

export type Platform = 'win32' | 'darwin' | 'linux';
export interface Requirements { platforms?: Platform[]; tools?: string[]; notes?: string[] }
export interface RequirementInfo {
  summary: string;
  platformStatus: 'unknown' | 'unspecified' | 'listed' | 'mismatch';
  notice: string;
  notes: string[];
}

const labels: Record<string, string> = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };
const joinAnd = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;

export function requirementInfo(requirements?: Requirements | null, platform: string = process.platform): RequirementInfo {
  if (!requirements) return { summary: 'Requisitos não catalogados', platformStatus: 'unknown', notice: 'Ausência de requisitos catalogados não implica compatibilidade; execução não verificada.', notes: [] };
  const systems = requirements.platforms?.map(p => labels[p]!);
  const parts = [...(systems?.length ? [systems.join(' ou ')] : []), ...(requirements.tools ?? [])];
  const platformStatus = !requirements.platforms ? 'unspecified' : requirements.platforms.some(p => p === platform) ? 'listed' : 'mismatch';
  return {
    summary: parts.length ? `Requer ${joinAnd(parts)}` : 'Requisitos adicionais declarados',
    platformStatus,
    notice: platformStatus === 'mismatch'
      ? `Sistema atual: ${labels[platform] ?? platform}; execução requer ${systems!.join(' ou ')}. Instalação permitida; ferramentas não verificadas.`
      : platformStatus === 'listed'
        ? 'Sistema operacional contemplado pela declaração; ferramentas não verificadas.'
        : 'Plataformas não catalogadas; ferramentas não verificadas.',
    notes: requirements.notes ?? [],
  };
}

export function bundleRequirementHint(catalog: Catalog, bundle: string, platform: string = process.platform): string {
  const skills = catalog.skills.filter(s => s.bundles.includes(bundle));
  const declared = skills.filter(s => s.requirements);
  const restricted = skills.filter(s => requirementInfo(s.requirements, platform).platformStatus === 'mismatch');
  const systems = [...new Set(restricted.flatMap(s => s.requirements?.platforms ?? []))].map(p => labels[p]);
  return [declared.length ? `${declared.length} com requisitos declarados` : 'Requisitos não catalogados',
    restricted.length ? `${restricted.length} com restrição de execução (${systems.join('/')})` : '',
    skills.length > declared.length ? `${skills.length - declared.length} não catalogadas` : '',
  ].filter(Boolean).join(' · ');
}
