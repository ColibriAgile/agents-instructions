"""Consulta e publica pacotes pendentes no Colibri Market Place.

Uso:
  python -I publicar-market.py consultar <Nome>:<versao> [<Nome>:<versao> ...]
  python -I publicar-market.py publicar <arquivo.json> [--simular]

Opção comum: --url <base> (padrão https://marketplace.colibricloud.com).

consultar: só leitura e sem token. Para cada pacote, mostra o id, se a versão
existe no market-place, se já está publicada e se já tem nota.

publicar: lê um JSON com a lista [{"nome": "POS", "versao": "11.2.0.512",
"nota": "<markdown>"}]. A versão é a versão completa da tag do release, sem o
prefixo (app/, scripts/...). O script acha o id de cada pacote, pula os pacotes
já publicados, envia 1 PUT /api/pacote/publicar/ com todos os itens e confere o
resultado. O token vem da variável de ambiente COLIBRI_MARKET_TOKEN e nunca vai
para a saída. Com --simular, o script faz tudo, menos o PUT.

O PUT é tudo ou nada: se um item é inválido, nenhum pacote muda. A publicação
não volta: as lojas recebem a versão publicada.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

URL_PADRAO = "https://marketplace.colibricloud.com"
VARIAVEL_TOKEN = "COLIBRI_MARKET_TOKEN"


def requisitar(metodo, url, corpo=None, token=None):
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    cabecalhos = {"Accept": "application/json"}
    if dados is not None:
        cabecalhos["Content-Type"] = "application/json"
    if token:
        cabecalhos["Authorization"] = f"Bearer {token}"
    pedido = urllib.request.Request(url, data=dados, headers=cabecalhos, method=metodo)
    try:
        with urllib.request.urlopen(pedido, timeout=60) as resposta:
            return resposta.status, resposta.read().decode("utf-8")
    except urllib.error.HTTPError as erro:
        return erro.code, erro.read().decode("utf-8", errors="replace")


def pacotes_por_nome(base, nome):
    status, texto = requisitar("GET", f"{base}/api/pacote/nome/{urllib.parse.quote(nome)}/")
    if status != 200:
        raise RuntimeError(f"GET do pacote {nome} respondeu {status}: {texto[:200]}")
    return json.loads(texto)


def localizar(base, nome, versao):
    """Devolve o pacote com a versão completa, ou None."""
    return next((p for p in pacotes_por_nome(base, nome) if p.get("versao") == versao), None)


def descrever(nome, versao, pacote):
    if pacote is None:
        return f"{nome} {versao}: NÃO EXISTE no market-place (confira o sync no log do deploy)"
    situacao = "publicado" if pacote.get("publicado") else "pendente"
    nota = "com nota" if pacote.get("ultima_nota") else "sem nota"
    return f"{nome} {versao}: id={pacote['id']} {situacao} {nota} dt_publicacao={pacote.get('dt_publicacao')}"


def consultar(base, alvos):
    codigo = 0
    for alvo in alvos:
        nome, _, versao = alvo.partition(":")
        if not versao:
            print(f"Argumento inválido: {alvo} (use <Nome>:<versao>)")
            codigo = 2
            continue
        pacote = localizar(base, nome, versao)
        print(descrever(nome, versao, pacote))
        if pacote is None:
            codigo = 1
    return codigo


def publicar(base, arquivo, simular):
    with open(arquivo, encoding="utf-8-sig") as entrada:
        itens = json.load(entrada)
    token = os.environ.get(VARIAVEL_TOKEN, "").strip()
    if not token and not simular:
        print(f"A variável de ambiente {VARIAVEL_TOKEN} não existe ou está vazia. Nada foi publicado.")
        return 2

    corpo, enviados = [], []
    for item in itens:
        nome, versao, nota = item["nome"], item["versao"], item.get("nota")
        pacote = localizar(base, nome, versao)
        print(descrever(nome, versao, pacote))
        if pacote is None:
            print("Pare: um pacote não existe no market-place. Nada foi publicado.")
            return 1
        if pacote.get("publicado"):
            print(f"  {nome} {versao} já está publicado: fica fora do PUT.")
            continue
        corpo.append({"id": pacote["id"], "nota": nota} if nota else pacote["id"])
        enviados.append((nome, versao, pacote["id"], nota))

    if not corpo:
        print("Nenhum pacote pendente para publicar.")
        return 0
    if simular:
        print(f"Simulação: o PUT enviaria {len(corpo)} item(ns) para {base}/api/pacote/publicar/.")
        return 0

    status, texto = requisitar("PUT", f"{base}/api/pacote/publicar/", corpo, token)
    print(f"PUT /api/pacote/publicar/ -> {status} {texto.strip()[:300]}")
    if status != 200:
        print("A publicação falhou. Nenhum pacote mudou (o PUT é tudo ou nada).")
        return 1

    codigo = 0
    for nome, versao, _id, nota in enviados:
        pacote = localizar(base, nome, versao)
        nota_ok = not nota or (pacote.get("ultima_nota") or {}).get("nota") == nota
        ok = pacote and pacote.get("publicado") and nota_ok
        print(("OK    " if ok else "FALHA ") + descrever(nome, versao, pacote))
        if not ok:
            codigo = 1
    return codigo


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    argumentos = sys.argv[1:]
    base = URL_PADRAO
    if "--url" in argumentos:
        indice = argumentos.index("--url")
        base = argumentos[indice + 1].rstrip("/")
        del argumentos[indice:indice + 2]
    simular = "--simular" in argumentos
    argumentos = [a for a in argumentos if a != "--simular"]
    if len(argumentos) >= 2 and argumentos[0] == "consultar":
        sys.exit(consultar(base, argumentos[1:]))
    if len(argumentos) == 2 and argumentos[0] == "publicar":
        sys.exit(publicar(base, argumentos[1], simular))
    print(__doc__)
    sys.exit(2)
