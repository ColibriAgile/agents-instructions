import html
import re

from comum import ler, linha_de, restrito_por_so, sem_comentarios

COMANDO = re.compile(r"<Exec\b[^<>]*?\sCommand\s*=\s*\"([^\"]*)\"|<(?:Pre|Post)BuildEvent\b[^<>]*>(.*?)</", re.S)
SINAIS = [
    (r"(?:^|[&|\n]\s*)\s*(xcopy|robocopy|copy|del|erase|rmdir|rd|move|ren|call|start|type)\s", "comando do cmd.exe"),
    (r"\bif\s+(?:not\s+)?(?:exist|errorlevel)\b", "sintaxe de lote do Windows"),
    (r"\bpowershell(?:\.exe)?\b", "Windows PowerShell (fora do Windows só há pwsh)"),
    (r"\S+\.(?:exe|bat|cmd)\b", "executável ou script do Windows"),
    (r"%\w+%", "variável no formato do cmd.exe"),
    (r"^\s*echo\s[^\"']*[;()]", "echo com ; ou () sem aspas quebra no /bin/sh"),
]


def checar(repo):
    for arquivo in repo.msbuild():
        texto = sem_comentarios(ler(arquivo)[0])
        for m in COMANDO.finditer(texto):
            comando = html.unescape(m.group(1) or m.group(2) or "").strip()
            # $(DefineConstants) é uma lista separada por ';' depois de expandida.
            expandido = comando.replace("$(DefineConstants)", "A;B")
            motivo = next((r for p, r in SINAIS if re.search(p, expandido, re.I | re.M)), None)
            if motivo and not restrito_por_so(texto, m.start()):
                yield repo.achado("comando-windows", arquivo, linha_de(texto, m.start()),
                                  f"{motivo}: {comando.splitlines()[0][:120]}")
