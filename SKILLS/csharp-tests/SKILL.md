---
name: csharp-tests
description: "Testes C# com xUnit, Shouldly e NSubstitute calibrados por criticidade, com critério explícito de quantos testes uma unidade merece e quando parar. Use sempre que for criar, revisar, reduzir ou diagnosticar testes unitários ou de integração em C#, decidir entre unitário e integração, caçar testes redundantes ou que passam sem verificar nada, limpar classes de teste infladas, migrar para xUnit v3/Microsoft.Testing.Platform, ou rodar mutation testing com Stryker.NET. Use mesmo quando o pedido for só 'adicione testes para X': a skill decide quantos. Não use para preparar o ambiente PostgreSQL (use pgsql-test-runner) nem para executar dotnet build ou dotnet test (use dotnet-efficient-validation)."
argument-hint: "Descreva o teste C# a criar, revisar, reduzir ou corrigir"
---

# Testes C# com xUnit

Um teste só vale o que custa se existe uma mudança plausível na implementação que o deixa vermelho. Tudo nesta skill deriva disso: escrever o teste que mata um mutante, não escrever o que não mata nenhum, e apagar o que mata só mutantes que outro teste já mata. O resultado esperado é uma suíte pequena que ninguém consegue enganar, não uma suíte grande que parece cobrir tudo.

## 1. Triagem

Classifique a unidade antes de escrever a primeira linha. O nível define o esforço e o teto: teste parrudo em código trivial é desperdício, teste mediano em código crítico é risco.

| Nível | A unidade… | Teto de testes | Esforço |
| --- | --- | --- | --- |
| **Crítico** | mexe com dinheiro, fiscal, persistência, segurança, permissão, concorrência ou aritmética de data; tem 3+ branches; ou já quebrou em produção | sem teto numérico, mas cada teste justificado por um mutante próprio | `[Theory]` nas fronteiras + caminhos de erro + Stryker no escopo dela |
| **Comum** | resto da lógica de negócio | **2** (caminho feliz + o erro mais provável) | um terceiro teste só com mutante nomeado que os dois primeiros não matam |
| **Cola** | controller, handler, endpoint, repositório, orquestração que só delega | **0 unitários** | coberto por teste de integração (seção 2) |
| **Trivial** | DTO, POCO, record, mapeamento 1:1, wrapper sem decisão, propriedade auto-implementada | **0** | nenhum |

Declare o nível escolhido em uma frase na resposta, não em comentário no código. Se a unidade mistura níveis (um service com uma regra crítica e três métodos de delegação), classifique por método.

## 2. Unitário ou integração

A regra: **lógica recebe teste unitário; cola recebe teste de integração.** Não escreva os dois para a mesma coisa.

- Tem decisão própria (cálculo, validação, máquina de estado, parsing, regra com branches) → unitário, rápido, sem infraestrutura.
- Só conecta peças (recebe request, chama service, devolve response; monta query e executa; publica evento) → integração pela borda real (HTTP via `WebApplicationFactory`, banco de teste real). Um unitário de cola com quatro `Substitute.For` testa a configuração dos mocks, não o sistema.
- Se a unidade é cola mas contém uma decisão (um `if` de autorização no controller, uma ordenação no repositório), extraia a decisão ou teste só ela unitariamente; o resto continua integração.

Teste de integração também obedece ao teto e ao plano abaixo. Um por fluxo de negócio, não um por endpoint.

## 3. Plano antes do código

Antes de escrever qualquer teste, liste em uma tabela curta na resposta:

| Comportamento | Mutante que o quebraria | Teste |
| --- | --- | --- |
| Desconto acima de 100% é rejeitado | `>` → `>=` em `percentual > 100` | `Aplicar_PercentualAcimaDeCem_LancaExcecao` |

Regras do plano:

- Uma linha por **comportamento observável**, não por método, branch ou linha de código. Dois métodos públicos que produzem o mesmo efeito observável compartilham uma linha.
- A coluna do mutante é obrigatória. Se não consegue nomear a mudança de implementação que o teste pegaria, o comportamento não precisa de teste.
- Duas linhas com o mesmo mutante são uma linha. Funda.
- Nenhum teste é escrito fora do plano. Se durante a escrita surgir a tentação de "só mais um", volte ao plano e justifique a linha nova pelo mutante.

O plano custa cinco linhas de resposta e é o que impede a classe de teste de crescer por inércia.

## 4. Critério de parada

Pare de escrever quando todo mutante plausível do catálogo (seção 5) para aquela unidade já tem um teste que o mata. Depois disso, cada teste adicional é custo sem retorno: mais tempo de build, mais manutenção a cada refatoração, mais ruído no diff.

Teste candidato novo passa por uma pergunta: **qual mutante ele mata que nenhum teste existente mata?** Sem resposta, não escreva. Isso vale com força dobrada para `[InlineData]`: três valores (um de cada lado da fronteira e um no meio) matam a família inteira de mutantes de comparação; o quarto em diante só repete.

Ao tocar numa classe de teste existente, aplique a mesma pergunta ao que já está lá. Teste que não mata mutante exclusivo é apagado na mesma mudança, com uma frase na resposta dizendo qual teste o tornava redundante. Suíte inflada por IA é limpa assim: um arquivo por vez, sempre que o arquivo for tocado por outro motivo.

## 5. O mutante

Depois de escrever cada teste, aplique o mutante mentalmente: altere a implementação de um jeito plausível e pergunte se **este** teste ficaria vermelho. Mutante que sobrevive é caso faltando; teste que não mata nenhum é teste a apagar.

Catálogo de mutantes que importam em C#:

- Fronteira: `>` ↔ `>=`, `<` ↔ `<=`
- Booleano: `&&` ↔ `||`, `if (x)` ↔ `if (!x)`
- Retorno: `return valor` → `return null`, `default` ou `0`
- Literal: `0` ↔ `1`, `""` ↔ `"x"`, coleção vazia ↔ com item
- Chamada removida: apagar a linha de efeito colateral (`Save`, `Publish`, `Commit`)

`[Theory]` com `[InlineData]` nos dois lados de cada fronteira mata a família inteira de mutantes de comparação com um teste só; é a técnica mais barata por mutante morto.

## 6. Testes que não matam mutante nenhum

Cada padrão abaixo passa verde contra qualquer implementação; substitua pela forma à direita ou apague.

- `ShouldNotBeNull()` ou `ShouldNotThrow()` como única asserção → asserte o valor que a regra produz.
- `Received().Metodo(Arg.Any<T>())` → asserte o argumento: `Received().Save(Arg.Is<Pedido>(p => p.Total == TOTAL_ESPERADO))`.
- Asserção que recalcula a fórmula da implementação → compare com literal esperado.
- Teste sem `Assert` que só confirma ausência de exceção → asserte o estado ou o efeito resultante.
- `Received()` como asserção principal quando o contrato é o valor retornado → asserte o retorno; verifique interação só quando o efeito colateral **é** o contrato.
- Teste de construtor, getter, setter ou `ToString` gerado → apague; é nível Trivial.
- Teste que verifica que o mock devolveu o que foi configurado para devolver → apague; testa o NSubstitute.

## 7. Estrutura do teste

- O arquivo de teste tem o mesmo nome da classe de testes, e a classe termina com o sufixo `Testes`.
- Organize cada teste em AAA: Arrange, Act e Assert, separando cada etapa com comentário.
- Nomeie o teste como `Metodo_Condicao_ResultadoEsperado`.
- Mantenha a classe `public sealed` e aplique `[ExcludeFromCodeCoverage]` quando esse for o padrão do projeto.
- Reutilize o padrão existente do projeto para fixtures, builders, constantes e configuração. Leia as classes de teste vizinhas antes de criar a sua.
- Declare dependências como campos `readonly`, inicializados inline quando isso não prejudicar o isolamento.
- Extraia strings e números reutilizados para constantes em `UPPER_CASE`.
- Use raw strings para conteúdo multilinha e strings verbatim para caminhos.

## 8. Dependências e isolamento

- Teste pela API pública; o mutante que sobrevive a um teste de membro privado é sinal de que falta cobrir o comportamento observável.
- Use NSubstitute somente para interfaces ou classes virtuais, e apenas para dependências externas que o teste não consegue instanciar de verdade. Se a classe precisa de mais de dois mocks para ser testada, ela provavelmente é cola (seção 2).
- Para classes não virtuais, use uma instância real ou extraia uma interface.
- Para logs, use `FakeLogger` do namespace `Microsoft.Extensions.Logging.Abstractions.Testing`.
- Para `DbConnection` e `DbCommand`, use instância real de `NpgsqlConnection` ou `SqlConnection` contra banco de teste; herdar dessas classes concretas para mockar produz teste que não mata mutante de SQL.

## 9. Runner, validação e Stryker

- Antes de tocar num projeto de teste, identifique o runner pelo `.csproj` e leia `references/runner-mtp.md`: as regras de `async void`, `ITestOutputHelper`, `IAsyncLifetime` e cobertura mudam entre VSTest e Microsoft.Testing.Platform.
- Antes de qualquer `dotnet test` ou `dotnet build`, use a skill `dotnet-efficient-validation`. Execute primeiro o teste mais específico, depois o conjunto relacionado. Os argumentos de execução por runner estão em `references/runner-mtp.md`.
- Para testes ou builds dependentes de PostgreSQL, use a skill `pgsql-test-runner`.
- Em unidade **Crítica**, rode mutation testing no escopo dela seguindo `references/stryker.md`. Mutante sobrevivente vira linha nova no plano e teste novo, não `// Stryker disable`.

## Critérios de conclusão

- O nível de criticidade está declarado e o número de testes respeita o teto do nível.
- A decisão unitário vs integração foi tomada pela regra lógica/cola, e nenhuma cola recebeu teste unitário com mocks.
- O plano (comportamento → mutante → teste) apareceu na resposta antes do código, e nenhum teste escrito está fora dele.
- Cada teste mata pelo menos um mutante que nenhum outro teste da classe mata.
- Testes pré-existentes redundantes na classe tocada foram apagados, com a justificativa na resposta.
- Nenhum teste se enquadra nos padrões da seção 6.
- O runner foi identificado pelo `.csproj` e as regras de `references/runner-mtp.md` foram respeitadas.
- Em unidade crítica, o Stryker rodou no escopo dela e todo mutante sobrevivente virou teste ou tem justificativa escrita.
- O teste específico e a suíte relacionada passam, ou a falha está documentada com causa conhecida.
