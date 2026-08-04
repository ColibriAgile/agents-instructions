---
name: breakdown-specs
description: 'Transform Markdown technical specifications and requirements into an executable sequence of independent implementation tasks. Use when breaking down tech specs, requirements, features, bugs, or migration documents into numbered task files with dependencies, acceptance criteria, affected files, and automated test coverage.'
argument-hint: 'Path to one or more Markdown specification or requirements documents'
---

# Breakdown Specs

Transform one or more Markdown documents containing technical specifications and/or requirements into a sequenced set of implementation tasks that an AI agent can execute independently.

## When to Use

- Break down a feature, bug fix, migration, or technical specification into implementation work.
- Convert requirements into ordered, actionable task files.
- Prepare work for execution by multiple AI agents or in separate sessions.
- Ensure every requirement has an associated validation strategy and automated tests.

## Inputs and Outputs

- Read the Markdown input files supplied by the user. If no path is supplied, locate relevant `.md` files in the current workspace and ask for clarification when multiple unrelated documents are found.
- Write one Markdown file per task to `tasks/` by default, unless the user specifies another output directory.
- Name files sequentially as `task_01.md`, `task_02.md`, and so on, preserving two-digit numbering for up to 99 tasks.
- Do not modify the source specification documents.

## Procedure

1. Inspect the input documents completely. Identify the requested behavior, constraints, non-goals, affected layers, likely files, data flows, external integrations, and explicit or implicit dependencies.
2. Inspect the repository structure and existing implementation patterns relevant to the specification. Find the project’s test projects, test naming conventions, fixtures, helpers, build commands, and validation practices before defining test tasks.
3. Build a requirement-to-task map. Every functional, technical, non-functional, and testable requirement must be covered by at least one task or explicitly marked as an unresolved question.
4. Divide the work into small, executable tasks. Each task must:
   - Have one clear objective and a restricted scope.
   - Modify or create no more than 2–3 files whenever practical.
   - Be implementable without relying on undocumented context.
   - State exactly what to change and how to implement it using repository conventions.
   - Include an explicit acceptance criterion and validation command or procedure.
   - Identify its direct dependencies using task numbers, such as `Depende da Tarefa 01`.
5. Order tasks so foundational changes precede consumers. Typical ordering is domain models and contracts, persistence or infrastructure, application services, integrations, API or UI wiring, automated tests, and documentation. Combine or reorder this sequence when the repository architecture requires it.
6. Plan automated tests for all requirements. Prefer extending existing test projects, fixtures, builders, mocks, and assertion libraries. Include tests in the implementation task when the scope remains focused; otherwise create a dedicated test task with explicit dependencies. Do not propose tests that cannot be executed with the repository’s existing tooling.
7. Create each task file from [TEMPLATE.md](./TEMPLATE.md), replacing every bracketed description with task-specific content. Remove unused file entries and sections only when they are explicitly not applicable. Keep each file self-contained and executable by an AI agent.
8. Review the generated task set for completeness, independence, scope limits, ordering, dependency correctness, and test coverage. Remove duplication and split tasks that still contain multiple unrelated objectives.

Do not leave bracketed placeholder descriptions in generated task files. Preserve the section structure unless a section is explicitly not applicable.

## Decision Rules

- If the specification is ambiguous, do not invent business rules. Record the ambiguity in the relevant task under `Pontos em Aberto` and make the task blocked until clarified, unless a repository convention resolves it unambiguously.
- If a task would touch more than 3 files, split it by layer, responsibility, or test boundary. Exceed the limit only when the files form one inseparable change, and explain why in the task.
- If a requirement spans multiple tasks, assign the implementation to the earliest appropriate task and add integration or regression validation to the later task.
- If a task has no meaningful automated test, explain why under `Testes Automatizados` and provide the strongest available deterministic validation instead.
- If the repository’s conventions conflict with the specification, preserve the specification’s required behavior and document the compatibility decision in the task.
- If existing tests are missing or unsuitable, identify the required test-project changes explicitly rather than assuming a new testing framework or tool.

## Completion Checklist

- [ ] All input documents were analyzed without changing them.
- [ ] Every requirement is mapped to one or more tasks.
- [ ] Tasks are numbered, sequential, and ordered by dependency.
- [ ] Each task has a focused objective and no more than 2–3 files in scope whenever practical.
- [ ] Each task contains implementation instructions, dependencies, acceptance criteria, automated tests, and validation.
- [ ] Existing repository test patterns and commands are used.
- [ ] Error paths, edge cases, and compatibility constraints are covered.
- [ ] Ambiguities and assumptions are explicitly recorded.
- [ ] Generated files are saved in the requested output directory and use consistent naming.
