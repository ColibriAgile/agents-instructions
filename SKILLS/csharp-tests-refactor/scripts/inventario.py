#!/usr/bin/env python3
"""Inventário de projetos de teste C#.

Uso: python inventario.py <raiz-da-solucao> [--min 1]

Para cada projeto de teste (csproj que referencia xunit), imprime o runner,
a contagem de [Fact]/[Theory] por pasta e a pasta de produção provável.
Saída em Markdown, pronta para virar a tabela de módulos do plano.
"""
import re
import sys
from collections import defaultdict
from pathlib import Path

IGNORAR = {"bin", "obj", "node_modules", ".git", ".vs"}
TESTE_RE = re.compile(r"^\s*\[\s*(Fact|Theory)\b", re.MULTILINE)
NS_RE = re.compile(r"^\s*namespace\s+([\w.]+)", re.MULTILINE)


def csprojs(raiz: Path):
    for p in raiz.rglob("*.csproj"):
        if not IGNORAR & set(p.parts):
            yield p


def eh_teste(csproj: Path) -> str | None:
    txt = csproj.read_text(encoding="utf-8", errors="ignore")
    if 'Include="xunit.v3"' in txt:
        return "MTP (xunit.v3)"
    if re.search(r'Include="xunit"', txt) or "Microsoft.NET.Test.Sdk" in txt:
        return "VSTest (xunit)"
    return None


def contar(proj_dir: Path):
    por_pasta: dict[Path, int] = defaultdict(int)
    namespaces: dict[Path, set] = defaultdict(set)
    for cs in proj_dir.rglob("*.cs"):
        if IGNORAR & set(cs.relative_to(proj_dir).parts):
            continue
        txt = cs.read_text(encoding="utf-8", errors="ignore")
        n = len(TESTE_RE.findall(txt))
        if n == 0:
            continue
        pasta = cs.parent.relative_to(proj_dir)
        por_pasta[pasta] += n
        m = NS_RE.search(txt)
        if m:
            namespaces[pasta].add(m.group(1))
    return por_pasta, namespaces


def producao_para(raiz: Path, proj_teste: Path, pasta: Path, nss: set, prod_dirs: list[Path]) -> str:
    # 1) namespace sem sufixo de teste → procura pasta com esse caminho em projeto de produção
    for ns in sorted(nss):
        limpo = re.sub(r"\.(Tests?|Testes?|UnitTests|IntegrationTests)(\.|$)", r"\2", ns)
        partes = limpo.split(".")
        for prod in prod_dirs:
            for i in range(len(partes)):
                cand = prod.joinpath(*partes[i:])
                if cand.is_dir():
                    return str(cand.relative_to(raiz))
    # 2) mesma subpasta em projeto de produção com nome parecido
    nome_prod = re.sub(r"\.?(Tests?|Testes?|UnitTests|IntegrationTests)$", "", proj_teste.stem)
    for prod in prod_dirs:
        if prod.name == nome_prod and (prod / pasta).is_dir():
            return str((prod / pasta).relative_to(raiz))
    return "?"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    raiz = Path(sys.argv[1]).resolve()
    minimo = int(sys.argv[sys.argv.index("--min") + 1]) if "--min" in sys.argv else 1

    todos = list(csprojs(raiz))
    testes = [(p, r) for p in todos if (r := eh_teste(p))]
    prod_dirs = [p.parent for p in todos if not eh_teste(p)]

    if not testes:
        print("Nenhum projeto de teste xUnit encontrado.")
        return

    print(f"# Inventário de testes — `{raiz.name}`\n")
    print(f"Projetos de teste: {len(testes)} | Projetos de produção: {len(prod_dirs)}\n")
    print("| Projeto de teste | Runner | Pasta de teste | Pasta de produção | Testes |")
    print("|---|---|---|---|---|")
    total = 0
    for csproj, runner in sorted(testes):
        por_pasta, nss = contar(csproj.parent)
        for pasta, n in sorted(por_pasta.items(), key=lambda kv: -kv[1]):
            if n < minimo:
                continue
            total += n
            prod = producao_para(raiz, csproj, pasta, nss.get(pasta, set()), prod_dirs)
            print(f"| {csproj.stem} | {runner} | {pasta.as_posix() or '.'} | {prod} | {n} |")
    print(f"\nTotal de testes: {total}")
    print("\nPastas com `?` em produção precisam de mapeamento manual.")


if __name__ == "__main__":
    main()
