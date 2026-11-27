#!/usr/bin/env python3
"""Análise estática (somente leitura) do que impede um repositório .NET de compilar nos dois SOs.

Uso: diagnosticar.py <pasta> [--json] [--apenas modulo1,modulo2]
Saída: 0 sem achados que afetem o build, 1 com achados, 2 erro (inclusive checagem que falhou).
Achados de casos com fase `execucao` são listados, mas não mudam o código de saída.
"""
import argparse
import importlib
import json
import pkgutil
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import checagens  # noqa: E402
from catalogo import casos  # noqa: E402
from comum import Repo  # noqa: E402


def executar(raiz, apenas=None):
    repo, achados, erros = Repo(raiz), [], []
    for modulo in sorted(m.name for m in pkgutil.iter_modules(checagens.__path__)):
        if apenas and modulo not in apenas:
            continue
        try:
            achados += importlib.import_module(f"checagens.{modulo}").checar(repo)
        except Exception as erro:  # uma checagem quebrada não pode esconder as outras
            erros.append(f"{modulo}: {type(erro).__name__}: {erro}")
    return achados, erros


def main():
    analisador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    analisador.add_argument("pasta")
    analisador.add_argument("--json", action="store_true")
    analisador.add_argument("--apenas", help="módulos de scripts/checagens, separados por vírgula")
    analisador.add_argument("--limite", type=int, default=15, help="achados listados por caso (0 = todos)")
    args = analisador.parse_args()
    if not Path(args.pasta).is_dir():
        analisador.error(f"pasta não encontrada: {args.pasta}")

    achados, erros = executar(args.pasta, set(args.apenas.split(",")) if args.apenas else None)
    catalogo = casos()
    if args.json:
        print(json.dumps({"achados": [a.dict() for a in achados], "erros": erros}, ensure_ascii=False, indent=2))
    else:
        por_caso = defaultdict(list)
        for a in achados:
            por_caso[a.caso].append(a)
        for caso, lista in sorted(por_caso.items()):
            submodulos = sorted({a.submodulo for a in lista if a.submodulo})
            extra = f" | em submódulos: {', '.join(submodulos)}" if submodulos else ""
            ajuste = catalogo.get(caso, {}).get("ajuste", "?")
            print(f"\n## {caso}: {len(lista)} achado(s) [{ajuste}]{extra}  -> references/casos/{caso}.md")
            for a in lista[: args.limite or None]:
                print(f"  {a.arquivo}{f':{a.linha}' if a.linha else ''}  {a.detalhe}")
            if args.limite and len(lista) > args.limite:
                print(f"  ... mais {len(lista) - args.limite} (use --limite 0 ou --json)")
        if not achados:
            print("Nenhum achado nas checagens estáticas. Isso não substitui um build.")
        for e in erros:
            print(f"ERRO na checagem {e}", file=sys.stderr)
    return 2 if erros else int(any(catalogo.get(a.caso, {}).get("fase") != "execucao" for a in achados))


if __name__ == "__main__":
    sys.exit(main())
