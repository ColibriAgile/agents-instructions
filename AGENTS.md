# AGENTS.md

## CLI `colibri-skills`

Antes de alterar `src/`, `tests/` ou `bin/`, ou de escrever uma spec em `docs/specs/`, leia e siga
[`.claude/rules/cli.md`](.claude/rules/cli.md). A regra vale para qualquer agente. Ela define:

- texto da tela em pt-BR e valores de contrato (`--json`, estado, enums) em inglês;
- testes do comportamento externo pelo ponto mais alto (CLI como processo; TTY no `tests/wizard-pty.py`);
- spec em `docs/specs/<slug>.md` antes de implementar.
