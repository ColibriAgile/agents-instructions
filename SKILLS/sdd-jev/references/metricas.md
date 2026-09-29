# Métricas do piloto

## Linha do log

`tasks/prd-[slug]/jev-log.jsonl` recebe um objeto JSON por linha, acrescentado logo depois de cada chamada e antes de a etapa seguir. O log só cresce: linha gravada nunca é editada nem reescrita; um registro errado é corrigido por uma linha nova com `corrige` apontando o número da linha errada.

| Campo | Conteúdo |
| --- | --- |
| `ts` | Data e hora reais da chamada em ISO 8601 com o offset local, lidas do sistema (ex.: `Get-Date -Format o`), nunca um horário fixo nem UTC |
| `modo` | `sombra` ou `ativo` |
| `etapa` | Skill e passo, ex. `sdd-orquestrar-tasks#6` |
| `unidade` | Task julgada, ex. `task_03` ou `codereview_1/task_04` |
| `status` | `status` devolvido, ou `nao-chamado` com o motivo em `nota` |
| `sinalizados` | Critérios com veredito diferente de `verified` em confiança de `auto`, com o veredito, ex. `{"criterio-2": "unsupported"}` |
| `confiancas` | Confiança de cada claim, por critério |
| `efeito` | `nenhum` (sombra), `diff-alterado` (sombra com mudança depois da chamada), `corrigido`, `justificado`, `bloqueou` ou `falha-operacional` |
| `chars_enviados` | Soma dos caracteres de `claims` e `evidence`: estima os tokens que o próprio agente escreveu para montar a chamada |
| `usage` | `input_tokens` e `output_tokens` devolvidos |
| `corrige` | Opcional: número da linha que este registro corrige |
| `nota` | Opcional: motivo de falha, divisão da chamada ou tamanho do diff |

## Resumo no aceite

Grave `tasks/prd-[slug]/jev-resumo.md` a partir do log, dos handoffs e dos relatórios. No topo: modo, controle da primeira revisão (`sessao-nova`, `delegada` ou `ausente`) e o modelo que conduziu a sessão autora, quando conhecido.

1. **`J3` contra a primeira revisão.** Atribua cada `CR-NN` de `codereview_1` à task dona dos arquivos e ao critério de aceite ou `TC-NN` que ele afeta. Por critério:
   - *acerto*: claim sinalizada e `CR-NN` no critério;
   - *alarme falso*: claim sinalizada sem `CR-NN` no critério;
   - *omissão*: claim `verified` em confiança de `auto` e `CR-NN` no critério;
   - *acerto confirmado pelo autor*: claim sinalizada e diff alterado antes de `done/` (`diff-alterado` ou `corrigido`), contado à parte porque a revisão já não pode achar o que foi corrigido.

   Chamada com `falha-operacional` ou `nao-chamado` fica fora das contagens; liste a task e o motivo. Marque os achados que levaram a primeira revisão a `REPROVADO`.
2. **Fluxo.** Status da primeira revisão, rodadas até `APROVADO` ou ressalvas decididas e tasks reabertas.
3. **Custo.** Tokens devolvidos pelo jev e `chars_enviados` total, com a estimativa de tokens escritos pelo agente (caracteres ÷ 4). Duração quando o host expuser; sem telemetria, declare-a não medida.
4. **Baseline.** Das features do mesmo repositório sem jev: fração com primeira revisão `REPROVADO` e média de rodadas, contadas nos `codereview_*/codereview.md`. Declare amostra pequena como limitação.

Com controle `ausente`, a feature entra só nos itens 2 e 3, com a ausência declarada no topo.

## Critério de parada

Contam as features com o `J3` por critério e controle `sessao-nova` ou `delegada`. O resumo de cada feature soma as anteriores e diz em que ponto o critério está:

- **Encerrar e remover o jev do SDD** quando, somadas as features contadas, nenhum achado que levou uma primeira revisão a `REPROVADO` teve acerto ou acerto confirmado pelo autor, ou quando os alarmes falsos passaram de um por task em média. A conta vale depois de duas features com ao menos um desses achados; sem achado desse tipo, conte até quatro features e, com quatro sem nenhum, encerre também.
- **Passar o `J3` a `ativo`** quando houver ao menos um acerto ou acerto confirmado pelo autor num desses achados, com os alarmes falsos dentro do limite.

A decisão é humana e fica registrada em `workflow.md`. Alvos de remoção ao encerrar: a skill `sdd-jev`, as frases `Com a skill sdd-jev…` das skills de etapa, a pergunta de modo jev no HIL 0 de `sdd-triar`, o campo `jev` do checkpoint e de `estado-hil.md` e o trecho do passo 1 de `sdd-orquestrar-fluxo`.
