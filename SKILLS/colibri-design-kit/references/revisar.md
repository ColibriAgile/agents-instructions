# Revisar uma mudança contra o kit

Procedimento do verbo `revisar [PR | branch]`. Responde à pergunta de quem mexeu na interface: "esta mudança piorou a aderência ao kit?". Aplica a rubrica de [`./aderencia.md`](./aderencia.md) só ao que a mudança causou e termina com o veredito **Bloquear** ou **Aprovar**. Não dá nota (a nota é da `aderencia`, sobre páginas inteiras), não corrige nada e não grava arquivo.

Funciona antes da adoção: sem `DESIGN.md` nem `docs/design/DECISOES.md`, revise pelo kit desta skill e recomende `adotar` no fechamento.

## Somente leitura

- A árvore de trabalho termina exatamente como começou. Nunca `git checkout`, `git switch`, `git stash`, `git reset`, `git restore` nem `gh pr checkout`. Use só `git fetch`, `git diff`, `git show`, `git log`, `git blame`, `git merge-base` e `gh pr view` / `gh pr diff`.
- Nunca recue por conta própria para `HEAD~1..HEAD` nem para outro range que ninguém pediu.
- Medição no navegador só se a aplicação já estiver rodando no estado da mudança, ou se o usuário pedir. Nesse caso, numa worktree separada (`git worktree add`), removida no fim.

## 1. Resolver o escopo

Aplique a primeira regra que vale:

1. **Argumento é número ou link de PR:** `gh pr view <n> --json baseRefName,headRefName,title,body,files` e `gh pr diff <n>`.
2. **Argumento é branch:** `git fetch` se ela for remota. O range vai do `git merge-base <principal> <branch>` até a `<branch>`. A principal é a de `git symbolic-ref refs/remotes/origin/HEAD` ou, sem ela, `main` ou `master`.
3. **Sem argumento:** se `HEAD` está à frente do merge-base com a principal, o range vai do merge-base até `HEAD`, mais o que não foi commitado (`git diff HEAD` e os arquivos novos de `git status --porcelain`). Se só há mudança local, revise só ela. Sem nada para revisar, diga isso, pergunte o que revisar e pare.

Fique só com os arquivos de interface: marcação, estilos, componentes e o código que abre camadas ou troca estado na tela. Ficam de fora:

- lockfiles, código gerado, saídas de build (`bin/`, `obj/`, `dist/`, `build/`) e dependências (`node_modules/`, `wwwroot/lib/`, `vendor/`);
- a pasta `colibri-ui/` copiada do kit. Mudança nela é atualização do kit: aponte o `adotar` e não revise linha a linha.

Conclua com o range (ou "mudança local"), a lista de arquivos e a intenção declarada da mudança (título e corpo do PR ou as mensagens dos commits).

## 2. Alcance

A mudança pode quebrar páginas que ela não toca:

- **Componente, layout ou estilo compartilhado alterado:** inclua os consumidores diretos (páginas que importam o componente ou usam a classe), um salto, até **5**.
- **Token ou tema do projeto alterado** (`--cm-*` ou `--ct-*` redefinidos, tema da biblioteca de componentes): até **5** consumidores, até dois saltos.

Diga quantos consumidores ficaram de fora do limite. Cada página revisada, alterada ou consumidora, ganha o perfil pela regra de "Perfil da página" de [`./aderencia.md`](./aderencia.md). Leia os desvios de `docs/design/DECISOES.md`, se houver.

## 3. Coletar os achados

Leia o `DESIGN.md` do kit (seções do perfil de cada página) e a rubrica de [`./aderencia.md`](./aderencia.md). Para cada página, aplique os itens que o perfil dela usa, só sobre as linhas que a mudança acrescentou ou alterou e sobre o que essas linhas afetam. Rode as buscas da tabela "Buscas" limitadas às linhas `+` do diff.

Leia também as linhas `-`. Perder um sinal é regressão mesmo quando nenhuma linha nova está errada:

| Sinal removido | Item |
|---|---|
| `aria-label`, `title` de ação de ícone, `alt`, `aria-hidden` | A2, K2 |
| `:focus-visible`, foco do kit, `tabindex`, tratamento de Tab, Enter ou Esc | A1 |
| bloco `prefers-reduced-motion` | A4 |
| `@media (hover: hover)`, `.is-closing` na saída de uma camada | A7 |
| rótulo ou ícone ao lado de uma cor de estado | C3 |
| `var(--cm-*)` ou `var(--ct-*)` trocado por cor literal | C1 |
| `font-variant-numeric: tabular-nums`, `cm-mono` em dado | T2 |
| `.cm-btn-group` desfeito | K1 |
| diálogo ou folha de confirmação, "Desfazer" | K8 |
| classe de superfície `.ct-app--*` ou `.ct-app--kiosk` | O1 |
| `.cm-skip` ou o `id="conteudo"` da área de conteúdo | S1 |

Substituição equivalente não é achado: o sinal voltou de outra forma, como um `title` que virou dica do kit.

Confira a intenção declarada contra o que chegou. Se a mudança diz que entrega uma tela, lista ou formulário, veja o que o kit exige junto e falta: estado vazio (`.cm-empty`, `.ct-empty`), carregamento, erro, os dois temas e, no perfil Operação, a superfície de toque e a saída das camadas.

Conclua com cada achado ligado a um item da rubrica, com `arquivo:linha`.

## 4. Classificar

**Status pela causa, não pelo lugar:**

- **Introduzido:** a linha nova causa a falha.
- **Regressão:** a mudança tirou um sinal ou quebrou o que passava. Inclui o consumidor de um token ou componente alterado, mesmo fora do diff.
- **Pré-existente:** já falhava antes da mudança. Confirme com `git blame` no range (ou `git log -L`) antes de afirmar. Relate no máximo **3**, só os que a mudança tocou de perto; o resto é trabalho da `aderencia`.

Desvio registrado no `DECISOES.md` que cobre o caso não é achado.

**Severidade:**

- **Bloqueia:** item ★ reprovado, o que inclui todo gatilho da seção "Gatilhos de bloqueio" de [`./aderencia.md`](./aderencia.md). Nunca é rebaixado porque a superfície é pequena.
- **Corrigir:** qualquer outro item reprovado.

**Correção, da mais barata para a mais cara:** apagar o CSS ou a marcação própria → usar a classe ou o componente do kit → usar o token → corrigir o valor → escrever código novo. Proponha a primeira que resolve, com a classe ou o token do kit, nunca uma biblioteca que o projeto não usa.

## 5. Relatar

Entregue na conversa, sem gravar arquivo:

1. **Escopo:** range ou PR, arquivos revisados, consumidores incluídos e quantos ficaram de fora, intenção declarada.
2. **Achados:** tabela `Severidade | Item | Status | Local | Antes | Depois | Motivo`, com os que bloqueiam primeiro. Local é `arquivo:linha`; Antes e Depois são curtos (o código ou o valor).
   - Uma causa é um achado, com todos os locais na mesma linha.
   - No máximo **15** achados, sem completar a lista para chegar lá. O limite nunca corta o que bloqueia: se passar dele, liste todos os que bloqueiam e diga quantos dos outros ficaram fora.
3. **Sem verificação:** os itens N (navegador) e os grupos sem evidência possível ficam "não verificado", nunca "aprovado".
4. **Veredito:**
   - **Bloquear** quando sobra algum achado "Bloqueia" introduzido ou de regressão, com a lista deles.
   - **Aprovar** quando não sobra, com as ressalvas dos achados "Corrigir", se houver.
   - Pré-existente nunca bloqueia; é só relatado.
5. **Próximos passos,** com o comando pronto:
   - `refatorar <página>` quando os achados se concentram numa página;
   - `desvio <regra>` quando a falha é decisão consciente;
   - `aderencia <página>` para a nota da página;
   - `adotar` se o projeto ainda não adotou o kit.

Conclua com o veredito e a árvore de trabalho intacta (`git status` igual ao do começo).
