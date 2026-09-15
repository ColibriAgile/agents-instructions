# Continuidade de sessão

As skills SDD gravam artefatos e código na sessão que as executa; subagentes são exploradores somente leitura. O trabalho acumula num único contexto, e este protocolo permite ao usuário encerrar a sessão em pontos seguros sem perder o que ela aprendeu. Tem duas partes: a pausa de sessão e o snapshot de contexto que a pausa pode gravar.

## Pausa de sessão

Pergunte nos pontos que a skill chamadora indicar (entre tasks, entre recortes ou frentes, nos gates HIL e antes da revisão), somente com gravações persistidas e nenhum explorador ou processo em execução. Use a tool de perguntas do host (`AskUserQuestion` no Claude Code) ou pergunta textual quando não houver. Informe em uma linha o que acabou de terminar, o próximo passo e, quando houver telemetria de contexto visível (bloco ContextBrake ou uso reportado pelo harness), a zona atual; sem telemetria, estime pelo volume de trabalho acumulado na sessão. Coloque a opção recomendada primeiro, marcada `(Recomendado)`:

| Opção | Quando recomendar | Efeito |
| --- | --- | --- |
| Continuar nesta sessão | Zona verde e o próximo passo aproveita a maior parte do contexto carregado | Prossiga |
| Snapshot e continuar | Zona verde ou amarela, mas a sessão produziu decisões ou aprendizados que valem proteger da compactação | Grave o snapshot e prossiga |
| Snapshot e encerrar sessão | Zona amarela ou vermelha, uma unidade longa acabou, o próximo passo exige outra parte do código, ou vale a regra de independência abaixo | Grave o snapshot, informe a instrução de retomada e encerre o turno |
| Encerrar sem snapshot | Nada aprendido além do que artefatos, handoffs e manifestos já registram | Informe a instrução de retomada e encerre o turno |

- **Independência.** Quando o próximo passo é `sdd-revisar-codigo` e esta sessão escreveu ou alterou código que a revisão vai julgar, recomende **Snapshot e encerrar sessão** qualquer que seja a zona e diga por quê: a revisão precisa de uma sessão que não é autora do código. Se o usuário continuar mesmo assim, registre a limitação onde o chamador guarda decisões (`workflow.md` sob `sdd-orquestrar-fluxo`) e nas limitações do relatório.
- **Gates.** Num gate HIL, faça juntas a pergunta do gate e a da sessão. Encerrar a sessão não aprova o gate, e aprovar não escolhe a sessão.
- **Instrução de retomada.** `Use $<skill> para continuar <feature ou unidade> neste repositório.`, nomeando a skill dona do próximo passo; sob `sdd-orquestrar-fluxo`, é sempre o fluxo. Ao encerrar, não inicie trabalho, explorador ou processo depois da resposta. Silêncio não inicia nada.

## Snapshot de contexto

O snapshot leva o que uma sessão aprendeu para a próxima, limitado ao que o próximo passo precisa. É uma tabela de roteamento de contexto: poucos fatos inline que não existem em outro lugar, mais ponteiros que dizem quando carregar cada fonte durável. Nunca substitui PRD, TechSpec, manifesto, tasks, handoffs, relatórios ou código; quando divergem, eles vencem e a entrada do snapshot é descartada.

### Local

- Skills de uma única feature: `tasks/prd-[slug]/snapshot-contexto.md`. Todas as etapas dessa feature (planejamento, tasks, correções, revisão) regravam o mesmo arquivo.
- Skills que abrangem várias features (`sdd-orquestrar-prds`, `sdd-planejar-auditoria`): a pasta da próxima feature a trabalhar, criando a pasta só com o snapshot quando ela ainda não existir. O snapshot anterior da mesma execução recebe `status: substituido` e `substituido_por`, para que só um fique `ativo`.

### O que entra

| Inclua | Deixe de fora |
| --- | --- |
| Decisões tomadas na sessão que nenhum arquivo durável registra ainda, com ponteiro para onde deveriam morar | O que PRD, TechSpec, contrato da task, relatório ou handoff já dizem |
| Aprendizados: convenções do código, peculiaridades do ambiente, comandos que falham e por quê, abordagens tentadas e descartadas | Transcrição da conversa, narrativa de raciocínio ou elogios |
| Conclusões de exploradores ainda úteis ao próximo passo, como `caminho:símbolo` ou `caminho:linha` num Git head conhecido | Conteúdo de arquivos, blocos de código, diffs, logs ou saída de testes |
| Pendências abertas: itens pendentes, hits de ressalva, bloqueios e perguntas aguardando o usuário | Segredos, credenciais ou dados de usuário |

Prefira promover uma decisão durável para seu lugar real (o artefato em redação, o handoff da task, `Problemas e soluções` no manifesto ou `workflow.md` sob o fluxo) e deixar aqui só um resumo de uma linha com ponteiro. Mantenha o arquivo abaixo de 8 KiB; ao passar disso, pode antes de acrescentar.

### Estrutura

O template em [../assets/snapshot-contexto.template.md](../assets/snapshot-contexto.template.md) tem quatro partes, na ordem de leitura:

1. **Cabeçalho**: `status` (`ativo`, `substituido` ou `encerrado`), `gerado`, `etapa` (`planejamento`, `tasks`, `correcoes`, `revisao` ou `aceite`), `fonte_etapa` (manifesto, pasta da revisão ou mapa de onde a etapa trabalha), `cobre_ate` (última unidade concluída da etapa: ID da task, artefato ou relatório), `autoria_codigo` (`sim` quando a sessão que gravou alterou código, dado que a regra de independência usa), `git_head`, `worktree`, `proximo_passo` (skill e unidade) e `outros_elegiveis`.
2. **Mapa de carga**: as camadas abaixo, para que o leitor saiba quando cada entrada vale antes de ler as entradas.
3. **Resumo do próximo passo**: a camada `agora`, escrita para `proximo_passo`.
4. **Entradas**: uma linha cada, nas seções `Decisões`, `Aprendizados`, `Mapa de código` e `Pendências abertas`, neste formato:

   `- [ID] (quando: camada: gatilho; gatilho) resumo — fonte: caminho#seção; até: condição`

   - `ID`: `D-NN` decisão, `A-NN` aprendizado, `M-NN` mapa de código, `P-NN` pendência. Mantenha IDs estáveis entre regravações para que outras entradas e handoffs possam citá-los.
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

Entrada sem gatilho que case não é carregada para esta unidade. O leitor decide por camada, não uma única vez: gatilhos novos disparam conforme o trabalho chega a caminhos, comandos ou falhas novos.

### Protocolo de carga

1. Localize o snapshot como a skill chamadora indicar. Leia cabeçalho e mapa de carga. Abaixo de 8 KiB, leia o arquivo inteiro numa chamada; acima, leia até o fim do resumo do próximo passo e use `Grep` para as entradas.
2. Valide o cabeçalho:
   - `cobre_ate` contra a fonte da etapa (`Estado` do manifesto, `done/` da revisão ou mapa). Se a fonte mostrar mais progresso, o snapshot está atrasado: mantenha as entradas, mas trate o resumo do próximo passo como obsoleto e selecione de novo.
   - `git_head` contra `git rev-parse HEAD`, e `worktree` contra `git status --porcelain`. Com arquivos alterados desde o snapshot, entradas cujos gatilhos ou `fonte` casem com esses caminhos são suspeitas: confira antes de confiar.
   - `substituido` manda seguir `substituido_por`. `encerrado` significa que a etapa descrita terminou; reporte e não retome a partir dele.
   - Cabeçalho ilegível transforma o arquivo inteiro em lista de pistas: rederive o estado pela fonte da etapa e confira qualquer entrada antes de usar.
3. **Etapa independente.** Uma sessão que executa `sdd-revisar-codigo` carrega só cabeçalho, resumo do próximo passo, `Pendências abertas` e entradas `ao-executar` (fatos de ambiente e comandos). Pula `Decisões`, `Mapa de código` e os demais `Aprendizados`, que carregam o enquadramento do autor, e deriva das fontes o que julga. Se esta própria sessão escreveu o código em revisão, pare e aplique a regra de independência da pausa de sessão.
4. Carregue a camada `agora`. Para pendências aguardando o usuário, pergunte antes de iniciar o trabalho que elas bloqueiam.
5. Depois de escolher a unidade, carregue as entradas `ao-selecionar` que casarem. Mantenha em vista os gatilhos `ao-editar` e `ao-executar` e carregue essas entradas quando o trabalho chegar a eles.
6. Siga um ponteiro `fonte:` só quando o resumo deixar uma dúvida que o trabalho precisa responder, lendo apenas a seção citada.

### Protocolo de gravação

Grave somente com a unidade registrada (artefato gravado, task movida, manifesto ou mapa consistentes) e nenhum explorador ou processo em execução.

1. Parta do snapshot anterior, se existir. Descarte cada entrada expirada, substituída, contrária às fontes atuais ou promovida a arquivo durável que o próximo passo lerá de qualquer forma. Mantenha os IDs das que sobreviverem.
2. Acrescente o que esta sessão produziu: decisões, aprendizados, conclusões de exploradores ainda válidas no head atual e pendências. Escreva cada resumo acionável sem a conversa: o fato e sua consequência, não a história.
3. Dê a cada entrada a camada e os gatilhos mais estreitos que ainda peguem todo caso em que ela importa. `agora` é para o que a próxima sessão precisa saber antes de escolher; a maioria das entradas pertence a `ao-selecionar`, `ao-editar` ou `ao-executar`.
4. Reescreva o resumo do próximo passo: por que é o próximo, skill e unidade, fontes mínimas a ler primeiro, pontos de mudança conhecidos e IDs de entradas aplicáveis. Com várias unidades elegíveis, nomeie a recomendada e liste as demais.
5. Preencha o cabeçalho com valores atuais: `git_head` é `git rev-parse --short HEAD`; `worktree` é `limpo` ou uma contagem curta com os caminhos de primeiro nível alterados; `autoria_codigo` é `sim` se esta sessão alterou código desde a última revisão, e caso contrário mantém o valor anterior até um relatório de revisão cobri-lo.
6. Substitua o arquivo inteiro e releia-o para conferir o cabeçalho e que todo caminho `fonte:` existe. Informe caminho e tamanho na mensagem da pausa.

**Concluído quando:** a próxima sessão consegue escolher a próxima unidade, sabe quais entradas valem para ela e quando, e nenhuma entrada depende desta conversa para ser entendida.
