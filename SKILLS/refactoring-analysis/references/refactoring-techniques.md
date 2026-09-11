# Refactoring Techniques Catalog — .NET / C#

Complete catalog of refactoring techniques from Martin Fowler's "Refactoring" (2nd Edition),
organized by chapter and category. Use this as a reference when mapping smells to fixes.

Fowler's 2nd edition names the core move *Extract Function*; in C# it is *Extract Method*, the
name the language, the IDEs, and the first edition all use. This catalog uses the C# names —
Extract Method, Move Method, Inline Method — so a finding's technique matches the refactoring
the reader will actually invoke.

---

## Quick Reference: Smell → Technique

| Smell | Primary Technique(s) |
|-------|---------------------|
| Long Method | Extract Method, Decompose Conditional, Split Loop |
| Duplicated Code | Extract Method, Pull Up Method, Slide Statements |
| Long Parameter List | Introduce Parameter Object, Preserve Whole Object, Remove Flag Argument |
| Feature Envy | Move Method, Extract Method + Move |
| Data Clumps | Extract Class, Introduce Parameter Object |
| Primitive Obsession | Replace Primitive with Object, Replace Type Code with Subclasses |
| Large Class/Project | Extract Class, Extract Superclass, Split Phase |
| Repeated Switches | Replace Conditional with Polymorphism, Dictionary map |
| Message Chains | Hide Delegate, Extract Method |
| Nested Conditionals | Replace Nested Conditional with Guard Clauses |
| Dead Code | Remove Dead Code |
| Magic Numbers | Extract Constant |
| Static Mutable State | Encapsulate Variable, Split Variable |
| Imperative Loops | Replace Loop with Pipeline (LINQ) |
| Middle Man | Remove Middle Man, Inline Method |
| Shotgun Surgery | Move Method, Move Field, Combine Methods into Class |
| Divergent Change | Extract Class, Split Phase |
| Speculative Generality | Inline Method, Collapse Hierarchy, Remove Dead Code |
| Comments as Deodorant | Extract Method (name = comment), Rename Variable |
| Temporary Field | Extract Class, Introduce Special Case |
| Anemic Domain Model | Move Method (onto the entity), Replace Primitive with Object |
| Blocking on Async | Change Method Declaration (async all the way) |
| Service Locator | Inject Dependencies, Extract Interface |
| Exceptions as Control Flow | Introduce Special Case, Separate Query from Modifier |
| Boolean State Explosion | Replace Type Code with Subclasses |

---

## A First Set of Refactorings

### Extract Method
The most common refactoring. Pull a code fragment into its own method named after what it
does. Even 2-3 lines benefit if naming adds clarity.
- **When**: Code needs a comment to explain, or logic sits at a different abstraction level
  than the code around it.
- **Reverse**: Inline Method.

### Inline Method
Remove a method and put its body back into callers.
- **When**: The body is as clear as the name, or the indirection is excessive.

### Extract Variable
Give a complex expression a self-describing name — often a `private` computed property in C#.
- **When**: An expression is hard to understand at a glance.
- **Reverse**: Inline Variable.

### Change Method Declaration
Rename a method, add or remove parameters, or change parameter types.
- **When**: A name doesn't communicate intent, or the parameter list needs adjustment.
- **.NET**: Also the move that takes a blocking call async — returning `Task<T>`, accepting a
  `CancellationToken`, and adding the `Async` suffix.

### Encapsulate Variable
Wrap data access behind a property or accessor methods.
- **When**: Widely accessed mutable data needs controlled access.
- **.NET**: Expose `IReadOnlyList<T>` over a private `List<T>` rather than the list itself.

### Introduce Parameter Object
Group recurring parameter clusters into a single object.
- **When**: The same 3+ parameters appear together in multiple signatures.
- **.NET**: A `record` gives the object value equality and deconstruction for free.

### Combine Methods into Class
Group methods operating on the same data into a class.
- **When**: Several methods pass the same data between each other.

### Combine Methods into Transform
Gather derived-data calculations into a single transform.
- **When**: Multiple places compute derived values from the same source data.

### Split Phase
Separate code into phases with distinct responsibilities, connected by a data structure
passed between them.
- **When**: Code does two different things — e.g. parsing then calculating.

---

## Encapsulation

### Encapsulate Record
Replace anonymous or loosely-typed data with a type that controls access.
- **When**: A data structure is widely used and changes need tracking.
- **.NET**: `Dictionary<string, object>` payloads and `dynamic` are the usual starting point.

### Encapsulate Collection
Return copies or read-only views instead of raw collections.
- **When**: An internal collection can be mutated by external code.
- **.NET**: `IReadOnlyCollection<T>`, `ImmutableArray<T>`, or `.AsReadOnly()`.

### Replace Primitive with Object
Wrap a primitive in a domain-specific type.
- **When**: A primitive carries domain meaning (money, email, phone, id).
- **.NET**: A `readonly record struct` gives value semantics with no heap allocation, and a
  place to enforce the invariant in the constructor.

### Replace Temp with Query
Convert a temporary variable into a method or computed property.
- **When**: A temp is computed once and used in several places.

### Extract Class
Split a class with multiple responsibilities into two.
- **When**: A subset of fields and methods form a coherent group.

### Hide Delegate
Add wrapper members so clients stop navigating through an object chain.
- **When**: Client code uses `order.Customer.Address.City` chains.
- **Reverse**: Remove Middle Man.

### Substitute Algorithm
Replace a method body with a clearer algorithm.
- **When**: There's a simpler way to do the same thing.

---

## Moving Features

### Move Method / Move Field
Move a member to the type that uses it most.
- **When**: A method accesses more data from another type than its own.
- **The bread and butter of refactoring** — Fowler.

### Move Statements into Method
Merge duplicated setup or teardown into the called method.
- **When**: The same statements always precede or follow a call.

### Replace Inline Code with Method Call
Replace code with a call to something that already does the same job.
- **When**: Code duplicates a BCL or library method — `string.IsNullOrWhiteSpace`,
  `Enumerable.Chunk`, `TimeSpan.FromSeconds`.

### Slide Statements
Move related lines together.
- **When**: Related declarations or logic are scattered within a method.

### Split Loop
Separate a loop that does two things into two loops.
- **When**: A loop computes two unrelated things in one pass. Clarity > micro-optimization.

### Replace Loop with Pipeline
Replace imperative loops with LINQ — `Select`, `Where`, `Aggregate`, `SelectMany`.
- **When**: A loop initializes a result, iterates, and conditionally adds to the result.
- **Caution**: On a hot path, or over an `IQueryable` where the rewrite would materialize the
  whole table, keep the loop and say why.

### Remove Dead Code
Delete unreachable or unused code.
- **When**: Code is never called. Version control remembers it if needed.
- **.NET caution**: Confirm the member isn't resolved from DI, bound from configuration,
  serialized, reached from markup, or invoked by reflection before deleting.

---

## Simplifying Conditional Logic

### Decompose Conditional
Extract the condition and each branch into named members.
- **When**: A conditional block is complex enough to need comments.
```csharp
// Before
if (date < SummerStart || date > SummerEnd)
    charge = quantity * winterRate + winterServiceCharge;
else
    charge = quantity * summerRate;

// After
charge = IsSummer(date) ? SummerCharge(quantity) : WinterCharge(quantity);
```

### Consolidate Conditional Expression
Combine related conditions into a single named check.
- **When**: Multiple conditions yield the same result.

### Replace Nested Conditional with Guard Clauses
Use early returns for edge cases, keeping the happy path un-nested.
- **When**: >2 levels of if/else nesting.
- **Key insight**: Two flavors — (1) both branches equally likely: use if/else;
  (2) one is the "normal" path: use guard clauses.
- **.NET**: `ArgumentNullException.ThrowIfNull(x)` and `ArgumentException.ThrowIfNullOrEmpty(s)`
  collapse the most common guards to one line.

### Replace Conditional with Polymorphism
Replace switch/if chains with subclass or strategy overrides.
- **When**: The same conditional appears in multiple places.
- **Modern alternative**: A dictionary of handlers resolved from DI.
```csharp
// Before: the same switch on OrderStatus in four files
// After
private readonly IReadOnlyDictionary<OrderStatus, IOrderHandler> _handlers;
await _handlers[order.Status].HandleAsync(order, cancellationToken);
```
- **Note**: A single `switch` expression that centralizes the decision in one place is a
  legitimate destination too — the smell is repetition, not `switch`.

### Introduce Special Case (Null Object)
Replace scattered null checks with a Special Case object.
- **When**: Many places check for the same special value.
- **.NET**: Often the better move is enabling nullable reference types so the compiler finds
  the checks that are actually needed.

### Introduce Assertion
Make implicit assumptions explicit.
- **When**: Code assumes a condition but doesn't verify it.
- **.NET**: `Debug.Assert` for development invariants; a guard clause that throws for
  contracts callers can violate.

---

## Refactoring APIs

### Separate Query from Modifier
A method should either return a value OR have side effects — not both.
- **When**: A method both mutates state and returns a value.

### Remove Flag Argument
Replace boolean parameters with separate explicit methods.
- **When**: A method takes a `bool` that changes its behavior.
```csharp
// Smell
SetDimension(name, value, isMetric);

// Better
SetMetricDimension(name, value);
SetImperialDimension(name, value);
```

### Preserve Whole Object
Pass the whole object instead of pulling several values out of it.
- **When**: Multiple values from one object are passed as separate parameters.

### Replace Constructor with Factory Method
Use a factory when construction needs flexibility or a name.
- **When**: Constructor limitations (naming, failure modes, return type) get in the way.
- **.NET**: A static `Create` returning a result type expresses "construction can fail"
  without throwing from a constructor.

---

## Dealing with Inheritance

### Pull Up Method / Pull Up Field
Move a shared member from subclasses to the base class.
- **When**: Multiple subclasses have the same member.

### Push Down Method / Push Down Field
Move a member from the base class to the one subclass that uses it.
- **When**: Only one subclass uses it.

### Replace Subclass with Delegate
Use composition instead of inheritance for variation.
- **When**: Subclassing creates coupling or the "is-a" relationship doesn't hold.
- **Modern preference**: Favor composition over inheritance.

### Replace Superclass with Delegate
Replace inheritance with delegation.
- **When**: The "is-a" relationship is wrong (e.g. `Stack` extends `List`).

### Collapse Hierarchy
Merge a base class and subclass that are too similar.
- **When**: A subclass adds no meaningful behavior.
- **.NET**: Also applies to the `IFoo`/`Foo` pair with one implementation that nothing fakes.

---

## When to Refactor (Fowler's Workflows)

### Preparatory Refactoring
"Make the change easy, then make the easy change." Restructure before adding a feature.

### Comprehension Refactoring
When reading code, refactor to make the understanding explicit.

### Litter-Pickup Refactoring
"Always leave the code better than you found it." (Boy Scout Rule)

### The Rule of Three
First time: just do it. Second time: wince. Third time: refactor.

### Long-Term Refactoring
Large changes spanning weeks. Use Branch by Abstraction to keep the system working.

### Fowler's Core Position
"Refactoring is not an activity you set aside time to do. Refactoring is something you do all
the time in little bursts."
