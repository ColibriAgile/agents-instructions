# SQL do relatório — template, macros e bloco de metadados

Cada `.sql` de uma saída é um **template** T-SQL (SQL Server via ADO/SQLNCLI). O Reports lê o arquivo como UTF-8, extrai o bloco de metadados do comentário final e troca as macros em comentário antes de executar. O bloco é o que desenha a tela de filtros e a aba de ordenação e o que liga detalhe a mestre.

Fontes: `_colibri-lib/src/relatorios/relatorios.consulta.pas` (macros: 98-114, 184-216, 268-561), `relatorios.filtros.sql.pas:13-67`, `relatorios.filtros.extrator.pas:137-282`, `relatorios.ordenacao.extrator.pas`, `relatorios.relacionamento.extrator.pas`, `_agile-lib/src/suporte/suporte.sql.hierarquia.pas:130-234`.

## Anatomia

```sql
declare                                   -- opcional: literais vindos de filtros
  @dtini datetime = /*macro.dataini->'20150101'*/

select
  [Dt. contábil] = v.dt_contabil,         -- alias = título da coluna no grid
  [Vendedor]     = dbo.fn_capitalize(f.nome, 1),
  [Total]        = cast(sum(v.vl_total) as money)
from venda v with (nolock)
left join funcionario f with (nolock) on f.id = v.func_id
where v.cancelado = 0
  /*macro.filtro+*/                       -- recebe "and <restrições>"
group by v.dt_contabil, f.nome
/*macro.ordenacao*/                       -- recebe "order by ..."

/*
[filtro.dt]
titulo=Período
tipo=data
campo=v.dt_contabil

[filtro.func]
tipo=funcionario
campo=v.func_id

[ordenacao]
titulo=Principal
Data=v.dt_contabil->asc
Vendedor=f.nome
*/
```

## Colunas (aliases)

- O conjunto e a ordem das colunas vêm do `SELECT` externo. O alias vira o `Caption` inicial e o nome interno da coluna no `grid.ini` (ver `grid-ini.md`).
- Estilo de alias: T-SQL `alias = expressão`. Na consulta raiz, `[Título com espaço e acento] = expr` dá a legenda pronta. Nos **detalhes**, use aliases snake_case ASCII (`vl_total`, `material_descr`) e dê o título por `caption=` no `grid.ini`: o nome da coluna de detalhe vira nome de componente VCL e só tolera letras, dígitos e `_`.
- Aliases repetidos são renomeados pelo ADO para `<alias>_1`. Dê aliases distintos.
- O tipo SQL decide o editor da coluna: `int`/`bigint`/`smallint` → número inteiro; `bit` → checkbox; `money` → moeda; `numeric`/`decimal`/`float` → decimal; `datetime`/`date` → data; `time` → hora; o resto → texto. Para valor monetário use `cast(x as money)`; para hora formatada use `convert(varchar(5), x, 108)`.
- Colunas técnicas (ids, `uniqueidentifier`) que servem de chave para detalhes ficam no `SELECT` e são ocultadas no `grid.ini` (`visible="False"`).
- Convenções do banco: `with (nolock)` nas tabelas, `dbo.fn_capitalize(nome, 1)` em nomes, pares dia corrente/histórico unidos com `union all` (`venda`/`venda_geral`, `operacao`/`operacao_geral`, `operacao_venda`/`operacao_venda_geral`, `venda_item`/`venda_item_geral`), `dt_contabil` como data contábil.

## Macros

Regex: `(?si)/\*macro[:.](?!/\*)([\w+-]*?)(->(.+?))?\*/`. Os separadores `macro.` e `macro:` são equivalentes; use `macro.`. `->valor` define o padrão usado quando nada preenche a macro. Sem padrão e sem valor, a macro vira texto vazio.

| Macro | Vira |
|---|---|
| `/*macro.filtro*/` | `where r1 and r2 ...`, ou vazio. Use onde **não** há `where`. |
| `/*macro.filtro+*/` | `and r1 and r2 ...`, ou vazio. Use depois de um `where` existente. |
| `/*macro.filtro1*/` … `filtro9`, `filtroN+` | Conjuntos extras de restrição. O filtro escolhe o conjunto com `macros=filtro;filtro1`. |
| `/*macro.ordenacao*/` | `order by c1 asc, c2 desc`, ou vazio. |
| `/*macro.ordenacao+*/` | `, c1 asc, ...`, para complementar um `order by` fixo (`order by f.usuario/*macro.ordenacao+*/`). |
| `/*macro.relacionamento*/` | Só em detalhe: `declare @campoMestre tipo = :campoMestre, ...` para cada linha tipada de `[relacionamento]`. |
| `/*macro.<nome>*/` | Literal: recebe o valor do filtro que declarou `literal=<nome>`. Todo filtro **ativo** também injeta o literal `<id do filtro>` = `1`. |
| `%banco-pos%`, `%banco-cbo%`, `%banco-nf%` | Nome do banco entre colchetes, para consultas entre bancos (`%banco-cbo%..movest`). |

Um literal pode ficar vazio (filtro inativo). Escreva o SQL para continuar válido nesse caso:

- `@dtini datetime = /*macro.dataini->'20150101'*/` — padrão com `->`;
- `@modos varchar(50) = /*macro.modos*/+''` e `if /*macro.horario*/+0 = 0` — sufixo que fecha a expressão;
- `(0 = 0/*macro.com-compra*/)` — o filtro ativo transforma em `0 = 01`, desligando o atalho.

A consulta **raiz** não pode ter parâmetros `:nome` (roda com `ParamCheck=False`).

## Bloco de metadados

Regex de extração: `/\*(\r\n|\s)*(\[((O|o)rdenacao|(F|f)iltro.*|(R|r)elacionamento)\]\r\n(.*\r\n)*)\**/`. Consequências, todas obrigatórias:

1. Um único comentário `/* ... */` no **fim** do arquivo. Se houver mais de um que case, **vale só o último**.
2. A primeira linha útil depois de `/*` é uma seção `[filtro.<id>]`, `[ordenacao]` ou `[relacionamento]`. Comentários comuns (cabeçalho do arquivo) não casam porque não começam com `[`.
3. Todas as linhas terminam em **CRLF**. Com LF o bloco não é reconhecido e a tela fica sem filtros.
4. `*/` sozinho no começo da última linha do bloco.
5. Ordem das seções: filtros → `[ordenacao]` → `[relacionamento]`. `[relacionamento]` é lido até o **último** `*/` do arquivo, então nada depois do bloco.
6. O conteúdo é INI (sem diferenciar maiúsculas nas chaves). Linhas em branco entre seções são aceitas; dentro de `[relacionamento]`, evite.

### `[filtro.<id>]`

Cada seção vira uma aba na tela de filtros. `<id>` é local à consulta; repetir o mesmo `<id>` no mestre e no detalhe reaproveita a aba e aplica a restrição nas duas consultas, cada uma com o seu `campo`.

| Chave | Regra |
|---|---|
| `tipo` | **Obrigatória.** Nome de uma definição existente nos `.filtros` instalados ou em `filtros` do `.conf`. Tipo inexistente vira uma aba de erro "As definições deste filtro não foram encontradas". Ver `filtros.md`. |
| `titulo` | Rótulo da aba. Vazio usa o título da definição. |
| `campo` | Expressão SQL onde a restrição é aplicada (`v.dt_contabil`, `cast(x as date)`). Precisa ser válida no escopo de **toda** macro listada em `macros`. Vários campos com `;` aplicam a mesma restrição a cada um; no período com hora, `data;hora` tem semântica própria. |
| `literal` | Macro(s) literal(is) que recebem o valor formatado, separadas por `;`. Usado em vez de `campo` quando o valor alimenta um `declare`, uma função de tabela ou um `if`. |
| `macros` | Conjuntos de restrição que recebem o filtro. Padrão `filtro`. Ex.: `macros=filtro;filtro1`. |
| `obrigatorio=true` | A aba não pode ser desligada. |
| `grupo=<Nome>[;obrigatorio]` | Abas do mesmo grupo são exclusivas (ativar uma desliga as outras). Use quando dois filtros restringem o **mesmo** `campo`: dois filtros ativos com o mesmo texto de campo colidem e só o último vale. |
| `expressao` | Sobrescreve a expressão da definição; afeta só literais. `{valor}`/`{valor1}` e `{valor2}` são os valores. |
| outras | Viram extras do filtro: `selecao-obrigatoria`, `id-como-inteiro`, `multiplo`, `padrao`, `min`, `max`, `spin`, `regex`, `mascara`. |

Um filtro com `campo` sem a macro correspondente no SQL não restringe nada. Um `campo` com alias inexistente só quebra quando o filtro é ligado; confira o alias em cada trecho onde a macro aparece (os dois lados de um `union`, subconsultas).

### `[ordenacao]`

```
[ordenacao]
titulo=Principal
Nome amigável=<campo ou posição>[->asc|->desc]
Outro=<campo>;obrigatorio;travado
```

- `titulo` nomeia o grupo de ordenação.
- `<campo>` pode ser expressão, alias entre colchetes (`[Dt movimento]`) ou posição ordinal (`1->asc`). Em SQL com `union`, o `order by` final só aceita alias ou posição da saída: use `[Alias]` ou o ordinal.
- Sem `->`, o item começa sem ordenação (o usuário liga).
- Flags: `obrigatorio` (não pode ficar sem ordenação), `travado` (não muda de posição), `bloqueado` (não muda de direção). `obrigatorio` e `bloqueado` iniciam em `asc`.
- **Flags nunca depois de `->asc`**: `campo->asc;obrigatorio` é lido como "sem ordenação". Escreva `campo;obrigatorio` ou `campo->asc` sem flags.
- O resultado vai para `/*macro.ordenacao*/` ou `/*macro.ordenacao+*/`; sem a macro no SQL a aba aparece e não tem efeito.

### `[relacionamento]` (só em detalhe)

```
[relacionamento]
venda_id=venda_id->uniqueidentifier
dia=dia->bit
```

- Cada linha: `campoDetalhe=colunaDoMestre[->tipoSQL]`.
- `colunaDoMestre` é o **alias exato** de uma coluna do `SELECT` do mestre (pode estar oculta no grid). O grid localiza a coluna do mestre por esse nome ao expandir a linha; se não existir: erro `Parametro "x" não encontrado na view "vw..."`.
- Com `->tipo`: `/*macro.relacionamento*/` no topo do SQL gera `declare @colunaDoMestre tipo = :colunaDoMestre`, e toda macro `filtro*` do detalhe recebe `campoDetalhe = @colunaDoMestre`. Use `@colunaDoMestre` livremente no corpo (`from dbo.fn_venda_item(@venda_id, @dia)`).
- Sem `->tipo`: as macros `filtro*` recebem `campoDetalhe = :colunaDoMestre`.
- Detalhe sem macro `filtro*` não recebe cláusula automática; referencie `@colunaDoMestre` (tipado) ou `:colunaDoMestre` à mão.
- `/*macro.relacionamento*/` e `[relacionamento]` ficam só nos detalhes. O SQL de cada detalhe é executado na abertura, então ele precisa ser válido com os parâmetros preenchidos pelo primeiro registro do mestre.

Modelos: `assets/principal.sql` e `assets/detalhe.sql`.

## Teste manual do SQL

Macros são comentários, então o SQL cru roda no SSMS sem filtros, **exceto** quando uma macro completa uma expressão (`@x = /*macro.y*/`). Para testar, use `scripts/validar_relatorio.py --expandir <arquivo.sql>`, que imprime o SQL com todas as macros trocadas pelo padrão (filtros desligados).
