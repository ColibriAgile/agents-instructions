---
applyTo: "**/*.{cs,json,csproj}"
---

# Guardrails de refatoração: padrão de geração de logs Colibri

## Invariantes de paridade

### G1 — Preservar a pasta e o nome do arquivo por aplicação

- Condição protegida: os logs continuam em `PastasDoSistema.Logs\<subpasta-da-aplicação>` e usam `<ApplicationName>_<yyyyMMdd>.logc`, sem misturar aplicações na mesma subpasta por acidente.
- Evidência: E3, E5, E6, E7.
- Verificação: resolver o caminho com as mesmas opções e confirmar a extensão `.logc`, a data diária e a subpasta esperada.

### G2 — Preservar a fronteira `descrição|detalhes`

- Condição protegida: a primeira parte da mensagem continua sendo uma descrição curta e legível; o caractere `|` separa essa descrição de identificadores, variáveis, status ou payloads.
- Evidência: E9, E11, E12, E17.
- Verificação: revisar cada mensagem nova ou alterada e rejeitar texto genérico, descrição depois dos detalhes ou separadores substituídos por `:`/`,` quando o evento possuir contexto.

### G3 — Preservar logging estruturado e exceções completas

- Condição protegida: placeholders permanecem nomeados, argumentos continuam separados e o objeto `Exception` é entregue ao logger para preservar stack trace e evento original.
- Evidência: E10, E11, E18.
- Verificação: procurar interpolação, concatenação, `LogError(ex.Message)` e `LogError(ex, $"...")` no escopo alterado; confirmar overload com exceção nos catches.

### G4 — Preservar o layout consumido pelo log viewer

- Condição protegida: timestamp, `SourceContext`, nível mapeado, thread e mensagem permanecem campos separados por `|`; `{Exception}` continua sendo emitido pelo template.
- Evidência: E4, E5.
- Verificação: comparar `OutputTemplate` antes e depois ou validar uma linha real/fixture com os cinco campos e exceção.

### G5 — Preservar a configuração única do logger

- Condição protegida: a aplicação não cria um segundo `LoggerConfiguration`, provider ou sink que duplique linhas, altere o template ou bypass a inicialização de `LibLoggerFactory`.
- Evidência: E2, E13, E14, E19.
- Verificação: confirmar um único ponto de configuração no entry point e que consumidores usam `ILogger<T>`/`LibLoggerFactory`.

### G6 — Preservar manutenção, retenção e concorrência dos arquivos

- Condição protegida: rolling diário, `SharedFile`, compactação, limpeza semanal, auditoria e retry de arquivos em uso mantêm a semântica configurada.
- Evidência: E4, E16.
- Verificação: quando o escopo tocar `LogConfigurationBuilder` ou `Configuration/**`, validar bootstrap, primeiro evento do dia, arquivo compartilhado, zip, auditoria e falha de arquivo em uso.

### G7 — Preservar filtragem de payload HTTP

- Condição protegida: request/response logging continua ignorando arquivos estáticos, respeitando `DisableRequestResponseLoggingAttribute` e a chave `load_tests`, omitindo HTML e restaurando os streams.
- Evidência: E12.
- Verificação: manter os testes existentes de HTML, JSON e captura do corpo; qualquer alteração no middleware exige teste equivalente.

### G8 — Preservar a testabilidade do logging interno

- Condição protegida: código que usa `LibLoggerFactory` continua substituível por `FakeLogger` sem depender de arquivos físicos.
- Evidência: E15.
- Verificação: executar os testes que usam `SetupFakeLogger<T>()` e confirmar níveis/mensagens capturados.

### G9 — Preservar exceções operacionais explicitamente delimitadas

- Condição protegida: `NotaFiscal.Audit` continua reconhecido como ferramenta console com `AddSimpleConsole`, enquanto os demais hosts seguem `CoLib.Logging`; não converter ou copiar esse fluxo por acidente.
- Evidência: E22, E23.
- Verificação: se `NotaFiscal.Audit` for alterado, registrar decisão explícita sobre arquivo `.logc`, pasta, retenção e compatibilidade operacional antes de trocar o provider.

### G10 — Preservar redação e limite dos payloads

- Condição protegida: payloads HTTP que passam pelos helpers Flurl continuam com campos sensíveis redigidos, API keys limitadas e conteúdo excessivo truncado antes da escrita.
- Evidência: E24.
- Verificação: executar os testes de payload JSON/API key e revisar qualquer novo caminho de logging de corpo antes de permitir dados brutos.

## Mudanças que exigem escalonamento

- Trocar Serilog, `CoLib.Logging`, `Microsoft.Extensions.Logging` ou qualquer sink/enricher sem decisão sobre compatibilidade de template, ciclo de vida e versões.
- Alterar `LogFileNameTemplate`, extensão `.logc`, `LogSubFolderName`, `PastasDoSistema.Logs`, `SharedFile`, `RollingInterval`, retenção, compactação ou `MaintenanceAuditFileName`.
- Introduzir uma configuração concorrente em `appsettings.json`, `Serilog.Log.Logger`, `AddSerilog` ou `UseSerilog` sem demonstrar que não haverá duplicidade.
- Alterar um payload logado, seu formato XML/JSON, ou incluir dados potencialmente sensíveis sem decisão explícita de segurança e retenção.
- Resolver silenciosamente a divergência entre versões `10.0.10` e `10.0.11` dos pacotes Microsoft; a referência não comprova uma versão única para todos os consumidores.
- Transformar mensagens antigas sem `|`, interpoladas ou que registram apenas `ex.Message` em uma migração ampla; delimitar o escopo e preservar o comportamento funcional antes de normalizar os demais pontos.
- Fazer a API usar `appsettings.json` como fonte principal no lugar de `LoggingSettings.json` sem validar a precedência do `LogConfigurationBuilder` e o efeito de `UseSerilogRequestLogging`.
- Remover ou generalizar a redação de campos sensíveis dos helpers Flurl, ou ampliar logs de payload sem revisar truncamento, retenção e dados expostos.
- Converter `NotaFiscal.Audit` ou o logger temporário de bootstrap da API para o padrão compartilhado sem validar o motivo operacional da exceção e a ordem de inicialização.

## Gates de validação

1. Confirmar que o entry point usa as extensões de `CoLib.Logging` e que o container resolve `ILogger<T>`.
2. Confirmar o caminho `<base>\logs\<subpasta>` e o padrão `<ApplicationName>_<yyyyMMdd>.logc`.
3. Confirmar `OutputTemplate` com timestamp, categoria, nível, thread, mensagem e exceção separados por `|`.
4. Revisar logs novos/alterados para `descrição curta|detalhes`, placeholders nomeados, payloads formatados e overload de exceção.
5. Executar os testes existentes do componente; para ASP.NET, preservar os testes do middleware e, para bibliotecas internas, os testes com `CoLib.Logging.Fake`.
6. Se o escopo tocar manutenção de arquivos, validar rotação, zip, auditoria, retry e concorrência sem depender apenas de inspeção de compilação.

## Limites do escopo

- Incluído: `CoLib.Logging`, `CoLib.Ambiente.PastasDoSistema`, `CoLib.AspNet` request/response logging, `CoLib.Logging.Fake`, entry points de `NotaFiscal.Api` e `NotaFiscal.Config`, projetos consumidores e mensagens no padrão observado.
- Incluído: nome da pasta, nome do arquivo, extensão, rolling, layout textual, structured logging, exceções e payloads.
- Exceções observadas: logger temporário de console no bootstrap de `NotaFiscal.Api` e `NotaFiscal.Audit` como ferramenta console; qualquer normalização exige decisão.
- Lacuna: não há repositório-alvo separado nem confirmação de uma versão consolidada dos pacotes Microsoft para todos os projetos; a decisão deve ser tomada pelo agente responsável pela refatoração.
- Lacuna: a referência contém usos legados sem `|`, interpolação e `ex.Message`; este documento define o padrão para código novo/refatorado, mas não comprova uma migração total do legado.
- Lacuna: não foi comprovada uma política de mascaramento de CPF/CNPJ, tokens, credenciais ou outros dados sensíveis nos payloads; qualquer exposição deve ser escalada.
- Lacuna: a proteção de payloads é comprovada para os helpers Flurl, mas não para todos os logs XML/JSON do repositório.
