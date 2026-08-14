---
name: csharp-tests
description: "Testes C# com xUnit, Shouldly e NSubstitute calibrados por criticidade. Use ao criar, revisar ou diagnosticar testes unitários e de integração, ao decidir quanto teste uma unidade merece, ao caçar testes que passam sem verificar nada, ou ao rodar mutation testing com Stryker.NET. Não use para preparar o ambiente PostgreSQL (use pgsql-test-runner) nem para executar dotnet build ou dotnet test (use dotnet-efficient-validation)."
argument-hint: "Descreva o teste C# a criar, revisar ou corrigir"
---

# Testes C# com xUnit

## Triagem

Classifique a unidade antes de escrever a primeira linha de teste. O nível define o esforço: teste parrudo em código trivial é desperdício, teste mediano em código crítico é risco.

| Nível | A unidade… | Esforço |
| --- | --- | --- |
| **Crítico** | mexe com dinheiro, fiscal, persistência, segurança, permissão, concorrência ou aritmética de data; tem 3+ branches; ou já quebrou em produção | `[Theory]` nas fronteiras + caminhos de erro + Stryker no escopo dela |
| **Comum** | resto da lógica de negócio | caminho feliz + o erro mais provável, ambos com asserção de resultado |
| **Trivial** | DTO, POCO, mapeamento 1:1, wrapper sem decisão | sem teste |

Declare o nível escolhido em uma frase na resposta, não em comentário no código.

## O mutante

Depois de escrever cada teste — em qualquer nível — aplique o mutante mentalmente: altere a implementação de um jeito plausível e pergunte se **este** teste ficaria vermelho. Mutante que sobrevive é caso faltando.

Catálogo de mutantes que importam em C#:

- Fronteira: `>` ↔ `>=`, `<` ↔ `<=`
- Booleano: `&&` ↔ `||`, `if (x)` ↔ `if (!x)`
- Retorno: `return valor` → `return null`, `default` ou `0`
- Literal: `0` ↔ `1`, `""` ↔ `"x"`, coleção vazia ↔ com item
- Chamada removida: apagar a linha de efeito colateral (`Save`, `Publish`, `Commit`)

`[Theory]` com `[InlineData]` nos dois lados de cada fronteira mata a família inteira de mutantes de comparação com um teste só — é a técnica mais barata por mutante morto.

## Testes que não matam mutante nenhum

Cada padrão abaixo passa verde contra qualquer implementação; substitua pela forma à direita.

- `ShouldNotBeNull()` ou `ShouldNotThrow()` como única asserção → asserte o valor que a regra produz.
- `Received().Metodo(Arg.Any<T>())` → asserte o argumento: `Received().Save(Arg.Is<Pedido>(p => p.Total == TOTAL_ESPERADO))`.
- Asserção que recalcula a fórmula da implementação → compare com literal esperado.
- Teste sem `Assert` que só confirma ausência de exceção → asserte o estado ou o efeito resultante.
- `Received()` como asserção principal quando o contrato é o valor retornado → asserte o retorno; verifique interação só quando o efeito colateral **é** o contrato.

## Stryker no nível crítico

Instale uma vez: `dotnet tool install -g dotnet-stryker`. Execute a partir da pasta do projeto de teste:

```
dotnet stryker -m "**/Dominio/Precificacao/**" --break-at 80
```

- Restrinja com `-m` ao escopo crítico, ou use `--since:master` para mutar só o que mudou. Rodar na solução inteira é o que torna mutation testing caro.
- Rode sob demanda ou em job noturno, não no CI de cada PR.
- Mutante sobrevivente vira teste novo, não `// Stryker disable`.

## Estrutura do teste

- O arquivo de teste tem o mesmo nome da classe de testes, e a classe termina com o sufixo `Testes`.
- Organize cada teste em AAA: Arrange, Act e Assert, separando cada etapa com comentário.
- Nomeie o teste como `Metodo_Condicao_ResultadoEsperado`.
- Mantenha a classe `public sealed` e aplique `[ExcludeFromCodeCoverage]` quando esse for o padrão do projeto.
- Reutilize o padrão existente do projeto para fixtures, builders, constantes e configuração.
- Declare dependências como campos `readonly`, inicializados inline quando isso não prejudicar o isolamento.
- Extraia strings e números reutilizados para constantes em `UPPER_CASE`.
- Use raw strings para conteúdo multilinha e strings verbatim para caminhos.

## Dependências e isolamento

- Teste pela API pública; o mutante que sobrevive a um teste de membro privado é sinal de que falta cobrir o comportamento observável.
- Use NSubstitute somente para interfaces ou classes virtuais, e apenas para dependências externas necessárias.
- Para classes não virtuais, use uma instância real ou extraia uma interface.
- Para logs, use `FakeLogger` do namespace `Microsoft.Extensions.Logging.Abstractions.Testing`.
- Para `DbConnection` e `DbCommand`, use instância real de `NpgsqlConnection` ou `SqlConnection` contra banco de teste — herdar dessas classes concretas para mockar produz teste que não mata mutante de SQL.

## Validação

1. Antes de qualquer `dotnet test` ou `dotnet build`, use a skill `dotnet-efficient-validation`.
2. Execute primeiro o teste mais específico, depois o conjunto relacionado afetado pela mudança.
3. Após um build válido, use `--no-build --no-restore --nologo --logger "console;verbosity=minimal"`.
4. Para testes ou builds dependentes de PostgreSQL, use a skill `pgsql-test-runner`: ela define variáveis de ambiente, serviço local e a ordem de investigação que separa drift de ambiente de regressão de código.

## Critérios de conclusão

- O nível de criticidade está declarado e o esforço aplicado corresponde a ele.
- Cada teste escrito falha sob pelo menos um mutante plausível do catálogo, verificado mentalmente.
- Nenhum teste da mudança se enquadra nos padrões de "testes que não matam mutante nenhum".
- Em unidade crítica, o Stryker rodou no escopo dela e todo mutante sobrevivente virou teste ou tem justificativa escrita.
- O teste específico e a suíte relacionada passam, ou a falha está documentada com causa conhecida.
