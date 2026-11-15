import type { Change, Problem, State } from './engine.js';

// The engine speaks English (its values are the --json contract). The screen is pt-BR: translate only here.

export const stateLabel: Record<State, string> = {
  linked: 'vinculada', missing: 'faltando', copy: 'cópia', stale: 'sobrando', conflict: 'conflito',
  absent: 'fora do clone', unsupported: 'sem clone', extra: 'extra', local: 'local',
};

export const stateHint: Record<State, string> = {
  linked: 'os links apontam para o clone',
  missing: 'o skills.yaml pede a skill, mas falta um link',
  copy: 'cópia instalada por npx skills ou pela CLI antiga; a próxima ação troca por link',
  stale: 'link que o skills.yaml não pede mais, ou cuja skill saiu do clone',
  conflict: 'o projeto tem uma pasta própria com este nome; só muda com --force',
  absent: 'o skills.yaml pede a skill, mas o clone não tem',
  unsupported: 'skill de outro repositório que ainda não foi clonado',
  extra: 'vinculada, mas fora do skills.yaml',
  local: 'pasta ou link criado à mão no projeto',
};

const problems: Record<string, (name: string) => string> = {
  not_in_clone: name => `${name}: o clone não tem esta skill.`,
  foreign_link: name => `${name}: o projeto tem um link com este nome que a ferramenta não criou.`,
  is_file: name => `${name}: existe um arquivo com este nome na pasta de skills.`,
  not_a_link: name => `${name}: o caminho não é um link.`,
  lock_tracked: () => 'O skills-lock.json ficou vazio, mas o Git rastreia o arquivo. Apague com git rm.',
  bad_bundle_name: name => `${name}: um nome de bundle tem letras minúsculas, dígitos, "-" e "_".`,
  bundle_exists: name => `${name}: este bundle já existe.`,
  no_bundle: name => `${name}: este bundle não existe.`,
  no_skill: name => `${name}: o clone não tem uma pasta de skill com este nome.`,
  no_skills_line: name => `${name}: o bundle não tem a linha "skills:".`,
  core_stays: () => 'core: este bundle está em todos os projetos e não pode ser apagado.',
  not_plain_folder: name => `${name}: a pasta da skill não é uma pasta comum do clone.`,
};

/** The pt-BR text of an engine problem. An unknown code shows the engine text, so nothing is hidden. */
export function problemText(problem: Problem): string {
  return problems[problem.code]?.(problem.name) ?? `${problem.name}: ${problem.text}`;
}

export function changeText(change: Change): string {
  switch (change.action) {
    case 'create': return `bundle novo: ${change.bundle}`;
    case 'assign': return `${change.skill} → ${change.bundle}`;
    case 'unassign': return `${change.skill} fora de ${change.bundle}`;
    case 'delete_bundle': return `bundle apagado: ${change.bundle}`;
    case 'delete_skill': return `skill apagada: ${change.skill}`;
  }
}
