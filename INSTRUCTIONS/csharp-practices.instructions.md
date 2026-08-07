---
description: "Use when writing or reviewing C# async/await, pattern matching, performance, logging, CancellationToken, or type safety."
---

# Boas práticas de C#

- Prefira pattern matching, early returns, `is null`, `switch` expressions e coleções modernas (`[]`, `[..]`).
- Use não mais do que 3 níveis de aninhamento; extraia métodos ou use early returns/guard clauses para reduzir a complexidade.
- Prefira `record` para DTOs, propriedades `init` e membros `required` quando aplicável.
- Torne funções anônimas `static` sempre que possível.
- Compare strings sem distinção de maiúsculas com `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)`.
- Use `StringBuilder` para concatenações em loop ou grandes concatenações.
- Use logging estruturado.
- Nomeie métodos assíncronos com o sufixo `Async`.
- Use `.ConfigureAwait(false)` em métodos assíncronos, exceto em aplicações com contexto de sincronização de UI (Windows Forms, WPF e MAUI).
- Use `CancellationToken` em operações de longa duração.
- Não use `async`/`await` em métodos intermediários que apenas retornam uma única `Task`.
- Use `readonly`, `Span` e `Memory` quando trouxerem benefício claro e compatível com o contexto.
