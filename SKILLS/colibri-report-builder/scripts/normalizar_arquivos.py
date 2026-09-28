#!/usr/bin/env python3
"""Regrava arquivos do Colibri Reports em UTF-8 com BOM e CRLF (altera arquivos).

Uso:
  python normalizar_arquivos.py <arquivo> [<arquivo> ...]

Aceita .conf, .sql, .ini e .filtros. Le UTF-8 (com ou sem BOM) ou, se falhar, cp1252.
Imprime cada arquivo alterado; sai com codigo 1 se algum arquivo nao existir.
"""
import sys


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        sys.exit(1)
    falhou = False
    for caminho in sys.argv[1:]:
        try:
            with open(caminho, "rb") as f:
                dados = f.read()
        except OSError as e:
            sys.stderr.write("ERRO: %s: %s\n" % (caminho, e))
            falhou = True
            continue
        try:
            texto, origem = dados.decode("utf-8-sig"), "utf-8"
        except UnicodeDecodeError:
            texto, origem = dados.decode("cp1252"), "cp1252"
        texto = texto.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "\r\n")
        novo = b"\xef\xbb\xbf" + texto.encode("utf-8")
        if novo != dados:
            with open(caminho, "wb") as f:
                f.write(novo)
            print("normalizado (%s -> utf-8 BOM, CRLF): %s" % (origem, caminho))
        else:
            print("ok: %s" % caminho)
    sys.exit(1 if falhou else 0)


if __name__ == "__main__":
    main()
