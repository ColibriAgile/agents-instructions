# Métricas do piloto

## Linha do log

`tasks/prd-[slug]/jev-log.jsonl` recebe um objeto JSON por linha, gravado antes de a etapa seguir:

| Campo | Conteúdo |
| --- | --- |
| `ts` | Data e hora ISO 8601 |
| `modo` | `sombra` ou `ativo` |
| `sessao` | `autora` ou `revisora` |
| `ponto` | `J0` a `J7` |
| `etapa` | Skill e passo, ex. `sdd-orquestrar-tasks#6` |
| `unidade` | Task, revisão ou artefato julgado, ex. `task_03`, `codereview_1` |
| `tool`, `status` | Tool chamada e `status` devolvido |
| `acao` | `auto`, `review`, `escalate`, `pass`, `block`, `skip` ou recomendação de `jev_decide` |
| `sinalizados` | IDs com veredito diferente de `verified`/`auto` e seu veredito, ex. `{"RF-03": "unsupported"}` |
| `efeito` | `nenhum` (sombra), `diff-alterado` (sombra com mudança depois da chamada), `corrigido`, `justificado`, `bloqueou` ou `falha-operacional` |
| `usage` | `input_tokens` e `output_tokens` devolvidos |

## Resumo no aceite

Grave `tasks/prd-[slug]/jev-resumo.md` a partir do log, dos handoffs e dos relatórios, com contagem e IDs:

1. **Gate por task (`J3`) contra a primeira revisão.** Atribua cada `CR-NN` de `codereview_1` à task dona dos arquivos. Por task: *acerto* quando o gate sinalizou a mesma causa que a revisão achou; *alarme falso* quando sinalizou algo que não se confirmou nas linhas; *omissão* quando deu `auto` e a revisão achou bloqueante; *acerto confirmado pelo autor* quando o gate sinalizou e o diff mudou antes de `done/` (`diff-alterado` ou `corrigido`), contado à parte porque a revisão já não pode achar o que foi corrigido. Em `ativo`, conte também as correções feitas por causa do gate.
2. **Cobertura (`J1`, `J2`).** Lacunas sinalizadas, quantas o humano ou a revisão confirmaram e quantas a revisão achou sem sinalização.
3. **Revisão (`J4`, `J5`, `J6`).** Concordância por linha da matriz, severidade e destino, com as divergências listadas.
4. **Fluxo.** Status da primeira revisão, rodadas até `APROVADO` ou ressalvas decididas e tasks reabertas.
5. **Custo.** Tokens por ponto e total; duração quando o host expuser. Sem telemetria de duração, declare-a não medida.
6. **Baseline.** Das features do mesmo repositório sem jev: fração com primeira revisão `REPROVADO` e média de rodadas, contadas nos `codereview_*/codereview.md`. Declare amostra pequena como limitação.

O resumo informa; a adoção de um ponto em `ativo` ou a remoção do modo é decisão humana registrada em `workflow.md`.
