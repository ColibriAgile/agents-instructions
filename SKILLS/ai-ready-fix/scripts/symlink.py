"""Create a real OS symlink pointing at a canonical instruction file.

Usage: python symlink.py <link_path> <target_path> [--force]

Turns <link_path> into a real symlink to <target_path>, so the two are a
single source of truth instead of copy-pasted duplicates. Refuses to
overwrite an existing file or symlink unless --force is passed. Mutating:
only touches the filesystem after target existence and force checks pass.
"""
import argparse
import os
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a real symlink, replacing an existing file only with --force."
    )
    parser.add_argument("link_path", help="Path of the symlink to create (e.g. CLAUDE.md).")
    parser.add_argument("target_path", help="Path of the real file to point to (e.g. AGENTS.md).")
    parser.add_argument("--force", action="store_true", help="Replace an existing file or symlink at link_path.")
    args = parser.parse_args()

    link = Path(args.link_path).resolve()
    target = Path(args.target_path).resolve()

    if not target.exists():
        print(f"ERROR: target {target} does not exist.", file=sys.stderr)
        sys.exit(1)

    if link.exists() or link.is_symlink():
        if link.is_symlink() and Path(os.readlink(link)).name == target.name:
            print(f"OK: {link} already symlinks to {target.name}, nothing to do.")
            return
        if not args.force:
            kind = "symlink" if link.is_symlink() else "real file"
            print(
                f"ERROR: {link} already exists as a {kind}. "
                "Confirm with the user it is safe to replace, then re-run with --force.",
                file=sys.stderr,
            )
            sys.exit(1)
        link.unlink()

    relative_target = os.path.relpath(target, start=link.parent)
    try:
        os.symlink(relative_target, link)
    except OSError as e:
        if os.name == "nt" and getattr(e, "winerror", None) == 1314:
            print(
                "ERROR: Windows denied symlink creation (privilege not held). "
                "Enable Developer Mode (Settings > For developers > Developer Mode) "
                "or re-run from an elevated PowerShell, then retry this command.",
                file=sys.stderr,
            )
        else:
            print(f"ERROR: could not create symlink: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"OK: created symlink {link} -> {relative_target}")


if __name__ == "__main__":
    main()
