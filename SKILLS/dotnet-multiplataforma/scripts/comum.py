"""Base compartilhada pelas checagens. Só biblioteca padrão; roda em Windows e Linux."""
from __future__ import annotations

import os
import re
from dataclasses import asdict, dataclass
from functools import lru_cache
from pathlib import Path

IGNORADAS = {".git", "bin", "obj", "node_modules", ".vs", ".idea"}
SUFIXOS_MSBUILD = (".csproj", ".vbproj", ".fsproj", ".props", ".targets", ".projitems", ".shproj")
SUFIXOS_SOLUCAO = (".sln", ".slnx")
COMENTARIO = re.compile(r"<!--.*?-->", re.S)
# Condição que restringe um trecho a um sistema operacional.
CONDICAO_DE_SO = re.compile(r"IsOSPlatform|\$\(OS\)|IsOsPlatform|\$\(IsWindows\)", re.I)


@dataclass
class Achado:
    caso: str          # id do arquivo em references/casos/
    arquivo: str       # relativo à raiz analisada
    linha: int         # 0 quando não se aplica
    detalhe: str
    submodulo: str = ""  # preenchido quando a correção pertence a outro repositório

    def dict(self):
        return asdict(self)


class Repo:
    def __init__(self, raiz):
        self.raiz = Path(os.path.abspath(raiz))

    @lru_cache(maxsize=None)
    def _arvore(self):
        arquivos, pastas = [], []
        for atual, nomes_pastas, nomes in os.walk(self.raiz):
            nomes_pastas[:] = sorted(p for p in nomes_pastas if p not in IGNORADAS)
            pastas += [Path(atual, p) for p in nomes_pastas]
            arquivos += [Path(atual, n) for n in sorted(nomes)]
        return arquivos, pastas

    def pastas(self):
        return self._arvore()[1]

    def arquivos(self, *sufixos):
        return [a for a in self._arvore()[0] if not sufixos or a.name.lower().endswith(sufixos)]

    def msbuild(self):
        return self.arquivos(*SUFIXOS_MSBUILD)

    def relativo(self, caminho):
        return Path(os.path.relpath(caminho, self.raiz)).as_posix()

    def submodulo(self, caminho):
        """Submódulo git (pasta com um *arquivo* .git) que contém o caminho, se houver."""
        for pai in Path(caminho).parents:
            if pai == self.raiz:
                break
            if (pai / ".git").is_file():
                return self.relativo(pai)
        return ""

    def achado(self, caso, caminho, linha, detalhe):
        return Achado(caso, self.relativo(caminho), linha, detalhe, self.submodulo(caminho))


def ler(caminho):
    """Lê preservando BOM e fim de linha. Devolve (texto, codificação)."""
    dados = Path(caminho).read_bytes()
    for codificacao in ("utf-8", "cp1252", "latin-1"):
        try:
            return dados.decode(codificacao), codificacao
        except UnicodeDecodeError:
            continue
    raise AssertionError("latin-1 decodifica qualquer sequência")


def sem_comentarios(texto):
    """Apaga comentários XML mantendo posições e quebras de linha."""
    return COMENTARIO.sub(lambda m: re.sub(r"[^\r\n]", " ", m.group()), texto)


def linha_de(texto, posicao):
    return texto.count("\n", 0, posicao) + 1


def restrito_por_so(texto, posicao, blocos=("PropertyGroup", "ItemGroup", "Target", "When")):
    """Há condição de SO na própria tag em `posicao` ou em um bloco que a envolve?"""
    inicio = texto.rfind("<", 0, posicao + 1)
    fim = texto.find(">", posicao)
    if CONDICAO_DE_SO.search(texto[inicio:fim + 1]):
        return True
    for bloco in blocos:
        aberturas = list(re.finditer(rf"<{bloco}\b[^>]*>", texto[:posicao]))
        if not aberturas:
            continue
        abertura = aberturas[-1]
        fechado = f"</{bloco}>" in texto[abertura.end():posicao]
        if not fechado and CONDICAO_DE_SO.search(abertura.group()):
            return True
    return False
