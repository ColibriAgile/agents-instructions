"""Real-terminal wizard checks for macOS/Linux; the Node tests (CLI as a process) also run on Windows."""
import errno
import fcntl
import os
from pathlib import Path
import pty
import re
import select
import shutil
import subprocess
import struct
import termios
import tempfile
import time
import hashlib

ENTRY = Path(__file__).resolve().parents[1] / "bin" / "colibri-skills.mjs"
NODE = shutil.which("node")
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
DOWN = b"\x1b[B"


def snapshot(project):
    """The files of the project, without .git (Git can touch its own files on a read)."""
    result = {}
    for path in Path(project).rglob('*'):
        relative = path.relative_to(project)
        if relative.parts[0] == '.git':
            continue
        if path.is_symlink():
            result[str(relative)] = ('link', os.readlink(path))
        elif path.is_file():
            result[str(relative)] = ('file', hashlib.sha256(path.read_bytes()).hexdigest())
        else:
            result[str(relative)] = ('dir', '')
    return result


def scenario(name):
    """One run of the wizard in a Git project with `bundles: [core]` and no links yet."""
    with tempfile.TemporaryDirectory(prefix="colibri wizard ") as base:
        project = Path(base) / 'project'
        project.mkdir()
        subprocess.run(['git', '-C', str(project), 'init', '-q'], check=True)
        (project / 'skills.yaml').write_text('bundles:\n  - core\n')
        before = snapshot(project)
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 40, 140, 0, 0))
        env = {**os.environ, "TERM": "xterm-256color", "NO_COLOR": "1", "COLIBRI_SKILLS_SOURCES": str(Path(base) / 'sources')}
        process = subprocess.Popen([NODE, str(ENTRY), "--cwd", str(project)], stdin=slave, stdout=slave, stderr=slave, cwd=project, env=env)
        os.close(slave)
        transcript = ""
        pending = ""

        def expect(needle):
            nonlocal transcript, pending
            deadline = time.monotonic() + 20
            while time.monotonic() < deadline:
                clean = ANSI.sub("", pending)
                if needle in clean:
                    # Keep the text after the needle: the next expected text can come in the same read.
                    pending = clean[clean.index(needle) + len(needle):]
                    return
                if select.select([master], [], [], 0.1)[0]:
                    try:
                        data = os.read(master, 65536).decode("utf8", errors="replace")
                    except OSError as error:
                        if error.errno != errno.EIO:
                            raise
                        break
                    transcript += data
                    pending += data
            raise AssertionError(f"Wizard did not show {needle!r}:\n{ANSI.sub('', transcript)}")

        def send(data):
            os.write(master, data)
            time.sleep(0.07)

        def decline():
            expect("○ Sim / ● Não")
            confirm = ANSI.sub('', transcript).split("Aplicar estas alterações?")[-1]
            assert not re.search(r'\b(Yes|No)\b', confirm), confirm
            send(b"n")
            send(b"\r")
            expect("Cancelado. Nenhum arquivo foi alterado.")

        try:
            expect("Escolha a ação")
            if name == 'cancel':
                send(b"\x03")
                expect("Cancelado. Nenhum arquivo foi alterado.")
            elif name == 'install':
                send(b"\r")  # Vincular as skills do projeto
                expect("Vincular:")
                output = ANSI.sub('', transcript)
                assert 'commit' in output, output
                decline()
            elif name == 'list':
                for _ in range(4):
                    send(DOWN)
                send(b"\r")  # Ver o estado das skills do projeto
                expect("faltando")
                output = ANSI.sub('', transcript)
                assert 'commit · faltando [core]' in output, output
                assert not re.search(r'\b(missing|linked|stale)\b', output), output
                expect("Concluído.")
            elif name == 'add':
                send(DOWN)
                send(DOWN)
                send(b"\r")  # Adicionar skills avulsas
                expect("Filtro de categoria")
                send(b"\r")
                expect("Escolha as skills")
                send(b"delphi-xe2-build")
                send(b"\t")
                send(b"\r")
                expect("Guardar no skills.yaml?")
                send(b"\r")
                expect("skills.yaml · skills: delphi-xe2-build")
                decline()
                output = ANSI.sub('', transcript)
                assert 'Requer Windows e Delphi XE2' in output, output
                assert 'Sistema atual:' in output, output
                assert output.index('Sistema atual:') < output.rindex('Aplicar estas alterações?'), output
            assert process.wait(timeout=10) == 0
            assert snapshot(project) == before, "Cancelling, declining and reading must leave the project unchanged"
        finally:
            if process.poll() is None:
                process.kill()
                process.wait()
            os.close(master)


scenario('cancel')
print("PASS: Ctrl+C cancels without writes")
scenario('install')
print("PASS: the install preview lists the links and declining writes nothing")
scenario('list')
print("PASS: the state of the project shows in pt-BR and a read writes nothing")
scenario('add')
print("PASS: a searched skill shows its declared requirements before the confirmation, and declining writes nothing")
