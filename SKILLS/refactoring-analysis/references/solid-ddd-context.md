# SOLID & DDD Context for Refactoring Analysis — .NET / C#

## Important Disclaimer

SOLID principles have the most impact in **domain-rich, object-oriented codebases** —
particularly those using Domain-Driven Design (DDD), hexagonal architecture, or clean
architecture. In simpler projects (CRUD APIs, utility libraries, worker scripts), applying
SOLID rigorously leads to over-engineering.

> "SOLID impacta principalmente a inversão de dependência, extensibilidade, substituição
> sendo algo que vai funcionar em projeto orientado ao domínio, tipo DDD... pelo menos
> uma arquitetura hexagonal pra poder aplicar DIP... OCP, LSP e ISP muito em domain model."
> — Rodrigo Branas

**Rule**: Only recommend SOLID-based refactorings when the solution has a complex domain model
with clear bounded contexts, entities, value objects, or domain services. Note this context in
the report.

---

## When SOLID Analysis Applies

Perform SOLID analysis when the solution exhibits **at least 2** of:
- Domain entities or value objects (not just DTOs and EF Core POCOs)
- Bounded contexts, or a project-per-context layout in the solution
- Repository pattern, `IUnitOfWork`, or ports/adapters projects
- Domain events, MediatR notifications, or an event-driven integration path
- Aggregate roots or domain services
- Hexagonal / clean / onion layering, visible as `*.Domain`, `*.Application`,
  `*.Infrastructure` projects whose `ProjectReference` direction points inward

.NET's own DI container is not evidence on its own — every ASP.NET Core template registers
services. Look for a domain that owns behavior, not merely a container that resolves it.

---

## SOLID Principles — Detection and Refactoring

### S — Single Responsibility Principle (SRP)

**Detection heuristics**:
- A class changes for multiple unrelated reasons (= Divergent Change smell)
- A file's `using` directives span many unrelated domains
- A name containing "And", or a `Manager`/`Helper`/`Service` doing several jobs
- >5 public members grouping into 2+ unrelated clusters
- A constructor injecting 6+ dependencies — the parameter list is the responsibility count

**Refactoring**: Extract Class, Split Phase, Move Method

### O — Open/Closed Principle (OCP)

**Detection heuristics**:
- Adding a variant (payment type, notification channel, tax regime) means editing existing
  code instead of adding a type
- `switch` chains over a type code or `enum` that grow with each new variant
- Core logic interleaved with variant-specific behavior

**Refactoring**: Replace Conditional with Polymorphism, Strategy pattern, Replace Type Code
with Subclasses. In .NET the strategy set is usually registered once
(`services.AddKeyedScoped<IHandler>(...)` or a `Dictionary<TKey, IHandler>`) and resolved by key.

**Context**: Most valuable in domain layers where new business rules arrive often.

### L — Liskov Substitution Principle (LSP)

**Detection heuristics**:
- An override throwing `NotImplementedException` or `NotSupportedException`, or returning
  `null` (= Refused Bequest smell)
- An override narrowing the contract — rejecting inputs the base accepts, or tightening a
  parameter's nullability
- An override with side effects the base doesn't specify
- A `sealed` override that breaks a base-class invariant the callers rely on

**Refactoring**: Replace Subclass with Delegate, Push Down Method, Extract Interface

### I — Interface Segregation Principle (ISP)

**Detection heuristics**:
- Interfaces with >7 members where implementers stub or throw on several
- "Fat" interfaces forcing unrelated capabilities together — a single `IRepository<T>`
  carrying every query the application ever needed
- Classes implementing an interface but using only 2-3 of its members
- Default interface members added to avoid breaking existing implementers — a sign the
  interface is doing too much

**Refactoring**: Extract Interface (split into focused, role-named interfaces)

**Context**: Most relevant in domain interfaces — repositories, domain services, event handlers.

### D — Dependency Inversion Principle (DIP)

**Detection heuristics**:
- A domain project referencing infrastructure: `Microsoft.EntityFrameworkCore`,
  `Microsoft.AspNetCore.*`, `System.Net.Http`, `System.IO`
- Domain logic constructing `new HttpClient()`, `new SqlConnection(...)`, or reading
  `DateTime.Now` instead of taking an injected abstraction
- No port between domain and infrastructure — the `ProjectReference` arrows point outward
  from the domain instead of inward toward it
- Tests requiring a real database or a live endpoint instead of a test double
- `IServiceProvider.GetRequiredService` inside business code (= Service Locator smell)

**Refactoring**: Extract Interface (port), Inject Dependencies, Introduce Adapter.
`TimeProvider` and `IHttpClientFactory` are the framework's own answers for the two most
common offenders.

**Context**: Requires at least hexagonal layering to apply meaningfully. In a flat Minimal API
handler, DIP is usually over-engineering.

---

## DDD-Specific Refactoring Opportunities

When the solution uses DDD patterns, also evaluate:

### Aggregate Boundaries
- Aggregates that are too large (>5 entities) — consider splitting
- Aggregates referencing other aggregates by navigation property instead of by id — in EF Core
  this also produces accidental cascade behavior and oversized loads
- Cross-aggregate changes inside one `SaveChangesAsync` that should be eventual consistency

### Value Objects
- Domain concepts carried as primitives that should be value objects (= Primitive Obsession
  in DDD clothing) — an id as `Guid`, money as bare `decimal`, a document number as `string`
- Mutable classes that should be immutable `readonly record struct` value objects
- Value objects persisted as loose columns where an EF Core owned type or complex type fits

### Domain Events
- Direct project references between bounded contexts that should communicate via events
- Synchronous calls across context boundaries that should be asynchronous
- Events raised by the infrastructure layer rather than by the aggregate that owns the change

### Anti-Corruption Layer
- External system models (SOAP proxies, generated API clients, third-party DTOs) leaking into
  the domain
- Missing translation layer between contexts

---

## Report Template Additions for SOLID/DDD

When SOLID analysis is performed, add a section to the report:

```markdown
## SOLID Analysis

> **Context**: This solution uses [DDD / hexagonal / clean] architecture with
> [bounded contexts / domain entities / etc.]. SOLID analysis is applicable.

### Findings

| Principle | Finding | Location | Severity | Recommendation |
|-----------|---------|----------|----------|----------------|
| SRP | ... | ... | ... | ... |

### Domain Model Health
- Aggregate boundaries: [assessment]
- Value object coverage: [assessment]
- Cross-context coupling: [assessment]
```

If SOLID analysis is NOT applicable, add:

```markdown
## SOLID Analysis

> **Skipped**: This solution does not use domain-driven design or a layered architecture
> pattern. SOLID-specific analysis was not performed. For projects with complex business
> domains, consider adopting hexagonal architecture to benefit from SOLID principles —
> particularly Dependency Inversion (DIP) for testability and Open/Closed (OCP) for
> extensibility.
```
