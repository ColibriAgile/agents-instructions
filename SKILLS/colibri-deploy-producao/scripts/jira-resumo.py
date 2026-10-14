"""Resume uma tarefa do Jira salva em JSON (getJiraIssue com view "full").

Uso: python -I jira-resumo.py <arquivo.json> [<arquivo.json> ...]

Mostra chave, status, fixVersions, componentes, descrição e todos os comentários
em ordem cronológica, em texto puro. O resultado do MCP do Atlassian costuma
passar do limite de leitura; este script lê o arquivo que o harness salvou.
"""

import html
import json
import re
import sys


def linha_tabela(linha):
    celulas = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", linha.group(1), flags=re.S)
    celulas = [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", c)).strip() for c in celulas]
    return "\n| " + " | ".join(celulas) + " |\n"


def texto(valor):
    if valor is None:
        return ""
    if not isinstance(valor, str):
        valor = json.dumps(valor, ensure_ascii=False)
    valor = re.sub(r"<tr[^>]*>(.*?)</tr>", linha_tabela, valor, flags=re.S)
    valor = re.sub(r"<(br|/p|/li|/h\d)[^>]*>", "\n", valor)
    valor = re.sub(r"<[^>]+>", "", valor)
    valor = html.unescape(valor)
    return re.sub(r"\n\s*\n+", "\n", valor).strip()


def resumir(caminho):
    with open(caminho, encoding="utf-8") as arquivo:
        dados = json.load(arquivo)
    dados = dados.get("data", dados)
    campos = dados.get("fields", {})

    print(f"# {dados.get('key')} - {campos.get('summary', '')}")
    print(f"Status: {(campos.get('status') or {}).get('name')}")
    print("fixVersions:")
    for versao in campos.get("fixVersions") or []:
        print(f"  - {versao.get('name')} ({versao.get('description', '')})")
    print("Componentes: " + ", ".join(c.get("name", "") for c in campos.get("components") or []))
    print("\n## Descrição\n" + texto(campos.get("description")))

    comentarios = (campos.get("comment") or {}).get("comments") or []
    print(f"\n## Comentários ({len(comentarios)})")
    for comentario in comentarios:
        autor = (comentario.get("author") or {}).get("displayName")
        print(f"\n--- {autor} {comentario.get('created')}")
        print(texto(comentario.get("body")))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    for caminho in sys.argv[1:]:
        resumir(caminho)
        print()
