# Matriz de incompatibilidades Newtonsoft.Json -> System.Text.Json

Provado em 2026-11-25 com .NET 11.0.0, Newtonsoft 13.0.4, Flurl.Http 4.0.2 e Refit 17.0.0. O resultado bruto está em `assets/jsondiff/resultado-net11.txt`. Os casos que dependem da reflexão desligada estão em `assets/jsondiff-sem-reflexao/resultado-net11.txt`.

Legenda:

- **SILENT**: não há exceção. O valor fica errado, vazio ou com outro texto.
- **THROWS**: o Newtonsoft aceitava. O System.Text.Json (STJ) lança exceção em tempo de execução.
- **Provado "Sim"**: o programa `assets/jsondiff` executou o caso nas 2 bibliotecas. "Doc": só a documentação da Microsoft.

Índice: 1 sintaxe e nomes (L), 2 conversão de tipos (T), 3 datas e enums (D, E), 4 object, visibilidade e construtor (O, V), 5 escrita (W), 6 DOM (N), 7 contexto gerado e opções (G), 8 runtime do .NET 11 (R), 9 converter e tipo anulável, 10 Flurl e Refit.


## 1. Leitura: sintaxe e nomes

| # | Caso | Newtonsoft | STJ padrão | Classe | Correção | Provado |
|---|---|---|---|---|---|---|
| L1 | Nome com outra caixa (`nome` para `Nome`) | Lê | Propriedade fica `null` | SILENT | `PropertyNameCaseInsensitive = true` | Sim |
| L2 | Texto vazio ou só espaços em `Deserialize<T>` | Devolve `null` | `JsonException` | THROWS | Testar `IsNullOrWhiteSpace` antes | Sim |
| L3 | Comentário, vírgula final | Aceita | `JsonException` | THROWS | `ReadCommentHandling.Skip`, `AllowTrailingCommas` | Sim |
| L4 | Aspas simples, nome sem aspas | Aceita | `JsonException` | THROWS | Não há opção. Corrigir a origem ou normalizar o texto | Sim |
| L5 | `NaN` literal | Aceita | `JsonException` | THROWS | `AllowNamedFloatingPointLiterals` só aceita `"NaN"` entre aspas | Sim |
| L6 | Atributo do Newtonsoft (`[JsonProperty]`, `[JsonIgnore]`) no modelo | Usa | Ignora o atributo. Nome errado e campo secreto exposto | SILENT | Trocar por `[JsonPropertyName]` e `[JsonIgnore]` do STJ | Sim |
| L7 | Atributo do STJ lido pelo Newtonsoft (projeto que ainda usa Newtonsoft) | Ignora o atributo | Usa | SILENT | Um tipo não pode passar pelos 2 serializadores | Sim |
| L8 | `[DataMember(Name)]` | Usa | Ignora | SILENT | `[JsonPropertyName]` | Sim |
| L9 | `Id` e `ID` no mesmo tipo com leitura sem caixa | Aceita | `InvalidOperationException` (colisão) | THROWS | `[JsonPropertyName]` diferente ou `[JsonIgnore]` | Sim |

## 2. Leitura: conversão de tipos

| # | Caso | Newtonsoft | STJ padrão | Classe | Correção | Provado |
|---|---|---|---|---|---|---|
| T1 | `"12"` para `int`, `"1.5"` para `decimal` | Converte | `JsonException` | THROWS | `NumberHandling = AllowReadingFromString` | Sim |
| T2 | `12`, `12.50`, `true` para `string` | Converte para texto | `JsonException` | THROWS | Converter de texto tolerante. Não há opção | Sim |
| T3 | `"true"` ou `1` para `bool` | Converte | `JsonException` | THROWS | Converter de `bool` tolerante | Sim |
| T4 | `""` para `int?`, `decimal?`, `Guid?`, `DateTime?`, enum anulável | Devolve `null` | `JsonException` | THROWS | Converter para o tipo **anulável**. Um `JsonConverter<DateTime>` não recebe o `null`, mas recebe o `""` (incidente WIN-3439) | Sim |
| T5 | `""` para objeto ou lista | Devolve `null` | `JsonException` | THROWS | Converter ou correção na origem | Sim |
| T6 | `1e3` para `long` | Converte | `JsonException` | THROWS | Converter | Sim |
| T7 | `[1,2]` para `byte[]` | Converte | `JsonException` (STJ só lê base64) | THROWS | Converter | Sim |
| T8 | GUID sem hifens ou entre chaves | Converte | `JsonException` | THROWS | Converter (`GuidLenienteJsonConverter` na `_lib`) | Sim |
| T9 | `null` para `int` com `NullValueHandling.Ignore` | Mantém o padrão | `JsonException` | THROWS | Propriedade anulável | Sim |
| T10 | `null` para propriedade com valor inicial, com `NullValueHandling.Ignore` | Mantém o valor inicial | Grava `null` | SILENT | Tratar `null` depois da leitura ou usar converter | Sim |
| T11 | Número em `Dictionary<string,string>` | Converte | `JsonException` | THROWS | Converter de texto tolerante | Sim |
| T13 | `" 12 "` (espaços) para `int`, mesmo com `AllowReadingFromString` | Converte | `JsonException` | THROWS | Converter ou `Trim` na origem | Sim |
| T12 | `"1,5"` para `decimal` | Devolve **15** (erro antigo) | `JsonException` | THROWS | O STJ mostra um defeito que já existia | Sim |

## 3. Leitura: datas e enums

| # | Caso | Newtonsoft | STJ padrão | Classe | Correção | Provado |
|---|---|---|---|---|---|---|
| D1 | `"2026-11-25 10:00:00"` (espaço) | Lê | `JsonException` | THROWS | Converter de data | Sim |
| D2 | `"11/25/2026"`, `/Date(...)/`, `t` e `z` minúsculos | Lê | `JsonException` | THROWS | Converter de data | Sim |
| D3 | `DateFormatString` (`yyyyMMdd HH:mm:ss` do CIS) | Opção global | Não existe | THROWS | Converter por perfil (`DataDoCisJsonConverter`) | Sim |
| D4 | `DateTimeZoneHandling.Utc` na escrita de data local | Converte para UTC (`13:00:00Z`) | Não existe. Escreve a hora local com o fuso | SILENT | Converter que converte para UTC | Sim |
| D5 | `IsoDateTimeConverter { AssumeLocal }` com texto sem fuso | `Kind=Unspecified` | `Kind=Unspecified` | Igual | Nenhuma | Sim |
| E1 | Enum em texto (`"Mesa"`) | Lê | `JsonException` | THROWS | `JsonStringEnumConverter` | Sim |
| E2 | `[EnumMember(Value)]` | Lê e escreve | Ignora. Leitura lança, escrita usa o nome C# | THROWS / SILENT | `[JsonStringEnumMemberName]` (.NET 9+) | Sim |
| E3 | Enum sem converter na escrita | Número | Número | Igual | Nenhuma | Sim |
| E4 | `StringEnumConverter` com `SnakeCaseNamingStrategy` | Texto snake | `JsonStringEnumConverter()` escreve `VendaNoBalcao`. Com `SnakeCaseLower` escreve `venda_no_balcao` e ainda lê o nome C# | SILENT | Converter com política | Sim |

## 4. Leitura: `object`, dicionário, visibilidade, construtor

| # | Caso | Newtonsoft | STJ padrão | Classe | Correção | Provado |
|---|---|---|---|---|---|---|
| O1 | Propriedade `object` ou valor de `Dictionary<string,object>` | `long`, `double`, `string`, `bool`, `DateTime`, `JObject`, `JArray` | Sempre `JsonElement` | SILENT | Converter de tipos inferidos, ou trocar o tipo para `JsonNode` | Sim |
| O2 | `(long)dic["n"]`, `Convert.ToInt32(dic["n"])` | Funciona | `InvalidCastException` | THROWS | Idem O1 | Sim |
| O3 | `dic["s"] is string`, `Equals(valor, "x")` | `true` | `false` | SILENT | Idem O1 | Sim |
| O4 | `$"{dic["n"]}"` com `1.50` | `1,5` (cultura) | `1.50` (texto bruto) | SILENT | Formatar de modo explícito | Sim |
| V1 | Propriedade privada com `[JsonProperty]` | Lê e escreve | Ignora | SILENT | `[JsonInclude]` (não funciona com membro privado em contexto gerado) | Sim |
| V2 | Campo público, campo de `struct`, `ValueTuple` (`Item1`) | Lê e escreve | Ignora. Tupla vira `{}` | SILENT | `IncludeFields = true` | Sim |
| V3 | Coleção ou objeto só com `get` | Preenche a instância | Não preenche. Fica vazia | SILENT | `[JsonObjectCreationHandling(Populate)]` ou `set` | Sim |
| V4 | Lista com valor inicial `{9}` e json `[1]` | `9,1` (acrescenta) | `1` (substitui) | SILENT | Decidir o comportamento e testar | Sim |
| V5 | Só construtor privado | Usa | `NotSupportedException` | THROWS | Construtor público ou `[JsonConstructor]` | Sim |
| V6 | Parâmetro do construtor com nome diferente da propriedade | Deixa `null` | `InvalidOperationException` | THROWS | Mesmo nome no parâmetro e na propriedade | Sim |
| V7 | `required` ausente no json | Ignora o `required` | `JsonException` | THROWS | Remover `required` de DTO de entrada externa ou tratar o erro | Sim |
| O5 | `dynamic` sobre o resultado (`d.a.b`) | Funciona com `JObject` | `RuntimeBinderException` com `JsonNode` e `JsonElement`. Compila sem aviso | THROWS | Tipar o acesso. Não há suporte a `dynamic` | Sim |
| V8 | `JsonConvert.PopulateObject` | Preenche objeto existente | Não existe | Compilação | `JsonObjectCreationHandling.Populate` ou cópia manual | Doc |

## 5. Escrita

| # | Caso | Newtonsoft | STJ padrão | Classe | Correção | Provado |
|---|---|---|---|---|---|---|
| W1 | Acentos e `< > & ' +` | Texto bruto | `ç`, `<`, `'`, `+` | SILENT | `Encoder = UnsafeRelaxedJsonEscaping` | Sim |
| W2 | `EscapeNonAscii` | `ç` minúsculo, `<` bruto | `ç` maiúsculo, `<` vira `<` | SILENT | Só importa para assinatura, hash ou comparação de texto | Sim |
| W3 | `decimal 5m`, `double 5.0` | `5.0` | `5` | SILENT | Converter (`DecimalComPontoJsonConverter` na `_lib`) | Sim |
| W4 | `double.NaN` | `"NaN"` | `ArgumentException` | THROWS | `AllowNamedFloatingPointLiterals` | Sim |
| W5 | Tipo derivado em propriedade do tipo base ou interface | Escreve todas as propriedades | Escreve só as do tipo declarado | SILENT | `[JsonDerivedType]`, ou declarar `object` | Sim |
| W6 | `ShouldSerializeX()` | Respeita | Ignora | SILENT | `[JsonIgnore(Condition = ...)]` ou modificador de contrato | Sim |
| W7 | `DefaultValueHandling.Ignore` com `[DefaultValue]` | Omite | Escreve tudo | SILENT | `JsonIgnoreCondition.WhenWritingDefault` (não lê `[DefaultValue]`) | Sim |
| W8 | `ItemNullValueHandling.Ignore` no `[JsonObject]` | Omite nulos do tipo | Não existe por tipo até o .NET 10 | SILENT | `[JsonIgnore(Condition = WhenWritingNull)]` por membro, ou modificador. No .NET 11, `[JsonIgnore(Condition)]` no tipo (não verificado) | Sim |
| W9 | `ReferenceLoopHandling.Ignore` | Omite o ciclo | `JsonException` | THROWS | `ReferenceHandler.IgnoreCycles`. Atenção: ele escreve `"Eu":null`. O Newtonsoft omitia a propriedade | Sim |
| W10 | `System.Type`, delegate, `DataTable` | Escreve (`Type` e `DataTable`) | `NotSupportedException` | THROWS | `[JsonIgnore]`, modificador ou converter | Sim |
| W11 | `Exception` | Formato `ClassName`, `StackTraceString` | Outro formato (`TargetSite`, `HResult`) | SILENT | Projetar para um DTO próprio | Sim |
| W12 | `JObject` dentro de um objeto escrito pelo STJ | `{"a":1}` | `{"a":[]}` | SILENT | Não misturar DOM do Newtonsoft com STJ | Sim |
| W13 | `JsonObject` dentro de um objeto escrito pelo Newtonsoft | n/a | Newtonsoft lança (ciclo em `Parent`) | THROWS | Idem W12 | Sim |
| W14 | Snake case: `AB1` | `a_b1` | `ab1` | SILENT | Fixar o nome com `[JsonPropertyName]` | Sim |
| W15 | `CamelCasePropertyNamesContractResolver`: chave de dicionário | `minhaChave` | `MinhaChave` | SILENT | `DictionaryKeyPolicy` | Sim |
| W16 | Indentação | Igual nos casos testados | Igual | Igual | Nenhuma | Sim |

## 6. DOM: `JToken` para `JsonNode`

| # | Caso | Newtonsoft | STJ | Classe | Correção | Provado |
|---|---|---|---|---|---|---|
| N1 | `.Value<int>()` em `"12"`, `.Value<string>()` em `12`, `.Value<long>()` em `1.0`, `.Value<bool>()` em `12` | Converte | `GetValue<T>()` lança `InvalidOperationException` | THROWS | Funções tolerantes (`AsInteger`, `AsDecimal`, `AsString` da `_lib`) | Sim |
| N2 | Nó criado em código: `JsonValue.Create(1).GetValue<long>()` | Converte | `InvalidOperationException` (o tipo deve ser exato) | THROWS | Idem N1 | Sim |
| N3 | Valor json `null` | `JValue` do tipo `Null`. `.ToString()` devolve `""` | `null` do C#. `NullReferenceException` | THROWS | `?.` e teste de `null` | Sim |
| N4 | `JsonNode.Parse("null")` | `JToken` do tipo `Null` | `null` do C# | SILENT | Teste de `null` | Sim |
| N5 | Texto com data ISO | Vira `DateTime`. `ToString()` dá `25/11/2026 10:00:00` | Continua texto. `ToString()` dá `2026-11-25T10:00:00` | SILENT | Código que dependia da conversão automática muda de resultado | Sim |
| N6 | Colocar um nó que já tem pai em outro objeto | Clona | `InvalidOperationException: The node already has a parent` | THROWS | `DeepClone()` | Sim |
| N7 | Chave duplicada no texto | Último valor | `ArgumentException` no primeiro acesso | THROWS | `JsonDocumentOptions.AllowDuplicateProperties` (.NET 10) ou correção na origem | Sim |
| N8 | Número maior que `long` | `BigInteger` | `GetValue<long>()` lança | THROWS | `decimal` ou `BigInteger` explícito | Sim |
| N9 | `ToObject<T>` para `node.Deserialize<T>()` sem opções | Usa as regras do Newtonsoft | Usa o STJ padrão: propriedade fica `0` | SILENT | Passar sempre as opções do perfil | Sim |
| N10 | `ToJsonString()` sem opções | Texto bruto | Escapa acentos | SILENT | Passar opções com o encoder | Sim |
| N11 | `DeepEquals(1, 1.0)` | `false` | `true` | SILENT | Só afeta comparação em teste | Sim |
| N12 | `JToken` guarda número como `double`. `(decimal)6.66d` no .NET 11 | `6.6600000000000001421...` | `GetValue<decimal>()` dá `6.66` | SILENT | Só afeta código que ainda usa Newtonsoft no .NET 11 (`CoLib.Plugin`) | Sim |
| N13 | `SelectToken` (JSONPath) | Existe | Não existe | Compilação | Navegação manual ou a função da `_lib` | Doc |
| N15 | `JObject.Merge` | Existe. Padrão: array concatena, `null` da origem não substitui | Não existe | Compilação + SILENT na regra reescrita | Escrever a regra e testar array e `null`. A `_lib` tem 3 regras (`MesclagemDoCis`, `MesclarObjeto` com e sem nulos) | Sim (lado NS) |
| N14 | `JsonElement` usado depois do `Dispose` do `JsonDocument` | n/a | `ObjectDisposedException` | THROWS | `.Clone()` ou `JsonNode` | Sim |
| N16 | `ToString()` de um número fracionário (`1.50`) | `1,5` na cultura atual, sem o zero final | `1.50` (texto bruto) | SILENT | Para repetir: `double.Parse(texto, Invariant).ToString(CurrentCulture)`. Um inteiro sai igual nas 2 | Sim |
| N17 | `ToString()` de um booleano | `True` | `true` | SILENT | `bool.TrueString` e `bool.FalseString` | Sim |
| N18 | Campo com o `null` do json: `obj["x"] is null`, `Where(x => obj[x] is not null)` | `False`: o campo conta como presente (`JValue` nulo) | `True`: igual ao campo ausente | SILENT | `ContainsKey` ou `TryGetPropertyValue` para separar ausente de nulo | Sim |
| N19 | `Value<decimal?>()` de `"9,50"` | `950` (formato invariante com separador de milhar) | `GetValue<decimal?>()` lança `InvalidOperationException` | THROWS | Para repetir: `decimal.Parse(texto, NumberStyles.Number, InvariantCulture)`. O `950` é um defeito antigo: decida com o usuário | Sim |
| N20 | `char` atribuído a um `JObject` por `dynamic` | Número (`'x'` vira `120`) | Texto (`"x"`) | SILENT | Converter o `char` para `int` antes, se o leitor espera número | Sim |

Seção 19 do `jsondiff`. Ela prova também que `(bool?)token` aceita `"true"` e `1` (N1) e que o `ToString()` sem argumento escreve o objeto indentado nas 2 bibliotecas.

## 7. Contexto gerado e opções

| # | Caso | Resultado no STJ | Classe | Correção | Provado |
|---|---|---|---|---|---|
| G1 | Tipo fora do `JsonSerializerContext` | `NotSupportedException: JsonTypeInfo metadata ... was not provided` | THROWS | `[JsonSerializable(typeof(T))]` | Sim |
| G2 | `List<T>` com `T` registrado, mas a lista não | Idem | THROWS | Registrar também `List<T>`, `T[]`, `Dictionary<,>` | Sim |
| G3 | Propriedade `object` com `int`, dicionário ou tipo anônimo | Idem | THROWS | Registrar cada tipo real, ou não usar `object` | Sim |
| G4 | Tipo derivado em contexto gerado | Escreve só o tipo base | SILENT | `[JsonDerivedType]` | Sim |
| G5 | Alterar `JsonSerializerOptions` depois do primeiro uso | `InvalidOperationException` | THROWS | Criar as opções 1 vez. `MakeReadOnly()` | Sim |
| G6 | `new JsonSerializerOptions` em cada chamada | Lento e usa muita memória (cache por instância) | SILENT | Instância estática | Não verificado |
| G7 | ASP.NET Core 10: converter próprio que não trata `HasValueSequence` | Dado perdido ou `ArgumentOutOfRangeException` | THROWS / SILENT | Corrigir o converter. Chave temporária `Microsoft.AspNetCore.UseStreamBasedJsonParsing` | Doc |
| G8 | .NET 10: propriedade `Type` em tipo polimórfico (`$type`) | `InvalidOperationException` | THROWS | Renomear ou `[JsonIgnore]` | Doc |
| G9 | Converter no `Converters` e atributo no tipo | O `Converters` ganha do atributo de tipo. No Newtonsoft era o contrário | SILENT | Rever a ordem | Sim |
| G10 | Converter no `Converters` para um tipo que é chave de dicionário (`string`, `Guid`, enum, `DateTime`, `bool`), sem `ReadAsPropertyName` e `WriteAsPropertyName` | Com a reflexão ligada: funciona (o STJ usa o converter interno para a chave). Com `JsonSerializerIsReflectionEnabledByDefault=false`: `NotSupportedException` na leitura e na escrita de todo `Dictionary<T, V>` | THROWS | Implementar os 2 métodos em todo converter desses tipos. Escrever a chave como o STJ padrão: `bool` vira `True`, enum vira o nome | Sim (`jsondiff-sem-reflexao`, seção A) |
| G11 | Converter próprio num perfil que o ASP.NET Core usa (`AddJsonOptions`, `ConfigureHttpJsonOptions`) | O binding das requisições fica tolerante, e o schema OpenAPI de `string`, `bool`, `Guid`, data e tipo anulável pode mudar. Um converter que o host acrescenta depois perde para o primeiro | SILENT | Não acrescentar converters a um perfil de servidor sem decisão do dono do serviço. Separar o perfil do cliente do perfil do servidor | Não verificado (só o uso foi lido) |

## 8. Mudanças do .NET 11 fora do STJ

| # | Caso | Resultado | Classe |
|---|---|---|---|
| R1 | `(decimal)double` | Conversão exata: `(decimal)1.23` dá `1.229999999999999982236431606`. Não há chave de compatibilidade | SILENT |
| R2 | `Math.Round` | Resultado com arredondamento correto. Valores no limite mudam (só o título da página foi lido: não verificado) | SILENT |

## 9. Converter e tipo anulável

A tabela abaixo usa os converters da dotnet-lib de 2026-11-25 como exemplo.

Regra do STJ: um `JsonConverter<T>` não recebe o `null` de um `T?`, mas recebe todos os outros tokens, inclusive `""`. Um `JsonConverter<T?>` não é usado para uma propriedade `T`. Um converter de leitura tolerante precisa cobrir os 2 tipos.

| Entrada | Converter da `_lib` | Newtonsoft | STJ com o perfil |
|---|---|---|---|
| `""` em `decimal?` | `DecimalComPontoJsonConverter` (`JsonConverter<decimal>`) | `null` | `JsonException: O valor String não pode ser lido como Decimal` |
| `""` em `int?` | Nenhum | `null` | `JsonException` |
| `""` em enum anulável | Nenhum | `null` | `JsonException` |
| `"{guid}"` ou `""` em `Guid` não anulável | `GuidLenienteJsonConverter` (`JsonConverter<Guid?>`) | Lê | `JsonException` |
| `12` em `string` | Nenhum | `"12"` | `JsonException` |
| `"true"` em `bool` | Nenhum | `true` | `JsonException` |

Correção geral: `assets/ConvertersTolerantes.cs` (`VazioComoNuloConverterFactory` cobre todo `T?`).

Cuidado com a chave de dicionário (G10): um converter de `T` na coleção `Converters` também recebe a chave de um `Dictionary<T, V>`. Os converters do asset implementam `ReadAsPropertyName` e `WriteAsPropertyName`. Um converter escrito no projeto para `string`, `Guid`, enum, `DateTime` ou `bool` precisa dos mesmos 2 métodos. O defeito não aparece num teste com a reflexão ligada.

Cuidado com a ordem (G9, provado na seção 17 do `jsondiff`): um converter de enum na coleção `Converters` assume também o enum que tem `[JsonConverter(typeof(JsonStringEnumConverter<T>))]` no tipo. O json escrito muda de `"Mesa"` para `1`, sem exceção. O `EnumToleranteConverterFactory` da skill recusa esses enums. Um converter escrito no projeto precisa da mesma condição.

## 10. Flurl e Refit


- **Flurl 4.0.2** `DefaultJsonSerializer`: `PropertyNameCaseInsensitive = true` e mais nada. Corpo vazio devolve `null`. Corpo HTML lança `FlurlParsingException`. Escreve `ação` e `5` para `5m`.
- **Refit 17.0.0** `GetDefaultJsonSerializerOptions()`: `PropertyNameCaseInsensitive = true`, `PropertyNamingPolicy = CamelCase`, `NumberHandling = Strict`, `Converters = []`. Não há converter de enum em texto nem de tipos inferidos para `object`.
- **`HttpTest.RespondWithJson`** usa o serializador configurado. Ele aplicou `[JsonPropertyName]` na saída. O teste que usa esse método cria a entrada com o mesmo serializador que lê.

