---
name: refactoring-analysis
description: >
  Audits a .NET/C# codebase against Martin Fowler's code smell and technique catalog —
  long methods, duplication, high coupling, complex conditionals, primitive obsession —
  and writes a prioritized report to docs/_refacs/. Use when auditing code quality or
  planning a refactoring sprint; it detects the stack first and offers a derived strategy
  when that stack is not .NET/C#. Don't use for style/formatting, performance, or
  security audits.
disable-model-invocation: true
metadata:
  author: Pedro Nauck
  github: https://github.com/pedronauck
  repository: https://github.com/pedronauck/skills
---
# Refactoring Analysis

Audit a .NET/C# codebase against Martin Fowler's *Refactoring* (2nd ed.) and produce a
prioritized report. Every finding names a **smell**, cites the real `file:line` you read it
at, and maps to a Fowler **technique** — grounded in code you actually read, never generic
advice. When a step names a reference, read it in full before producing that step's findings.

Commands are PowerShell driven by `ripgrep`, run from the repository root. Set these three
variables once per session and reuse them in every sweep, improvised ones included — without
the exclusions the sweeps report compiler output and generated code as source. Every sweep
below only *surfaces* candidates; a finding exists once you have read the code behind the hit.

```powershell
$src = @('-g','!**/bin/**','-g','!**/obj/**','-g','!**/*.g.cs','-g','!**/*.Designer.cs')
$target = '.'      # narrowed to the analysis target in step 1
$ns = 'Acme'       # the solution's root namespace, read from a .csproj in step 1
```

## Steps

**0. Fix the stack.** Identify the stack from its build manifests before reading any source.

```powershell
rtk rg --files -g '*.sln' -g '*.slnx' -g '*.csproj' -g 'Directory.Build.props' -g 'global.json' -g '*.dproj' -g 'package.json' -g 'pyproject.toml' -g 'go.mod' -g 'Cargo.toml' -g 'pom.xml' -g 'build.gradle*' -g 'Gemfile' -g 'composer.json'
```

A `.sln`, `.slnx`, or `.csproj` alongside `.cs` sources means **.NET/C#** — continue to step 1.
Any other stack — or .NET on a non-C# language such as F# or VB.NET — falls outside this
skill's calibration: name the stack you found, name the mismatch, and ask the user whether to
continue anyway. On a yes, read `references/foreign-stack-adaptation.md` in full and follow it;
it rebuilds steps 1–5 around the detected stack and ends by offering to save that strategy as
`refactoring-analysis-<stack>`. *Done when:* the stack is named, and either it is .NET/C# or
the user has answered the continue question.

**1. Scope.** Fix the target — project, namespace, feature area, or whole solution; ask if the
user did not say. Record the target frameworks and whether the codebase is domain-rich or
procedural, which calibrates step 5. Test coverage decides how safe any recommendation is, so
find the test projects now.

```powershell
rtk rg --files -g '*.csproj' $target
(rtk rg --files -g '*.cs' @src $target | Measure-Object).Count
rtk rg -n -g '*.csproj' 'Microsoft.NET.Test.Sdk|xunit|NUnit|MSTest|<TargetFramework'
```

If the target exceeds ~50 files, ask to narrow or confirm a sampled scan. *Done when:* target,
target framework, paradigm, and test-project inventory are recorded.

**2. Detect smells.** Scan for every category in `references/code-smells-catalog.md`, using its
heuristics and its C# thresholds: Bloaters, Change Preventers, Dispensables, Couplers,
Conditional Complexity, DRY Violations.

```powershell
rtk rg -c '^' --type cs @src $target | Sort-Object { [int]($_ -split ':')[-1] } -Descending | Select-Object -First 20
rtk rg -n --type cs @src '\w+\((?:[^),]+,){3,}[^)]*\)'
rtk rg -n --type cs @src '\b(string|int|long|decimal|double|Guid) [a-zA-Z]*(Id|Email|Cpf|Cnpj|Price|Amount|Total|Status|Phone)\b'
rtk rg -n --type cs @src 'switch \(|if \(.*&&.*&&|if \(.*\|\|.*\|\|'
rtk rg -n --type cs @src '^\s*//\s*(public|private|internal|var|if|return|await)|NotImplementedException|TODO|HACK'
rtk rg -n --type cs @src '\w+\.\w+\(\)\.\w+\(\)\.\w+'
rtk rg -n --type cs @src '[=<>(,]\s*[0-9]{3,}'
rtk rg -o --no-filename --type cs @src '"[A-Za-z][A-Za-z0-9_.:-]{3,}"' | Group-Object | Where-Object Count -ge 3 | Sort-Object Count -Descending | Select-Object Count, Name -First 20
```

Data Clumps, Divergent Change, Feature Envy, Middle Man, and Speculative Generality leave no
grep signature — they surface from reading the largest files the first sweep returned. For each
hit record: `file:line` range, smell name + category, severity (`critical` / `high` / `medium` /
`low`), and its cost to maintainability, readability, or change. Flag an ambiguous case as
*potential* with the context that might justify it. *Done when:* every category above has been
scanned, not only the ones that fired.

**3. Map techniques.** Give each smell its Fowler technique(s) from the table in
`references/refactoring-techniques.md`, and sketch a concrete before/after in C# for every P0
and P1 finding. *Done when:* each finding carries a named technique.

**4. Assess coupling.** Flag projects and namespaces with high afferent coupling (many
dependents — risky to change), high efferent coupling (many dependencies — fragile), dependency
cycles, and low cohesion (mixed responsibilities → Extract Class / Split Phase).

```powershell
rtk rg -n -g '*.csproj' 'ProjectReference|PackageReference'
rtk rg -o --no-filename --type cs @src '^using [A-Z][\w.]+;' | Group-Object | Sort-Object Count -Descending | Select-Object Count, Name -First 25
rtk rg -c --type cs @src "using $ns\."
```

The compiler rejects `ProjectReference` cycles, so look for the workaround instead — a catch-all
`Common`/`Shared` project every other project depends on — plus type and namespace cycles inside
a single project. *Done when:* the dependency structure is characterized at both project and
namespace level.

**5. SOLID pass (domain projects only).** Apply only when the project is domain-rich — DDD,
hexagonal, or clean architecture; otherwise skip and note why in the report.
`references/solid-ddd-context.md` holds the applicability gate, per-principle detection
heuristics, and DDD checks — read it before this step.

```powershell
rtk rg -l --type cs @src 'IRepository|AggregateRoot|ValueObject|DomainEvent|: Entity\b|IUnitOfWork'
rtk rg -n --type cs @src 'NotImplementedException|NotSupportedException'
rtk rg -n --type cs @src -g '**/*Domain*/**' -g '**/Domain/**' 'using Microsoft\.EntityFrameworkCore|using Microsoft\.AspNetCore|using System\.Net\.Http|new SqlConnection|DateTime\.(Now|UtcNow)'
```

*Done when:* each principle has a concrete finding, or the skip and its rationale are recorded.

**6. Prioritize and report.** Rank findings by impact × frequency ÷ effort into tiers, P0
(critical / blocking) through P3 (minor / litter-pickup). Write the report from
`assets/refactoring-report-template.md` and save to `docs/_refacs/<YYYYMMDD>-<slug>.md`
(create the directory; `<slug>` is a lowercase-hyphenated summary, e.g. `pedidos-module-cleanup`).
When the target has no test project covering it, record in the report's risks that refactoring
without coverage is unsafe and name the critical paths to cover first. *Done when:* the saved
report matches the template and every finding sits in a tier.

**7. Verify.** Walk `references/analysis-checklist.md`; ship the report only once every item
passes. *Done when:* the checklist is fully satisfied.

**8. Present.** Give the user a short summary: finding counts by severity, the top 3–5
opportunities, a suggested order (quick wins before high-impact structural work), and a
complexity tier (trivial / moderate / significant) for each. Ask which refactoring to pursue.
*Done when:* the summary is in chat and the user has been asked to choose.

## Bundled files

- `references/code-smells-catalog.md` — Fowler's smell taxonomy with C# heuristics and
  thresholds; read in step 2.
- `references/refactoring-techniques.md` — the technique catalog and the smell → technique
  table; read in step 3.
- `references/solid-ddd-context.md` — the SOLID applicability gate and per-principle heuristics
  for .NET; read in step 5.
- `references/foreign-stack-adaptation.md` — the non-.NET branch: build a stack-specific
  strategy, run it, and offer to save it as a derived skill. Reached only from step 0.
- `references/analysis-checklist.md` — the exit audit walked in step 7.
- `assets/refactoring-report-template.md` — the report written in step 6.
