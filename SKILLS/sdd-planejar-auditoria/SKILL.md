---
name: sdd-planejar-auditoria
description: Auditoria SDD quando um relatório de architectural-analysis precisa virar frentes com TechSpec e tasks; não audita nem implementa.
argument-hint: --relatorio .audits/architectural-analysis-[timestamp].md [--atualizar]
disable-model-invocation: true
---

# Planejar auditoria SDD

Um relatório de `architectural-analysis` vira **frentes**: cada frente é uma feature SDD em `tasks/prd-[slug]/`, executável por `sdd-orquestrar-tasks`. Contratos e tasks seguem as skills donas, que esta sessão executa ela mesma; esta skill recorta, sequencia e mantém o **mapa de destinos**, que liga cada achado à frente e à task que o resolve. Subagentes são exploradores somente leitura. O relatório é imutável e nenhum código é alterado.

1. **Fixar o relatório.** Resolva `.audits/architectural-analysis-[timestamp].md` por argumento; sem ele, use o mais recente pelo timestamp e informe a escolha. Argumento que não resolve com outros relatórios presentes: liste-os e peça escolha. Sem nenhum relatório, pare sem gravar nada e indique ao usuário rodar `architectural-analysis`, que só ele invoca. Leia o relatório resolvido uma vez. Procure o mapa `.audits/architectural-analysis-[timestamp].destinos.md`: existente, reutilize IDs, frentes e estados, e altere-o somente com `--atualizar`. Quando o mapa listar frentes, procure nas pastas delas um `snapshot-contexto.md` com `status: ativo` e, se houver, carregue-o pelo ramo Carregar da skill `sdd-snapshot` e retome pelo próximo passo dele.
   Localize `sdd-planejar-refatoracao`, `sdd-criar-prd`, `sdd-criar-techspec` e `sdd-planejar-tasks` no catálogo instalado ou em `SKILLS/`. Skill ausente bloqueia só a rota que depende dela.
   **Saída:** relatório exato, mapa anterior e snapshot reconciliados e skills de cada rota localizadas; ou parada sem arquivos gravados, com a ausência do relatório reportada.
2. **Inventariar achados.** Percorra as cinco dimensões — código morto, duplicação, anti-padrões, tipos e nulidade, smells — pelo conteúdo, não pelos títulos: relatórios reais renomeiam seções, escrevem achados em prosa e registram falsos positivos corrigidos. Cada linha de tabela, grupo de duplicação ou hotspot descrito recebe `AA-NN` por ordem de aparição, com dimensão, `arquivo:linha`, severidade ou confiança e recomendação. Contagem agregada além dos itens listados vira um único achado da regra, com a contagem como baseline; sem arquivos nomeados, ele só entra numa frente a pedido do usuário e, fora disso, fica adiado. Resumo, estatísticas, impacto, "None found" e falso positivo corrigido são contexto e não recebem ID.
   Confira cada achado no menor trecho do código atual — o relatório envelhece. Com muitos achados, divida a conferência por dimensão ou diretório entre exploradores somente leitura em paralelo, que devolvem a classe proposta e a evidência citada; esta sessão atribui a classe final. Classifique: **acionável** (confirmado), **resolvido** (não existe mais), **descartado** (evidência contrária citada) ou **pendente** (depende de decisão ou ambiente). Para `Possibly dead`, confiança LOW e uso por reflexão ou configuração, rode antes a verificação que o relatório nomeia; só o que ela não decide fica pendente.
   **Saída:** todo achado tem ID, classe e evidência atual.
3. **Recortar frentes.** Agrupe acionáveis por causa, com um resultado revisável por frente: código morto confirmado; um grupo de duplicação ou contrato; um god object ou fronteira de camada; defeitos com caminho de falha concreto (async misuse, captive dependency, exceção engolida); postura de nulidade por projeto; smells locais por arquivo alvo. Una achados que a mesma extração resolve — `Prioritized Actions` e `Risk Areas` apontam esse acoplamento. Ordene remoção antes de consolidação e consolidação antes de decomposição; arquivo alvo compartilhado entre frentes vira dependência explícita. Nomeie `arq-[AAAAMMDD]-[NN]-[frente]` com a data do relatório.
   Decida a rota de cada frente — é aqui que se decide se a TechSpec é necessária:

   | Frente | Rota |
   | --- | --- |
   | Preserva comportamento observável: remoção, consolidação, decomposição, acoplamento, camadas, tipos, smells | `sdd-planejar-refatoracao` grava `prd.md` e `techspec.md` |
   | Corrige defeito e muda comportamento observável: falha passa a ser registrada ou propagada, bloqueio síncrono vira async | `sdd-criar-prd`, depois `sdd-criar-techspec` |
   | `tasks/prd-[slug]/` já tem PRD e TechSpec válidos para o escopo | Reutilizada: nenhum contrato novo |

   Ao gravar o mapa, leia integralmente [assets/destinos.template.md](assets/destinos.template.md); frentes entram como `proposta`.
   **Saída:** todo acionável pertence a exatamente uma frente; cada frente tem rota e dependências sem ciclo; mapa gravado.
4. **Aprovar o recorte.** Apresente cada frente com slug, `AA-NN`, rota, dependências e risco, e liste à parte resolvidos, descartados e pendentes. Pergunte quais frentes planejar — pela tool de perguntas disponível (`AskUserQuestion`) quando as opções couberem, em texto quando não — e aceite reagrupamento. Frente não escolhida vira `adiada` no mapa com seus achados.
   **Saída:** cada frente `aprovada` ou `adiada` por resposta do usuário, registrada no mapa; `tasks/` intacto até ela.
5. **Gerar contratos.** Para cada frente aprovada e não reutilizada, na ordem de dependência, siga nesta sessão a skill da rota com slug, achados da frente (ID, `arquivo:linha`, evidência atual, recomendação) e frentes irmãs como limite. Mantenha `AA-NN` como ID de obrigação no escopo do PRD e nos `DEC-NN`/`QA-NN` da TechSpec que o eliminam: é por ele que as tasks herdam a rastreabilidade. Na rota de refatoração, as contagens do achado são o baseline do perfil de qualidade e a meta é eliminá-las. Exploradores somente leitura podem rastrear várias frentes em paralelo; esta sessão grava os contratos de uma frente por vez.
   Após cada frente, exceto a última, faça a pausa de sessão de `continuidade-sessao.md` com etapa `planejamento` e a próxima frente como próximo passo; snapshot gravado vai para a pasta dessa frente e o anterior é marcado `substituido`.
   Apresente os contratos gravados num único HIL — comportamentos preservados, decisões e pendências de todas as frentes — antes de decompor; corrija pela skill dona o que for recusado.
   **Saída:** cada frente aprovada tem `prd.md` e `techspec.md` aceitos, ou bloqueio com causa concreta que afeta só ela.
6. **Planejar tasks.** Para cada frente com contratos aceitos, siga `sdd-planejar-tasks --prd [slug]` nesta sessão. Regras, templates, perfil de validação e gate de cobertura são os dela, aplicados sem adaptação local. Faça a pausa de sessão entre frentes como no passo 5.
   **Saída:** cada frente tem `tasks.md` e `task_*.md` com gate de cobertura preenchido, ou bloqueio devolvido pela skill.
7. **Fechar o mapa.** Registre em cada `AA-NN` a frente e as tasks que o cobrem, lidas da matriz de rastreabilidade de `tasks.md`, ou seu destino final. Confira que todo acionável de frente planejada aparece em pelo menos uma task e que links do mapa resolvem. Apresente frentes, ordem de execução, riscos e pendências; a autorização de implementação fica com o usuário. Aponte o próximo passo do snapshot para `sdd-orquestrar-tasks` na primeira frente, ou marque-o `encerrado`.
   **Saída:** nenhum achado sem destino no mapa; execução indicada como `sdd-orquestrar-tasks --prd [slug]` na ordem do mapa.

Relatório novo sobre código com mapa anterior: reconcilie achados por arquivo e regra, preserve frentes em andamento e numere frentes novas após a maior existente. Frente cuja fonte muda durante o planejamento invalida só os próprios derivados.
