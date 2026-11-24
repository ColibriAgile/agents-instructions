---
name: dconnect-test-environment
description: "PostgreSQL and SQL Server test-environment guidance for DConnect. Use when tests need temporary databases, Verify snapshots, or CI test-scope decisions. Don't use for production database operations or ordinary unit-test assertions."
disable-model-invocation: true
---

# DConnect Test Environment

## Classify the test

Run the smallest project that contains the scenario:

```powershell
dotnet test "DConnect.Testes/DConnect.Testes.csproj" --filter "FullyQualifiedName~ConnectorIfoodTestes"
dotnet test "ComandosDConnect.Testes/ComandosDConnect.Testes.csproj"
dotnet test "Plugin.DConnect.Testes/Plugin.DConnect.Testes.csproj"
```

`DConnect.Testes` covers unit tests, Flurl `HttpTest` contracts, connector flows, and real PostgreSQL persistence. Use the test naming and framework conventions defined in `AGENTS.md`.

Done when the selected project and test filter account for the requested behavior.

## Prepare PostgreSQL

Use the temporary database fixture when a test touches `DConnect.Testes/Source/Dados`, event queues, or persistence. The fixture consumes:

- server `localhost`;
- port `4500`;
- user `tester`;
- password `tester`;
- extension `uuid-ossp`;
- scripts under `_scripts/01_dconnect_pgsql`, ordered by that directory's `config.json`.

Set `PGSQL_CONN_STRING` for a complete connection string, `PGSQL_PASSWORD` for a password override, or `PGSQ_USER` for the user name consumed by the fixture. The fixture creates and removes temporary databases, so the account needs database creation, connection termination, and database removal privileges.

Done when PostgreSQL accepts a temporary database connection and the DConnect schema scripts can run.

## Prepare SQL Server

Use SQL Server only for suites that exercise `_lib/CoLib.Library.Testes` database, security, licensing, plugin, or Polly scenarios. The default fixture connection is:

```text
Server=localhost;Database=master;User Id=sa;Password=1234;TrustServerCertificate=true
```

The fixture creates and removes temporary databases and executes SQL Server-specific fixtures such as `_lib/CoLib.Library.Testes/Source/Seguranca/Fixtures/Tabelas.sql`. Provide an equivalent local SQL Server configuration when the default instance is unavailable.

Done when SQL Server can create the temporary database required by the selected test class.

## Handle snapshots

Read the `ModuleInitializer.cs` for the selected suite before changing a `.verified.txt` result. DConnect snapshots live in `DConnect.Testes/Snapshots`; other suites use their own `Snapshots` directories. `AutoVerify()` is commented out, so a changed result requires deliberate Verify approval rather than automatic replacement.

Done when every changed snapshot has been reviewed and the corresponding `.verified.txt` file is intentional.

## Interpret CI scope

The active `.github/workflows/testes.yml` delegates execution to `ColibriAgile/build-tools/.github/actions/test-dotnet@master` with `project-suffix: .Testes`, coverage upload, and exclusions for `_lib`, `_sdk`, and `Plugin.DConnect.Testes`. The workflow does not start PostgreSQL or SQL Server, and the x86 plugin test step is commented out.

Treat local `dotnet test` success as broader than CI coverage: `_lib` test projects and `Plugin.DConnect.Testes` are outside the active CI scope.

Done when the validation report names both the local suites executed and the CI suites actually covered.
