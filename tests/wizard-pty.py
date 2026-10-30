"""Real-terminal wizard checks for macOS/Linux; Node lifecycle tests also run on Windows."""
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


def snapshot(project):
    result = {}
    for path in Path(project).rglob('*'):
        if path.is_symlink():
            result[str(path.relative_to(project))] = ('link', os.readlink(path))
        elif path.is_file():
            result[str(path.relative_to(project))] = ('file', hashlib.sha256(path.read_bytes()).hexdigest())
        else:
            result[str(path.relative_to(project))] = ('dir', '')
    return result


def scenario(search, preferences=False, requirements=False):
    with tempfile.TemporaryDirectory(prefix="colibri wizard ") as project:
        if preferences:
            setup = subprocess.run([NODE, str(ENTRY), 'install', '--cwd', project, '--skill', 'commit', '--agent', 'claude-code', 'windsurf', '--method', 'symlink', '--yes'],
                                   capture_output=True, text=True, env={**os.environ, 'DISABLE_TELEMETRY': '1'})
            assert setup.returncode == 0, setup.stdout + setup.stderr
        before = snapshot(project)
        master, slave = pty.openpty()
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 32, 120, 0, 0))
        process = subprocess.Popen([NODE, str(ENTRY), "--cwd", project], stdin=slave, stdout=slave, stderr=slave,
                                   cwd=project, env={**os.environ, "TERM": "xterm-256color", "NO_COLOR": "1"})
        os.close(slave)
        transcript = ""
        pending = ""

        def expect(needle):
            nonlocal transcript, pending
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                if needle in ANSI.sub("", pending):
                    pending = ""
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

        try:
            expect("Choose action")
            if search:
                send(b"\r")
                expect("Scope")
                send(b"\r")
                expect("Choose agents")
                if not preferences:
                    send(b"\t")
                send(b"\r")
                expect("Browse skills")
                send(b"\x1b[B")
                send(b"\r")
                expect("Category filter")
                send(b"\r")
                expect("Choose skills")
                send(b"delphi-xe2-build" if requirements else b"commit")
                send(b"\t")
                send(b"\r")
                expect("Installation method")
                send(b"\r")
                expect("Apply these changes?")
                if requirements:
                    output = ANSI.sub('', transcript)
                    assert 'Requer Windows e Delphi XE2' in output, output
                    assert 'Sistema atual:' in output, output
                    assert 'Instalação permitida; ferramentas não verificadas.' in output, output
                    assert output.index('Sistema atual:') < output.index('Apply these changes?'), output
                send(b"n")
                send(b"\r")
                expect("Cancelled. No files changed.")
                assert ("delphi-xe2-build" if requirements else "commit") in ANSI.sub("", transcript), transcript
                assert "INSTALL" in ANSI.sub("", transcript), transcript
                if preferences:
                    assert 'Claude Code · symlink' in ANSI.sub('', transcript), transcript
                    assert 'Windsurf · symlink' in ANSI.sub('', transcript), transcript
                    assert 'Codex · symlink' not in ANSI.sub('', transcript), transcript
            else:
                send(b"\x03")
                expect("Cancelled. No files changed.")
            assert process.wait(timeout=5) == 0
            if not preferences:
                assert list(Path(project).iterdir()) == [], "Cancellation must not create project artifacts"
            assert snapshot(project) == before, "Declining must leave existing content and preferences unchanged"
        finally:
            if process.poll() is None:
                process.kill()
                process.wait()
            os.close(master)


scenario(False)
print("PASS: Ctrl+C cancels without writes")
scenario(True)
print("PASS: agent selection, category, searchable skills, method and declined preview without writes")
scenario(True, preferences=True)
print('PASS: stored agents/method are offered on the next run and declining preserves state')
scenario(True, requirements=True)
print('PASS: declared Windows/Delphi requirements and host restriction appear before confirmation without writes')
