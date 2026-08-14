---
name: commit
description: 'Cria commits no padrão conventional commits (título + descrição em bullets), tratando primeiro os submódulos com alterações pendentes e depois o repositório principal. Use quando o usuário pedir para commitar, fazer commit, salvar alterações no git, gerar mensagem de commit, ou usar /commit. NUNCA faz push nem pull, exceto se explicitamente solicitado.'
argument-hint: '[contexto opcional sobre o que foi feito]'
disable-model-invocation: true
---

# Commit (submódulos primeiro)

Commita as alterações pendentes: primeiro cada submódulo sujo, depois o repositório principal.

## Regras invioláveis

- **NUNCA** executar `git push`, `git pull`, `git fetch` ou `git merge`. Só se o usuário pedir explicitamente nesta mesma solicitação.
- **NUNCA** usar `--no-verify` ou `--no-gpg-sign`. Se um hook falhar, investigar e reportar, não contornar.
- Preferir commit novo a `--amend`.
- Não criar branch, não fazer checkout, não alterar o estado do working tree além do `git add` acordado.

## Procedimento

### 1. Levantar o estado

```bash
git submodule status
git status --porcelain
git symbolic-ref -q --short HEAD   # vazio/erro = HEAD destacado
```

Sem `.gitmodules`/submódulos, pule direto ao passo 4 (repositório principal).

### 2. Para cada submódulo com alterações pendentes

Detectar sujeira em `<sub>` com `git -C <sub> status --porcelain`. Vazio = pular.

Para cada submódulo sujo, executar os passos 3 e 4 **dentro dele** (`git -C <sub> ...`) antes de tocar no principal.

### 3. Decidir o que entra no stage

Compare `git status --porcelain` (coluna 1 = staged, coluna 2 = working tree):

| Situação | Ação |
|---|---|
| Nada staged | `git add -A` direto, sem perguntar |
| Tudo já staged | Prossegue, sem perguntar |
| Parcialmente staged | Perguntar (ver abaixo) |

No caso parcial, use a tool de perguntas (`AskUserQuestion`) mostrando o que está staged e o que está de fora, com as opções:

- **Sim** — `git add -A` e commitar tudo
- **Não** — commitar apenas o que já está staged
- **Abortar** — encerrar sem commitar, para o usuário refazer o staging

### 4. Gerar a mensagem e commitar

**Use o contexto da sessão atual como fonte primária.** Se as alterações pendentes vieram do trabalho feito nesta conversa, você já sabe o *porquê* — o bug relatado, a decisão tomada, o ticket citado, a alternativa descartada. Isso vale mais que o diff: escreva a mensagem a partir desse contexto e use o diff só para conferir cobertura (nada relevante ficou de fora, nada alheio entrou junto). Se o diff contiver mudanças que **não** são da sessão, trate-as pelo diff normalmente.

Antes de escrever, leia o que vai ser commitado e o estilo do repositório:

```bash
git diff --staged --stat
git diff --staged
git log -8 --format="%s%n%b%n---"
```

Formato da mensagem (padrão GitHub / conventional commits):

```
tipo(escopo): resumo no imperativo, minúsculo, sem ponto final

- Alteração relevante 1
- Alteração relevante 2
- Alteração relevante 3
```

- Título ≤ 72 caracteres. Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`, `style`.
- **Idioma e escopo seguem o `git log` do repositório em questão** — cada repo pode ter convenção própria; o submódulo pode diferir do principal.
- Bullets descrevem *o que mudou e por quê*, não arquivo por arquivo. Um commit trivial (ex.: bump de referência de submódulo) pode ter só o título.
- Sem trailer `Co-Authored-By`.

Commitar sem confirmação prévia. No PowerShell, use here-string literal (o `'@` de fechamento precisa estar na coluna 0):

```powershell
git commit -m @'
tipo(escopo): resumo

- Bullet 1
- Bullet 2
'@
```

No Bash, use heredoc equivalente (`git commit -F - <<'EOF'`).

### 5. Repositório principal

Depois dos submódulos, volte à raiz e repita os passos 3 e 4. O commit do submódulo deixa o gitlink modificado no principal — ele entra normalmente no stage. Se a **única** mudança do principal for o gitlink, use algo como `chore(lib): atualize referência do submódulo <nome>`.

### 6. Reportar

Uma linha por commit criado: `<repo>: <hash curto> <título>`. Diga explicitamente que nada foi enviado ao remoto.

## Casos de borda

- **Nada a commitar em lugar nenhum**: informe e encerre, não force commit vazio.
- **Hook de pre-commit falhou**: reporte a saída, não tente contornar. Se o hook reformatou arquivos, re-stage e tente commitar de novo uma vez.
- **Merge/rebase em andamento** (`MERGE_HEAD`/`rebase-merge` presentes): pare e avise, não commite por cima.
- **HEAD destacado** (submódulo ou principal — `git -C <repo> symbolic-ref -q --short HEAD` vazio): **pare antes de commitar**. Avise que o commit ficaria órfão e deixe a decisão com o usuário. Só prossiga se ele informar a branch de destino; nesse caso a skill executa:

  ```bash
  git -C <repo> stash push -u -m "commit-skill"
  git -C <repo> checkout <branch>
  git -C <repo> stash pop
  ```

  Se o `stash pop` der conflito, pare e reporte — não tente resolver nem commitar. Sem branch informada, encerre sem commitar nada naquele repositório.
- **Mudanças heterogêneas** (várias features distintas no mesmo diff): faça commits separados por assunto usando `git add` por caminho, em vez de um commit genérico.
