# Ponto J3 — Verificação por critério

| Etapa e momento | Tool |
| --- | --- |
| `sdd-orquestrar-tasks` passo 6 e `sdd-executar-correcoes` passo 5, depois da releitura e antes de mover a task para `done/` | `jev_verify` |

## Entrada

- `claims` = uma por critério de aceite da task, na ordem: `Critério <n> é atendido: <texto literal do critério>.`
- `evidence` = um item por critério, `id` = `criterio-<n>`, só com texto literal:
  - os hunks do `git diff` contra a base registrada que implementam o critério, copiados sem edição; antes do diff, marque os arquivos novos com `git add -N <arquivos>` (intenção de adicionar, sem conteúdo no stage);
  - o nome e o resultado de cada teste que comprova o critério, com o `TC-NN`, copiados da saída do runner;
  - a saída de build, typecheck ou lint, quando o critério trata deles.

  Acrescente um item `suite` com as linhas de resumo da última execução completa da suíte (contagens e falhas).
- O `## Handoff` não entra na evidência: claim conferida contra a afirmação do próprio autor não prova nada.
- Resumo, paráfrase ou hunk reconstruído não é evidência: sem o trecho literal, registre `falha-operacional` e não conte a chamada. Critério sem trecho que o sustente entra com o item vazio e a nota `sem-trecho`; o `unsupported` resultante é sinal, não falha.

## Limites

Cada item tem até 20.000 caracteres: selecione só os hunks do critério. Critério que exige mais é dividido em chamadas por grupo de critérios, registradas como uma unidade. Task cujo diff não cabe assim fica registrada com o tamanho no log, como sinal para o planejamento.

## Registro

Grave o veredito e a confiança de cada claim e `chars_enviados`, a soma dos caracteres de `claims` e `evidence`.

## Sombra

Rode depois de fechar o `## Handoff` e siga direto ao registro da task, sem abrir o resultado para decidir. Se o diff mudar depois da chamada, registre `efeito: diff-alterado` e uma nova linha sobre o diff novo.

## Ativo

- `contradicted` → trate como achado da releitura: corrija e rode de novo sobre o diff novo.
- `unsupported` ou confiança abaixo de `auto_accept` (0,8) → confira nas linhas; corrija ou registre justificativa no `## Handoff`.
- Todas as claims `verified` com confiança de `auto` → siga ao registro da task.
- Duas chamadas sem progresso seguem a regra de bloqueio após duas tentativas da skill de etapa.
