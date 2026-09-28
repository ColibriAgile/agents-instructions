#!/usr/bin/env python3
"""Gera grid.ini / grid.vw<id>.ini do Colibri Reports a partir de um spec JSON.

Uso:
  python gerar_grid_ini.py --spec <spec.json> --saida <pasta grid\\<id da saida>> [--sobrescrever]

O spec descreve UMA view (raiz "vw1" ou um detalhe pelo id da consulta).
Formato: ver assets/grid-spec.exemplo.json da skill colibri-report-builder.

Grava UTF-8 com BOM e CRLF. Copia assets/estilos.ini para a pasta se ainda nao existir.
Sai com codigo 1 e mensagem em stderr quando o spec e invalido.
"""
import argparse
import json
import os
import re

import sys
import unicodedata

EMBUTIDOS = {"styodd", "styfooter", "styheader", "styrtti", "styrttinome", "styrttitipo",
             "stygroupbybox", "stygroup", "styfindpanel", "styband"}

EDITORES = {"texto", "inteiro", "moeda", "decimal", "data", "check"}

FORMATOS = {
    "dinheiro": "R$ ,0.00;-R$ ,0.00",
    "valor": ",0.00",
    "quantidade": ",0.###",
    "data": "dd/MM/yyyy",
    "datahora": "dd/MM/yy hh:nn",
}

FORMATO_PADRAO = {"moeda": "dinheiro", "decimal": "valor", "data": "data"}

ALINHAMENTO_PADRAO = {"texto": "esquerda", "inteiro": "direita", "moeda": "direita",
                      "decimal": "direita", "data": "centro", "check": "centro"}
ALINHAMENTO_TA = {"esquerda": "taLeftJustify", "direita": "taRightJustify", "centro": "taCenter"}
ALINHAMENTO_ORD = {"esquerda": 0, "direita": 1, "centro": 2}

TOTAIS = {  # nome -> (ordinal TcxSummaryKind, Kind, prefixo do formato)
    "soma": (1, "skSum", ""),
    "min": (2, "skMin", "Mín: "),
    "max": (3, "skMax", "Máx: "),
    "qtd": (4, "skCount", None),
    "media": (5, "skAverage", "Méd: "),
}

ABAS = {"nenhuma": 0, "esquerda": 1, "topo": 2}


def falhar(msg):
    sys.stderr.write("ERRO: " + msg + "\n")
    sys.exit(1)


def q(valor):
    texto = str(valor)
    if '"' in texto:
        falhar('valor com aspas duplas nao e suportado: %s' % texto)
    return '"%s"' % texto


def b(valor):
    return '"True"' if valor else '"False"'


def sem_acentos(texto):
    return "".join(c for c in unicodedata.normalize("NFKD", texto) if not unicodedata.combining(c))


def nome_coluna(view, campo):
    if view == "vw1":
        return "vw1" + re.sub(r"[^A-Za-z0-9_]", "", campo)
    nome = "vw" + view + sem_acentos(campo).replace(" ", "").strip()
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", nome):
        falhar('alias "%s" do detalhe "%s" gera nome de componente invalido (%s); '
               'use alias ASCII snake_case no SQL do detalhe' % (campo, view, nome))
    return nome


def ler_estilos(pasta):
    nomes = set(EMBUTIDOS)
    arquivo = os.path.join(pasta, "estilos.ini")
    if os.path.exists(arquivo):
        with open(arquivo, encoding="utf-8-sig") as f:
            for linha in f:
                m = re.match(r"\[(\w+):", linha)
                if m:
                    nomes.add(m.group(1).lower())
    return nomes


def bloco_view(spec, detalhe, tem_total, qtd_bandas):
    abas = spec.get("abas_detalhe", "topo")
    if abas not in ABAS:
        falhar("abas_detalhe deve ser um de %s" % sorted(ABAS))
    linhas = ["SourceDPI=96"]
    if not detalhe:
        linhas.append('datacontroller.keyfieldnames=""')
    linhas += [
        "datacontroller.options.dcogroupsalwaysexpanded=28",
        'datetimehandling.dateformat=""',
        "datetimehandling.grouping=1",
        'datetimehandling.hourformat=""',
        'datetimehandling.ignoretimeforfiltering="False"',
        'datetimehandling.monthformat=""',
        'datetimehandling.uselongdateformat="True"',
        'datetimehandling.useshorttimeformat="True"',
        'datetimehandling.yearformat=""',
        'filterrow.operatorcustomization="True"',
        "filterrow.separatorcolor=14275016",
        "filterrow.separatorwidth=5",
        "filterrow.visible=" + b(spec.get("linha_filtro", False)),
        'optionsview.bandheaderendellipsis="False"',
        "optionsview.bandheaderheight=0",
        "optionsview.bandheaderlinecount=1",
        "optionsview.bandheaders=" + b(spec.get("cabecalho_bandas", qtd_bandas > 1)),
        'optionsview.cellautoheight="True"',
        'optionsview.cellendellipsis="False"',
        "optionsview.columnautowidth=" + b(spec.get("ajustar_largura", False)),
        "optionsview.datarowheight=0",
        "optionsview.footer=" + b(spec.get("rodape", tem_total)),
        'optionsview.footerautoheight="True"',
        'optionsview.footermultisummaries="True"',
        "optionsview.gridlines=2",
        "optionsview.groupbybox=" + b(spec.get("area_agrupamento", not detalhe)),
        "optionsview.groupbyheaderlayout=1",
        'optionsview.groupfootermultisummaries="True"',
        "optionsview.groupfooters=0",
        "optionsview.grouprowheight=0",
        "optionsview.groupsummarylayout=1",
        'optionsview.header="True"',
        'optionsview.headerautoheight="True"',
        'optionsview.headerendellipsis="False"',
        "optionsview.headerheight=0",
        "optionsview.rowseparatorcolor=536870912",
        "optionsview.rowseparatorwidth=0",
        "optionsview.scrollbars=3",
        'styles.bandheader="styBand"',
        'styles.content=""',
        'styles.contenteven=""',
        'styles.contentodd="styOdd"',
        'styles.footer="styFooter"',
        'styles.group="styGroup"',
        'styles.groupbybox="styGroupByBox"',
        'styles.groupsummary=""',
        'styles.header="styHeader"',
        "Level.caption=" + q(spec.get("titulo_aba", spec.get("view", "") if detalhe else "")),
        "Level.options.detailframecolor=536870912",
        "Level.options.detailframewidth=1",
        "Level.options.detailtabsposition=%d" % ABAS[abas],
        "Level.styles.tab=" + q("styGroup" if detalhe else ""),
        'Level.styles.tabsbackground=""',
    ]
    return linhas


def bloco_banda(indice, titulo):
    if "/Bands/" in titulo:
        falhar('titulo de banda nao pode conter "/Bands/"')
    return [
        "width=0",
        'visible="True"',
        "position.bandindex=-1",
        "position.colindex=%d" % indice,
        "caption=" + q(titulo),
        'headeralignmenthorz="taCenter"',
        'headeralignmentvert="vaCenter"',
        'fixedkind="fkNone"',
        'styles.content=""',
        'styles.background=""',
        'styles.header=""',
    ]


def propriedades(editor, alinh, formato):
    horz = ALINHAMENTO_ORD[alinh]
    alinhamento = ["properties.alignment.horz=%d" % horz, "properties.alignment.vert=2"]
    if editor == "texto":
        return alinhamento + ['properties.assignedvalues.displayformat="False"']
    if editor == "inteiro":
        return alinhamento + ['properties.assignedvalues.displayformat="True"',
                              'properties.assignedvalues.valuetype="True"',
                              "properties.displayformat=" + q(formato),
                              "properties.valuetype=0"]
    if editor == "moeda":
        return alinhamento + ['properties.assignedvalues.displayformat="True"',
                              'properties.assignedvalues.decimalplaces="True"',
                              "properties.decimalplaces=2",
                              "properties.displayformat=" + q(formato),
                              'properties.usethousandseparator="False"']
    if editor == "decimal":
        return alinhamento + ['properties.assignedvalues.displayformat="True"',
                              'properties.assignedvalues.precision="True"',
                              "properties.displayformat=" + q(formato),
                              "properties.precision=15",
                              'properties.scientificformat="False"',
                              'properties.usethousandseparator="False"']
    if editor == "data":
        return alinhamento + ['properties.assignedvalues.displayformat="True"',
                              "properties.displayformat=" + q(formato)]
    return ['properties.displaychecked="Sim"', 'properties.displayunchecked="Não"',
            'properties.multiline="False"', 'properties.showendellipsis="False"']


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--saida", required=True, help="pasta grid\\<id da saida>")
    ap.add_argument("--sobrescrever", action="store_true")
    args = ap.parse_args()

    with open(args.spec, encoding="utf-8-sig") as f:
        spec = json.load(f)

    view_id = spec.get("view", "vw1")
    detalhe = view_id != "vw1"
    if detalhe and not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", view_id):
        falhar('id do detalhe "%s" deve ser identificador ASCII (igual ao id da consulta no .conf)' % view_id)
    view = "vw1" if not detalhe else view_id
    vwnome = "vw1" if not detalhe else "vw" + view_id
    prefixo = "formGrid.vw1" if not detalhe else "lvl%s.vw%s" % (view_id, view_id)
    classe_view = "TcxGridBandedTableView" if detalhe else "TcxGridDBBandedTableView"
    classe_col = "TcxGridBandedColumn" if detalhe else "TcxGridDBBandedColumn"
    classe_sum = "TcxGridTableSummaryItem" if detalhe else "TcxGridDBTableSummaryItem"
    arquivo = os.path.join(args.saida, "grid.ini" if not detalhe else "grid.vw%s.ini" % view_id)

    if os.path.exists(arquivo) and not args.sobrescrever:
        falhar("%s ja existe; use --sobrescrever para substituir" % arquivo)

    bandas = spec.get("bandas") or ["Padrão" if detalhe else "Banda única"]
    colunas = spec.get("colunas") or []
    if not colunas:
        falhar("spec sem colunas: declare todas as colunas do SELECT")

    os.makedirs(args.saida, exist_ok=True)
    estilos_destino = os.path.join(args.saida, "estilos.ini")
    copiou_estilos = False
    if not os.path.exists(estilos_destino):
        origem = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "estilos.ini")
        with open(origem, encoding="utf-8-sig") as f:
            conteudo = f.read()
        with open(estilos_destino, "w", encoding="utf-8-sig", newline="\r\n") as f:
            f.write(conteudo)
        copiou_estilos = True
    estilos = ler_estilos(args.saida)

    nomes = {}
    pos_banda = {}
    ordenados = []
    tem_total = False
    for c in colunas:
        campo = c.get("campo")
        if not campo:
            falhar("coluna sem 'campo' (alias exato do SQL)")
        nome = nome_coluna(view, campo)
        if nome.lower() in nomes:
            falhar('colunas "%s" e "%s" geram o mesmo nome %s; aliases repetidos chegam como <alias>_1'
                   % (nomes[nome.lower()], campo, nome))
        nomes[nome.lower()] = campo
        editor = c.get("editor", "texto")
        if editor not in EDITORES:
            falhar('editor "%s" invalido em "%s"; use %s' % (editor, campo, sorted(EDITORES)))
        banda = int(c.get("banda", 0))
        if not 0 <= banda < len(bandas):
            falhar('banda %d de "%s" fora de 0..%d' % (banda, campo, len(bandas) - 1))
        c["_nome"], c["_banda"] = nome, banda
        c["_col"] = pos_banda.get(banda, 0)
        pos_banda[banda] = c["_col"] + 1
        if c.get("total"):
            tem_total = True
        if c.get("agrupar") is not None or c.get("ordenar"):
            ordenados.append(c)

    agrupadas = sorted([c for c in ordenados if c.get("agrupar") is not None], key=lambda c: int(c["agrupar"]))
    so_ordenadas = [c for c in ordenados if c.get("agrupar") is None]
    for i, c in enumerate(agrupadas + so_ordenadas):
        c["_sortindex"] = i

    saida = ["[Main]", "Version=2", ""]
    saida += ["[%s: %s]" % (prefixo, classe_view), "="] + bloco_view(spec, detalhe, tem_total, len(bandas)) + [""]
    saida += ["[%s/Bands: TcxGridBands]" % prefixo, "=", ""]
    for i, titulo in enumerate(bandas):
        saida += ["[%s/Bands/Band%d: TcxGridBand]" % (prefixo, i), "="] + bloco_banda(i, titulo) + [""]

    rodape, grupo = [], []
    for c in colunas:
        editor = c.get("editor", "texto")
        alinh = c.get("alinhamento", ALINHAMENTO_PADRAO[editor])
        if alinh not in ALINHAMENTO_TA:
            falhar('alinhamento "%s" invalido em "%s"' % (alinh, c["campo"]))
        fmt_nome = c.get("formato", FORMATO_PADRAO.get(editor))
        if fmt_nome and fmt_nome not in FORMATOS:
            falhar('formato "%s" invalido em "%s"; use %s' % (fmt_nome, c["campo"], sorted(FORMATOS)))
        formato = FORMATOS.get(fmt_nome, "") if editor not in ("texto", "check") else ""
        titulo = c.get("titulo", c["campo"])
        if "/Bands/" in titulo:
            falhar('titulo de coluna nao pode conter "/Bands/"')
        estilo = c.get("estilo", "")
        if estilo and estilo.lower() not in estilos:
            falhar('estilo "%s" de "%s" nao existe em estilos.ini nem nos embutidos' % (estilo, c["campo"]))

        total = c.get("total")
        kind, kind_nome, fmt_total = 0, "", ""
        if total:
            if total not in TOTAIS:
                falhar('total "%s" invalido em "%s"; use %s' % (total, c["campo"], sorted(TOTAIS)))
            if editor in ("texto", "check") and total != "qtd":
                falhar('coluna "%s" (%s) so aceita total "qtd"' % (c["campo"], editor))
            kind, kind_nome, prefixo_fmt = TOTAIS[total]
            fmt_total = "Qtd: 0" if prefixo_fmt is None else (prefixo_fmt + formato if formato else "")
            rodape.append((c["_nome"], fmt_total, kind_nome))
            if c.get("total_grupo"):
                grupo.append((c["_nome"], fmt_total, kind_nome))
        gkind = kind if (total and c.get("total_grupo")) else 0
        gfmt = fmt_total if gkind else ""

        agrupar = c.get("agrupar")
        ordem = c.get("ordenar", "asc" if agrupar is not None else None)
        if ordem not in (None, "asc", "desc"):
            falhar('ordenar deve ser "asc" ou "desc" em "%s"' % c["campo"])
        ta = ALINHAMENTO_TA[alinh]
        linhas = [
            "SourceDPI=96",
            "caption=" + q(titulo),
            'datetimegrouping="dtgDefault"',
            "footeralignmenthorz=" + q(ta),
            "groupindex=%d" % (int(agrupar) if agrupar is not None else -1),
            "groupsummaryalignment=" + q(ta),
            "headeralignmenthorz=" + q(ta),
            'headeralignmentvert="vaCenter"',
            "minwidth=20",
            'options.autowidthsizable="True"',
            'options.filtering="True"',
            "options.filterrowoperator=0",
            'options.groupfooters="True"',
            'options.grouping="True"',
            'options.horzsizing="True"',
            'options.ignoretimeforfiltering="True"',
            'options.incsearch="True"',
            'options.moving="True"',
            'options.sorting="True"',
            "position.bandindex=%d" % c["_banda"],
            "position.colindex=%d" % c["_col"],
            "position.linecount=1",
            "position.rowindex=0",
        ] + propriedades(editor, alinh, formato) + [
            "sortindex=%d" % c.get("_sortindex", -1),
            "sortorder=" + q({"asc": "soAscending", "desc": "soDescending"}.get(ordem, "soNone")),
            "summary.footerformat=" + q(fmt_total),
            "summary.footerkind=%d" % kind,
            'summary.groupfooterformat=""',
            "summary.groupfooterkind=0",
            "summary.groupformat=" + q(gfmt),
            "summary.groupkind=%d" % gkind,
            'summary.sortbygroupfootersummary="False"',
            'summary.sortbygroupsummary="False"',
            "visible=" + b(c.get("visivel", True)),
            'visibleforcustomization="True"',
            "width=%d" % int(c.get("largura", 100)),
            "styles.content=" + q(estilo),
            'styles.footer=""',
            'styles.groupsummary=""',
            'styles.header=""',
        ]
        saida += ["[%s/%s: %s]" % (prefixo, c["_nome"], classe_col), "="] + linhas + [""]

    def itens(lista, secao, posicao):
        blocos = []
        for i, (col, fmt, kind_nome) in enumerate(lista):
            blocos += ["[%s/%s%d: %s]" % (prefixo, secao, i, classe_sum), "=",
                       "Column=" + q(col), "Format=" + q(fmt), "Kind=" + q(kind_nome),
                       "Position=" + q(posicao), "Tag=0"]
            if not detalhe:
                blocos.append('FieldName=""')
            blocos += ['DisplayText=""', 'Sorted="False"', 'VisibleForCustomization="True"', ""]
        return blocos

    saida += itens(rodape, "FooterSummaryItem", "spFooter")
    saida += itens(grupo, "DefaultGroupSummaryItem", "spGroup")
    saida += ["[%s/ConditionalFormattingProvider: TcxGridConditionalFormattingProvider]" % prefixo, "=", "Count=0", ""]

    with open(arquivo, "w", encoding="utf-8-sig", newline="\r\n") as f:
        f.write("\n".join(saida))

    print("gerado: %s" % arquivo)
    print("view: %s | bandas: %d | colunas: %d | totais rodape: %d | totais grupo: %d"
          % (vwnome, len(bandas), len(colunas), len(rodape), len(grupo)))
    for c in colunas:
        print("  %-40s <- %s" % (c["_nome"], c["campo"]))
    if copiou_estilos:
        print("copiado: %s" % estilos_destino)


if __name__ == "__main__":
    main()
