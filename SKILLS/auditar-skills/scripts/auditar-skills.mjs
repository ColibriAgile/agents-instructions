#!/usr/bin/env node
// Audita o uso de skills de um repositório a partir dos transcripts do Claude Code
// (~/.claude/projects/**/*.jsonl) e sugere entradas de skillOverrides/enabledPlugins.
//
// Uso:
//   node auditar-skills.mjs [--repo <dir>] [--days 30] [--max-uses 0]
//   node auditar-skills.mjs --apply [--repo <dir>] [--override <skill>]... [--disable-plugin <nome@marketplace>]...
//
// Sem --apply é somente leitura e imprime um JSON. Com --apply grava em
// <repo>/.claude/settings.local.json, preservando o restante do arquivo.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const DAY_MS = 24 * 60 * 60 * 1000
const OVERRIDE_STATE = 'user-invocable-only'
const IS_WINDOWS = process.platform === 'win32'

function normalizePath(p) {
  const full = resolve(p)
  return IS_WINDOWS ? full.toLowerCase() : full
}

function isInside(child, root) {
  const c = normalizePath(child)
  return c === root || c.startsWith(root.endsWith(sep) ? root : root + sep)
}

export function resolveRepoRoot(repo) {
  try {
    const top = execFileSync('git', ['-C', repo, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (top) return resolve(top)
  } catch {
    // Fora de um repositório git: usa o próprio diretório.
  }
  return resolve(repo)
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

function listJsonl(dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJsonl(full))
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) out.push(full)
  }
  return out
}

function commandNames(content) {
  const texts = typeof content === 'string'
    ? [content]
    : Array.isArray(content)
      ? content.filter(c => c && c.type === 'text').map(c => c.text)
      : []
  const names = []
  for (const text of texts) {
    for (const m of text.matchAll(/<command-name>\/?([^<\s]+)<\/command-name>/g)) names.push(m[1])
  }
  return names
}

// Lê os transcripts e devolve usos, listagens e cobertura do histórico do repositório.
export function scanTranscripts({ home, repoRoot, since }) {
  const root = normalizePath(repoRoot)
  const uses = new Map()
  const listings = []
  let firstSeen
  const sessions = new Set()

  const bump = (name, ts) => {
    const cur = uses.get(name) ?? { uses: 0, lastUsed: undefined }
    cur.uses += 1
    if (!cur.lastUsed || ts > cur.lastUsed) cur.lastUsed = ts
    uses.set(name, cur)
  }

  for (const file of listJsonl(join(home, '.claude', 'projects'))) {
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const line of text.split('\n')) {
      if (!line.includes('"cwd"')) continue
      let rec
      try {
        rec = JSON.parse(line)
      } catch {
        continue
      }
      if (!rec || typeof rec.cwd !== 'string' || !isInside(rec.cwd, root)) continue
      const ts = typeof rec.timestamp === 'string' ? rec.timestamp : undefined
      if (!ts) continue
      if (!firstSeen || ts < firstSeen) firstSeen = ts

      if (rec.type === 'attachment' && rec.attachment?.type === 'skill_listing') {
        if (!rec.isSidechain && Array.isArray(rec.attachment.names)) {
          listings.push({
            sessionId: rec.sessionId,
            timestamp: ts,
            isInitial: rec.attachment.isInitial === true,
            names: rec.attachment.names,
          })
        }
        continue
      }

      if (ts < since) continue
      if (rec.sessionId) sessions.add(rec.sessionId)

      if (rec.type === 'assistant' && Array.isArray(rec.message?.content)) {
        for (const item of rec.message.content) {
          if (item?.type === 'tool_use' && item.name === 'Skill' && typeof item.input?.skill === 'string') {
            bump(item.input.skill.replace(/^\//, ''), ts)
          }
        }
      } else if (rec.type === 'user' && !rec.isSidechain) {
        for (const name of commandNames(rec.message?.content)) bump(name, ts)
      }
    }
  }

  return { uses, listings, firstSeen, sessions: sessions.size }
}

// Skills disponíveis: a listagem inicial mais recente e os acréscimos da mesma sessão.
export function availableSkills(listings) {
  const initials = listings.filter(l => l.isInitial).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const latest = initials[0]
  if (!latest) return []
  const names = new Set(latest.names)
  for (const l of listings) {
    if (!l.isInitial && l.sessionId === latest.sessionId && l.timestamp >= latest.timestamp) {
      for (const n of l.names) names.add(n)
    }
  }
  return [...names].sort()
}

function syncedPluginNames(home) {
  const names = new Set()
  const base = join(home, '.claude', 'plugins', 'synced')
  const walk = (dir, depth) => {
    if (depth > 3 || !existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const full = join(dir, entry.name)
      const manifest = readJson(join(full, '.claude-plugin', 'plugin.json'))
      if (manifest?.name) names.add(manifest.name)
      else walk(full, depth + 1)
    }
  }
  walk(base, 0)
  return names
}

// Classifica cada skill pela origem: project, user, synced, plugin ou builtin.
export function classify(names, { home, repoRoot }) {
  const installed = readJson(join(home, '.claude', 'plugins', 'installed_plugins.json'))?.plugins ?? {}
  const pluginKeys = new Map()
  for (const key of Object.keys(installed)) {
    const at = key.lastIndexOf('@')
    if (at > 0) pluginKeys.set(key.slice(0, at), key)
  }
  const synced = syncedPluginNames(home)

  return names.map(name => {
    const colon = name.indexOf(':')
    if (colon > 0) {
      const prefix = name.slice(0, colon)
      if (pluginKeys.has(prefix)) return { name, kind: 'plugin', plugin: pluginKeys.get(prefix) }
      if (synced.has(prefix)) return { name, kind: 'plugin', plugin: `${prefix}@synced` }
      return { name, kind: 'synced' }
    }
    if (existsSync(join(repoRoot, '.claude', 'skills', name))) return { name, kind: 'project' }
    if (existsSync(join(home, '.claude', 'skills', name))) return { name, kind: 'user' }
    return { name, kind: 'builtin' }
  })
}

export function audit({ repo = process.cwd(), home = homedir(), days = 30, maxUses = 0, now = new Date() } = {}) {
  const repoRoot = resolveRepoRoot(repo)
  const since = new Date(now.getTime() - days * DAY_MS).toISOString()
  const scan = scanTranscripts({ home, repoRoot, since })
  const available = availableSkills(scan.listings)
  const classified = classify(available, { home, repoRoot })

  const skills = classified.map(s => {
    const u = scan.uses.get(s.name)
    return { ...s, uses: u?.uses ?? 0, lastUsed: u?.lastUsed }
  })

  const overrides = skills
    .filter(s => (s.kind === 'user' || s.kind === 'synced') && s.uses <= maxUses)
    .map(s => ({ name: s.name, kind: s.kind, uses: s.uses }))

  const byPlugin = new Map()
  for (const s of skills.filter(s => s.kind === 'plugin')) {
    const cur = byPlugin.get(s.plugin) ?? { key: s.plugin, skills: [], uses: 0 }
    cur.skills.push(s.name)
    cur.uses += s.uses
    byPlugin.set(s.plugin, cur)
  }
  const plugins = [...byPlugin.values()].filter(p => p.uses <= maxUses)

  const warnings = []
  const coveredDays = scan.firstSeen
    ? Math.min(days, Math.max(0, Math.floor((now.getTime() - Date.parse(scan.firstSeen)) / DAY_MS)))
    : 0
  if (!scan.firstSeen) warnings.push('Nenhum transcript encontrado para este repositório.')
  else if (coveredDays < days) {
    warnings.push(`O histórico cobre só ${coveredDays} de ${days} dias; as sugestões podem incluir skills que você ainda vai usar.`)
  }
  if (scan.firstSeen && available.length === 0) {
    warnings.push('Nenhuma listagem de skills encontrada nos transcripts deste repositório.')
  }

  return {
    repoRoot,
    window: { days, since, now: now.toISOString() },
    history: { firstSeen: scan.firstSeen, coveredDays, sessions: scan.sessions },
    maxUses,
    warnings,
    skills,
    suggestions: { skillOverrides: overrides, disablePlugins: plugins },
    skipped: {
      project: skills.filter(s => s.kind === 'project').map(s => s.name),
      builtin: skills.filter(s => s.kind === 'builtin').map(s => s.name),
    },
  }
}

export function apply({ repo = process.cwd(), overrides = [], disablePlugins = [] } = {}) {
  const repoRoot = resolveRepoRoot(repo)
  const file = join(repoRoot, '.claude', 'settings.local.json')
  let settings = {}
  if (existsSync(file)) {
    const raw = readFileSync(file, 'utf8')
    try {
      settings = raw.trim() ? JSON.parse(raw) : {}
    } catch (err) {
      throw new Error(`${file} não é um JSON válido; corrija-o antes de aplicar: ${err.message}`)
    }
  }
  if (overrides.length) {
    settings.skillOverrides = { ...(settings.skillOverrides ?? {}) }
    for (const name of overrides) settings.skillOverrides[name] = OVERRIDE_STATE
  }
  if (disablePlugins.length) {
    settings.enabledPlugins = { ...(settings.enabledPlugins ?? {}) }
    for (const key of disablePlugins) settings.enabledPlugins[key] = false
  }
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(settings, null, 2) + '\n')
  return { file, overrides, disablePlugins }
}

export function parseArgs(argv) {
  const opts = { overrides: [], disablePlugins: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = () => {
      const v = argv[++i]
      if (v === undefined) throw new Error(`Falta o valor de ${arg}`)
      return v
    }
    switch (arg) {
      case '--repo': opts.repo = value(); break
      case '--home': opts.home = value(); break
      case '--days': opts.days = Number(value()); break
      case '--max-uses': opts.maxUses = Number(value()); break
      case '--now': opts.now = new Date(value()); break
      case '--apply': opts.apply = true; break
      case '--override': opts.overrides.push(value()); break
      case '--disable-plugin': opts.disablePlugins.push(value()); break
      default: throw new Error(`Argumento desconhecido: ${arg}`)
    }
  }
  for (const key of ['days', 'maxUses']) {
    if (opts[key] !== undefined && (!Number.isFinite(opts[key]) || opts[key] < 0)) {
      throw new Error(`Valor inválido para ${key === 'days' ? '--days' : '--max-uses'}`)
    }
  }
  return opts
}

function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
    const result = opts.apply ? apply(opts) : audit(opts)
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  } catch (err) {
    process.stderr.write(`${err.message}\n`)
    process.exit(1)
  }
}

// Compara caminhos reais: instalada via junction/symlink (.claude/skills -> .agents/skills),
// argv[1] traz o caminho do link e import.meta.url o real, e main() nunca rodaria.
export function isEntryPoint(argv1, moduleUrl) {
  if (!argv1) return false
  const real = p => {
    try {
      return realpathSync(p)
    } catch {
      return resolve(p)
    }
  }
  return normalizePath(real(argv1)) === normalizePath(real(fileURLToPath(moduleUrl)))
}

if (isEntryPoint(process.argv[1], import.meta.url)) main()
