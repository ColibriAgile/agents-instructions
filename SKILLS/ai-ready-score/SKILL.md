---
name: ai-ready-score
description: AI Ready audita se um repositório está preparado para assistentes de IA e atribui uma nota de 0 a 5, verificando se existem arquivos de instrução para Copilot, Claude Code, Codex e OpenCode, se são compartilhados por link simbólico em vez de duplicados, se as regras são específicas do projeto (build, testes, arquitetura, convenções) e se conhecimento especializado de uso ocasional foi extraído para skills em vez de inflar o contexto sempre carregado. Use quando pedirem para avaliar, pontuar, auditar ou dar nota de quão "AI ready" ou preparado para agentes de IA está um repositório. Não use para escrever ou editar os próprios arquivos de instrução (use create-instructions ou agent-customization) nem para revisão de código, segurança ou performance.
---

# AI Ready

Audita um repositório e atribui uma nota de 0 a 5 de quão pronto ele está para assistentes de IA, com uma tabela de achados e sugestões de melhoria.

## Passo 1 — Descobrir os arquivos de instrução

1. Execute `python [skill-dir]/scripts/discover.py [caminho-do-repo]` (read-only) para inventariar CLAUDE.md, AGENTS.md, `.github/copilot-instructions.md`, instruções path-scoped do Copilot, CLAUDE.md/AGENTS.md aninhados em subpastas, SKILL.md existentes e outros arquivos de regras (Cursor, Cline, Windsurf).
2. Leia o conteúdo de cada arquivo que o script reportou como existente — e o conteúdo real por trás de qualquer symlink.

*Done when:* para cada uma das 4 ferramentas (Copilot, Claude Code, Codex, OpenCode) está determinado se o arquivo está ausente, é um symlink, ou é um arquivo real independente.

## Passo 2 — Classificar duplicidade e qualidade

1. Invoque a skill `writing-agents-md` (Skill tool) para carregar o rent test (Delta, Frequency, Economy) e a escada de escopo — são os critérios aplicados nos itens 3 e 4 abaixo.
2. Para arquivos que aparecem em mais de uma ferramenta (ex. AGENTS.md servindo Codex e OpenCode, ou CLAUDE.md e AGENTS.md com o mesmo teor): se são symlinks apontando para a mesma fonte, é fonte única (bom); se são arquivos reais com hash igual ou conteúdo equivalente colado, é duplicação (risco de divergência — arquivo capado no tier 2).
3. Julgue especificidade pelo teste de Delta: a instrução muda o que o agente faria por padrão, citando comandos reais de build/test, arquitetura/módulos reais e convenções do próprio repositório — ou falha no Delta por ser conselho genérico que serviria para qualquer projeto?
4. Para cada instrução, avalie pelo teste de Frequency se descreve conhecimento estreito e de uso ocasional — como operar um componente, biblioteca ou fluxo específico que não aparece na maioria das tarefas — em vez de algo que toda sessão precisa. Esse tipo de conteúdo pertence a uma skill carregada sob demanda (ou a um arquivo de subtree/linked doc mais abaixo na escada de escopo), não a um arquivo sempre carregado.

*Done when:* cada arquivo descoberto está classificado como ausente / genérico / duplicado / específico-mas-estreito / específico-e-enxuto, e toda ocorrência de conteúdo que deveria virar skill está listada com arquivo e trecho.

## Passo 3 — Pontuar e reportar

1. Aplique a rubrica abaixo escolhendo o tier mais alto cujo critério o repositório cumpre integralmente — um único problema do tier N (ex. uma ferramenta sem arquivo, ou um par duplicado) capa a nota abaixo de N mesmo que o resto do repositório já esteja melhor.
2. Preencha `[skill-dir]/assets/report.template.md` com a tabela de achados (uma linha por ferramenta), a lista de conhecimento candidato a skill, a nota final e a justificativa de qual critério foi o decisivo.
3. Grave o relatório preenchido como `AI-READY-SCORE.md` na raiz do repositório auditado — não em `[skill-dir]` (mutating: cria o arquivo, ou sobrescreve se `AI-READY-SCORE.md` já existir ali).

*Done when:* `AI-READY-SCORE.md` existe na raiz do repositório auditado, cita as 4 ferramentas, declara a nota final de 0 a 5, e cada linha de "Sugestão" traz uma ação concreta e executável.

## Rubrica de pontuação

- **0** — Nenhum arquivo de instrução para nenhuma ferramenta (nenhum CLAUDE.md, AGENTS.md, `.github/copilot-instructions.md`).
- **1** — Existe pelo menos um arquivo, mas cobre só uma ferramenta e/ou o conteúdo é genérico (boilerplate, sem convenção real do projeto).
- **2** — Existem arquivos para mais de uma ferramenta, mas duplicados por cópia (conteúdo colado independentemente em cada um) em vez de compartilhados por symlink — risco de divergência quando um for atualizado e o outro não.
- **3** — Arquivos cobrem as ferramentas usadas no projeto por fonte única (symlink), mas as regras ainda são superficiais — faltam comandos de build/test, arquitetura ou convenções específicas do repositório.
- **4** — As 4 ferramentas (Copilot, Claude Code, Codex, OpenCode) têm instrução via fonte única, com regras bem definidas e específicas do repositório — mas ainda embutem conhecimento especializado de uso ocasional que deveria estar em uma skill, inflando o contexto sempre carregado.
- **5** — Tudo do tier 4, e nenhum conhecimento estreito/ocasional está embutido nas instruções sempre carregadas: tudo que só algumas tarefas precisam foi extraído para skills (ou mecanismo equivalente de carregamento sob demanda).

## Error Handling

- Se `scripts/discover.py` reportar `ERROR: ... is not a directory`, confirme o caminho do repositório antes de tentar de novo.
- Se a raiz do repositório auditado não for gravável, avise o usuário e peça um caminho alternativo em vez de tentar salvar em outro lugar silenciosamente.
