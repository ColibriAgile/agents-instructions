#!/usr/bin/env python3
"""Valida um relatorio do Colibri Reports (somente leitura).

Uso:
  python validar_relatorio.py <arquivo.conf> [--pasta-raiz <PastaRaiz>] [--produto pos]
  python validar_relatorio.py --listar-filtros --pasta-raiz <PastaRaiz> [--produto pos]
  python validar_relatorio.py --expandir <arquivo.sql>

Validacao: imprime ERRO/AVISO por arquivo e sai com codigo 1 se houver ERRO.
--listar-filtros: imprime os tipos de filtro (.filtros) disponiveis na instalacao.
--expandir: imprime o SQL com as macros trocadas pelo padrao (todos os filtros desligados).
"""
import argparse
import glob
import json
import os
import re
import sys
import unicodedata

TIPOS_SAIDA = {"rtm", "template", "grid", "xls", "pdf", "email"}
EMBUTIDOS = {"styodd", "styfooter", "styheader", "styrtti", "styrttinome", "styrttitipo",
             "stygroupbybox", "stygroup", "styfindpanel", "styband"}
RE_BLOCO = re.compile(r"/\*(\r\n|\s)*(\[(((O|o)rdenacao)|((F|f)iltro.*)|((R|r)elacionamento))\]\r\n(.*\r\n)*)\**/")
RE_MACRO = re.compile(r"(?si)/\*macro[:.](?!/\*)([\w+-]*?)(->(.+?))?\*/")
RE_IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")

erros = 0
avisos = 0


def erro(onde, msg):
    global erros
    erros += 1
    print("ERRO  [%s] %s" % (onde, msg))


def aviso(onde, msg):
    global avisos
    avisos += 1
    print("AVISO [%s] %s" % (onde, msg))


def ler_bytes(caminho):
    with open(caminho, "rb") as f:
        return f.read()


def decodificar(dados):
    try:
        return dados.decode("utf-8-sig"), "utf-8"
    except UnicodeDecodeError:
        return dados.decode("cp1252"), "cp1252"


def conferir_formato(onde, dados, exigir_utf8=True, crlf_obrigatorio=False):
    if not dados.startswith(b"\xef\xbb\xbf"):
        aviso(onde, "sem BOM UTF-8 (o app grava UTF-8 com BOM); rode normalizar_arquivos.py")
    sem_crlf = dados.replace(b"\r\n", b"")
    if b"\n" in sem_crlf:
        (erro if crlf_obrigatorio else aviso)(
            onde, "quebras de linha LF; o app grava CRLF e o bloco de metadados do SQL so e reconhecido com CRLF "
                  "(rode normalizar_arquivos.py)")
    texto, enc = decodificar(dados)
    if exigir_utf8 and enc != "utf-8":
        erro(onde, "arquivo nao e UTF-8 valido (o Reports le como UTF-8)")
    return texto


def ler_ini_texto(texto):
    secoes, atual = [], None
    for linha in texto.splitlines():
        s = linha.strip()
        m = re.match(r"^\[([^\]]+)\]\s*$", s)
        if m:
            atual = [m.group(1), []]
            secoes.append(atual)
        elif atual is not None and s and not s.startswith(";"):
            chave, _, valor = s.partition("=")
            atual[1].append((chave.strip(), valor.strip()))
    return secoes


# ---------------------------------------------------------------- filtros

def carregar_filtros(pasta_raiz, produto):
    tipos = {}
    for arq in glob.glob(os.path.join(pasta_raiz, "**", "*.filtros"), recursive=True):
        texto, _ = decodificar(ler_bytes(arq))
        texto = re.sub(r"(?<=\w)\\(?=\w)", r"\\\\", texto)
        try:
            dados = json.loads(texto)
        except ValueError as e:
            print("AVISO [%s] .filtros invalido: %s" % (arq, e), file=sys.stderr)
            continue
        prod = (dados.get("produto") or "").lower()
        if prod != produto.lower() and not (prod == "" and produto.lower() == "pos"):
            continue
        for item in dados.get("filtros", []):
            tipo, modelo = (item.get("id"), item.get("tipo")) if "id" in item else (item.get("tipo"), item.get("modelo"))
            if tipo and tipo.lower() not in tipos:
                tipos[tipo.lower()] = (tipo, modelo, item.get("titulo", ""), arq)
    return tipos


def descobrir_pasta_raiz(caminho):
    atual = os.path.dirname(os.path.abspath(caminho))
    while True:
        pai = os.path.dirname(atual)
        if pai == atual:
            return None
        if os.path.basename(atual).lower() in ("reports", "user", "plugins", "plugins-manager"):
            return pai
        atual = pai


# ---------------------------------------------------------------- SQL

def sem_comentarios_e_strings(sql):
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    sql = re.sub(r"--[^\n]*", " ", sql)
    return re.sub(r"'(?:[^']|'')*'", "''", sql)


def extrair_bloco(sql):
    ocorrencias = list(RE_BLOCO.finditer(sql))
    return ocorrencias


def ler_bloco(conteudo):
    return ler_ini_texto(conteudo)


def macros_do_sql(sql):
    return {m.group(1).lower() for m in RE_MACRO.finditer(sql)}


def aliases_do_select(sql):
    """Heuristica: nomes das colunas do primeiro SELECT de nivel 0. None se nao for seguro."""
    limpo = sem_comentarios_e_strings(sql)
    if re.search(r"(?i)\binsert\b|\binto\b|#\w", limpo):
        return None
    prof, i, n, inicio = 0, 0, len(limpo), None
    while i < n:
        ch = limpo[i]
        if ch == "(":
            prof += 1
        elif ch == ")":
            prof -= 1
        elif prof == 0 and re.match(r"(?i)select\b", limpo[i:i + 7]) and (i == 0 or not limpo[i - 1].isalnum()):
            inicio = i + 6
            break
        i += 1
    if inicio is None:
        return None
    itens, atual, prof, i = [], "", 0, inicio
    while i < n:
        ch = limpo[i]
        if ch == "(":
            prof += 1
        elif ch == ")":
            prof -= 1
        if prof == 0 and re.match(r"(?i)from\b", limpo[i:i + 5]) and not limpo[i - 1].isalnum():
            itens.append(atual)
            break
        if prof == 0 and ch == ",":
            itens.append(atual)
            atual = ""
        else:
            atual += ch
        i += 1
    else:
        return None
    nomes = []
    for k, item in enumerate(itens):
        t = item.strip()
        if k == 0:
            t = re.sub(r"(?i)^distinct\s+", "", t)
            t = re.sub(r"(?i)^top\s*(\(\s*[^)]*\)|\d+)\s*", "", t)
        if not t:
            return None
        m = (re.match(r"^\[([^\]]+)\]\s*=", t) or re.match(r'^"([^"]+)"\s*=', t)
             or re.match(r"^(\w+)\s*=(?!=)", t) or re.search(r"(?i)\bas\s+\[([^\]]+)\]\s*$", t)
             or re.search(r"(?i)\bas\s+(\w+)\s*$", t) or re.match(r"^(?:[\w\[\]]+\.)?\[?(\w+)\]?$", t))
        if not m:
            return None
        nomes.append(m.group(1))
    vistos, final = {}, []
    for nome in nomes:
        chave = nome.lower()
        if chave in vistos:
            vistos[chave] += 1
            final.append("%s_%d" % (nome, vistos[chave]))
        else:
            vistos[chave] = 0
            final.append(nome)
    return final


def nome_coluna(view, campo):
    if view == "vw1":
        return "vw1" + re.sub(r"[^A-Za-z0-9_]", "", campo)
    semac = "".join(c for c in unicodedata.normalize("NFKD", campo) if not unicodedata.combining(c))
    return "vw" + view + semac.replace(" ", "").strip()


def validar_sql(onde, sql, raiz, tipos, sql_mestre):
    blocos = extrair_bloco(sql)
    macros = macros_do_sql(sql)
    tem_meta = re.search(r"(?im)^\s*\[(filtro\.[^\]]*|ordenacao|relacionamento)\]\s*$", sql)
    if not blocos:
        if tem_meta:
            erro(onde, "ha secoes [filtro.*]/[ordenacao]/[relacionamento] mas o bloco nao foi reconhecido "
                       "(confira CRLF, '/*' antes da primeira secao e '*/' no inicio da ultima linha)")
        secoes = []
    else:
        if len(blocos) > 1:
            aviso(onde, "%d blocos de metadados; so o ultimo vale" % len(blocos))
        ultimo = blocos[-1]
        secoes = ler_bloco(ultimo.group(2))
        depois = sql[ultimo.end():]
        if "*/" in depois:
            erro(onde, "ha comentario depois do bloco de metadados; [relacionamento] e lido ate o ultimo '*/'")
        elif depois.strip():
            aviso(onde, "ha texto depois do bloco de metadados; o bloco deve encerrar o arquivo")

    nomes = [s[0].lower() for s in secoes]
    if "relacionamento" in nomes and nomes[-1] != "relacionamento":
        erro(onde, "[relacionamento] precisa ser a ultima secao do bloco")

    for nome, pares in secoes:
        chaves = {k.lower(): v for k, v in pares}
        baixo = nome.lower()
        if baixo.startswith("filtro."):
            fid = nome[len("filtro."):]
            tipo = chaves.get("tipo", "")
            if not tipo:
                erro(onde, "[%s] sem tipo=" % nome)
            elif tipos is not None and tipo.lower() not in tipos and tipo.lower() != "multi-filtro":
                erro(onde, "[%s] tipo=%s nao existe no catalogo .filtros nem em 'filtros' do .conf" % (nome, tipo))
            alvo = [m.strip().lower() for m in chaves.get("macros", "filtro").split(";") if m.strip()]
            if chaves.get("campo"):
                for m in alvo:
                    if m not in macros and m + "+" not in macros:
                        erro(onde, "[%s] usa macros=%s mas o SQL nao tem /*macro.%s*/ nem /*macro.%s+*/" % (nome, m, m, m))
            for lit in re.split(r"[;|]", chaves.get("literal", "")):
                lit = lit.strip().lower()
                if lit and lit not in macros and lit + "+" not in macros:
                    erro(onde, "[%s] literal=%s sem /*macro.%s*/ no SQL" % (nome, lit, lit))
            if not chaves.get("campo") and not chaves.get("literal") and fid.lower() not in macros \
                    and not any(k.endswith(".tipo") for k in chaves):
                aviso(onde, "[%s] sem campo= nem literal=: a aba nao altera o SQL" % nome)
        elif baixo == "ordenacao":
            for k, v in pares:
                if k.lower() == "titulo":
                    continue
                if re.search(r"(?i)->\s*(asc|desc)\s*;", v):
                    erro(onde, "[ordenacao] %s=%s: flag depois de ->asc/desc vira 'sem ordenacao'; use campo;flag" % (k, v))
            if "ordenacao" not in macros and "ordenacao+" not in macros:
                aviso(onde, "[ordenacao] sem /*macro.ordenacao*/ no SQL: a aba nao tem efeito")
        elif baixo == "relacionamento":
            if raiz:
                erro(onde, "[relacionamento] em consulta raiz; ele so vale em detalhe")
            tipado = False
            for k, v in pares:
                if k.lower() == "macros":
                    continue
                mestre, _, tipo_sql = v.partition("->")
                mestre = mestre.strip()
                tipado = tipado or bool(tipo_sql.strip())
                if not RE_IDENT.fullmatch(mestre):
                    erro(onde, "[relacionamento] %s=%s: coluna do mestre deve ser identificador" % (k, v))
                if sql_mestre is not None and not re.search(r"(?i)\b%s\b" % re.escape(mestre), sem_comentarios_e_strings(sql_mestre)):
                    aviso(onde, "[relacionamento] coluna '%s' nao encontrada no SQL do mestre" % mestre)
            if tipado and "relacionamento" not in macros:
                erro(onde, "[relacionamento] tipado sem /*macro.relacionamento*/ no topo do SQL")

    limpo = sem_comentarios_e_strings(sql)
    params = set(re.findall(r"(?<![:\w]):([A-Za-z_]\w*)", limpo))
    if raiz:
        if params:
            erro(onde, "consulta raiz com parametros :%s (a raiz roda sem ParamCheck)" % ", :".join(sorted(params)))
        if "relacionamento" in macros:
            erro(onde, "/*macro.relacionamento*/ em consulta raiz")
    elif "relacionamento" not in nomes and not params:
        aviso(onde, "detalhe sem [relacionamento] nem :parametro: todas as linhas aparecem em todo mestre")


# ---------------------------------------------------------------- grid.ini

def validar_ini(onde, texto, view, aliases, estilos):
    linhas = texto.splitlines()
    if not linhas or linhas[0].strip() != "[Main]" or "Version=2" not in texto[:40]:
        erro(onde, "deve comecar com [Main] / Version=2")
    for i, linha in enumerate(linhas):
        if re.match(r"^\[[^\]]+: [^\]]+\]$", linha.strip()) and (i + 1 >= len(linhas) or linhas[i + 1].strip() != "="):
            erro(onde, "secao %s sem a linha '=' logo abaixo" % linha.strip())
    prefixo = "formGrid.vw1" if view == "vw1" else "lvl%s.vw%s" % (view, view)
    secoes = ler_ini_texto(texto)
    colunas, bandas, somas = {}, 0, []
    for nome, pares in secoes:
        if nome == "Main":
            continue
        caminho, _, classe = nome.partition(": ")
        if not caminho.startswith(prefixo):
            erro(onde, "secao [%s] nao usa o prefixo %s" % (nome, prefixo))
            continue
        resto = caminho[len(prefixo):]
        if resto.startswith("/Bands/"):
            bandas += 1
        elif classe.endswith("Column"):
            colunas[resto.lstrip("/").lower()] = dict((k.lower(), v) for k, v in pares)
        elif "SummaryItem" in classe:
            somas.append(dict(pares))
        for k, v in pares:
            if k.lower().startswith(("styles.", "level.styles.")):
                est = v.strip('"').lower()
                if est and est not in estilos:
                    aviso(onde, "[%s] %s=%s: estilo inexistente (sera ignorado)" % (nome, k, v))
            if k.lower() == "caption" and "/Bands/" in v:
                erro(onde, "caption com '/Bands/' altera a contagem de bandas")
    if texto.count("/Bands/") != bandas:
        erro(onde, "'/Bands/' aparece fora dos cabecalhos de banda")
    for nome, props in colunas.items():
        try:
            bi = int(props.get("position.bandindex", "0"))
        except ValueError:
            bi = 0
        if bi >= max(bandas, 1):
            erro(onde, "coluna %s em position.bandindex=%d, mas ha %d banda(s)" % (nome, bi, bandas))
    for s in somas:
        col = s.get("Column", "").strip('"').lower()
        if col and col not in colunas:
            erro(onde, "item de total aponta Column=%s inexistente" % col)
    if aliases is not None:
        esperado = {nome_coluna(view, a).lower(): a for a in aliases}
        faltando = [a for n, a in esperado.items() if n not in colunas]
        sobrando = [n for n in colunas if n not in esperado]
        if faltando:
            aviso(onde, "colunas do SELECT sem secao (vao para a posicao 0 da banda 0): %s" % ", ".join(faltando))
        if sobrando:
            aviso(onde, "secoes sem coluna correspondente no SELECT (ignoradas): %s" % ", ".join(sobrando))


def estilos_da_pasta(pasta):
    nomes = set(EMBUTIDOS)
    arq = os.path.join(pasta, "estilos.ini")
    if os.path.exists(arq):
        texto, _ = decodificar(ler_bytes(arq))
        nomes |= {m.group(1).lower() for m in re.finditer(r"(?m)^\[(\w+):", texto)}
    else:
        nomes |= {"textovermelho", "textoverde", "negrito", "fundocinzatextobranco"}
    return nomes


# ---------------------------------------------------------------- .conf

def validar_conf(caminho, pasta_raiz, produto):
    dados = ler_bytes(caminho)
    texto = conferir_formato(os.path.basename(caminho), dados)
    try:
        conf = json.loads(texto)
    except ValueError as e:
        erro(caminho, "JSON mal formado: %s" % e)
        return
    pasta = os.path.dirname(os.path.abspath(caminho))
    onde = os.path.basename(caminho)

    tipos = None
    if pasta_raiz:
        tipos = carregar_filtros(pasta_raiz, produto)
        if not tipos:
            aviso(onde, "nenhum .filtros encontrado em %s; tipos de filtro nao conferidos" % pasta_raiz)
            tipos = None
    else:
        aviso(onde, "PastaRaiz nao encontrada; informe --pasta-raiz para conferir os tipos de filtro")
    locais = conf.get("filtros") or []
    if tipos is not None:
        for item in locais:
            tipo = item.get("id") if "id" in item else item.get("tipo")
            if tipo:
                tipos.setdefault(tipo.lower(), (tipo, item.get("modelo"), item.get("titulo", ""), caminho))

    if pasta_raiz and conf.get("id"):
        proprio = os.path.normcase(os.path.abspath(caminho))
        for sub in ("reports", "plugins", os.path.join("plugins-manager", "plugins"), "user"):
            for outro in glob.glob(os.path.join(pasta_raiz, sub, "**", "*.conf"), recursive=True):
                if os.path.normcase(os.path.abspath(outro)) == proprio:
                    continue
                try:
                    oid = json.loads(decodificar(ler_bytes(outro))[0]).get("id", "")
                except (ValueError, AttributeError):
                    continue
                if isinstance(oid, str) and oid.lower() == conf["id"].lower():
                    erro(onde, "id do relatorio repetido em %s (o app bloqueia os dois)" % outro)

    if (conf.get("produto") or "pos").lower() != produto.lower():
        aviso(onde, "produto=%s: nao aparece no produto %s" % (conf.get("produto"), produto))
    if conf.get("id", "").startswith("{00000000-0000"):
        erro(onde, "id do relatorio ainda e o GUID zerado do modelo; gere um GUID novo")
    elif not re.fullmatch(r"\{[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\}", conf.get("id", "")):
        if not conf.get("id"):
            erro(onde, "id do relatorio vazio")
        else:
            aviso(onde, "id do relatorio nao e GUID {MAIUSCULO}")
    if not conf.get("titulo"):
        aviso(onde, "titulo vazio")
    if not conf.get("categoria"):
        erro(onde, "categoria vazia (obrigatoria no editor e no controle de acesso)")
    saidas = conf.get("saidas")
    if not isinstance(saidas, list) or not saidas:
        erro(onde, "'saidas' ausente ou vazia")
        return

    ids_saida = set()
    for s in saidas:
        sid = s.get("id", "")
        tipo = (s.get("tipo") or "").lower()
        so = "%s > saida %s" % (onde, sid or "?")
        if tipo not in TIPOS_SAIDA:
            erro(so, "tipo='%s' invalido" % s.get("tipo"))
            continue
        if not sid:
            erro(so, "saida sem id")
        elif sid.lower() in ids_saida:
            erro(so, "id de saida repetido")
        ids_saida.add(sid.lower())
        if re.search(r'[<>:"/\\|?*]', sid):
            erro(so, "id da saida vira nome de pasta e tem caractere invalido")
        if tipo != "grid":
            continue
        if s.get("sql"):
            consultas = [{"id": "principal", "sql": s["sql"], "master": ""}]
            if s.get("sqls"):
                aviso(so, "'sql' preenchido faz 'sqls' ser ignorado")
        else:
            consultas = s.get("sqls") or []
        if not consultas:
            erro(so, "saida grid sem 'sqls'")
            continue
        vistos, textos, raizes = {}, {}, []
        for c in consultas:
            cid, arq, mestre = c.get("id", ""), c.get("sql", ""), c.get("master", "") or ""
            oc = "%s > sql %s" % (so, cid or "?")
            if not cid:
                erro(oc, "consulta sem id")
                continue
            if cid.lower() in {v.lower() for v in vistos}:
                erro(oc, "id de consulta repetido")
            if mestre and mestre not in vistos:
                erro(oc, "master='%s' nao aparece ANTES no array (o detalhe seria descartado)" % mestre)
            if mestre and not RE_IDENT.fullmatch(cid):
                erro(oc, "id de detalhe deve ser identificador ASCII (vira lvl<id>/vw<id>)")
            if arq.startswith("\\") or arq.startswith("/"):
                erro(oc, "caminho do sql nao pode comecar com barra")
            vistos[cid] = mestre
            if not mestre:
                raizes.append(cid)
            caminho_sql = os.path.join(pasta, arq)
            if not os.path.isfile(caminho_sql):
                erro(oc, "arquivo nao encontrado: %s" % arq)
                continue
            textos[cid] = conferir_formato(arq, ler_bytes(caminho_sql), crlf_obrigatorio=True)
        if len(raizes) > 1:
            aviso(so, "mais de uma consulta raiz (%s): o grid usa so a primeira" % ", ".join(raizes))
        for cid, sql in textos.items():
            mestre = vistos.get(cid)
            validar_sql("%s > %s" % (so, cid), sql, not mestre, tipos, textos.get(mestre) if mestre else None)

        pasta_grid = os.path.join(pasta, "grid", sid)
        if not os.path.isdir(pasta_grid):
            aviso(so, "sem pasta grid\\%s: o grid abre sem layout e a ordem das colunas nao e garantida" % sid)
            continue
        estilos = estilos_da_pasta(pasta_grid)
        if os.path.exists(os.path.join(pasta_grid, "estilos.ini")):
            conferir_formato("grid\\%s\\estilos.ini" % sid, ler_bytes(os.path.join(pasta_grid, "estilos.ini")))
        esperados = {"grid.ini": ("vw1", raizes[0] if raizes else None)}
        for cid, mestre in vistos.items():
            if mestre:
                esperados["grid.vw%s.ini" % cid.lower()] = (cid, cid)
        existentes = {os.path.basename(p).lower(): p for p in glob.glob(os.path.join(pasta_grid, "*.ini"))}
        for arq_ini, (view, cid) in esperados.items():
            if arq_ini not in existentes:
                aviso(so, "falta grid\\%s\\%s" % (sid, arq_ini))
                continue
            ini_texto = conferir_formato("grid\\%s\\%s" % (sid, arq_ini), ler_bytes(existentes[arq_ini]))
            aliases = aliases_do_select(textos[cid]) if cid in textos else None
            validar_ini("grid\\%s\\%s" % (sid, arq_ini), ini_texto, view, aliases, estilos)
        for arq_ini in existentes:
            if arq_ini.endswith("_user.ini"):
                aviso(so, "grid\\%s\\%s e layout de usuario; nao distribua" % (sid, arq_ini))
            elif arq_ini not in esperados and arq_ini != "estilos.ini" and not arq_ini.startswith("regras"):
                aviso(so, "grid\\%s\\%s nao corresponde a nenhuma consulta" % (sid, arq_ini))


# ---------------------------------------------------------------- expandir

def expandir(caminho):
    texto, _ = decodificar(ler_bytes(caminho))
    blocos = extrair_bloco(texto)
    rel = []
    if blocos:
        for nome, pares in ler_bloco(blocos[-1].group(2)):
            if nome.lower() == "relacionamento":
                rel = [(k, v) for k, v in pares if k.lower() != "macros"]

    def troca(m):
        nome = m.group(1).lower()
        if nome == "relacionamento":
            decl = ["  @%s %s = null" % (v.partition("->")[0].strip(), v.partition("->")[2].strip())
                    for _, v in rel if v.partition("->")[2].strip()]
            return ("declare\n" + ",\n".join(decl)) if decl else ""
        return m.group(3) if m.group(3) is not None else ""

    saida = RE_MACRO.sub(troca, texto)
    if re.search(r"%banco-(pos|cbo|nf)%", saida, re.I):
        print("AVISO: substitua %banco-*% pelo nome do banco antes de executar", file=sys.stderr)
    if re.search(r"(?<![:\w]):[A-Za-z_]\w*", sem_comentarios_e_strings(saida)):
        print("AVISO: ha :parametros de detalhe; troque por valores de teste", file=sys.stderr)
    sys.stdout.write(saida)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("conf", nargs="?")
    ap.add_argument("--pasta-raiz")
    ap.add_argument("--produto", default="pos")
    ap.add_argument("--listar-filtros", action="store_true")
    ap.add_argument("--expandir", metavar="ARQUIVO_SQL")
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if args.expandir:
        expandir(args.expandir)
        return
    if args.listar_filtros:
        if not args.pasta_raiz:
            ap.error("--listar-filtros exige --pasta-raiz")
        tipos = carregar_filtros(args.pasta_raiz, args.produto)
        for _, (tipo, modelo, titulo, arq) in sorted(tipos.items()):
            print("%-30s %-12s %-30s %s" % (tipo, modelo, titulo, os.path.relpath(arq, args.pasta_raiz)))
        print("%d tipo(s) para o produto %s" % (len(tipos), args.produto))
        return
    if not args.conf:
        ap.error("informe o .conf")
    pasta_raiz = args.pasta_raiz or descobrir_pasta_raiz(args.conf)
    validar_conf(args.conf, pasta_raiz, args.produto)
    print("-- %d erro(s), %d aviso(s)" % (erros, avisos))
    sys.exit(1 if erros else 0)


if __name__ == "__main__":
    main()
