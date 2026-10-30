# Publicação e operação do CLI

Passo a passo do que acontece depois da aprovação do PR. Itens marcados **(proposta)** ainda não foram decididos
nem implementados e devem ser confirmados pelo time.

## 1. Como as skills chegam ao usuário

O catálogo (`SKILLS/` e `bundles.yaml`) **viaja dentro do pacote npm**. Consequência: a versão do pacote define
quais skills e quais versões delas o usuário recebe.

| Quero... | Comando | De onde vêm as skills |
|---|---|---|
| Instalar sem clonar (após publicar) | `npx @colibriagile/agents-instructions@latest` | da versão do pacote executada |
| Atualizar skills já instaladas | `npx @colibriagile/agents-instructions@latest update` | do catálogo da versão executada |
| Trabalhar com skills locais | `node bin/colibri-skills.mjs --catalog <clone>` | do clone, sem commit nem `git pull` |

Atualizar o CLI e atualizar skills é a mesma ação: rodar uma versão mais nova e executar `update`.

## 2. Passo a passo após aprovar o PR

1. **Conferir o CI do PR** nas três plataformas (Windows, Linux e macOS, Node 22.20 e 24). Só o macOS foi validado
   localmente.
2. **Definir o destino do pacote:** npm público ou registro privado. O `package.json` está com licença MIT e sem
   `publishConfig`. Pacote com escopo é restrito por padrão, então publicar como público exige
   `npm publish --access public`.
3. **Garantir o escopo `@colibriagile` no npm** e quem é dono dele. A disponibilidade do nome não foi verificada.
4. **Criar um token de publicação** (preferir *granular*, só para esse pacote) e guardar como segredo do GitHub
   (por exemplo `NPM_TOKEN`).
5. **Merge na `master`.**
6. **Publicar a primeira versão (0.1.0 ou 0.1.x):** `npm publish --access public`. O `prepack` roda o build
   (`tsc`) sozinho. Antes, `npm pack --dry-run` confere o conteúdo: hoje são 356 arquivos, 2,2 MB.
7. **Validar a publicação** em uma máquina limpa e em Windows e macOS: `npx @colibriagile/agents-instructions@latest list --available`
   e um `install --dry-run` num projeto de teste.
8. **Tag e release no GitHub** (`v0.1.0`), com as notas de versão.
9. **Avisar o time** com o comando de instalação e os requisitos (Node >= 22.20).
10. **Automatizar a publicação (proposta):** workflow disparado por tag `v*` que roda os testes e executa
    `npm publish --provenance --access public`. O workflow atual só valida; não publica.

## 3. Versionamento

O pacote segue SemVer. A versão do pacote é a versão do catálogo; as skills não têm versão individual no CLI.

**(proposta)** Regra de bump:

| Mudança | Bump |
|---|---|
| Correção em uma skill existente, ajuste de texto, correção de bug do CLI | patch (`0.1.1`) |
| Skill nova, bundle novo, entrada nova em `skill-requirements.yaml`, funcionalidade nova no CLI | minor (`0.2.0`) |
| Mudança incompatível: formato de `bundles.yaml`/`skills.yaml`, remoção de skill ou bundle, comando renomeado, exigência de Node mais nova | major |

Enquanto estiver em `0.x`, tratar mudanças incompatíveis como minor e registrá-las nas notas de versão.

## 4. Fluxo de uma skill nova ou alterada

1. Criar ou editar em `SKILLS/<nome>/` e incluir a skill no bundle certo em `bundles.yaml`.
2. Se a skill exige sistema operacional ou ferramenta específica, declarar em `skill-requirements.yaml`. Sem
   entrada, o wizard mostra "Requisitos não catalogados".
3. Abrir PR; o CI roda `check`, testes, o teste do wizard e `npm pack --dry-run`.
4. Após o merge, escolher o bump (seção 3), atualizar a versão (`npm version minor|patch`) e publicar (passo 6 ou 10).
5. Usuários recebem a skill com `npx @colibriagile/agents-instructions@latest update`. Quem usa clone atualiza com
   `git pull`.

**Lacuna conhecida:** o `update` só reaplica o catálogo da versão que está rodando. Se uma skill mudar e o pacote
não for publicado, quem usa o pacote não recebe a mudança. Por isso, mudar skill e publicar versão precisam andar
juntos **(proposta: o workflow por tag da seção 2, item 10, resolve isso)**.

## 5. Convivência com o fluxo antigo

- Os scripts PowerShell continuam funcionando e **não** são adotados automaticamente pelo CLI.
- Para migrar um projeto: `install --dry-run` com o manifest e os agentes desejados, conferir a prévia e então
  `install --force --yes`.
- **(proposta)** Marcar os scripts como legados no README e definir uma data de descontinuação depois que o CLI
  estiver publicado e validado.

## 6. Manutenção contínua

- **Motor `skills@1.7.4`:** fixado. Para atualizar, trocar a versão, rodar toda a suíte (os testes usam o backend
  real) e revisar o contrato de uso em `src/backend.ts`.
- **Novo agente:** adicionar em `src/agents.ts` (caminho local e global) e cobrir com teste. Checar se compartilha
  `.agents/skills` com os existentes.
- **Node:** o mínimo (22.20) vem do motor. Subir exige alterar `package.json` e a matriz do CI.
- **Dependências:** versões exatas. Rodar `npm audit` e atualizar sob demanda **(proposta: Dependabot)**.
- **CI:** hoje dispara em `push` e `pull_request`, gerando execução duplicada. Considerar limitar `push` à `master`.

## 7. Pendências em aberto

- Registro (npm público ou privado) e dono do escopo
- Processo de publicação e quem tem permissão
- Data de descontinuação dos scripts PowerShell
- Cobertura de `skill-requirements.yaml` (hoje 4 skills: `delphi-xe2-build`, `assign-bundles`, `colibri-cis-testes`,
  `deep-review`)
- Migração de `INSTRUCTIONS/` para o CLI
- Agentes adicionais (Gemini CLI, Cline e outros)
