"""Read-only scan for AI-instruction files (Copilot, Claude Code, Codex, OpenCode).

Usage: python discover.py [repo_root]

Prints a deterministic inventory to stdout: which instruction files exist per
tool, whether they are symlinks (and to what), a content hash to spot
copy-pasted duplicates, nested CLAUDE.md/AGENTS.md files elsewhere in the
repo, and any existing skill files (SKILL.md). Exits 1 with a message on
stderr if repo_root does not exist or is not a directory.
"""
import hashlib
import os
import sys
from pathlib import Path

PRUNE_DIRS = {
    ".git", "node_modules", "bin", "obj", "dist", "build", "out",
    ".venv", "venv", "vendor", "packages", ".next", "target",
}
SCAN_LIMIT = 20

CORE_FILES = {
    "Claude Code": ["CLAUDE.md"],
    "Codex": ["AGENTS.md"],
    "OpenCode": ["AGENTS.md"],
    "Copilot": [".github/copilot-instructions.md"],
}


def content_hash(path: Path) -> str:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    except OSError:
        return "unreadable"


def describe(path: Path, root: Path) -> str:
    rel = path.relative_to(root)
    if path.is_symlink():
        target = os.readlink(path)
        resolved = "resolves" if path.exists() else "BROKEN"
        return f"{rel} -> symlink -> {target} ({resolved})"
    size = path.stat().st_size
    h = content_hash(path)
    return f"{rel} -> real file, {size} bytes, hash={h}"


def scan_glob(root: Path, filenames: set[str], limit: int) -> list[Path]:
    found = []
    for dirpath, dirnames, filenames_here in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in PRUNE_DIRS and not d.startswith(".")]
        for name in filenames_here:
            if name in filenames:
                found.append(Path(dirpath) / name)
                if len(found) >= limit:
                    return found
    return found


def main() -> None:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    if not root.is_dir():
        print(f"ERROR: {root} is not a directory", file=sys.stderr)
        sys.exit(1)

    print(f"# AI-instruction inventory for {root}\n")

    print("## Core files (by tool)")
    for tool, rels in CORE_FILES.items():
        for rel in rels:
            path = root / rel
            if path.exists() or path.is_symlink():
                print(f"- {tool}: {describe(path, root)}")
            else:
                print(f"- {tool}: {rel} -> MISSING")

    copilot_dir = root / ".github" / "instructions"
    if copilot_dir.is_dir():
        matches = sorted(copilot_dir.glob("*.instructions.md"))
        if matches:
            print("\n## Copilot path-scoped instructions (.github/instructions/*.instructions.md)")
            for m in matches:
                print(f"- {describe(m, root)}")

    nested = scan_glob(root, {"CLAUDE.md", "AGENTS.md"}, SCAN_LIMIT)
    nested = [p for p in nested if p.parent != root]
    if nested:
        print(f"\n## Nested CLAUDE.md / AGENTS.md found elsewhere (first {SCAN_LIMIT})")
        for p in nested:
            print(f"- {describe(p, root)}")

    skills = scan_glob(root, {"SKILL.md"}, SCAN_LIMIT)
    if skills:
        print(f"\n## Existing SKILL.md files (first {SCAN_LIMIT})")
        for p in skills:
            print(f"- {p.relative_to(root)}")
    else:
        print("\n## Existing SKILL.md files")
        print("- none found")

    other_rules = [
        ".cursorrules", ".clinerules", ".windsurfrules",
        ".cursor/rules", ".cursor/rules.mdc",
    ]
    other_found = [r for r in other_rules if (root / r).exists()]
    if other_found:
        print("\n## Other assistant-rule files detected (informative, not scored)")
        for r in other_found:
            print(f"- {describe(root / r, root)}")


if __name__ == "__main__":
    main()
