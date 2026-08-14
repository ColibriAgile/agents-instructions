# Evidências da extração: padrão de geração de logs Colibri

## Fontes e escopo

- Referência: repositório de aplicação, branch `master`, commit `6b8c1e4`.
- Alvo: projetos consumidores e futuros pontos de refatoração no mesmo repositório, principalmente os projetos de aplicação e `_lib/**`; não existe alvo separado informado.
- Investigação: padrão de geração, armazenamento, nomeação e escrita de logs.
- Data da extração: 2026-08-14.
- Método: inspeção somente leitura de projetos, código, configurações, README e testes; sondagens independentes foram executadas com modelo Terra high.

## Matriz de evidências

| ID | Afirmação sustentada | Localização na referência | Observação | Confiança | Mapeamento no alvo |
| --- | --- | --- | --- | --- | --- |
| E1 | O padrão pertence ao repositório atual e a referência principal é `CoLib.Logging` | `_lib/CoLib.Logging/`, commit `6b8c1e4` | Premissa aceita — o usuário delimitou a investigação ao repositório atual; não foi fornecido alvo externo | alta | Contexto de R1-R12, G1-G8 e G10 |
| E2 | `CoLib.Logging` é a biblioteca interna de configuração e integração | `_lib/CoLib.Logging/CoLib.Logging.csproj`; `Extensions/ServiceCollectionExtensions.cs`; `Extensions/LogHostBuilderExtensions.cs` | O projeto referencia Serilog, Microsoft.Extensions e `CoLib.Ambiente`; as extensões registram o logger no host/DI | alta | R1, R10, G5 |
| E3 | O builder resolve base, subpasta e nome do arquivo | `_lib/CoLib.Logging/Configuration/LogConfigurationBuilder.cs`, métodos `Build`, `WithLogPath`, `WithLogSubFolderName`, `WithLogFileNameTemplate` | `basePath` usa `LOGGING_DEBUG_PATH`, `LogBasePath` ou `PastasDoSistema.Logs`; `Path.Combine` monta diretório e arquivo | alta | R2, R3, R4, G1 |
| E4 | Opções padrão incluem rolling diário, `.logc`, layout, shared file e manutenção | `_lib/CoLib.Logging/Configuration/LogConfigurationOptions.cs`; arquivo de configuração padrão da biblioteca | Defaults observados: `RollingInterval.Day`, `SharedFile=true`, `EnableDailyZipRotation=true`, auditoria e template com `|` | alta | R3, R4, R8, G4, G6 |
| E5 | Configuração de aplicação confirma nomes e layout concretos | arquivo de configuração de logging do host; projeto do host | O host copia o arquivo de configuração, usa `{ApplicationName}_{Date}.logc`, subpasta específica e template delimitado | alta | R2-R4, R8, G1, G4 |
| E6 | A pasta padrão do sistema é `Base\logs\` | `_lib/CoLib.Ambiente/Source/PastasDoSistema.cs`, propriedade `Logs` | `PastasDoSistema.Logs` é `Path.Combine(Base, "logs\\")` | alta | R2, G1 |
| E7 | Entry points usam subpastas e nomes explícitos por aplicação | `Program.cs`, blocos `UseLogging` e `AddLogging` dos hosts consumidores | Os hosts usam nomes explícitos de aplicação e subpastas próprias | alta | R1-R3, G1 |
| E8 | A biblioteca faz ponte de Serilog para `Microsoft.Extensions.Logging` | `_lib/CoLib.Logging/Extensions/ServiceCollectionExtensions.cs`, método `AddLoggingCore`; `LogHostBuilderExtensions.cs` | `AddSerilog(logger, dispose: true)` e `UseSerilog(logger)` são os caminhos observados | alta | R1, R8, G5 |
| E9 | Helpers padronizam separadores e informações de inicialização | `_lib/CoLib.Logging/Extensions/LoggerExtensions.cs`, `LogarInformacoesIniciais`, `AdicionarSeparador`, `LogarInformacoesRegionais` | Mensagens observadas: `Version info|...`, `System info|...`, `Format settings|...` | alta | R5, R8, R9, G2 |
| E10 | README prescreve structured logging e overload de exceção | `_lib/CoLib.Logging/README.md`, seções `Structured Logging` e `Exceptions` | O exemplo bom usa placeholders; o exemplo ruim interpola e registra apenas texto da exceção | alta | R6, R7, G2, G3 |
| E11 | Consumidores usam `descrição|detalhes` com variáveis, XML, status e payload | classes de negócio, integração, dados e jobs dos projetos consumidores | Há exemplos como `Request Soap XML|{RequestXml}`, `...|JobId={JobId}` e `...|{XmlCompleto}` | alta | R5-R7, G2-G3 |
| E12 | Middleware interno define formato e filtros de request/response | `_lib/CoLib.AspNet/Middlewares/RequestResponseLoggingMiddleware.cs`; testes do middleware; `Program.cs` do host web | Usa `→ ...|body` e `← ...|body`; omite HTML, ignora estáticos, respeita `load_tests`/atributo e tem testes de JSON/HTML | alta | R9, G7 |
| E13 | DI registra um único provider Serilog | `_lib/CoLib.Logging/Extensions/ServiceCollectionExtensions.cs`; `Program.cs` dos hosts consumidores | Consumidores resolvem `ILogger<T>` depois do registro das extensões internas | alta | R1, G5 |
| E14 | Bibliotecas sem DI usam a fábrica global | `_lib/CoLib.Logging/LibLoggerFactory.cs`; `_lib/CoLib.Cache/.../FlurlExtensions.cs`; `_lib/PluginsLoader/Program.cs`; `_lib/CoLib.Mensageria/Source/Mensageria.cs` | Há criação tipada e por categoria; a fábrica inicia com `NullLogger` até `Initialize` | alta | R10, G5 |
| E15 | Testes podem capturar logs sem arquivo físico | `_lib/CoLib.Logging.Fake/LibLoggerFactorySetup.cs`; `FakeLoggerExtensions.cs`; `FakeLogFactory.cs` | `SetupFakeLogger<T>` inicializa `LibLoggerFactory` com `FakeLogger`; extensões filtram por nível | alta | R11, G8 |
| E16 | Manutenção de arquivos tem zip, auditoria, retry e controle de concorrência | `_lib/CoLib.Logging/Configuration/LogZipMaintenanceByEvent.cs`; `LogMaintenanceAuditWriter.cs`; `LogMaintenanceTriggerEnricher.cs`; `LogZipFileLifecycleHooks.cs` | Arquivos `.logc` antigos são compactados por data; zips usam `yyyy-MM-dd.zip`; auditoria usa `log-maintenance.logc` | alta | R3, G6 |
| E17 | O requisito de leitura do log viewer exige descrição sucinta seguida de `|` e detalhes | Solicitação explícita do usuário em 2026-08-14 | Requisito de destino confirmado pelo usuário e corroborado por E9, E11 e E12; não é uma inferência do código sozinho | alta | R5, G2 |
| E18 | Existem divergências legadas no alvo | classes consumidoras com usos de `LogError(ex.Message)` e `$"..."`; `_lib/CoLib.Cache/.../GerenciadorDeCacheJson.cs` | A prática atual não é 100% uniforme; a orientação não deve declarar conformidade total do legado | alta | R6-R7, G3; lacuna |
| E19 | Há deriva de versões entre a biblioteca e consumidores | arquivos de projeto da biblioteca e dos consumidores | Microsoft.Extensions aparece em versões diferentes entre a biblioteca e consumidores; o host web também referencia `Serilog.AspNetCore` | alta | R1, G5; escalonamento |
| E20 | Configuração fluentemente definida pode sobrescrever JSON autodetectado | `LogConfigurationBuilder` construtor, `TryLoadAutoDetectConfigurationFile`, `MergeOptions`; `Program.cs` do host web | O arquivo de configuração contém uma subpasta, mas o entry point aplica outra depois | alta | R2, R4, G1; adaptação |
| E21 | O alvo operacional é o mesmo repositório, não uma aplicação separada | Escopo da solicitação e árvore do repositório | Foi adotada a premissa explícita de orientar refatorações futuras dos consumidores do próprio repositório | média | Contexto; lacuna de paridade |
| E22 | Um host web cria um logger temporário de console antes do host | `Program.cs` do host web, bloco `LoggerFactory.Create` próximo da configuração inicial | O logger local é usado para construir configurações de ambiente antes de `builder.Build`; é uma exceção de bootstrap, não o sink principal | alta | escalonamento |
| E23 | Um executável console usa console simples, não `CoLib.Logging` | `Program.cs` e arquivo de projeto do executável console | Usa `AddSimpleConsole`, `Microsoft.Extensions.Logging.Console` e `Spectre.Console`; não há referência para `CoLib.Logging` | alta | exceção operacional |
| E24 | Helpers Flurl redigem e truncam payloads | `_lib/CoLib.Extensions/Flurl/Source/FlurlExtensions.cs`, `RedigirConteudo`, `RedigirJson`; `_lib/CoLib.Library.Testes/Source/Extensions/FlurlExtensionsTestes.cs`, `WithLog_RequestJson...` e `WithLog_RequestComApiKey...` | Observado — JSON é compactado, campos sensíveis são substituídos e conteúdo excedente é truncado; testes verificam segredo e API key | alta | R12, G10; adaptação |
| E25 | A cobertura direta da infraestrutura de logging é incompleta | Sondagem dos projetos de teste; ausência de testes diretos para builder/sink/zip; usos de `NullLogger` em testes consumidores | Desconhecido para a infraestrutura física — há testes de middleware e Flurl, mas não fixture completa de geração física, rotação ou configuração | alta | Validação e lacuna de R11/G6 |

## Decisões e lacunas

| Item | Impacto | Decisão necessária |
| --- | --- | --- |
| Não há repositório-alvo separado | A paridade foi mapeada contra os consumidores atuais e não contra uma aplicação externa | Se houver outro alvo, aplicar os documentos somente após comparar seus pacotes, entry point e configuração |
| Versões Microsoft.Extensions divergem entre projetos | Uma atualização silenciosa pode alterar APIs, provider ou comportamento de DI | Definir se a versão canônica é a da biblioteca interna ou a dos consumidores antes de alinhar dependências |
| Arquivo externo de logging e configuração fluentemente definida coexistem | A subpasta efetiva pode diferir do valor no arquivo | Manter precedência documentada; validar o caminho efetivo no entry point |
| Existem mensagens sem `|`, interpoladas ou com `ex.Message` | Uma migração global pode alterar volume, formato ou diagnóstico do legado | Refatorar por escopo e exigir revisão; código novo/alterado segue R5-R7 |
| Não foi comprovada política de mascaramento de payloads | XML/JSON, e-mail, headers ou conexão podem conter dados sensíveis | Escalar antes de ampliar payload logging ou alterar retenção |
| Não foi comprovada uma convenção única para mensagens sem detalhes | Parte do legado usa mensagens sem separador | Para novos logs operacionais, seguir a exigência do usuário; para legado fora do escopo, preservar até refatoração delimitada |
| Não há teste direto da geração física do arquivo em `CoLib.Logging` | Nome final, rotação e manutenção são comprovados por configuração e implementação, não por fixture de integração | Adicionar/usar teste existente de integração somente se a refatoração tocar esses pontos |
| Há executáveis fora do padrão compartilhado | Um executável console e um logger temporário de host podem produzir saída apenas no console | Preservar como exceção delimitada ou aprovar uma migração explícita para `.logc` e `CoLib.Logging` |
| A redação de payload não é universal | Flurl tem mascaramento/truncamento, enquanto há logs de XML bruto em outros fluxos | Escalar qualquer expansão de payload e reutilizar os helpers existentes quando aplicável |

## Premissas explicitamente aceitas

- O repositório atual é a aplicação de referência e também o universo do alvo, conforme a solicitação mais recente.
- O diretório de saída autorizado é `refactor-guidance/padrao-logging/`.
- Os documentos devem orientar agentes autônomos para código novo e para refatorações delimitadas, sem afirmar que todo o legado já está conforme.
- A regra `descrição curta|detalhes` é requisito normativo do usuário e deve prevalecer para mensagens novas ou alteradas, mesmo onde o legado ainda diverge.
- O executável console e o logger temporário do host foram tratados como exceções observadas, não como padrão recomendado.
