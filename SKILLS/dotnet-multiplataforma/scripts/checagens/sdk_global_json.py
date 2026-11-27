import json
import shutil
import subprocess

from comum import ler


def _instalados():
    if not shutil.which("dotnet"):
        return None
    r = subprocess.run(["dotnet", "--list-sdks"], capture_output=True, text=True)
    return [l.split()[0] for l in r.stdout.splitlines() if l.strip()]


def _numeros(versao):
    return tuple(int(x) for x in versao.split("-")[0].split("."))


def _atende(pedida, politica, instalada):
    p, i = _numeros(pedida), _numeros(instalada)
    if politica == "disable":
        return p == i
    if i < p:
        return False
    faixa_p, faixa_i = p[2] // 100, i[2] // 100
    if politica in ("patch", "latestPatch"):
        return p[:2] == i[:2] and faixa_p == faixa_i
    if politica in ("feature", "latestFeature"):
        return p[:2] == i[:2]
    if politica in ("minor", "latestMinor"):
        return p[0] == i[0]
    return True  # major, latestMajor


def checar(repo):
    instalados = _instalados()
    for arquivo in repo.arquivos("global.json"):
        try:
            sdk = json.loads(ler(arquivo)[0].lstrip("﻿")).get("sdk", {})
        except (ValueError, AttributeError):
            continue
        versao = sdk.get("version")
        if not versao:
            continue
        politica = sdk.get("rollForward", "latestPatch")
        if instalados is None:
            yield repo.achado("sdk-ausente", arquivo, 0, f"pede SDK {versao} ({politica}); dotnet não está no PATH")
        elif not any(_atende(versao, politica, i) for i in instalados):
            yield repo.achado("sdk-ausente", arquivo, 0,
                              f"pede SDK {versao} ({politica}); instalados: {', '.join(instalados) or 'nenhum'}")
