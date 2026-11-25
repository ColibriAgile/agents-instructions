# Estado da dotnet-lib (`_lib`) em 2026-11-25

Use este arquivo quando o projeto usa a dotnet-lib como submódulo. Os números são do commit `e9880a3c`. Confira o commit atual antes de usar um número.

- Último commit com Newtonsoft: `002ba58d`. Migração: `c377e584` (PR #75).
- Prova no perfil do CIS (2026-11-25): `TicketPos.TicketId` é `Guid` não anulável e lança com GUID entre chaves; `VendaPos.TicketId` é `Guid?` e funciona. Com um converter de `Guid` mais a fábrica de vazio como nulo, os 106 testes do CIS passam, inclusive os goldens de escrita.
- A lib passa o perfil ao Flurl com `WithSettings` em `CoLib.Extensions/Flurl/Source/FlurlExtensions.cs`. O `HttpTest` da lib usa o mesmo perfil.

## Cobertura por perfil real

Cada linha é um perfil no HEAD. "Não" significa que o caso da matriz continua aberto nesse perfil.

| Perfil | Sem caixa (L1) | Número em texto (T1) | Texto de número (T2) | `bool` tolerante (T3) | `""` em anulável (T4) | Data fora do ISO (D1) | Enum em texto (E1) | Encoder relaxado (W1) | Campos (V2) | Resolver |
|---|---|---|---|---|---|---|---|---|---|---|
| `PerfisJsonDoCis` | Sim | Sim | **Não** | **Não** | Só `DateTime?` e `Guid?` | Sim | Não | Só no perfil `Api` | Não | Só contexto |
| `PerfisJsonDoPis` | Sim | Sim | **Não** | **Não** | **Não** | Não | Sim | Não | Não | Só contexto + regras |
| `PerfilJsonDoEvento` (Notificações) | Sim | Sim | **Não** | **Não** | **Não** | Não | Não | Não | Não | Só contexto |
| `PerfisJsonDePagamento` | Sim | Sim | Sim | **Não** | **Não** | Não | Não | Sim | Não | Só contexto |
| `PerfilJsonDoBloqueio` | Sim | Sim | Só `lock_id` | Não | Não | Não | Não | Não | Não | Só contexto |
| `PerfilJsonDaMensageria` | Sim | **Não** | Não | Não | Não | Não | Não | Não | Não | Só contexto |
| `PerfisJsonDePlugins.Reflexao` | Sim | Sim | Não | Não | Não | Não | Não | Não | Sim | Reflexão |
| `PerfisJsonDoCache` / `DaFila` | Sim | Não | Não | Não | Não | Não | Não | Sim | Cache: Sim | Contexto do chamador |
| `PerfisJsonDeConfiguracao` | Sim | Não | Não | Não | Não | Não | Não | Sim | Não | Só contexto |
| `PerfisJsonDaUi` | Sim | Não | Não | Não | Não | Não | Não | Sim | Sim | Reflexão e contexto |
| `JsonDConnect` (DConnect) | Sim | Sim | Sim (`TextoTolerante`) | **Não** | Não verificado | Sim (`DataTolerante`) | Não verificado | Sim | Sim | Reflexão |
| Flurl 4.0.2 sem perfil | Sim | **Não** | Não | Não | Não | Não | Não | Não | Não | Reflexão |
| Refit 17.0.0 padrão | Sim | **Não** | Não | Não | Não | Não | **Não** | Não | Não | Reflexão, nomes camelCase |

## Falha provada: o converter não cobre o tipo anulável nem o tipo não anulável

O incidente WIN-3439 corrigiu só o `DateTime?`. O mesmo defeito existe em outros converters. Prova na seção 11 do `jsondiff`:

| Entrada | Converter da `_lib` | Newtonsoft | STJ com o perfil |
|---|---|---|---|
| `""` em `decimal?` | `DecimalComPontoJsonConverter` (`JsonConverter<decimal>`) | `null` | `JsonException: O valor String não pode ser lido como Decimal` |
| `""` em `int?` | Nenhum | `null` | `JsonException` |
| `""` em enum anulável | Nenhum | `null` | `JsonException` |
| `"{guid}"` ou `""` em `Guid` não anulável | `GuidLenienteJsonConverter` (`JsonConverter<Guid?>`) | Lê | `JsonException` |
| `12` em `string` | Nenhum | `"12"` | `JsonException` |
| `"true"` em `bool` | Nenhum | `true` | `JsonException` |

Regra do STJ: um `JsonConverter<T>` não recebe o `null` de um `T?`, mas recebe todos os outros tokens. Um `JsonConverter<T?>` não é usado para uma propriedade `T`.

Campos expostos no HEAD (propriedades públicas):

| Projeto | `decimal?` | `int?`/`long?` | `Guid` | `bool` | `string` |
|---|---|---|---|---|---|
| `CoLib.Cis/Modelos` | 5 | 5 | 1 | 17 | 51 |
| `Pis.Library` | 109 | 214 | 50 | 212 | 546 |
| `CoLib.Notificacoes` | 41 | 22 | 2 | 47 | 75 |
| `CoLib.Payment` | 1 | 6 | 2 | 13 | 66 |

Um só campo com o tipo errado derruba a leitura do objeto inteiro. No Newtonsoft, o mesmo campo era convertido.

## Pontos da `_lib` no HEAD para auditar

| Ponto | Local | Risco |
|---|---|---|
| `""` em `decimal?`, `int?`, enum anulável | Perfis do CIS, PIS, Notificações, Pagamento | Seção 4.1 |
| Número em campo `string`, texto em campo `bool` | Perfis do CIS, PIS, Notificações | T2, T3 |
| Perfis sem reflexão e sem teste de contrato | 8 perfis | G1 a G3 para tipos do consumidor |
| `ToJsonString()` sem opções | 15 ocorrências (`CoLib.Plugins.Manager`, `CoLib.Plugin`) | W1: acento vira `ç`, `<` vira `<` |
| `GetValue<T>()` e cast direto | 13 ocorrências (`CoLib.Db/Scripts.cs:119`, `CoLib.UI`, `CoLib.Renderizacao`) | N1, N3 |
| `required` em DTO | 65 ocorrências, 24 arquivos | V7 |
| Política `SnakeCaseLower` | `PerfisJsonDePlugins.Reflexao`, PIS, Bloqueio | W14 (`AB1`) |
| `ReferenceHandler.IgnoreCycles` | `PerfisJsonDaUi` | W9: escreve `null` onde o Newtonsoft omitia |
| Newtonsoft restante | `CoLib.Plugin`, `CoLib.Plugin.Com` | L7, N12 |
| Propriedades `object` | `OperationResult.ErrorData`, `FormStateSaver.Value`, `LogConfigurationOptions.GlobalProperties` | O1, G3 |

Itens do commit base sem risco no HEAD:

- `TypeNameHandling`: 0 usos. Os 3 achados eram `ReferenceLoopHandling.Ignore` (`HtmlContent.cs` e extensões do Verify).
- `dynamic`: 54 usos, 43 do Dapper. Só 1 era de JSON (`Mensageria.cs`) e saiu.
- `[DefaultValue]`: 28 usos sem `DefaultValueHandling`. Sem efeito nas 2 bibliotecas.
- `[EnumMember]`: os valores são iguais aos nomes C#.
- `JObject.Merge`: a `_lib` reescreveu as 3 regras.

