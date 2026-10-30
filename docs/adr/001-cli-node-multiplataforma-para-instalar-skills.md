# ADR-001: CLI Node.js multiplataforma para instalar skills

- **Date**: 2026-10-29
- **Status**: Proposed (passa a Accepted com a aprovação do PR)
- **Deciders**: Leonardo Barrocal (autor); revisão do time no PR
- **Tags**: cli, distribuição, skills, portabilidade

## Context and Problem Statement

A instalação de skills depende de scripts PowerShell (`Install-Skills.ps1` e correlatos), `fzf` e `.bat`. Isso
impede o uso em macOS e Linux e exige PowerShell 7 em qualquer máquina. Também não há como instalar sem clonar o
repositório. Precisamos de um instalador com o mesmo comportamento nos três sistemas, com escolha guiada de
bundles e skills, sem alterar o formato do catálogo existente.

## Decision Drivers

- Funcionar em Windows, macOS e Linux sem PowerShell nem `fzf`
- Distribuir por `npx`, sem clonar o repositório
- Não migrar `SKILLS/`, `bundles.yaml` nem `skills.yaml`
- Não reimplementar a lógica de instalação por agente
- Proteger o conteúdo que o usuário já tem nos projetos

## Considered Options

- **A.** CLI Node.js/TypeScript próprio, delegando a instalação ao CLI `skills` da Vercel
- **B.** Manter e portar os scripts PowerShell (PowerShell 7 em todos os sistemas)
- **C.** Adotar o monorepo Nx e o registry do Tech Leads Club
- **D.** Chamar o CLI `skills` direto, sem wizard nem catálogo Colibri

## Decision Outcome

Chosen option: **"A"**, porque cumpre os critérios de portabilidade e distribuição reaproveitando o motor que já
conhece os caminhos de cada agente.

Decisões que vêm junto:

1. **Node >= 22.20, TypeScript ESM**, com versão mínima verificada em runtime (o motor usa `fs/promises.glob`; o
   campo `engines` do npm só avisa).
2. **Motor `skills@1.7.4` fixado**, usado só pelo executável público via subprocesso, sem importar módulos internos.
3. **Catálogo inalterado e empacotado**: `SKILLS/` e `bundles.yaml` seguem como fonte de verdade e viajam no pacote.
   A instalação do catálogo empacotado não usa rede nem `git pull`; `--catalog` aponta para um clone local.
4. **Estado de propriedade próprio** (`.colibri-skills.json` no projeto, `~/.colibri-agents/skills.json` no
   global): o CLI só atualiza e remove o que instalou. Instalações feitas pelos scripts PowerShell não são adotadas
   automaticamente (adoção explícita com `install --force`).
5. **Proteção por padrão**: conteúdo manual, arquivos modificados e destinos não administrados não são
   sobrescritos. `--force` é opt-in; `--yes` só confirma.
6. **Seis agentes na v1**: Claude Code, Codex, Cursor, GitHub Copilot, OpenCode e Windsurf.
7. **Requisitos declarativos** em `skill-requirements.yaml`: o CLI só compara o sistema operacional e avisa. Não
   detecta nem instala ferramentas, e instalar em outro sistema continua permitido.
8. **Scripts `.ps1` e `INSTRUCTIONS/` ficam como legado**, sem remoção nesta etapa.

### Positive Consequences

- Mesma experiência nos três sistemas; instalação por `npx` sem clone
- Nenhuma migração de conteúdo; os scripts atuais continuam funcionando
- Menos código próprio de instalação para manter

### Negative Consequences

- O repositório passa a ter build (`tsc`), dependências npm e CI próprios
- Dependência do `skills` da Vercel: atualizar o motor é manual e exige revalidar os testes
- Nova exigência de Node 22.20+ para quem instala
- Dois fluxos convivem (CLI e scripts) até a descontinuação dos scripts
- `skill-requirements.yaml` cobre só 4 skills; as demais aparecem como "não catalogadas"
- Codex, Cursor, Copilot e OpenCode compartilham `.agents/skills`, o que exige guardas no CLI

## Pros and Cons of the Options

### A. CLI Node próprio sobre `skills` ✅ Chosen

- ✅ Multiplataforma, distribuição por npm, catálogo preservado
- ❌ Acoplamento a uma ferramenta externa e a uma versão mínima de Node

### B. Portar os scripts PowerShell

- ✅ Nenhuma stack nova
- ❌ Continua exigindo PowerShell 7 e `fzf`; sem `npx`; mais código de instalação próprio

### C. Monorepo Nx / registry Tech Leads Club

- ✅ Solução pronta de referência
- ❌ Peso desproporcional para o catálogo atual; troca o formato de catálogo

### D. Usar o `skills` direto

- ✅ Zero código novo
- ❌ Sem bundles, sem catálogo Colibri, sem estado de propriedade nem avisos de requisito

## Links

- Documentação da feature: [../cli-multiplataforma.md](../cli-multiplataforma.md)
- Publicação e operação: [../cli-publicacao-e-operacao.md](../cli-publicacao-e-operacao.md)
- Uso do CLI: seção "CLI multiplataforma (Node.js)" do [README](../../README.md)
