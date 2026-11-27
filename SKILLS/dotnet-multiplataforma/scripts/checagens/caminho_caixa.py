from caixa import divergencias
from comum import SUFIXOS_MSBUILD, SUFIXOS_SOLUCAO, ler, linha_de


def checar(repo):
    for arquivo in repo.arquivos(*SUFIXOS_MSBUILD, *SUFIXOS_SOLUCAO):
        texto, _ = ler(arquivo)
        for d in divergencias(arquivo, texto):
            detalhe = (f"ambíguo, há mais de um nome possível: {d.escrito}" if d.ambiguo
                       else f"{d.escrito} -> {d.correto}")
            yield repo.achado("caminho-caixa", arquivo, linha_de(texto, d.inicio), detalhe)
