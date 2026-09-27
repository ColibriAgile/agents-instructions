# Piloto: Jev e triagem no fluxo SDD

## O que foi adicionado

- `SKILLS/sdd-jev`: pontos de juízo `J0`–`J7` nas etapas SDD, ligados pelo campo `jev` do checkpoint (`off` padrão, `sombra`, `ativo`). Sem tools jev no host, o fluxo registra a indisponibilidade e segue como antes.
- `SKILLS/sdd-triar`: HIL 0 antes do fluxo, com recomendação `sdd-completo`, `sdd-enxuto` ou `pontual` a partir dos sinais S1–S8; usa `jev_decide` quando disponível.
- Skills de etapa (`sdd-criar-prd`, `sdd-criar-techspec`, `sdd-planejar-tasks`, `sdd-orquestrar-tasks`, `sdd-executar-correcoes`, `sdd-revisar-codigo`, `sdd-planejar-correcoes`, `sdd-orquestrar-fluxo`): uma frase condicional no passo de cada ponto, para que o ponto não dependa de a sessão lembrar do complemento.
- `sdd-orquestrar-fluxo`: passo 1 chama a triagem em pedido novo e carrega `sdd-jev` conforme o modo; `checkpoint.template.json` e `estado-hil.md` ganharam o campo `jev` e o HIL 0.

## Como rodar

1. Numa feature nova: `sdd-orquestrar-fluxo --jev sombra`. A revisão continua sendo o grupo de controle; em `sombra` ela roda os pontos `J4`/`J5` só depois de gravar `codereview.md`.
2. No HIL 3, `jev-resumo.md` compara o gate por task (`J3`) com a primeira revisão: acertos, alarmes falsos, omissões, rodadas e tokens.
3. Copie `jev-resumo.md` e `jev-log.jsonl` de cada feature para `docs/` do projeto antes de qualquer limpeza de `tasks/prd-*/`, para que a decisão final compare as features do piloto.
4. Cada triagem acrescenta uma linha a `tasks/triagem-log.jsonl`, que calibra os limiares da rubrica.

## Critério de decisão

Sugestão para decisão humana depois de pelo menos duas features em `sombra`: promover `J3` a `ativo` quando as omissões forem raras frente aos bloqueantes da primeira revisão e os alarmes falsos custarem menos que uma rodada de revisão evitada. Os demais pontos seguem o mesmo raciocínio, cada um decidido separadamente.

## Alvos de remoção ao encerrar o piloto

- Adotado: mover os pontos aprovados para as skills de etapa no lugar das frases condicionais, remover os valores `sombra` e `ativo`, `jev-log.jsonl`, `metricas.md` e este documento; manter apenas o caminho sem jev registrado como indisponibilidade.
- Rejeitado: remover `SKILLS/sdd-jev`, as frases `Com a skill sdd-jev…` das skills de etapa, o campo `jev` do template e de `estado-hil.md`, o trecho do passo 1 de `sdd-orquestrar-fluxo` e a entrada em `bundles.yaml`.
- `sdd-triar` é avaliada à parte pelo log de triagem.
