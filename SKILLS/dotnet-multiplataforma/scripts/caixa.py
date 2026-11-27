"""Resolução de referências de caminho em arquivos MSBuild/solução, sensível a maiúsculas.

Compara com os nomes devolvidos pelo sistema de arquivos (listdir), e não com `exists`,
para dar o mesmo resultado no Windows, onde `exists` ignora a diferença.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from functools import lru_cache

from comum import SUFIXOS_SOLUCAO, sem_comentarios

# Elementos cujo atributo é um caminho. PackageReference, Using etc. ficam de fora de propósito.
ITENS = ("Compile|Content|None|EmbeddedResource|Resource|ProjectReference|Page|ApplicationDefinition|"
         "AvaloniaResource|AvaloniaXaml|AdditionalFiles|Analyzer|EditorConfigFiles|UpToDateCheckInput|"
         "SplashScreen|MauiImage|MauiXaml|Protobuf")
ATRIBUTO = re.compile(rf"<(?:{ITENS})\b[^<>]*?\s(?:Include|Update|Remove)\s*=\s*\"([^\"]+)\"")
IMPORT = re.compile(r"<Import\b[^<>]*?\sProject\s*=\s*\"([^\"]+)\"")
ELEMENTO = re.compile(r"<(?:ApplicationIcon|ApplicationManifest|HintPath|AssemblyOriginatorKeyFile|"
                      r"DependentUpon|PackageIcon)>([^<]+)</")
SLN = re.compile(r"^Project\(\"[^\"]*\"\)\s*=\s*\"[^\"]*\",\s*\"([^\"]+)\"", re.M)
SLNX = re.compile(r"<(?:Project|File)\b[^<>]*?\sPath\s*=\s*\"([^\"]+)\"")


@dataclass
class Divergencia:
    inicio: int       # posição da referência no texto do arquivo
    fim: int
    escrito: str
    correto: str      # igual a `escrito` quando ambíguo
    ambiguo: bool = False


@lru_cache(maxsize=None)
def _nomes(pasta):
    try:
        return tuple(os.listdir(pasta))
    except OSError:
        return ()


def limpar_cache():
    _nomes.cache_clear()


def _resolver(base, referencia):
    """Devolve (referência com a caixa do disco, ambíguo). Para no primeiro trecho não verificável."""
    partes = re.split(r"([\\/])", referencia)
    atual, ambiguo = base, False
    for indice in range(0, len(partes), 2):
        parte = partes[indice]
        if parte in ("", "."):
            continue
        if parte == "..":
            atual = os.path.dirname(atual)
            continue
        if any(c in parte for c in "*?") or "$(" in parte or "%" in parte or "@(" in parte:
            break
        nomes = _nomes(atual)
        if parte not in nomes:
            candidatos = [n for n in nomes if n.lower() == parte.lower()]
            if not candidatos:
                break  # arquivo inexistente (gerado no build, opcional...): não é problema de caixa
            if len(candidatos) > 1:
                ambiguo = True
                break
            partes[indice] = candidatos[0]
        atual = os.path.join(atual, partes[indice])
    return "".join(partes), ambiguo


def divergencias(arquivo, texto):
    arquivo = os.path.abspath(arquivo)
    pasta = os.path.dirname(arquivo)
    nome = arquivo.lower()
    if nome.endswith(".sln"):
        padroes, alvo = (SLN,), texto
    elif nome.endswith(".slnx"):
        padroes, alvo = (SLNX,), sem_comentarios(texto)
    else:
        padroes, alvo = (ATRIBUTO, IMPORT, ELEMENTO), sem_comentarios(texto)

    prefixos = ["$(MSBuildThisFileDirectory)"]
    if nome.endswith("proj") and not nome.endswith(SUFIXOS_SOLUCAO):
        prefixos += ["$(MSBuildProjectDirectory)", "$(ProjectDir)"]

    for padrao in padroes:
        for achado in padrao.finditer(alvo):
            deslocamento = achado.start(1)
            for trecho in re.finditer(r"[^;]+", achado.group(1)):
                escrito = trecho.group().strip()
                if not escrito:
                    continue
                inicio = deslocamento + trecho.start() + trecho.group().index(escrito)
                prefixo = next((p for p in prefixos if escrito.startswith(p)), "")
                resto = escrito[len(prefixo):]
                if "://" in resto or re.match(r"[A-Za-z]:", resto):
                    continue
                if prefixo:
                    separador = resto[:1] if resto[:1] in ("\\", "/") else ""
                    resto = resto[len(separador):]
                    prefixo += separador
                corrigido, ambiguo = _resolver(pasta, resto)
                correto = prefixo + corrigido
                if correto != escrito or ambiguo:
                    yield Divergencia(inicio, inicio + len(escrito), escrito, correto, ambiguo)
