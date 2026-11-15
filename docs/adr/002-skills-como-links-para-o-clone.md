# ADR-002: Skills como links para o clone, com um motor único

- **Date**: 2026-11-15
- **Status**: Proposed (passa a Accepted com a aprovação do PR)
- **Deciders**: Douglas Cunha (autor); revisão do time no PR
- **Tags**: cli, skills, links, herdr
- **Substitui em parte**: [ADR-001](001-cli-node-multiplataforma-para-instalar-skills.md) (motor `skills`, cópias,
  estado próprio, escopo global, distribuição por npm)

## Context and Problem Statement

O ADR-001 trouxe uma CLI multiplataforma que instala cópias das skills pelo pacote `skills`. Os scripts
PowerShell continuaram como legado. Depois disso, o mod `skill-bundles` do Herdr passou a criar links dos
projetos para o clone do catálogo, sem cópias. Hoje as 3 ferramentas convivem, cada uma com o seu registro, e
uma desfaz o trabalho da outra. O time precisa de uma forma só de usar as skills.

## Decision Drivers

- Uma forma só de gerenciar skills neste repositório
- Uma mudança no catálogo vale para todos os projetos sem uma rodada de atualização
- O mod do Herdr como ferramenta principal, e um fallback de terminal com as mesmas regras
- As regras em 1 lugar, para as 2 ferramentas não divergirem
- Funcionar em Windows, macOS e Linux (critério do ADR-001, mantido)

## Considered Options

- **A.** Links para o clone, com o motor do mod (`link-skills.mjs`) como motor da CLI
- **B.** Links para o clone, com as regras reescritas em TypeScript na CLI
- **C.** Manter a CLI do ADR-001 (cópias) e fazer o mod ler o `.colibri-skills.json`
- **D.** Manter os scripts PowerShell

## Decision Outcome

Chosen option: **"A"**.

- O clone é o único lugar com os arquivos das skills. Um projeto tem links: junction no Windows, link simbólico
  no macOS e no Linux.
- A CLI usa `engine/link-skills.mjs`, uma cópia do arquivo do repositório `dougcunha/herdr-mods`. O
  `engine/ENGINE.json` guarda o commit de origem e o SHA-256, e um teste confere o arquivo. Uma regra muda lá
  primeiro; depois a cópia é atualizada aqui com `npm run engine:sync`.
- A CLI mantém o que o ADR-001 tem de próprio: o wizard, os comandos, as mensagens em pt-BR, a prévia com
  confirmação, o `--json` e os requisitos declarados (`skill-requirements.yaml`).
- Saem: a dependência `skills`, os métodos `copy` e `symlink`, o `.colibri-skills.json`, o escopo global, a
  escolha de agentes e a publicação no npm.
- Saem os scripts PowerShell de instalação. `Import-Skill.ps1` e `Configure-ModelInvocation.ps1` viram comandos.
- A curadoria do catálogo (skills sem bundle, associar, criar e apagar bundle, apagar skill) entra na CLI e no
  mod, pelo mesmo motor.

A spec com os comandos e os pontos de teste é [`docs/specs/links-para-o-clone.md`](../specs/links-para-o-clone.md).

### Positive Consequences

- Um `git pull` no clone atualiza todos os projetos.
- O mod e a CLI dão o mesmo resultado para o mesmo projeto.
- Uma skill editada no clone aparece na hora nos projetos, também antes do commit.
- Menos código próprio: o estado, o lock, o rollback e o backend `skills` saem.

### Negative Consequences

- A CLI exige um clone no computador. A instalação por `npx`, sem clone, deixa de existir.
- Todos os projetos veem a mesma versão do catálogo. Não dá para fixar uma versão por projeto.
- Um `git clean -fdx` no projeto remove os links (não os arquivos das skills). A ferramenta cria de novo.
- O motor tem origem em outro repositório. Uma correção de regra passa por lá.
- As instalações antigas (cópias) precisam de 1 execução de `install` para virar links.

## Pros and Cons of the Options

### B. Regras reescritas em TypeScript

- Good: a CLI não depende de um arquivo de outro repositório.
- Bad: 2 cópias das regras (estados, conversão, bloco do `exclude`), que divergem com o tempo.

### C. Manter as cópias

- Good: nenhuma mudança para quem já usa a CLI.
- Bad: mantém 2 modelos e a rodada de atualização por projeto.

### D. Manter os scripts PowerShell

- Bad: não funciona em macOS e Linux, e desfaz os links.
