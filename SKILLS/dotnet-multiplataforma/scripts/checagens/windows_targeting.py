import re

from comum import ler, sem_comentarios

TFM = re.compile(r"<TargetFrameworks?\b[^<>]*>[^<]*-windows")


def _habilita(arquivo):
    return arquivo.is_file() and "<EnableWindowsTargeting" in sem_comentarios(ler(arquivo)[0])


def checar(repo):
    # A variável de ambiente de mesmo nome esconderia o problema no build, mas não nesta análise.
    for projeto in repo.arquivos(".csproj", ".vbproj", ".fsproj"):
        if not TFM.search(sem_comentarios(ler(projeto)[0])) or _habilita(projeto):
            continue
        # O MSBuild importa só o Directory.Build.props mais próximo (salvo se ele encadear o de cima).
        props = next((p / "Directory.Build.props" for p in projeto.parents
                      if (p / "Directory.Build.props").is_file()), None)
        if props and _habilita(props):
            continue
        onde = repo.relativo(props) if props else "nenhum Directory.Build.props encontrado"
        yield repo.achado("windows-targeting", projeto, 0, f"alvo -windows sem EnableWindowsTargeting ({onde})")
