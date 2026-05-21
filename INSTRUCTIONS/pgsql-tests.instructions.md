---
description: "Use when running .NET tests or builds that depend on PostgreSQL, Npgsql, TempPgSqlConnection, ConfiguracoesDbFixture, or PGSQL environment variables. Prefer the local embedded PostgreSQL test instance and force the known-good connection settings when the environment is ambiguous."
---

For .NET test or validation runs that depend on PostgreSQL in this environment, prefer these process-level environment variables before executing tests:

- `PGSQL_CONN_STRING=Host=localhost;Port=4500;Database=postgres;User Id=tester;Password=tester;Include Error Detail=true`
- `PGSQ_USER=tester`
- `PGSQL_PASSWORD=tester`

Guidelines:

- If tests fail trying to connect to `127.0.0.1:5454`, treat that as inherited environment drift first, not as a code regression.
- Prefer rerunning the same narrow test or solution test command with the variables forced in-process before changing code.
- The expected PostgreSQL service on this machine is the embedded instance `colibri_embedded_pgsql` on port `4500`.
- Do not assume port `4600` is PostgreSQL here; that port may belong to another process.
- If PostgreSQL-backed tests still fail after forcing the variables, investigate authentication, role existence, and local service state before concluding there is a product defect.
