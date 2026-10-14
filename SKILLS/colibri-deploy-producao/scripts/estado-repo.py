"""Levanta, só com leitura, o estado de liberação de um repositório Colibri no GitHub.

Uso: python -I estado-repo.py <repo> [<repo> ...] [--org ColibriAgile]

Para cada repositório, mostra:
- os branches production* e a diferença deles com o master (inclusive commits
  que estão só no production*, que são hotfixes não portados e causam conflito);
- cada versao.ini e a versão Major.Minor.Release no master e em cada production*;
- cada manifesto.server: nome do pacote e dependências no master, com as
  dependências que mudaram em relação ao production;
- os workflows: gatilhos de push, entradas do workflow_dispatch e se o deploy
  repassa o tag-prefix para a action deploy-s3;
- a última execução de cada workflow no master;
- os PR abertos para production* e os últimos releases.
Requer o gh autenticado.
"""

import json
import re
import subprocess
import sys


def gh(*args, raw=False):
    cmd = ["gh", *args]
    resultado = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if resultado.returncode != 0:
        return None
    return resultado.stdout if raw else json.loads(resultado.stdout or "null")


def conteudo(repo, caminho, ref):
    return gh("api", "-H", "Accept: application/vnd.github.raw", f"repos/{repo}/contents/{caminho}?ref={ref}", raw=True)


def versao_ini(texto):
    if not texto:
        return "-"
    valores = dict(re.findall(r"^\s*(MajorVersion|MinorVersion|Release)\s*=\s*(\S+)", texto, flags=re.M))
    return ".".join(valores.get(k, "0") for k in ("MajorVersion", "MinorVersion", "Release"))


def manifesto(texto):
    if not texto:
        return None
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        return None


def branch_do_build(caminho, producao):
    """Escolhe o branch production* do build pela pasta (scripts, reports, cloud...)."""
    pasta = caminho.lower()
    for branch in producao:
        sufixo = branch.removeprefix("production-")
        if branch != "production" and f"/{sufixo}/" in pasta:
            return branch
    return "production"


def gatilhos(texto):
    """Lê o bloco on: do workflow sem PyYAML: branches do push e entradas do dispatch."""
    push, entradas, em_push, em_branches, em_inputs = [], {}, False, False, False
    entrada_atual = None
    for linha in texto.splitlines():
        sem_comentario = linha.split("#", 1)[0].rstrip()
        if not sem_comentario.strip():
            continue
        recuo = len(sem_comentario) - len(sem_comentario.lstrip())
        chave = sem_comentario.strip()
        if recuo == 0 and not chave.startswith("on"):
            em_push = em_branches = em_inputs = False
            if chave.startswith("jobs") or chave.startswith("env"):
                break
            continue
        if recuo == 2:
            em_push = chave.startswith("push")
            em_branches = em_inputs = False
        elif recuo == 4:
            em_branches = em_push and chave.startswith("branches")
            em_inputs = chave.startswith("inputs")
        elif em_branches and chave.startswith("- "):
            push.append(chave[2:].strip())
        elif em_inputs and recuo == 6:
            entrada_atual = chave.rstrip(":")
            entradas[entrada_atual] = []
        elif em_inputs and entrada_atual and chave.startswith("- "):
            entradas[entrada_atual].append(chave[2:].strip())
    return push, entradas


def relatorio(org, nome):
    repo = f"{org}/{nome}"
    print(f"\n{'=' * 70}\n# {repo}")

    saida = gh("api", "--paginate", f"repos/{repo}/branches?per_page=100", "--jq", ".[].name", raw=True) or ""
    branches = saida.split()
    producao = sorted(b for b in branches if b.startswith("production"))
    print(f"Branches de produção: {', '.join(producao) or 'nenhum'}")
    for branch in producao:
        cmp = gh("api", f"repos/{repo}/compare/{branch}...master") or {}
        volta = gh("api", f"repos/{repo}/compare/master...{branch}") or {}
        hotfix = [c for c in volta.get("commits", []) if len(c.get("parents", [])) < 2]
        print(f"  master -> {branch}: {cmp.get('ahead_by', '?')} commits para liberar")
        for commit in hotfix[-10:]:
            print(f"    só em {branch}: {commit['sha'][:8]} {commit['commit']['message'].splitlines()[0]}")
        if hotfix:
            print(f"    (commits diretos no {branch}. Um commit já portado por cherry-pick também aparece aqui:"
                  " confira o conteúdo no master antes de concluir que falta.)")

    arvore = gh("api", f"repos/{repo}/git/trees/master?recursive=1", "--jq", "[.tree[].path]") or []
    print("versao.ini (Major.Minor.Release):")
    for caminho in (p for p in arvore if p.lower().endswith("versao.ini")):
        valores = [f"master={versao_ini(conteudo(repo, caminho, 'master'))}"]
        valores += [f"{b}={versao_ini(conteudo(repo, caminho, b))}" for b in producao]
        print(f"  {caminho}: {' '.join(valores)}")

    print("manifesto.server:")
    for caminho in (p for p in arvore if p.lower().endswith("manifesto.server")):
        atual = manifesto(conteudo(repo, caminho, "master"))
        if atual is None:
            print(f"  {caminho}: JSON inválido no master")
            continue
        alvo = branch_do_build(caminho, producao)
        anterior = manifesto(conteudo(repo, caminho, alvo)) or {}
        deps = atual.get("dependencias") or {}
        deps_antes = anterior.get("dependencias") or {}
        print(f"  {caminho}: nome={atual.get('nome')} (comparado com {alvo})")
        for dep, versao in deps.items():
            marca = "" if deps_antes.get(dep) == versao else f"   <- mudou ({alvo}: {deps_antes.get(dep, 'ausente')})"
            print(f"    {dep}: {versao}{marca}")

    print("Workflows:")
    for caminho in (p for p in arvore if re.match(r"\.github/workflows/[^/]+\.ya?ml$", p)):
        texto = conteudo(repo, caminho, "master") or ""
        nome_wf = re.search(r"^name:\s*(.+)$", texto, flags=re.M)
        push, entradas = gatilhos(texto)
        detalhes = []
        if push:
            detalhes.append(f"push={push}")
        if "workflow_dispatch" in texto:
            detalhes.append(f"dispatch={entradas or '{}'}")
        if "deploy-s3" in texto:
            repassa = re.search(r"^\s*tag-prefix:", texto, flags=re.M) is not None
            detalhes.append("deploy-s3 " + ("repassa tag-prefix" if repassa else "SEM tag-prefix (usa o release Latest)"))
        rotulo = nome_wf.group(1).strip() if nome_wf else "?"
        print(f"  {caminho.split('/')[-1]} [{rotulo}] {' | '.join(detalhes)}")

    execucoes = gh("run", "list", "-R", repo, "--branch", "master", "--limit", "40",
                   "--json", "workflowName,number,conclusion,status,createdAt,headSha") or []
    print("Última execução de cada workflow no master:")
    vistos = set()
    for execucao in execucoes:
        if execucao["workflowName"] in vistos:
            continue
        vistos.add(execucao["workflowName"])
        print(f"  {execucao['workflowName']} #{execucao['number']}: {execucao['status']} "
              f"{execucao['conclusion'] or ''} {execucao['createdAt']} {execucao['headSha'][:8]}")

    for branch in producao:
        prs = gh("pr", "list", "-R", repo, "--base", branch, "--state", "open",
                 "--json", "number,headRefName,title") or []
        for pr in prs:
            print(f"PR aberto para {branch}: #{pr['number']} {pr['headRefName']} - {pr['title']}")

    releases = gh("release", "list", "-R", repo, "--limit", "5",
                  "--json", "tagName,isLatest,publishedAt") or []
    print("Últimos releases: " + ", ".join(
        f"{r['tagName']}{' (Latest)' if r['isLatest'] else ''} {r['publishedAt'][:10]}" for r in releases))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    argumentos = sys.argv[1:]
    org = "ColibriAgile"
    if "--org" in argumentos:
        indice = argumentos.index("--org")
        org = argumentos[indice + 1]
        del argumentos[indice:indice + 2]
    for repositorio in argumentos:
        relatorio(org, repositorio)
