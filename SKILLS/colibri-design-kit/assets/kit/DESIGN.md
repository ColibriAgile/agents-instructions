---
name: Colibri UI
description: Linha visual das aplicações Colibri — mesa de operação compacta, sóbria e precisa
colors:
  action: "#1b6ec2"
  action-hover: "#175fa9"
  action-border: "#0f5aa6"
  action-soft: "#e8f1fb"
  action-line: "#c5dbf3"
  page: "#f2f5f9"
  surface: "#ffffff"
  surface-2: "#f6f8fb"
  hover: "#f4f7fb"
  ink: "#1d2733"
  ink-2: "#4b5766"
  ink-3: "#66717e"
  line: "#dce2e9"
  line-strong: "#c7d0da"
  button-ink: "#495057"
  button-line: "#d7dee7"
  focus: "#93c5f2"
  success: "#1a7549"
  warning: "#875800"
  danger: "#b02637"
  sidebar: "linear-gradient(180deg, #043355 0%, #2aa3e7 100%)"
  sidebar-head: "linear-gradient(180deg, #043354 0%, #0b2a41 100%)"
  sidebar-ink: "#d7d7d7"
typography:
  page-title: { fontFamily: "Google Sans Flex", fontSize: "18px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }
  dialog-title: { fontFamily: "Google Sans Flex", fontSize: "16px", fontWeight: 650, lineHeight: 1.3 }
  section-title: { fontFamily: "Google Sans Flex", fontSize: "14px", fontWeight: 650, lineHeight: 1.3 }
  row-title: { fontFamily: "Google Sans Flex", fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }
  body: { fontFamily: "Google Sans Flex", fontSize: "13px", fontWeight: 400, lineHeight: 1.45 }
  nav: { fontFamily: "Google Sans Flex", fontSize: "14px", fontWeight: 400, lineHeight: 1.2 }
  label: { fontFamily: "Google Sans Flex", fontSize: "12px", fontWeight: 600, lineHeight: 1.3 }
  caption: { fontFamily: "Google Sans Flex", fontSize: "12px", fontWeight: 400, lineHeight: 1.3 }
  micro: { fontFamily: "Google Sans Flex", fontSize: "11px", fontWeight: 400, lineHeight: 1 }
  data: { fontFamily: "Google Sans Mono", fontSize: "12px", fontWeight: 500, lineHeight: 1.4 }
rounded:
  control: "3px"
  small: "4px"
  surface: "6px"
  tag: "10px"
sizes:
  control-height: "32px"
  topbar-height: "56px"
  sidebar-width: "230px"
  row-min-height: "42px"
  button-group-min-width: "120px"
motion:
  ease: "cubic-bezier(.22, 1, .36, 1)"
  state: "120-200ms"
  drawer: "260-280ms"
---

# Colibri UI — linha visual das aplicações Colibri

Este documento descreve a linha visual comum das aplicações Colibri e orienta a refatoração visual de cada uma delas. A implementação de referência está em `colibri-ui.css` (CSS puro, prefixo `cm-`); `colibri-ui.bootstrap3.css` e `colibri-ui.devexpress.css` são adaptadores opcionais; `logos/colibri-colorido.svg` é a marca da página inicial; `exemplo.html` mostra a marcação de cada componente.

Ao adotar em um repositório, copie este arquivo para a raiz como `DESIGN.md`, escreva o `PRODUCT.md` do produto (modelo em `PRODUCT.template.md`) e registre na seção "Implementação neste projeto" onde o CSS e os componentes ficam.

## 1. Visão geral

**Norte criativo: "Mesa de operação".** As aplicações Colibri são ferramentas de trabalho usadas por suporte, implantação e administradores, em estações Windows, à luz de escritório, muitas vezes com a janela reduzida até a largura de um tablet. A interface existe para consultar estado, identificar pendências e agir, sem atravessar espaços decorativos. O registro é de produto: sóbrio, preciso e discreto.

**Características:**

- Conteúdo útil na primeira tela; o cabeçalho nomeia a tarefa e cede espaço ao trabalho.
- Linhas e colunas para itens comparáveis; uma única superfície por lista, com divisores internos.
- Lateral de navegação em degradê azul Colibri, compacta e recolhível.
- Barra superior com o título da página selecionada, idioma e acesso (login ou usuário).
- Tema claro. Cor contida: o degradê fica na lateral e o azul de ação é reservado para ações e seleção.
- Tudo funciona sem internet: fontes e ícones são servidos pela própria aplicação.

## 2. Cores

Os valores exatos estão no frontmatter e nos tokens `--cm-*` de `colibri-ui.css`. Não crie variantes locais arbitrárias; derive tudo dos tokens.

- **Azul de ação** (`action`): botão principal, link, seleção, item ativo de grupo de alternância (fundo `action-soft`).
- **Neutros:** plano de trabalho (`page`), superfícies (`surface`, `surface-2`), divisores (`line`) e textos (`ink`, `ink-2`, `ink-3`). Texto de apoio nunca fica mais claro que `ink-3`.
- **Estados** (`success`, `warning`, `danger`, cada um com fundo `-soft` e borda `-line`): sempre acompanhados de rótulo ou ícone, nunca só a cor.
- **Lateral:** degradê `#043355 → #2aa3e7`; cabeçalho com o nome do produto em retângulo mais escuro (`#043354 → #0b2a41`); itens em `#d7d7d7`, peso regular; item ativo em branco sobre `rgba(255,255,255,.36)`; separadores em branco a 16%; versão no rodapé em 11 px, branco a 60%.
- **Foco:** contorno azul-claro (`focus`) de 2 px em botões e links; em campos, borda `focus` com halo `0 0 0 3px rgba(96,165,232,.22)`. Em botões o contorno é **interno** (`outline-offset: -3px`), sozinho ou em grupo: o botão focado sobe acima dos vizinhos, inclusive do principal, e nada encobre o contorno. No botão principal e no destrutivo o contorno é claro (`rgba(255,255,255,.7)`). Links mantêm o contorno externo.

**Regra da ação rara.** O acento indica ação ou seleção; não colore painéis grandes nem seções inativas.

## 3. Tipografia

- **Texto:** Google Sans Flex (WOFF2 local), fallback Segoe UI. **Dados:** Google Sans Mono (WOFF2 local), fallback Consolas — para versões, datas, horários, contagens, identificadores e logs, com algarismos tabulares.
- Escala fixa e compacta (ver frontmatter). O maior texto da página é o título da barra superior (18 px). Seções usam 14 px; linhas, 13 px; rótulos, 12 px peso 600 sem caixa alta.
- Texto corrido limitado a 65–80 caracteres por linha.

**Regra da informação primeiro.** Nunca use tipografia gigante para uma contagem que pode ficar ao lado do rótulo. Títulos dentro de conteúdo rico (descrições, notas) não passam de 16 px.

### Bibliotecas de componentes (DevExpress Blazor, DevExtreme React e similares)

**Regra da tipografia única.** Componentes de terceiros seguem a mesma tipografia da aplicação **inclusive nos elementos internos**: o calendário e o seletor de hora que abrem no controle de data/hora, listas suspensas, cabeçalhos, filtros e rodapés de grade, paginador, dicas (tooltips), mensagens de validação, notificações, painéis de carregamento e menus de contexto. Nenhum texto na tela pode aparecer na fonte padrão do tema da biblioteca (Segoe UI, Roboto, Inter, Helvetica).

- **Família:** Google Sans Flex (`--cm-font`) em todo texto; Google Sans Mono (`--cm-mono`) só onde o kit já usa dados (versões, identificadores, logs, colunas de data/hora e contagens em grades). O calendário e o relógio do editor de data/hora usam `--cm-font`.
- **Como aplicar:** carregue `colibri-ui.devexpress.css` depois do tema da biblioteca e de `colibri-ui.css`. Ele redefine as variáveis públicas de fonte (`--dxds-font-family-*` nos temas Fluent do DevExpress Blazor; `--bs-*` nos temas clássicos e Bootstrap externo) e fixa a fonte nas raízes do DevExtreme (`.dx-widget` e `.dx-overlay-wrapper`, que contém os popups). Prefira sempre variáveis públicas do tema; use classes internas (`--dxbl-*`, `.dxbl-*`) só quando não houver alternativa e registre o motivo na seção 9, pois mudam entre versões.
- **Popups ficam fora da página.** Calendários, listas suspensas e diálogos das bibliotecas costumam ser anexados ao `<body>`, fora do contêiner da aplicação. Por isso a fonte é definida em `:root`/`body` e nas classes raiz dos componentes — nunca apenas num contêiner como `.cm-page` ou `.app`.
- **Tamanho e peso também seguem a escala** (13 px corpo, 12 px rótulos e legendas, 600 em títulos de linha, 32 px de altura de controle). No DevExpress Blazor, escolha o `SizeMode` mais próximo da escala e ajuste o restante por variáveis `--dxds-font-size-*`; no DevExtreme, prefira os temas *compact*.
- **Fontes locais:** não carregue a fonte do tema da biblioteca (Roboto, Inter, Segoe via CDN ou pacote); as WOFF2 do kit bastam.
- **Verificação obrigatória:** abra o calendário e o seletor de hora de um campo de data/hora, uma lista suspensa, uma dica e uma mensagem de validação, e confira nas ferramentas do navegador (aba *Computed*, `font-family` e a fonte efetivamente renderizada) que todos usam Google Sans Flex. Repita ao atualizar a versão da biblioteca ou trocar o tema.

## 4. Elevação e movimento

- Plano por padrão: superfícies e divisores de 1 px organizam a informação. Sem sombra decorativa em cartões ou botões. Camadas flutuantes (diálogos, menus, gaveta, notificações) têm sombra funcional.
- Hover muda a superfície; não levanta cartões nem desloca listas.
- Transições de estado de 120–200 ms com `--cm-ease`. Painéis laterais deslizam da direita ao abrir e fechar (260–280 ms). Tudo respeita `prefers-reduced-motion` (troca por esmaecimento ou nada).

## 5. Estrutura da aplicação

- **Shell** (`.cm-shell`): lateral (`.cm-sidebar`, 230 px) + área principal (`.cm-main`) com barra superior (`.cm-topbar`, 56 px) e área rolável (`.cm-scroll` > `.cm-content`).
- **Lateral:** nome do produto no topo, sem ícone e sem versão, com botão de recolher à direita; navegação (`.cm-nav`) com ícone por item e grupos recolhíveis (`.cm-nav__section`); versão no rodapé (`.cm-sidebar__foot`). Até 920 px a lateral abre sobre o conteúdo com fundo escurecido; Esc fecha e o foco volta ao botão.
- **Barra superior:** título da página (`.cm-topbar__title`) à esquerda; à direita, idioma (menu `.cm-menu`), divisor e "Entrar" ou nome do usuário com opção de sair.
- **Avisos globais:** `.cm-banner--danger` / `--warning` logo abaixo da barra superior.

## 6. Anatomia de página

- A página **não repete** título nem subtítulo — a barra superior já nomeia a tarefa.
- Primeira linha: `.cm-toolbar`. À esquerda, busca (`.cm-search`) ou texto curto de contexto (`.cm-section__hint--toolbar`). À direita (`.cm-toolbar__end`), faixa de estado (`.cm-notice`) e grupo de ações (`.cm-btn-group`).
- Seções: `.cm-section__head` com título (`.cm-section__title`), contagem (`.cm-section__count`) e ferramentas à direita (`.cm-section__tools`).
- **Estado:** conexões e situações usam `.cm-notice` (neutro, `--success`, `--warning`, `--danger`); erros bloqueantes usam `.cm-alert`. Contagens de resumo viram `.cm-tag` no cabeçalho da seção — e, quando fizer sentido, `.cm-tag-filter` para filtrar a lista. Nunca cartões de métrica.
- **Cartões** (`.cm-cards` / `.cm-card`): apenas na página inicial e em resumos de poucos fatos. Pequenos e informativos: ícone + título + etiqueta de estado, um valor e no máximo uma linha de apoio. Cartão que leva a outra página é um link inteiro, com chevron.
- **Marca na página inicial** (`.cm-page--home`): toda aplicação Colibri exibe, **somente na página inicial**, o colibri colorido (`logos/colibri-colorido.svg`) como marca-d'água — é o elemento que identifica a linha visual entre os produtos. Basta acrescentar a classe ao contêiner da página: `<div class="cm-page cm-page--home">`. O CSS do kit fixa a marca no canto inferior direito da janela, com 12% de opacidade, até 540 px (42% da largura em janelas menores), atrás do conteúdo e sem receber cliques.
  - Use o SVG do kit sem alterar cores, proporção, opacidade, posição ou tamanho; não troque por PNG nem pela marca de outro produto.
  - Com `<img>` ou `<svg>` inline no lugar do pseudo-elemento, reproduza exatamente as mesmas regras (`position: fixed`, `opacity: .12`, `pointer-events: none`, `aria-hidden="true"`, atrás do conteúdo).
  - A marca é decorativa: nada de texto alternativo, foco ou animação; não pode encobrir cartões nem reduzir o contraste deles.
  - `position: fixed` depende de nenhum ancestral de `.cm-page` ter `transform`, `filter` ou `contain`; se a marca rolar junto com a página ou sumir, confira isso. O caminho `url('logos/…')` é relativo ao CSS: mantenha `logos/` ao lado de `colibri-ui.css`.
- **Vazio e carregamento:** `.cm-empty` com ícone e uma frase; carregamento com `bi-arrow-repeat cm-spin`.

## 7. Componentes

### Botões

- 32 px de altura, texto regular de 13 px em `#495057`, fundo branco, borda `#d7dee7`, cantos de 3 px (`.cm-btn`). Principal: `.cm-btn--primary` (`#1b6ec2`, borda `#0f5aa6`). Menor: `.cm-btn--sm` (28 px).
- **Ações de linha** (`.cm-icon-btn`): somente ícone, sem moldura; `title` e `aria-label` obrigatórios; destrutivas por último, vermelhas só no hover; ações indisponíveis ficam desabilitadas (não somem) para manter o alinhamento das colunas.

**Regra dos botões adjacentes (regra geral).** Botões com moldura lado a lado formam sempre um grupo (`.cm-btn-group`), nunca botões soltos com espaço entre eles:

- bordas compartilhadas, sem espaço, cantos arredondados só nas extremidades;
- largura mínima igual (120 px); grupos de alternância/ordenação usam `.cm-btn-group--compact` com `.cm-btn--toggle` e o item ativo em fundo azul-claro;
- o botão principal fica na extremidade direita;
- botões de grupo não levam ícone;
- rodapés de diálogo agrupam automaticamente.

### Navegação e listas

- **Tabela** (`.cm-table`): superfície única, cabeçalho compacto (`.cm-table__head`) e linhas (`.cm-table__item` > `.cm-table__row`) em CSS Grid com as mesmas colunas, definidas por `--cm-cols` no elemento da tabela — assim nada desalinha. Coluna de ações com largura fixa, alinhada à direita.
- **Ordenação:** cabeçalho ordenável é um botão (`.cm-sort`) com **uma única seta** indicando a direção; a seta só aparece na coluna ativa (e levemente no hover).
- **Detalhes:** o chevron (`.cm-disclosure`) fica na mesma linha do título e gira ao abrir; o detalhe (`.cm-table__detail`) fica alinhado ao texto da linha.
- **Listas de configuração:** rótulo, valor em fonte mono e ação de ícone "Alterar" por linha — em vez de campo somente-leitura com botão.
- **Etiquetas** (`.cm-tag`, variantes de estado e `--muted`): estado curto, módulos, chaves; listas de etiquetas em `.cm-tags`.
- **Responsivo:** perto da largura de tablet, esconder colunas secundárias; abaixo de 760 px, linhas viram blocos com rótulos (`.cm-cell__label`), preservando ações.

### Formulários

- Painel `.cm-panel.cm-form`, grupos em `.cm-fieldset` (legenda = título de seção), campos em `.cm-field` com rótulo sempre visível (`.cm-field__label`), controle `.cm-input` (32 px) e erro associado (`.cm-field__error`). Pares lado a lado em `.cm-form-row`; rótulo à esquerda em `.cm-form-grid`.
- Campo + botão ou prefixo/sufixo unidos: `.cm-input-group` com `.cm-input-addon`.
- Opções exclusivas com descrição: `.cm-choices` / `.cm-choice` (lado a lado, a escolhida em azul-claro).
- **Caixas de seleção e rádios:** 16 px, borda `#c7d0da`, cantos de 3 px (rádio circular); marcados preenchidos com o azul de ação e marca branca; foco com o halo azul-claro; opção dependente recuada (`.cm-check--nested`) e apagada quando desabilitada. Escolhas múltiplas curtas e relacionadas (ex.: dias da semana) usam grupo de alternância `.cm-toggles` / `.cm-toggle`.
- Salvar e Cancelar ficam em grupo à direita, abaixo do formulário (`.cm-form__footer`) ou no rodapé do painel (`.cm-form__actions`).
- **Assistentes:** `.cm-wizard` com etapas numeradas (`.cm-steps`) à esquerda e o conteúdo da etapa à direita.

### Camadas

- **Diálogo** (`.cm-dialog`): cabeçalho branco com título de 16 px e fechar à direita, corpo com 16 px de respiro, rodapé em `surface-2` com botões agrupados. Tab circula dentro do diálogo, Enter aciona o botão padrão, Esc cancela. Prefira resolver no próprio conteúdo antes de abrir um diálogo.
- **Botão padrão do diálogo:** é sempre o principal (à direita do grupo), inclusive em confirmações destrutivas (excluir, zerar): o diálogo já é o segundo passo, nomeia o alvo em negrito e Esc cancela. Com campos, o foco inicial vai para o primeiro campo e Enter em qualquer campo aciona o principal (envio do formulário). Sem campos, o principal recebe o foco ao abrir. Diálogo só de leitura, sem ação, não tem botão padrão: Esc fecha.
- **Painel lateral** (`.cm-drawer`, aberto com `.is-open`): desliza da direita, 420 px, cabeçalho de 56 px, itens separados por divisores.
- **Notificações:** canto superior direito, abaixo da barra superior; superfície branca, ícone colorido pelo estado, título de 13 px.
- **Menu suspenso** (`.cm-menu`): superfície branca, itens de 32 px, item atual em azul com marca.

### Ícones

Bootstrap Icons em fonte local (`.bi`). Um ícone por item de menu e por ação; tamanho de 15–16 px em navegação e ações, 14 px dentro de botões. Nada de imagens PNG/GIF para ícones ou carregamento.

## 8. Faça / Não faça

**Faça**

- Mostrar estado, pendências e ações possíveis na primeira área de trabalho.
- Usar os tokens e componentes do kit; se faltar algo, criar um componente `cm-` novo e documentá-lo aqui.
- Validar WCAG 2.2 AA: contraste, foco visível, Tab, Enter, Esc e movimento reduzido.
- Exibir a marca-d'água do colibri (`.cm-page--home`) na página inicial.
- Aplicar a tipografia do kit também aos elementos internos e popups de bibliotecas de componentes (DevExpress, DevExtreme etc.).
- Conferir alinhamento em 1440, 1920 e ~900 px de largura antes de concluir uma página.

**Não faça**

- Página com cara de promocional: heroes, subtítulos decorativos, eyebrows.
- Cartões de métrica, cartões em excesso ou cartões dentro de cartões para dados comparáveis.
- Interface espaçosa a ponto de esconder informação útil na primeira tela.
- Botões soltos lado a lado, ícones dentro de botões de grupo ou duas setas de ordenação.
- Fontes, estilos ou ícones hospedados fora da aplicação.
- Repetir a marca-d'água do colibri em outras páginas ou aumentar sua opacidade a ponto de competir com os dados.
- Deixar calendário, seletor de hora, listas suspensas, grades ou dicas de uma biblioteca na fonte padrão do tema dela.

## 9. Implementação neste projeto

_Preencher ao adotar:_ onde está o CSS (`colibri-ui.css` e, se usados, os adaptadores), onde ficam fontes, ícones e `logos/`, qual página recebe `.cm-page--home`, a biblioteca de componentes e o tema usados (com versão) e como cada componente é implementado no framework do projeto (componentes, diretivas, templates).
