# Layout do grid — `grid\<id da saída>\`

O layout de uma saída grid fica em `<pasta do .conf>\grid\<id da saída>\`. É o formato `cxStorage` do DevExpress, restaurado com uma lista fechada de propriedades. Gere-o com `scripts/gerar_grid_ini.py`: o script produz exatamente o conjunto de chaves e a codificação de valores dos arquivos reais.

Fontes: `source/ui/form.grid.pas:564-915`, `source/src/relatorios.grid.pas` (whitelist `TListaDeClasses.Popular`: 354-509; persistência: 565-1047), `source/src/devexpress.helpers.pas` (editores: 1072-1107; formatos: 385-393; totalizar: 1037-1070; estilos: 1224-1261, 1595-1675). Exemplos: `reports\pos\listagens\perfis\grid\lista-perfis\`, `reports\pos\delivery\entregas\grid\{7C0C...}\`, `reports\pos\auditoria\consumo de movimentos encerrados\grid\grid-consumo\`.

## Arquivos

| Arquivo | Conteúdo | Quem escreve |
|---|---|---|
| `grid.ini` | view raiz `vw1` (primeira consulta raiz) | autor (script ou modo edição do app) |
| `grid.vw<idDetalhe>.ini` | uma view de detalhe por consulta com `master` | autor |
| `estilos.ini` | estilos nomeados usados em `styles.*` | autor (copie `assets/estilos.ini`) |
| `regras.ini`, `regras.vw<id>.ini` | formatação condicional | só pelo app (Ctrl+R no modo edição) |
| `grid_user.ini`, `grid.vw<id>_user.ini` | layout pessoal do usuário final | app, ao fechar em produção; não distribuir |

## Ciclo no app (por que as regras abaixo existem)

1. Estilos são carregados antes das views. Sem `estilos.ini`, ficam os 4 estilos embutidos. Com o arquivo, **só** os estilos dele existem.
2. `vw1`: o app apaga as colunas, cria uma por campo do dataset (`CreateAllItems`) e atribui o editor pelo tipo do campo.
3. Conta as ocorrências do texto `/Bands/` no `grid.ini` e cria bandas até esse número.
4. Restaura o ini **sem criar nem remover filhos**: seções de colunas que não existem no SQL são ignoradas; colunas do SQL sem seção ficam com os padrões e vão para a banda 0, posição 0, empurrando as outras.
5. Posições são reaplicadas por banda e ordem.
6. **Qualquer exceção no restore apaga o arquivo** e o grid sobe sem layout, sem aviso.
7. Detalhes só ganham colunas quando o usuário expande a primeira linha; o ini do detalhe é aplicado nesse momento.

Consequências: declare **todas** as colunas do SQL, com os nomes exatos; um ini com defeito some. Rode `scripts/validar_relatorio.py` antes de entregar.

## Nomes

| | View raiz | Detalhe |
|---|---|---|
| Arquivo | `grid.ini` | `grid.vw<id>.ini` |
| Prefixo das seções | `formGrid.vw1` | `lvl<id>.vw<id>` |
| Classe da view | `TcxGridDBBandedTableView` | `TcxGridBandedTableView` |
| Classe da coluna | `TcxGridDBBandedColumn` | `TcxGridBandedColumn` |
| Classe do item de total | `TcxGridDBTableSummaryItem` (com `FieldName=""`) | `TcxGridTableSummaryItem` |
| Chave `datacontroller.keyfieldnames` | presente (`""`) | ausente |
| Nome da coluna | `vw1` + alias **sem** tudo o que não for `[A-Za-z0-9_]` (acentos somem, não viram letra sem acento) | `vw<id>` + alias sem acentos (transliterados: `ç→c`, `ã→a`) e sem espaços |

Exemplos de nome na raiz: `[Código]`→`vw1Cdigo`, `[Dt.contábil]`→`vw1Dtcontbil`, `[Nº venda]`→`vw1Nvenda`, `[Tx. entrega]`→`vw1Txentrega`, `vl_total`→`vw1vl_total`, segundo `dt_contabil`→`vw1dt_contabil_1`. Detalhe `consumos`, alias `vl_total` → `vwconsumosvl_total`.

## Estrutura

```ini
[Main]
Version=2

[formGrid.vw1: TcxGridDBBandedTableView]
=
SourceDPI=96
...chaves da view e Level.*...

[formGrid.vw1/Bands: TcxGridBands]
=

[formGrid.vw1/Bands/Band0: TcxGridBand]
=
...chaves da banda...

[formGrid.vw1/vw1Cdigo: TcxGridDBBandedColumn]
=
SourceDPI=96
...chaves da coluna...

[formGrid.vw1/FooterSummaryItem0: TcxGridDBTableSummaryItem]
=
Column="vw1Total"
...

[formGrid.vw1/DefaultGroupSummaryItem0: TcxGridDBTableSummaryItem]
=
...

[formGrid.vw1/ConditionalFormattingProvider: TcxGridConditionalFormattingProvider]
=
Count=0
```

- A linha `=` depois de cada cabeçalho faz parte do formato.
- Chaves em minúsculas; valores booleanos e enums por nome entre aspas (`"True"`, `"soAscending"`, `"taCenter"`); inteiros, cores e enums por ordinal sem aspas.
- UTF-8 com BOM, CRLF.
- O texto `/Bands/` só aparece nos cabeçalhos das bandas: ele é contado para criar bandas.

## Decisões de layout que o script expõe

| Decisão | Chaves resultantes |
|---|---|
| Título | coluna `caption` (spec `titulo`, padrão = alias); view `Level.caption` (spec `titulo_aba`; título da aba do detalhe, padrão = id da consulta) |
| Abas de detalhe | view `Level.options.detailtabsposition` (spec `abas_detalhe`: `topo` padrão, `esquerda`, `nenhuma`). Uma view com dois ou mais detalhes precisa de `topo` ou `esquerda`; com `nenhuma`, só um detalhe fica acessível |
| Área de agrupamento, linha de filtro, rodapé | view `optionsview.groupbybox` (spec `area_agrupamento`, padrão ligado na raiz), `filterrow.visible` (`linha_filtro`), `optionsview.footer` (`rodape`, padrão ligado quando há total) |
| Visível / largura | `visible`, `width` (ids técnicos: `visible="False"`) |
| Bandas | seções `Bands/BandN` com `caption`, `position.colindex=N`, `position.bandindex=-1`; coluna `position.bandindex`; view `optionsview.bandheaders="True"` quando há mais de uma |
| Ordem | coluna `position.colindex` sequencial dentro da banda |
| Agrupar | coluna `groupindex=0,1,...` (`-1` = não agrupa), com `sortorder` |
| Ordenar | coluna `sortindex`, `sortorder="soAscending"\|"soDescending"` |
| Formato | `properties.displayformat` do editor: dinheiro `R$ ,0.00;-R$ ,0.00`, valor `,0.00`, quantidade `,0.###`, data `dd/MM/yyyy`, data/hora `dd/MM/yy hh:nn` |
| Totais | coluna `summary.footerkind` (0 nenhum, 1 soma, 2 mín, 3 máx, 4 qtd, 5 média) e `summary.footerformat`; no grupo também `groupkind/groupfooterkind` e formatos; seções `FooterSummaryItemN`/`DefaultGroupSummaryItemN` coerentes; view `optionsview.footer="True"` |
| Estilo | coluna `styles.content="Negrito"` etc.: só nomes existentes em `estilos.ini` (`TextoVermelho`, `TextoVerde`, `Negrito`, `FundoCinzaTextoBranco`) ou embutidos (`styOdd`, `styFooter`, `styHeader`, `styGroup`, `styGroupByBox`, `styBand`). Nome desconhecido é ignorado sem erro. |

O editor é decidido **pelo app** a partir do tipo ADO do campo; o `editor` do spec só escolhe o bloco `properties.*` compatível. Propriedade que o editor real não tem é ignorada (sem erro): um editor errado perde a formatação, não o arquivo. `numeric`/`decimal` chegam como decimal (BCD desligado), `money` como moeda, `uniqueidentifier` como texto.

Formatação condicional, estilos novos e ajustes finos (largura exata, várias linhas por coluna) ficam para o modo edição do app.
