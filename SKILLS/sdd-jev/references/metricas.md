# Métricas do piloto

## Linha do log

`tasks/prd-[slug]/jev-log.jsonl` recebe um objeto JSON por linha, acrescentado logo depois de cada chamada e antes de a etapa seguir. O log só cresce: linha gravada nunca é editada nem reescrita; um registro errado é corrigido por uma linha nova com `corrige` apontando o número da linha errada.

| Campo | Conteúdo |
| --- | --- |
| `ts` | Data e hora reais da chamada em ISO 8601, lidas do sistema (ex.: `Get-Date -Format o`), nunca um horário fixo: a duração do piloto sai desses valores |
| `modo` | `sombra` ou `ativo` |
| `sessao` | `autora` ou `revisora` |
| `ponto` | `J0` a `J7` |
| `etapa` | Skill e passo, ex. `sdd-orquestrar-tasks#6` |
| `unidade` | Task, revisão ou artefato julgado, ex. `task_03`, `codereview_1` |
| `tool`, `status` | Tool chamada e `status` devolvido |
| `acao` | `auto`, `review`, `escalate`, `pass`, `block`, `skip` ou recomendação de `jev_decide` |
| `sinalizados` | IDs com veredito diferente de `verified`/`auto` e seu veredito, ex. `{"RF-03": "unsupported"}` |
| `efeito` | `nenhum` (sombra), `diff-alterado` (sombra com mudança depois da chamada), `corrigido`, `justificado`, `bloqueou` ou `falha-operacional` |
| `numeros` | Em `J3`: `safe_to_apply`, composto, notas da rubrica e confiança por claim; nos demais pontos, a confiança de cada item sinalizado |
| `usage` | `input_tokens` e `output_tokens` devolvidos |
| `corrige` | Opcional: número da linha que este registro corrige |
| `controle` | `ausente` quando a revisão roda na sessão autora; `delegada` quando roda num revisor delegado de contexto novo; omitido quando roda em sessão nova |

## Resumo no aceite

Grave `tasks/prd-[slug]/jev-resumo.md` a partir do log, dos handoffs e dos relatórios, com contagem e IDs:

1. **Gate por task (`J3`) contra a primeira revisão.** Atribua cada `CR-NN` de `codereview_1` à task dona dos arquivos e ao critério de aceite ou `TC-NN` que ele afeta. O gate devolve notas e confiança por claim, não causas; classifique por critério:
   - *acerto*: claim do critério sinalizada (`unsupported`, `contradicted` ou confiança abaixo de `auto_accept`) e a revisão achou `CR-NN` nesse critério;
   - *alarme falso*: claim sinalizada sem `CR-NN` no critério;
   - *omissão*: claim `verified` com confiança de `auto` e `CR-NN` no critério;
   - *acerto confirmado pelo autor*: claim sinalizada e diff alterado antes de `done/` (`diff-alterado` ou `corrigido`), contado à parte porque a revisão já não pode achar o que foi corrigido;
   - *sinal inespecífico*: `review` ou `escalate` só pela rubrica, sem claim sinalizada; conte à parte, sem acerto nem alarme.

   Gate com `falha-operacional`, inclusive por diff resumido, fica fora das contagens. Liste `safe_to_apply` e composto por task para calibrar limiares. Em `ativo`, conte também as correções feitas por causa do gate.
2. **Cobertura (`J1`, `J2`).** Lacunas sinalizadas, quantas o humano ou a revisão confirmaram e quantas a revisão achou sem sinalização.
3. **Revisão (`J4`, `J5`, `J6`).** Concordância por linha da matriz, severidade e destino, com as divergências listadas.
4. **Fluxo.** Status da primeira revisão, rodadas até `APROVADO` ou ressalvas decididas e tasks reabertas.
5. **Custo.** Tokens por ponto e total; duração quando o host expuser. Sem telemetria de duração, declare-a não medida.
6. **Baseline.** Das features do mesmo repositório sem jev: fração com primeira revisão `REPROVADO` e média de rodadas, contadas nos `codereview_*/codereview.md`. Declare amostra pequena como limitação.

Com `controle: ausente`, a feature entra só nos itens 4 (Fluxo) e 5 (Custo), com a ausência declarada no topo; acertos, alarmes, omissões e concordâncias ficam fora das contagens.

O resumo informa; a adoção de um ponto em `ativo` ou a remoção do modo é decisão humana registrada em `workflow.md`.
