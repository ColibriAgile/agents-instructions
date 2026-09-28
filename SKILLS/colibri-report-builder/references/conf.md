# Arquivo `.conf` — contrato

O `.conf` é o único arquivo que o Reports procura no disco. Ele dá identidade ao relatório, lista as saídas e monta a árvore de consultas de cada saída. Filtros, ordenação e relacionamento **não** ficam aqui: ficam no bloco de metadados de cada `.sql` (ver `sql.md`).

Fontes: `_colibri-lib/src/relatorios/relatorios.configuracao.json.pas:399-519`, `relatorios.configuracao.pas:310-580`, `relatorios.colecao.pas:106-158`, `relatorios.acesso.pas:30-100`.

## Descoberta

- A partir de `PastaRaiz` (pasta pai de `client\`, onde fica `colibriReports.exe`), a coleção varre **recursivamente** `*.conf` em `reports\`, `plugins\`, `plugins-manager\plugins\` e `user\`, nessa ordem.
- Só entram os `.conf` cujo `produto` é igual ao produto do app (`-P`/`--produto`, padrão `pos`), sem diferenciar maiúsculas.
- Cada `.conf` é autocontido: todos os caminhos dele são relativos à pasta onde ele está.
- Um `.conf` que não carrega aparece num aviso agrupado no fim da carga ("Falha ao carregar <arquivo> (<msg>)"). Um `tipo` inválido gera aviso **sem** o nome do arquivo.
- Qualquer `.conf` numa pasta varrida é tentado como relatório, inclusive dentro de `filtros\`.

Onde colocar:

| Destino | Caminho | Uso |
|---|---|---|
| Relatório de sistema | `<PastaRaiz>\reports\<produto>\<categoria>\<nome>\<categoria>-<nome>.conf` | padrão dos relatórios instalados |
| Relatório de usuário | `<PastaRaiz>\user\reports\<slug>\<slug>.conf` | padrão do editor da UI; slug = título em minúsculas, sem acento, espaço→`_` |
| Plugin | `<PastaRaiz>\plugins\<plugin>\reports\...` | relatórios de plugin |

Relatórios em `plugins-manager\plugins` carregam, mas não recebem bloco de controle de acesso. Com login ativo, só um superusuário consegue abri-los.

## Estrutura da pasta do relatório

```
<relatorio>\<nome>.conf
<relatorio>\<nome>.user              (gerado pelo app: última seleção de filtros; não distribuir)
<relatorio>\sql\<consulta>.sql
<relatorio>\grid\<id da saída>\grid.ini
<relatorio>\grid\<id da saída>\grid.vw<idDetalhe>.ini
<relatorio>\grid\<id da saída>\estilos.ini
<relatorio>\rtm\*.rtm                (só saídas rtm)
```

## Nível do relatório

Somente estas chaves são lidas. Qualquer outra é ignorada em silêncio, exceto `filtros` (abaixo). A ordem de gravação do app é `produto, id, titulo, categoria, oculto, saidas`.

| Chave | Regra |
|---|---|
| `produto` | Padrão `pos` quando ausente ou vazio. Grave explicitamente. |
| `id` | Obrigatório na prática. GUID maiúsculo com chaves (`{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`). Precisa ser único entre todos os `.conf` do produto: um id duplicado marca o relatório como "(Id duplicado)" e bloqueia a execução. |
| `titulo` | Nome exibido na lista. Se vazio, o `id` é exibido. |
| `categoria` | Caminho na árvore; `/` cria subgrupos (`Vendas/Delivery`). **Obrigatória**: sem categoria o relatório não recebe bloco de acesso. Reaproveite as categorias existentes (Auditoria, Caixa, Clientes, Conta assinada, Delivery, Estatística, Fiscal, Listagem, Serviço, Vendas…). |
| `oculto` | `false` por padrão; `true` esconde o relatório da lista. |
| `saidas` | **Obrigatória** e não vazia. Sem ela a carga falha (`NaoTemSecaoSaida`); com `[]` o relatório quebra ao executar. |
| `filtros` | Opcional. Array de **definições** de filtro locais, no mesmo formato dos arquivos `.filtros` (ver `filtros.md`). Só vale em `pos`, porque o `.conf` normalmente não tem produto de filtro. Um `tipo` local com o mesmo nome de um global fica sombreado pelo global. |

## Nível da saída

| Chave | Regra para `tipo=grid` |
|---|---|
| `tipo` | `"grid"`. Valores aceitos pelo loader: `rtm, template, grid, xls, pdf, email`; só `rtm`, `grid` e `email` têm engine. Vazio ou desconhecido derruba a carga. |
| `id` | Único dentro do `.conf`; a comparação na execução **diferencia maiúsculas**. Vira o nome da pasta `grid\<id>\`, então precisa ser um nome de pasta válido. Use GUID ou kebab-case ASCII (`lista-perfis`). Trocar o id depois orfana o layout salvo. |
| `titulo` | Título da janela do grid e nome sugerido na exportação. Se vazio, usa o `id`. |
| `opcao` | Rótulo da opção na tela de filtros (ex.: `Sintético`, `Por dia`). |
| `sqls` | Formato atual: array de consultas (abaixo). |
| `sql` | Legado: uma consulta só, chamada `principal`. Se `sql` não for vazio, `sqls` é ignorado. Ao criar, use `sqls`. |
| `arquivo`, `header`, `footer` | Ignorados no grid; omita. |

## Itens de `sqls`

Chaves: `id`, `sql` e `master`, e só elas. A ordem gravada pelo app é pré-ordem: mestre, depois os filhos.

| Chave | Regra |
|---|---|
| `id` | Nome da consulta e do dataset. Na raiz use `principal` ou `mestre`. Nos detalhes use **identificador ASCII** (`[A-Za-z0-9_]`, sem espaço, hífen nem acento): ele vira o nome dos componentes `lvl<id>`/`vw<id>` e o nome do arquivo `grid.vw<id>.ini`. |
| `sql` | Caminho relativo à pasta do `.conf`, **sem `\` inicial**, com a barra escapada no JSON: `"sql\\vendas-por-dia.sql"`. O arquivo não é conferido na carga; só falha ao executar. |
| `master` | `""` na raiz. Nos detalhes, o `id` do mestre com as mesmas maiúsculas. **O mestre precisa vir antes no array**: um detalhe cujo mestre ainda não apareceu é descartado em silêncio. Aceita vários níveis. |

O grid liga ao `vw1` **somente a primeira consulta raiz**. Outras consultas com `master: ""` na mesma saída grid são ignoradas pelo grid; crie outra saída para elas.

## Formato do arquivo

- UTF-8 **com BOM**, CRLF, indentação com tab (como o app grava).
- Barras invertidas escapadas (`\\`).
- Uma vírgula sobrando no fim de um array é tolerada, mas não a escreva.

Modelo pronto: `assets/relatorio.conf`.
