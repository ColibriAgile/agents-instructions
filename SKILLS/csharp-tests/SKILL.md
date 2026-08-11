---
name: csharp-tests
description: "Use ao criar, revisar ou diagnosticar testes C# unitários ou de integração com xUnit, Shouldly e NSubstitute, incluindo casos AAA, mocks, fixtures, asserções e testes PostgreSQL e SQLServer."
argument-hint: "Descreva o teste C# a criar, revisar ou corrigir"
---

# Testes C# com xUnit

## Quando usar

- Criar ou alterar testes unitários e de integração em C#.
- Revisar cobertura, isolamento, nomenclatura ou legibilidade de testes.
- Diagnosticar falhas envolvendo mocks, fixtures, dados de teste ou asserções.
- Validar testes que dependem de PostgreSQL.

## Preparacao

1. Identifique o comportamento público que precisa ser coberto e leia os testes relacionados antes de editar.
2. Reutilize o padrão de projeto existente para fixtures, builders, constantes e configuração.

## Estrutura do teste

- O arquivo de teste deve ter o mesmo nome da classe de testes.
- A classe de teste deve terminar obrigatoriamente com o sufixo `Testes`.
- Organize cada teste em AAA: Arrange, Act e Assert, separando com comentários cada etapa.
- Nomeie o teste como `Metodo_Condicao_ResultadoEsperado`.
- Mantenha a classe de teste `public sealed` e aplique `[ExcludeFromCodeCoverage]` quando esse for o padrão do projeto.
- Declare dependências como campos `readonly`, inicializados inline quando isso não prejudicar o isolamento.
- Extraia strings e números reutilizados para constantes em `UPPER_CASE`.
- Use raw strings para conteúdo multilinha e strings verbatim para caminhos.

## Dependencias e isolamento

- Teste pela API pública e evite reflection para acessar membros privados.
- Use NSubstitute somente para interfaces ou classes virtuais.
- Para classes não virtuais, use uma instância real ou extraia uma interface.
- Mantenha mocks somente para dependências externas necessárias.
- Para logs, use FakeLogger do namespace `Microsoft.Extensions.Logging.Abstractions.Testing`
- NÃO extenda classes concretas como `DbConnection` ou `DbCommand` para criar mocks, use uma instância real de `NpgsqlConnection` ou `SqlConnection` com banco de dados de teste.

## Validacao

1. Antes de executar qualquer `dotnet test` ou `dotnet build`, use obrigatoriamente a skill `dotnet-efficient-validation`.
2. Execute primeiro o teste mais específico.
3. Depois, execute o conjunto relacionado afetado pela mudança.
4. Após um build válido, use `--no-build --no-restore --nologo --logger "console;verbosity=minimal"`.

## PostgreSQL

Para testes ou builds dependentes de PostgreSQL, use também a skill `pgsql-test-runner`. Ela define as variáveis de ambiente esperadas, o serviço local e a ordem de investigação para distinguir drift de ambiente de regressão de código.

## Critérios de conclusão

- O teste verifica comportamento observável, não implementação privada.
- O cenário e o resultado esperado estão explícitos no nome e nas asserções.
- O teste permanece isolado e não depende de ordem de execução.
- Mocks representam somente dependências externas necessárias.
- O teste específico e a suíte relacionada passam, ou a falha está documentada com causa conhecida.
