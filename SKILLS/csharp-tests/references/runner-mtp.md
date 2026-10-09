# Runner: VSTest ou Microsoft.Testing.Platform

Leia este arquivo antes de criar ou editar qualquer projeto de teste. Abra o `.csproj` e identifique o runner; as regras da seção "Projeto migrado" só valem para ele.

## Identificação pelo `.csproj`

- Referencia `xunit.v3` (com `<UseMicrosoftTestingPlatformRunner>true</UseMicrosoftTestingPlatformRunner>`) → **migrado**, roda sob Microsoft.Testing.Platform (MTP).
- Referencia `xunit` sem `.v3` e `Microsoft.NET.Test.Sdk` → **legado**, roda sob VSTest. Nada abaixo em "Projeto migrado" se aplica.

## Projeto migrado (MTP)

- `ITestOutputHelper` vem de `Xunit`, não de `Xunit.Abstractions`.
- Toda assinatura de teste retorna `Task` ou `ValueTask`; MTP falha rápido em `async void`.
- `IAsyncLifetime.InitializeAsync`/`DisposeAsync` retornam `ValueTask`. Coloque toda limpeza obrigatória em `DisposeAsync`: se a fixture implementa `IDisposable` e `IAsyncDisposable` juntos, só `DisposeAsync` roda.
- Novo projeto de teste: `<OutputType>Exe</OutputType>` e `<UseMicrosoftTestingPlatformRunner>true</UseMicrosoftTestingPlatformRunner>` no `.csproj`, pacotes `xunit.v3` + `xunit.runner.visualstudio`, cobertura via `Microsoft.Testing.Extensions.CodeCoverage`. Nunca `coverlet.collector`, que não roda sob MTP.

## Argumentos de execução

Após um build válido, use `--no-build --no-restore --nologo` em ambos os runners.

- **Legado (VSTest):** some `--logger "console;verbosity=minimal"`.
- **Migrado (MTP):** `--logger` não existe. Use um reporter (ex. `--report-trx`, requer `Microsoft.Testing.Extensions.TrxReport`). Em SDK 9 ou anterior, separe os argumentos da plataforma com `--`:

  ```
  dotnet test --no-build --no-restore --nologo -- --report-trx
  ```

## Checklist de migração

Em projeto migrado, nenhum teste novo pode usar `async void`, o namespace antigo de `ITestOutputHelper` ou `coverlet.collector`.
