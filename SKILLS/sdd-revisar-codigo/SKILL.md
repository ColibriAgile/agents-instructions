---
name: sdd-revisar-codigo
description: Use essa skill quando for necessário revisar o código de uma funcionalidade, garantindo que ela está em confirmidade com os padrões estabelecidos nas rules e skills do projeto e também segue o que está definido na TechSpec em `techspec.md` e nos arquivos das tasks. Não utilize quando estiver fazendo QA ou correção de defeitos.
argument-hint: --prd nome-da-funcionalidade
disable-model-invocation: true
---

Entrada: `--prd` identifica o slug da feature. Sem argumento, deduza o slug pelo contexto da sessão atual (feature em revisão, PRD/TechSpec/tasks recém-referenciados etc.) e só então localize a pasta em `./tasks/prd-*/`, usando `./tasks/prd-[nome-da-feature]`.

## Fluxo

1. **Analisar**: Faça uma análise detalhada, lendo com atenção a TechSpec em `techspec.md`, todas as tasks prontas em `done/task_*.md` e os arquivos das rules e skills referenciados nestas especificações e no projeto.
2. **Conformidade**: Confira cada uma das mudanças em relação aos padrões definidos para o projeto e também a cada uma das skills relevantes.
3. **Aderência à TechSpec**: Compare a implementação com:
- [ ] Arquitetura definida
- [ ] Componentes, interfaces, endpoint, payloads, tabelas, colunas
- [ ] Verifique o modelo de dados
- [ ] Verifique os endpoints das APIs
4. **Completude das tasks**: Garanta que todas as tasks foram implementadas, as subtasks foram seguidas, os testes estão passando
5. **Cobertura de testes**: Analise o code coverage e garanta que ele está de acordo com o que foi definido para o projeto e com a `TechSpec.md`
6. **Reportar**: gere o `./tasks/prd-[nome-da-feature]/codereview_[num]/codereview.md` (substitua `[num]` pelo número da revisão) de acordo com `./references/TEMPLATE.md` com a conclusão:
- **APROVADO**: todos os critérios atendidos, testes passando, requisitos implementados e padrões seguidos.
- **APROVADO COM RESSALVAS**: caso existam melhorias pendentes não bloqueantes
- **REPROVADO**: Caso exista violação de padrões, não aderência à TechSpec ou testes estarem falhando
