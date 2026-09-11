# Code Smells Catalog — .NET / C#

Complete catalog based on Martin Fowler's "Refactoring" (2nd Edition, Chapter 3),
supplemented by the refactoring.guru taxonomy and calibrated to C# and .NET idiom.

---

## Bloaters

Smells where code grows too large to work with effectively.

### Long Method
- **Heuristic**: >15 lines of logic, multiple levels of abstraction, or sections that
  need comments to explain them.
- **Why it matters**: Short methods with good names are self-documenting. Fowler:
  "Classes with short methods live longest."
- **Fix**: Extract Method, Replace Temp with Query, Introduce Parameter Object,
  Decompose Conditional, Split Loop, Replace Loop with Pipeline.
- **.NET variant**: An `async` method that awaits, maps, validates, and persists in one
  body — split the orchestration from the work.

### Large Class / Large Project
- **Heuristic**: >300 lines, many fields, multiple unrelated responsibilities, or a
  constructor injecting 6+ dependencies.
- **Why it matters**: Violates Single Responsibility. Hard to understand, test, and change.
- **Fix**: Extract Class, Extract Superclass, Replace Type Code with Subclasses.
- **.NET variant**: Fat controllers and `*Service` god objects; a `Common`/`Shared` project
  that everything references; a `DbContext` owning configuration for every aggregate.

### Long Parameter List
- **Heuristic**: >3 parameters in a method signature.
- **Why it matters**: Hard to call correctly, easy to swap arguments — especially when
  several are the same primitive type.
- **Fix**: Replace Parameter with Query, Preserve Whole Object, Introduce Parameter
  Object, Remove Flag Argument, Combine Methods into Class.
- **.NET variant**: Use a `record` as the parameter object; bind option groups through
  `IOptions<T>` instead of threading them through signatures.

### Data Clumps
- **Heuristic**: The same 3+ parameters or fields travel together repeatedly
  (`startDate`/`endDate`, `street`/`city`/`zipCode`, `host`/`port`/`useSsl`).
- **Why it matters**: Signals a missing abstraction.
- **Fix**: Extract Class, Introduce Parameter Object, Preserve Whole Object.
- **.NET variant**: A `readonly record struct` captures the clump with value equality
  and no allocation.

### Primitive Obsession
- **Heuristic**: Raw strings, numbers, and `Guid`s for domain concepts — money as bare
  `decimal`, an id as `string`, a status as `string` instead of an `enum`.
- **Why it matters**: No validation, no behavior, and nothing stops you passing an
  `orderId` where a `customerId` was expected — both are `string`.
- **Fix**: Replace Primitive with Object, Replace Type Code with Subclasses.
- **.NET variant**: A `readonly record struct` value object gives compile-time separation
  and a place to put the invariant.
  ```csharp
  // Smell
  public Order GetOrder(string customerId, decimal total)

  // Better
  public readonly record struct CustomerId(Guid Value);
  public readonly record struct Money(decimal Amount, string Currency);
  public Order GetOrder(CustomerId customerId, Money total)
  ```

---

## Change Preventers

Smells that make changes expensive — touching one thing forces changes elsewhere.

### Divergent Change
- **Heuristic**: One class changes for multiple unrelated reasons (e.g. it is edited both
  for EF Core mapping changes AND for API contract changes).
- **Why it matters**: Violates SRP. Merge conflicts, unclear ownership.
- **Fix**: Split Phase, Move Method, Extract Method, Extract Class.

### Shotgun Surgery
- **Heuristic**: A single logical change requires edits in 5+ files scattered across the
  solution — adding one field means touching the entity, the configuration, the DTO, the
  mapper, the validator, and the endpoint.
- **Why it matters**: High risk of missing a spot, expensive to change.
- **Fix**: Move Method, Move Field, Combine Methods into Class, Combine Methods into
  Transform, Inline Method, Inline Class.

---

## Dispensables

Code that could be removed to make the codebase cleaner.

### Duplicated Code
- **Heuristic**: Same or near-identical blocks in 2+ locations. Apply the Rule of Three —
  "The first time, just do it. The second time, wince. The third time, refactor."
- **Why it matters**: Bug fixes applied to one copy but not the others.
- **Fix**: Extract Method, Pull Up Method, Slide Statements, Form Template Method.
- **.NET variant**: Generics, `partial` classes, and extension methods hide duplication —
  the same algorithm under different type parameters still counts.

### Dead Code
- **Heuristic**: Unreachable code, unused fields, unused `using` directives, commented-out
  blocks, unused parameters.
- **Why it matters**: Adds noise and confuses readers.
- **Fix**: Remove Dead Code. Let the compiler help: `<TreatWarningsAsErrors>` plus
  analyzer rules IDE0051 (unused private member) and IDE0005 (unnecessary using).
- **Caution**: A C# member with no compile-time reference may still be live — resolved
  from the DI container, bound from configuration, serialized, reached from Razor/XAML
  markup, or invoked by reflection. Confirm before calling it dead.

### Speculative Generality
- **Heuristic**: Abstractions built for scenarios that never materialized — an interface
  with exactly one implementation and no test double, an abstract class with one subclass,
  a generic parameter only ever instantiated one way.
- **Why it matters**: Complexity without value. YAGNI.
- **Fix**: Collapse Hierarchy, Inline Method, Inline Class, Change Method Declaration,
  Remove Dead Code.
- **.NET caution**: `IFoo`/`Foo` pairs are the standard seam for DI and mocking; that is
  design, not speculation. The smell is the interface nobody injects or fakes.

### Lazy Element
- **Heuristic**: A method, class, or variable doing too little to justify itself — a
  wrapper that just forwards, a class with one property.
- **Why it matters**: Unnecessary indirection.
- **Fix**: Inline Method, Inline Class, Collapse Hierarchy.

### Comments as Deodorant
- **Heuristic**: Comments explaining *what* code does rather than *why*. If the code needs
  a comment to be understood, the code should be refactored.
- **Fowler**: "When you feel the need to write a comment, first try to refactor the code
  so that any comment becomes superfluous."
- **Fix**: Extract Method (name it what the comment says), Change Method Declaration,
  Introduce Assertion.
- **.NET variant**: XML doc comments restating the signature (`/// <summary>Gets the
  name.</summary>` over `Name`) are the same smell.

---

## Couplers

Smells related to excessive coupling between types.

### Feature Envy
- **Heuristic**: A method accesses another type's data or methods more than its own. It
  "envies" the other type's features.
- **Why it matters**: Logic is in the wrong place; changes to the envied type ripple.
- **Fix**: Move Method, Extract Method + Move.
- **Exception**: Strategy and Visitor intentionally separate behavior from data, and
  mappers legitimately read another type's surface.

### Insider Trading (Inappropriate Intimacy)
- **Heuristic**: Two types exchange data too freely; one reaches deep into the other's
  internals — or into `internal` members opened by `InternalsVisibleTo`.
- **Why it matters**: Changes to one type's internals break the other.
- **Fix**: Move Method, Move Field, Hide Delegate, Replace Subclass with Delegate.

### Message Chains
- **Heuristic**: Chains like `a.GetB().GetC().Name` or `order.Customer.Address.City` —
  the caller depends on the navigation structure between objects.
- **Why it matters**: Changes to any intermediate type break the chain; with EF Core it
  also hides lazy-loading round trips.
- **Fix**: Hide Delegate, Extract Method, Move Method.

### Middle Man
- **Heuristic**: >50% of a class's methods just delegate to another. Common in a `*Service`
  that only forwards to a repository.
- **Why it matters**: Indirection with no added value.
- **Fix**: Remove Middle Man, Inline Method, Replace Superclass with Delegate.

---

## Conditional Complexity

Smells related to complex branching logic.

### Nested Conditionals
- **Heuristic**: >2 levels of if/else nesting.
- **Fix**: Replace Nested Conditional with Guard Clauses (early returns).
  ```csharp
  // Smell
  if (user is not null)
      if (user.IsActive)
          if (user.HasPermission)
              DoThing();

  // Better
  if (user is null) return;
  if (!user.IsActive) return;
  if (!user.HasPermission) return;
  DoThing();
  ```

### Repeated Switches
- **Heuristic**: The same `switch` or if/else chain over the same type code or status
  appears in several places.
- **Fix**: Replace Conditional with Polymorphism — each variant gets its own type or
  strategy — or a `Dictionary<TKey, Func<...>>` map. A single `switch` expression
  centralizing the decision is fine; the smell is the *repetition*.
  ```csharp
  // Smell: the same switch on OrderStatus in four files
  // Better: a Dictionary<OrderStatus, IOrderHandler> resolved from DI
  ```

### Complex Boolean Expressions
- **Heuristic**: Boolean expressions with 3+ clauses, especially mixed `&&`/`||`/`!`
  without clear grouping.
- **Fix**: Consolidate Conditional Expression — extract to a named method or property.
  ```csharp
  // Smell
  if (age > 18 && hasLicense && !isSuspended && country == "BR")

  // Better
  if (applicant.CanDrive)
  ```

---

## DRY Violations

Patterns that violate "Don't Repeat Yourself."

### Magic Numbers and Strings
- **Heuristic**: Literal values used directly in logic without a named constant. The same
  literal appears in 2+ places.
- **Fix**: Extract Constant with a descriptive name, or reuse the framework's own
  constants instead of inventing your own.
  ```csharp
  // Smell
  if (retries > 3) ...
  httpClient.Timeout = TimeSpan.FromMilliseconds(30000);
  Request.Headers["Authorization"] = ...;

  // Better
  private const int MaxRetries = 3;
  private static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(30);
  Request.Headers[HeaderNames.Authorization] = ...;
  ```
- **.NET variant**: Repeated string keys for configuration sections, authorization policy
  names, claim types, and named `HttpClient` registrations are the most common instances.

### Copy-Paste Variations
- **Heuristic**: Blocks 80%+ identical with minor variations in values, member names, or
  types.
- **Fix**: Extract Method with parameters for the varying parts. If the variations are
  complex, use Combine Methods into Transform or the Strategy pattern. When only the type
  varies, a generic method replaces the copies.

### Repeated Parameter Groups
- **Heuristic**: The same set of 3+ parameters passed to multiple methods.
- **Fix**: Introduce Parameter Object (a `record`) or Combine Methods into Class.

---

## .NET-Specific Smells

### Anemic Domain Model
- **Heuristic**: Entities of auto-properties only, with every rule living in a `*Service`.
- **Why it matters**: Invariants have no home, so each caller re-checks them — or forgets to.
- **Fix**: Move Method onto the entity, Replace Primitive with Object, encapsulate
  collections behind read-only views.

### Blocking on Async
- **Heuristic**: `.Result`, `.Wait()`, `GetAwaiter().GetResult()`, or `async void` outside
  an event handler.
- **Why it matters**: Deadlock risk in contexts with a synchronization context, and with
  `async void` the exception cannot be observed at all.
- **Fix**: Make the call chain async to the entry point; return `Task` instead of `void`.

### Service Locator
- **Heuristic**: `IServiceProvider.GetService`/`GetRequiredService` inside business code
  where constructor injection belongs.
- **Why it matters**: Hides dependencies from the signature, so the compiler no longer
  tells you what a type needs.
- **Fix**: Inject Dependencies (see DIP in `solid-ddd-context.md`).

### Static Mutable State
- **Heuristic**: Static properties with setters, static collections, static caches without
  synchronization.
- **Why it matters**: Untestable, and unsafe under the concurrent requests every ASP.NET
  Core app serves.
- **Fix**: Encapsulate Variable, then move the state into a registered singleton with an
  explicit thread-safety contract.

### Exceptions as Control Flow
- **Heuristic**: `throw new Exception(...)` for expected outcomes; `catch { }` swallowing;
  `try`/`catch` steering normal branching.
- **Why it matters**: Expensive, and it hides the real failure from logs.
- **Fix**: Introduce Special Case, return a result type for expected outcomes, and reserve
  exceptions for the exceptional.

### Imperative Loops
- **Heuristic**: `for`/`foreach` loops doing `Select`, `Where`, or `Aggregate` work.
- **Fix**: Replace Loop with Pipeline (LINQ).
  ```csharp
  // Smell
  var results = new List<string>();
  foreach (var item in items)
      if (item.IsActive)
          results.Add(item.Name);

  // Better
  var results = items.Where(i => i.IsActive).Select(i => i.Name).ToList();
  ```
- **Caution**: On a hot path or over an `IQueryable` that would materialize the whole
  table, the loop may be the right call. Clarity first, but say so when performance is
  the reason to leave it.

### Boolean State Explosion
- **Heuristic**: Several `bool` fields representing mutually exclusive states
  (`IsLoading`, `IsError`, `IsSuccess`), so invalid combinations are representable.
- **Fix**: Replace Type Code with Subclasses, or model the states as a closed hierarchy
  and decide with a `switch` expression.
  ```csharp
  // Smell
  public bool IsLoading; public Exception? Error; public Data? Data;

  // Better
  public abstract record LoadState
  {
      public sealed record Loading : LoadState;
      public sealed record Success(Data Data) : LoadState;
      public sealed record Failure(Exception Error) : LoadState;
  }
  ```
