# Checklist de aderência .NET Colibri

Este arquivo é a rubrica da skill. Cada item tem um ID estável. Use o mesmo ID no relatório, numa reavaliação e nas tasks de correção.

## Índice

1. [Como ler um item](#como-ler-um-item)
2. [SUB — Submódulos](#sub--submódulos)
3. [LOG — Logging](#log--logging)
4. [POR — Portas](#por--portas)
5. [DB — Banco de dados](#db--banco-de-dados)
6. [PUB — Publicação e pacote](#pub--publicação-e-pacote)
7. [CI — Workflows](#ci--workflows)
8. [TST — Testes](#tst--testes)
9. [SRV — Serviço do Windows](#srv--serviço-do-windows)
10. [API — Endpoints transversais](#api--endpoints-transversais)
11. [LIB — Reúso da dotnet-lib](#lib--reúso-da-dotnet-lib)
12. [REP — Convenções do repositório](#rep--convenções-do-repositório)
13. [SEC — Segredos](#sec--segredos)
14. [Mapa de execução](#mapa-de-execução)

## Como ler um item

Cada item tem estes campos:

- **Regra**: o que o padrão pede.
- **Verificar**: o campo do inventário (`inventario.py`) ou a leitura que comprova o status.
- **Força**: `comum` quando as 3 referências seguem a regra; `parcial` quando só 1 ou 2 seguem. Um item `parcial` não reprova o alvo: ele recebe ⚠️ e vira convenção a escolher.
- **Sev.**: a severidade padrão quando o status é ❌. Ajuste a severidade só com motivo escrito no relatório.
- **N/A quando**: a condição em que o item não se aplica ao alvo.

Severidades:

| Sev. | Critério |
| --- | --- |
| 🔴 Bloqueador | Um clone limpo não compila, o CI da Colibri não roda, o pacote do Master não sai, ou há segredo no repositório. |
| 🟠 Alta | O alvo diverge de uma regra `comum` com impacto em operação, instalação ou suporte. |
| 🟡 Média | O alvo diverge de uma convenção ou reimplementa algo que a `dotnet-lib` já tem. |
| ⚪ Baixa | Limpeza ou alinhamento sem impacto em operação. |

Status: ✅ conforme · ⚠️ parcial · ❌ não conforme · N/A não se aplica · ❓ decisão documentada do produto · 🔍 não verificado.

## SUB — Submódulos

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| SUB-01 | O `_lib` (`ColibriAgile/dotnet-lib`) é um submódulo registrado: existe gitlink `160000` e a pasta tem conteúdo. | `git.gitlinks`, `git.submodules`, `git.pastas_de_submodulo` | comum | 🔴 | O alvo não usa nenhum `CoLib.*`. Mesmo assim, registre como ❌ alta se o alvo reimplementa porta, conexão ou log. |
| SUB-02 | O `_lib-inno` (`ColibriAgile/inno-lib`) é um submódulo registrado quando existe `.iss`. | `git.gitlinks`, `build.iss[].includes` | comum | 🔴 | Não há instalador Inno Setup. |
| SUB-03 | Os `CoLib.*` entram por `ProjectReference` ou `<Import ... .projitems Label="Shared">`. Não há `PackageReference` de CoLib nem cópia do código da lib dentro do alvo. | `csproj[].project_references`, `csproj[].imports`, `csproj[].packages` | comum | 🟠 | — |
| SUB-04 | A URL do submódulo usa SSH (`ssh://git@github.com/ColibriAgile/...`) e não tem credencial. | `git.submodules[].url_tem_credencial` | parcial (DConnect usa HTTPS com token) | 🔴 se tem credencial; ⚪ se só usa HTTPS | — |

## LOG — Logging

Regras completas: skill `colibri-logging` (`references/rules.md`). A tabela abaixo é o recorte que a auditoria confere.

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| LOG-01 | O host chama `UseLogging(...)` da `CoLib.Logging`. Em WinForms ou DI sem host, `services.AddLogging(...)` da lib. | `sinais.use_logging`, `sinais.add_logging` | comum | 🟠 | — |
| LOG-02 | Não existe segundo `LoggerConfiguration` nem `PackageReference` direto de `Serilog*` no alvo. | `sinais.logger_configuration`, `csproj[].packages` | comum | 🟡 | — |
| LOG-03 | A pasta é `PastasDoSistema.Logs` com uma subpasta exclusiva (`WithLogSubFolderName`). | `sinais.pastas_do_sistema_logs`, `sinais.log_subfolder` | comum | 🟠 | — |
| LOG-04 | O arquivo segue `{ApplicationName}_{Date}.logc`. | `sinais.log_template_logc` | comum | 🟠 | — |
| LOG-05 | As mensagens seguem `descrição\|detalhes`. | `sinais.log_calls.total` contra `sinais.log_calls.com_pipe` | regra da `colibri-logging` | 🟡 | — |
| LOG-06 | A exceção é o primeiro argumento (`LogError(ex, ...)`). `ex.Message` não substitui a exceção. | `sinais.log_calls.ex_message` | regra da `colibri-logging` | 🟡 | — |
| LOG-07 | A mensagem não usa interpolação (`$"..."`) nem concatenação. | `sinais.log_calls.interpolados` | regra da `colibri-logging` | 🟡 | — |
| LOG-08 | O bootstrap chama `LogarInformacoesIniciais()` depois do `Build()`. | `sinais.logar_informacoes_iniciais` | parcial (BOC) | ⚪ | — |
| LOG-09 | O console de log fica desligado nos testes (`WithConsole(!isRunningFromXUnit)` ou `EnableConsole: false`). | leitura do `Program.cs` e do `LoggingSettings.json` | parcial (DConnect, PIS) | ⚪ | — |

## POR — Portas

Regras completas: skill `colibri-ports`.

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| POR-01 | A porta HTTP do próprio serviço vem de `ConfiguracoesDeAmbiente.ObterPorta("<nome no Master>", <padrão>)`, como no Tablet, no KDS e no Totem. Um produto que já tinha a propriedade tipada `Portas.<Produto>` na lib antes desta regra (DConnect, PIS, BOC, D-Mock) pode continuar a usá-la. | `sinais.configuracoes_de_ambiente`, `sinais.obter_porta`, `sinais.kestrel` | comum | 🟠 | O alvo não abre porta HTTP (console, worker, plugin). |
| POR-02 | Não existe porta fixa no código nem em `appsettings*.json`. O `launchSettings.json` pode ter porta de desenvolvimento. | `config_json[]`, `sinais.porta_literal` | comum | 🟠 (código ou `appsettings.json`); ⚪ (`appsettings.Development.json`) | Igual a POR-01. |
| POR-03 | O `manifesto.server` declara `portas[]` com `nome`, `porta_default` e `servico`. O `nome` é a chave lida no código e o `porta_default` é o padrão do código. | `build.manifestos[].portas` contra o código | comum | 🟠 | Igual a POR-01. |
| POR-04 | Um produto novo não acrescenta a própria porta na `dotnet-lib`: nem propriedade tipada `Portas.<Produto>`, nem constante `PORTA_<PRODUTO>_DEFAULT`. Ele lê a porta pelo nome cadastrado no Master (POR-01). Motivo: a lib não conhece cada aplicação, e uma porta tipada pede uma linha nova na lib para cada produto. A leitura tipada também usa `LerComCommandLineArgs`, e assim um argumento `--<chave>` da linha de comando passa a mudar a porta. | busca no alvo por `Portas.<Produto>`, `PORTA_<PRODUTO>_DEFAULT` e `LerComCommandLineArgs` para a porta própria | comum | 🟡 | Igual a POR-01. O produto já tinha a propriedade tipada antes desta regra (ver POR-01): marque ✅. Se o alvo acrescentou a própria porta na lib, marque ❌: a correção é voltar a `ObterPorta`. Reverter a lib é opcional e pede autorização. |
| POR-05 | As portas e os hosts de serviços consumidos (CIS, PIS, Master) vêm de `ConfiguracoesDeAmbiente` (`Portas.Cis`, `Portas.Pis`, `UrlPis`, `Master.Servidor`). O alvo não guarda estes valores em configuração própria. | `sinais.porta_literal`, leitura dos clientes HTTP | comum | 🟠 | O alvo não consome serviços Colibri. |
| POR-06 | A precedência é argumento → variável de ambiente → `config["Port"]` → `ConfiguracoesDeAmbiente`. | leitura do bootstrap | parcial (DConnect, PIS; o BOC usa só `ConfiguracoesDeAmbiente`) | ⚪ | Igual a POR-01. |

## DB — Banco de dados

Regras completas: skill `colibri-connection-string`.

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| DB-01 | A conexão vem de `ConfiguracoesDeAmbiente.InfoDeConexaoPOS` (SQL Server) ou `InfoDeConexaoPG` (PostgreSQL). | `sinais.info_de_conexao` | comum | 🟠 | O alvo não acessa banco. |
| DB-02 | Não existe `ConnectionStrings` em `appsettings*.json`, `GetConnectionString`, nem parser próprio de `ncrmaster.cfg` ou `launcher.conexao`. | `sinais.connection_strings`, `sinais.parser_proprio`, `config_json[]` | comum | 🟠 | Igual a DB-01. |
| DB-03 | O alvo usa a string que a lib entrega e não monta outra string de conexão. | leitura do ponto de composição | comum | 🟡 | Igual a DB-01. |
| DB-04 | O acesso a dados usa Dapper. Não usa EF Core. | `csproj[].packages` (`Dapper`, `Microsoft.EntityFrameworkCore*`), `sinais.db_context` | comum | 🟠 | Igual a DB-01. Quase sempre é ❓: confirme com o produto antes de propor migração. |
| DB-05 | A conexão SQL Server tem retry pela `CoLib.Polly.SqlServer` (`ResilientDbConnection`). | `csproj[].imports`, `sinais.resilient_db_connection` | parcial (PIS) | ⚪ | O banco é só PostgreSQL. |
| DB-06 | A aplicação não cria banco nem tabela em runtime (`Migrate()`, `EnsureCreated()`, `CREATE TABLE` no código). O DDL fica em `_scripts/` com `config.json` (`schema`, `pastas`), e o Master aplica. | `sinais.ddl_em_runtime`, `build.scripts_config` | comum | 🟠 | O alvo não tem banco próprio. |
| DB-07 | A precedência é argumento → variável `string_conexao` → `ConfiguracoesDeAmbiente`. | leitura do ponto de composição | parcial (PIS) | ⚪ | Igual a DB-01. |

## PUB — Publicação e pacote

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| PUB-01 | A publicação depende do framework (`SelfContained` falso ou ausente), e o `manifesto.server` declara `"DotnetCore": "<versão>.*"`. | `csproj[].props`, `workflows[].publish_args`, `build.manifestos[].dependencias` | comum | 🟠 | — |
| PUB-02 | O executável sai como SingleFile `win-x64` (`PublishSingleFile=true`), no csproj ou no `additional-publish-args`. | `csproj[].props.PublishSingleFile`, `workflows[].publish_args`, scripts de publish | comum | 🟠 | Plugin carregado por outro processo (biblioteca `x86`/`x64`). |
| PUB-03 | O workflow publica pela action `publish-dotnet` (ou `build-dotnet-simples`) do `build-tools`. | `workflows[].uses` | comum | 🟡 | — |
| PUB-04 | A versão tem uma fonte: `versao.ini` com `[versaoinfo]` `MajorVersion`, `MinorVersion`, `Release`. | `build.versao_ini[]` | comum | 🟠 | — |
| PUB-05 | O `.iss` usa o `_lib-inno` (`#define PastaInno` e `#include` de `ano.iss`, `register.iss`, `pasta_base.iss`, `servico.iss`). | `build.iss[].includes` | comum | 🟡 | Não há instalador. |
| PUB-06 | O `manifesto.server` tem `arquivos`, `dependencias`, `nome`, `produto` e `sistema`. | `build.manifestos[]` | comum | 🟠 | Não há pacote do Master. |

Bloqueadores conhecidos de SingleFile (confira cada um antes de marcar PUB-02 como inviável):

- `Assembly.Location` ou `Assembly.GetExecutingAssembly().Location` retorna texto vazio em SingleFile. Use `AppContext.BaseDirectory`. Sinal: `sinais.assembly_location`.
- DLL nativa (SkiaSharp, SQLite, e outras): use `IncludeNativeLibrariesForSelfExtract=true` ou deixe a DLL ao lado do executável.
- Conteúdo estático (`wwwroot`, SPA): marque com `ExcludeFromSingleFile` e deixe no disco. O DConnect faz isto com a SPA.
- Carga dinâmica de assembly por caminho (`Assembly.LoadFrom`, plugins): pede análise caso a caso.

## CI — Workflows

Todos os workflows das referências usam `runs-on: [self-hosted, colibri]` e actions `ColibriAgile/build-tools/.github/actions/<nome>@master`.

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| CI-01 | `build.yml`: `workflow_dispatch` e `push` em `production`. Passos: `checkout` → `versao-ini` → `publish-dotnet` → `release-github` (com `develop: ${{ github.ref != 'refs/heads/production' }}`). | `workflows[]` com nome `build.yml` | comum | 🔴 se ausente; 🟠 se existe mas diverge ou está desligado | — |
| CI-02 | `testes.yml`: `push` em `master` com `paths-ignore` (`.github/**`, `_scripts/**`), action `test-dotnet-mtp` com `project-suffix`, `exclude-paths` (`_lib, _lib-inno, _sdk`), `upload-codecov` e `repository-slug`. | `workflows[]` com nome `testes.yml` | comum | 🔴 | O alvo não tem projeto de testes. Neste caso, registre TST-01 como ❌. |
| CI-03 | `deploy.yml`: `workflow_dispatch` com a action `deploy-s3`. | `workflows[]` com nome `deploy.yml` | comum | 🟠 | — |
| CI-04 | `limpar.yml`: cron `0 5 */2 * *` e o workflow reutilizável `limpar-historico.yml@master` (`keep_last` 5). | `workflows[]` com nome `limpar.yml` | comum | ⚪ | — |
| CI-05 | `notificar-chat.yml`: `workflow_run` dos workflows de build, deploy e testes, com `chats.yml@master`. | `workflows[]` com nome `notificar-chat.yml` | comum | ⚪ | — |
| CI-06 | Partes que não são .NET (SPA, Worker, scripts Node) têm um job de teste no `testes.yml`. | `arquivos.package_json[]` contra os jobs do `testes.yml` | parcial (DConnect) | 🟡 | Não há código Node ou frontend. |
| CI-07 | Quando os `_scripts` têm versão própria, existe `build-scripts.yml` com `tag-prefix: scripts`. | `workflows[]` | parcial (PIS) | ⚪ | Os scripts viajam no mesmo pacote. |

## TST — Testes

Regras completas: skills `atualizar-testes-mtp` e `csharp-tests`.

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| TST-01 | Os testes usam `xunit.v3` com Microsoft.Testing.Platform (MTP). | `csproj[].packages` (`xunit.v3`, `xunit`) | comum | 🔴 (o `test-dotnet-mtp` exige MTP) | — |
| TST-02 | O `global.json` tem `"test": {"runner": "Microsoft.Testing.Platform"}`. | `raiz.global_json` | comum | 🔴 | — |
| TST-03 | A cobertura usa `Microsoft.Testing.Extensions.CodeCoverage`. Não há `coverlet.collector`. | `csproj[].packages` | comum | 🟡 | — |
| TST-04 | Não há resíduo de VSTest (`Microsoft.NET.Test.Sdk`, `xunit.runner.visualstudio`). | `csproj[].packages` | regra da `atualizar-testes-mtp` (as 3 referências ainda têm o resíduo) | ⚪ | — |
| TST-05 | As asserções usam Shouldly. A referência a NSubstitute só existe quando algum teste a usa (`Substitute.For`): referência sem uso é ❌. Dublês feitos à mão são aceitos; a rubrica não exige trocá-los por NSubstitute. | `csproj[].packages`, `sinais.assert_classico`, busca de `Substitute.For` nos testes | comum | 🟡 | NSubstitute: nenhum teste usa `Substitute.For`. |
| TST-06 | O nome dos projetos de teste tem um sufixo único, igual ao `project-suffix` do `testes.yml`. | `csproj[]` com `is_test`, `workflows[]` | parcial (`.Testes` em DConnect e PIS; `.Tests` no BOC) | ⚪ | — |
| TST-07 | Os testes de banco leem `DbServer`, `DbName`, `DbUser`, `DbPassword` de variável de ambiente (padrão `DbFixture`). Nenhuma credencial fica no repositório. | leitura das fixtures | regra da `colibri-connection-string` | 🟡 | Não há teste de banco. |
| TST-08 | A referência a `CoLib.Logging.Fake` só existe quando algum teste a usa: referência sem uso é ❌. Testes de log com captura própria são aceitos. Os utilitários de teste vêm de `CoLib.xUnit` e `CoLib.Shouldly` por `.projitems`. | `csproj[].project_references`, `csproj[].imports`, busca de uso do `CoLib.Logging.Fake` nos testes | parcial (PIS, DConnect) | ⚪ | `CoLib.Logging.Fake`: nenhum teste o usa. |

## SRV — Serviço do Windows

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| SRV-01 | O `.iss` instala o serviço pelo NSSM: copia `nssm.ex_` como `<Produto>Service.exe` e executa `install <servico>`, `DisplayName "» Colibri <Produto>"`, `AppNoConsole 1`. | `build.iss[].nssm` | comum | 🟠 | O alvo não roda como serviço. |
| SRV-02 | O nome do serviço no NSSM é igual ao `servico` do `manifesto.server`. | `build.iss[].nssm` contra `build.manifestos[].portas[].servico` | comum (o PIS diverge e é defeito) | 🟡 | Igual a SRV-01. |
| SRV-03 | O `AppStderr` do NSSM grava na pasta de logs do produto. | `build.iss[].nssm` | parcial (DConnect, PIS) | ⚪ | Igual a SRV-01. |
| SRV-04 | O código não usa `UseWindowsService` nem Topshelf: com NSSM, o processo roda como console. | `sinais.use_windows_service`, `csproj[].packages` | comum | ⚪ | O alvo não usa NSSM. |

## API — Endpoints transversais

Aplique esta seção só a hosts ASP.NET. Para console, worker e WinForms, marque N/A.

| ID | Regra | Verificar | Força | Sev. |
| --- | --- | --- | --- | --- |
| API-01 | `app.AddPingEndpoint()` da `CoLib.AspNet` expõe `/ping`. | `sinais.add_ping_endpoint` | parcial (DConnect, PIS) | ⚪ |
| API-02 | `/healthz` com health checks (memória, rede, banco). | `sinais.health_checks` | parcial (DConnect, PIS) | ⚪ |
| API-03 | O handler global de exceção vem da `CoLib.AspNet` (`AddGlobalExceptionHandler`). | `sinais.global_exception_handler` | parcial (DConnect) | ⚪ |

## LIB — Reúso da dotnet-lib

| ID | Regra | Verificar | Força | Sev. | N/A quando |
| --- | --- | --- | --- | --- | --- |
| LIB-01 | O cliente do CIS vem da `CoLib.Cis` (`ClientCis`). | `csproj[].imports`, classes `*Cis*Client*` no alvo | parcial (DConnect) | 🟡 | O alvo não fala com o CIS. |
| LIB-02 | O cliente do PIS vem da `Pis.Library`. | `csproj[].imports`, classes `*Pis*Client*` no alvo | parcial (PIS) | 🟡 | O alvo não fala com o PIS. |
| LIB-03 | A resiliência HTTP usa `CoLib.Polly` ou `Microsoft.Extensions.Http.Resilience`. Não usa `Polly.Extensions.Http` (descontinuado). | `csproj[].packages`, `csproj[].imports` | comum | 🟠 | O alvo não tem cliente HTTP. |
| LIB-04 | Criptografia, licença e acesso ao Colibri usam `CoLib.Criptografia`, `CoLib.Licenciamento` e `CoLib.Colibri` quando a função existe na lib. | `csproj[].project_references`, `csproj[].imports`, leitura do alvo | parcial | 🟡 | — |
| LIB-05 | As versões de pacotes da mesma família (`Microsoft.Extensions.*`, `Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*`) estão alinhadas. | `csproj[].packages` | comum | ⚪ | — |

## REP — Convenções do repositório

| ID | Regra | Verificar | Força | Sev. |
| --- | --- | --- | --- | --- |
| REP-01 | Existe `AGENTS.md` com as regras do projeto, e `CLAUDE.md` aponta para ele (conteúdo `AGENTS.md` ou symlink). | `raiz.agents_md`, `raiz.claude_md` | comum | 🟠 |
| REP-02 | Existe `.editorconfig` com as severidades de análise (CA, IDE, RCS). O DConnect também fixa `charset = utf-8-bom` e `indent_size = 4`. | `raiz.editorconfig` | parcial (existe em DConnect e PIS; só o DConnect fixa charset e indentação) | 🟡 |
| REP-03 | Existe `renovate.json` com atualização de submódulos. | `raiz.renovate` | parcial (DConnect) | ⚪ |
| REP-04 | Os projetos usam o `TargetFramework` atual da Colibri (`net10.0`; plugin `net10.0-windows`), `Nullable enable` e `ImplicitUsings enable`. | `csproj[].props` | comum | 🟠 (framework antigo); ⚪ (Nullable, ImplicitUsings) |
| REP-05 | `LangVersion` igual às referências (`preview`). | `csproj[].props`, `raiz.directory_build_props` | comum | ⚪ |
| REP-06 | Existe `skills.yaml` com os bundles `core` e `dotnet`. | `raiz.skills_yaml` | comum | ⚪ |
| REP-07 | Se há Verify, o `.gitattributes` tem `*.verified.txt text eol=lf`. | `raiz.gitattributes`, `csproj[].packages` | comum | ⚪ |

`Directory.Build.props`, `Directory.Packages.props` e `TreatWarningsAsErrors` não existem nas referências. A presença deles no alvo não é divergência. A `dotnet-lib` tem o próprio `Directory.Build.props`, então as regras do alvo não chegam aos projetos `CoLib.*`.

## SEC — Segredos

| ID | Regra | Verificar | Sev. |
| --- | --- | --- | --- |
| SEC-01 | Não há token, API key, senha ou certificado no código, na configuração versionada nem na URL do `.gitmodules`. | `segredos.suspeitos[]`, `git.submodules[].url_tem_credencial` | 🔴 |
| SEC-02 | O `.gitignore` e os comentários dizem a verdade sobre a origem dos segredos. | leitura do `.gitignore` contra `segredos.suspeitos[]` | 🟡 |

AVISO: o relatório indica só o arquivo, a linha e o tipo do segredo. Não copie o valor para o relatório, para o chat nem para a saída de comandos. Um segredo encontrado já está no histórico do git: a correção inclui trocar o segredo na origem.

## Mapa de execução

O relatório indica, para cada achado, quem executa a correção. Esta skill não executa nenhuma correção.

| Itens | Executor |
| --- | --- |
| LOG-* | skill `colibri-logging` |
| POR-01 a POR-05 | skill `colibri-ports` |
| DB-01 a DB-03, DB-07, TST-07 | skill `colibri-connection-string` |
| TST-01 a TST-04 | skill `atualizar-testes-mtp` |
| TST-05, TST-06, TST-08 | skills `csharp-tests` e `csharp-tests-refactor` |
| LIB-03 | skill `http-client-resilience` |
| LIB-05, atualização de pacotes | skill `atualizar-pacotes-nuget` |
| DB-04 (EF Core para Dapper), LIB-01, LIB-02 | `sdd-planejar-refatoracao` (mudança estrutural com plano próprio) |
| SUB-*, PUB-*, CI-*, SRV-*, API-*, REP-*, SEC-* | manual, ou um plano com `sdd-planejar-correcoes` a partir do relatório |
| Build e testes depois de cada correção | skill `dotnet-efficient-validation` |
