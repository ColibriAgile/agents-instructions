---
name: auditar-skills
description: Audita o uso das skills do Claude Code no repositório atual a partir dos transcripts locais e oferece ocultar do contexto as que não são usadas (skillOverrides) e desativar plugins sem uso (enabledPlugins), gravando em .claude/settings.local.json.
argument-hint: "[dias=30] [max-usos=0]"
disable-model-invocation: true
---

# Auditar Skills

Toda skill na listagem ocupa contexto em todo turno. Esta skill conta quantas vezes cada uma foi usada **neste repositório** e oferece tirar as sem uso da listagem.

Argumentos opcionais em `$ARGUMENTS`: o primeiro número é a janela em dias (padrão 30) e o segundo, o máximo de usos para sugerir (padrão 0).

## Steps

**Step 1: Levantar o uso**
1. Execute `node <skill-dir>/scripts/auditar-skills.mjs --days <dias> --max-uses <max-usos>` a partir da raiz do repositório (somente leitura), substituindo `<skill-dir>` pelo diretório absoluto desta skill.
2. O script imprime um JSON com `history`, `warnings`, `skills` (nome, origem `kind`, `uses`, `lastUsed`), `suggestions.skillOverrides`, `suggestions.disablePlugins` e `skipped`.

*Done when:* o JSON está em mãos.

**Step 2: Apresentar o relatório**
1. Mostre primeiro cada item de `warnings`, em destaque. O aviso de histórico curto não bloqueia: siga com as sugestões.
2. Mostre uma tabela com as sugestões, agrupadas por origem:
   - **Sincronizadas do claude.ai** (`kind: synced`) e **suas** (`kind: user`): vão para `skillOverrides` como `user-invocable-only`. A skill sai do contexto e continua disponível com `/nome`.
   - **Plugins** (`disablePlugins`): o plugin inteiro é desativado neste repositório. Liste as skills de cada um.
3. Informe em uma linha as skills fora da auditoria: `skipped.project` (instaladas por bundle, decisão da equipe) e `skipped.builtin` (embutidas).
4. Se não houver sugestões, diga isso e pare.

*Done when:* o usuário viu os avisos, a tabela e o que ficou de fora.

**Step 3: Perguntar o que aplicar**
1. Monte perguntas de múltipla escolha (`multiSelect: true`), com uma opção por grupo: "Todas as sincronizadas (N skills)", "Suas skills (N)" e uma opção por plugin ("Plugin slack: 14 skills"). Na descrição de cada opção, liste os nomes, abreviando quando passarem de 6.
2. A tool de pergunta aceita até 4 opções por pergunta e 4 perguntas por chamada: distribua os grupos entre perguntas quando passarem de 4.
3. Se o usuário quiser excluir skills específicas de um grupo, ele usa o "Other". Respeite o que ele escrever.

*Done when:* cada grupo foi aceito ou recusado.

**Step 4: Aplicar**
1. Execute `node <skill-dir>/scripts/auditar-skills.mjs --apply` com um `--override <nome>` para cada skill escolhida e um `--disable-plugin <chave>` para cada plugin escolhido, usando os nomes e chaves exatamente como vieram no JSON.
2. O script mescla em `.claude/settings.local.json` da raiz do repositório e preserva o resto do arquivo. Se ele falhar por JSON inválido, mostre o erro e pare, sem editar o arquivo à mão.

*Done when:* o script imprimiu o arquivo gravado.

**Step 5: Resumir**
1. Liste o que foi gravado e o arquivo.
2. Explique que vale a partir da próxima sessão neste repositório, que `/skills` reverte um override (Space troca o estado) e que `/plugin` reativa um plugin.
3. Para compartilhar com a equipe, as entradas podem ser movidas para `.claude/settings.json`.

*Done when:* o resumo cobre cada item aplicado.

## Limites
* Conta como uso a chamada da tool `Skill` pelo modelo e o `/nome` digitado. A pré-carga por subagente não conta.
* As skills disponíveis vêm da listagem mais recente registrada nos transcripts deste repositório. Skill instalada depois da última sessão não aparece.
* Skills de bundle (`.claude/skills` do projeto) e embutidas ficam fora da auditoria por decisão.
* `skillOverrides` não afeta skills de plugins, por isso elas são tratadas pelo plugin inteiro.

## Testes
`node --test SKILLS/auditar-skills/scripts/auditar-skills.test.mjs`
