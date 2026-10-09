# Modo autônomo

Vale quando o checkpoint da feature tem `mode: auto`. Sem a chave, ou com `monitorado`, este arquivo não se aplica e o fluxo segue como sempre.

No modo auto, o usuário delega as decisões do fluxo para conduzir a feature do pedido ao aceite sem acompanhar a sessão. Quem responde os gates é esta sessão, apoiada nas specs; quem cuida do contexto é o ContextBrake, que grava o snapshot, limpa a sessão e retoma o fluxo numa sessão nova. Por isso a qualidade de PRD e TechSpec decide a qualidade das escolhas: cada decisão precisa de base em requisito, decisão técnica, instrução local ou código, e o log mostra qual foi.

## Ativar e trocar

- `--modo auto` em `sdd-orquestrar-fluxo` ou em `sdd-triar`, que o repassa ao fluxo. O fluxo grava `mode` no checkpoint ao criá-lo e registra a ativação em `workflow.md` como decisão humana: é ela que autoriza as decisões autônomas dentro deste protocolo.
- `decision_log` recebe `decisoes-autonomas.md` por padrão no modo auto. `--log-decisoes <caminho>` troca o arquivo (relativo à pasta da feature); `--log-decisoes false` grava `null` e desliga o log, decisão que também vai para `workflow.md`.
- Retomada sem `--modo` mantém o modo do checkpoint. `--modo` diferente do gravado troca o modo e é registrado em `workflow.md`. Em `monitorado`, as decisões autônomas anteriores continuam válidas.
- Com recorte em vários PRDs ou frentes, cada checkpoint aberto herda `mode` e `decision_log`.
- O nível escolhido por `sdd-triar` em modo auto, antes de existir a pasta da feature, vira a primeira entrada do log quando o fluxo cria a pasta.

## Conferir o ContextBrake

Uma vez por sessão, no início, leia `context-brake.config.json` na raiz do repositório, e nada mais do ContextBrake. Avise em uma linha por item, sem bloquear, e registre no log só os avisos que ele ainda não tem, porque cada reinício é uma sessão nova:

| Condição | Consequência a informar |
| --- | --- |
| Arquivo ausente | Sem reinício automático: a sessão depende da compactação do harness; o checkpoint gravado em cada fronteira mantém a retomada possível |
| Harness atual fora de `activeHarnesses` | Sem telemetria nesta sessão |
| Sem bloco `autoRestart` | O snapshot é gravado, mas a sessão não é limpa nem retomada sozinha |
| `autoRestart.maxConsecutiveRestarts` abaixo de 5 | Uma execução longa para depois de poucos reinícios sem prompt digitado |
| `snapshot.command` não nomeia `sdd-snapshot` | O pedido de snapshot não segue o ramo Gravar |
| `snapshot.resumeCommand` não nomeia `sdd-orquestrar-fluxo` | A sessão nova não retoma este fluxo |

Quando houver aviso, sugira o comando que corrige tudo de uma vez: `npx context-brake init --auto-restart --max-restarts 10 --snapshot-command "/sdd-snapshot" --resume-command "/sdd-orquestrar-fluxo"`.

## Decidir sem perguntar

Em todo ponto em que o modo monitorado perguntaria ao usuário — gates HIL 0 a 3, exceção, ressalvas, conferência visual, perguntas das skills de etapa que este fluxo executa e escolhas da pausa de sessão —:

1. Monte a pergunta como ela seria feita: contexto, opções e a recomendada.
2. Confira a rubrica de escalonamento abaixo. Se algum item vale, escalone.
3. Sem escalonamento, escolha a opção recomendada. Sem recomendação clara, prefira, nesta ordem, a que preserva o contrato aprovado, a mais reversível e a de menor escopo. Lacuna de produto vira premissa explícita no próprio artefato, com o ID do log.
4. Registre no log antes de agir e registre em `workflow.md` a decisão com proveniência `autonoma` e o ID do log; `approved_sources` aponta para esse registro. Siga sem esperar.

Problema durante a execução (teste falhando, ambiente instável, ambiguidade de implementação) segue as regras de retry e bloqueio das skills de etapa. Task bloqueada fica registrada e a execução segue pelas demais elegíveis; o escalonamento só acontece quando nenhuma unidade independente resta.

Desvio que a TechSpec não decide, como um detalhe de implementação que ela deixa aberto, é resolvido pela alternativa coerente com os `DEC-NN` e os padrões do código, e registrado no handoff da task e no log. Desvio que contradiz um `DEC-NN` ou o escopo do PRD escalona.

### Rubrica de escalonamento

Pergunte ao usuário somente quando a decisão:

- é irreversível ou destrutiva: migração que descarta dado, remoção de dado do usuário, mudança de formato persistido sem caminho de volta;
- dispara ação externa não autorizada no pedido: push, deploy, publicação, envio de mensagens, chamada a serviço pago ou de produção;
- toca área crítica declarada pelas instruções locais (pagamento, fiscal, autenticação, caixa, segurança) e PRD e TechSpec não a decidem;
- muda o escopo aprovado do PRD, acrescentando ou removendo obrigação;
- depende de contradição entre PRD, TechSpec e código sem base nas specs para escolher;
- depende de ambiente, credencial ou validação manual essencial indisponível, sem outra unidade elegível;
- atinge a regra de estagnação do fluxo (duas rodadas de correção sem progresso);
- não tem nenhuma opção sustentável pelas fontes.

Ao escalonar: conclua antes as unidades independentes, grave o checkpoint com `status: aguardando-hil` e `pending_hil`, grave o snapshot, registre o escalonamento no log e pergunte como no modo monitorado. Não termine a resposta com `[REQUEST_SESSION_RESET]`: o reinício cairia de novo na mesma pergunta sem ninguém para responder.

### Gates

| Gate | Decisão autônoma |
| --- | --- |
| HIL 0 | Nível da rubrica de `sdd-triar`; `pontual` segue o ramo pontual dela |
| Recorte de PRDs ou frentes | A divisão proposta pela skill dona |
| HIL 1 | Aprova o PRD depois da conferência de cobertura; pendência bloqueante vira premissa registrada ou escalonamento |
| Refatoração preparatória | Segue a recomendação da TechSpec |
| HIL 2 | Aprova TechSpec e plano depois das conferências da skill; autoriza implementação e correções dentro do contrato |
| Exceção | Rubrica de escalonamento |
| Ressalvas | Corrige as ressalvas que cabem no contrato aprovado sem ampliar escopo; as demais viram pendências aceitas no log |
| Conferência visual | Registra o roteiro como aceite manual pendente e segue para a revisão |
| HIL 3 | Aceite automático, abaixo |

**Aceite automático.** Com a última revisão `APROVADO`, ou `APROVADO COM RESSALVAS` com as ressalvas destinadas, nenhuma obrigação bloqueante aberta e nenhuma validação manual essencial pendente, marque o checkpoint `concluido`, o snapshot `encerrado` e registre no log `aceite automático` com o caminho da revisão. Conferência visual ou outra validação manual essencial pendente impede a conclusão: escalone, com o roteiro de aceite manual e o resumo do log no HIL 3. Candidatas a ADR e pendências aceitas entram no resumo final, porque a remoção futura dos artefatos as levaria junto.

## Contexto e sessão

No modo auto, o fluxo não estima o uso de contexto nem pergunta sobre continuidade. Em cada fronteira da pausa de sessão:

| Situação | Destino |
| --- | --- |
| Sem telemetria do ContextBrake, ou telemetria abaixo da zona de gatilho | Seguir, informando a unidade concluída e a próxima |
| Telemetria pedindo o snapshot (zona de gatilho, `RED` ou `CRITICAL`) | Em `RED`, termine a unidade como no modo monitorado; em `CRITICAL`, pare no próximo ponto consistente com o estado parcial no handoff. Depois grave o checkpoint `pausado` com `safe_to_stop: true` (checkpoint `ativo` faria a sessão nova suspeitar de outro coordenador), grave o snapshot pela skill `sdd-snapshot` e termine a resposta com `[REQUEST_SESSION_RESET]`, sem pergunta |
| Revisão como próximo passo e esta sessão escreveu o código, sem revisor delegado elegível | O mesmo caminho do snapshot com `[REQUEST_SESSION_RESET]`: a sessão nova não é autora do código e roda a revisão |
| Escalonamento | Rubrica acima, sem `[REQUEST_SESSION_RESET]` |

Sem ContextBrake, a sessão segue até a compactação do harness; o checkpoint gravado em cada fronteira basta para retomar.

## Retomada sem argumentos

A sessão nova chega pelo `resumeCommand` do ContextBrake, sem `--prd`. Com mais de um checkpoint não concluído, retome o de `mode: auto` que não esteja `aguardando-hil` e foi gravado por último (data de modificação do arquivo); entre recortes de mesmo prefixo, o próximo na ordem de dependência. Persistindo a dúvida, escalone.

## Log de decisões

Arquivo em `tasks/prd-[slug]/[decision_log]`, só acrescentado, nunca reescrito. Cria com o título `# Decisões autônomas — [slug]` e uma entrada por decisão, aviso ou escalonamento:

```markdown
## AUTO-NN — [gate ou skill/passo] — [AAAA-MM-DD HH:MM]

- Pergunta: [como seria feita ao usuário]
- Opções: [A (recomendada) — efeito]; [B — efeito]
- Escolha: [opção] | Escalonada: [item da rubrica]
- Motivo: [fato e fonte, com IDs RF/RNF/DEC/TC/CR ou caminho:linha]
- Reversão: [como desfazer e custo]
```

IDs `AUTO-NN` são estáveis e citados em `workflow.md`, handoffs e premissas. O resumo final do HIL 3, automático ou escalonado, lista as decisões de maior impacto pelo ID.
