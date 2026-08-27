#!/usr/bin/env python3
"""
Converte um export de collection do Insomnia (formato v4 JSON) em Markdown
estruturado para uso como fonte de conhecimento de LLM / wiki.

Uso:
    python insomnia_to_md.py export.json                      # arquivo unico ao lado do input
    python insomnia_to_md.py export.json -o docs/api.md       # arquivo unico em caminho especifico
    python insomnia_to_md.py export.json -d docs/ --split     # um .md por pasta + index.md
    python insomnia_to_md.py export.json --env "UAT" --resolve

Flags:
    -o/--output   caminho do .md de saida (modo arquivo unico)
    -d/--outdir   pasta de saida (obrigatorio com --split)
    --split       gera um arquivo por request_group + index.md
    --env NOME    escolhe o ambiente a documentar (default: todos)
    --resolve     substitui {{var}} pelos valores do ambiente escolhido
    --title TXT   sobrescreve o titulo do documento
"""
import argparse
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

VAR_RE = re.compile(r"\{\{\s*_\.(\w+)\s*\}\}|\{\{\s*(\w+)\s*\}\}")
EMOJI_RE = re.compile(
    r"[\U0001F000-\U0001FAFF\u2190-\u21FF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D]"
)


# --------------------------------------------------------------------------- #
# Leitura e normalizacao
# --------------------------------------------------------------------------- #
def load_export(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if "resources" not in data:
        sys.exit(
            "Export nao reconhecido: esperado JSON v4 do Insomnia (chave 'resources'). "
            "No Insomnia use Export > Insomnia v4 (JSON)."
        )
    return data


def tpl(text) -> str:
    """Normaliza {{ _.var }} e {{ var }} para {{var}} — menos ruido para indexacao."""
    if not isinstance(text, str):
        return "" if text is None else str(text)
    return VAR_RE.sub(lambda m: "{{" + (m.group(1) or m.group(2)) + "}}", text)


def make_resolver(env_data: dict):
    """Retorna funcao que troca {{var}} pelo valor real do ambiente."""

    def resolve(text: str) -> str:
        out = tpl(text)
        for k, v in env_data.items():
            if isinstance(v, (str, int, float)):
                out = out.replace("{{" + k + "}}", str(v))
        return out

    return resolve


def clean_name(name: str) -> str:
    """Remove emojis e numeracao de prefixo dos nomes de pasta ('1. 🚀 Foo' -> 'Foo')."""
    s = EMOJI_RE.sub("", name or "")
    s = re.sub(r"^\s*\d+[\.\)]\s*", "", s)
    return re.sub(r"\s{2,}", " ", s).strip()


def slugify(text: str) -> str:
    s = EMOJI_RE.sub("", text or "")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    s = re.sub(r"[\s_]+", "-", s)
    return re.sub(r"-{2,}", "-", s).strip("-") or "sem-nome"


def cell(text) -> str:
    return str(text).replace("|", "\\|").replace("\n", " ").strip()


def merged_env(environments: list, env_id: str) -> dict:
    """Junta ambiente base + sub-ambiente (Insomnia herda por parentId)."""
    by_id = {e["_id"]: e for e in environments}
    chain, cur = [], by_id.get(env_id)
    while cur:
        chain.append(cur)
        cur = by_id.get(cur.get("parentId", ""))
    data = {}
    for env in reversed(chain):  # base primeiro, sub sobrescreve
        data.update(env.get("data", {}))
    return data


# --------------------------------------------------------------------------- #
# Renderizacao de partes de um request
# --------------------------------------------------------------------------- #
def path_of(url: str, sub) -> str:
    u = sub(url)
    p = re.sub(r"^\{\{baseURL\}\}|^\{\{base_url\}\}", "", u)
    return p or u or "/"


def render_body(body: dict, sub) -> list:
    """Renderiza o corpo da requisicao conforme o mimeType."""
    if not body:
        return []
    mime = body.get("mimeType", "") or ""
    out = []

    if body.get("params"):  # form-urlencoded / multipart
        out += ["**Body (form)**", "", "| Campo | Valor |", "| --- | --- |"]
        for p in body["params"]:
            if p.get("disabled"):
                continue
            out.append(f'| `{cell(p.get("name"))}` | `{cell(sub(p.get("value", "")))}` |')
        out.append("")
        return out

    text = body.get("text")
    if not text:
        return []
    text = sub(text)
    lang = ""
    if "json" in mime:
        lang = "json"
        try:
            text = json.dumps(json.loads(text), ensure_ascii=False, indent=2)
        except json.JSONDecodeError:
            pass  # placeholders fora de string quebram o parse; mantem original
    elif "graphql" in mime:
        lang = "graphql"
    elif "xml" in mime:
        lang = "xml"

    out += ["**Body de exemplo**", "", f"```{lang}", text, "```", ""]
    return out


def render_auth(auth: dict, sub) -> list:
    if not auth or auth.get("disabled"):
        return []
    kind = auth.get("type", "")
    if not kind:
        return []
    detail = {
        "bearer": f'Bearer token: `{sub(auth.get("token", ""))}`',
        "basic": f'Basic — usuario: `{sub(auth.get("username", ""))}`',
        "apikey": f'API key — `{sub(auth.get("key", ""))}`: `{sub(auth.get("value", ""))}`',
    }.get(kind, f"Tipo `{kind}`")
    return [f"**Autenticação:** {detail}", ""]


def render_request(r: dict, group_name: str, sub, level: int = 3) -> list:
    h = "#" * level
    out = [
        f'{h} `{r["method"]}` {path_of(r.get("url", ""), sub)}',
        "",
        f'**Nome na collection:** {r.get("name", "")}  ',
        f"**Seção:** {group_name}  ",
        f'**URL completa:** `{sub(r.get("url", ""))}`',
        "",
    ]
    if r.get("description"):
        out += [r["description"].strip(), ""]

    out += render_auth(r.get("authentication", {}), sub)

    headers = [h_ for h_ in r.get("headers", []) if not h_.get("disabled")]
    if headers:
        out += ["**Headers**", "", "| Header | Valor |", "| --- | --- |"]
        out += [f'| `{cell(x.get("name"))}` | `{cell(sub(x.get("value", "")))}` |' for x in headers]
        out.append("")

    if r.get("pathParameters"):
        out += ["**Path params**", "", "| Parâmetro | Exemplo |", "| --- | --- |"]
        out += [
            f'| `{cell(p.get("name"))}` | `{cell(sub(p.get("value", "")))}` |'
            for p in r["pathParameters"]
        ]
        out.append("")

    params = r.get("parameters", [])
    if params:
        out += [
            "**Query params**",
            "",
            "| Parâmetro | Exemplo | Estado na collection |",
            "| --- | --- | --- |",
        ]
        for p in params:
            state = "desabilitado (opcional)" if p.get("disabled") else "habilitado"
            val = sub(str(p.get("value", "")))
            out.append(f'| `{cell(p.get("name"))}` | {f"`{cell(val)}`" if val else "—"} | {state} |')
        out.append("")

    out += render_body(r.get("body", {}), sub)
    return out


# --------------------------------------------------------------------------- #
# Montagem do documento
# --------------------------------------------------------------------------- #
def group_path(groups_by_id: dict, group: dict) -> str:
    """Nome completo de pastas aninhadas: 'Pai / Filho'."""
    parts, cur = [], group
    while cur and cur.get("_type") == "request_group":
        parts.append(clean_name(cur.get("name", "")))
        cur = groups_by_id.get(cur.get("parentId", ""))
    return " / ".join(reversed(parts))


def build(data: dict, args) -> dict:
    """Retorna {'index': str, 'files': {nome: conteudo}} conforme o modo."""
    res = data["resources"]
    workspace = next(
        (r for r in res if r["_type"] in ("workspace", "collection")),
        {"name": "API", "description": ""},
    )
    environments = [r for r in res if r["_type"] == "environment"]
    groups = sorted(
        [r for r in res if r["_type"] == "request_group"], key=lambda r: r.get("metaSortKey", 0)
    )
    requests = sorted(
        [r for r in res if r["_type"] == "request"], key=lambda r: r.get("metaSortKey", 0)
    )
    groups_by_id = {g["_id"]: g for g in groups}

    # requests soltos na raiz da collection ganham um grupo virtual
    root_group = {"_id": workspace.get("_id"), "name": "Endpoints", "_type": "request_group"}
    if any(r.get("parentId") == workspace.get("_id") for r in requests):
        groups = [root_group] + groups
        groups_by_id[root_group["_id"]] = root_group

    by_group = {}
    for r in requests:
        by_group.setdefault(r.get("parentId"), []).append(r)

    # ambiente
    envs = environments
    if args.env:
        envs = [e for e in environments if args.env.lower() in e.get("name", "").lower()]
        if not envs:
            sys.exit(
                f'Ambiente "{args.env}" nao encontrado. Disponiveis: '
                + ", ".join(e.get("name", "?") for e in environments)
            )
    chosen = merged_env(environments, envs[0]["_id"]) if envs else {}
    sub = make_resolver(chosen) if args.resolve else tpl

    title = args.title or workspace.get("name", "API")

    # ---- cabecalho comum ----
    head = [
        "---",
        f'title: "{title}"',
        "type: api-reference",
        f'source: "{Path(args.input).name}"',
        f'exported_from: "{data.get("__export_source", "insomnia")}"',
        f'generated_at: "{date.today().isoformat()}"',
        f"endpoint_count: {len(requests)}",
        "---",
        "",
        f"# {title}",
        "",
    ]
    if workspace.get("description"):
        head += [workspace["description"].strip(), ""]
    head += [
        "> Documento gerado a partir de uma collection do Insomnia. Cada endpoint traz método,",
        "> caminho, headers, path/query params e exemplo de payload extraídos da collection.",
        "",
        "## Convenções",
        "",
    ]
    if args.resolve:
        head.append("- Valores de variáveis já resolvidos com o ambiente documentado abaixo.")
    else:
        head.append(
            "- Placeholders `{{variavel}}` correspondem às variáveis de ambiente (ver *Ambientes*)."
        )
        head.append("- Os caminhos são relativos a `{{baseURL}}`.")
    head += [
        "- Query params marcados como *desabilitado* vêm desligados na collection — normalmente opcionais.",
        "",
        "## Ambientes",
        "",
    ]
    for env in envs:
        head += [f'### {clean_name(env.get("name", "ambiente"))}', "", "| Variável | Valor |", "| --- | --- |"]
        for k, v in merged_env(environments, env["_id"]).items():
            head.append(f"| `{k}` | `{cell(v)}` |")
        head.append("")
    if not envs:
        head += ["_Nenhum ambiente exportado na collection._", ""]

    # ---- indice ----
    def index_rows(link_target=None):
        rows = ["| # | Método | Caminho | Descrição | Seção |", "| --- | --- | --- | --- | --- |"]
        n = 0
        for g in groups:
            gname = group_path(groups_by_id, g)
            for r in by_group.get(g["_id"], []):
                n += 1
                sec = (
                    f"[{cell(gname)}]({link_target[g['_id']]})" if link_target else cell(gname)
                )
                rows.append(
                    f'| {n} | `{r["method"]}` | `{cell(path_of(r.get("url", ""), sub))}` '
                    f'| {cell(r.get("description", ""))} | {sec} |'
                )
        return rows

    files = {}

    if args.split:
        links = {g["_id"]: f'{i + 1:02d}-{slugify(group_path(groups_by_id, g))}.md' for i, g in enumerate(groups)}
        index = head + ["## Índice de endpoints", ""] + index_rows(links) + ["", "## Arquivos", ""]
        for g in groups:
            index.append(f'- [{group_path(groups_by_id, g)}]({links[g["_id"]]})')
        files["index.md"] = "\n".join(index) + "\n"

        for g in groups:
            gname = group_path(groups_by_id, g)
            doc = [
                "---",
                f'title: "{title} — {gname}"',
                "type: api-reference",
                f'parent: "{title}"',
                f'generated_at: "{date.today().isoformat()}"',
                "---",
                "",
                f"# {title} — {gname}",
                "",
            ]
            if g.get("description"):
                doc += [g["description"].strip(), ""]
            for r in by_group.get(g["_id"], []):
                doc += render_request(r, gname, sub, level=2)
            files[links[g["_id"]]] = "\n".join(doc) + "\n"
    else:
        doc = head + ["## Índice de endpoints", ""] + index_rows() + [""]
        for g in groups:
            gname = group_path(groups_by_id, g)
            doc += ["---", "", f"## {gname}", ""]
            if g.get("description"):
                doc += [g["description"].strip(), ""]
            for r in by_group.get(g["_id"], []):
                doc += render_request(r, gname, sub, level=3)
        files[f"{slugify(title)}.md"] = "\n".join(doc) + "\n"

    return {"files": files, "count": len(requests), "groups": len(groups)}


def main():
    ap = argparse.ArgumentParser(description="Insomnia (v4 JSON) -> Markdown")
    ap.add_argument("input", help="arquivo de export do Insomnia")
    ap.add_argument("-o", "--output", help="caminho do .md de saida (modo arquivo unico)")
    ap.add_argument("-d", "--outdir", help="pasta de saida")
    ap.add_argument("--split", action="store_true", help="um arquivo por pasta + index.md")
    ap.add_argument("--env", help="nome (ou parte) do ambiente a documentar")
    ap.add_argument("--resolve", action="store_true", help="resolver variaveis com o ambiente")
    ap.add_argument("--title", help="sobrescrever titulo do documento")
    args = ap.parse_args()

    src = Path(args.input)
    result = build(load_export(src), args)

    if args.split:
        outdir = Path(args.outdir or src.parent / f"{src.stem}-md")
        outdir.mkdir(parents=True, exist_ok=True)
        for name, content in result["files"].items():
            (outdir / name).write_text(content, encoding="utf-8")
        print(
            f'OK: {len(result["files"])} arquivos em {outdir} '
            f'({result["count"]} endpoints, {result["groups"]} seções)'
        )
    else:
        name, content = next(iter(result["files"].items()))
        out = Path(args.output) if args.output else Path(args.outdir or src.parent) / name
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(content, encoding="utf-8")
        print(f'OK: {out} ({result["count"]} endpoints, {result["groups"]} seções)')


if __name__ == "__main__":
    main()
