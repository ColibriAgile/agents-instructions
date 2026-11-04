# Aderência .NET Colibri — <Produto>

- Data: <dd/mm/aaaa>
- Alvo: `<repositório>`, branch `<branch>`, commit `<hash curto>`.
- Tipo de host: <ASP.NET | worker | console | WinForms | plugin>.
- Rubrica: `colibri-dotnet-aderencia`, `references/checklist.md`.
- Referências: `dconnect`, `pos-integration-service`, `back-office-connect`, `dotnet-lib` (commits em `references/padroes-referencia.md`; <"conferidas nos clones locais" | "não conferidas: só a evidência da skill">).

## 1. Resumo

<2 a 4 frases. A primeira frase diz o problema principal. A segunda diz o que já está conforme.>

| Severidade | Quantidade |
| --- | --- |
| 🔴 Bloqueador | <n> |
| 🟠 Alta | <n> |
| 🟡 Média | <n> |
| ⚪ Baixa | <n> |
| ❓ Decisão a confirmar | <n> |
| 🔍 Não verificado | <n> |
| ✅ Conforme | <n> |
| N/A | <n> |

Legenda: ✅ conforme · ⚠️ parcial · ❌ não conforme · N/A não se aplica · ❓ decisão documentada · 🔍 não verificado.

## 2. Checklist

<Uma subseção por categoria, na ordem SUB, LOG, POR, DB, PUB, CI, TST, SRV, API, LIB, REP, SEC. Liste todos os itens da rubrica, inclusive os ✅ e os N/A. Assim uma reavaliação compara item a item.>

### 2.1 SUB — Submódulos

| ID | Item | Status | Evidência no alvo | Referência | Sev. | Executor |
| --- | --- | --- | --- | --- | --- | --- |
| SUB-01 | <regra curta> | <status> | `<arquivo>:<linha>` ou o fato medido | `<repo>/<arquivo>:<linha>` | <sev.> | <skill ou "manual"> |

<Depois da tabela, só quando o item precisa: "Ação para SUB-01:" com passos numerados. Um passo por linha.>

<... repita para cada categoria ...>

## 3. Itens conformes — não alterar

<Lista curta dos ✅ que uma correção pode quebrar por engano. Exemplo: "A porta vem de `ConfiguracoesDeAmbiente.ObterPorta` (POR-01)".>

## 4. Decisões a confirmar com o produto

| ID | Decisão encontrada | Onde está documentada | Pergunta |
| --- | --- | --- | --- |
| <ID> | <o que o alvo faz> | `<arquivo>:<linha>` | <pergunta fechada> |

## 5. Ordem de execução recomendada

<Passos numerados. Bloqueadores primeiro. Agrupe por executor quando a ordem permite. Indique o ID de cada passo.>

## 6. Limitações

- <Itens 🔍 e o motivo.>
- <Referências que não foram conferidas nos clones locais.>
- <Pastas que o inventário não leu.>

## 7. Execução

Este relatório não alterou nenhum arquivo do alvo, além dele mesmo. A execução das correções é opcional. Para executar, escolha uma opção:

1. Executar 1 item com o executor da coluna "Executor".
2. Planejar todos os itens com `sdd-planejar-correcoes`, usando este relatório como entrada.
3. Não executar agora.
