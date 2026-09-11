# Refactoring Analysis Checklist

Verify each item before finalizing the report.

---

## Scope & Context

- [ ] Stack confirmed as .NET/C# by the step 1 gate, or the foreign-stack branch was taken with the
      user's consent and its strategy recorded
- [ ] Analysis target is clearly defined (project, namespace, or feature area)
- [ ] Target framework(s) recorded
- [ ] Paradigm identified (domain-rich OO, procedural, mixed)
- [ ] Project conventions understood (naming, layering, solution structure)
- [ ] Test projects inventoried and coverage status noted in the report

## Smell Detection — Completeness

- [ ] Scanned for **Bloaters**: Long Methods, Large Classes, Long Parameter Lists,
      Data Clumps, Primitive Obsession
- [ ] Scanned for **Change Preventers**: Divergent Change, Shotgun Surgery
- [ ] Scanned for **Dispensables**: Duplicated Code, Dead Code, Speculative Generality,
      Lazy Elements, Comments as Deodorant
- [ ] Scanned for **Couplers**: Feature Envy, Insider Trading, Message Chains, Middle Man
- [ ] Scanned for **Conditional Complexity**: Nested Conditionals, Repeated Switches,
      Complex Booleans
- [ ] Scanned for **DRY Violations**: Magic Numbers and string keys, Copy-Paste Variations,
      Repeated Parameter Groups
- [ ] Scanned for **.NET-Specific Smells**: Anemic Domain Model, Blocking on Async,
      Service Locator, Static Mutable State, Exceptions as Control Flow, Imperative Loops,
      Boolean State Explosion
- [ ] The categories with no grep signature were reached by reading, not skipped because
      no sweep fired

## Refactoring Mapping

- [ ] Each smell has a mapped technique from the catalog
- [ ] Before/after C# sketches provided for P0 and P1 findings
- [ ] Technique names match the catalog's C# names (Extract Method, Move Method, …)

## Coupling & Cohesion

- [ ] Project-level dependency structure analyzed from `ProjectReference`
- [ ] Namespace-level dependency structure analyzed from `using` directives
- [ ] High afferent coupling identified (many dependents — risky to change)
- [ ] High efferent coupling identified (many dependencies — fragile)
- [ ] Cycles checked, including the catch-all `Common`/`Shared` project that stands in for one
- [ ] Cohesion assessed (mixed responsibilities flagged)

## DRY Analysis

- [ ] Near-duplicate blocks identified, including copies hidden behind generics, `partial`
      types, and extension methods
- [ ] Magic numbers and repeated string keys cataloged
- [ ] Repeated parameter patterns found
- [ ] Extraction strategies proposed

## SOLID (If Applicable)

- [ ] Confirmed the solution meets the applicability gate before analyzing
- [ ] Or: noted "SOLID analysis skipped" with rationale
- [ ] Each principle evaluated with concrete findings (not generic advice)

## Prioritization

- [ ] All findings have severity: critical / high / medium / low
- [ ] Priority considers impact × frequency ÷ effort
- [ ] Quick wins identified (low effort, high clarity improvement)
- [ ] Suggested refactoring order accounts for dependencies between changes

## Report Quality

- [ ] Report follows template from `assets/refactoring-report-template.md`
- [ ] Executive summary is concise (2-4 sentences) and leads with the biggest opportunity
- [ ] Top opportunities table filled with 3-5 entries
- [ ] File paths are exact (file:line format)
- [ ] Code snippets are real (not fabricated), simplified to essential lines
- [ ] Rationale explains "why" not just "what"
- [ ] Risks and caveats section acknowledges ambiguity and limitations
- [ ] Saved to `docs/_refacs/<YYYYMMDD>-<slug>.md`

## Integrity

- [ ] No fabricated findings — every smell references real code that was read, not just a
      ripgrep hit
- [ ] Ambiguous cases flagged as "potential" with context
- [ ] Framework patterns not falsely flagged: `IFoo`/`Foo` pairs that serve DI, EF Core
      migrations and generated code, minimal-API endpoint registration, record DTOs
- [ ] Dead code cleared against indirect use — DI registration, configuration binding,
      serialization, markup, reflection — before being called dead
- [ ] Intentional design choices acknowledged (Strategy is not Feature Envy; a mapper reading
      another type's surface is not envy either)
