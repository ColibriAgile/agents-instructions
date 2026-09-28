# Filtros — definições (`.filtros`) e uso no SQL

Um filtro tem duas metades:

- a **definição**, que diz *como* a aba se comporta (período, lista de consulta, opções...). Fica nos arquivos `*.filtros` ou no array `filtros` do `.conf`;
- o **uso**, a seção `[filtro.<id>]` no bloco de metadados do SQL, que aponta a definição por `tipo=` e diz *onde* o valor entra (`campo`, `literal`, `macros`). Ver `sql.md`.

Fontes: `_colibri-lib/src/relatorios/relatorios.filtros*.pas`, `source/src/filtros.gerenciador.ui.pas`, `source/ui/frame.filtro*.pas`, `_agile-lib/src/suporte/suporte.restricao.sql.pas`.

## Catálogo instalado

As definições globais são todos os `*.filtros` encontrados recursivamente a partir de `PastaRaiz` (no produto `pos`: `reports\pos\filtros\comum.filtros` e `colibri.filtros`). **Liste o catálogo da instalação-alvo antes de escolher um `tipo`**:

```
python <skill-dir>/scripts/validar_relatorio.py --listar-filtros --pasta-raiz "<PastaRaiz>"
```

Referência do que existia na instalação usada para escrever esta skill (confirme com o comando acima):

| `tipo` | Modelo | Uso típico |
|---|---|---|
| `data` | periodo | período de datas absoluto ou relativo (Hoje, 3/7/15/30 dias, mês) sobre `dt_contabil` |
| `data-absoluta` | periodo | só datas absolutas |
| `data-hora` | periodo | data + intervalos de hora; `campo=cast(x as date);cast(x as time)` |
| `data-com-hora` | periodo | um intervalo contínuo `'yyyymmdd hh:nn:ss'` |
| `hora`, `hora-simples` | periodo | só horários (vários ou um) |
| `aniversario` | dia_mes | dia/mês ignorando o ano |
| `situacao` | opcoes | Todos(-1) / Ativos(1) / Inativos(0) |
| `sexo` | opcoes | Todos(-1) / M / F |
| `sim-nao` | opcoes | 0 / 1 (padrão Sim) |
| `modo-venda-exclusivo` | opcoes | Todos / Balcão / Delivery / Mesa / Ficha |
| `modo-venda-obrigatorio` | opcoes | um modo, sem "Todos" |
| `top` | entrada | quantidade de registros; `literal=top`, expressão `top {valor}` |
| `entrada-numerica`, `entrada-texto` | entrada | valor digitado (`campo = 'valor'`) |
| `ticket` | entrada | número de ticket (`\d{1,9}(/\d{1,9})?`) |
| `intervalo-numerico`, `ticket-intervalo` | intervalo | faixa de/até |
| `material-intervalo-codigo`, `material-intervalo-descricao` | intervalo | faixas de materiais (múltiplas) |
| `funcionario`, `funcionario-com-cargo` | consulta | lista de funcionários (id) |
| `entregador` | consulta | funcionários com função entregador |
| `cliente`, `grupo-cliente` | consulta | clientes / grupos de cliente |
| `material`, `grupo-material` | consulta | materiais / grupos (id) |
| `ponto-venda`, `modo-venda`, `praca`, `regiao`, `terminal`, `tabela-preco` | consulta | cadastros correspondentes (id) |

## O que cada modelo gera

Valores: inteiros sem aspas; textos com aspas; datas `'yyyymmdd'`; horas `'hh:nn'`.

| Modelo | Com `campo=C` (vai para `macros`) | Com `literal=L` | Sem valor / "Todos" |
|---|---|---|---|
| periodo (data) | `C between 'yyyymmdd' and 'yyyymmdd'` — o fim é o dia às 00:00, então use coluna `date`/`dt_contabil` ou `cast(x as date)` | `literal=ini;fim` recebe `'yyyymmdd'` em cada um | aba ativa sempre restringe |
| periodo (hora) | cada faixa `(H >= 'hh:nn' and H < 'hh:nn')`, várias unidas com `or` | 2 literais recebem `'hh:nn'` | sem faixas, sem restrição |
| consulta | `C in (1, 2)`; nenhum marcado: `C in (-1)` | um literal recebe `'1, 2'` (texto único); nenhum: `'-1'`; todos: `''` | botão "Todos" não restringe |
| opcoes | `C = 'id'` (sempre com aspas) | o literal recebe o id **cru** (`1`, `M`) ou `Format(expressao,[id])` | `id = -1` não restringe nem preenche literal |
| selecao | `C = 'v'` ou `C in ('a','b')` (só se as opções têm retorno); `id-como-inteiro=true` tira aspas | literal recebe `'a, b'` | sem retorno, só o literal `<id>` |
| intervalo | `C between 'de' and 'ate'`; múltiplo: `(C between ...) or (...)` | 2 literais recebem de/até | vazio não restringe |
| entrada | `C = 'valor'` (sempre com aspas, operador sempre `=`) | numérico: texto cru; texto: com aspas; ou `expressao` | vazio não restringe |
| dia_mes | expressão com `dateadd/datediff` anexada às `macros` | `diames_de`/`diames_ate` recebem `'mmdd'` | datas vazias = 01/01–31/12 |

Filtro desligado: não gera restrição nem literal (nem o literal `<id>`). A macro fica vazia ou com o padrão `->`.

Escolha `campo` quando o filtro só restringe linhas. Escolha `literal` quando o valor precisa entrar num `declare`, numa função de tabela ou num `if`. `dia_mes` com `/*macro.filtro+*/` sem outra restrição entra sem `and`: use `/*macro.filtro*/` com ele.

## Definição local no `.conf`

Use apenas quando nenhum `tipo` do catálogo serve. Formato de item (o app grava o formato novo; o antigo `id`+`tipo` também é aceito):

```json
"filtros": [
	{
		"tipo": "intervalo-hora-cheia",
		"titulo": "Intervalo de horas",
		"modelo": "intervalo",
		"intervalo": { "numerico": false, "mascara": "([01]?[0-9]|2[0-3]):00", "regex": true, "padrao": "00:00;23:00" }
	},
	{
		"tipo": "opcao-sim-nao",
		"titulo": "Mostrar horas sem venda",
		"modelo": "opcoes",
		"opcoes": [ { "id": 0, "nome": "Não" }, { "id": 1, "nome": "Sim" } ],
		"indice_padrao": 1
	}
]
```

Modelos e sub-objetos:

| `modelo` | Sub-objeto |
|---|---|
| `periodo` | `"periodo": { "data-absoluta", "data-relativa", "hora", "multiplo" (padrão true), "data-com-hora" }` |
| `consulta` | `"consulta": { "sql", "campo-id", "campos": [] }`, `"selecao-obrigatoria"` na raiz |
| `hierarquia` | `"consulta": { "sql", "campo-id", "campo-pai", "campo-categoria", "campo-selecao", "campos": [] }` |
| `opcoes` | `"opcoes": [ {"id","nome"} ]` ou `{ "sql", "campo-id", "campo-exibicao" }`; `"indice_padrao"` na raiz (a chave `selecionado` é ignorada) |
| `selecao` | `"selecao": ["Texto=retorno", ...]` ou `{ "sql", "campo-id", "campo-exibicao" }`; `"selecao-obrigatoria"`, `"selecao-unica"` na raiz |
| `intervalo` | `"intervalo": { "numerico", "multiplo", "regex", "mascara", "min", "max", "padrao" ("de;ate"), "sql", "campo-id", "campo-exibicao", "campos" }` |
| `entrada` | `"entrada": { "numerico", "min", "max", "padrao", "spin", "regex", "mascara" }` |
| `dia_mes` | `"dia_mes": { "data-absoluta", "data-relativa" }` |

O `sql` de uma definição é relativo à pasta do arquivo que a contém. O SQL de lista não tem parâmetros, devolve a coluna `campo-id` (oculta, vai para o `in`) e as colunas de `campos` (exibidas), e ordena a si mesmo.

## Armadilhas

- `tipo` é um nome global único: a primeira definição carregada vence e os globais têm prioridade sobre os locais.
- Em SQL de detalhe, declare por último os `[filtro.<id>]` que repetem um id do mestre; um id repetido interrompe a criação das abas seguintes daquela consulta.
- `selecao-unica` só funciona na definição, não como extra no SQL.
- O `.user` ao lado do `.conf` guarda a última seleção do usuário (chaves `frm<id>_<saida>_<campo>`). Ele é gerado pelo app: apague ao renomear ids de filtro ou de saída e não o distribua.
