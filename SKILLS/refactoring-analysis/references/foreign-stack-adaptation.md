# Foreign Stack Adaptation

Reached from step 0 when the detected stack is not .NET/C# and the user chose to continue.
Fowler's catalog is language-agnostic by design — the smells and the techniques survive the
move. What does not survive is the calibration: the thresholds, the idiomatic fixes, the
patterns that look like smells but are the framework working as intended. Build that
calibration first, run the audit with it, then offer to keep it.

## 1. Pin the dialect

Name the stack down to the level that changes the analysis: not "JavaScript" but
"TypeScript / React / pnpm monorepo"; not "Delphi" but "Delphi VCL with DUnitX tests"; not
"Python" but "Python / FastAPI / SQLAlchemy". Read the build manifests you found in step 0 plus
any repository instruction file (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`)
before deciding — they usually name the architecture the project believes it has.

**Done when** the stack, its framework, its test framework, and its package manager are recorded.

## 2. Build the strategy

Fill this table for the detected stack. Every row is what a step of the audit needs in order to
run at all.

| Row | What to determine |
| --- | --- |
| Source extensions | Which files are source, and which are build output, generated, or vendored (the exclusion globs) |
| Manifests | Build and dependency files that define module boundaries and test setup |
| Paradigm | OOP, functional, procedural, or mixed — it decides which smells even apply |
| Thresholds | This language's norms for method length, parameter count, class size, and nesting depth; a 40-line Delphi procedure and a 40-line TypeScript function are not the same finding |
| Grep signatures | A `ripgrep` pattern per smell category that has one — long parameter lists, nested conditionals, magic values, message chains, dead/commented code |
| Read-only smells | Which categories have no grep signature here and must come from reading (usually Data Clumps, Divergent Change, Feature Envy, Middle Man, Speculative Generality) |
| Idiomatic fixes | The technique names and language mechanisms this stack's developers actually use — what Introduce Parameter Object, Replace Primitive with Object, and Replace Conditional with Polymorphism look like here |
| False positives | Framework patterns that mimic a smell and are not one: Redux boilerplate, Delphi form event handlers, Django model `Meta` classes, generated API clients |
| Coupling evidence | How modules declare dependencies — `import`, `uses`, `require`, `#include` — and how to trace cycles |
| SOLID gate | Whether this stack's project even has a domain model; in a script or a UI-heavy legacy app, record the skip instead |
| Toolchain | The stack's own analyzers worth running read-only (`tsc --noEmit`, `ruff`, `go vet`, `staticcheck`, `pylint`, Delphi compiler hints) |

Write every sweep as a PowerShell command driven by `ripgrep`, in the same shape as the .NET
commands in `SKILL.md`: redefine the `$src` exclusion set for this stack's build output and
generated code, then splat it into every sweep.

**Done when** every row is filled and each of steps 2, 4, and 5 has at least one concrete
command or a recorded skip.

## 3. Confirm and run

Show the user the filled table and the commands before touching source, so a wrong threshold or
a mislabeled false positive is caught while it is still cheap. Then run steps 1–5 of `SKILL.md`
with these commands and thresholds substituted, and steps 6–8 unchanged — the report template,
the tiering, and the checklist are stack-neutral apart from their examples.

**Done when** the audit has run to a written report in `docs/_refacs/`.

## 4. Offer to keep it

Ask the user whether to save the strategy as a project skill named
`refactoring-analysis-<stack>` — `refactoring-analysis-delphi`, `refactoring-analysis-typescript`,
`refactoring-analysis-python`. On a no, stop here; the report is the deliverable.

On a yes, create `SKILLS/refactoring-analysis-<stack>/` (or the path this repository already
uses for skills) with:

- `SKILL.md` — this skill's step sequence with the stack's commands and thresholds in place of
  the .NET ones, `name` and directory matching, and step 0 inverted to detect that stack and
  hand a foreign stack back to `refactoring-analysis`.
- `references/code-smells-catalog.md` — Fowler's taxonomy kept, with this stack's heuristics,
  thresholds, idiomatic examples, and its false-positive cautions.
- `references/refactoring-techniques.md` — the technique catalog with this stack's canonical
  technique names and examples in its language.
- `references/solid-ddd-context.md` — the applicability gate rewritten around how this stack
  expresses layering, or a note that SOLID rarely applies here and why.
- `references/analysis-checklist.md` — copied, with the smell-category items matching the new
  catalog.
- `assets/refactoring-report-template.md` — copied, with the stack and language placeholders
  redone in that stack's idiom.

If the repository carries a `bundles.yaml`, register the new skill under the bundle for that
stack, creating the bundle when the stack has none.

**Done when** the new skill directory exists with all six files, its `name` matches its
directory, and it is registered wherever this repository tracks skills.
