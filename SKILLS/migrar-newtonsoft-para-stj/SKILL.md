---
name: migrar-newtonsoft-para-stj
description: "Newtonsoft.Json para System.Text.Json no .NET 10/11: migra um projeto C#, ou audita e corrige um projeto já migrado, com matriz de incompatibilidades provada por execução, script de detecção, converters de leitura tolerante e os testes que detectam a falha antes da produção. Use sempre que o usuário pedir para trocar, remover ou migrar o Newtonsoft (Json.NET, JObject, JToken, JsonConvert, JsonProperty) para o System.Text.Json (STJ, JsonNode), ou quando um projeto migrado lançar JsonException 'could not be converted', NotSupportedException 'JsonTypeInfo metadata', erro em GetValue, 'The node already has a parent', erro de GUID com chaves, de data vazia ou de número em texto, ou quando um campo chegar null, vazio ou com outro nome depois da migração. Use também para revisar um PR dessa migração. Não use para atualizar pacotes NuGet (use atualizar-pacotes-nuget) nem para criar um contrato JSON novo sem relação com o Newtonsoft."
---

# Migrar Newtonsoft.Json para System.Text.Json

O System.Text.Json (STJ) é estrito. O Newtonsoft convertia muitos valores sem configuração: `""` para `null`, número em texto, GUID com chaves, nome com outra caixa. Depois da troca o código compila e os testes passam, mas a leitura do dado real lança exceção ou perde o valor. O objetivo desta skill é encontrar essas diferenças antes da produção.

Há 2 classes de falha. Trate as 2:

- **THROWS:** o STJ lança onde o Newtonsoft convertia. Um só campo errado derruba a leitura do objeto inteiro.
- **SILENT:** não há exceção. O campo fica `null`, vazio, com outro nome ou com outro texto.

## Regras

- **Prova antes da afirmação:** não diga que 2 comportamentos são iguais sem uma linha da matriz com "Provado: Sim" ou uma execução em `assets/jsondiff`. A memória sobre o STJ falha nos detalhes, e os detalhes são a causa dos incidentes.
- **Par `T` e `T?`:** um `JsonConverter<T>` não recebe o `null` de um `T?`, mas recebe o `""`. Um `JsonConverter<T?>` não é usado para uma propriedade `T`. Cada converter de tipo de valor cobre os 2 tipos, ou o perfil usa `VazioComoNuloConverterFactory`. Antes de dizer que um formato "já funciona", teste uma propriedade `T` e uma propriedade `T?`: o mesmo nome de campo pode ser `Guid` num modelo e `Guid?` em outro.
- **Perfil inteiro, não só o incidente:** o incidente mostra 1 campo, mas a causa é a tolerância que o perfil perdeu. Ao corrigir um perfil, feche todas as colunas da tabela do passo 3 que o Newtonsoft cobria, inclusive número em campo `string` (T2) e texto em campo `bool` (T3). Um perfil corrigido só para o campo do incidente falha de novo no campo seguinte.
- **Entrada do teste vem de fora:** o teste de leitura usa texto literal ou arquivo com a resposta real. Uma entrada criada pelo serializador em teste não prova nada.
- **Newtonsoft como oráculo:** a prova de equivalência executa a mesma entrada no código antigo e no código novo. O código antigo fica só no projeto de testes. Um golden em arquivo serve quando o oráculo não é possível, e entra num commit separado, com o Newtonsoft ainda no projeto.
- **Nome honesto no teste:** um json montado à mão não é "resposta real". Use "real" só para um texto capturado do sistema externo.
- **Um perfil por contrato:** cada contrato externo tem 1 `JsonSerializerOptions` estático e imutável (`MakeReadOnly`). Toda chamada passa o perfil. Uma chamada sem opções usa o padrão estrito.
- **Um serializador por tipo:** um tipo não passa pelo Newtonsoft e pelo STJ. Cada biblioteca ignora os atributos da outra sem aviso.
- **Quem consome o perfil decide o alcance:** antes de acrescentar um converter, procure quem usa o perfil e o método público que o configura. Um perfil de cliente (lê resposta externa) recebe a tolerância. Um perfil que um host passa ao ASP.NET (`AddJsonOptions`, `ConfigureHttpJsonOptions`) não recebe sem decisão do dono do serviço (G11).
- **Projeto compartilhado compila no consumidor:** num `.projitems` ou num submódulo, verifique no consumidor, e não na lib: `global using` do Newtonsoft (nomes ambíguos), `JsonSerializerIsReflectionEnabledByDefault`, trimming, AOT e `TreatWarningsAsErrors`. Uma dependência nova do projeto compartilhado vale para todo consumidor.
- **Sem tolerância nova:** repita só o que o Newtonsoft aceitava. Não aceite um formato que o sistema externo não envia. Os converters da skill têm 1 diferença conhecida: texto só com espaços em campo anulável vira `null`, e o Newtonsoft lançava para número.

## Escopo por pedido

| Pedido do usuário | Passos |
|---|---|
| Auditar um projeto já migrado ("o que ainda pode falhar?") | 1, 2, 3 e 6. Não altere o código. Escreva a correção proposta no relatório |
| Corrigir um projeto já migrado ou um perfil | 1 a 6, só nos perfis do pedido |
| Migrar um projeto que usa o Newtonsoft | 1 a 6. Crie o teste de equivalência (passo 5, item 3) **antes** de trocar a biblioteca |
| Revisar um PR da migração | Seção "Revisão de um PR da migração" |

## Recursos

| Arquivo | Conteúdo | Quando ler |
|---|---|---|
| `references/matriz.md` | Cada diferença com id (L, T, D, E, O, V, W, N, G, R), classe, correção e prova | Antes de classificar o primeiro achado |
| `references/testes.md` | Os 4 testes obrigatórios, com modelo | Antes do passo 5 |
| `references/dotnet-lib.md` | Estado dos perfis da dotnet-lib (`_lib`) e as lacunas abertas | Quando o projeto usa a `_lib` |
| `scripts/detectar.sh` | Conta os padrões de risco por id da matriz. Precisa de `bash` e `git` (no Windows, o Git Bash) | Passo 2 |
| `assets/ConvertersTolerantes.cs` | Converters que repetem a tolerância do Newtonsoft (provados) | Passo 4 |
| `assets/jsondiff/` | Programa que executa o mesmo caso no Newtonsoft e no STJ | Quando um caso não está na matriz |
| `assets/jsondiff-sem-reflexao/` | Prova dos converters com a reflexão do STJ desligada, contexto gerado e Newtonsoft em `global using` | Depois de alterar um converter, e quando um consumidor desliga a reflexão |

## Passos

### 1. Definir o modo e a base

1. Procure o Newtonsoft no projeto: `PackageReference`, `using Newtonsoft`, `global using`.
2. Se o projeto ainda usa o Newtonsoft, o modo é **migração**. A base é o commit atual.
3. Se o projeto já migrou, o modo é **auditoria**. Encontre o último commit com Newtonsoft: `git log --oneline -i --grep="newtonsoft\|system.text.json"` e use o pai do commit da migração.
4. Se o usuário informou uma exceção de produção, encontre a linha dela na matriz primeiro. Ela define a prioridade.
5. Se o projeto usa uma biblioteca compartilhada por submódulo (por exemplo `_lib`), compare o commit gravado com o checkout: `git ls-tree HEAD _lib` e `git -C _lib rev-parse HEAD`. Uma correção que existe só no checkout local não entra no build do servidor. Confira com `git -C _lib merge-base --is-ancestor <correção> <commit gravado>`.

*Done when:* o modo e o commit base estão registrados, e o commit gravado de cada submódulo foi comparado com o checkout.

### 2. Inventariar

1. Execute o script na raiz do repositório. Em um submódulo, execute dentro dele.

   ```bash
   bash <skill>/scripts/detectar.sh <commit-base>          # o que o Newtonsoft fazia (bloco A)
   bash <skill>/scripts/detectar.sh HEAD                   # o estado atual (blocos B a E)
   bash <skill>/scripts/detectar.sh -l D-GVL HEAD          # arquivo:linha de um padrão
   ```

2. Leia no commit base cada `JsonSerializerSettings`, `[JsonObject]` e converter próprio. Registre por contrato: política de nomes, tratamento de `null`, formato de data, escape, converters.
3. Liste os contratos do projeto: cada API externa lida ou chamada, cada arquivo gravado em disco, cada coluna JSON no banco, cada resposta da própria API. Um arquivo que a versão antiga gravou e a versão nova lê é um contrato.
4. O script conta padrões de texto. Um padrão com 0 ocorrências não prova que o risco não existe: confira os tipos que chegam por genérico ou por `object`.

*Done when:* há uma lista de contratos e, para cada contrato, a configuração antiga e os ids do script com ocorrências.

### 3. Montar a tabela de cobertura por perfil

Esta tabela é o resultado principal da auditoria. Ela mostra onde a tolerância do Newtonsoft se perdeu.

1. Para cada perfil (`JsonSerializerOptions`) do projeto, preencha uma linha. No modo migração, preencha com o perfil planejado.

   | Perfil | Sem caixa (L1) | Número em texto (T1) | Texto de número (T2) | `bool` tolerante (T3) | `""` em anulável (T4) | GUID tolerante (T8) | Data fora do ISO (D1) | Enum em texto (E1) | Encoder (W1) | Campos (V2) | Resolver (G1) |
   |---|---|---|---|---|---|---|---|---|---|---|---|

2. Marque "Sim" só quando a opção ou o converter existe e cobre `T` e `T?`. Se há dúvida, execute 1 entrada com uma propriedade de cada tipo. Não conclua pela leitura do nome do converter.
3. Inclua 1 linha para cada chamada que não passa perfil: Flurl sem `WithSettings`, Refit com `RefitSettings` padrão, `JsonSerializer` sem opções, `ToJsonString()` e `node.Deserialize<T>()` sem opções. Os padrões dessas bibliotecas estão na seção 10 da matriz.
4. Para cada "Não" num perfil que lê dado externo, conte as propriedades expostas com o id `C-DEC`, `C-GUI` e `C-DTM` do script.

*Done when:* cada perfil e cada chamada sem perfil têm uma linha, e cada "Não" tem a quantidade de propriedades expostas.

### 4. Corrigir

Ordem de prioridade: exceção já vista em produção, depois THROWS em leitura de dado externo, depois SILENT em escrita para sistema externo, depois o resto.

1. **Leitura tolerante:** copie `assets/ConvertersTolerantes.cs` para o projeto, troque o namespace e chame `ComLeituraTolerante(formatosDeData)` na criação de cada perfil que lê dado externo. Ele fecha L1, T1, T2, T3, T4, T8, D1 e E1 de uma vez.
   - Se o perfil já tem um converter de `decimal` ou de data, mantenha o converter do projeto e acrescente os outros um a um: `VazioComoNuloConverterFactory` (delega o valor não vazio ao converter de `T` do perfil), `TextoToleranteJsonConverter`, `BoolToleranteJsonConverter`, `GuidToleranteJsonConverter` e `EnumToleranteConverterFactory`.
   - Um converter existente só para `T?` (por exemplo de `Guid?`) vira um converter de `T`; a fábrica cobre o `T?`.
   - As 2 fábricas usam `MakeGenericType`. Num projeto publicado com trimming ou AOT, escreva um converter por tipo anulável no lugar delas. Elas funcionam com `JsonSerializerIsReflectionEnabledByDefault=false` (provado em `assets/jsondiff-sem-reflexao`).
   - A ordem importa: o primeiro converter que aceita o tipo ganha. Um converter do projeto para `string` ou data fica antes do converter da skill, ou ele nunca é usado.
   - Um converter do projeto para `string`, `Guid`, enum, `DateTime` ou `bool` precisa de `ReadAsPropertyName` e `WriteAsPropertyName`. Sem eles, todo dicionário com essa chave lança quando a reflexão está desligada (G10).
   - Custo medido da fábrica: 19% a mais de tempo na leitura de um objeto com 6 campos anuláveis, sem alocação extra. Em caminho muito quente, meça no projeto.
2. **Enum:** o `EnumToleranteConverterFactory` lê texto e número e escreve número, como o Newtonsoft. Ele não toca um enum que tem `[JsonConverter]` no tipo. Use `JsonStringEnumConverter` só no enum que tinha `StringEnumConverter`. Troque `[EnumMember(Value)]` por `[JsonStringEnumMemberName]`.
3. **Ordem dos converters:** um converter na coleção `Converters` do perfil ganha do atributo `[JsonConverter]` do **tipo** (G9). No Newtonsoft era o contrário. Depois de acrescentar um converter a um perfil, procure os tipos com `[JsonConverter]` que esse converter aceita e confirme que o json escrito deles não mudou. O atributo na **propriedade** continua com prioridade.
4. **Escrita:** compare o json enviado com o golden. As diferenças comuns são acento escapado (W1), `5.0` que vira `5` (W3), `null` que passa a ser escrito (W8), tipo derivado sem propriedades (W5), tupla e campo que somem (V2) e nome snake case diferente (W14).
5. **DOM:** troque `GetValue<T>()` e cast direto por funções tolerantes do projeto ou da `_lib` (`AsInteger`, `AsDecimal`, `AsString`). Trate o `null` do C# onde havia `JValue` nulo (N3, N18). Use `DeepClone()` ao mover um nó (N6). O `JToken.ToString()` tem regras próprias para número, booleano e data (N5, N16, N17). Num projeto que monta json por `JObject` ou `dynamic`, grave primeiro a saída do código antigo (`references/testes.md`, seção 5).
6. **`object` e `dynamic`:** troque a propriedade `object` por um tipo concreto ou `JsonNode`. O valor lido é `JsonElement`, e `dynamic` sobre ele lança em tempo de execução (O1 a O5).
7. **`required`:** o Newtonsoft ignorava. O STJ lança se o campo falta. Retire o `required` do DTO de entrada externa quando o campo é opcional no contrato real (V7).
8. **Contexto gerado:** registre cada tipo raiz, inclusive `List<T>` e os tipos que entram por `object` (G1 a G3).
9. Um caso sem linha na matriz: escreva o caso em `assets/jsondiff`, execute com `dotnet run -c Release` e registre o resultado. Proponha a linha nova ao usuário.

Se o projeto usa a dotnet-lib e a correção pertence a um perfil dela (`references/dotnet-lib.md`), pare e avise o usuário. A correção entra no repositório da lib, e não no consumidor.

*Done when:* cada "Não" da tabela do passo 3 em perfil de dado externo virou "Sim" ou tem uma decisão do usuário, e cada ocorrência dos ids D do script foi corrigida ou justificada.

### 5. Provar com testes

Leia `references/testes.md` e crie, para cada perfil que lê ou escreve dado externo:

1. a bateria de entradas sujas;
2. o teste de contrato, se o perfil usa contexto gerado;
3. a prova de equivalência com o Newtonsoft como oráculo (ou o golden em arquivo, quando o oráculo não é possível);
4. pelo menos 1 resposta real por operação de leitura, em arquivo. Procure uma captura no repositório, nos logs ou na documentação do sistema externo. Se não há captura, peça uma ao usuário e registre a falta no relatório. Não invente uma.

A bateria inclui 1 leitura pelo perfil congelado com um DTO do contexto real, 1 ida e volta de dicionário e 1 comparação da escrita com texto literal (`references/testes.md`, seção 1).

Depois troque as entradas de teste criadas pelo serializador (`RespondWithJson(objeto)`, `Serializar(esperado)`) por texto, nos testes de leitura que o usuário indicar.

Execute os testes com a skill de validação .NET do repositório.

*Done when:* os 4 tipos de teste existem para cada perfil de dado externo e passam, e os testes novos falham no código sem a correção (execute 1 vez com a correção revertida e registre quantos falham).

### 6. Relatar

Use este formato:

```markdown
# Migração JSON: <projeto>

Modo: <migração | auditoria>. Commit base: <hash>.

## Cobertura por perfil
<tabela do passo 3, estado final>

## Achados
| Id da matriz | Classe | Local (arquivo:linha) | Estado (corrigido, aberto, aceito) | Prova (teste ou jsondiff) |

## Mudanças no json enviado
<cada diferença do golden, com a linha da matriz e a decisão>

## Correção proposta
<só no pedido de auditoria: o que mudar em cada perfil, em ordem de prioridade>

## Fora do escopo
<o que pertence à dotnet-lib ou a outro repositório, e o que não foi verificado>
```

Declare o que você não verificou. Um item sem prova fica como "não verificado", e não como "igual".

*Done when:* o relatório tem as seções do formato e cada achado aberto tem um responsável ou uma decisão do usuário.

## Revisão de um PR da migração

Para revisar uma migração de outra pessoa, faça os passos 1 a 3 sobre o diff e confira estes sinais:

- asserts reescritos no mesmo commit da troca, sem golden anterior;
- arquivos `.verified.txt` novos ou alterados no mesmo commit da troca;
- converter de tipo de valor sem o par anulável, ou converter de `T?` sem o par `T`;
- teste que prova um formato só numa propriedade anulável;
- teste com nome "real" e json montado à mão;
- perfil novo sem bateria de entradas sujas;
- converter novo de `string`, `Guid`, enum, `DateTime` ou `bool` sem `ReadAsPropertyName` e `WriteAsPropertyName`;
- converter novo num perfil que o ASP.NET Core usa;
- `required` novo em DTO de entrada externa.
