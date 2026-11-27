#!/usr/bin/env python3
"""Reescreve referências de caminho para a caixa que existe no disco.

Uso: corrigir_caixa.py <pasta> [--aplicar] [--sem-submodulos]
Sem --aplicar apenas mostra o que mudaria. Preserva BOM, fim de linha e separadores.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from caixa import divergencias  # noqa: E402
from comum import SUFIXOS_MSBUILD, SUFIXOS_SOLUCAO, Repo, ler  # noqa: E402


def corrigir(raiz, aplicar=False, sem_submodulos=False):
    repo = Repo(raiz)
    mudancas, ambiguos = [], []
    for arquivo in repo.arquivos(*SUFIXOS_MSBUILD, *SUFIXOS_SOLUCAO):
        submodulo = repo.submodulo(arquivo)
        if submodulo and sem_submodulos:
            continue
        texto, codificacao = ler(arquivo)
        achadas = sorted(divergencias(arquivo, texto), key=lambda d: d.inicio, reverse=True)
        for d in reversed(achadas):
            destino = ambiguos if d.ambiguo else mudancas
            destino.append((submodulo, repo.relativo(arquivo), d.escrito, d.correto))
        novo = texto
        for d in achadas:
            if not d.ambiguo:
                novo = novo[: d.inicio] + d.correto + novo[d.fim:]
        if aplicar and novo != texto:
            arquivo.write_bytes(novo.encode(codificacao))
    return mudancas, ambiguos


def main():
    analisador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    analisador.add_argument("pasta")
    analisador.add_argument("--aplicar", action="store_true")
    analisador.add_argument("--sem-submodulos", action="store_true")
    args = analisador.parse_args()
    if not Path(args.pasta).is_dir():
        analisador.error(f"pasta não encontrada: {args.pasta}")
    mudancas, ambiguos = corrigir(args.pasta, args.aplicar, args.sem_submodulos)
    for submodulo, arquivo, antes, depois in mudancas:
        marca = f"[submódulo {submodulo}] " if submodulo else ""
        print(f"{marca}{arquivo}: {antes} -> {depois}")
    for _, arquivo, antes, _ in ambiguos:
        print(f"AMBÍGUO (corrija à mão) {arquivo}: {antes}")
    print(f"\n{len(mudancas)} referência(s) {'corrigida(s)' if args.aplicar else 'a corrigir (use --aplicar)'}; "
          f"{len(ambiguos)} ambígua(s).")
    return 1 if ambiguos or (mudancas and not args.aplicar) else 0


if __name__ == "__main__":
    sys.exit(main())
