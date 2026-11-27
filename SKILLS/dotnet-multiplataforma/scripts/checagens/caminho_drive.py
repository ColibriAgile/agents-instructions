import re

from comum import ler, linha_de, restrito_por_so, sem_comentarios

PROPRIEDADE = re.compile(r"<(\w*(?:Path|Dir|Directory|Folder))\b[^<>]*>\s*([A-Za-z]:[\\/][^<]*)</")


def checar(repo):
    for arquivo in repo.msbuild():
        texto = sem_comentarios(ler(arquivo)[0])
        for m in PROPRIEDADE.finditer(texto):
            if not restrito_por_so(texto, m.start()):
                yield repo.achado("caminho-drive", arquivo, linha_de(texto, m.start()),
                                  f"{m.group(1)} = {m.group(2).strip()}")
    # Rastro de um build anterior fora do Windows. Costuma estar no .gitignore, então o git não mostra.
    for pasta in repo.pastas():
        if re.fullmatch(r"[A-Za-z]:", pasta.name):
            yield repo.achado("caminho-drive", pasta, 0, "pasta literal criada por um build anterior")
