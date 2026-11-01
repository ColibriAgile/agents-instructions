// Executar: node --test SKILLS/auditar-skills/scripts/auditar-skills.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply, audit, availableSkills, parseArgs } from './auditar-skills.mjs'

const NOW = new Date('2026-11-30T12:00:00.000Z')

function fixture() {
  const base = mkdtempSync(join(tmpdir(), 'auditar-skills-'))
  const home = join(base, 'home')
  const repo = join(base, 'repo')
  const other = join(base, 'other')
  for (const dir of [repo, other, join(repo, '.claude', 'skills', 'proj-skill')]) mkdirSync(dir, { recursive: true })
  for (const name of ['user-used', 'user-idle']) mkdirSync(join(home, '.claude', 'skills', name), { recursive: true })

  mkdirSync(join(home, '.claude', 'plugins', 'synced', 'bucket', 'org-plugin', '.claude-plugin'), { recursive: true })
  writeFileSync(join(home, '.claude', 'plugins', 'synced', 'bucket', 'org-plugin', '.claude-plugin', 'plugin.json'), '{"name":"org-plugin"}')
  writeFileSync(
    join(home, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ version: 2, plugins: { 'slack@dir': [{}], 'tools@dir': [{}] } }),
  )

  const names = [
    'user-used', 'user-idle', 'proj-skill', 'init',
    'anthropic-skills:pdf', 'anthropic-skills:docx',
    'slack:standup', 'slack:search', 'tools:lint', 'org-plugin:thing',
  ]
  const at = iso => ({ timestamp: iso, cwd: repo, sessionId: 's1' })
  const lines = [
    { type: 'attachment', ...at('2026-11-20T10:00:00.000Z'), attachment: { type: 'skill_listing', isInitial: true, names } },
    { type: 'attachment', ...at('2026-11-20T11:00:00.000Z'), attachment: { type: 'skill_listing', isInitial: false, names: ['anthropic-skills:late'] } },
    { type: 'assistant', ...at('2026-11-21T10:00:00.000Z'), message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'user-used' } }] } },
    { type: 'assistant', ...at('2026-11-21T10:05:00.000Z'), message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'tools:lint' } }] } },
    { type: 'user', ...at('2026-11-22T10:00:00.000Z'), message: { content: '<command-message>pdf</command-message>\n<command-name>/anthropic-skills:pdf</command-name>' } },
    // Fora da janela de 30 dias: não conta.
    { type: 'assistant', ...at('2026-09-01T10:00:00.000Z'), message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'user-idle' } }] } },
    // Subdiretório do repositório conta.
    { type: 'assistant', timestamp: '2026-11-23T10:00:00.000Z', cwd: join(repo, 'src'), sessionId: 's2', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'user-used' } }] } },
  ]
  const otherRepo = [
    { type: 'assistant', timestamp: '2026-11-21T10:00:00.000Z', cwd: other, sessionId: 's9', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'user-idle' } }] } },
  ]
  const project = join(home, '.claude', 'projects', 'repo')
  mkdirSync(project, { recursive: true })
  writeFileSync(join(project, 's1.jsonl'), lines.map(l => JSON.stringify(l)).join('\n') + '\nnot json\n')
  writeFileSync(join(project, 's9.jsonl'), otherRepo.map(l => JSON.stringify(l)).join('\n'))

  return { home, repo }
}

test('conta usos do repositório na janela e classifica cada skill', () => {
  const { home, repo } = fixture()
  const result = audit({ repo, home, days: 30, now: NOW })
  const byName = Object.fromEntries(result.skills.map(s => [s.name, s]))

  assert.equal(byName['user-used'].uses, 2)
  assert.equal(byName['user-idle'].uses, 0, 'uso fora da janela e de outro repositório não conta')
  assert.equal(byName['anthropic-skills:pdf'].uses, 1, '/nome digitado conta')
  assert.equal(byName['user-used'].kind, 'user')
  assert.equal(byName['proj-skill'].kind, 'project')
  assert.equal(byName['init'].kind, 'builtin')
  assert.equal(byName['anthropic-skills:docx'].kind, 'synced')
  assert.equal(byName['slack:standup'].plugin, 'slack@dir')
  assert.equal(byName['org-plugin:thing'].plugin, 'org-plugin@synced')
  assert.ok(byName['anthropic-skills:late'], 'acréscimo da mesma sessão entra na lista')
})

test('sugere overrides só para skills do usuário e sincronizadas sem uso', () => {
  const { home, repo } = fixture()
  const { suggestions, skipped } = audit({ repo, home, days: 30, now: NOW })

  assert.deepEqual(
    suggestions.skillOverrides.map(s => s.name).sort(),
    ['anthropic-skills:docx', 'anthropic-skills:late', 'user-idle'],
  )
  assert.deepEqual(suggestions.disablePlugins.map(p => p.key).sort(), ['org-plugin@synced', 'slack@dir'])
  assert.deepEqual(skipped.project, ['proj-skill'])
  assert.deepEqual(skipped.builtin, ['init'])
})

test('--max-uses amplia as sugestões', () => {
  const { home, repo } = fixture()
  const { suggestions } = audit({ repo, home, days: 30, maxUses: 1, now: NOW })

  assert.ok(suggestions.skillOverrides.some(s => s.name === 'anthropic-skills:pdf'))
  assert.ok(suggestions.disablePlugins.some(p => p.key === 'tools@dir'))
})

test('avisa quando o histórico é mais curto que a janela', () => {
  const { home, repo } = fixture()
  const { warnings, history } = audit({ repo, home, days: 90, now: NOW })

  assert.equal(history.coveredDays, 90, 'o registro de setembro cobre a janela inteira')
  const short = audit({ repo, home, days: 30, now: new Date('2026-11-25T12:00:00.000Z') })
  assert.equal(short.warnings.length, 0)
  const recent = audit({ repo: join(repo), home, days: 120, now: NOW })
  assert.match(recent.warnings[0], /cobre só \d+ de 120 dias/)
  assert.equal(warnings.length, 0)
})

test('avisa quando não há transcripts do repositório', () => {
  const { home } = fixture()
  const empty = mkdtempSync(join(tmpdir(), 'auditar-skills-empty-'))
  const result = audit({ repo: empty, home, now: NOW })

  assert.equal(result.skills.length, 0)
  assert.match(result.warnings[0], /Nenhum transcript/)
})

test('apply mescla no settings.local.json sem perder o que já existe', () => {
  const { repo } = fixture()
  const file = join(repo, '.claude', 'settings.local.json')
  writeFileSync(file, JSON.stringify({ permissions: { allow: ['Bash(ls)'] }, skillOverrides: { keep: 'off' } }))

  apply({ repo, overrides: ['user-idle'], disablePlugins: ['slack@dir'] })
  const saved = JSON.parse(readFileSync(file, 'utf8'))

  assert.deepEqual(saved.permissions, { allow: ['Bash(ls)'] })
  assert.deepEqual(saved.skillOverrides, { keep: 'off', 'user-idle': 'user-invocable-only' })
  assert.deepEqual(saved.enabledPlugins, { 'slack@dir': false })
})

test('apply recusa settings.local.json inválido', () => {
  const { repo } = fixture()
  writeFileSync(join(repo, '.claude', 'settings.local.json'), '{ broken')

  assert.throws(() => apply({ repo, overrides: ['x'] }), /não é um JSON válido/)
})

test('availableSkills usa a listagem inicial mais recente', () => {
  const names = availableSkills([
    { sessionId: 'a', timestamp: '2026-11-01T00:00:00Z', isInitial: true, names: ['old'] },
    { sessionId: 'b', timestamp: '2026-11-02T00:00:00Z', isInitial: true, names: ['new'] },
    { sessionId: 'a', timestamp: '2026-11-03T00:00:00Z', isInitial: false, names: ['old-delta'] },
  ])

  assert.deepEqual(names, ['new'])
})

test('parseArgs valida números e flags', () => {
  assert.deepEqual(parseArgs(['--days', '7', '--override', 'a', '--override', 'b']).overrides, ['a', 'b'])
  assert.throws(() => parseArgs(['--days', 'x']), /--days/)
  assert.throws(() => parseArgs(['--nope']), /desconhecido/)
})

test('roda e imprime o JSON quando chamado por uma junction/symlink', () => {
  const base = mkdtempSync(join(tmpdir(), 'auditar-skills-link-'))
  const link = join(base, 'scripts-link')
  symlinkSync(dirname(fileURLToPath(import.meta.url)), link, 'junction')
  const empty = join(base, 'empty')
  mkdirSync(empty)

  const run = spawnSync(process.execPath, [join(link, 'auditar-skills.mjs'), '--repo', empty, '--home', empty], {
    encoding: 'utf8',
  })

  assert.equal(run.status, 0, run.stderr)
  assert.ok(run.stdout.trim(), 'saída vazia: main() não rodou')
  assert.deepEqual(JSON.parse(run.stdout).warnings, ['Nenhum transcript encontrado para este repositório.'])
})
