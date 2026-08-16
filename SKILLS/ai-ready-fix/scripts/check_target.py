"""Classify an instruction .md file before the skill edits it in place.

Usage: python check_target.py <md_path> <repo_root>

Read-only. Tells the caller whether <md_path> is safe to edit directly:
  MISSING              - does not exist yet, nothing to protect.
  REAL                 - not a symlink, safe to edit directly.
  IN_REPO_SYMLINK <target>   - symlink resolving inside repo_root, safe to
                          edit through (it already points at the repo's own
                          single-source file).
  EXTERNAL_SYMLINK <target>  - symlink resolving outside repo_root. Editing
                          this path would write through the link into a file
                          the repo does not own (e.g. a global or shared
                          instructions file). Do not edit it in place.
"""
import argparse
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Classify an .md path as real, in-repo symlink, or external symlink before editing it."
    )
    parser.add_argument("md_path", help="Instruction file the skill is about to write (e.g. AGENTS.md).")
    parser.add_argument("repo_root", help="Root of the repository being audited.")
    args = parser.parse_args()

    path = Path(args.md_path)
    root = Path(args.repo_root).resolve()

    if not path.exists() and not path.is_symlink():
        print("MISSING")
        return

    if not path.is_symlink():
        print("REAL")
        return

    target = path.resolve()
    try:
        target.relative_to(root)
        print(f"IN_REPO_SYMLINK {target}")
    except ValueError:
        print(f"EXTERNAL_SYMLINK {target}")


if __name__ == "__main__":
    main()
