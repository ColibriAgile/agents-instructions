---
name: csharp-tests
description: "Criar, revisar ou diagnosticar testes C# com xUnit, Shouldly e NSubstitute. Use ao trabalhar em arquivos de teste, definir casos AAA, configurar mocks, investigar falhas ou validar testes PostgreSQL."
argument-hint: "Descreva o teste C# a criar, revisar ou corrigir"
---

# Testes C# com xUnit

## Quando usar

- Criar ou alterar testes unitários e de integração em C#.
- Revisar cobertura, isolamento, nomenclatura ou legibilidade de testes.
- Diagnosticar falhas envolvendo mocks, fixtures, dados de teste ou asserções.
- Validar testes que dependem de PostgreSQL.

## Procedimento

1. Identifique o comportamento público que precisa ser coberto e leia os testes relacionados antes de editar.
2. Reutilize o padrão de projeto existente para fixtures, builders, constantes e configuração.
3. Organize cada teste em AAA: Arrange, Act e Assert.
4. Nomeie o teste como `Metodo_Condicao_ResultadoEsperado`.
5. Mantenha a classe de teste `public sealed` e aplique `[ExcludeFromCodeCoverage]` quando esse for o padrão do projeto.
6. Declare dependências como campos `readonly`, inicializados inline quando isso não prejudicar o isolamento.
7. Use NSubstitute somente para interfaces ou classes virtuais; use uma instância real ou extraia uma interface para classes não virtuais.
8. Teste pela API pública e evite reflection para acessar membros privados.
9. Extraia strings e números reutilizados para constantes em `UPPER_CASE`; use raw strings para conteúdo multilinha e strings verbatim para caminhos.
10. Execute primeiro o teste mais específico e, depois, o conjunto relacionado afetado pela mudança.

## PostgreSQL

Para testes ou builds dependentes de PostgreSQL, use também a skill `pgsql-test-runner`. Ela define as variáveis de ambiente esperadas, o serviço local e a ordem de investigação para distinguir drift de ambiente de regressão de código.

## Critérios de conclusão

- O teste verifica comportamento observável, não implementação privada.
- O cenário e o resultado esperado estão explícitos no nome e nas asserções.
- O teste permanece isolado e não depende de ordem de execução.
- Mocks representam somente dependências externas necessárias.
- O teste específico e a suíte relacionada passam, ou a falha está documentada com causa conhecida.

## Créditos

- [xUnit](https://xunit.net/)
- [Shouldly](https://shouldly.readthedocs.io/)
- [NSubstitute](https://nsubstitute.github.io/)
