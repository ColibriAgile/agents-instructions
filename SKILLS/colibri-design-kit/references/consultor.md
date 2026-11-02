# Consultor

Procedimento do verbo `consultor [objetivo] [auto]`, que também roda quando a skill é chamada sem argumento. Lê o estado do projeto, decide quais comandos da skill rodar e em que ordem, e então sugere ao usuário ou executa sozinho o que não grava no projeto. Não tem regra própria de design: só escolhe entre `adotar`, `revisar`, `aderencia`, `refatorar` e `desvio`, e cada um roda pelo seu procedimento.

Argumentos, em qualquer ordem:

- **Objetivo** (texto livre, opcional): o que o usuário quer agora (ex.: "deixar a página de clientes no kit", "ligar o vidro na vitrine", "o PR 482 pode entrar?"). O passo que atende o objetivo vai primeiro no plano, depois dos que o bloqueiam.
- **`auto`**: executa sozinho os passos somente leitura e pede confirmação só nos que gravam no projeto. Sem `auto`, só sugere (modo sugestão).

Trabalhe a partir da raiz do repositório de destino. Sem frontend da linha Colibri no repositório, diga isso e pare.

## 1. Diagnóstico

Somente leitura, sem rodar nenhum verbo. Leia cada sinal e anote a evidência (arquivo, data, número):

| Sinal | Como ler | Indica |
|---|---|---|
| Adoção | `DESIGN.md` e `docs/design/DECISOES.md` na raiz | Sem os dois: `adotar` |
| Perfis adotados e versão do kit | "Perfis" e "Versão do kit" da entrada mais recente do `DECISOES.md` | Base dos demais sinais |
| Atualização do kit | Entradas de "Versões" do `LEIA-ME.md` do kit mais novas que a versão registrada; `colibri-ui.css` sem `colibri-base.css` ao lado | `adotar` (atualização), se alguma entrada toca um perfil adotado (leia "Regra" e "Projetos afetados" de cada uma) |
| impeccable | Pasta da skill `impeccable` no projeto e `metadata.version` dela | 3.x ou ausente: pré-requisito (seção "Pré-requisitos" do `SKILL.md`) antes de `adotar` e `refatorar` |
| Mudança em curso | `git status` (arquivos de interface alterados), branch à frente da principal, PR aberto da branch (`gh pr view`, se houver `gh`) | `revisar` |
| Aderência | `docs/design/ADERENCIA.md`: data e rubrica do relatório mais recente, nota, faixa, itens ★ reprovados, ranking das páginas | Sem relatório, ou relatório anterior ao último commit de interface, à versão do kit adotada ou à rubrica atual de [`./aderencia.md`](./aderencia.md): `aderencia` |
| Refatoração pendente | "Páginas a refatorar" do `DECISOES.md` sem marca; página pior colocada no ranking | `refatorar <página>` |
| Desvios a rever | Linhas de "Desvios do kit" cuja regra mudou numa versão do kit mais nova que a do desvio | `desvio` (rever ou retirar), com o usuário |

Conclua com a tabela de sinais preenchida, uma linha por sinal, com o valor e a evidência.

## 2. Plano

Monte a fila pela prioridade abaixo; cada passo só entra se o sinal pede. Um passo bloqueante para o que vem depois.

1. **`adotar`**, sem adoção. Bloqueante: nada mais roda antes.
2. **Pré-requisito do impeccable**, se `adotar` ou `refatorar` estiver no plano. Bloqueante para esses dois; diga como instalar.
3. **`revisar`**, com mudança em curso: julgar a mudança antes de qualquer refatoração, para não misturar as duas.
4. **`adotar` (atualização)**, com versões novas que tocam um perfil adotado; cite as entradas.
5. **`aderencia`**, sem relatório ou com relatório vencido.
6. **`refatorar <página>`**: a página com itens ★ reprovados primeiro; depois a pior do ranking ou a primeira da lista do `DECISOES.md`.
7. **`desvio`**, para os desvios a rever.

Com objetivo, o passo que o atende sobe para logo depois dos bloqueantes (1 e 2); o objetivo que nenhum verbo atende é dito ao usuário, com a skill ou o caminho certo (ex.: crítica de UX é `impeccable critique`).

Cada passo do plano leva: o comando pronto para digitar, o motivo em uma linha e a evidência do diagnóstico. No máximo três passos à vista; o resto fica como "depois".

## 3. Execução

**Modo sugestão** (padrão). Mostre a tabela de sinais e o plano e pergunte, numa pergunta de escolha, qual passo rodar: os passos do plano, o primeiro marcado como recomendado, e "Nenhum agora". Rode o escolhido pelo procedimento dele, por inteiro; ao terminar, volte ao passo 1 deste procedimento (o resultado muda os sinais) e ofereça o próximo.

**Modo `auto`.** Rode em sequência, sem perguntar, os passos que não gravam no projeto: `revisar` (nada gravado) e `aderencia` (grava só o próprio relatório). Antes do primeiro passo que grava (`adotar`, `refatorar`, `desvio`), pare e peça a confirmação dele com o plano já refeito pelos resultados (ex.: a aderência acabou de apontar a pior página). Os passos que gravam nunca rodam sem confirmação, um a um. Um `revisar` com veredito Bloquear interrompe a fila: os achados vêm antes de qualquer outra coisa.

Nos dois modos: nenhum commit, push ou PR, salvo pedido do usuário; nada de rodar o mesmo verbo duas vezes seguidas sem mudança entre elas.

## 4. Fechamento

Conclua com: o que rodou e o resultado de cada passo (veredito do `revisar`, nota e faixa da `aderencia`, nota antes e depois do `refatorar`, entradas aplicadas do `adotar`); o que ficou no plano e por quê; e o próximo comando pronto para digitar.
