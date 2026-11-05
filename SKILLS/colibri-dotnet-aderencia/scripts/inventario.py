#!/usr/bin/env python3
"""Inventário somente leitura de um repositório .NET para a rubrica colibri-dotnet-aderencia.

Uso: python inventario.py <raiz-do-repositorio> [--amostras N]

Imprime um JSON no stdout. Não grava arquivos, não executa build e não altera o git.
Segredos: o inventário informa arquivo, linha e tipo. Ele nunca imprime o valor.
Requer Python 3.9+ e usa só a biblioteca padrão.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional

PASTAS_IGNORADAS = {
    ".git", "_lib", "_lib-inno", "_sdk", "bin", "obj", "node_modules", ".vs", ".idea",
    ".agents", ".claude", ".codex", "TestResults", "publish", "packages", ".context-brake",
}

PROPS_CSPROJ = [
    "TargetFramework", "TargetFrameworks", "OutputType", "AssemblyName", "Nullable", "ImplicitUsings",
    "LangVersion", "TreatWarningsAsErrors", "PublishSingleFile", "SelfContained", "RuntimeIdentifier",
    "RuntimeIdentifiers", "IncludeNativeLibrariesForSelfExtract", "PublishReadyToRun", "PublishTrimmed",
    "UseMicrosoftTestingPlatformRunner", "IsTestProject", "IsPackable", "PlatformTarget", "Version",
]

# Sinais no código C#. Cada um conta ocorrências e guarda amostras arquivo:linha.
SINAIS_CS = {
    "use_logging": r"\.UseLogging\s*\(",
    "add_logging": r"\.AddLogging\s*\(",
    "logger_configuration": r"new\s+LoggerConfiguration\s*\(",
    "pastas_do_sistema_logs": r"PastasDoSistema\.Logs\b",
    "log_subfolder": r"WithLogSubFolderName\s*\(",
    "log_template_logc": r"\.logc\b",
    "logar_informacoes_iniciais": r"LogarInformacoesIniciais\s*\(",
    "configuracoes_de_ambiente": r"\bConfiguracoesDeAmbiente\b",
    "obter_porta": r"\bObterPorta\s*\(",
    "kestrel": r"\bUseUrls\s*\(|\bListenAnyIP\s*\(|\bListenLocalhost\s*\(|\.Listen\s*\(|\bConfigureKestrel\s*\(",
    "porta_literal": r"(?i)\b\w*(porta|port)\w*\s*=\s*\d{4,5}\b|localhost:\d{4,5}|0\.0\.0\.0:\d{4,5}",
    "info_de_conexao": r"\bInfoDeConexao(POS|PG|NF)\b",
    "connection_strings": r"\bGetConnectionString\s*\(|\"ConnectionStrings\"|\bConnectionStrings:",
    "parser_proprio": r"ncrmaster\.cfg|launcher\.conexao|launcher\.boot",
    "db_context": r":\s*DbContext\b|\bAddDbContext\s*<|\bAddDbContextFactory\s*<",
    "dapper": r"^\s*using\s+Dapper\b",
    "resilient_db_connection": r"\bResilientDbConnection\b",
    "ddl_em_runtime": r"\.Migrate(Async)?\s*\(|\bEnsureCreated(Async)?\s*\(|CREATE\s+(TABLE|DATABASE)\b",
    "assembly_location": r"Assembly[\w\.\(\)]*\.Location\b",
    "use_windows_service": r"\bUseWindowsService\s*\(",
    "add_ping_endpoint": r"\bAddPingEndpoint\s*\(",
    "health_checks": r"\bAddHealthChecks\s*\(|\bMapHealthChecks\s*\(",
    "global_exception_handler": r"\bAddGlobalExceptionHandler\s*\(|\bUseExceptionHandler\s*\(",
    "assert_classico": r"\bAssert\.\w+\s*\(",
    "shouldly": r"\.Should(Be|NotBe|Throw|Contain)\w*\s*\(",
}

RE_LOG = re.compile(r"\.Log(Trace|Debug|Information|Warning|Error|Critical)\s*\(")

# Segredos: só o tipo e o local. O valor nunca sai do processo.
SEGREDOS = [
    ("token_github", re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}")),
    ("chave_aws", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("chave_privada", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("credencial_em_url", re.compile(r"https?://[^/\s:@\"']+:?[^/\s@\"']*@[\w.-]+")),
    ("senha_em_connection_string", re.compile(r"(?i)\b(password|pwd)\s*=\s*(?!\s*[;\"'{$<]|\s*$)[^;\"'\s]{3,}")),
    # Nome de segredo com literal sem espaço, com letra e dígito: corta nomes de chave de configuração.
    ("literal_em_nome_de_segredo", re.compile(
        r"(?i)\b\w*(api_?key|token|secret|segredo|senha|password|passwd)\w*\s*=\s*@?\""
        r"(?=[^\"\s]*\d)(?=[^\"\s]*[a-z])[^\"\s]{10,}\"")),
]
# GUID ou texto longo sem espaço num arquivo cujo nome sugere segredo (ex.: EmbeddedApiKey.cs).
RE_ARQUIVO_DE_SEGREDO = re.compile(r"(?i)(api_?key|token|secret|segredo|credencia|senha|password)")
RE_LITERAL_FORTE = re.compile(
    r"\"([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}|[A-Za-z0-9+/_=-]{24,})\"")
EXT_SEGREDOS = {".cs", ".json", ".yml", ".yaml", ".config", ".ps1", ".iss", ".xml", ".env", ".ini", ".props", ".csproj"}
VALORES_FALSOS = re.compile(r"(?i)placeholder|exemplo|example|changeme|nao[-_ ]embutida|\$\{\{|\$\(|<[^>]+>|\*{3,}|x{6,}")


def rel(raiz: Path, caminho: Path) -> str:
    return caminho.relative_to(raiz).as_posix()


def andar(raiz: Path):
    for pasta, subpastas, arquivos in os.walk(raiz):
        subpastas[:] = [s for s in subpastas if s not in PASTAS_IGNORADAS]
        for nome in arquivos:
            yield Path(pasta) / nome


def ler(caminho: Path) -> Optional[str]:
    try:
        return caminho.read_text(encoding="utf-8-sig", errors="replace")
    except OSError:
        return None


def git(raiz: Path, *args: str) -> Optional[str]:
    try:
        r = subprocess.run(["git", "-C", str(raiz), *args], capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        return None
    return r.stdout if r.returncode == 0 else None


def inventario_git(raiz: Path, avisos: List[str]) -> Dict:
    dados: Dict = {"head": None, "branch": None, "gitlinks": [], "submodules": [], "pastas_de_submodulo": {}}
    head = git(raiz, "rev-parse", "--short", "HEAD")
    if head is None:
        avisos.append("git indisponível ou a pasta não é um repositório: gitlinks não verificados.")
    else:
        dados["head"] = head.strip()
        dados["branch"] = (git(raiz, "rev-parse", "--abbrev-ref", "HEAD") or "").strip() or None
        arvore = git(raiz, "ls-files", "-s") or ""
        dados["gitlinks"] = [linha.split("\t", 1)[1] for linha in arvore.splitlines() if linha.startswith("160000 ")]

    gm = raiz / ".gitmodules"
    texto = ler(gm) if gm.exists() else None
    if texto:
        atual: Dict = {}
        for linha in texto.splitlines():
            m = re.match(r'\s*\[submodule\s+"([^"]+)"\]', linha)
            if m:
                atual = {"nome": m.group(1), "path": None, "url_esquema": None, "url_tem_credencial": False}
                dados["submodules"].append(atual)
                continue
            m = re.match(r"\s*(path|url)\s*=\s*(.+)", linha)
            if m and atual:
                chave, valor = m.group(1), m.group(2).strip()
                if chave == "path":
                    atual["path"] = valor
                else:
                    atual["url_esquema"] = valor.split(":", 1)[0]
                    atual["url_tem_credencial"] = bool(re.match(r"https?://[^/]+@", valor))
                    atual["url_destino"] = re.sub(r"^[a-z+]+://([^@/]+@)?", "", valor)
    for sub in dados["submodules"]:
        if sub.get("path"):
            pasta = raiz / sub["path"]
            dados["pastas_de_submodulo"][sub["path"]] = pasta.is_dir() and any(pasta.iterdir())
    return dados


def texto_xml(no: Optional[ET.Element]) -> Optional[str]:
    return no.text.strip() if no is not None and no.text else None


def inventario_csproj(raiz: Path, caminho: Path, avisos: List[str]) -> Dict:
    item: Dict = {"path": rel(raiz, caminho), "sdk": None, "props": {}, "packages": [],
                  "project_references": [], "imports": [], "is_test": False}
    texto = ler(caminho) or ""
    try:
        doc = ET.fromstring(re.sub(r'\sxmlns="[^"]+"', "", texto, count=1))
    except ET.ParseError as erro:
        avisos.append(f"{item['path']}: XML inválido ({erro}).")
        return item
    item["sdk"] = doc.get("Sdk")
    for grupo in doc.iter("PropertyGroup"):
        for nome in PROPS_CSPROJ:
            valor = texto_xml(grupo.find(nome))
            if valor is not None:
                cond = grupo.get("Condition")
                chave = nome if not cond else f"{nome} [{cond.strip()}]"
                item["props"][chave] = valor
    for ref in doc.iter("PackageReference"):
        nome = ref.get("Include") or ref.get("Update")
        if nome:
            item["packages"].append({"name": nome, "version": ref.get("Version") or texto_xml(ref.find("Version"))})
    for ref in doc.iter("ProjectReference"):
        if ref.get("Include"):
            item["project_references"].append(ref.get("Include").replace("\\", "/"))
    for imp in doc.iter("Import"):
        if imp.get("Project"):
            item["imports"].append(imp.get("Project").replace("\\", "/"))
    nomes = {p["name"].lower() for p in item["packages"]}
    item["is_test"] = (
        any(n.startswith("xunit") or n in {"microsoft.net.test.sdk", "nunit", "mstest.testframework"} for n in nomes)
        or str(item["props"].get("IsTestProject", "")).lower() == "true"
    )
    return item


def inventario_workflow(raiz: Path, caminho: Path) -> Dict:
    texto = ler(caminho) or ""
    linhas = texto.splitlines()
    on_bruto: List[str] = []
    dentro = False
    for linha in linhas:
        if re.match(r"^(on|\"on\"|'on'):", linha):
            dentro = True
            resto = linha.split(":", 1)[1].strip()
            if resto:
                on_bruto.append(resto)
            continue
        if dentro:
            if re.match(r"^\S", linha):
                break
            if linha.strip():
                on_bruto.append(linha.rstrip())
    return {
        "path": rel(raiz, caminho),
        "nome": caminho.name,
        "on": on_bruto[:30],
        "runs_on": sorted({m.group(1).strip() for m in re.finditer(r"runs-on:\s*(.+)", texto)}),
        "uses": [m.group(1).strip() for m in re.finditer(r"uses:\s*([^\s#]+)", texto)],
        "publish_args": [f"{i}: {l.strip()}" for i, l in enumerate(linhas, 1)
                         if re.search(r"additional-publish-args|dotnet publish|PublishSingleFile|publish\.ps1", l)],
        "with_chaves": sorted({m.group(1) for m in re.finditer(r"^\s+([a-z][\w-]*):", texto, re.M)}),
    }


def inventario_iss(raiz: Path, caminho: Path) -> Dict:
    texto = ler(caminho) or ""
    linhas = texto.splitlines()
    m = re.search(r'#define\s+PastaInno\s+"([^"]+)"', texto)
    return {
        "path": rel(raiz, caminho),
        "pasta_inno": m.group(1) if m else None,
        "includes": [m.group(1).strip() for m in re.finditer(r"#include\s+(.+)", texto)],
        "nssm": [f"{i}: {l.strip()[:220]}" for i, l in enumerate(linhas, 1)
                 if re.search(r"(?i)nssm|Service\.exe|\binstall\b|DisplayName|AppStderr|AppNoConsole", l)][:25],
    }


def inventario_manifesto(raiz: Path, caminho: Path, avisos: List[str]) -> Dict:
    item: Dict = {"path": rel(raiz, caminho)}
    try:
        dados = json.loads(ler(caminho) or "")
    except json.JSONDecodeError as erro:
        avisos.append(f"{item['path']}: JSON inválido ({erro}).")
        return item
    item["chaves"] = sorted(dados.keys()) if isinstance(dados, dict) else []
    if isinstance(dados, dict):
        for chave in ("nome", "produto", "sistema", "versao", "portas", "dependencias", "download_obrigatorio"):
            if chave in dados:
                item[chave] = dados[chave]
        item["arquivos_padroes"] = [a.get("_pattern_nome") for a in dados.get("arquivos", []) if isinstance(a, dict)]
    return item


def amostra(lista: List[str], limite: int, valor: str) -> None:
    if len(lista) < limite:
        lista.append(valor)


def analisar_logs(texto: str, caminho_rel: str, sinais: Dict, limite: int) -> None:
    lc = sinais["log_calls"]
    for m in RE_LOG.finditer(texto):
        fim = texto.find(";", m.end())
        trecho = texto[m.end(): (fim if fim != -1 else m.end() + 400)][:600]
        linha = texto.count("\n", 0, m.start()) + 1
        local = f"{caminho_rel}:{linha}"
        lc["total"] += 1
        primeira_aspa = trecho.find('"')
        interpolado = primeira_aspa > 0 and trecho[primeira_aspa - 1] == "$"
        literal = re.search(r'"((?:[^"\\]|\\.)*)"', trecho)
        if interpolado:
            lc["interpolados"] += 1
            amostra(lc["amostras_interpolados"], limite, local)
        if literal and "|" in literal.group(1):
            lc["com_pipe"] += 1
        else:
            amostra(lc["amostras_sem_pipe"], limite, local)
        if re.search(r"\.Message\b", trecho):
            lc["ex_message"] += 1
            amostra(lc["amostras_ex_message"], limite, local)


def procurar_segredos(texto: str, caminho_rel: str, achados: List[Dict], limite_total: int = 200) -> None:
    arquivo_de_segredo = bool(RE_ARQUIVO_DE_SEGREDO.search(caminho_rel.rsplit("/", 1)[-1]))
    for numero, linha in enumerate(texto.splitlines(), 1):
        limpa = linha.strip()
        if limpa.startswith(("//", "#", ";", "<!--", "*")) and "ghp_" not in limpa:
            continue
        tipo_achado = None
        for tipo, regex in SEGREDOS:
            m = regex.search(linha)
            if m and not VALORES_FALSOS.search(m.group(0)):
                tipo_achado = tipo
                break
        if tipo_achado is None and arquivo_de_segredo and caminho_rel.endswith(".cs"):
            m = RE_LITERAL_FORTE.search(linha)
            if m and not VALORES_FALSOS.search(m.group(0)):
                tipo_achado = "literal_em_arquivo_de_segredo"
        if tipo_achado and len(achados) < limite_total:
            achados.append({"arquivo": caminho_rel, "linha": numero, "tipo": tipo_achado,
                            "em_teste": bool(re.search(r"(?i)\.(tests?|testes?)/", caminho_rel))})


def sem_comentarios(texto: str) -> str:
    """Troca comentários C# de linha inteira e de bloco por espaços. As quebras de linha ficam."""
    def branco(m: "re.Match[str]") -> str:
        return re.sub(r"[^\n]", " ", m.group(0))
    texto = re.sub(r"/\*.*?\*/", branco, texto, flags=re.S)
    return re.sub(r"(?m)^[ \t]*//.*$", branco, texto)


def resumo_renovate(texto: str, avisos: List[str]) -> Optional[Dict]:
    """Resume os campos do renovate.json que REP-03 e REP-08 conferem. O arquivo inteiro pode passar de 1500 caracteres."""
    try:
        dados = json.loads(texto)
    except ValueError as erro:
        avisos.append(f"renovate.json: JSON inválido ({erro}).")
        return None
    if not isinstance(dados, dict):
        avisos.append("renovate.json: a raiz não é um objeto JSON.")
        return None
    regras = [r for r in dados.get("packageRules") or [] if isinstance(r, dict)]
    submodulos = dados.get("git-submodules")
    return {
        "schema": dados.get("$schema"),
        "extends": dados.get("extends"),
        "dependency_dashboard": dados.get("dependencyDashboard"),
        "git_submodules": submodulos.get("enabled") if isinstance(submodulos, dict) else None,
        "categoria_dotnet_ligada": any("dotnet" in (r.get("matchCategories") or []) and r.get("enabled") is True
                                       for r in regras),
        "grupos": [{"nome": r["groupName"], "pacotes": r.get("matchPackageNames"), "schedule": r.get("schedule"),
                    "enabled": r.get("enabled", True)} for r in regras if r.get("groupName")],
        "nuget_exato_desligado": any("nuget" in (r.get("matchManagers") or []) and r.get("matchCurrentValue")
                                     and r.get("enabled") is False for r in regras),
        "automerge": dados.get("automerge"),
        "pr_hourly_limit": dados.get("prHourlyLimit"),
        "pr_concurrent_limit": dados.get("prConcurrentLimit"),
        "schedule_global": dados.get("schedule"),
        "regras": len(regras),
    }


def inventariar(raiz: Path, limite: int) -> Dict:
    avisos: List[str] = []
    saida: Dict = {
        "raiz": str(raiz),
        "avisos": avisos,
        "git": inventario_git(raiz, avisos),
        "raiz_arquivos": {},
        "csproj": [],
        "solucoes": [],
        "workflows": [],
        "build": {"versao_ini": [], "iss": [], "manifestos": [], "scripts_config": [], "scripts_publish": []},
        "config_json": [],
        "arquivos": {"package_json": [], "logging_settings": []},
        "sinais": {nome: {"total": 0, "amostras": []} for nome in SINAIS_CS},
        "segredos": {"suspeitos": []},
        "contagem": {"cs": 0, "cs_teste": 0},
    }
    saida["sinais"]["log_calls"] = {"total": 0, "com_pipe": 0, "interpolados": 0, "ex_message": 0,
                                    "amostras_sem_pipe": [], "amostras_interpolados": [], "amostras_ex_message": []}
    saida["sinais"]["assert_classico"]["arquivos"] = 0
    saida["sinais"]["shouldly"]["arquivos"] = 0

    for nome, chave in [("global.json", "global_json"), ("AGENTS.md", "agents_md"), ("CLAUDE.md", "claude_md"),
                        (".editorconfig", "editorconfig"), ("renovate.json", "renovate"), ("skills.yaml", "skills_yaml"),
                        (".gitattributes", "gitattributes"), ("Directory.Build.props", "directory_build_props"),
                        ("Directory.Packages.props", "directory_packages_props"), (".gitignore", "gitignore")]:
        caminho = raiz / nome
        if not caminho.exists() and not caminho.is_symlink():
            saida["raiz_arquivos"][chave] = None
            continue
        info: Dict = {"symlink": caminho.is_symlink()}
        texto = ler(caminho) if caminho.exists() else None
        if chave in {"global_json", "skills_yaml", "gitattributes", "claude_md", "renovate"} and texto is not None:
            info["conteudo"] = texto[:1500]
        elif texto is not None:
            info["linhas"] = texto.count("\n") + 1
        if chave == "directory_build_props" and texto is not None:
            info["props"] = inventario_csproj(raiz, caminho, avisos)["props"]
        if chave == "renovate" and texto is not None:
            info["resumo"] = resumo_renovate(texto, avisos)
        saida["raiz_arquivos"][chave] = info

    rx = {nome: re.compile(padrao, re.M) for nome, padrao in SINAIS_CS.items()}
    for caminho in andar(raiz):
        nome = caminho.name
        caminho_rel = rel(raiz, caminho)
        sufixo = caminho.suffix.lower()
        if sufixo == ".csproj":
            saida["csproj"].append(inventario_csproj(raiz, caminho, avisos))
        elif sufixo in {".sln", ".slnx"}:
            saida["solucoes"].append(caminho_rel)
        elif sufixo in {".yml", ".yaml"} and ".github/workflows/" in caminho_rel:
            saida["workflows"].append(inventario_workflow(raiz, caminho))
        elif sufixo == ".iss":
            saida["build"]["iss"].append(inventario_iss(raiz, caminho))
        elif nome == "manifesto.server":
            saida["build"]["manifestos"].append(inventario_manifesto(raiz, caminho, avisos))
        elif nome.lower() == "versao.ini":
            texto = ler(caminho) or ""
            valores = {k: (re.search(rf"(?im)^\s*{k}\s*=\s*(\d+)", texto) or [None, None])[1]
                       for k in ("MajorVersion", "MinorVersion", "Release")}
            saida["build"]["versao_ini"].append({"path": caminho_rel, "secao_versaoinfo": "[versaoinfo]" in texto.lower(), **valores})
        elif nome == "config.json" and "_scripts" in caminho_rel.split("/")[0]:
            saida["build"]["scripts_config"].append({"path": caminho_rel, "conteudo": (ler(caminho) or "")[:800]})
        elif nome == "package.json":
            texto = ler(caminho) or ""
            saida["arquivos"]["package_json"].append({"path": caminho_rel, "tem_script_test": '"test"' in texto})
        elif nome.lower() == "loggingsettings.json":
            saida["arquivos"]["logging_settings"].append(caminho_rel)

        if re.match(r"(?i)^(appsettings.*|launchsettings)\.json$", nome):
            texto = ler(caminho) or ""
            linhas = [f"{i}: {l.strip()[:200]}" for i, l in enumerate(texto.splitlines(), 1)
                      if re.search(r'(?i)"(port|porta|urls|applicationurl|connectionstrings)"|:\d{4,5}\b', l)]
            saida["config_json"].append({"path": caminho_rel, "linhas": linhas[:20]})

        if sufixo == ".ps1":
            texto = ler(caminho) or ""
            for i, l in enumerate(texto.splitlines(), 1):
                if re.search(r"dotnet\s+publish", l) and not l.strip().startswith("#"):
                    saida["build"]["scripts_publish"].append(f"{caminho_rel}:{i}: {l.strip()[:220]}")

        if sufixo in EXT_SEGREDOS or nome == ".gitmodules":
            texto = ler(caminho)
            if texto is not None:
                procurar_segredos(texto, caminho_rel, saida["segredos"]["suspeitos"])

        if sufixo == ".cs":
            texto = ler(caminho)
            if texto is None:
                avisos.append(f"{caminho_rel}: leitura falhou.")
                continue
            saida["contagem"]["cs"] += 1
            if re.search(r"(?i)(\.tests?|\.testes?)(/|$)", caminho_rel.rsplit("/", 1)[0]):
                saida["contagem"]["cs_teste"] += 1
            codigo = sem_comentarios(texto)
            for nome_sinal, regex in rx.items():
                ocorrencias = list(regex.finditer(codigo))
                if not ocorrencias:
                    continue
                sinal = saida["sinais"][nome_sinal]
                sinal["total"] += len(ocorrencias)
                if "arquivos" in sinal:
                    sinal["arquivos"] += 1
                for m in ocorrencias[:2]:
                    amostra(sinal["amostras"], limite, f"{caminho_rel}:{codigo.count(chr(10), 0, m.start()) + 1}")
            analisar_logs(codigo, caminho_rel, saida["sinais"], limite)

    for item in saida["csproj"]:
        item["packages"].sort(key=lambda p: p["name"].lower())
    saida["csproj"].sort(key=lambda c: c["path"])
    saida["workflows"].sort(key=lambda w: w["path"])
    return saida


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Inventário somente leitura para a rubrica colibri-dotnet-aderencia.")
    parser.add_argument("raiz", help="Raiz do repositório alvo.")
    parser.add_argument("--amostras", type=int, default=8, help="Máximo de amostras arquivo:linha por sinal (padrão 8).")
    args = parser.parse_args(argv)
    raiz = Path(args.raiz).resolve()
    if not raiz.is_dir():
        print(json.dumps({"erro": f"A pasta não existe: {raiz}"}, ensure_ascii=False), file=sys.stderr)
        return 2
    json.dump(inventariar(raiz, args.amostras), sys.stdout, ensure_ascii=False, indent=1)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
