---
name: pgsql-test-runner
description: "Run or troubleshoot .NET tests that depend on PostgreSQL, Npgsql, TempPgSqlConnection, ConfiguracoesDbFixture, or PGSQL env vars. Use when tests fail with connection errors, port mismatches, or inherited PGSQL configuration."
---

# PGSQL Test Runner

Use this skill when a .NET test run depends on PostgreSQL and you need to stabilize the environment before deciding whether a failure is a code regression.

## Default Test Environment

Before running PostgreSQL-backed tests in this workspace, prefer these process-level environment variables:

- `PGSQL_CONN_STRING=Host=localhost;Port=4500;Database=postgres;User Id=tester;Password=tester;Include Error Detail=true`
- `PGSQ_USER=tester`
- `PGSQL_PASSWORD=tester`

Expected local service:

- Embedded PostgreSQL service: `colibri_embedded_pgsql`
- Expected port: `4500`

## Workflow

1. Identify a narrow PostgreSQL-backed test first.
2. Run that narrow test with the environment variables forced in-process.
3. If it passes, rerun the broader requested test slice or solution with the same forced variables.
4. If the failure references `127.0.0.1:5454`, treat it as inherited environment drift unless evidence shows otherwise.
5. Only after environment validation should you investigate code regressions.

## Investigation Hints

- Look for `TempPgSqlConnection`, `ConfiguracoesDbFixture`, `DatabaseFixture`, or direct `NpgsqlConnection` usage.
- Verify whether the test host inherited an old `PGSQL_CONN_STRING`.
- If needed, confirm the local PostgreSQL role used by tests can log in and create temporary databases.

## Example PowerShell Pattern

```powershell
$env:PGSQL_CONN_STRING = 'Host=localhost;Port=4500;Database=postgres;User Id=tester;Password=tester;Include Error Detail=true'
$env:PGSQ_USER = 'tester'
$env:PGSQL_PASSWORD = 'tester'
dotnet test '.\_lib\CoLib.Library.sln' --no-build --nologo -v minimal
```

## Decision Rule

If the same PostgreSQL-backed test fails without forced variables but passes with them, classify the issue as environment/configuration drift rather than a product regression.
