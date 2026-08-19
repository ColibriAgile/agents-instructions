---
name: ai-ready-fix
description: AI Ready Fix aplica as correções apontadas pelo ai-ready-score até o repositório alcançar nota 5 — explora o projeto com subagents Explore (linguagem, estrutura, bibliotecas, testes, convenções reais), pergunta ao usuário o que a exploração não consegue inferir para evitar regras genéricas, reescreve CLAUDE.md/AGENTS.md/.github/copilot-instructions.md como fonte única com link simbólico, extrai conhecimento estreito para skills, e roda o ai-ready-score de novo para confirmar a nota. Use quando pedirem para corrigir ou resolver os achados do AI-READY-SCORE.md, ou para subir a nota de um repositório até 5. Não use apenas para avaliar ou pontuar sem alterar arquivos (use ai-ready-score) nem para editar instruções sem relação com prontidão para IA (use create-instructions ou agent-customization).
---

# AI Ready Fix

Leva um repositório da nota atual do `ai-ready-score` até nota 5, gerando instruções ancoradas em comandos e convenções reais do projeto e extraindo conhecimento estreito para skills.

## Passo 1 — Levantar o relatório atual

1. Invoque a skill `ai-ready-score` (Skill tool, args: caminho do repositório) para gerar ou atualizar `AI-READY-SCORE.md` na raiz.
2. Leia `AI-READY-SCORE.md` por completo: a nota atual, a frase de justificativa do tier decisivo, a tabela de Achados (uma linha por ferramenta) e a lista de "Conhecimento que deveria virar skill".

*Done when:* a nota atual, o critério decisivo, e cada linha de Achados e de conhecimento candidato a skill foram lidos.

## Passo 2 — Explorar o projeto

1. Dispare em paralelo, no Agent tool, subagents `Explore` (breadth "very thorough") — um por tema: (a) linguagem, runtime e dependências (arquivos de manifesto: .csproj, package.json, requirements.txt etc.); (b) estrutura de pastas e arquitetura (camadas, módulos, projetos); (c) comandos reais de build/test/lint e pipelines de CI; (d) convenções de código observadas no próprio código — nomenclatura, tratamento de erro, injeção de dependência, logging, padrões de design; (e) frameworks e estratégia de teste realmente usados; (f) conteúdo completo de qualquer arquivo de instrução parcial já existente, achado no Passo 1.
2. Consolide os achados de cada subagent em um resumo por tema, citando caminhos e comandos reais.

*Done when:* existe um resumo com achados concretos para cada um dos seis temas — todos foram investigados, nenhum ficou sem tentativa.

## Passo 3 — Montar a lista de lacunas

1. Cruze o relatório do Passo 1 com a exploração do Passo 2: para cada uma das 4 ferramentas, decida a ação (criar do zero, reescrever conteúdo genérico, ou substituir arquivo duplicado por link simbólico); para cada item de "conhecimento que deveria virar skill", decida um nome de skill (slug) e o escopo.
2. Marque cada lacuna como "resolvida pela exploração" (a informação já é concreta e específica) ou "precisa de pergunta ao usuário" (depende de motivação, convenção não escrita, ferramenta que a equipe realmente usa, ou armadilha conhecida que o código sozinho não revela).

*Done when:* toda lacuna do Passo 1 está marcada com uma ação e com um dos dois rótulos acima.

## Passo 4 — Perguntar o que falta

1. Para cada lacuna marcada "precisa de pergunta", formule uma pergunta concreta via AskUserQuestion, ancorada numa decisão real que muda o arquivo final — por exemplo "o time realmente usa Codex/OpenCode ou só Claude Code e Copilot?", "existe uma razão para X em vez do padrão Y observado no código?", "qual comando roda de fato os testes de integração no CI?". Use quantas chamadas forem necessárias, até 4 perguntas por chamada.
2. Antes de perguntar, remova da lista qualquer pergunta cuja resposta o Passo 2 já decidiu com confiança.

*Done when:* toda lacuna marcada "precisa de pergunta" no Passo 3 tem resposta do usuário, ou foi reclassificada como decidível e removida da lista.

## Passo 5 — Extrair conhecimento estreito para skills

1. Para cada item da lista de skills candidatas (Passo 1 e 3), invoque a skill `writing-skills` para autorar um SKILL.md dedicado, usando os achados do Passo 2 e as respostas do Passo 4 como o contexto específico que evita um skill genérico.
2. Salve cada skill no mecanismo de carregamento sob demanda que o repositório já usa, achado pelo `discover.py` do `ai-ready-score` no Passo 1; se nenhum existir, use `.claude/skills/<slug>/SKILL.md` na raiz do repositório auditado.

*Done when:* cada item de "conhecimento que deveria virar skill" do relatório original tem um SKILL.md correspondente.

## Passo 6 — Escrever a fonte única

1. Para cada arquivo `.md` de instrução descoberto no Passo 1 (CLAUDE.md, AGENTS.md, .github/copilot-instructions.md etc.), rode `python [skill-dir]/scripts/check_target.py <caminho> <raiz-do-repo>` (read-only) antes de decidir editá-lo. `EXTERNAL_SYMLINK` significa que o caminho é um link simbólico para fora do repositório — editar esse caminho reescreveria um arquivo que o repositório não possui (ex.: uma instrução global ou compartilhada com outros repositórios). Nesse caso, apague apenas o link (nunca o alvo externo) e trate o caminho como ausente: crie ali um arquivo `.md` real e local pelo restante deste passo, sem tocar no arquivo apontado. `REAL` e `IN_REPO_SYMLINK` são seguros para editar diretamente.
2. Se algum dos arquivos `.md` restantes (REAL ou IN_REPO_SYMLINK) já for específico e bem escrito, use-o como fonte única e siga para o Passo 7. Caso contrário, invoque a skill `writing-agents-md` — branch Trim se o arquivo existir mas for genérico ou duplicado, branch Write se nenhum existir — usando os achados do Passo 2 e as respostas do Passo 4 como candidatos a delta. O resultado (`AGENTS.md` na raiz, se criado do zero, serve Codex e OpenCode nativamente) deve citar os comandos de build/test/lint, o mapa de arquitetura e as convenções específicas do repositório, e passar no rent test linha a linha.
3. **Regra fixa — Greenfield Alpha.** Toda fonte única criada ou reescrita neste passo leva o bloco abaixo verbatim como primeira seção do arquivo, incondicionalmente e em toda execução do Passo 6 — intacta, à frente de qualquer seção que venha dos Passos 2 e 4, a primeira coisa que o agente lê.

   ```markdown
   ## Greenfield Alpha — Zero Legacy Tolerance

   No production users. Never sacrifice quality for backward compatibility; never write migration/compat/defensive code for old state — delete obsolete code instead. Hard cuts, not bridges: a rename updates code, storage, APIs, CLI, extensions, specs, RFCs, and [glob de specs/tasks do repositório] in one change — no aliases, dual fields, or schema fallbacks. Every breaking-change spec MUST list its delete targets.
   ```

   Substitua `[glob de specs/tasks do repositório]` pelo caminho real de specs/tasks achado no Passo 2, se o repositório tiver esse tipo de diretório; caso contrário, remova só esse trecho da frase — o resto do bloco fica intacto.
4. Referencie em uma linha cada skill extraída no Passo 5 — é exatamente o tipo de pointer para material sob demanda que o rent test do `writing-agents-md` pede; mantenha nesse arquivo só o que toda tarefa precisa, o resto fica exclusivamente na skill correspondente.

*Done when:* cada `.md` de instrução descoberto no Passo 1 foi classificado por `check_target.py`, nenhum `EXTERNAL_SYMLINK` foi editado em vez de materializado localmente, o arquivo fonte existe, tem `Greenfield Alpha — Zero Legacy Tolerance` como primeira seção verbatim (só o glob de specs/tasks adaptado), e passa no rent test do `writing-agents-md` linha a linha, e cada seção restante cita um comando, caminho ou convenção real e verificável no repositório.

## Passo 7 — Ligar as demais ferramentas por link simbólico

1. Para cada ferramenta cujo arquivo está ausente, duplicado ou genérico, execute `python [skill-dir]/scripts/symlink.py <caminho-do-link> <caminho-do-arquivo-fonte>` (mutating) para criar um link simbólico real apontando para o arquivo do Passo 6.
2. Em caso de erro de privilégio no Windows, siga a instrução impressa em stderr (ativar Modo de Desenvolvedor ou usar uma PowerShell elevada) e execute o script de novo.

*Done when:* todas as ferramentas detectadas no Passo 1 apontam por link simbólico real para o arquivo fonte único.

## Passo 8 — Confirmar a nota

1. Invoque novamente a skill `ai-ready-score` para regerar `AI-READY-SCORE.md`.
2. Se a nota for 5, pare. Se for menor, leia a justificativa do novo tier decisivo, volte ao passo correspondente (3, 5, 6 ou 7) para resolver especificamente aquele critério, e repita este passo.

*Done when:* `AI-READY-SCORE.md` declara nota 5, ou o agente reportou ao usuário exatamente qual bloqueio fora do seu controle impede a nota 5 e qual ação o usuário precisa tomar para destravá-lo.

## Error Handling

- Se `scripts/symlink.py` falhar porque o destino já existe como arquivo real diferente, confirme com o usuário se pode substituí-lo antes de rodar de novo com `--force` — o script não sobrescreve sozinho.
- Se `ai-ready-score` reportar que a raiz do repositório não é gravável, avise o usuário e peça um caminho alternativo em vez de tentar salvar em outro lugar.
- Se `scripts/check_target.py` reportar `EXTERNAL_SYMLINK` para o arquivo fonte escolhido no Passo 6, nunca edite através do link: apague só o link e crie um arquivo `.md` real no mesmo caminho, preservando intacto o arquivo apontado fora do repositório.
