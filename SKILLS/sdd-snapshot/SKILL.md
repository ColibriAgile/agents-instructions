---
name: sdd-snapshot
description: Snapshot SDD para gravar, atualizar ou carregar o contexto destilado de uma sessão em tasks/prd-[slug]/snapshot-contexto.md. Use ao salvar o que a sessão aprendeu antes de pausar ou limpar o contexto, inclusive quando o ContextBrake pedir registro de progresso, ou ao retomar uma feature que tem snapshot. Não use para checkpoint do fluxo, handoff de task nem artefatos SDD.
argument-hint: [--prd nome-da-feature]
---

# Snapshot SDD

O snapshot leva o que uma sessão aprendeu para a próxima, limitado ao que o próximo passo precisa. É uma tabela de roteamento de contexto: poucos fatos inline que não existem em outro lugar, mais ponteiros que dizem quando carregar cada fonte durável. É pista, nunca autoridade: PRD, TechSpec, manifesto, tasks, handoffs, relatórios, checkpoint e código vencem em conflito, e a entrada divergente é descartada.

| Ramo | Quando | Siga |
| --- | --- | --- |
| Gravar | Chamada sozinha, pela pausa de sessão de outra skill SDD, ou quando o ContextBrake pedir para registrar progresso | Os passos de [Gravar](#gravar) |
| Carregar | Uma skill SDD começa ou retoma trabalho numa feature com `snapshot-contexto.md` | Leia integralmente [references/carga.md](references/carga.md) e aplique seu protocolo |

## Local

- Skills de uma única feature: `tasks/prd-[slug]/snapshot-contexto.md`. Todas as etapas dessa feature (planejamento, tasks, correções, revisão) regravam o mesmo arquivo.
- Skills que abrangem várias features (`sdd-orquestrar-prds`, `sdd-planejar-auditoria`): a pasta da próxima feature a trabalhar, criando a pasta só com o snapshot quando ela ainda não existir. O snapshot anterior da mesma execução recebe `status: substituido` e `substituido_por`, para que só um fique `ativo`.

## Estrutura

O template [assets/snapshot-contexto.template.md](assets/snapshot-contexto.template.md) tem quatro partes, na ordem de leitura:

1. **Cabeçalho**: `status` (`ativo`, `substituido` ou `encerrado`), `gerado`, `etapa` (`planejamento`, `tasks`, `correcoes`, `revisao` ou `aceite`), `fonte_etapa` (manifesto, pasta da revisão ou mapa de onde a etapa trabalha), `cobre_ate` (última unidade concluída da etapa: ID da task, artefato ou relatório), `autoria_codigo` (`sim` quando a sessão que gravou alterou código, dado que a regra de independência da revisão usa), `git_head`, `worktree`, `proximo_passo` (skill e unidade) e `outros_elegiveis`.
2. **Mapa de carga**: as camadas abaixo, para que o leitor saiba quando cada entrada vale antes de ler as entradas.
3. **Resumo do próximo passo**: a camada `agora`, escrita para `proximo_passo`.
4. **Entradas**: uma linha cada, nas seções `Decisões`, `Aprendizados`, `Mapa de código` e `Pendências abertas`, neste formato:

   `- [ID] (quando: camada: gatilho; gatilho) resumo — fonte: caminho#seção; até: condição`

   - `ID`: `D-NN` decisão, `A-NN` aprendizado, `M-NN` mapa de código, `P-NN` pendência. IDs ficam estáveis entre regravações para que outras entradas e handoffs possam citá-los.
   - `quando`: a camada de carga e seus gatilhos. Gatilhos são IDs de task ou achado (`T04`, `CR-03`), globs de caminho (`src/Modulo.Infra/**`), IDs de rastreabilidade (`DEC-04`, `RF-17`), etapas (`revisao`), comandos (`dotnet test`) ou eventos (`em falha: arquivo bloqueado`).
   - `fonte`: onde está o detalhe completo, carregado só quando o resumo não basta. `—` quando o resumo é o único registro.
   - `até`: quando a entrada expira (`T06 concluída`, `DEC-18 substituída`, `próxima sessão`). Entradas expiradas saem na próxima gravação.

Uma linha por entrada mantém a carga seletiva barata: `Grep` por `quando:.*T04` ou por um trecho de caminho encontra as entradas de uma unidade sem ler o resto.

### Camadas de carga

| Camada | Carregar quando | Exemplos |
| --- | --- | --- |
| `agora` | No início da sessão, antes de escolher trabalho | Cabeçalho, resumo do próximo passo, pendências aguardando o usuário |
| `ao-selecionar` | Depois de escolher a unidade, se um gatilho casar com seu ID, arquivos afetados ou IDs de rastreabilidade | Decisão que restringe a API de um repositório para T04 |
| `ao-editar` | Logo antes de editar ou criar um caminho que case | Peculiaridade de migração para `src/Modulo.Infra/**` |
| `ao-executar` | Logo antes de rodar um comando que case, ou logo depois de ele falhar | Projeto de teste que exige filtro para excluir E2E |
| `sob-demanda` | Só quando um resumo for insuficiente; vale para todo ponteiro `fonte:` | Texto do achado da revisão anterior |

Entrada sem gatilho que case não é carregada para a unidade. O leitor decide por camada, não uma única vez: gatilhos novos disparam conforme o trabalho chega a caminhos, comandos ou falhas novos.

## Gravar

1. **Resolver o arquivo.** Use a feature de `--prd` ou a que a skill chamadora nomear. Chamada sozinha sem argumento, use a feature em que esta sessão trabalhou (pasta `tasks/prd-*` lida ou gravada na conversa); sem ela, o único `snapshot-contexto.md` com `status: ativo`. Com vários candidatos ou nenhum, pergunte qual pela tool de perguntas do host (`AskUserQuestion` no Claude Code), oferecendo as pastas `tasks/prd-*` existentes; um slug novo cria a pasta só com o snapshot. Arquivo existente é atualizado; ausente é criado a partir do template, lido integralmente.
   **Saída:** um único caminho resolvido e se a gravação atualiza ou cria.
2. **Estabilizar.** Aguarde exploradores e processos terminarem. Grave com a unidade registrada (artefato gravado, task movida, manifesto ou mapa consistentes); com uma unidade em andamento, caso comum quando o ContextBrake pede, registre antes o estado parcial e as pendências no handoff dela.
   **Saída:** nenhum explorador ou processo em execução, e todo estado da unidade num arquivo durável.
3. **Destilar.** Parta do snapshot anterior, se existir. Descarte cada entrada expirada, substituída, contrária às fontes atuais ou promovida a arquivo durável que o próximo passo lerá de qualquer forma; mantenha os IDs das que sobreviverem. Acrescente o que esta sessão produziu, com cada resumo acionável sem a conversa: o fato e sua consequência, não a história.

   | Inclua | Deixe de fora |
   | --- | --- |
   | Decisões tomadas na sessão que nenhum arquivo durável registra ainda, com ponteiro para onde deveriam morar | O que PRD, TechSpec, contrato da task, relatório ou handoff já dizem |
   | Aprendizados: convenções do código, peculiaridades do ambiente, comandos que falham e por quê, abordagens tentadas e descartadas | Transcrição da conversa, narrativa de raciocínio ou elogios |
   | Conclusões de exploradores ainda úteis ao próximo passo, como `caminho:símbolo` ou `caminho:linha` no Git head atual | Conteúdo de arquivos, blocos de código, diffs, logs ou saída de testes |
   | Pendências abertas: itens pendentes, hits de ressalva, bloqueios e perguntas aguardando o usuário | Segredos, credenciais ou dados de usuário |

   Prefira promover uma decisão durável para seu lugar real (o artefato em redação, o handoff da task, `Problemas e soluções` no manifesto ou `workflow.md` sob o fluxo) e deixar aqui só um resumo de uma linha com ponteiro. Dê a cada entrada a camada e os gatilhos mais estreitos que ainda peguem todo caso em que ela importa: `agora` é para o que a próxima sessão precisa saber antes de escolher; a maioria pertence a `ao-selecionar`, `ao-editar` ou `ao-executar`. Mantenha o arquivo abaixo de 8 KiB; ao passar disso, pode antes de acrescentar.
   **Saída:** toda entrada tem ID, camada, gatilhos, fonte e expiração, e nenhuma depende desta conversa para ser entendida.
4. **Reescrever resumo e cabeçalho.** O resumo do próximo passo diz por que ele é o próximo, skill e unidade, fontes mínimas a ler primeiro, pontos de mudança conhecidos e IDs de entradas aplicáveis; com várias unidades elegíveis, nomeie a recomendada e liste as demais. No cabeçalho, `git_head` é `git rev-parse --short HEAD`; `worktree` é `limpo` ou uma contagem curta com os caminhos de primeiro nível alterados; `autoria_codigo` é `sim` se esta sessão alterou código desde a última revisão, e caso contrário mantém o valor anterior até um relatório de revisão cobri-lo.
   **Saída:** cabeçalho com valores atuais e resumo escrito para `proximo_passo`.
5. **Gravar e conferir.** Substitua o arquivo inteiro e releia-o para conferir o cabeçalho e que todo caminho `fonte:` existe. Termine informando caminho e tamanho e imprimindo o comando de retomada; sob a pausa de sessão, eles entram na mensagem dela, uma única vez. Quando a gravação atende a um pedido do ContextBrake, termine a resposta com `[REQUEST_SESSION_RESET]`.
   **Saída:** a próxima sessão consegue escolher a próxima unidade, sabe quais entradas valem para ela e quando, e tem o comando para começar.

### Comando de retomada

Sozinho num bloco de código, pronto para colar depois de `/clear` ou numa sessão nova: prefixo de invocação do host (`/` no Claude Code, `$` no Codex), a skill e os argumentos do `argument-hint` dela preenchidos com os valores atuais, sem placeholders. A skill é `sdd-orquestrar-fluxo` quando a pasta da feature tem `checkpoint.json` não concluído; caso contrário, a de `proximo_passo`. Exemplo: `/sdd-orquestrar-fluxo --prd loja-01-checkout`.

## Falhas

- Na zona `CRITICAL` o ContextBrake bloqueia a gravação do snapshot: registre o progresso no plano e checkpoint dele, que continuam permitidos, e informe que o snapshot não foi gravado.
- Falha de escrita mantém a versão anterior intacta; informe o erro em vez de anunciar snapshot pronto.
