# Continuidade de sessão

As skills SDD gravam artefatos e código na sessão que as executa; subagentes são exploradores somente leitura. O trabalho acumula num único contexto, e este protocolo segue sozinho entre unidades até o contexto encher, gravando o que a sessão aprendeu antes de sugerir uma sessão nova. O snapshot que a pausa grava pertence à skill `sdd-snapshot`: toda gravação segue o ramo Gravar dela.

## Pausa de sessão

Roda em cada **fronteira** que a skill chamadora indicar (entre tasks, recortes ou frentes, nos gates HIL, antes da revisão e ao fim de uso avulso), somente com gravações persistidas e nenhum explorador ou processo em execução.

### Medir o contexto

O **limiar** é 65% da janela de contexto, onde começa a zona `RED` do ContextBrake. Parar ali deixa folga para gravar o snapshot e perguntar antes de `CRITICAL` (75%), onde o ContextBrake bloqueia toda tool exceto seus comandos de plano, checkpoint, validação e git, e o snapshot não pode mais ser gravado.

- **Telemetria.** Quando o retorno de uma tool trouxer o bloco do ContextBrake (`[ContextBrake vN] … usage=<p>% … zone=<ZONA> …`), ou o harness reportar o uso, use a leitura mais recente: é medida e vence a estimativa. `zone=RED` ou `zone=CRITICAL` atinge o limiar com qualquer `usage`.
- **Estimativa.** Sem telemetria, some o que entrou no contexto desde o início da sessão ou da última compactação: carga fixa de sistema e ferramentas (cerca de 20 mil tokens), skills e fontes lidas, saídas de tools, diffs e o texto que você escreveu, a cerca de 4 caracteres por token, contra a janela do modelo (200 mil tokens quando desconhecida). Parta da estimativa anunciada na fronteira anterior e some só o que veio depois; na dúvida, arredonde para cima. Compactação nesta sessão ou aviso de contexto baixo do harness atinge o limiar.

Dentro de uma unidade, o limiar não interrompe o trabalho: termine a unidade sem abrir explorações grandes novas. Quando ela não couber antes de `CRITICAL`, pare no próximo ponto consistente, registre estado parcial e pendências no handoff, aguarde exploradores e processos e faça a pausa por contexto com essa unidade como próximo passo.

### Destinos

Em cada fronteira, siga exatamente um destino:

| Destino | Quando | Efeito |
| --- | --- | --- |
| Seguir | Abaixo do limiar e sem parada obrigatória | Informe em uma linha a unidade concluída, o uso (`58% medido` ou `~40% estimado`) e a próxima unidade; comece-a sem perguntar |
| Pausa por contexto | Limiar atingido | Grave o snapshot e pergunte |
| Parada obrigatória | Gate HIL, regra de independência, bloqueio sem outra unidade elegível ou fim de uso avulso | Grave o snapshot e pergunte |

A pergunta vem sempre depois do snapshot gravado e relido por `sdd-snapshot`. Use a tool de perguntas do host (`AskUserQuestion` no Claude Code) ou pergunta textual quando não houver. Informe em uma linha o que terminou, o próximo passo, o uso de contexto e caminho e tamanho do snapshot; depois imprima o comando de retomada. Coloque a opção recomendada primeiro, marcada `(Recomendado)`:

| Opção | Recomende quando | Efeito |
| --- | --- | --- |
| Encerrar e retomar em nova sessão | Limiar atingido ou regra de independência | Encerre o turno; o comando de retomada já está impresso. Com o ContextBrake ativo, termine a resposta com `[REQUEST_SESSION_RESET]` |
| Continuar nesta sessão | Parada obrigatória abaixo do limiar | Prossiga; acima do limiar, a pausa por contexto se repete na próxima fronteira |

- **Independência.** Quando o próximo passo é `sdd-revisar-codigo` e esta sessão escreveu ou alterou código que a revisão vai julgar, pare qualquer que seja o uso e diga por que recomenda encerrar: a revisão precisa de uma sessão que não é autora do código. Se o usuário continuar mesmo assim, registre a limitação onde o chamador guarda decisões (`workflow.md` sob `sdd-orquestrar-fluxo`) e nas limitações do relatório.
- **Gates.** Num gate HIL, faça juntas a pergunta do gate e a da sessão. Encerrar a sessão não aprova o gate, e aprovar não escolhe a sessão.
- **Comando de retomada.** Em toda pergunta desta pausa, imprima antes dela o comando de retomada definido em `sdd-snapshot`. Ao encerrar, não inicie trabalho, explorador ou processo depois da resposta. Silêncio não inicia nada.
