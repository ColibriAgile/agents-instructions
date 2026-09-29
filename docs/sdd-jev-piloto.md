# Piloto: Jev e triagem no fluxo SDD

## Estado atual

Depois de cinco features em `sombra` (documentacao-scalar no pos-integration-service, TokenHound 09 e 10, ContextBrake 08 e 09), o piloto foi reduzido a um único ponto:

- `SKILLS/sdd-jev`: só o ponto `J3`, um `jev_verify` por task com uma claim por critério de aceite e evidência literal (hunks do diff e testes) por critério. Sai o `jev_gate` e a rubrica, que deu `escalate` em todas as cerca de 14 chamadas e não separou task boa de ruim.
- Removidos `J0`, `J1`, `J2`, `J4`, `J5`, `J6` e `J7`: repetiam o revisor, o planejador ou o humano sem mudar decisão (`J4` a `J7`), nunca tiveram sinalização confirmada (`J2`) ou tiveram um acerto em quatro features (`J1`).
- `SKILLS/sdd-triar`: mantida, agora sem `jev_decide`; o S1 não conta mudança só em texto de documentação.
- A revisão, em sessão nova ou revisor delegado de contexto novo, é o grupo de controle do `J3`: o revisor não chama o jev nem lê o log.

## Como rodar

1. Numa feature nova: `sdd-triar --jev sombra` ou `sdd-orquestrar-fluxo --jev sombra`.
2. No HIL 3, `jev-resumo.md` compara o `J3` com a primeira revisão e soma as features anteriores contra o critério de parada de `SKILLS/sdd-jev/references/metricas.md`.
3. Copie `jev-resumo.md` e `jev-log.jsonl` de cada feature para `docs/` do projeto antes de qualquer limpeza de `tasks/prd-*/`.
4. Cada triagem acrescenta uma linha a `tasks/triagem-log.jsonl`, que calibra os limiares da rubrica.

## Critério de parada

O de `SKILLS/sdd-jev/references/metricas.md`: encerrar quando o `J3` não pegar nenhum achado que reprova a primeira revisão, ou passar de um alarme falso por task em média; passar a `ativo` quando pegar. No máximo quatro features contadas.

## Alvos de remoção

- Encerrado: `SKILLS/sdd-jev`, as frases `Com a skill sdd-jev…` de `sdd-orquestrar-tasks` e `sdd-executar-correcoes`, a do aceite em `sdd-orquestrar-fluxo`, o trecho do passo 1 que carrega a skill, a pergunta de modo jev no HIL 0 de `sdd-triar`, a menção ao jev em `sdd-revisar-codigo/references/revisao-delegada.md`, o campo `jev` de `checkpoint.template.json` e de `estado-hil.md`, a entrada em `bundles.yaml` e este documento.
- Adotado em `ativo`: remover o valor `sombra`, `metricas.md`, o `jev-log.jsonl` e este documento; manter o `J3` e o caminho sem jev registrado como indisponibilidade.
- `sdd-triar` é avaliada à parte pelo log de triagem.
