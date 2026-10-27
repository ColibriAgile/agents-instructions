---
name: colibri-design-kit
description: 'Colibri Design Kit leva a linha visual das aplicações Colibri (perfis Admin, Operação e Cards) a um repositório e mede a aderência a ela, sobre a skill impeccable 4.x. Use para adotar o kit num frontend Colibri ou atualizar a versão adotada (inclusive migrar artefatos do impeccable 3.x), medir a aderência de uma página ou do frontend ao kit com nota e ranking de páginas, refatorar uma página para o kit ou registrar um desvio do kit. Não use para projetos fora da linha Colibri, para backend nem para crítica de UX sem relação com o kit (use impeccable critique).'
argument-hint: '[adotar | aderencia | refatorar | desvio] [alvo] — ex.: "aderencia src/pages/Clientes.razor", "adotar src/web, Blazor DevExpress"; vazio abre o menu'
---

# Colibri Design Kit

Leva a linha visual Colibri a um repositório, deixa o projeto pronto para o impeccable trabalhar sobre ela e mede quanto o projeto segue o kit. A linha tem dois perfis sobre a mesma base: **Admin** (painéis, admins e ferramentas internas) e **Operação** (telas cheias de toque: cardápio do tablet, totem, produção do KDS, pedidos prontos). Sobre o Operação, o perfil **Cards** traz os cards de dados lidos de longe (hoje, o card de produção do KDS). Um projeto adota um perfil ou mais. Depois da adoção, o repositório tem:

| Arquivo | Conteúdo | Quem grava |
|---|---|---|
| `<estáticos>/colibri-ui/` | `colibri-base.css`, `fonts/`, `logos/`, `icons/`; no perfil Admin, `colibri-ui.css` e os adaptadores usados; no perfil Operação, `colibri-touch.css` e, com canal de consumidor, `colibri-esquema.js` (+ `.d.ts` em TypeScript); no perfil Cards, `colibri-cards.css` | `adotar` |
| `PRODUCT.md` | usuários, propósito, contexto, compromissos da marca, princípios (modelo do kit preenchido) | impeccable `init` |
| `DESIGN.md` | regras visuais do kit no formato do impeccable + implementação no projeto | impeccable `document` |
| `.impeccable/design.json` | sidecar: metadados de cor, sombras, movimento, breakpoints, componentes | impeccable `document` |
| `.impeccable/live/config.json` | configuração do modo `live` | impeccable `init` |
| `.impeccable/config.json` | `buildPath` (`code` ou `comp`), só quando o usuário escolheu | impeccable `init` |
| `docs/design/DECISOES.md` | registro das decisões de design, desvios do kit e páginas a refatorar | `adotar`, `refatorar`, `desvio` |
| `docs/design/ADERENCIA.md` | histórico de notas e relatório mais recente de aderência | `aderencia` |

Compatibilidade: impeccable 4.x (conferido na 4.4.0): `PRODUCT.md` no schema de produto 1, `DESIGN.md` com oito seções canônicas, contexto carregado pelo launcher `scripts/impeccable`. Artefatos gerados com o impeccable 3.x são migrados pelo `adotar`.

## Comandos

| Comando | O que faz | Procedimento |
|---|---|---|
| `adotar [caminho, framework]` | Adota o kit ou atualiza a versão adotada: copia os arquivos, aciona `impeccable init` e `document`, registra as decisões | [`references/adotar.md`](references/adotar.md) |
| `aderencia [alvo]` | Nota de 0 a 100 de aderência ao kit, por grupo de regras, com evidência `arquivo:linha`; sem alvo, avalia o frontend e ranqueia as páginas da menos aderente para a mais. Somente leitura, salvo o relatório | [`references/aderencia.md`](references/aderencia.md) |
| `refatorar <página>` | Mede a página, pede ao impeccable a refatoração já enquadrada no kit, mede de novo e marca a página no `DECISOES.md` | [`references/refatorar.md`](references/refatorar.md) |
| `desvio <descrição>` | Registra um desvio do kit no `DECISOES.md`, com confirmação | seção "Desvio" abaixo |

Roteamento pelo primeiro termo do argumento (com ou sem acento: `aderência`, `aderencia`; `atualizar` é sinônimo de `adotar`):

- **Verbo da tabela:** leia o procedimento dele por inteiro antes de agir e siga-o.
- **Outro texto** (ex.: `src/web, Blazor DevExpress`): é a entrada do `adotar`; quem usava a skill antes dos verbos continua com o mesmo comando.
- **Sem argumento:** apresente o menu abaixo; nunca execute um verbo sem a escolha do usuário.

**Menu.** Leia o estado do projeto e abra com uma ou duas recomendações, cada uma com o motivo em uma linha e o comando pronto para digitar; depois mostre a tabela de comandos.

- Sem `docs/design/DECISOES.md` nem `DESIGN.md` → `adotar`.
- Versão do kit registrada no `DECISOES.md` mais antiga que a primeira entrada de "Versões" do `LEIA-ME.md` do kit, ou `colibri-ui.css` sem `colibri-base.css` ao lado → `adotar` (atualização), citando as entradas de "Versões" que o projeto ainda não tem.
- Sem `docs/design/ADERENCIA.md` → `aderencia`, para a nota de partida e a ordem das páginas.
- Com relatório de aderência → `refatorar <página pior colocada no ranking>`, ou `aderencia` de novo se o relatório é anterior aos últimos commits de UI.

## Fonte da verdade

O kit em [`./assets/kit/`](./assets/kit/) é normativo. [`./assets/kit/DESIGN.md`](./assets/kit/DESIGN.md) define cores, tipografia, estrutura, anatomia de página e componentes; [`./assets/kit/LEIA-ME.md`](./assets/kit/LEIA-ME.md) define a ordem de carga e a versão do kit (seção "Versões"). Leia os dois antes de qualquer verbo.

Para o impeccable, o kit é um **mundo visual estabelecido**: ele herda, não inventa. Quando o impeccable propuser algo que contraria o kit, **o kit vence**. Em especial, em todos os verbos e nas refatorações seguintes:

- Não rode o workshop de mundo visual do impeccable (`new-work` → "Create or replace the visual world", `concept-seed --scope world`, `document --seed`) nem proponha estratégia de cor ou paleta: as cores do kit são marca comprometida.
- Cores em hex no frontmatter (valores exatos do kit); não converta para OKLCH.
- `Platform` é `web`, salvo projeto nativo confirmado pelo usuário. Não grave `## Register` no `PRODUCT.md` (descontinuado na 4.x); as páginas Colibri são do modo **Operate**, que o impeccable registra no brief de cada superfície quando ela for trabalhada.
- Não pergunte o que o kit já decidiu (norte criativo, personalidade, antirreferências, acessibilidade, nomes das cores, elevação, filosofia dos componentes). Mostre o que foi herdado e pergunte só o que é do produto.
- Nenhuma regra do kit pode ser resumida a ponto de sumir, nem enfraquecida ("prefira" no lugar de "nunca").

Desvios do kit são permitidos apenas com confirmação do usuário e sempre registrados em `docs/design/DECISOES.md` com o motivo (verbo `desvio`).

## Pré-requisitos

- A skill `impeccable` 4.x precisa estar instalada no projeto (`.agents/skills/impeccable/` ou `.claude/skills/impeccable/`; a versão está em `metadata.version` do `SKILL.md` dela). Se não estiver, ou se for 3.x (tem `scripts/context.mjs` em vez de `scripts/impeccable`), pare e peça para instalar o bundle `frontend` (`Install-Skills.ps1`) ou, pontualmente, `npx skills add ColibriAgile/agents-instructions -s impeccable -y`. `aderencia` e `desvio` rodam sem o impeccable; sem ele, a parte do detector fica não verificada.
- O launcher `<pasta-da-skill-impeccable>/scripts/impeccable` (em Windows sem `sh`, `impeccable.cmd`) roda um binário próprio, sem Node. Na primeira execução ele baixa o binário das releases de `pbakaus/impeccable` no GitHub, confere o SHA-256 e guarda em `~/.impeccable/bin/<versão>/`; isso exige rede. Se o launcher falhar, siga o "Launcher unavailable" do `SKILL.md` do impeccable (ler `PRODUCT.md` e `DESIGN.md` direto) e registre a verificação como não realizada.
- Se `impeccable context` imprimir `UPDATE_AVAILABLE`, não rode `npx impeccable update` no projeto: a skill vem do bundle, e a atualização entra no repositório `agents-instructions`. Avise o usuário e siga.
- Trabalhe a partir da raiz do repositório de destino; nunca a partir da pasta da skill.

## Desvio

Procedimento do verbo `desvio <descrição>`. Exige `docs/design/DECISOES.md`; sem ele, recomende `adotar`.

1. Identifique a regra do kit afetada: seção do `DESIGN.md` do kit e, se houver, o nome da regra (ex.: "seção 7, regra dos botões adjacentes") e o item da rubrica de aderência que ela cobre (ex.: K1). Sem regra do kit afetada, não é desvio: diga isso e pare.
2. Monte a linha da tabela "Desvios do kit" (`Regra do kit | O que foi feito | Motivo | Confirmado por`), com o ID da rubrica entre parênteses em "Regra do kit" (`seção 7, regra dos botões adjacentes (K1)`) e o escopo (página ou projeto) em "O que foi feito". Pergunte o que faltar; o motivo é obrigatório.
3. Mostre a linha e peça confirmação. Se o motivo vale para todas as aplicações Colibri (limitação de biblioteca, regra que não cabe no caso), diga que o caminho é evoluir o kit (seção abaixo) e registre o desvio só se o usuário mantiver.
4. Acrescente a linha confirmada à tabela "Desvios do kit" da entrada mais recente do `DECISOES.md`, trocando o "Nenhum" se for o primeiro.

Conclua com a linha gravada e confirmada; a próxima `aderencia` conta o item como desvio, fora da nota.

## Evoluir o kit desta skill

O kit em `./assets/kit/` é mantido diretamente nesta skill e é a fonte da verdade da linha visual Colibri: nenhuma aplicação serve de matriz nem gera o kit. Mudança de design nasce aqui e chega às aplicações pelo `adotar` (atualização).

Ao alterar o kit:

- Mude a regra e a implementação juntas: `DESIGN.md` e `colibri-ui.css` (tokens, temas e fontes ficam em `colibri-base.css`), mais os adaptadores afetados (`colibri-ui.bootstrap3.css`, `colibri-ui.devexpress.css`) e a marcação de `exemplo.html` quando o componente aparece nela. No perfil Operação, `colibri-touch.css`, `colibri-esquema.js` e `exemplo-toque.html`; no perfil Cards, `colibri-cards.css` e as telas `#kds` e `#bump` de `exemplo-toque.html`.
- Mudou `colibri-esquema.js` ou os estados de `colibri-base.css`: rode `node scripts/verificar-esquema.mjs` (estados iguais à base, contraste garantido numa grade de sementes, nada acima do Chrome 101). Falhou, não publique.
- Regra nova ou alterada entra no checklist de `./references/mapeamento-impeccable.md` (e na tabela, se o `DESIGN.md` mudou de estrutura) e na rubrica de `./references/aderencia.md` (item novo ou alterado, com a busca dele, e a versão da rubrica incrementada); comportamento por framework vai para `./references/adocao-por-framework.md`.
- Acrescente no topo de "Versões" do `LEIA-ME.md` uma entrada com a data e o que mudou.
- Ajuste descoberto numa aplicação que vale para todas volta para cá; não fica só no projeto.

Ao atualizar o impeccable no bundle, confira esta skill contra a versão nova: formato do `PRODUCT.md` (`reference/init.md`), seções do `DESIGN.md` e sidecar (`reference/document.md`), verbos do launcher e findings do `doctor`. Rode `impeccable detect --json` sobre `assets/kit/` para ver o que o detector novo acusa no próprio kit.
