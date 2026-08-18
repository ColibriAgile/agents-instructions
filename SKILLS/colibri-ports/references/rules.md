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
2. Na máquina Master, lê `master/config/ncrmaster.cfg`, seção `[Portas]`, chave `d-connect`.
3. Na máquina cliente, lê `client/config/launcher.boot` e o cache `client/config/launcher.conexao`; no JSON, usa `portas.d-connect`.
4. O valor é exposto na propriedade correspondente de `ConfiguracoesDeAmbiente`, normalmente em `Portas`.
5. A implementação deve selecionar a propriedade exigida pelo alvo; `Portas.DConnect` é apenas o caso concreto observado no DConnect.
6. `Master.Porta`, com default observado `4000`, é uma propriedade distinta das portas agrupadas em `Portas`.

## Propriedades e contratos

- Use `ConfiguracoesDeAmbiente.Portas.<propriedade>` quando o valor estiver no agrupamento `Ports`.
- Use `ConfiguracoesDeAmbiente.Master.Porta` somente quando o requisito pedir explicitamente a porta do serviço Master.
- Use `IProvedorDeConfiguracoesDoAmbiente` ou `ProvedorDeConfiguracoesDoAmbiente` quando a propriedade desejada estiver exposta pelo contrato.
- Para uma propriedade ausente no contrato, confirme a API da revisão Colibri antes de criar uma adaptação.

O DConnect fornece a referência concreta: `Portas.DConnect` resulta de `[Portas] d-connect` no Master ou `portas.d-connect` no cache cliente. Esse mapeamento serve para orientar a leitura de outras propriedades, não para determinar um endpoint.

`ConfiguracoesDeAmbiente` é criada diretamente e suas instâncias estáticas/lazy carregam a configuração no ciclo de vida da instância. O provedor Colibri pode ser usado como abstração mockável quando a propriedade desejada existir no contrato.

## Defaults e falhas

- Ausência do arquivo Master ou de `launcher.boot` produz `InvalidOperationException`.
- Falhas de leitura de `launcher.conexao` são ignoradas e os defaults já inicializados permanecem.
- Não há validação de faixa, disponibilidade ou retry de leitura comprovados.
- Não há recarga dinâmica comprovada após alterações nos arquivos.
