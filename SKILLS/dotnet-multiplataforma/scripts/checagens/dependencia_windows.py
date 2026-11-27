"""Dependências do Windows que correção de build não resolve. Busca textual por padrões conhecidos."""
import re

from comum import ler, linha_de, sem_comentarios

UI = re.compile(r"<Use(WindowsForms|WPF)\b[^<>]*>\s*true\s*</", re.I)
COM = re.compile(r"<(COMReference|COMFileReference)\b[^<>]*?Include\s*=\s*\"([^\"]+)\"")
FRAMEWORK = re.compile(r"<TargetFrameworks?\b[^<>]*>[^<]*?\b(net[1-4]\d{1,2})\b(?!\.)")
DLLS = ("advapi32|comctl32|crypt32|dwmapi|gdi32|iphlpapi|kernel32|msvcrt|netapi32|ntdll|ole32|oleaut32|psapi|"
        "setupapi|shell32|shlwapi|user32|uxtheme|version|wininet|winmm|winspool|ws2_32|wtsapi32")
CODIGO = [
    ("P/Invoke em DLL do Windows", re.compile(rf"\b(?:DllImport|LibraryImport)\s*\(\s*\"(?:{DLLS})(?:\.dll|\.drv)?\"", re.I)),
    ("registro do Windows", re.compile(r"\bRegistry(?:Key)?\.(?:CurrentUser|LocalMachine|ClassesRoot|Users|CurrentConfig|"
                                       r"GetValue|SetValue|OpenBaseKey)\b")),
    ("biblioteca exclusiva do Windows", re.compile(r"^\s*(?:global\s+)?using\s+System\.(?:ServiceProcess|Management(?!\.Automation)|"
                                                   r"DirectoryServices|EnterpriseServices)\b", re.M)),
]
COMENTARIO_CS = re.compile(r"/\*.*?\*/|^\s*//[^\n]*", re.S | re.M)
PROTEGIDO = re.compile(r"OperatingSystem\.IsWindows|SupportedOSPlatform|OSPlatform\.Windows")


def checar(repo):
    for arquivo in repo.msbuild():
        texto = sem_comentarios(ler(arquivo)[0])
        for m in UI.finditer(texto):
            yield repo.achado("ui-windows", arquivo, linha_de(texto, m.start()), f"Use{m.group(1)}")
        for m in COM.finditer(texto):
            yield repo.achado("referencia-com", arquivo, linha_de(texto, m.start()), f"{m.group(1)} {m.group(2)}")
        for m in FRAMEWORK.finditer(texto):
            yield repo.achado("net-framework", arquivo, linha_de(texto, m.start()), m.group(1))
    for arquivo in repo.arquivos(".cs"):
        original = ler(arquivo)[0]
        texto = COMENTARIO_CS.sub(lambda m: re.sub(r"[^\r\n]", " ", m.group()), original)
        nota = " (há proteção por sistema no arquivo: conferir)" if PROTEGIDO.search(texto) else ""
        for nome, padrao in CODIGO:
            m = padrao.search(texto)  # um achado por tipo e por arquivo
            if m:
                yield repo.achado("api-windows", arquivo, linha_de(texto, m.start()), nome + nota)
