---
applyTo: "**/*.{cs,json,csproj}"
---

# Regras extraídas: padrão de geração de logs Colibri

## Contexto

- Aplicação de referência: repositório `ColibriAgile/nota-fiscal`, branch `master`, commit `6b8c1e4`; referência principal em `_lib/CoLib.Logging`.
- Aplicação-alvo: projetos C# do mesmo repositório que geram ou consomem logs, incluindo `NotaFiscal/**` e bibliotecas internas em `_lib/**`. Não foi fornecido um repositório-alvo separado.
- Escopo: inicialização do logging, nomeação de arquivos, diretórios, configuração, composição de mensagens, payloads, exceções, logging HTTP e testes.
- Objetivo de paridade: manter o ecossistema Serilog + `Microsoft.Extensions.Logging`, os arquivos `.logc` por aplicação e mensagens legíveis pelo log viewer no formato `descrição curta|detalhes`.

## Bibliotecas e créditos

| Biblioteca ou pacote | Versão observada | Papel | Uso comprovado no alvo |
| --- | --- | --- | --- |
| `CoLib.Logging` (`_lib/CoLib.Logging`) | Projeto interno, `net10.0` | Builder, opções, Serilog, ponte para `ILogger`, fábrica global e manutenção dos arquivos | Adotar; é a biblioteca padrão |
| `CoLib.Ambiente` (`_lib/CoLib.Ambiente`) | Projeto interno, `net10.0` | Fornece `PastasDoSistema.Logs` como base padrão | Adotar quando a aplicação usa a pasta padrão do sistema |
| `CoLib.AspNet` (`_lib/CoLib.AspNet`) | Projeto interno, `net10.0` | `UseRequestResponseLogging`, filtro de arquivos estáticos e controle de payload HTTP | Adotar somente em aplicações ASP.NET que precisam de request/response detalhado |
| `CoLib.Logging.Fake` (`_lib/CoLib.Logging.Fake`) | Projeto interno, `net10.0` | `FakeLogger`, `FakeLogFactory` e captura de registros em testes | Adotar em testes unitários que precisam verificar logs |
| `Serilog` | `4.4.0` | Núcleo do logger | Usado por `CoLib.Logging`; não criar uma segunda configuração paralela |
| `Serilog.Extensions.Hosting` | `10.0.0` | Integração com `IHostBuilder` | Usado por `UseLogging` |
| `Serilog.Extensions.Logging` | `10.0.0` | Ponte para `Microsoft.Extensions.Logging` | Usado por `AddLogging` e `AddSerilog` |
| `Serilog.Sinks.File` | `7.0.0` | Escrita dos arquivos `.logc` | Usado pelo `LogConfigurationBuilder`; o projeto API também o referencia diretamente |
| `Serilog.Sinks.Console` | `6.1.1` | Saída opcional no console | Habilitar somente quando necessário, principalmente desenvolvimento |
| `Serilog.Settings.Configuration` | `10.0.1` | Pacote referenciado pela biblioteca para configuração | Referenciado; não foi comprovado uso direto de `ReadFrom.Configuration` |
| `Serilog.Enrichers.Thread` | `4.0.0` | `ThreadId` no evento | Habilitado por padrão |
| `Serilog.Enrichers.Environment` | `3.0.1` | Nome da máquina e ambiente | `WithMachineName` é habilitado por padrão |
| `Serilog.Enrichers.Process` | `3.0.0` | Processo e PID | Disponível, mas desabilitado por padrão |
| `Microsoft.Extensions.Logging` | `10.0.10` na biblioteca; `10.0.11` em consumidores | API `ILogger`, níveis e DI | Usar `ILogger<T>` por injeção |
| `Microsoft.Extensions.Logging.Abstractions` | `10.0.10` na biblioteca; `10.0.11` em consumidores | Abstrações e `NullLogger` | Usado pela biblioteca e pelas camadas de negócio/dados |
| `Microsoft.Extensions.Diagnostics.Testing` | `10.8.0` | `FakeLogger<T>` | Usado por `CoLib.Logging.Fake` |
| `Serilog.AspNetCore` | `10.0.0` no projeto API | `UseSerilogRequestLogging` | Usar apenas para o middleware nativo adicional da API |

## Regras de implementação

### R1 — Inicializar o logging pela biblioteca interna

- Regra: configurar o logger com `CoLib.Logging.Extensions.UseLogging(...)` em hosts ASP.NET/Generic Host ou `IServiceCollection.AddLogging(...)` em aplicações com DI. Depois disso, injetar `ILogger<T>` nas classes.
- Aplicabilidade: pontos de entrada (`Program.cs`) e classes que produzem logs em `NotaFiscal/**` e `_lib/**`.
- Evidência: E2, E7, E13, E14.
- Confiança: alta.
- Verificação: o ponto de entrada chama uma extensão de `CoLib.Logging`, o container resolve `ILogger<T>` e não existe um segundo `LoggerConfiguration` concorrente.

### R2 — Usar a base de logs do sistema e uma subpasta por aplicação

- Regra: usar `PastasDoSistema.Logs` como `LogBasePath` quando a aplicação pertence à instalação Colibri e definir uma subpasta estável e exclusiva da aplicação com `WithLogSubFolderName(...)`.
- Aplicabilidade: aplicações instaláveis que compartilham a pasta de logs do sistema.
- Evidência: E3, E5, E6, E7.
- Confiança: alta.
- Verificação: o diretório resolvido é `<PastasDoSistema.Logs>\<subpasta-da-aplicação>`, sem gravar logs diretamente na raiz compartilhada.

### R3 — Nomear arquivos com aplicação, data e extensão `.logc`

- Regra: usar `WithLogFileNameTemplate("{ApplicationName}_{Date}.logc")`. O builder remove `{Date}` antes de entregar o caminho ao Serilog, que aplica o rolling diário; o resultado esperado contém o nome da aplicação, uma data de oito dígitos e a extensão `.logc`.
- Aplicabilidade: todos os sinks de arquivo da aplicação.
- Evidência: E3, E4, E5, E16.
- Confiança: alta.
- Verificação: para `NF.Api`, por exemplo, o caminho termina em `NotaFiscal.Api\NF.Api_<yyyyMMdd>.logc`; arquivos de manutenção permanecem `log-maintenance.logc`.

### R4 — Manter a configuração no bloco `Log` e no arquivo autodetectável

- Regra: quando a configuração for externa, manter `LoggingSettings.json` na pasta do executável, dentro da seção `Log`, e marcar o arquivo para cópia ao diretório de saída. A biblioteca também procura `LoggingSettings.{DOTNET_ENVIRONMENT}.json` ou `LoggingSettings.{ASPNETCORE_ENVIRONMENT}.json`.
- Aplicabilidade: aplicações que variam limites, níveis, templates, rotação ou enrichers por ambiente.
- Evidência: E3, E4, E5.
- Confiança: alta.
- Verificação: o arquivo chega ao diretório de execução, é carregado pelo `LogConfigurationBuilder` e valores definidos fluentemente têm precedência sobre os valores carregados antes deles.

### R5 — Compor cada mensagem como descrição curta seguida de `|`

- Regra: iniciar a mensagem com uma descrição clara e sucinta do evento e usar o primeiro caractere `|` para separar a descrição dos detalhes. Depois do separador, registrar contexto factual: identificadores, status, valores de variáveis, contagens, caminhos ou payloads formatados; os detalhes podem conter outros campos separados por `|`.
- Aplicabilidade: logs de domínio, integração, persistência, jobs, controllers e UI; a regra é obrigatória para código novo e para mensagens alteradas durante refatoração.
- Evidência: E9, E11, E12, E17.
- Confiança: alta.
- Verificação: a mensagem pode ser lida isoladamente antes do `|` e os detalhes podem ser filtrados no log viewer após o `|`; exemplos válidos incluem `Consulta analítica processada|DocumentType={DocumentType}` e `Request Soap XML|{RequestXml}`.

### R6 — Usar logging estruturado para os detalhes

- Regra: declarar placeholders nomeados na mensagem (`{JobId}`, `{Status}`, `{Payload}`) e passar os valores como argumentos separados. Não interpolar strings para montar a mensagem, não concatenar dados e não usar placeholders posicionais sem nome.
- Aplicabilidade: todos os níveis de `ILogger` e, especialmente, detalhes após `|`.
- Evidência: E10, E11, E18.
- Confiança: alta.
- Verificação: a mensagem preserva template e propriedades estruturadas; uma inspeção não encontra `$"..."` ou concatenação usados para produzir um novo log.

### R7 — Passar a exceção ao logger e manter a descrição legível

- Regra: em falhas, passar a instância da exceção como primeiro argumento (`LogError(ex, "Descrição|Detalhes")`) e registrar no texto somente o contexto adicional necessário. Não substituir o stack trace por `ex.Message` e não usar `LogError(ex.Message)` como forma principal de diagnóstico.
- Aplicabilidade: blocos `catch`, falhas de integração, banco, arquivos, jobs e processamento fiscal.
- Evidência: E10, E11, E18.
- Confiança: alta.
- Verificação: o `Exception` chega ao `LogError`/`LogWarning` e o template final inclui `{Exception}`; a mensagem não duplica manualmente o texto da exceção.

### R8 — Preservar o layout de campos separado por `|`

- Regra: manter o layout de arquivo `{Timestamp:dd-MM-yyyy HH:mm:ss.fff}|{SourceContext}|{MappedLevel,-5}|{ThreadId}|{Message:lj}{NewLine}{Exception}`, salvo configuração explícita do produto. Preservar o mapeamento de níveis `TRACE`, `DEBUG`, `INFO`, `WARNING`, `ERROR`, `FATAL`, o `SourceContext` e o `ThreadId`.
- Aplicabilidade: `LoggingSettings.json`, `LogConfigurationOptions.OutputTemplate` e qualquer override de template.
- Evidência: E4, E5, E9.
- Confiança: alta.
- Verificação: cada linha possui timestamp, categoria, nível, thread e mensagem em campos separados; exceções continuam disponíveis no final do evento.

### R9 — Usar separadores e logging HTTP somente pelos helpers comprovados

- Regra: usar `ILogger.AdicionarSeparador(...)` para blocos visuais e `LogarInformacoesIniciais()` uma vez na inicialização. Em ASP.NET, usar `UseRequestResponseLogging()` somente quando o payload HTTP precisar ser auditável e manter `UseSerilogRequestLogging()` para o logging nativo de requisições.
- Aplicabilidade: bootstrap, controllers, fluxos longos e pipeline ASP.NET.
- Evidência: E9, E12.
- Confiança: alta.
- Verificação: o middleware ignora arquivos estáticos, respeita `DisableRequestResponseLoggingAttribute` e `load_tests`, restaura o body da requisição/resposta e registra request/response no formato `descrição|payload`.

### R10 — Isolar criação de logger de bibliotecas internas sem DI

- Regra: em código interno que não recebe `ILogger<T>` por DI, usar `LibLoggerFactory.CreateLogger<T>()` ou `CreateLogger("Categoria")` após a inicialização da aplicação. Não construir sinks locais nem usar `NullLogger` deliberadamente para esconder falhas de registro.
- Aplicabilidade: bibliotecas em `_lib/**` sem composição direta pelo container.
- Evidência: E2, E14.
- Confiança: alta.
- Verificação: a categoria do logger corresponde ao tipo ou nome lógico do componente e a fábrica global foi inicializada no ponto de entrada.

### R11 — Verificar logs em testes com `CoLib.Logging.Fake`

- Regra: configurar `LibLoggerFactorySetup.SetupFakeLogger<T>()`, consultar `Logs`, `Debug`, `Information`, `Warning`, `Error` ou `Trace` e limpar o coletor entre cenários quando necessário.
- Aplicabilidade: testes unitários que verificam efeitos de logging ou código interno que usa `LibLoggerFactory`.
- Evidência: E15, E12.
- Confiança: alta.
- Verificação: o teste confirma nível, mensagem renderizada, separador e detalhes relevantes sem depender de arquivo físico.

### R12 — Redigir e limitar payloads de integração antes de logá-los

- Regra: para HTTP JSON ou `application/x-www-form-urlencoded`, reutilizar os helpers internos de redação e truncamento quando disponíveis; manter JSON compacto (`Formatting.None`) e nunca reimplementar mascaramento localmente sem necessidade.
- Aplicabilidade: clientes HTTP, middleware de request/response e logs de payloads que possam conter credenciais, API keys ou campos sensíveis.
- Evidência: E12, E24.
- Confiança: alta para os fluxos Flurl; média para outros fluxos, pois há logs existentes de XML bruto.
- Verificação: testes confirmam campos sensíveis redigidos, API key limitada ao sufixo permitido e tamanho máximo aplicado; o payload continua após `|` em formato legível.

## Padrões observados

- `CoLib.Logging` usa Serilog como implementação e registra o mesmo logger no `Microsoft.Extensions.Logging`; `LibLoggerFactory` começa com `NullLogger` e é inicializada durante o bootstrap.
- O caminho padrão é `PastasDoSistema.Logs`; `LOGGING_DEBUG_PATH` tem precedência para diagnóstico do processo. A subpasta padrão resolve para `{ApplicationName}`, mas os consumidores atuais usam nomes explícitos como `NotaFiscal.Api` e `NotaFiscal.Config`.
- O arquivo é diário, compartilhável entre processos por padrão, limitado por tamanho e retido/compactado conforme `LogConfigurationOptions`. A manutenção diária produz zips `yyyy-MM-dd.zip` e pode escrever `log-maintenance.logc`.
- Os detalhes observados incluem XML em `OuterXml`, JSON compacto com `Formatting.None`, corpos HTTP textuais, valores nomeados, contagens, status e caminhos. O separador continua sendo a fronteira visual do log viewer.
- O fluxo Flurl redige campos sensíveis e trunca conteúdo grande antes de registrar; isso é uma proteção específica do helper, não uma garantia automática de todo `ILogger`.
- `LoggerExtensions` padroniza logs iniciais de versão, sistema e cultura e usa `AdicionarSeparador` para delimitar blocos.

## Integrações e configuração

- ASP.NET: `builder.Host.UseLogging(...)` configura o logger; `app.UseRequestResponseLogging()` é o middleware interno opcional; `app.UseSerilogRequestLogging()` é o middleware adicional do pacote `Serilog.AspNetCore`.
- `NotaFiscal.Audit` é uma exceção observada: cria `LoggerFactory` local com `AddSimpleConsole` e `Spectre.Console`; não usar esse fluxo como padrão para novos executáveis sem decisão de produto.
- Windows Forms/DI: `services.AddLogging(...)` registra Serilog no container; `ILogger<T>` deve ser resolvido por DI.
- Configuração: `LoggingSettings.json` precisa ser copiado para a saída quando usado. `appsettings.json` com seção `Serilog` não substitui automaticamente a seção `Log` consumida pelo `LogConfigurationBuilder`; usar `WithConfiguration(builder.Configuration)` somente quando essa integração for deliberada.
- Ordem: configurar o logging antes de resolver serviços que escrevem logs, inicializar `LibLoggerFactory` por meio das extensões internas e chamar `LogarInformacoesIniciais()` após o container estar pronto.
- `SharedFile=true` executa manutenção no bootstrap e no primeiro evento do dia por meio de enricher; hooks de ciclo de vida só são usados quando `SharedFile=false`.

## Validação

- Inspecionar referências de projeto e pacotes para confirmar `CoLib.Logging` e, quando aplicável, `CoLib.Ambiente`, `CoLib.AspNet` e `CoLib.Logging.Fake`.
- Inspecionar o ponto de entrada para confirmar base path, subpasta, nome da aplicação e template `{ApplicationName}_{Date}.logc`.
- Inspecionar mensagens alteradas para confirmar `descrição|detalhes`, placeholders nomeados, payload formatado e overload de exceção.
- Executar testes existentes do componente alterado; para middleware, manter as verificações de corpo HTML omitido, JSON preservado e formato exato da mensagem.
- Se houver mudança de pacote, template, retenção, semântica de payload ou versão Microsoft/Serilog, tratar como decisão explícita e não como simples refatoração.
- Não presumir que todos os testes cobrem a infraestrutura física: a referência não possui teste direto completo de sink, rotação, zip ou configuração do builder; validar esses aspectos por inspeção de configuração ou teste existente quando o escopo os tocar.
