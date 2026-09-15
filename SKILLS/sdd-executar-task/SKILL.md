---
name: sdd-executar-task
description: Execução de uma task SDD exata na sessão atual, avulsa ou como passo de sdd-orquestrar-tasks; não planeja nem aprova o próprio trabalho.
argument-hint: --task tasks/prd-nome/task_01.md
---

# Executar uma task SDD

1. Resolva uma única `tasks/prd-[slug]/task_[num].md`. Exija PRD, TechSpec e manifesto da feature. Quando `snapshot-contexto.md` existir na pasta da feature e nenhum orquestrador desta sessão já o tiver carregado, aplique o protocolo de carga de `references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks`. Leia fontes estáveis uma vez por versão na ordem PRD, TechSpec, task; consulte estado depois. Confirme dependências concluídas e task pendente. Task em `done/` é apenas reportada.
   **Saída:** contrato exato, dependências satisfeitas e escopo de escrita identificado.
2. Leia instruções locais e somente skills pertinentes à mudança. Inspecione worktree, callers e testes afetados; preserve alterações preexistentes. Responda perguntas pontuais com buscas diretas; envie subagente explorador somente leitura só para varreduras em muitos arquivos e confira as linhas que ele citar antes de editar. Mapeie todo aceite a implementação e evidência.
   **Saída:** pontos de mudança conhecidos; conflitos de fontes ou de escrita levantados antes da mutação.
3. Implemente a menor mudança coerente e testes de comportamento proporcionais ao risco. Marque subtarefas só com evidência. Edite apenas arquivos atribuídos e a própria task; manifesto e movimentos pertencem ao passo de registro do orquestrador, ou ao chamador em uso avulso.
   **Saída:** implementação limitada ao contrato, sem estado global alterado.
4. Aplique o perfil da TechSpec. Em desktop C#/.NET, omita E2E, inclusive quando comando legado os incluir: selecione projetos/filtros sem E2E e registre a divergência. Preserve aceite com unitários, integração e roteiro manual pertinente; manual não executado permanece pendente. Se disponível, use `dotnet-efficient-validation` para runner e reutilização de build.
   Execute as verificações necessárias ao diff; reúse evidência somente do mesmo código, configuração e ambiente. Zero testes ou listagem não são sucesso. Registre falhas preexistentes separadamente.
   Rode também os comandos do perfil de qualidade da TechSpec, escopados aos arquivos que você tocou. Saída vazia encerra o assunto. Confronte cada hit com o Baseline do terreno: hit já listado lá é dívida anterior e não é seu, salvo quando sua mudança o agravou. Hit bloqueante novo, sem `DEC-NN` que o cubra, é defeito seu: corrija antes do handoff, não o reporte como pendência. Hit de ressalva novo permanece e vai ao handoff com arquivo e linha. Perfil ou baseline ausentes na TechSpec são registrados como lacuna, não supridos por conta própria.
   **Saída:** cada aceite tem evidência ou bloqueio reproduzível; nenhum hit bloqueante não justificado sobrevive no diff.
5. Atualize um único `## Handoff`: resultado, arquivos, comandos, resultados, versão validada, hits de ressalva do perfil de qualidade e pendências. Retorne resumo curto e caminho para revisão; em retry, altere a mesma seção e preserve evidências válidas. Em uso avulso, termine com a pausa de sessão de `continuidade-sessao.md` (etapa `tasks`, `autoria_codigo: sim`), nomeando a revisão como próximo passo.
   **Saída:** handoff suficiente para revisar diff, testes e aceite; task permanece na raiz até aprovação.

## Decisões e falhas

- Registre candidata a ADR só para decisão duradoura com alternativas e trade-off que governe contratos, fronteiras ou atributos de qualidade. Use `TXX-ADR-NN`, título, contexto, decisão, alternativas, consequências, evidência e relação com TechSpec; caso contrário, `Nenhuma`. A promoção ocorre depois de QA.
- Desvio arquitetural ou de escopo exige decisão humana, salvo autorização existente que o cubra. Registre o conflito e leve-o ao usuário ou ao chamador; não invente aprovação.
- Ambiente indisponível ou dependência pendente mantém aceite afetado sem marcar; registre comando/erro/impacto. Retry corrige somente a falha; após duas tentativas sem evidência nova, levante bloqueio para decisão.
