#!/usr/bin/env python3
"""Rascunho do relatório de auditoria, classificado por risco. Não altera o repositório analisado.

Uso: auditar.py <repo> [--copia <destino>] [--saida <relatorio.md>]
--copia cria uma cópia para build e testes (sem .git, bin, obj e pastas de unidade).
--saida e --copia precisam ficar fora do repositório. Saída: 0 auditoria concluída, 2 erro.
"""
import argparse
import shutil
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from catalogo import SECAO_RISCOS, casos, secao  # noqa: E402
from comum import IGNORADAS  # noqa: E402
from diagnosticar import executar  # noqa: E402

GRUPOS = [
    ("seguro", "1. Ajustes que podem ser feitos sem problemas"),
    ("com-risco", "2. Ajustes que podem gerar problemas (exigem decisão)"),
    ("incompativel", "3. Incompatibilidades reais"),
]
EXEMPLOS = 5


def dentro(caminho, raiz):
    caminho, raiz = Path(caminho).resolve(), Path(raiz).resolve()
    return caminho == raiz or raiz in caminho.parents


def copiar(repo, destino):
    destino = Path(destino)
    if dentro(destino, repo):
        raise ValueError("a cópia precisa ficar fora do repositório")
    if destino.exists() and any(destino.iterdir()):
        raise ValueError(f"destino não está vazio: {destino}")

    def ignorar(_, nomes):
        return [n for n in nomes if n in IGNORADAS or (len(n) == 2 and n[1] == ":")]

    shutil.copytree(repo, destino, ignore=ignorar, symlinks=True, dirs_exist_ok=True)


def classificar(achados, catalogo):
    """{ajuste: {caso: [achados]}}. Referência ambígua nunca é um ajuste seguro."""
    grupos = defaultdict(lambda: defaultdict(list))
    for a in achados:
        ajuste = catalogo.get(a.caso, {}).get("ajuste", "com-risco")
        if ajuste == "seguro" and a.detalhe.startswith("ambíguo"):
            ajuste = "com-risco"
        grupos[ajuste][a.caso].append(a)
    return grupos


def relatorio(repo, achados, erros):
    catalogo = casos()
    grupos = classificar(achados, catalogo)
    linhas = [f"# Auditoria multiplataforma: {Path(repo).resolve().name}", "",
              "> Rascunho gerado da análise estática. Complete com build e testes (references/modo-auditar.md).", "",
              "## Resumo", "", "| classe | problemas | ocorrências |", "|---|---|---|"]
    for ajuste, titulo in GRUPOS:
        casos_do_grupo = grupos.get(ajuste, {})
        linhas.append(f"| {titulo[3:]} | {len(casos_do_grupo)} | {sum(map(len, casos_do_grupo.values()))} |")
    for ajuste, titulo in GRUPOS:
        linhas += ["", f"## {titulo}", ""]
        if not grupos.get(ajuste):
            linhas.append("Nada encontrado pela análise estática.")
        for nome, lista in sorted(grupos.get(ajuste, {}).items()):
            c = catalogo.get(nome, {})
            onde = defaultdict(int)
            for a in lista:
                onde[f"submódulo `{a.submodulo}`" if a.submodulo else "repositório principal"] += 1
            linhas += [f"### {c.get('titulo', nome)} (`{nome}`)", "",
                       f"- **Ocorrências:** {len(lista)} ({', '.join(f'{k}: {v}' for k, v in sorted(onde.items()))})",
                       f"- **Afeta:** {'a execução (o build pode passar)' if c.get('fase') == 'execucao' else c.get('fase', '?')}",
                       f"- **Confiança da receita:** {c.get('status', '?')}"]
            if any(a.submodulo for a in lista):
                linhas.append("- **Atenção:** parte da correção pertence a outro repositório e atinge quem o usa.")
            linhas += [f"- `{a.arquivo}{f':{a.linha}' if a.linha else ''}`: {a.detalhe}" for a in lista[:EXEMPLOS]]
            if len(lista) > EXEMPLOS:
                linhas.append(f"- ... mais {len(lista) - EXEMPLOS} (`diagnosticar.py --limite 0`)")
            if c:
                linhas += ["", secao(nome, SECAO_RISCOS)]
            linhas.append("")
    linhas += ["", "## Build e testes", "", "_Preencher: resultado por solução, na cópia._", "",
               "## A investigar", "", "_Preencher: erros sem caso no catálogo e propostas de casos novos._", "",
               "## Não verificado", "", "_Preencher: o sistema não testado, testes pulados e limites da análise._"]
    if erros:
        linhas += ["", "**Checagens que falharam (auditoria incompleta):**"] + [f"- {e}" for e in erros]
    return "\n".join(linhas) + "\n"


def main():
    analisador = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    analisador.add_argument("repo")
    analisador.add_argument("--copia")
    analisador.add_argument("--saida")
    args = analisador.parse_args()
    if not Path(args.repo).is_dir():
        analisador.error(f"pasta não encontrada: {args.repo}")
    if args.saida and dentro(args.saida, args.repo):
        analisador.error("--saida precisa ficar fora do repositório")
    if args.copia:
        try:
            copiar(args.repo, args.copia)
        except (ValueError, OSError) as erro:
            analisador.error(str(erro))
    achados, erros = executar(args.repo)
    texto = relatorio(args.repo, achados, erros)
    if args.saida:
        Path(args.saida).write_text(texto, encoding="utf-8", newline="\n")
        print(args.saida)
    else:
        sys.stdout.buffer.write(texto.encode("utf-8"))
    return 2 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
