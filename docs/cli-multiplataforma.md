# CLI multiplataforma de skills

Resumo do que foi feito, do problema que motivou e do caminho até a solução. A decisão formal está no
[ADR-001](adr/001-cli-node-multiplataforma-para-instalar-skills.md). O uso está no README.

## Problema

Instalar skills dependia de scripts PowerShell, `fzf` e `.bat`:

- não roda em macOS/Linux e exige PowerShell 7 em qualquer máquina;
- exige clonar o repositório para instalar qualquer coisa;
- a escolha de bundles/skills é feita com `fzf`, sem visão do que será alterado;
- não há registro do que foi instalado, então atualizar e remover é manual.

## Caminho

1. **Análise.** Comparação entre o fluxo atual, o CLI `skills` da Vercel e a solução do Tech Leads Club (Node, React/Ink,
   monorepo Nx, registry próprio). O monorepo foi descartado por ser desproporcional; o CLI da Vercel foi
   considerado bom como motor de instalação, mas sem bundles nem catálogo Colibri.
2. **Decisão.** Um CLI Node.js/TypeScript próprio para o wizard e o catálogo, delegando a instalação ao `skills`
   (versão fixada). Catálogo e manifests existentes ficam intactos.
3. **Implementação** em etapas, com revisão de código a cada rodada (5 rodadas; os achados foram corrigidos).
   Depois foi adicionada a segunda parte, os avisos de requisitos por skill.
4. **Verificação** em macOS: checagem de tipos, 44 testes, 4 cenários em terminal real e `npm pack`. Windows, Linux
   e Node 24 ficam a cargo do CI deste PR.

## Solução

Pacote npm `@colibriagile/agents-instructions` (binário `colibri-skills`), Node >= 22.20.

**Wizard** (sem argumentos): ação → escopo (projeto/global) → agentes → bundles ou busca de skills → método
(cópia/symlink) → prévia e confirmação. Ctrl+C cancela sem gravar.

**Comandos**: `install`, `update`, `remove`, `list`, `reconcile`, com `--dry-run`, `--json`, `--yes`, `--force`,
`--cwd` e `--catalog`.

**Como funciona por dentro**

```
bin/colibri-skills.mjs   valida a versão do Node e carrega dist/cli.js
  └─ src/cli.ts          Commander (comandos) ou wizard (src/wizard.ts, Clack)
      └─ src/commands.ts monta a seleção a partir do catálogo e dos manifests
          └─ src/manager.ts  plano → guardas de conflito → executa → registra estado
              └─ src/backend.ts  subprocesso do executável público do skills@1.7.4
```

| Arquivo | Papel |
|---|---|
| `src/catalog.ts` | lê `SKILLS/` e `bundles.yaml` do pacote (ou de `--catalog`) |
| `src/manifest.ts` | lê/escreve `skills.yaml` preservando comentários e campos extras |
| `src/storage.ts` | estado de propriedade, escrita atômica e lock contra execuções simultâneas |
| `src/agents.ts` | caminhos de cada agente (projeto e global) |
| `src/requirements.ts` + `skill-requirements.yaml` | avisos declarativos de requisitos por skill |

**Garantias**

- Só atualiza e remove o que o próprio CLI instalou.
- Não sobrescreve conteúdo manual, arquivos modificados nem destinos não administrados sem `--force`.
- Interrupções (Ctrl+C, SIGTERM, SIGHUP) revertem a operação em curso e liberam o lock.
- Telemetria do motor desativada no subprocesso.

**Não faz** (de propósito)

- não detecta nem instala ferramentas exigidas por uma skill (Delphi, PowerShell, SQL Server);
- não migra `INSTRUCTIONS/` nem remove os scripts `.ps1`;
- não adota automaticamente instalações feitas pelos scripts antigos;
- não atualiza projetos em massa.

## Impacto no repositório

- Novos: `src/`, `bin/`, `tests/`, `package.json`, `package-lock.json`, `tsconfig.json`,
  `skill-requirements.yaml`, `.github/workflows/cli.yml`.
- Alterados: `README.md` (seção do CLI) e `.gitignore` (`node_modules/`, `dist/`, estado local do CLI).
- Intactos: `SKILLS/`, `bundles.yaml`, `skills.yaml`, `INSTRUCTIONS/` e os scripts `.ps1`.

## Verificação

```sh
npm ci --ignore-scripts
npm run check
npm test                       # exige Node >= 22.20
python3 tests/wizard-pty.py    # só macOS/Linux
npm pack --dry-run
```
