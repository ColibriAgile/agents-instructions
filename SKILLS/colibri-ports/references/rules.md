# Regras comprovadas: leitura de portas no ambiente Colibri

## Fonte e escopo

- Referência: `ColibriAgile/dconnect`, branch `master`, commit `5e0f770f552218f28a2267cb205e536f70b0f346`.
- Escopo: leitura de valores de porta das configurações do Master/cliente por meio das bibliotecas Colibri.
- Aplicação: projetos C# que precisam implementar essa leitura em outro alvo.

## Bibliotecas e classes

| Componente | Versão observada | Responsabilidade comprovada |
| --- | --- | --- |
| `CoLib.Ambiente` | Projeto local `net10.0`, sem versão declarada | `ConfiguracoesDeAmbiente` lê o ambiente e expõe `Portas`, `Master` e conexões |
| `CoLib.Colibri` | Shared Project, sem versão observável | `IProvedorDeConfiguracoesDoAmbiente` e `ProvedorDeConfiguracoesDoAmbiente` expõem propriedades de ambiente, incluindo portas comprovadas |

`CoLib.Ambiente` é referenciado pelo projeto; `CoLib.Colibri` é incluído por `.projitems`. Não há versão NuGet comprovada para essas bibliotecas.

## Fluxo de leitura

1. `ConfiguracoesDeAmbiente` determina `PastasDoSistema.Base` e lê a fonte correspondente ao ambiente.
2. Na máquina Master, lê `master/config/ncrmaster.cfg`, seção `[Portas]`, chave `d-connect`; a leitura usa `LerComCommandLineArgs`, portanto um argumento de linha de comando válido para a mesma chave vence o valor do INI.
3. Na máquina cliente, lê `client/config/launcher.boot` e o cache `client/config/launcher.conexao`; no JSON, usa `portas.d-connect`.
4. O valor é exposto na propriedade correspondente de `ConfiguracoesDeAmbiente`, normalmente em `Portas`.
5. A implementação deve selecionar a propriedade exigida pelo alvo; `Portas.DConnect` é apenas o caso concreto observado no DConnect.
6. `Master.Porta`, com default observado `4000`, é uma propriedade distinta das portas agrupadas em `Portas`.

## Porta própria do alvo

A porta em que o próprio alvo escuta é lida pelo nome cadastrado no Master (E10, E11, E12):

```csharp
var porta = ConfiguracoesDeAmbiente.ObterPorta("<nome no manifesto>", <padrão do manifesto>);
```

- O nome e o padrão são os mesmos de `portas[]` do `manifesto.server`.
- Não acrescente propriedade `Portas.<Produto>` nem constante `PORTA_<PRODUTO>_DEFAULT` na `dotnet-lib` para o alvo. A lib não conhece cada aplicação, e cada produto novo pediria uma linha nova na lib.
- `ObterPorta` não lê argumentos da linha de comando. A leitura tipada usa `LerComCommandLineArgs`, e com ela um `--<chave> N` muda a porta.
- `ObterPorta` lança `InvalidOperationException` para valor fora de 1 a 65535. Sem arquivo, sem chave ou sem inteiro, ela devolve o padrão. `PastasDoSistema.Base` pode lançar outra exceção quando a pasta do Colibri não existe. O alvo decide se uma falha para o boot ou usa o padrão com aviso.
- Produtos que já tinham a propriedade tipada antes desta regra (DConnect, PIS, BOC, D-Mock) podem continuar a usá-la.

## Propriedades e contratos

- Use `ConfiguracoesDeAmbiente.Portas.<propriedade>` para a porta de um serviço consumido que já está no agrupamento `Ports` (por exemplo, `Portas.Cis` e `Portas.Pis`). Para a porta própria do alvo, use `ObterPorta` (seção anterior).
- Use `ConfiguracoesDeAmbiente.Master.Porta` somente quando o requisito pedir explicitamente a porta do serviço Master.
- Use `IProvedorDeConfiguracoesDoAmbiente` ou `ProvedorDeConfiguracoesDoAmbiente` quando a propriedade desejada estiver exposta pelo contrato.
- Para uma propriedade ausente no contrato, confirme a API da revisão Colibri antes de criar uma adaptação.

O DConnect fornece a referência concreta: `Portas.DConnect` resulta de `[Portas] d-connect` no Master ou `portas.d-connect` no cache cliente. Esse mapeamento serve para orientar a leitura de outras propriedades, não para determinar um endpoint.

`ConfiguracoesDeAmbiente` é criada diretamente e os consumidores observados a mantêm em campos `static readonly`, carregando a configuração uma vez por ciclo de vida do tipo. O provedor Colibri pode ser usado como abstração mockável quando a propriedade desejada existir no contrato.

## Defaults e falhas

- Ausência do arquivo Master ou de `launcher.boot` produz `InvalidOperationException`.
- Falhas de leitura de `launcher.conexao` são capturadas. Se ocorrerem antes da atribuição de `Portas`, os defaults já inicializados permanecem; valores de porta ausentes ou inválidos individualmente também usam seus defaults.
- A atribuição de `Portas` ocorre antes do processamento de alguns blocos opcionais de conexão. Uma exceção posterior não desfaz os valores de porta já carregados.
- Não há validação de faixa, disponibilidade ou retry de leitura comprovados.
- Não há recarga dinâmica comprovada após alterações nos arquivos.
