#!/usr/bin/env python3
"""Mantém o catálogo de casos.

  catalogo.py indice               regenera references/INDICE.md
  catalogo.py validar              confere casos, checagens e índice
  catalogo.py buscar <log|->       aponta os casos cujos sinais aparecem em um log
  catalogo.py novo <id> --titulo T cria um caso a partir do modelo
"""
import argparse
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
CASOS = SKILL / "references" / "casos"
INDICE = SKILL / "references" / "INDICE.md"
CHECAGENS = SKILL / "scripts" / "checagens"
MODELO = SKILL / "assets" / "modelo-caso.md"
CAMPOS = ("id", "titulo", "fase", "status", "checagem", "verificado_em", "sinais")
FASES = ("restore", "build", "pos-build", "teste", "execucao")
STATUS = ("confirmado", "sintoma-confirmado", "hipotese")
ID = re.compile(r"[a-z][a-z0-9-]*")


def ler_caso(arquivo):
    """Cabeçalho simples: `chave: valor`, e listas com linhas `  - item`."""
    partes = arquivo.read_text(encoding="utf-8").split("\n---", 1)
    if not partes[0].startswith("---") or len(partes) != 2:
        raise ValueError("cabeçalho ausente")
    dados, lista = {}, None
    for linha in partes[0].splitlines()[1:]:
        if linha.startswith("  - ") and lista is not None:
            lista.append(linha[4:].strip())
        elif ":" in linha:
            chave, valor = (x.strip() for x in linha.split(":", 1))
            if chave == "sinais":
                lista = dados[chave] = []
            else:
                dados[chave], lista = valor, None
    return dados


def casos():
    return {a.stem: ler_caso(a) for a in sorted(CASOS.glob("*.md"))}


def gerar_indice():
    linhas = ["# Índice de casos", "", "Gerado por `scripts/catalogo.py indice`. Não edite.", "",
              "| caso | problema | fase | status | detecção |", "|---|---|---|---|---|"]
    for nome, c in sorted(casos().items(), key=lambda i: (FASES.index(i[1]["fase"]), i[0])):
        deteccao = "estática" if c["checagem"] != "nenhuma" else ("log" if c["sinais"] else "manual")
        linhas.append(f"| [{nome}](casos/{nome}.md) | {c['titulo']} | {c['fase']} | {c['status']} | {deteccao} |")
    return "\n".join(linhas) + "\n"


def validar():
    erros, todos = [], {}
    for arquivo in sorted(CASOS.glob("*.md")):
        try:
            c = todos[arquivo.stem] = ler_caso(arquivo)
        except ValueError as e:
            erros.append(f"{arquivo.name}: {e}")
            continue
        erros += [f"{arquivo.name}: falta o campo {k}" for k in CAMPOS if k not in c]
        if c.get("id") != arquivo.stem or not ID.fullmatch(arquivo.stem):
            erros.append(f"{arquivo.name}: id deve ser igual ao nome do arquivo, em minúsculas com hífens")
        if c.get("fase") not in FASES:
            erros.append(f"{arquivo.name}: fase deve ser uma de {', '.join(FASES)}")
        if c.get("status") not in STATUS:
            erros.append(f"{arquivo.name}: status deve ser um de {', '.join(STATUS)}")
        modulo = c.get("checagem", "nenhuma")
        if modulo != "nenhuma" and not (CHECAGENS / f"{modulo}.py").is_file():
            erros.append(f"{arquivo.name}: checagem inexistente: {modulo}")
        for sinal in c.get("sinais", []):
            try:
                re.compile(sinal)
            except re.error as e:
                erros.append(f"{arquivo.name}: expressão inválida {sinal!r}: {e}")
    for modulo in sorted(CHECAGENS.glob("*.py")):
        for caso in re.findall(r"achado\(\s*\"([\w-]+)\"", modulo.read_text(encoding="utf-8")):
            if caso not in todos:
                erros.append(f"{modulo.name}: aponta para caso inexistente: {caso}")
    if not erros and (not INDICE.is_file() or INDICE.read_text(encoding="utf-8") != gerar_indice()):
        erros.append("INDICE.md desatualizado: rode `catalogo.py indice`")
    return erros


def buscar(texto):
    for nome, c in casos().items():
        linhas = [l for l in texto.splitlines() if any(re.search(s, l) for s in c["sinais"])]
        if linhas:
            yield nome, c, linhas


def main():
    analisador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = analisador.add_subparsers(dest="comando", required=True)
    sub.add_parser("indice")
    sub.add_parser("validar")
    sub.add_parser("buscar").add_argument("log")
    novo = sub.add_parser("novo")
    novo.add_argument("id")
    novo.add_argument("--titulo", required=True)
    args = analisador.parse_args()

    if args.comando == "indice":
        INDICE.write_text(gerar_indice(), encoding="utf-8", newline="\n")
    elif args.comando == "validar":
        erros = validar()
        print("\n".join(erros) or f"Catálogo válido: {len(casos())} caso(s).")
        return int(bool(erros))
    elif args.comando == "buscar":
        dados = sys.stdin.buffer.read() if args.log == "-" else Path(args.log).read_bytes()
        # Windows PowerShell 5 grava redirecionamentos em UTF-16.
        texto = dados.decode("utf-16" if dados[:2] in (b"\xff\xfe", b"\xfe\xff") else "utf-8", "replace")
        achou = False
        for nome, c, linhas in buscar(texto):
            achou = True
            print(f"\n## {nome} ({c['status']}): {c['titulo']}  -> references/casos/{nome}.md")
            print("\n".join(f"  {l.strip()[:200]}" for l in list(dict.fromkeys(linhas))[:5]))
        if not achou:
            print("Nenhum caso conhecido. Investigue e registre (references/como-expandir.md).")
        return int(not achou)
    else:
        destino = CASOS / f"{args.id}.md"
        if not ID.fullmatch(args.id) or destino.exists():
            analisador.error("id inválido ou caso já existente")
        texto = MODELO.read_text(encoding="utf-8").replace("ID_DO_CASO", args.id).replace("TITULO", args.titulo)
        destino.write_text(texto, encoding="utf-8", newline="\n")
        print(destino)
    return 0


if __name__ == "__main__":
    sys.exit(main())
