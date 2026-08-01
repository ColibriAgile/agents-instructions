---
applyTo: '**/*.cs'
---

# Estilo e formatação de C#

- Use indentação de 4 espaços.
- Coloque `using` antes do namespace, em ordem alfabética, e prefira namespaces file-scoped.
- Não use `#region`.
- Omita chaves em `if`/`else` quando o corpo tiver uma única linha.
- Separe métodos, propriedades e construtores com uma linha em branco.
- Use uma linha em branco antes de `if`, `for`, `foreach` e `return`.
- Use uma linha em branco logo após abrir e logo antes de fechar blocos.
- Em membros expression-bodied, quebre a linha antes de `=>`.
- Use `var` quando o tipo for óbvio pelo contexto.
- Declare constantes em `UPPER_CASE`.
- Use `nameof` em vez de strings fixas para nomes de membros.
- Em chamadas com quatro ou mais argumentos, coloque cada argumento em sua própria linha:

  ```csharp
  MyMethod
  (
      arg1,
      arg2,
      arg3,
      arg4
  );
  ```
