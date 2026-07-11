---
applyTo: '**/*.cs'
---

# Padrões de estilo e formatação — Código C#

> Escreva sempre em português brasileiro: código, comentários e nomes de testes.

## 1. Prioridade máxima (regras não negociáveis)

- Uma classe por arquivo.
- Classes não herdáveis devem ser `sealed`.
- XMLDoc obrigatório em classes e métodos públicos; use `<inheritdoc />` em membros herdados.
- Execute `dotnet format` após cada alteração.
- DRY — evite repetição de código.

## 2. Formatação

- Indentação de 4 espaços.
- Omita chaves após `if`/`else` quando o corpo for uma linha única.
- Uma linha em branco entre blocos de código (métodos, propriedades, construtores).
- Uma linha em branco antes de `if`, `for`, `foreach` e `return`.
- Uma linha em branco logo após abrir e logo antes de fechar chaves.
- Em membros expression-bodied, quebre a linha antes de `=>`.
- Chamadas com mais de 4 argumentos: um argumento por linha, com o parêntese de abertura em nova linha após o nome do método. Aplique a mesma regra recursivamente a lambdas ou chamadas aninhadas.
- `using` sempre antes do namespace, em ordem alfabética.

## 3. Nomenclatura

- Constantes em `UPPER_CASE`.
- Use `var` quando o tipo for óbvio pelo contexto.
- Use `nameof` em vez de strings fixas para nomes de membros.

## 4. Boas práticas de C#

- Prefira coleções e inicializadores modernos (`[]`, `[..]`).
- Torne funções anônimas `static` sempre que possível.
- Compare strings sem distinção de maiúsculas com `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)`.
- Use `StringBuilder` para concatenações em loop ou concatenações grandes.
- Use `.ConfigureAwait(false)` em métodos assíncronos, exceto em aplicações Windows Forms.
- Use `CancellationToken` em operações de longa duração.

## 5. Testes (xUnit + Shouldly + NSubstitute)

- Classes de teste: `public sealed`, decoradas com `[ExcludeFromCodeCoverage]`.
- Siga o padrão AAA (Arrange, Act, Assert).
- Nomeie métodos como `Metodo_Condicao_ResultadoEsperado`.
- Declare dependências como campos `readonly`, inicializados inline.
- Nunca faça mock de classes não-virtuais; use uma instância real ou extraia uma interface.
- Evite reflection para acessar membros privados — teste pela API pública.
- Use raw strings para blocos multilinha e verbatim strings para caminhos de arquivo.
- Evite strings/números mágicos: declare-os como `const`, em `UPPER_CASE`.
- Não adicione usings desnecessários; prefira usings implícitos.

## 6. Manipulação e serialização de JSON

- Use JSON como formato para persistir configurações.
- Serialize e desserialize com `System.Text.Json`.
- Vincule propriedades de configuração à UI via data binding.
- Valide os dados de configuração antes de aplicá-los.
