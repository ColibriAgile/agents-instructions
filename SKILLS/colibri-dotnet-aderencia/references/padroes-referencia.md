# Evidência dos repositórios de referência

A rubrica de `checklist.md` vem destes repositórios. A coleta foi feita em 04/11/2026.

| Repositório | Commit | Pasta de build |
| --- | --- | --- |
| `ColibriAgile/dconnect` | `31dfe531` | `_build/<Produto>/` |
| `ColibriAgile/pos-integration-service` (PIS) | `92d65703` | `.build/app/`, `.build/scripts/` |
| `ColibriAgile/back-office-connect` (BOC, `CboConnect.sln`) | `4c96eef2` | `.build/` |
| `ColibriAgile/dotnet-lib` | `b8bffb01` | — |

Os caminhos são relativos à raiz de cada repositório. Os números de linha valem para os commits acima. Se o alvo contradiz um item e existe um clone local da referência, abra o arquivo citado e confirme o padrão antes de classificar o item como ❌. Se a referência mudou, siga a referência atual e registre a diferença em "Limitações".

## Submódulos

- As 3 referências têm `_lib` → `dotnet-lib` e `_lib-inno` → `inno-lib` como gitlink.
- PIS e BOC usam URL SSH. O DConnect usa HTTPS com token na URL (`.gitmodules:1-6`); isto é um defeito, não um padrão.
- PIS: `Pos.Integration.Service.csproj:103-114` (`ProjectReference` de `CoLib.Ambiente`, `CoLib.AspNet`, `CoLib.Criptografia`, `CoLib.Logging` e outros) e `:129-136` (`.projitems` de `CoLib.Db/SqlServer`, `CoLib.Polly`, `CoLib.Polly/SqlServer`, `CoLib.Extensions/Flurl`, `pis.library`).
- DConnect: `DConnect.csproj:84-88` (`ProjectReference`) e `:129-143` (`.projitems` de `CoLib.Cis`, `CoLib.Polly`, `CoLib.Db`, `CoLib.Db.PGSql`, `CoLib.Licenciamento` e outros).
- BOC: todas as referências CoLib são `ProjectReference` (`CboConnect.Catalogs.csproj:52-54`, `CboConnect.Sales.csproj:37-40`).

## Logging

- DConnect `DConnect/Source/Program.cs:42-50`:

  ```csharp
  builder.Host.UseLogging(cfg => {
      cfg.WithLogPath(PastasDoSistema.Logs);
      cfg.WithLogSubFolderName("DConnect");
      cfg.WithApplicationName("DConnect");
      cfg.WithLogFileNameTemplate("{ApplicationName}_{Date}.logc");
  ```

- PIS `Source/Program.cs:52-60`: o mesmo padrão, com `cfg.WithConsole(!isRunningFromXUnit)`.
- BOC `CboConnect.Sales/Program.cs:51-58`: o mesmo padrão, e `logger.LogarInformacoesIniciais()` em `:87`.
- Nenhuma referência tem `PackageReference` direto de Serilog, com uma exceção no BOC (`CboConnect.Catalogs.csproj:25-26`). O `AGENTS.md` do BOC proíbe isto (`:64`). Não use a exceção como padrão.
- Padrões da lib: `_lib/CoLib.Logging/Configuration/LogConfigurationOptions.cs` (`MinimumLevel = Debug` em `:108`, rolagem diária em `:123`, zip diário em `:154`). Um `LoggingSettings.json` na pasta do executável é lido sozinho (`LogConfigurationBuilder.cs:43-51`).

## Portas

- A lib: `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs` (linhas no commit `a995c682` da `dotnet-lib`).
  - `ObterPorta(identificador, valorDefault)`: `:368`. Lê `[Portas] <identificador>` do `ncrmaster.cfg`, sem argumentos da linha de comando. Lança `InvalidOperationException` quando o valor está fora de 1 a 65535. É a leitura da porta própria de um produto novo (POR-01, POR-04).
  - Master: `master\config\ncrmaster.cfg`, seção `[Portas]`, com `LerComCommandLineArgs` (`:497-506`) para as propriedades tipadas. Por isso, `--<chave> N` na linha de comando muda essas portas.
- Leitura por nome: KDS `Kds/Program.cs:27`: `var porta = ConfiguracoesDeAmbiente.ObterPorta("kds", 6500);`. O Tablet e o Totem fazem igual. O Colibri Menu acrescentou `Portas.Menu` na lib (PR dotnet-lib#28) e reverteu (`a995c682`): a porta própria de um produto novo não entra na lib.
  - Cliente: `client\config\launcher.conexao`, objeto `portas` (`:523-599`).
  - `Portas.Cis` (chave `colibri_server`, padrão 4300), `Portas.Pis` (chave `pis`, padrão 5001), `UrlPis` (`:333`), classe `Ports` (`:658-668`).
- BOC `CboConnect.Sales/Program.cs:75-77`: `var porta = configuracoesDeAmbiente.Portas.CboConnect;` e `ConfigureKestrel(o => o.ListenAnyIP(porta))`.
- DConnect `DConnect/Source/Extensions.cs:80-91`: argumento `porta` → variável `porta_dconnect` → `config["Port"]` → `Portas.DConnect`; depois `UseUrls("http://localhost:{porta}/", "http://0.0.0.0:{porta}")`.
- PIS `Source/Program.cs:306-315`: argumento `-porta` → variável `porta_pis` → `config["Port"]` → `Portas.Pis`.
- Manifestos: DConnect `_build/DConnect/pacote/manifesto.server:36-42` (`nome "d-connect"`, `porta_default 5600`, `servico "colibri_dconnect"`); PIS `.build/app/pacote/manifesto.server:18-25`; BOC `.build/pacote/manifesto.server:31-38`.
- Porta fixa aceita só em `launchSettings.json` (DConnect `DConnect/Properties/launchSettings.json:9`). O PIS tem `"Port": 5002` em `appsettings.Development.json:8`.

## Banco de dados

- PIS `Source/Dados/Conexao.cs:34-50`: argumento → variável `string_conexao` → `ConfiguracoesDeAmbiente.InfoDeConexaoPOS.connString`, com `ResilientDbConnection` e `SqlClientRetryPolicy` (`CoLib.Polly.SqlServer`).
- BOC `SqlServerConnectionFactory.cs:24-31`: `InfoDeConexaoPOS.connString` e `new DapperConnection(new SqlConnection(...))`.
- DConnect `DConnect/Source/Dados/Conexao.cs:26-37`: `InfoDeConexaoPG.connString` (PostgreSQL, Npgsql).
- As 3 usam Dapper. O PIS configura `DefaultTypeMap.MatchNamesWithUnderscores = true` (`Startup.cs:98`). O `AGENTS.md` do PIS proíbe EF Core (`:18`).
- `_scripts/config.json` (PIS): `{"schema":"pis","pastas":[...]}`. O Master aplica os scripts.

## Publicação

- PIS `Pos.Integration.Service.csproj:16-21`: `PublishSingleFile=true`, `RuntimeIdentifier=win-x64`, `SelfContained=false` no Release.
- DConnect `build.yml:74-86` e BOC `build.yml:57-69`: `additional-publish-args: --property:PublishSingleFile=true --runtime win-x64`.
- A action `build-tools/.github/actions/publish-dotnet/action.yml:93-106` publica em `Release` com `DebugType=None` e `DebugSymbols=false`.
- DConnect `DConnect.csproj:118-127`: a SPA em `wwwroot/spa` com `ExcludeFromSingleFile`.
- Os manifestos declaram `"DotnetCore": "10.*"`.
- Plugins não são SingleFile: BOC `Plugin.CboConnect.csproj:15-16` (`win-x86`).

## Workflows

Todos usam `runs-on: [self-hosted, colibri]` e `ColibriAgile/build-tools/...@master`.

- `build.yml` (DConnect, BOC): `workflow_dispatch` + `push` em `production`. Passos: `checkout` (`ssh-private-key`, `repo-key`) → `versao-ini` (`ini-version-path`) → `publish-dotnet` (`csproj-file`, `target-folder`, `version`, `additional-publish-args`) → `release-github` (`version`, `iss-file`, `scripts-folder`, `source-folder`, `target-folder`, `repo-key`, `develop: ${{ github.ref != 'refs/heads/production' }}`). O PIS usa `build-dotnet-simples` e também dispara em `build`.
- `testes.yml` (as 3): `push` em `master`, `paths-ignore` (`.github/**`, `_scripts/**`), action `test-dotnet-mtp` com `project-suffix`, `upload-codecov: 'true'`, `codecov-token`, `repository-slug`, `verbosity: minimal`, `exclude-paths: '_lib, _lib-inno, _sdk'`. O DConnect tem também o job `spa` (`npm ci`, `npm run test`, `npm run build`).
- `deploy.yml` (as 3): `workflow_dispatch`, action `deploy-s3` (`aws_access_key_id`, `aws_secret_access_key`, `token`, `tag-prefix`).
- `limpar.yml` (as 3): `workflow_dispatch` (`keep_last`) + cron `0 5 */2 * *`, `uses: ColibriAgile/build-tools/.github/workflows/limpar-historico.yml@master`, `secrets: inherit`.
- `notificar-chat.yml` (as 3): `workflow_run` `completed` de Build, Deploy e Testes, `uses: .../chats.yml@master`.
- `build-scripts.yml` (PIS): os `_scripts` com `versao.ini` próprio e `tag-prefix: scripts`.

## Testes

- `global.json` (as 3): `{"test": {"runner": "Microsoft.Testing.Platform"}}`.
- Pacotes (as 3): `xunit.v3` 4.0.2, `Microsoft.Testing.Extensions.CodeCoverage`, Shouldly, NSubstitute. DConnect e PIS também usam `Verify.XunitV3` e AutoBogus.
- As 3 ainda têm `Microsoft.NET.Test.Sdk` e `xunit.runner.visualstudio`. Isto é resíduo de VSTest: não copie para um projeto novo.
- Sufixo: `.Testes` (DConnect, PIS) ou `.Tests` (BOC). O `project-suffix` do `testes.yml` segue o nome.
- PIS `Pos.Integration.Service.Testes.csproj:83-96`: `CoLib.Logging.Fake`, `CoLib.xUnit`, `CoLib.Shouldly`, `CoLib.Verify.Extensions`.

## Serviço do Windows

- As 3 usam NSSM. Nenhuma usa `UseWindowsService` nem Topshelf.
- DConnect `_build/DConnect/dconnect.iss:55-66`: `nssm.ex_` como `DConnectService.exe`, `install colibri_dconnect`, `DisplayName "» Colibri DConnect"`, `DependOnService LanmanServer`, `AppNoConsole 1`, `AppStderr {app}\logs\DConnect\service_stderr.log`.
- BOC `.build/cboconnect.iss:48-71`: `AppThrottle`, `AppRestartDelay`, `AppExit Restart`; na desinstalação, `sc stop` e `sc delete`.
- PIS `.build/app/pis.iss:47-61`: o NSSM usa `colibri_pis`, mas o manifesto declara `pos_integration_service`. Isto é um defeito do PIS.

## Endpoints transversais

- `/ping`: `app.AddPingEndpoint()` (`_lib/CoLib.AspNet/PingEndpointExtensions.cs:15-17`), em DConnect e PIS.
- `/healthz` com `UIResponseWriter`: DConnect `Program.cs:117-125`, PIS `Program.cs:149-153`.
- Handler global: `AddGlobalExceptionHandler` e `EnableGlobalExceptionHandler` (DConnect `Extensions.cs:325-339`).

## Convenções do repositório

- `AGENTS.md` nas 3. O `CLAUDE.md` contém `AGENTS.md` (DConnect, BOC) ou é symlink (PIS).
- `.editorconfig`: DConnect (`charset = utf-8-bom`, `indent_size = 4`, `:42-44`, mais severidades CA, IDE e RCS). O do PIS só tem supressões de regras (RCS, IDE, S, CA), sem `charset` nem `indent_size`.
- `renovate.json`: DConnect (`config:recommended`, submódulos ligados, `automerge false`).
- csproj: `net10.0`, `Nullable enable`, `ImplicitUsings enable`, `LangVersion preview`.
- `Directory.Build.props`, `Directory.Packages.props` e `TreatWarningsAsErrors`: não existem nas 3.
- `.gitattributes`: `*.verified.txt eol=lf` (DConnect, PIS).
