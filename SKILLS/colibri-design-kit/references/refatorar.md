# Refatorar uma página para o kit

Procedimento do verbo `refatorar <página>`. Mede a página, entrega ao impeccable um pedido já enquadrado no kit e mede de novo. O trabalho de design é do impeccable; esta skill garante que ele **estenda o mundo estabelecido** pelo kit, sem abrir torneio de conceitos, paleta ou layout novos. Uma página por execução.

Pré-condição: o projeto adotou o kit (`DESIGN.md` e `docs/design/DECISOES.md` presentes). Sem isso, pare e recomende `adotar`.

## 1. Resolver a página

Resolva o argumento para o arquivo da página (e a rota, se houver) e o perfil (Admin ou Operação). Leia o `DESIGN.md` do projeto, os desvios do `DECISOES.md` e, no `DESIGN.md` do kit, a seção 6 (Admin) ou 9 (Operação). Sem argumento, sugira a primeira página não marcada de "Páginas a refatorar" e espere a confirmação.

Conclua com arquivo, rota e perfil da página.

## 2. Medir antes

Leia [`./aderencia.md`](./aderencia.md) por inteiro e execute-o com a página como alvo, até a gravação do relatório, sem o fechamento de próximos passos. A nota e as reprovações são a linha de base e entram no pedido do passo 3.

## 3. Pedir ao impeccable

Página nova, ou mudança de estrutura (outra anatomia, outro fluxo): invoque antes `impeccable shape <página>` para gravar o brief da superfície no modo Operate. Depois invoque a skill `impeccable` com o pedido abaixo, preenchido; `craft` é alias descontinuado no impeccable 4.x.

```text
Refatore <página> (<arquivo>) seguindo o DESIGN.md do projeto.
Mundo visual estabelecido: cores, tipografia, anatomia de página e componentes são do Colibri Design Kit.
Estenda esse mundo; mantenha conteúdo, comportamento e dados da página. Modo Operate.
Use as classes <cm- (Admin) | ct- (Operação)> com a marcação de <caminho absoluto desta skill>/assets/kit/<exemplo.html | exemplo-toque.html>.
Corrija estas reprovações da aderência:
- <ID> <item> — <arquivo:linha> — <correção>
Desvios já registrados (mantenha): <lista ou "nenhum">.
Qualquer outro desvio do kit só com a minha confirmação.
```

Quando o impeccable propuser algo que contraria o kit, o kit vence; desvio que o usuário confirmar vai para `DECISOES.md` pelo verbo `desvio`.

Conclua quando o impeccable terminar a refatoração da página.

## 4. Medir depois

Execute de novo [`./aderencia.md`](./aderencia.md) na página, do mesmo modo (sem o fechamento de próximos passos); a tendência do relatório mostra antes → depois. Com navegador, confira também o alinhamento em 1440, 1920 e ~900 px e os dois temas (Operação: a resolução real da superfície e, no consumidor, um esquema claro e um escuro).

Item que passou de aprovado para reprovado é regressão: corrija antes de concluir. Conclua quando a página não tiver regressões nem item ★ reprovado, ou quando cada reprovação restante tiver motivo escrito (desvio confirmado, dependência de outra página, verificação impossível aqui).

## 5. Fechar

Marque a página em "Páginas a refatorar" do `DECISOES.md` com a nota final (`- [x] Clientes — 86 (Próximo)`) e relate: nota antes → depois, reprovações resolvidas, as que restaram com o motivo, desvios registrados e a próxima página da lista, com o verbo pronto (`refatorar <próxima página>`).

Conclua com a página marcada no `DECISOES.md` e o relato entregue.
