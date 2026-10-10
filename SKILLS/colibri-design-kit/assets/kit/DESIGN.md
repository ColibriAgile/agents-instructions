---
name: Colibri UI
description: Linha visual das aplicações Colibri — perfis Admin e Operação, sóbria, precisa e direta
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
  dark-page: "#0b1822"
  dark-topbar: "#0e1d29"
  dark-surface: "#11222f"
  dark-surface-2: "#152838"
  dark-hover: "#193044"
  dark-ink: "#e3eaf0"
  dark-ink-2: "#adbac7"
  dark-ink-3: "#8b9cac"
  dark-line: "#223a4d"
  dark-line-strong: "#2e4a60"
  dark-action-ink: "#5fa9ec"
  dark-action-soft: "#12395a"
  dark-action-line: "#1f5485"
  dark-button-ink: "#cfd9e3"
  dark-focus: "#5fa9ec"
  dark-success: "#4cc38a"
  dark-warning: "#e2ae4a"
  dark-danger: "#f27d89"
  palette-verde: "#1e7a46"
  palette-laranja: "#b0500c"
  palette-azul: "#1d62ad"
  palette-roxo: "#6d3fa3"
  palette-vinho: "#a32c52"
  palette-petroleo: "#0e6d77"
  palette-marrom: "#7d5130"
  palette-grafite: "#4d5a68"
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
  touch-control: "6px"
  touch-card: "8px"
  touch-sheet: "12px"
  touch-tag: "4px"
sizes:
  control-height: "32px"
  topbar-height: "56px"
  sidebar-width: "230px"
  row-min-height: "36px"
  button-group-min-width: "120px"
  touch-target-tablet: "48px"
  touch-target-totem: "max(56px, 4.4vh)"
  touch-target-kds: "56px"
motion:
  ease: "cubic-bezier(.22, 1, .36, 1)"
  state: "120-200ms"
  drawer: "260-280ms"
  sheet: "260ms"
  alert: "1.2s"
---

# Colibri UI — linha visual das aplicações Colibri

Este documento descreve a linha visual comum das aplicações Colibri e orienta a refatoração visual de cada uma delas. A linha tem dois perfis sobre a mesma base (`colibri-base.css`: tokens dos dois temas, fontes e camadas): **Admin** (seções 1 a 8), para painéis, admins e ferramentas internas, e **Operação** (seção 9), as telas cheias de toque do cardápio do tablet, do totem, da produção do KDS e do painel de pedidos prontos. As seções 1 a 8 valem para o perfil Operação no que a seção 9 não muda (cores de estado, fontes, ícones, foco, tema por token). A implementação de referência do perfil Admin está em `colibri-ui.css` (CSS puro, prefixo `cm-`); a do perfil Operação, em `colibri-touch.css` (prefixo `ct-`), com o motor de esquema de cores `colibri-esquema.js` e a demonstração `exemplo-toque.html`; `colibri-ui.bootstrap3.css` e `colibri-ui.devexpress.css` são adaptadores opcionais; `logos/colibri-colorido.svg` é a marca da página inicial; `logos/colibri.ico` é o ícone da aba; `logos/colibri-marca.svg` é a marca da tela de entrada; `exemplo.html` mostra a marcação de cada componente e `exemplo-entrada.html`, a tela de entrada e a página de erro.

Ao adotar em um repositório, copie este arquivo para a raiz como `DESIGN.md`, escreva o `PRODUCT.md` do produto (modelo em `PRODUCT.template.md`) e registre na seção "Implementação neste projeto" onde o CSS e os componentes ficam.

## 1. Visão geral

**Norte criativo: "Admin".** As aplicações Colibri são ferramentas de trabalho usadas por suporte, implantação e administradores, em estações Windows, à luz de escritório, muitas vezes com a janela reduzida até a largura de um tablet. A interface existe para consultar estado, identificar pendências e agir, sem atravessar espaços decorativos. O registro é de produto: sóbrio, preciso e discreto.

**Características:**

- Conteúdo útil na primeira tela; o cabeçalho nomeia a tarefa e cede espaço ao trabalho.
- Linhas e colunas para itens comparáveis; uma única superfície por lista, com divisores internos.
- Lateral de navegação em degradê azul Colibri, compacta e recolhível.
- Barra superior com o título da página selecionada, idioma e acesso (login ou usuário).
- Tema claro e tema escuro em azul petróleo profundo, com a mesma lateral nos dois. Cor contida: o degradê fica na lateral e o azul de ação é reservado para ações e seleção.
- Tudo funciona sem internet: fontes e ícones são servidos pela própria aplicação.

## 2. Cores

Os valores exatos estão no frontmatter e nos tokens `--cm-*` de `colibri-ui.css`. Não crie variantes locais arbitrárias; derive tudo dos tokens.

- **Azul de ação** (`action`): botão principal, link, seleção, item ativo de grupo de alternância (fundo `action-soft`).
- **Neutros:** plano de trabalho (`page`), superfícies (`surface`, `surface-2`), divisores (`line`) e textos (`ink`, `ink-2`, `ink-3`). Texto de apoio nunca fica mais claro que `ink-3`.
- **Estados** (`success`, `warning`, `danger`, cada um com fundo `-soft` e borda `-line`): sempre acompanhados de rótulo ou ícone, nunca só a cor.
- **Lateral:** degradê `#043355 → #2aa3e7`; cabeçalho com o nome do produto em retângulo mais escuro (`#043354 → #0b2a41`); itens em `#d7d7d7`, peso regular; item ativo em branco sobre `rgba(255,255,255,.36)`; separadores em branco a 16%; versão no rodapé em 11 px, branco a 60%.
- **Foco:** contorno azul-claro (`focus`) de 2 px em botões e links; em campos, borda `focus` com halo `0 0 0 3px rgba(96,165,232,.22)`. Em botões o contorno é **interno** (`outline-offset: -3px`), sozinho ou em grupo: o botão focado sobe acima dos vizinhos, inclusive do principal, e nada encobre o contorno. No botão principal e no destrutivo o contorno é claro (`rgba(255,255,255,.7)`). Links mantêm o contorno externo. Em campo unido a botão ou a prefixo/sufixo (`.cm-input-group`), o halo contorna o **conjunto**, nunca só o campo: o campo focado fica com a borda `focus`, acima do vizinho na emenda, e o halo envolve campo e botão juntos, sem ser cortado pelo botão nem invadi-lo. O campo com erro também fica acima do vizinho, para a borda `danger` aparecer inteira.

**Regra da ação rara.** O acento indica ação ou seleção; não colore painéis grandes nem seções inativas.

### Tema escuro

O tema escuro é o mesmo sistema com outros valores de token: nenhuma regra, medida ou componente muda. Liga com `data-theme="dark"` no `<html>`; `colibri-ui.css` troca os tokens `--cm-*` e declara `color-scheme: dark`.

- **Neutros em azul petróleo profundo**, no matiz do cabeçalho da lateral (`#043354`), nunca preto nem cinza neutro: plano de trabalho `dark-page`, barra superior `dark-topbar`, superfícies `dark-surface` e `dark-surface-2`, hover `dark-hover`, divisores `dark-line` e `dark-line-strong`, textos `dark-ink`, `dark-ink-2` e `dark-ink-3`. A diferença entre as camadas é sutil, como no tema claro.
- **Lateral igual nos dois temas:** o mesmo degradê, cabeçalho, itens e rodapé. O tema escuro não ganha degradê novo; o suave de `.cm-scroll` apenas acompanha os neutros.
- **Azul de ação:** o preenchimento (botão principal, caixa marcada, barra de progresso) continua `action` com texto branco. Texto, link, ícone e item ativo em azul usam `--cm-accent-ink` (`dark-action-ink` no escuro, igual a `action` no claro), porque `action` sobre a superfície escura não atinge o contraste de texto. Seleção em `dark-action-soft` com borda `dark-action-line`.
- **Estados:** `dark-success`, `dark-warning` e `dark-danger` como texto sobre o `-soft` escuro de cada um, com a mesma regra de rótulo ou ícone.
- **Sombras** das camadas flutuantes ficam mais densas (preto com opacidade), porque a sombra azulada do tema claro some no fundo escuro.
- **Contraste:** texto de apoio (`dark-ink-3`) com no mínimo 4,5:1 sobre plano, superfícies e hover; `dark-action-ink` com 4,5:1 também sobre `dark-action-soft`.
- **Escolha da pessoa:** a alternância fica na barra superior. Enquanto a pessoa não escolhe, segue `prefers-color-scheme`; a escolha fica gravada no navegador e vale na próxima visita. A aplicação aplica o atributo antes de pintar, para não piscar o tema claro.
- **Bibliotecas de componentes** acompanham o tema: o modo escuro do tema da biblioteca (paleta `dark` no MUI, tema *dark* do DevExtreme) ou os componentes vestidos com os tokens `--cm-*`. Nenhum componente fica claro dentro do tema escuro.
- A marca-d'água da página inicial não muda (mesmo SVG, mesma opacidade).

**Regra do tema por token.** Cor de tema escuro só existe como token `--cm-*`. Nenhuma tela escreve cor própria para o escuro nem testa o tema no código para escolher cor; o que muda de um tema para outro é o valor do token.

## 3. Tipografia

- **Texto:** Google Sans Flex (WOFF2 local), fallback Segoe UI. **Dados:** Google Sans Mono (WOFF2 local), fallback Consolas — para versões, datas, horários, contagens, identificadores e logs, com algarismos tabulares.
- Escala fixa e compacta (ver frontmatter). O maior texto da página é o título da barra superior (18 px). Seções usam 14 px; linhas, 13 px; rótulos, 12 px peso 600 sem caixa alta (o rótulo de campo com linha de 14 px, para ficar junto do controle; seção 7, "Formulários").
- Texto corrido limitado a 65–80 caracteres por linha.

**Regra da informação primeiro.** Nunca use tipografia gigante para uma contagem que pode ficar ao lado do rótulo. Títulos dentro de conteúdo rico (descrições, notas) não passam de 16 px.

### Bibliotecas de componentes (DevExpress Blazor, DevExtreme React e similares)

**Regra da tipografia única.** Componentes de terceiros seguem a mesma tipografia da aplicação **inclusive nos elementos internos**: o calendário e o seletor de hora que abrem no controle de data/hora, listas suspensas, cabeçalhos, filtros e rodapés de grade, paginador, dicas (tooltips), mensagens de validação, notificações, painéis de carregamento e menus de contexto. Nenhum texto na tela pode aparecer na fonte padrão do tema da biblioteca (Segoe UI, Roboto, Inter, Helvetica).

- **Família:** Google Sans Flex (`--cm-font`) em todo texto; Google Sans Mono (`--cm-mono`) só onde o kit já usa dados (versões, identificadores, logs, colunas de data/hora e contagens em grades). O calendário e o relógio do editor de data/hora usam `--cm-font`.
- **Como aplicar:** carregue `colibri-ui.devexpress.css` depois do tema da biblioteca e de `colibri-ui.css`. Ele redefine as variáveis públicas de fonte (`--dxds-font-family-*` nos temas Fluent do DevExpress Blazor; `--bs-*` nos temas clássicos e Bootstrap externo) e fixa a fonte nas raízes do DevExtreme (`.dx-widget` e `.dx-overlay-wrapper`, que contém os popups). Prefira sempre variáveis públicas do tema; use classes internas (`--dxbl-*`, `.dxbl-*`) só quando não houver alternativa e registre o motivo na seção 10, pois mudam entre versões.
- **Popups ficam fora da página.** Calendários, listas suspensas e diálogos das bibliotecas costumam ser anexados ao `<body>`, fora do contêiner da aplicação. Por isso a fonte é definida em `:root`/`body` e nas classes raiz dos componentes — nunca apenas num contêiner como `.cm-page` ou `.app`.
- **Tamanho e peso também seguem a escala** (13 px corpo, 12 px rótulos e legendas, 600 em títulos de linha, 32 px de altura de controle; grades pela regra da grade como tabela, seção 7). No DevExpress Blazor, escolha o `SizeMode` mais próximo da escala e ajuste o restante por variáveis `--dxds-font-size-*`; no DevExtreme, prefira os temas *compact*.
- **Fontes locais:** não carregue a fonte do tema da biblioteca (Roboto, Inter, Segoe via CDN ou pacote); as WOFF2 do kit bastam.
- **Verificação obrigatória:** abra o calendário e o seletor de hora de um campo de data/hora, uma lista suspensa, uma dica e uma mensagem de validação, e confira nas ferramentas do navegador (aba *Computed*, `font-family` e a fonte efetivamente renderizada) que todos usam Google Sans Flex. Repita ao atualizar a versão da biblioteca ou trocar o tema.

## 4. Elevação e movimento

- Plano por padrão: superfícies e divisores de 1 px organizam a informação. Sem sombra decorativa em cartões ou botões. Camadas flutuantes (diálogos, menus, gaveta, notificações) têm sombra funcional.
- Hover muda a superfície; não levanta cartões nem desloca listas.
- Transições de estado de 120–200 ms com `--cm-ease`. Painéis laterais deslizam da direita ao abrir e fechar (260–280 ms). Tudo respeita `prefers-reduced-motion` (troca por esmaecimento ou nada).

## 5. Estrutura da aplicação

- **Shell** (`.cm-shell`): lateral (`.cm-sidebar`, no mínimo 230 px) + área principal (`.cm-main`) com barra superior (`.cm-topbar`, 56 px) e área rolável (`.cm-scroll` > `.cm-content`).
- **Lateral:** nome do produto no topo, sem ícone e sem versão, com botão de recolher à direita; navegação (`.cm-nav`) com ícone por item e grupos recolhíveis (`.cm-nav__section`); versão no rodapé (`.cm-sidebar__foot`). Até 920 px a lateral abre sobre o conteúdo com fundo escurecido; Esc fecha e o foco volta ao botão.
- **Rótulos da lateral:** sempre completos e em uma linha. A lateral cresce até o rótulo mais longo, em qualquer idioma da aplicação, e 230 px é o mínimo. Nunca use reticências, quebra de linha ou texto abreviado só para caber. Recolher um grupo esconde a lista (atributo `hidden`) sem mudar a largura da lateral.
- **Barra superior:** título da página (`.cm-topbar__title`) à esquerda; à direita, alternância de tema (`.cm-topbar__action` só com ícone, `bi-moon` no claro e `bi-sun` no escuro, com `aria-label` e `title` dizendo o tema que vai ligar), idioma (menu `.cm-menu`), divisor e "Entrar" ou nome do usuário com opção de sair.
- **Avisos globais:** `.cm-banner--danger` / `--warning` logo abaixo da barra superior.
- **Ícone da aba:** toda aplicação Colibri usa `logos/colibri.ico` (colibri branco sobre o degradê azul da lateral, de 16 a 256 px no mesmo arquivo) como ícone da aba e dos atalhos, declarado na entrada HTML com `<link rel="icon" href="…/colibri.ico">`. É o mesmo nos dois temas e em todos os produtos.
  - Use o arquivo do kit sem alterar cores, recorte ou tamanhos; não troque pelo ícone padrão do framework (React, Blazor, Angular), por um ícone da identidade anterior nem pelo de outro produto.
  - O ícone é pedido pelo navegador direto da entrada HTML, fora do CSS: sirva o arquivo de uma pasta pública do projeto, no caminho que o `<link>` aponta.
  - Ao trocar um ícone antigo, mude o nome do arquivo ou acrescente versão ao endereço (`?v=`), porque o navegador guarda o ícone em cache por muito tempo.
  - Páginas sem `<link rel="icon">` (respostas do backend, documentação da API) fazem o navegador pedir `/favicon.ico` na raiz: responda esse endereço com o mesmo arquivo (cópia ou redirecionamento).
- **Tela de entrada (login) e páginas de erro** (`.cm-login`): ficam fora do shell, sobre o plano de trabalho (`page`), com a marca acima de um cartão.
  - **Marca:** `logos/colibri-marca.svg` (o colibri branco sobre o quadrado no degradê azul da lateral, o mesmo desenho do ícone da aba) com 36 px, seguida do nome do produto em 20 px peso 700 (`.cm-login__brand`). Use o SVG do kit sem alterar cores, recorte ou proporção. É a única marca da tela: o nome do produto na lateral continua sem ícone.
  - **Cartão** (`.cm-panel.cm-form.cm-login__card`, 360 px, 24 px de respiro): título de 18 px (`.cm-login__title`), uma linha de apoio (`.cm-login__text`), campos `.cm-field` e o botão principal na largura do cartão (`.cm-login__submit`). Credencial recusada: `.cm-notice--danger` acima dos campos e o campo marcado como inválido.
  - **Páginas de erro** (404, 500, ambiente não encontrado, navegador não suportado): o mesmo cartão com `.cm-error`: ícone em `ink-3`, título com o código do erro, uma frase e um link de volta (`.cm-btn.cm-error__back`).
  - Sem degradê (é da lateral) e sem marca-d'água (é da página inicial). A página carrega só os ícones e `colibri-ui.css` (sem o CSS do framework nem o legado da aplicação) e aplica o tema gravado antes do primeiro desenho, como a aplicação.

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
- **Listas lado a lado** (seleção numa coluna e resultado na outra): cada coluna ocupa a altura da área e a tabela rola por dentro, com o cabeçalho fixo; as tabelas terminam na mesma linha, mesmo com poucas linhas ou só o estado vazio. Cabeçalhos de seção com a mesma altura, com ou sem botões, e a busca de cada coluna na mesma altura, antes de qualquer alternância (ex.: Grupo | Combo). Abaixo da largura de tablet as colunas empilham.

## 7. Componentes

### Botões

- 32 px de altura, texto regular de 13 px em `#495057`, fundo branco, borda `#d7dee7`, cantos de 3 px (`.cm-btn`). Principal: `.cm-btn--primary` (`#1b6ec2`, borda `#0f5aa6`). Menor: `.cm-btn--sm` (28 px).
- **Ações de linha** (`.cm-icon-btn`): somente ícone, sem moldura; `title` e `aria-label` obrigatórios; destrutivas por último, vermelhas só no hover; ações indisponíveis ficam desabilitadas (não somem) para manter o alinhamento das colunas.
- **Ação destrutiva secundária** (excluir um item dentro do diálogo de edição dele): botão comum com o texto em `danger` (`.cm-btn--danger-text`), à esquerda no rodapé, fora do grupo Cancelar | Confirmar (`.cm-dialog__aside`). O vermelho preenchido fica para quando a destruição é a ação principal.

**Regra dos botões adjacentes (regra geral).** Botões com moldura lado a lado formam sempre um grupo (`.cm-btn-group`), nunca botões soltos com espaço entre eles:

- bordas compartilhadas, sem espaço, cantos arredondados só nas extremidades;
- largura mínima igual (120 px); grupos de alternância/ordenação usam `.cm-btn-group--compact` com `.cm-btn--toggle` e o item ativo em fundo azul-claro;
- o botão principal fica na extremidade direita;
- botões de grupo não levam ícone;
- rodapés de diálogo agrupam automaticamente.

### Navegação e listas

- **Tabela** (`.cm-table`): superfície única, cabeçalho compacto (`.cm-table__head`) e linhas (`.cm-table__item` > `.cm-table__row`) em CSS Grid com as mesmas colunas, definidas por `--cm-cols` no elemento da tabela — assim nada desalinha. Coluna de ações com largura fixa, alinhada à direita.
- **Ordenação:** cabeçalho ordenável é um botão (`.cm-sort`) com **uma única seta** indicando a direção; a seta só aparece na coluna ativa (e levemente no hover). A lista abre ordenada pela coluna descritiva (nome, descrição), não pelo código; códigos e demais números ordenam pelo valor numérico (2 antes de 10), mesmo quando chegam como texto.
- **Colunas numéricas** (código, ordem, quantidade, valor, preço): título e valor alinhados à direita (`.cm-cell--end` no título e na célula). No título que ordena (`.cm-sort.cm-cell--end`), a seta vai à esquerda do rótulo, para o texto terminar na mesma borda dos números, com ou sem seta. Abaixo de 760 px, na linha em bloco, o número volta para junto do rótulo. Identificadores alfanuméricos (código de barras, código externo) e horários ficam como texto, à esquerda.
- **Ações da entidade da página** (editar, copiar, excluir o registro escolhido no seletor da página): botões no grupo de ações da barra, ao lado de "Novo", nunca escondidas num menu ⋮; o menu fica para ações secundárias. Com alterações pendentes, elas dão lugar a Cancelar | Salvar.
- **Detalhes:** o chevron (`.cm-disclosure`) fica na mesma linha do título e gira ao abrir; o detalhe (`.cm-table__detail`) fica alinhado ao texto da linha.
- **Ficha do registro** no detalhe (`.cm-record`): campos agrupados em blocos com título (ex.: identificação, descrições, produção; `.cm-record__data`, até três lado a lado, dois perto da largura de tablet e um abaixo de 760 px), cada bloco com pares rótulo/valor (`.cm-pairs`, um `<dl>`) com divisor discreto entre os pares e o rótulo mais leve que o valor; a imagem do registro, se houver, à direita (`.cm-record__media`); opções e listas relacionadas na largura toda (`.cm-record__wide`), e itens do registro abaixo, depois de um divisor (`.cm-record__section`). Nunca pares soltos numa grade sem agrupamento.
- **Listas de configuração:** rótulo, valor em fonte mono e ação de ícone "Alterar" por linha — em vez de campo somente-leitura com botão.
- **Etiquetas** (`.cm-tag`, variantes de estado e `--muted`): estado curto, módulos, chaves; listas de etiquetas em `.cm-tags`.
- **Opções sim/não** de um registro, como etiquetas: ligada na etiqueta padrão com `bi-check-circle-fill`; desligada em `.cm-tag--off` (apagada, **sem risco**) com `bi-x-circle`. As ligadas vêm primeiro. O texto da etiqueta diz a opção, e o estado vai também para leitores de tela.
- **Descrições que chegam em maiúsculas** de outro sistema (ex.: cadastro do PDV): nas listas, exiba em caixa de frase ("Molhos e adicionais"), com a primeira letra maiúscula mesmo depois de números. Só a exibição muda: busca, ordenação, edição, campos da ficha e arquivos exportados usam o valor gravado. Nas grades que exportam, aplique no modelo da célula, não na formatação que vai ao arquivo. Textos que reproduzem outro sistema (ex.: botões do PDV) ficam como gravados.
- **Responsivo:** perto da largura de tablet, esconder colunas secundárias; abaixo de 760 px, linhas viram blocos com rótulos (`.cm-cell__label`), preservando ações.

**Regra da grade como tabela.** Grades de bibliotecas de componentes (DataGrid do DevExtreme, DxGrid do DevExpress Blazor e similares) têm a mesma anatomia e os mesmos tokens da `.cm-table`; lado a lado, não se distingue uma da outra:

- cabeçalho de 36 px em `surface-2`, rótulo de 12 px peso 600 em `ink-2`;
- linhas de no mínimo 36 px mais o divisor, com 2 px de respiro e texto de 13 px (um controle de 32 px na linha, como o campo editável, cabe sem aumentá-la); recuo de 16 px na primeira coluna, 12 px na última e 16 px entre colunas;
- superfície única: sem linhas alternadas (zebra) e sem linhas de coluna; divisor de 1 px em `line`, também na linha selecionada e na linha em edição; hover troca a superfície; seleção em `action-soft`;
- a moldura e os cantos são do `.cm-panel` que envolve a grade, sem sombra; a borda própria da grade fica desligada;
- versões, datas e contagens em mono de 12 px; o rótulo do cabeçalho continua na fonte de texto;
- caixas de seleção e ações de linha com o visual do kit (caixa de 16 px, `.cm-icon-btn`), nunca na cor de destaque do tema da biblioteca;
- colunas numéricas com título e valor à direita, como na `.cm-table`;
- seta do agrupamento inteira, numa coluna de 30 px.

`colibri-ui.devexpress.css` aplica a regra ao DevExtreme (no React: `showBorders={false}`, sem `rowAlternationEnabled`, `cssClass="cm-mono"` nas colunas de dados, `alignment="right"` nas numéricas). O TreeList do DevExtreme não é coberto pelo adaptador: prefira uma `.cm-table` com recuo pelo nível. No DevExpress Blazor, aplique pelas variáveis `--dxbl-grid-*` do tema e registre na seção 10.

### Formulários

- Painel `.cm-panel.cm-form`, grupos em `.cm-fieldset` (legenda = título de seção), campos em `.cm-field` com rótulo sempre visível (`.cm-field__label`), controle `.cm-input` (32 px) e erro associado (`.cm-field__error`). O rótulo fica junto do controle: linha de 14 px e 2 px entre as caixas, com as letras a cerca de 4 px do controle, dentro e fora de diálogos. Campo somente leitura em `surface-2` com texto `ink-2`; campo desabilitado (depende de uma opção desmarcada) em `surface-2`, texto e borda apagados e rótulo em `ink-3`, sem sumir. Pares lado a lado em `.cm-form-row`; rótulo à esquerda em `.cm-form-grid`.
- Campo + botão ou prefixo/sufixo unidos: `.cm-input-group` com `.cm-input-addon`. No foco, o halo contorna o conjunto (seção 2, "Foco"); o botão do conjunto mantém o próprio contorno interno.
- Opções exclusivas com descrição: `.cm-choices` / `.cm-choice` (lado a lado, a escolhida em azul-claro).
- **Caixas de seleção e rádios:** 16 px, borda `#c7d0da`, cantos de 3 px (rádio circular); marcados preenchidos com o azul de ação e marca branca; foco com o halo azul-claro; opção dependente recuada (`.cm-check--nested`) e apagada quando desabilitada. Escolhas múltiplas curtas e relacionadas (ex.: dias da semana) usam grupo de alternância `.cm-toggles` / `.cm-toggle`.
- Salvar e Cancelar ficam em grupo à direita, abaixo do formulário (`.cm-form__footer`) ou no rodapé do painel (`.cm-form__actions`).
- **Assistentes:** `.cm-wizard` com etapas numeradas (`.cm-steps`) à esquerda e o conteúdo da etapa à direita.
- **Edição em lote** (alterar um campo em vários registros de uma vez): os registros escolhidos numa lista do kit com caixas (em árvore pelo recuo, quando houver hierarquia) e busca; ao lado, cada campo com uma caixa que o inclui na alteração e o controle desabilitado até ela ser marcada; opções sim/não num grupo de alternância "Manter | Sim | Não". Só o que foi marcado muda.

### Camadas

- **Diálogo** (`.cm-dialog`): cabeçalho branco com título de 16 px e fechar à direita, corpo com 16 px de respiro, rodapé em `surface-2` com botões agrupados. Campos no corpo usam `.cm-field`, com o rótulo junto do controle (letras a cerca de 4 px), como fora do diálogo. Tab circula dentro do diálogo, Enter aciona o botão padrão, Esc cancela. Prefira resolver no próprio conteúdo antes de abrir um diálogo.
- **Botão padrão do diálogo:** é sempre o principal (à direita do grupo), inclusive em confirmações destrutivas (excluir, zerar): o diálogo já é o segundo passo, nomeia o alvo em negrito e Esc cancela. Com campos, o foco inicial vai para o primeiro campo e Enter em qualquer campo aciona o principal (envio do formulário). Sem campos, o principal recebe o foco ao abrir. Diálogo só de leitura, sem ação, não tem botão padrão: Esc fecha.
- **Painel lateral** (`.cm-drawer`, aberto com `.is-open`): desliza da direita, 420 px, cabeçalho de 56 px, itens separados por divisores.
- **Notificações:** canto superior direito, abaixo da barra superior; superfície branca, ícone colorido pelo estado, título de 13 px. Vale para qualquer biblioteca de notificação (angular-growl e pnotify estão no adaptador Bootstrap 3).
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
- Conferir cada página nos dois temas, inclusive popups e componentes de bibliotecas.
- Usar o ícone da aba do kit (`logos/colibri.ico`).
- Alinhar à direita o título e o valor das colunas numéricas, em tabelas e grades.

**Não faça**

- Página com cara de promocional: heroes, subtítulos decorativos, eyebrows.
- Cartões de métrica, cartões em excesso ou cartões dentro de cartões para dados comparáveis.
- Interface espaçosa a ponto de esconder informação útil na primeira tela.
- Botões soltos lado a lado, ícones dentro de botões de grupo ou duas setas de ordenação.
- Fontes, estilos ou ícones hospedados fora da aplicação.
- Repetir a marca-d'água do colibri em outras páginas ou aumentar sua opacidade a ponto de competir com os dados.
- Deixar calendário, seletor de hora, listas suspensas, grades ou dicas de uma biblioteca na fonte padrão do tema dela.
- Grade de biblioteca com as linhas altas, a zebra, as bordas ou a cor de destaque do tema dela.
- Tema escuro em preto ou cinza neutro, com degradê fora da lateral ou com cor escrita na tela em vez de token.
- Ícone da aba padrão do framework, da identidade anterior ou de outro produto.
- Riscar a opção desligada ou mostrá-la só pela cor.
- Botão vermelho preenchido para excluir um item dentro do diálogo de edição dele.
- Halo de foco só no campo de um conjunto unido, cortado pelo botão ou invadindo a borda dele.

## 9. Perfil Operação

Telas cheias de toque: cardápio do tablet (Mesa, Comanda e Autoficha), totem de autoatendimento, telas de produção do KDS (cozinha, estação, expedição, consolidado, delivery) e painel de pedidos prontos. É o mesmo sistema da base (fontes, ícones, estados, foco, movimento, tema por token); mudam a escala, a composição e, nas telas voltadas ao cliente da loja, as cores. Implementação em `colibri-touch.css` (prefixo `ct-`, importa `colibri-base.css`), motor de esquema em `colibri-esquema.js` e marcação de cada componente em `exemplo-toque.html` (`#tablet`, `#tablet-folha`, `#totem`, `#kds`, `#kds-claro`, `#pronto`).

**Norte criativo: "Operação".** A tela atende alguém em pé, de passagem ou com as mãos ocupadas: uma tarefa por vez, a ação principal sempre à vista e o que importa (preço, senha, tempo, quantidade) grande o bastante para ler de onde a pessoa está.

**Características:**

- Uma tarefa por tela ou folha; a ação principal fica sempre visível e ao alcance.
- Alvo de toque grande em toda ação; nada depende de hover, teclado ou gesto escondido (o único gesto oculto permitido é o acesso do atendente ao menu de serviço).
- Telas voltadas ao cliente da loja usam o esquema de cores do canal; telas de produção do KDS usam o tema Colibri.
- A informação principal é grande: preço, senha, timer, quantidade.
- Funciona sem internet e no piso Chrome 101.

### Fronteira e cores

- **Consumidor** (cardápio do tablet, totem, painel de pedidos prontos): cada canal de venda tem o seu esquema de cores, definido pelo lojista com três sementes: **Ambiente** (fundo; dele saem superfícies, linhas e textos), **Ação** (Adicionar, Finalizar, Pagar, opção escolhida, categoria ativa, foco) e **Marca**, opcional (nome da loja, preço, selo "Destaque"; vazia, é igual à Ação). `colibri-esquema.js` deriva os tokens `--ct-*` em hex e decide o modo (claro ou escuro) pela luminância do Ambiente. A loja aparece pelo logo e pelo nome no cabeçalho; a marca Colibri fica no ícone do aplicativo, na abertura e no admin (confirmado em 09/10/2026; está previsto um logo pequeno da Colibri na tela de destaques, a definir).
- **Produção** (telas de produção do KDS): tema Colibri, claro ou escuro (`data-theme`), sem esquema do lojista. Sem esquema aplicado, os `--ct-*` são os `--cm-*` da base.
- **Contraste garantido por ajuste, não por aviso:** textos (`ink`, `ink-2`, `ink-3`, texto da ação e da marca) e estados com 4,5:1 sobre o fundo e as superfícies; preenchimentos de ação e marca com 3:1 sobre o fundo e as superfícies; o texto sobre o preenchimento com 4,5:1; texto sobre a seleção (`action-soft`) com 4,5:1. Quando a semente não atinge, o motor muda só a luminosidade (matiz e croma ficam) e devolve a lista de ajustes, que a prévia do admin mostra.
- **Estados não são configuráveis:** sucesso, aviso e erro são os da base no modo decidido (o motor os emite também como `--ct-*`, para a prévia funcionar dentro de um contêiner).
- **Aplicação:** no app, `aplicarEsquema(esquema)` grava os tokens e `data-theme` no `<html>`; grave o último esquema derivado (tokens e modo) e aplique-o no script de pré-pintura, sem recalcular, para não piscar o tema padrão. Na prévia do admin, `aplicarEsquema(esquema, contêiner)`.
- **Paleta curada:** oito cores fixas com no mínimo 5,2:1 sobre texto branco, nos dois temas: **Verde** (#1e7a46), **Laranja** (#b0500c), **Azul** (#1d62ad), **Roxo** (#6d3fa3), **Vinho** (#a32c52), **Petróleo** (#0e6d77), **Marrom** (#7d5130), **Grafite** (#4d5a68). Usada nos tipos de pedido e nas estações do KDS e nos selos categóricos (Combo em roxo, Rodízio em verde). Padrão dos tipos de pedido: Balcão verde, Retirada laranja, Entrega petróleo, Mesa azul, Ficha/Comanda roxo, sem tipo grafite. O lojista troca a cor de um tipo ou de uma estação escolhendo dentro da paleta; nunca hex livre.

**Regra do esquema por sementes.** O lojista escolhe papéis, não tokens: três sementes por canal (Ambiente, Ação, Marca opcional), tudo o mais derivado pelo motor do kit, com o contraste garantido por ajuste. Nenhuma tela oferece campo de cor por token, nenhum app deriva cor por conta própria e estados e urgência nunca são configuráveis.

### Escala por superfície

Uma classe no contêiner da aplicação (`.ct-app` + superfície) define o alvo de toque e a escala de texto (`--ct-text-sm` a `--ct-text-display`):

| Superfície | Classe | Alvo mínimo | Corpo | Destaque (display) |
|---|---|---|---|---|
| Tablet (paisagem, referência 1024×600) | `.ct-app--tablet` | 48 px | 16 px | 40 px |
| Totem (retrato, de 800×1280 a 2160×3840) | `.ct-app--totem` | `max(56px, 4.4vh)` | `max(16px, 1.45vh)` | `max(40px, 6vh)` |
| KDS (monitor ou TV, 1 a 3 m, com o zoom da estação) | `.ct-app--kds` | 56 px | 18 px | 48 px |
| Pedidos prontos (TV, 2 a 5 m, só leitura) | `.ct-app--tv` | 56 px | 24 px | 96 px |

- Nenhum alvo de toque fica abaixo do mínimo da superfície, inclusive +/− de quantidade, fechar e ações de linha; entre alvos vizinhos, no mínimo 8 px.
- Preço, senha, timer, quantidade e número do pedido são a informação principal e podem ser grandes (a regra da informação primeiro, seção 3, é do perfil Admin). Timer, senha e números de pedido em Google Sans Mono com algarismos tabulares; preço em Google Sans Flex com algarismos tabulares.
- Quiosque (tablet de mesa, totem, TV): `.ct-app--kiosk` tira a seleção de texto, o zoom por toque duplo e a rolagem elástica.

### Composição

- Tela cheia, sem o shell do perfil Admin: cabeçalho (`.ct-header`, logo e nome da loja à esquerda, ações à direita), navegação de categorias, conteúdo rolável e rodapé de pedido (`.ct-footer`, resumo à esquerda e a ação principal à direita, sempre visível).
- Categorias: coluna (`.ct-rail`) em paisagem, faixa rolável (`.ct-chips`) em retrato e nas subcategorias. A ativa no rail fica no fundo suave da ação com texto na cor de ação; na faixa, preenchida com a cor de ação. Sem faixa lateral colorida.
- Uma ação principal por tela ou folha, na extremidade direita ou na largura toda, embaixo.
- **Folha** (`.ct-sheet`): sobe da base em retrato; centralizada (`.ct-sheet--center`) em paisagem. Título, fechar com alvo inteiro, corpo rolável e rodapé em `surface-2` com a ação principal maior. Tocar no véu fecha; Esc também, quando houver teclado.
- **Cartões** são permitidos onde são a unidade da tarefa: produto (`.ct-product`) e pedido (`.ct-order`, `.ct-ready`). Sem cartões de métrica e sem cartão dentro de cartão.
- KDS: grade de colunas (`.ct-orders`, `--ct-cols`), cartões alinhados ao topo; contagens de atenção e atraso como etiquetas de estado na barra da estação.

### Componentes

- **Cantos discretos, para um perfil profissional:** 6 px em controles (botões, abas de categoria, quantidade, confirmação), 8 px em cartões, 12 px em folhas e diálogos e 4 px em selos, marcas de opção e observações. Nenhuma forma de pílula; só o rádio é redondo.
- **Botões** (`.ct-btn`): altura do alvo da superfície, texto de `--ct-text-lg` peso 600, cantos de 6 px. Principal `.ct-btn--primary` (ação com o texto derivado), secundário (`surface-2` com linha), `.ct-btn--ghost` (texto na cor de ação), `.ct-btn--danger` (texto de erro sobre o fundo suave de erro, nunca vermelho preenchido), `.ct-btn--block` e `.ct-btn--lg`. Ícone dentro do botão é permitido. Retorno de toque por `transform: scale(.97)` e a cor pressionada; desabilitado continua visível, apagado. Botão só com ícone: `.ct-icon-btn`, com o alvo inteiro e `aria-label` obrigatório.
- **Quantidade** (`.ct-qty`): − valor +, cada botão com o alvo inteiro, valor com algarismos tabulares e anunciado a leitores de tela.
- **Selos** (`.ct-tag`, cantos de 4 px): neutro, `--brand` (Destaque), `--success`, `--warning`, `--danger` e os categóricos `--combo` e `--rodizio`, sempre com texto.
- **Cartão de produto** (`.ct-product`): foto 4:3 (ícone em `ink-3` sem foto), selos sobre a foto, nome, descrição de até duas linhas, preço (`.ct-price`, na cor de texto da marca; "a partir de" em `ink-3`) e a ação. Formato linha (`.ct-product--row`) com a foto à esquerda. Indisponível (`.is-unavailable`): continua na lista, apagado, com o motivo num selo e a ação desabilitada.
- **Opções** (`.ct-option`, jornada, combo e observações): linha com no mínimo o alvo mais 8 px, marca de 28 px (quadrada; redonda em `.ct-option--radio`), adicional de preço à direita; escolhida no fundo suave da ação, com a marca preenchida.
- **Campos** (`.ct-field` com `.ct-field__label`, `.ct-input`, `.ct-field__hint` e `.ct-field__error`): rótulo sempre visível acima do campo, campo da altura do alvo de toque com texto de `--ct-text-lg`, fundo `surface-2`, linha e cantos de 6 px; a borda vai para o foco no foco e para o erro com `.is-invalid`; `textarea` com duas alturas de alvo; obrigatório marcado com `.ct-field__required`, sempre junto do texto do rótulo. Caixa de seleção de toque (`.ct-check`): a linha inteira é o alvo, caixa de 24 px na cor de ação.
- **Avisos** (`.ct-notice`, variantes de estado) com ícone e texto; confirmação curta (`.ct-toast`, "adicionado") centralizada embaixo, some sozinha; vazio (`.ct-empty`) com ícone e uma frase; carregamento com `bi-arrow-repeat ct-spin` e texto.
- **Cartão de pedido** (`.ct-order`): cabeçalho na cor do tipo de pedido (`.ct-order--balcao`, `--retirada`, `--entrega`, `--mesa`, `--ficha`; ou `--ct-order-color` vindo da configuração, sempre da paleta), com tipo (ícone e rótulo), número do pedido e timer em mono, texto branco; faixa de dados do pedido (`.ct-order__meta`); itens com quantidade em mono, nome e complemento; observação (`.ct-order__note`, fundo de aviso com ícone) e alérgeno (`.ct-order__allergen`, fundo de erro com ícone) no próprio item, nunca só na ficha; rodapé com as ações do alvo da superfície, a principal à direita e maior. Em espera: borda tracejada e selo "Em espera". Selecionado pela bump bar ou teclado: contorno de foco de 3 px.
- **Pedidos prontos** (`.ct-ready`): tipo (ícone e rótulo), número em display mono na cor de texto da marca, nome do cliente e barra de expiração na cor de ação. Usa o esquema do canal `pedido-pronto`.

**Regra da urgência legível.** A urgência do pedido nunca é só cor: atenção e atraso são uma borda de 3 px sobreposta (o cartão não muda de tamanho) mais uma faixa (`.ct-order__urgency`) com ícone e rótulo ("Atenção · passou de 5 min", "Atrasado · passou de 10 min"), nas cores de aviso e erro da base. As cores não são configuráveis; os limites de tempo são. Só o atraso pulsa (halo interno de 1,2 s); com movimento reduzido, fica a borda fixa.

### Compatibilidade

- Piso Chrome 101 em todas as superfícies (WebView dos tablets e totens). O build declara o alvo (`lightningcss` com `targets: { chrome: 101 << 16 }` ou o equivalente do bundler).
- Cor de esquema chega como hex em propriedade CSS; o CSS entregue não usa `oklch()`, `lab()` nem `color-mix()` com variável.
- Com Tailwind, só utilitários de layout: nenhuma classe de cor da paleta (`bg-amber-500`, `text-red-400`), que sai em `oklch()`. Cor só por token `--ct-*`.
- Deslocamento e retorno de toque por `transform`, nunca pelas propriedades `scale`/`translate` separadas (Chrome 104).
- Sem `:has()` (Chrome 105) e sem `@container` (Chrome 105).

### Movimento

Folha sobe em 260 ms com `--cm-ease`; véus e diálogos centralizados esmaecem em 200 ms; retorno de toque em 120 ms. O halo de atraso pulsa a cada 1,2 s. Animações de foto do produto (aproximação, Ken Burns, brilho) são conteúdo escolhido pelo lojista e param com movimento reduzido. Com `prefers-reduced-motion`, nada desliza, pisca ou gira: folhas e confirmações aparecem, o atraso fica com a borda fixa e o carregamento mostra o ícone parado com o texto.

### Faça / Não faça no perfil Operação

**Faça**

- Derivar todas as cores de consumidor do esquema do canal, com o motor do kit, e mostrar na prévia do admin as cores ajustadas.
- Usar a classe de superfície certa e conferir os alvos medindo no navegador, na resolução real (1024×600 no tablet, 960×1707 no totem, 1920×1080 no KDS).
- Deixar visível o produto indisponível e a ação desabilitada, com o motivo escrito.
- Mostrar observação e alérgeno no próprio item do pedido.
- Conferir cada tela de produção nos temas claro e escuro, e cada tela de consumidor com um esquema claro e um escuro.

**Não faça**

- Campo de cor livre para o lojista fora das três sementes, ou hex livre para tipo de pedido e estação.
- Urgência, estado ou tipo de pedido indicados só pela cor.
- Alvo de toque abaixo do mínimo da superfície, ou ação que só aparece no hover.
- Classes de cor da paleta do Tailwind, propriedades `scale`/`translate` separadas, `:has()` ou `color-mix()` com variável.
- Emojis como ícone; `confirm()` e `alert()` do navegador no lugar de uma folha.
- Faixa lateral colorida para marcar item ativo; cartões de métrica nas telas de toque.
- Cantos acima da escala do perfil ou botões, abas e selos em forma de pílula.

## 10. Implementação neste projeto

_Preencher ao adotar:_ os perfis usados (Admin e/ou Operação, com as superfícies), onde está o CSS (`colibri-ui.css` ou `colibri-touch.css` e, se usados, os adaptadores), onde ficam fontes, ícones e `logos/`, de onde a entrada HTML serve o ícone da aba, qual página recebe `.cm-page--home`, a biblioteca de componentes e o tema usados (com versão) e como cada componente é implementado no framework do projeto (componentes, diretivas, templates). No perfil Operação: a classe de superfície, o alvo de build (Chrome 101), onde o esquema de cada canal é gravado, como chega ao app e como é aplicado antes de pintar, e as cores da paleta escolhidas para tipos de pedido e estações.
