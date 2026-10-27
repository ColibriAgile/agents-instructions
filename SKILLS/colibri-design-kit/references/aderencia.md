# Aderência ao kit

Procedimento do verbo `aderencia`. Mede quanto o código de UI e a aplicação em execução seguem as regras do kit, com nota de 0 a 100 e ranking de páginas. Não mede usabilidade: crítica de UX (heurísticas, personas, carga cognitiva) é do `impeccable critique`. A conferência completa do `DESIGN.md` gerado contra o kit é o checklist de fidelidade de [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md), que roda no `adotar`; aqui, o item B6 confere só a estrutura e as regras nomeadas.

A avaliação é somente leitura. A única gravação é o relatório `docs/design/ADERENCIA.md`.

## Rubrica v6

Mudanças desde a v5 (27/10/2026): o grupo H passa a regras fixas (estado no preenchimento com tinta calculada pelo motor, estado com ícone e rótulo, altura estável, só o estado mais grave respira, uma informação principal, grade e transbordo, fundo e escala) e deixa de cobrar cor, ícone e ordem das peças, que viram escolhas do painel. Mudanças da v4 para a v5 (27/10/2026): grupo H novo, para o card de sinal do perfil Cards (estado no preenchimento, urgência legível, anatomia, grade e transbordo, tema e escala); O5 e O6 ganham as exceções do perfil Cards. Mudanças da v3 para a v4 (26/10/2026): grupo R novo, para o card do perfil Produção (tempo no preenchimento, itens, observação e alérgeno, modos e grade); O6 e O7 passam a valer só para o cartão `.ct-order`; O2 e O5 ganham as exceções do perfil Produção. Mudanças da v2 para a v3 (21/10/2026): O7 e O8 novos, para o KDS: leitura dos itens e estado de preparo, cartão de agrupamento, identidade da estação por ícone curado e painel da produção sem cartões de métrica. Mudanças da v1 para a v2: C1 ganha a exceção do código QR em `.cm-qr` (preto sobre branco fixos, perfil Admin). Notas de uma versão não se comparam com as de outra sem recalcular.

Cada item é **aprovado**, **reprovado**, **n/a** (não se aplica ao alvo, com o motivo), **desvio** (há linha em "Desvios do kit" do `DECISOES.md` com o ID do item na coluna "Regra do kit" e o escopo que cobre o caso) ou **não verificado** (a evidência exige o que não está disponível, como navegador ou aparelho). A regra de cada item está no `DESIGN.md` do kit, na seção indicada; leia a seção antes de julgar o item.

Verificação: **E** estática (busca no código, padrões na tabela "Buscas"), **D** detector (`impeccable detect --json`), **N** navegador (aplicação rodando). Item com E e N é aprovado pela parte estática e reprovado por qualquer uma das duas; sem navegador, a parte N fica registrada como não verificada no próprio item. ★ marca item crítico.

Escopo: itens de **projeto** são avaliados uma vez por execução; itens de **página**, em cada página do alvo. Página do perfil Admin usa todos os grupos, menos O. Página do perfil Operação usa B, C1, C3, T1, T2, T4, A e O; com o card do perfil Produção, também R; com o perfil Cards, também H.

### Perfil da página

O perfil decide quais itens valem, então é decidido por evidência, na primeira regra que se aplica:

1. **`DECISOES.md`:** a página está listada como superfície de toque (cardápio do tablet, totem, KDS, pedidos prontos) → Operação; listada no perfil Admin → Admin.
2. **Código:** a página usa o contêiner `.ct-app` ou é servida por uma entrada HTML que carrega `colibri-touch.css` → Operação; usa o shell `.cm-shell` ou é servida por uma entrada que carrega `colibri-ui.css` → Admin. Página do perfil Operação com `.cp-card` ou servida com `colibri-producao.css` também usa o grupo R; com `.cc-sinal` ou `.cc-painel` ou servida com `colibri-cards.css`, também usa o grupo H.
3. **Pergunta:** sem registro nem sinal no código (projeto ainda não adotado, página nova), ou com sinais que se contradizem (listada como Admin mas com `.ct-app`), pergunte o perfil ao usuário, mostrando o que foi encontrado. Não decida pelo nome ou pela aparência da página.

Contradição entre o `DECISOES.md` e o código também entra no relatório, como pendência a corrigir num dos dois. Cada página do relatório mostra o perfil e a origem dele (`DECISOES.md`, `.ct-app`, entrada com `colibri-touch.css`, resposta do usuário).

### B. Base (projeto; kit seções 3, 5 e 7 "Ícones", `LEIA-ME.md`)

| ID | Item | Verif. |
|---|---|---|
| B1 ★ | `colibri-base.css` ao lado de `colibri-ui.css` (ou de `colibri-touch.css`), carregados por toda entrada HTML na ordem do kit: framework e tema da biblioteca → `bootstrap-icons.min.css` → `colibri-ui.css` → adaptadores. Entrada de toque carrega `colibri-touch.css`, não `colibri-ui.css`. | E |
| B2 | Kit em dia: os arquivos que o kit manda copiar sem alteração (`colibri-base.css`, `colibri-ui.css`, `colibri-touch.css`, `colibri-esquema.js` e `.d.ts`, `fonts/`, `logos/`) idênticos aos de `assets/kit/` desta skill (compare o hash); nos adaptadores, cada bloco mantido igual ao do kit (o `adotar` remove os blocos da biblioteca não usada); `DECISOES.md` registra a data da entrada mais recente de "Versões" do `LEIA-ME.md`. Ícones por `npm install bootstrap-icons` contam como em dia. | E |
| B3 ★ | Fontes e ícones locais: nenhuma fonte, folha de estilo ou ícone de CDN; fonte do tema da biblioteca (Roboto, Inter) não carregada. | E |
| B4 | Toda entrada HTML declara `<link rel="icon">` para `colibri.ico`, servido de pasta pública; nenhum ícone padrão do framework ou da identidade anterior. | E |
| B5 | Ícones só de Bootstrap Icons (`bi-`): nenhuma outra família, nenhum PNG/GIF como ícone ou carregamento, nenhum emoji como ícone. | E |
| B6 | `PRODUCT.md`, `DESIGN.md` e `docs/design/DECISOES.md` presentes; `DESIGN.md` com os oito H2 na ordem e as regras nomeadas da tabela "Regras nomeadas" do mapeamento; `impeccable doctor --json` sem findings de `PRODUCT.md`, `DESIGN.md` ou sidecar. | E |

### C. Cores e tema (kit seção 2)

| ID | Item | Verif. |
|---|---|---|
| C1 ★ | Cor só por token: CSS e marcação do projeto sem cor literal (hex, `rgb()`, `hsl()`, nome de cor) fora de definição de token; o detector não acusa cor fora do `DESIGN.md`. Exceções do kit: `transparent`, `currentColor`, `inherit`, o texto branco sobre foto ou câmera do perfil Operação e o preto e branco literais de um código QR dentro de `.cm-qr` (seção 2, "Código QR na tela"). | E, D |
| C2 | Regra da ação rara: o azul de ação só em ação, link, seleção e item ativo; nenhum painel, seção ou cabeçalho com fundo de acento. | E, N |
| C3 | Estado nunca só por cor: todo uso de sucesso, aviso e erro tem rótulo ou ícone. | E |
| C4 | Tema escuro: alternância na barra superior grava `data-theme` no `<html>`, aplicado antes de pintar; nenhum código do projeto testa o tema para escolher cor; popups e componentes de biblioteca no escuro. | E, N |
| C5 | Gráficos: medida única no azul de ação, séries na paleta `chart-1` a `chart-8` na ordem, tema de visualização com `--cm-font` claro e escuro. n/a sem gráficos. | E |

### T. Tipografia (kit seção 3; Operação, seção 9)

| ID | Item | Verif. |
|---|---|---|
| T1 ★ | Regra da tipografia única: nenhuma `font-family` do projeto além de `var(--cm-font)` e `var(--cm-mono)`; calendário, seletor de hora, lista suspensa, dica e validação da biblioteca em Google Sans Flex. | E, N |
| T2 | Dados em mono com algarismos tabulares: versões, datas, horários, contagens e identificadores (no Operação: timer, senha, número do pedido). | E |
| T3 | Regra da informação primeiro (Admin): maior texto da página é o título da barra (18 px); nenhuma contagem em tipografia gigante; títulos em conteúdo rico até 16 px. | E, N |
| T4 | Sem caixa alta: nenhum `text-transform: uppercase` nem texto escrito em maiúsculas para ênfase; descrições que chegam em maiúsculas exibidas em caixa de frase. | E |

### S. Estrutura (projeto; kit seção 5)

| ID | Item | Verif. |
|---|---|---|
| S1 | Shell `.cm-shell`: lateral com nome do produto sem ícone, recolher e grupos; barra superior de 56 px com título, alternância de tema, idioma e acesso. | E, N |
| S2 | Lateral: versão completa com o build, centralizada no rodapé; rótulos completos em uma linha; texto em branco gelo sem contorno nem sombra; degradê intacto. | E, N |
| S3 | Marca-d'água: `.cm-page--home` em exatamente uma página, a inicial. | E |
| S4 | Tela de entrada e páginas de erro em `.cm-login` com `colibri-marca.svg`, sem degradê e sem marca-d'água. n/a sem essas telas. | E |
| S5 | Responsivo: lateral sobre o conteúdo até 920 px, Esc fecha; páginas sem quebra em 1440, 1920 e ~900 px. | N |

### P. Anatomia de página (página; kit seção 6)

| ID | Item | Verif. |
|---|---|---|
| P1 | A página não repete o título nem põe subtítulo: a barra superior nomeia a tarefa. | E |
| P2 | Primeira linha `.cm-toolbar`: busca ou contexto à esquerda; estado e grupo de ações à direita. | E |
| P3 | Seções com `.cm-section__head` (título, contagem, ferramentas). | E |
| P4 ★ | Registro de produto: nenhum cartão de métrica, hero, eyebrow ou subtítulo decorativo; cartões só na inicial e em resumos de poucos fatos; contagens como `.cm-tag`. | E, N |
| P5 | Estados: `.cm-notice` para situação, `.cm-alert` para bloqueio, `.cm-empty` com ícone e frase, carregamento com `bi-arrow-repeat cm-spin`. | E |

### K. Componentes (página; kit seções 4 e 7)

| ID | Item | Verif. |
|---|---|---|
| K1 ★ | Regra dos botões adjacentes: botões com moldura lado a lado sempre em `.cm-btn-group`, principal à direita, sem ícone em botão de grupo. | E |
| K2 | Ações de linha em `.cm-icon-btn` com `title` e `aria-label`, destrutiva por último, indisponível desabilitada (não some). | E |
| K3 | Tabelas: `.cm-table` com `--cm-cols`, ou grade de biblioteca pela regra da grade como tabela (sem zebra, sem borda própria, linha de 36 px); ordenação com uma única seta; colunas numéricas à direita. | E, N |
| K4 | Formulários: `.cm-field` com rótulo visível e erro associado; Salvar e Cancelar agrupados à direita; caixas e rádios do kit. | E |
| K5 | Camadas: diálogo `.cm-dialog` com o principal à direita (também em exclusão), Tab circulando, Enter e Esc; nenhum `confirm()` ou `alert()` do navegador; notificações no canto superior direito. | E, N |
| K6 | Plano por padrão: nenhuma sombra decorativa em cartão ou botão; hover não levanta nem desloca; cantos só da escala do kit (3, 4, 6 e 10 px, pelos tokens `--cm-btn-radius`, `--cm-radius-sm` e `--cm-radius` quando existem). | E |

### A. Acessibilidade e movimento (página; kit seções 2 "Foco", 4 e 8)

| ID | Item | Verif. |
|---|---|---|
| A1 | Foco do kit visível: nenhum `outline: none` sem substituto; o fluxo principal funciona com Tab, Enter e Esc. | E, N |
| A2 | Animações do projeto respeitam `prefers-reduced-motion`; transições de 120–200 ms (folhas e painéis, 260–280 ms). | E |

### O. Perfil Operação (página de toque; kit seção 9)

| ID | Item | Verif. |
|---|---|---|
| O1 ★ | Contêiner `.ct-app` com a classe da superfície (`--tablet`, `--totem`, `--kds`, `--tv`); quiosque com `.ct-app--kiosk`. | E |
| O2 ★ | Alvos de toque no mínimo da superfície, inclusive +/−, fechar e ações de linha, com 8 px entre vizinhos; nenhuma ação só no hover. No card do perfil Produção, valem as exceções da seção 10 (rodapé de 40 px; botão de estado com 42 px pela altura da linha, sem os 8 px). | E, N |
| O3 | Regra do esquema por sementes: telas de consumidor só com `--ct-*` de `colibri-esquema.js`, esquema aplicado antes de pintar; tipo de pedido e estação só da paleta curada; KDS no tema Colibri. | E, N |
| O4 ★ | Chrome 101: alvo declarado no build; nenhum `oklch()`, `lab()`, `color-mix()` com variável, classe de cor da paleta do Tailwind, `scale:`/`translate:` separados, `:has()` ou `@container` no CSS entregue. | E |
| O5 | Composição: uma ação principal por tela (a do cartão de produto é botão comum); cartões só de produto e de pedido (o `.cc-sinal` e o `.cc-mais` do perfil Cards também são permitidos); sem faixa lateral colorida; cantos de 3 e 6 px, sem pílula (a tag de alérgeno do perfil Produção é a exceção). | E |
| O6 | Regra da urgência legível no cartão `.ct-order`: borda de 3 px mais faixa com ícone e rótulo; só o atraso pulsa. n/a sem KDS ou sem `.ct-order` (o card do perfil Produção é avaliado em R1) e n/a no `.cc-sinal` do perfil Cards (avaliado em H1 e H2). | E, N |
| O7 | Cartão `.ct-order` legível (n/a no card do perfil Produção, avaliado em R2): nome do item na cor do texto e quantidade em mono, a de 2 ou mais no selo neutro (`.ct-order__qty--multi`); estado de preparo do item na linha com ícone e rótulo (`.ct-order__state`, `is-preparing`, `is-ready`), sem piscar; visão por produto em `.ct-order--group` com o tipo em selo da paleta; situação do despacho do delivery em selo de estado com ícone. n/a sem KDS. | E, N |
| O8 | Estação e painel: estação identificada por nome, cor da paleta e ícone da lista curada na barra `.ct-bar`; nenhum emoji ou imagem como ícone de estação; painel da produção em `.ct-board` com até seis `.ct-stat` no plano, sem cartões de métrica, e número fora da meta com selo de estado. n/a sem KDS. | E |

### R. Perfil Produção (página com o card de produção; kit seção 10)

| ID | Item | Verif. |
|---|---|---|
| R1 ★ | Regra do tempo no preenchimento: cabeçalho do `.cp-card` neutro, `--atencao` ou `--atraso` conforme o tempo, com o ícone de urgência antes do tempo; tipo do pedido no selo `.cp-card__tipo`, nunca no preenchimento; sem borda nem faixa de urgência; só o atraso respira, parado com movimento reduzido. | E, N |
| R2 | Itens: estado, quantidade e nome numa linha, com os cinco ícones de estado (`bi-clock`, `bi-fire`, `bi-check-circle-fill`, `bi-pause-circle-fill`, `bi-x-circle-fill`); nome e quantidade em `--cp-item`, sem negrito nem selo invertido; combo empilhado em `.cp-card__sub`; `--cp-esmaecido` só no item pronto; traço entre os itens; tamanhos e alturas de linha pelos tokens `--cp-*`. | E, N |
| R3 | Observação com `bi-arrow-right` na cor de aviso; linha alterada em `warning-soft`, sem bloco extra; alérgeno em `.cp-card__alergeno` só com o nome; ritmo de preparo com `bi-stopwatch` ou `bi-alarm`, nunca `bi-clock`. | E |
| R4 | Modos: modo da estação na raiz da grade (`.cp-modo-toque` ou `.cp-modo-bump`). Toque: rodapé com `.cp-card__acao` de 40 px e botão de estado do item (toque avança, toque no pronto volta, toque longo põe na espera). Bump: sem rodapé, `.is-selecionado` com o índice, cursor em dois níveis, Enter conclui com confirmação. O card nunca conclui sozinho. | E, N |
| R5 | Grade: cards sem altura mínima, empilhados na ordem da fila, com posições estáveis enquanto nenhum pedido entra ou sai, e card grande transbordando para colunas vizinhas. | E, N |

### H. Perfil Cards (página com painel de chamados; kit seção 11)

| ID | Item | Verif. |
|---|---|---|
| H1 ★ | Regra do estado no preenchimento e tinta calculada: o `.cc-sinal` inteiro na cor do estado (`--cc-cor`), sem borda, contorno nem sombra; cor de estado do padrão do kit, da paleta curada ou hex livre do lojista, sempre com a tinta, o véu e o respiro do motor (`tintaSobre`, `veuSobre`, `respiroDe` de `colibri-esquema.js`), nunca escolhidos pelo lojista nem fixos sobre cor livre; texto sobre o preenchimento com 4,5:1 ou mais em todo estado (meça com a cor configurada); só o estado mais grave respira (`.cc-sinal--atraso` ou `.cc-sinal--respira`), em `::before` só com opacidade, a cada 1,2 s, parado com movimento reduzido. | E, N |
| H2 ★ | Estado legível e altura estável: todo estado além do de partida (a espera) com ícone e rótulo, na faixa `.cc-urgencia` ou noutra peça, nunca só a cor (num kanban sem estado de partida, todos); o ícone é escolha do painel; a faixa vazia e o rodapé reservam a altura, e o card não muda de altura ao mudar de estado; sem borda de urgência. | E, N |
| H3 | Peças e invariantes: uma informação principal, a maior do card (`.cc-sinal__valor` ou `.cc-sinal__valor--texto`); as demais peças (topo, faixa, rodapé, selos `.cc-veu`) em qualquer ordem e presença, sem molde obrigatório; nenhum corpo de itens (isso é o `.cp-card`) nem cartão dentro de cartão; cantos de 6 px no card e de 3 px no selo e na faixa; sem caixa alta. | E |
| H4 | Grade e transbordo: `.cc-grade` em `auto-fill`, cards alinhados ao topo, sem esticar até o vizinho; o que não cabe vira `.cc-mais` "+N chamados", neutro (`surface-2`, `ink-2`, número em `ink` mono), sem borda tracejada. | E, N |
| H5 | Fundo e escala: painel da equipe pelo tema Colibri (`data-theme`) ou com cor própria como semente `ambiente` de `derivarEsquema` (piso e textos do esquema, nunca hex solto); painel voltado ao cliente em `.cc-painel--cliente`, com piso, preenchimento e tinta do esquema do canal (`--ct-*`), sem tempo nem urgência; na TV, `.cc-painel--tv` (cada tamanho em `max(piso, N vw)`), sem cortar em 1366×768; tamanhos pelos tokens `--cc-t-*`, `--cc-gap` e `--cc-pad`. | E, N |

## Buscas

Busque no código de UI do projeto, excluindo a pasta copiada do kit (`colibri-ui/`), dependências (`node_modules/`, `wwwroot/lib/`, `vendor/`) e saídas de build (`bin/`, `obj/`, `dist/`, `build/`). Cada ocorrência é candidata: confirme no contexto antes de reprovar.

- B3: `fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs|unpkg\.com|fontawesome|typekit`
- B4: `rel=["'](shortcut )?icon`
- B5: `\bfa-|material-icons|glyphicon|\.(png|gif)["')]`
- C1: `#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(` em CSS, SCSS, `style=` e componentes
- C4: `data-theme|prefers-color-scheme|theme\s*===?`
- T1: `font-family`
- T4: `text-transform:\s*uppercase|\buppercase\b`
- S3: `cm-page--home`
- K3: `rowAlternationEnabled|table-striped|striped|showBorders`
- K5: `\bconfirm\(|\balert\(`
- K6: `box-shadow|border-radius`
- A1: `outline:\s*(none|0)`
- A2: `animation|transition|prefers-reduced-motion`
- O4: `oklch\(|lab\(|color-mix\(|:has\(|@container|\bscale:|\btranslate:|\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b`
- O7: `animate-pulse|animation:|ct-order__qty|ct-order__state` (pulso fora do `.ct-order--late`, quantidade e nome com cor própria)
- R1: `cp-card--(atencao|atraso|pausa)|ct-order__urgency|border[^;]*cp-card` (urgência por borda ou faixa no card de produção)
- R2: `cp-card__(qtd|nome)|bi-circle\b|font-weight:\s*(600|700|bold)` (negrito no nome, aguardando com o círculo antigo)
- R3: `bi-clock|bi-stopwatch|bi-alarm|cp-card__alergeno|Alérgeno` (relógio fora do aguardando, palavra "Alérgeno" na tag)
- R4: `cp-modo-(toque|bump)|cp-card__estado-btn|is-cursor|is-selecionado`
- R5: `min-height|column-count|masonry|grid-row` (altura mínima nos cards, colunas do CSS)
- H1: `--cc-(tinta|veu)[\w-]*:|--cc-respiro|tintaSobre|veuSobre|respiroDe|cc-sinal--(atraso|respira)|cc-respirar|prefers-reduced-motion|box-shadow|border[^;]*cc-sinal` (tinta ou véu fixos sobre cor livre, tinta escolhida pelo lojista, mais de um estado respirando, respiro sem a parada do movimento reduzido)
- H2: `cc-urgencia|bi-[\w-]+-fill|min-height|border[^;]*cc-sinal` (estado só pela cor, faixa ausente que faz o card pular, urgência por borda)
- H3: `cc-sinal__(rotulo|timer|valor|rodape)|cc-veu|text-transform:\s*uppercase` (corpo de itens no card de sinal, duas informações do tamanho da principal, caixa alta)
- H4: `cc-grade|cc-mais|dashed|align-items:\s*stretch` (borda tracejada no transbordo, cards esticados)
- H5: `cc-painel--(cliente|tv)|data-theme|derivarEsquema|--cc-piso|--cc-t` (painel do cliente com tempo ou hex, cor própria sem o motor, TV sem a escala fluida)
- O8: emoji no código e nos dados de estação (`rg -P "[\x{1F300}-\x{1FAFF}\x{2300}-\x{23FF}\x{2600}-\x{27BF}]"`; a faixa pula `U+2400`–`U+25FF`, dos traços de desenho de caixa (`──`) dos comentários de seção), `ct-bar|ct-board|ct-stat` e cartões de métrica no painel

## Nota e faixa

- **Nota** = aprovados ÷ (aprovados + reprovados) × 100, arredondada. N/a, desvio e não verificado ficam fora da conta.
- **Faixa:** 90–100 **Aderente**; 75–89 **Próximo**; 50–74 **Parcial**; 0–49 **Distante**. Qualquer item ★ reprovado limita a faixa a **Parcial**, mesmo com nota maior.
- **Provisória:** com algum item não verificado, a nota leva "(provisória)" e o relatório lista o que falta verificar e como.
- Notas só se comparam na mesma versão da rubrica e no mesmo alvo. Ao mudar a rubrica, recalcule antes de comparar.

## Procedimento

### 1. Resolver o alvo

- Com alvo (página, componente, rota ou pasta): resolva para arquivos; o alvo é essa página.
- Sem alvo: o frontend inteiro. Liste as páginas (rotas ou arquivos de página) e use a lista de "Páginas a refatorar" do `DECISOES.md` para saber qual é a mais usada. Com mais de 12 páginas, pergunte se avalia todas ou as 12 mais usadas.
- Leia `docs/design/DECISOES.md` (perfis, superfícies, desvios, versão do kit) e a seção "Implementação neste projeto" do `DESIGN.md` do projeto. Desvio registrado antes dos IDs da rubrica é associado ao item pelo texto da regra, e o relatório sugere acrescentar o ID à linha. Sem `DECISOES.md` nem `DESIGN.md`, o projeto não adotou o kit: avalie mesmo assim (B6 reprovado) e recomende `adotar` no fechamento.
- Classifique cada página pela regra de "Perfil da página".

Conclua com a lista de páginas do alvo, cada uma com arquivo, perfil e a origem do perfil, e os desvios registrados.

### 2. Coletar a evidência

- Rode as buscas da tabela "Buscas" sobre o alvo (B e S, sobre o projeto todo).
- Rode `<pasta-da-skill-impeccable>/scripts/impeccable detect --json <arquivos de marcação do alvo>` uma vez; sem launcher, registre C1 parte D como não verificada.
- Com a aplicação rodando e navegador disponível, abra cada página nos dois temas (Operação: na resolução real da superfície; consumidor com um esquema claro e um escuro) e faça as medições dos itens N. Sem isso, os itens N ficam não verificados. Servidor iniciado só para isto roda em segundo plano e é parado antes do relatório.

Conclua quando cada item aplicável tiver evidência coletada ou o motivo de não ter.

### 3. Julgar e pontuar

Julgue cada item de cada página. Todo reprovado traz evidência `arquivo:linha` (ou a medição no navegador) e a correção concreta; todo aprovado de regra negativa ("nenhum…") cita a busca feita. Calcule a nota e a faixa do projeto (itens de projeto mais os de todas as páginas) e de cada página (itens de página mais os de projeto).

Conclua com todos os itens de todas as páginas classificados; nenhum fica sem estado.

### 4. Relatar e gravar

Entregue o relatório na conversa, preenchendo [`../assets/ADERENCIA.template.md`](../assets/ADERENCIA.template.md) (leia-o por inteiro): nota e faixa do alvo, tabela por grupo, ranking das páginas da menos aderente para a mais, reprovações ★ primeiro, desvios considerados e o que ficou sem verificação.

Depois grave o mesmo conteúdo em `docs/design/ADERENCIA.md`: se o arquivo existir, acrescente uma linha ao histórico e substitua o relatório detalhado; o histórico anterior fica. Mostre a tendência do mesmo alvo ("Clientes: 58 → 71 → 86"). Sem permissão de escrita, entregue só na conversa e diga isso.

Feche com os próximos passos, cada um com o verbo e o alvo prontos para digitar: `refatorar <página>` para as páginas do topo do ranking, `adotar` para reprovações em B, `desvio <regra>` quando a reprovação for uma decisão consciente que ainda não foi registrada. Se o ranking diverge da ordem de "Páginas a refatorar" do `DECISOES.md`, ofereça reordenar a lista; mude só com confirmação. As correções ficam para o `refatorar`.

Conclua com o relatório na conversa, o histórico gravado (ou o motivo de não gravar) e os próximos passos com os comandos prontos.
