---
applyTo: '**/*.cs'
---

# Índice de instruções para C#

As regras de C# estão separadas por responsabilidade para evitar duplicação e facilitar a aplicação seletiva:

- [Regras fundamentais](csharp-core.instructions.md): idioma, coesão, documentação pública e regras estruturais.
- [Estilo e formatação](csharp-style.instructions.md): layout, nomenclatura e organização do código.
- [Boas práticas](csharp-practices.instructions.md): recursos modernos, assíncrono, desempenho e segurança de tipos.
- [JSON](csharp-json.instructions.md): persistência, serialização e validação de configurações.

Para criação, revisão ou diagnóstico de testes C#, use a skill `csharp-tests`. Para testes PostgreSQL, use também a skill `pgsql-test-runner`.

Para qualquer build, teste, publish ou execução de projeto .NET, use obrigatoriamente a skill `dotnet-efficient-validation` antes de executar comandos. Para buscas, grep ou inspeção de diff no repositório, use obrigatoriamente `repository-cli-efficiency`.

Use o arquivo temático correspondente ao contexto da tarefa. O agente .NET deve referenciar estas instruções e skills em vez de copiar suas regras.
