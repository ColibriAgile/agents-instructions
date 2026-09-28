---
name: colibri-report-builder
description: Relatório grid do Colibri Reports — cria ou altera relatórios com saída grid (.conf, SQL com bloco de metadados de filtros/ordenação/relacionamento e grid.ini). Use quando o pedido for montar um relatório ou consulta em grid no Reports, acrescentar uma saída grid ou um detalhe mestre-detalhe a um .conf, ou ajustar filtros, ordenação, colunas, bandas e totais de um grid existente. Não use para layouts .rtm do ReportBuilder nem para alterar o código Delphi do colibri-reports.
---

# Relatório grid do Colibri Reports

Todo relatório grid sai do mesmo **contrato de três camadas**, validado antes da entrega:

1. `.conf`: identidade do relatório, saídas e árvore de consultas.
2. `.sql` de cada consulta: um template T-SQL. O bloco de metadados no fim do arquivo desenha as abas de filtro e de ordenação e liga o detalhe ao mestre.
3. `grid\<id da saída>\`: o layout das colunas, bandas e totais.

`<skill-dir>` é a pasta deste `SKILL.md`. Os helpers exigem Python 3:

- `scripts/validar_relatorio.py`: **somente leitura**;
- `scripts/gerar_grid_ini.py`: **altera** arquivos, grava o layout;
- `scripts/normalizar_arquivos.py`: **altera** arquivos, regrava em UTF-8 com BOM e CRLF.

## Arquitetura em uma tela

```
<PastaRaiz>\                       (pai de client\colibriReports.exe)
  reports\<produto>\filtros\*.filtros    definições globais de filtro (tipo -> modelo)
  reports\<produto>\<categoria>\<nome>\
    <categoria>-<nome>.conf            descoberto por varredura recursiva de *.conf
    sql\<consulta>.sql                 template + bloco /* [filtro.x] [ordenacao] [relacionamento] */
    grid\<id da saída>\grid.ini        layout da view raiz (vw1)
    grid\<id da saída>\grid.vw<id>.ini layout de cada detalhe
    grid\<id da saída>\estilos.ini
```

Na execução, o app lê o `.conf`. A partir dos blocos de todos os SQLs da saída, monta a tela de filtros (cada `[filtro.x]` aponta uma definição por `tipo=`). Em seguida troca as macros `/*macro.*/` pelas restrições escolhidas, executa as consultas como hierarquia ADO mestre-detalhe e abre o grid aplicando o `grid.ini`.

## Etapas

**Etapa 1: Situar o relatório**

1. Descubra a `PastaRaiz` da instalação-alvo e o produto (padrão `pos`). Se não estiverem claros no pedido nem no ambiente, pergunte.
2. Para **alteração**, leia integralmente o `.conf`, todos os `.sql` da saída e os arquivos de `grid\<id da saída>\`. Rode o validador sobre o estado atual para separar defeitos antigos dos novos.
3. Para **criação**, defina a pasta do relatório pela tabela "Onde colocar" de `references/conf.md`.
4. Liste o catálogo de filtros da instalação:
   `python <skill-dir>/scripts/validar_relatorio.py --listar-filtros --pasta-raiz "<PastaRaiz>"`

*Concluído quando:* a pasta do relatório está definida, o catálogo de `tipo`s está listado e, se for alteração, todos os arquivos existentes da saída foram lidos.

**Etapa 2: Projetar**

1. Leia `references/sql.md` e `references/filtros.md` por inteiro antes de projetar.
2. Monte a árvore de consultas: uma raiz (a primeira raiz é a única que o grid mostra) e detalhes com `id` ASCII.
3. Monte a tabela de colunas de cada consulta: alias, tipo SQL, editor (`texto`, `inteiro`, `moeda`, `decimal`, `data`, `check`), formato, banda, visibilidade, agrupamento, total.
4. Monte a tabela de filtros: `id`, `tipo` presente no catálogo, `campo` ou `literal`, `macros`. Monte também a de ordenação.
5. Para cada detalhe, liste as colunas do mestre que o ligam; todas precisam estar no `SELECT` do mestre.
6. Se o pedido exigir um `tipo` de filtro inexistente, proponha a definição local (`filtros.md`, "Definição local no `.conf`") e confirme com o usuário.

*Concluído quando:* cada coluna, filtro, ordenação e ligação mestre-detalhe está tabelado, e todo `tipo` usado existe no catálogo ou tem definição local aprovada.

**Etapa 3: Escrever os SQLs**

1. Parta de `assets/principal.sql` (raiz) e `assets/detalhe.sql` (detalhe).
2. Coloque `/*macro.filtro*/` ou `/*macro.filtro+*/` em cada trecho que deve receber as restrições. Num `union`, isso significa os dois lados.
3. Coloque `/*macro.ordenacao*/` onde vai o `order by`.
4. Nos detalhes, abra o arquivo com `/*macro.relacionamento*/` e use `@colunaDoMestre`.
5. Feche cada arquivo com um único bloco de metadados na ordem `[filtro.*]` → `[ordenacao]` → `[relacionamento]`, com `*/` na última linha.

*Concluído quando:* todo `campo` e `literal` da tabela de filtros tem a macro correspondente no SQL, e cada detalhe referencia só colunas existentes no mestre.

**Etapa 4: Escrever o `.conf`**

1. Leia `references/conf.md` por inteiro e parta de `assets/relatorio.conf`.
2. Gere um GUID novo para o relatório (`python -c "import uuid;print('{%s}' % str(uuid.uuid4()).upper())"`).
3. Escreva o `id` da saída (vira o nome da pasta `grid\`) e o array `sqls`, com o mestre antes dos detalhes.
4. Em alteração, preserve os ids existentes de relatório, saída e consulta.

*Concluído quando:* o `.conf` tem produto, id, título, categoria e ao menos uma saída grid, e cada `sqls[].sql` aponta um arquivo existente.

**Etapa 5: Gerar o layout**

1. Leia `references/grid-ini.md` por inteiro.
2. Escreva um spec JSON por view. Parta de `assets/grid-spec.vw1.json` (raiz) e `assets/grid-spec.detalhe.json` (detalhe, com `"view": "<id da consulta>"`). Declare **todas** as colunas do `SELECT`, na ordem de exibição, com `campo` = alias exato (um alias repetido vira `<alias>_1`). Toda view com dois ou mais detalhes fica com `abas_detalhe` = `topo` (o padrão) ou `esquerda`.
3. Rode o gerador para cada view:
   `python <skill-dir>/scripts/gerar_grid_ini.py --spec <spec.json> --saida "<pasta do relatório>/grid/<id da saída>"`
   Use `--sobrescrever` ao regerar. Na primeira execução o gerador copia `assets/estilos.ini` para a pasta.
4. Se o gerador sair com `ERRO`, corrija o spec (ou o alias no SQL) conforme a mensagem e rode de novo; o ini só é gravado quando o spec inteiro é válido.
5. Mantenha os specs fora da pasta do relatório. O app não os lê.

*Concluído quando:* existe `grid.ini` e um `grid.vw<id>.ini` por detalhe, e a lista "nome ← campo" impressa pelo gerador cobre todas as colunas de cada `SELECT`.

**Etapa 6: Validar**

1. Rode `python <skill-dir>/scripts/normalizar_arquivos.py <cada .conf, .sql e .ini escrito>`.
2. Rode `python <skill-dir>/scripts/validar_relatorio.py "<arquivo.conf>" --pasta-raiz "<PastaRaiz>"`.
3. Corrija todo `ERRO` e releia cada `AVISO`. Um aviso sobre coluna faltando ou sobrando no ini indica alias divergente entre o SQL e o spec. A extração de aliases é heurística: quando não confirmar, confira à mão.
4. Com acesso ao banco, rode `validar_relatorio.py --expandir <arquivo.sql>` e execute o resultado (filtros desligados) para confirmar sintaxe, colunas e tipos.

*Concluído quando:* o validador sai com código 0, todo aviso restante está explicado ao usuário e, com banco disponível, cada SQL expandido executa.

**Etapa 7: Conferir no Reports**

1. Quando o app estiver disponível, abra `<PastaRaiz>\client\colibriReports.exe -editar`, execute o relatório e use "Editar report". Confira primeiro os totais do rodapé e do grupo: a recriação dos itens de total no restore não é comprovada pelo código, então um total ausente ou duplicado deve ser ajustado na tela e salvo. Depois confira colunas, bandas e a expansão dos detalhes.
2. Salvar (Ctrl+S) ou fechar no modo edição **regrava** o `grid.ini` com o layout da tela. Depois disso, rode o validador de novo.
3. Sem acesso ao app, registre no relatório final que a verificação visual está pendente.

*Concluído quando:* o grid abriu com o layout esperado, ou a pendência de verificação visual está declarada.

## Erros comuns

| Sintoma | Causa e correção |
|---|---|
| Relatório não aparece na lista | `produto` diferente, JSON inválido (aviso na carga), `tipo` de saída inválido ou `id` duplicado. Rode o validador. |
| Tela de filtros sem abas | Bloco de metadados não reconhecido: LF em vez de CRLF, texto antes da primeira seção, `*/` fora do início da linha. Rode `normalizar_arquivos.py`. |
| Aba "As definições deste filtro não foram encontradas" | `tipo=` fora do catálogo. Use um tipo listado ou uma definição local. |
| `grid.ini` sumiu depois de abrir o grid | O restore falhou e o app apagou o arquivo. Regere com `gerar_grid_ini.py` e valide. |
| Colunas embaralhadas | Colunas do SQL sem seção no ini. Declare todas no spec. |
| Detalhe não aparece | O `master` vem depois do detalhe no array ou tem maiúsculas diferentes. |
| `Parametro "x" não encontrado na view` | O detalhe usa uma coluna que não está no `SELECT` do mestre. |
| Aba de ordenação sem efeito | Falta `/*macro.ordenacao*/`, ou uma flag foi escrita depois de `->asc`. |
