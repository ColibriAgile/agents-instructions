# Aderência ao kit

Procedimento do verbo `aderencia`. Mede quanto o código de UI e a aplicação em execução seguem as regras do kit, com nota de 0 a 100 e ranking de páginas. Não mede usabilidade: crítica de UX (heurísticas, personas, carga cognitiva) é do `impeccable critique`. A conferência completa do `DESIGN.md` gerado contra o kit é o checklist de fidelidade de [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md), que roda no `adotar`; aqui, o item B6 confere só a estrutura e as regras nomeadas.

A avaliação é somente leitura. A única gravação é o relatório `docs/design/ADERENCIA.md`. Para julgar só o que uma mudança causou (branch, PR ou trabalho local), use o verbo `revisar` ([`./revisar.md`](./revisar.md)), que aplica esta mesma rubrica ao diff.

## Rubrica v20

Mudanças desde a v19 (03/11/2026): B5 aceita as figuras de categoria em Phosphor light e os pictogramas de alérgeno em Tabler outline (exceção nomeada da seção 7). Mudanças da v18 para a v19 (03/11/2026): O14 novo (regra do teclado na tela); O5 aceita os 10 px da tecla. Mudanças da v17 para a v18 (02/11/2026): O13 novo (acabamento de vidro nas telas de consumidor). Mudanças da v16 para a v17 (02/11/2026): K9 e K10 novos (painel de operação no perfil Admin: as três vistas, o cartão de resumo, a etiqueta do tipo do pedido, a origem com logo, a grade que quebra e o teclado na fila); K3 aceita a grade que quebra; O4 vale só para o CSS do perfil Operação. Mudanças da v15 para a v16 (02/11/2026): O12 novo (regra do cartão tocável com + no tablet e no totem); O5 e O10 deixam a ação de texto do cartão. Mudanças da v14 para a v15 (02/11/2026): O8 cobra a regra da barra no tamanho do card, a tabela por estação e o número do painel sem transbordo; O11 novo (regra das colunas pela largura do card); O7 e R6 levam a visão por produto ao card de agrupamento do perfil Produção. Mudanças da v13 para a v14 (02/11/2026): grupo W novo (vitrine web do Colibri Delivery), com a regra de perfil "`.ct-app--web` → Operação + W". Mudanças da v12 para a v13 (02/11/2026): O10 novo (regra da hierarquia leve nas telas de consumidor). Mudanças da v11 para a v12 (02/11/2026): O9 novo (carrossel de destaques e tela de descanso do tablet e do totem); o A5 deixa de avaliar o movimento de conteúdo (carrossel, tela de descanso, animações da foto). Mudanças da v10 para a v11 (01/11/2026): S1 cobra o link "Pular para o conteúdo"; K6 cobra a faixa colorida num lado só e os cantos aninhados; P5 cobra o vazio no lugar de dado inventado. Mudanças da v9 para a v10 (01/11/2026): o A3 passa a cobrar 320 px (celular), além do zoom de 200%, e a ver as larguras mínimas fixas maiores que a tela. Mudanças da v8 para a v9 (01/11/2026): grupo A refeito. A1 passa a ★. A2 ★ novo (nome acessível), A3 ★ novo (zoom de 200% e texto cortado), A4 ★ (movimento reduzido, antes parte do A2) e A5 a A7 novos, para a regra do movimento com motivo (duração e curva, propriedades animadas, frequência, saída e hover). C3 e O6 passam a ★. K8 ★ novo (ação destrutiva em dois passos), que vale também no perfil Operação. Seção "Gatilhos de bloqueio" nova, usada também pelo `revisar`. Mudanças da v7 para a v8 (30/10/2026): item K7 novo (reordenar por arrasto pela alça, com a barra de soltura do kit). Mudanças da v6 para a v7 (28/10/2026): o T4 cobra também as observações do PDV em caixa de frase (antes ficavam como gravadas). Mudanças da v5 para a v6 (27/10/2026): o grupo H passa a regras fixas (estado no preenchimento com tinta calculada pelo motor, estado com ícone e rótulo, altura estável, só o estado mais grave respira, uma informação principal, grade e transbordo, fundo e escala) e deixa de cobrar cor, ícone e ordem das peças, que viram escolhas do painel; o R5 passa a cobrar o span calculado pelo card, os indicadores da quebra em colunas e o transbordo entre monitores pelos cards inteiros. Mudanças da v4 para a v5 (27/10/2026): grupo H novo, para o card de sinal do perfil Cards (estado no preenchimento, urgência legível, anatomia, grade e transbordo, tema e escala); O5 e O6 ganham as exceções do perfil Cards. Mudanças da v3 para a v4 (26/10/2026): grupo R novo, para o card do perfil Produção (tempo no preenchimento, itens, observação e alérgeno, modos e grade); O6 e O7 passam a valer só para o cartão `.ct-order`; O2 e O5 ganham as exceções do perfil Produção. Mudanças da v2 para a v3 (21/10/2026): O7 e O8 novos, para o KDS: leitura dos itens e estado de preparo, cartão de agrupamento, identidade da estação por ícone curado e painel da produção sem cartões de métrica. Mudanças da v1 para a v2: C1 ganha a exceção do código QR em `.cm-qr` (preto sobre branco fixos, perfil Admin). Notas de uma versão não se comparam com as de outra sem recalcular.

Cada item é **aprovado**, **reprovado**, **n/a** (não se aplica ao alvo, com o motivo), **desvio** (há linha em "Desvios do kit" do `DECISOES.md` com o ID do item na coluna "Regra do kit" e o escopo que cobre o caso) ou **não verificado** (a evidência exige o que não está disponível, como navegador ou aparelho). A regra de cada item está no `DESIGN.md` do kit, na seção indicada; leia a seção antes de julgar o item.

Verificação: **E** estática (busca no código, padrões na tabela "Buscas"), **D** detector (`impeccable detect --json`), **N** navegador (aplicação rodando). Item com E e N é aprovado pela parte estática e reprovado por qualquer uma das duas; sem navegador, a parte N fica registrada como não verificada no próprio item. ★ marca item crítico.

Escopo: itens de **projeto** são avaliados uma vez por execução; itens de **página**, em cada página do alvo. Página do perfil Admin usa todos os grupos, menos O. Página do perfil Operação usa B, C1, C3, T1, T2, T4, K8, A e O; com o card do perfil Produção, também R; com o perfil Cards, também H; na vitrine web (`.ct-app--web`), também W, e os itens O de quiosque e de KDS ficam n/a com o motivo.

### Perfil da página

O perfil decide quais itens valem, então é decidido por evidência, na primeira regra que se aplica:

1. **`DECISOES.md`:** a página está listada como superfície de toque (cardápio do tablet, totem, KDS, pedidos prontos) → Operação; listada no perfil Admin → Admin.
2. **Código:** a página usa o contêiner `.ct-app` ou é servida por uma entrada HTML que carrega `colibri-touch.css` → Operação; usa o shell `.cm-shell` ou é servida por uma entrada que carrega `colibri-ui.css` → Admin. Página do perfil Operação com `.cp-card` ou servida com `colibri-producao.css` também usa o grupo R; com `.cc-sinal` ou `.cc-painel` ou servida com `colibri-cards.css`, também usa o grupo H; com `.ct-app--web`, também o grupo W.
3. **Pergunta:** sem registro nem sinal no código (projeto ainda não adotado, página nova), ou com sinais que se contradizem (listada como Admin mas com `.ct-app`), pergunte o perfil ao usuário, mostrando o que foi encontrado. Não decida pelo nome ou pela aparência da página.

Contradição entre o `DECISOES.md` e o código também entra no relatório, como pendência a corrigir num dos dois. Cada página do relatório mostra o perfil e a origem dele (`DECISOES.md`, `.ct-app`, entrada com `colibri-touch.css`, resposta do usuário).

### B. Base (projeto; kit seções 3, 5 e 7 "Ícones", `LEIA-ME.md`)

| ID | Item | Verif. |
|---|---|---|
| B1 ★ | `colibri-base.css` ao lado de `colibri-ui.css` (ou de `colibri-touch.css`), carregados por toda entrada HTML na ordem do kit: framework e tema da biblioteca → `bootstrap-icons.min.css` → `colibri-ui.css` → adaptadores. Entrada de toque carrega `colibri-touch.css`, não `colibri-ui.css`. | E |
| B2 | Kit em dia: os arquivos que o kit manda copiar sem alteração (`colibri-base.css`, `colibri-ui.css`, `colibri-touch.css`, `colibri-esquema.js` e `.d.ts`, `fonts/`, `logos/`) idênticos aos de `assets/kit/` desta skill (compare o hash); nos adaptadores, cada bloco mantido igual ao do kit (o `adotar` remove os blocos da biblioteca não usada); `DECISOES.md` registra a data da entrada mais recente de "Versões" do `LEIA-ME.md`. Ícones por `npm install bootstrap-icons` contam como em dia. | E |
| B3 ★ | Fontes e ícones locais: nenhuma fonte, folha de estilo ou ícone de CDN; fonte do tema da biblioteca (Roboto, Inter) não carregada. | E |
| B4 | Toda entrada HTML declara `<link rel="icon">` para `colibri.ico`, servido de pasta pública; nenhum ícone padrão do framework ou da identidade anterior. | E |
| B5 | Ícones só de Bootstrap Icons (`bi-`): nenhuma outra família, nenhum PNG/GIF como ícone ou carregamento, nenhum emoji como ícone. Exceção do kit (seção 7, figuras de comida e de alérgeno): figura de categoria em Phosphor light e pictograma de alérgeno em Tabler outline (com Phosphor regular onde faltar), em SVG local, na cor do texto e sempre com o nome, nas telas de toque e no admin que escolhe essas figuras; nenhuma figura desses conjuntos em ação, navegação ou estado. | E |
| B6 | `PRODUCT.md`, `DESIGN.md` e `docs/design/DECISOES.md` presentes; `DESIGN.md` com os oito H2 na ordem e as regras nomeadas da tabela "Regras nomeadas" do mapeamento; `impeccable doctor --json` sem findings de `PRODUCT.md`, `DESIGN.md` ou sidecar. | E |

### C. Cores e tema (kit seção 2)

| ID | Item | Verif. |
|---|---|---|
| C1 ★ | Cor só por token: CSS e marcação do projeto sem cor literal (hex, `rgb()`, `hsl()`, nome de cor) fora de definição de token; o detector não acusa cor fora do `DESIGN.md`. Exceções do kit: `transparent`, `currentColor`, `inherit`, o texto branco sobre foto ou câmera do perfil Operação e o preto e branco literais de um código QR dentro de `.cm-qr` (seção 2, "Código QR na tela"). | E, D |
| C2 | Regra da ação rara: o azul de ação só em ação, link, seleção e item ativo; nenhum painel, seção ou cabeçalho com fundo de acento. | E, N |
| C3 ★ | Estado nunca só por cor: todo uso de sucesso, aviso e erro tem rótulo ou ícone. | E |
| C4 | Tema escuro: alternância na barra superior grava `data-theme` no `<html>`, aplicado antes de pintar; nenhum código do projeto testa o tema para escolher cor; popups e componentes de biblioteca no escuro. | E, N |
| C5 | Gráficos: medida única no azul de ação, séries na paleta `chart-1` a `chart-8` na ordem, tema de visualização com `--cm-font` claro e escuro. n/a sem gráficos. | E |

### T. Tipografia (kit seção 3; Operação, seção 9)

| ID | Item | Verif. |
|---|---|---|
| T1 ★ | Regra da tipografia única: nenhuma `font-family` do projeto além de `var(--cm-font)` e `var(--cm-mono)`; calendário, seletor de hora, lista suspensa, dica e validação da biblioteca em Google Sans Flex. | E, N |
| T2 | Dados em mono com algarismos tabulares: versões, datas, horários, contagens e identificadores (no Operação: timer, senha, número do pedido). | E |
| T3 | Regra da informação primeiro (Admin): maior texto da página é o título da barra (18 px); nenhuma contagem em tipografia gigante; títulos em conteúdo rico até 16 px. | E, N |
| T4 | Sem caixa alta: nenhum `text-transform: uppercase` nem texto escrito em maiúsculas para ênfase; descrições que chegam em maiúsculas (nomes e observações do PDV) exibidas em caixa de frase. | E |

### S. Estrutura (projeto; kit seção 5)

| ID | Item | Verif. |
|---|---|---|
| S1 | Shell `.cm-shell`: lateral com nome do produto sem ícone, recolher e grupos; barra superior de 56 px com título, alternância de tema, idioma e acesso; primeiro elemento da página é o `.cm-skip` "Pular para o conteúdo", que leva a `#conteudo` (`.cm-content` com `tabindex="-1"`). | E, N |
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
| P5 | Estados: `.cm-notice` para situação, `.cm-alert` para bloqueio, `.cm-empty` com ícone e frase, carregamento com `bi-arrow-repeat cm-spin`; nenhum dado, número, depoimento ou logo inventado na aplicação para preencher a tela. | E |

### K. Componentes (página; kit seções 4 e 7)

| ID | Item | Verif. |
|---|---|---|
| K1 ★ | Regra dos botões adjacentes: botões com moldura lado a lado sempre em `.cm-btn-group`, principal à direita, sem ícone em botão de grupo. | E |
| K2 | Ações de linha em `.cm-icon-btn` com `title` e `aria-label`, destrutiva por último, indisponível desabilitada (não some). | E |
| K3 | Tabelas: `.cm-table` com `--cm-cols` (rolando de lado ou, com `.cm-table--wrap`, quebrando cada linha em blocos), ou grade de biblioteca pela regra da grade como tabela (sem zebra, sem borda própria, linha de 36 px); ordenação com uma única seta; colunas numéricas à direita. | E, N |
| K4 | Formulários: `.cm-field` com rótulo visível e erro associado; Salvar e Cancelar agrupados à direita; caixas e rádios do kit. | E |
| K5 | Camadas: diálogo `.cm-dialog` com o principal à direita (também em exclusão), Tab circulando, Enter e Esc; nenhum `confirm()` ou `alert()` do navegador; notificações no canto superior direito. | E, N |
| K6 | Plano por padrão: nenhuma sombra decorativa em cartão ou botão; hover não levanta nem desloca; cantos só da escala do kit (3, 4, 6 e 10 px, pelos tokens `--cm-btn-radius`, `--cm-radius-sm` e `--cm-radius` quando existem); peça a menos de 4 px da borda de uma superfície com o raio dela menos o vão; nenhuma faixa colorida num lado só (borda esquerda de cor) para estado, destaque ou item ativo. | E |
| K7 | Reordenar por arrasto: só a alça `.cm-drag-handle` é arrastável (nenhuma linha inteira com `draggable`); a arrastada em `.is-dragging` e o alvo com `.is-drop-top` / `.is-drop-bottom` do kit, no lado onde o item cai; nenhuma alça nem barra de soltura com CSS próprio; setas subir/descer como alternativa. | E, N |
| K8 ★ | Ação destrutiva em dois passos: excluir, zerar ou cancelar passa pela confirmação que nomeia o alvo (`.cm-dialog`; no perfil Operação, a folha), ou executa na hora com "Desfazer" na notificação; nenhuma exclusão num clique só. | E, N |
| K9 | Painel de operação (seção 7): página do Admin sem a lateral, na escala do Admin (nenhum `.ct-*` nem tamanho ou peso próprio); as três vistas trocadas por `.cm-btn-group` com `.cm-btn--toggle`, a Lista como padrão e a última vista guardada; Lista em `.cm-master` com o detalhe ao lado; Kanban livre em `.cm-tiles` e colunado em `.cm-board`, com os finais recolhidos e nenhum cartão arrastável; cartão `.cm-tile` com origem, tempo, menu, número, valor, cliente e etiquetas; tipo do pedido em `.cm-tag--entrega`, `--mesa`, `--balcao`, `--ficha` ou `--retirada` (só a Retirada cheia), sem ícone; origem sempre em `.cm-origem` com o logo e o nome; menu de ações com as ações do estado e a destrutiva por último. n/a sem painel de operação. | E, N |
| K10 | Regra do teclado na fila: setas andam entre os pedidos (um só `tabindex="0"`), Enter abre o menu de ações, Ctrl+Enter o detalhe (ou as abas, na Lista), ← → trocam a aba, `/` vai à busca, Esc fecha e devolve o foco; os atalhos da vista à vista em `.cm-shortcuts`. n/a sem painel de operação. | E, N |

### A. Acessibilidade e movimento (página; kit seções 2 "Foco", 4, 5 "Celular e zoom" e 8; Operação, seção 9 "Movimento")

| ID | Item | Verif. |
|---|---|---|
| A1 ★ | Foco do kit visível: nenhum `outline: none` sem substituto; o fluxo principal funciona com Tab, Enter e Esc, sem depender do mouse. | E, N |
| A2 ★ | Nome acessível: todo controle sem texto visível (ação de ícone, fechar, +/−, alternância de tema) tem `aria-label`; imagem de conteúdo com `alt`; ícone decorativo com `aria-hidden="true"`. | E |
| A3 ★ | Celular e zoom (perfil Admin): com 320 px de largura e com zoom de 200% (640 px numa janela de 1280 px), nada cortado, sobreposto ou fora de alcance e nenhuma rolagem horizontal da página (só tabelas e grades, por dentro); nenhuma largura mínima fixa maior que a tela no layout do projeto (`minmax(min(240px, 100%), 1fr)`, não `minmax(240px, 1fr)`); texto cortado com reticências tem o texto inteiro na dica ou no detalhe, e não há reticências onde o kit proíbe o corte. n/a no perfil Operação (resolução fixa da superfície, avaliada em O2). | E, N |
| A4 ★ | Movimento reduzido: toda animação e transição do projeto tem o tratamento de `prefers-reduced-motion` (nada desliza, pisca, pulsa nem se desloca; a camada aparece no estado final ou esmaece em até 120 ms); nenhum estado indicado só por animação. | E |
| A5 | Duração e curva: estado em 120–200 ms, painel lateral e folha em 260–280 ms, nada de interface acima de 300 ms fora dos ritmos nomeados (giro do carregamento, respiro de 1,2 s) e do movimento de conteúdo das telas de consumidor (carrossel de destaques, tela de descanso, animações da foto), que não é avaliado aqui; curva do kit (`--cm-ease`, `--ct-ease`), `linear` só em movimento contínuo, nenhum `ease-in`. | E |
| A6 | Propriedades animadas: deslocamento, entrada e saída só por `transform` e `opacity`; nenhum `transition: all`; nenhuma animação de largura, altura, margem, recuo, `top`/`left`/`right`/`bottom` ou colunas da grade fora das duas exceções do kit (recolher da lateral, barra de progresso); nada surge de `scale(0)`. | E |
| A7 | Frequência, saída e hover: o que se repete o dia todo (troca de página, filtro, ordenação, atalho; no toque, categoria, quantidade, item do KDS) muda sem animar o conteúdo; camada que entra animada sai animada (perfil Operação: `.is-closing` no contêiner até o `animationend`); deslocamento no hover só dentro de `@media (hover: hover) and (pointer: fine)`. | E, N |

### O. Perfil Operação (página de toque; kit seção 9)

| ID | Item | Verif. |
|---|---|---|
| O1 ★ | Contêiner `.ct-app` com a classe da superfície (`--tablet`, `--totem`, `--kds`, `--tv`, `--web`); quiosque com `.ct-app--kiosk` (nunca na vitrine web). | E |
| O2 ★ | Alvos de toque no mínimo da superfície, inclusive +/−, fechar e ações de linha, com 8 px entre vizinhos; nenhuma ação só no hover. No KDS, o mínimo é 40 px, com os controles em 15 px (seção 9); no card do perfil Produção, vale a exceção da seção 10 (botão de estado com 42 px pela altura da linha, sem os 8 px). | E, N |
| O3 | Regra do esquema por sementes: telas de consumidor só com `--ct-*` de `colibri-esquema.js`, esquema aplicado antes de pintar; tipo de pedido e estação só da paleta curada; KDS no tema Colibri. | E, N |
| O4 ★ | Chrome 101: alvo declarado no build; nenhum `oklch()`, `lab()`, `color-mix()` com variável, classe de cor da paleta do Tailwind, `scale:`/`translate:` separados, `:has()` ou `@container` no CSS entregue. Na vitrine web, vale para o CSS do kit; o CSS próprio do projeto segue os navegadores atuais (as duas últimas versões do Safari no iOS e do Chrome no Android). | E |
| O5 | Composição: uma ação principal por tela (no cartão de produto, o + redondo, nunca preenchido); cartões só de produto e de pedido (o `.cc-sinal` e o `.cc-mais` do perfil Cards também são permitidos); sem faixa lateral colorida; cantos de 3 e 6 px (a tecla do teclado na tela, 10 px), sem pílula (a tag de alérgeno do perfil Produção é a exceção). | E |
| O6 ★ | Regra da urgência legível no cartão `.ct-order`: borda de 3 px mais faixa com ícone e rótulo; só o atraso pulsa. n/a sem KDS ou sem `.ct-order` (o card do perfil Produção é avaliado em R1) e n/a no `.cc-sinal` do perfil Cards (avaliado em H1 e H2). | E, N |
| O7 | Cartão `.ct-order` legível (n/a no card do perfil Produção, avaliado em R2): nome do item na cor do texto e quantidade em mono, a de 2 ou mais no selo neutro (`.ct-order__qty--multi`); estado de preparo do item na linha com ícone e rótulo (`.ct-order__state`, `is-preparing`, `is-ready`), sem piscar; visão por produto em `.ct-order--group` com o tipo em selo da paleta (com o perfil Produção, n/a: avaliada em R6); situação do despacho do delivery em selo de estado com ícone. n/a sem KDS. | E, N |
| O8 | Estação e painel: estação identificada por nome, cor da paleta e ícone da lista curada na barra `.ct-bar`; nenhum emoji ou imagem como ícone de estação; regra da barra no tamanho do card (nenhum tamanho, peso ou altura próprios sobre `.ct-bar` e `.ct-bar__station`); painel da produção em `.ct-board` com até seis `.ct-stat` no plano, sem cartões de métrica, número fora da meta com selo de estado, valor e unidade sem transbordar a coluna em 1280 e 1920 px (`--ct-stat-size` sem sobrescrita) e a tabela por estação em `.ct-board__table`. n/a sem KDS. | E, N |
| O9 | Carrossel de destaques e tela de descanso (tablet e totem): `.ct-destaques` no topo do cardápio, sem cobrir categorias, carrinho nem rodapé do pedido; revezamento por esmaecimento a cada 6 a 8 s com os pontos de posição (`.ct-destaques__pos`); pausa no primeiro toque e volta depois de 20 s sem uso; parado com movimento reduzido; tela de descanso em `.ct-destaques--descanso`, que só acorda ao toque, com o aviso "Ainda está aí?" antes de descartar um pedido em andamento. n/a sem carrossel nem tela de descanso. | E, N |
| O10 | Regra da hierarquia leve (telas de consumidor: tablet e totem): os tokens do kit (`--ct-w-*`, `--ct-control-text`, `--ct-btn-line`, `--ct-option-checked`, `--ct-price-text`, `--ct-btn-lg-text`, `--ct-tag-*`) sem sobrescrita no projeto; nenhum `font-weight` 700 nem tamanho próprio em botão, categoria, selo, preço do cartão e opção; botão secundário sem moldura; opção escolhida sem fundo pintado. n/a em página só de KDS ou TV. | E, N |
| O11 | Regra das colunas pela largura do card (tela da estação e visão por produto): colunas do admin entre 2 e 5, e a grade usa as escolhidas só até `--cp-card-min` (280 px) vezes o zoom, no cálculo do empilhamento e no CSS (`--ct-col-min` ligado pela raiz `.cp-modo-*`, sem sobrescrita); nenhum card abaixo da largura mínima em 1280 px com 5 colunas. n/a sem KDS. | E, N |
| O12 | Regra do cartão tocável com + (tablet e totem): cada `.ct-product` com o nome em `button.ct-product__link`, que abre o produto, e o + `.ct-product__add` no canto da foto, em todos os cartões, com `aria-label` de ação e produto, alvo da superfície e desabilitado no indisponível; nenhuma ação de texto ou preenchida no rodapé do cartão. n/a sem cartão de produto. | E, N |
| O13 | Acabamento de vidro (tablet, totem e vitrine web; escolha do canal): `.ct-app--vidro` com `--vidro-escuro`, `--vidro-claro` ou `--vidro-imagem`; com imagem do lojista ou esquema de canal, a classe e os tokens `--ct-vidro-*` de `derivarVidro` (nunca opacidade nem tons escritos à mão), com a escolha Automático, Claro ou Escuro no admin; nenhum texto direto sobre o fundo (título de seção na etiqueta de vidro); fundo da marca sem desenho próprio (o do kit, medido); vidro só nas peças da lista da seção 9, nunca no KDS, nos painéis do perfil Cards nem no Admin; modo econômico disponível. n/a sem vidro. | E, N |
| O14 | Regra do teclado na tela (tablet e totem): todo campo de texto ou número das telas de toque com o teclado do kit, `.ct-entry` com a bandeja `.ct-teclado` e `.ct-keypad` (numérico, centralizado, nunca esticado na largura) ou `.ct-keyboard` (letras e números e símbolos, trocados por ?123 / ABC, a camada fora de uso com `hidden`); nenhuma tecla com tamanho, peso, cor ou moldura próprios; destaque só pelo tom (`--ct-teclado`, `--ct-tecla-funcao`, `--ct-tecla`, sem sobrescrita); todo texto de tecla em `ink`, com a Maiúscula ligada pela seta preenchida; nenhuma tecla OK que repita a ação do rodapé; teclas no alvo da superfície. n/a sem entrada de texto ou número. | E, N |

### R. Perfil Produção (página com o card de produção; kit seção 10)

| ID | Item | Verif. |
|---|---|---|
| R1 ★ | Regra do tempo no preenchimento: cabeçalho do `.cp-card` neutro, `--atencao` ou `--atraso` conforme o tempo, com o ícone de urgência antes do tempo (no card de agrupamento, que não tem o tempo no cabeçalho, o ícone fica na linha de apoio, com a urgência por extenso: avaliado em R6); tipo do pedido no selo `.cp-card__tipo`, nunca no preenchimento; sem borda nem faixa de urgência; só o atraso respira, parado com movimento reduzido. | E, N |
| R2 | Itens: estado, quantidade e nome numa linha, com os cinco ícones de estado (`bi-clock`, `bi-fire`, `bi-check-circle-fill`, `bi-pause-circle-fill`, `bi-x-circle-fill`); nome e quantidade em `--cp-item`, sem negrito nem selo invertido; combo empilhado em `.cp-card__sub`; `--cp-esmaecido` só no item pronto; traço entre os itens; tamanhos e alturas de linha pelos tokens `--cp-*`. | E, N |
| R3 | Observação com `bi-arrow-right` na cor de aviso; linha alterada em `warning-soft`, sem bloco extra; alérgeno em `.cp-card__alergeno` só com o nome; ritmo de preparo com `bi-stopwatch` ou `bi-alarm`, nunca `bi-clock`. | E |
| R4 | Modos: modo da estação na raiz da grade (`.cp-modo-toque` ou `.cp-modo-bump`). Toque: rodapé com `.cp-card__acao` de 40 px e botão de estado do item (toque avança, toque no pronto volta, toque longo põe na espera). Bump: sem rodapé, `.is-selecionado` com o índice, cursor em dois níveis, Enter conclui com confirmação. O card nunca conclui sozinho. | E, N |
| R5 | Grade: cards sem altura mínima, empilhados na ordem da fila, com posições estáveis enquanto nenhum pedido entra ou sai nem muda de span; span calculado pelo card e informado à grade; card grande transbordando para colunas vizinhas com "Continua →" e "Continuação", sem linha cortada; transbordo entre monitores pelos cards inteiros. | E, N |
| R6 | Card de agrupamento e expedição (visão por produto): `.cp-card` com `.cp-card__produto` e `.cp-card__total`, cabeçalho na cor do tempo do pior pedido e a urgência por extenso no apoio; cada item com `.cp-card__origem` (tipo no selo, `.cp-card__ref`, `.cp-card__ref-tempo` com `.is-atencao` ou `.is-atraso` e o ícone); expedição com a situação do despacho em `.cp-card__faixa--aviso`. Nenhum `.ct-order` na tela que adotou o perfil Produção. n/a sem visão por produto. | E, N |

### H. Perfil Cards (página com painel de chamados; kit seção 11)

| ID | Item | Verif. |
|---|---|---|
| H1 ★ | Regra do estado no preenchimento e tinta calculada: o `.cc-sinal` inteiro na cor do estado (`--cc-cor`), sem borda, contorno nem sombra; cor de estado do padrão do kit, da paleta curada ou hex livre do lojista, sempre com a tinta, o véu e o respiro do motor (`tintaSobre`, `veuSobre`, `respiroDe` de `colibri-esquema.js`), nunca escolhidos pelo lojista nem fixos sobre cor livre; texto sobre o preenchimento com 4,5:1 ou mais em todo estado (meça com a cor configurada); só o estado mais grave respira (`.cc-sinal--atraso` ou `.cc-sinal--respira`), em `::before` só com opacidade, a cada 1,2 s, parado com movimento reduzido. | E, N |
| H2 ★ | Estado legível e altura estável: todo estado além do de partida (a espera) com ícone e rótulo, na faixa `.cc-urgencia` ou noutra peça, nunca só a cor (num kanban colunado sem estado de partida, todos); o ícone é escolha do painel; a faixa vazia e o rodapé reservam a altura, e o card não muda de altura ao mudar de estado; sem borda de urgência. | E, N |
| H3 | Peças e invariantes: uma informação principal, a maior do card (`.cc-sinal__valor` ou `.cc-sinal__valor--texto`); as demais peças (topo, faixa, rodapé, selos `.cc-veu`) em qualquer ordem e presença, sem molde obrigatório; nenhum corpo de itens (isso é o `.cp-card`) nem cartão dentro de cartão; cantos de 6 px no card e de 3 px no selo e na faixa; sem caixa alta. | E |
| H4 | Grade e transbordo: `.cc-grade` em `auto-fill`, cards alinhados ao topo, sem esticar até o vizinho; o que não cabe vira `.cc-mais` "+N chamados", neutro (`surface-2`, `ink-2`, número em `ink` mono), sem borda tracejada. | E, N |
| H5 | Fundo e escala: painel da equipe pelo tema Colibri (`data-theme`) ou com cor própria como semente `ambiente` de `derivarEsquema` (piso e textos do esquema, nunca hex solto); painel voltado ao cliente em `.cc-painel--cliente`, com piso, preenchimento e tinta do esquema do canal (`--ct-*`), sem tempo nem urgência; na TV, `.cc-painel--tv` (cada tamanho em `max(piso, N vw)`), sem cortar em 1366×768; tamanhos pelos tokens `--cc-t-*`, `--cc-gap` e `--cc-pad`. | E, N |

### W. Vitrine web (página com `.ct-app--web`; kit seção 9 "Vitrine web")

| ID | Item | Verif. |
|---|---|---|
| W1 ★ | Nada gira sozinho e nada interrompe o cardápio: nenhum carrossel automático, nenhum pop-up sobre o cardápio, nenhum pedido para instalar um app. | E, N |
| W2 ★ | Aberto ou fechado (selo com ícone e, fechado, quando reabre), tempo de entrega, taxa e pedido mínimo na faixa da loja (`.ct-loja`), antes do primeiro item; subtotal, entrega e total na sacola antes de finalizar. | E, N |
| W3 | Cardápio: busca e abas presas juntas (`.ct-topo`), seções na ordem e com a visibilidade da configuração da loja; cada produto num cartão `.ct-item` com o link esticado e o + redondo em todos os itens da lista (adiciona na hora sem opção obrigatória, senão abre o produto; nome do produto no `aria-label`); destaques em mini cards que rolam de lado; grade só em categoria com foto em todos os itens. | E, N |
| W4 | Produto com endereço próprio (página no celular, modal no computador), grupos com o cabeçalho preso, "Escolha N" e "Obrigatório", todas as escolhas na mesma página, e o Adicionar travado dizendo o que falta. | E, N |
| W5 | Sacola: barra presa embaixo no celular e no tablet, coluna lateral a partir de 1024 px; cada item com as escolhas, a quantidade e Editar (reabre o produto montado); remover com "Desfazer"; o Voltar não apaga item montado. | E, N |
| W6 | Web, não quiosque: campos e controles com 16 px ou mais; barras presas sem altura em `vh` e com `env(safe-area-inset-bottom)`, entrada com `viewport-fit=cover`; pedido como convidado; prévia do link (Open Graph) por loja e produto; imagens otimizadas e cardápio gerado no servidor. | E, N |

## Gatilhos de bloqueio

Falhas que impedem alguém de concluir a tarefa ou de entender a tela. O item que cobre cada uma é ★: reprovado, limita a faixa a **Parcial** na `aderencia` e decide o veredito **Bloquear** no `revisar`. Nunca é rebaixado porque a página é pequena, pouco usada ou porque o resto vai bem.

| Gatilho | Itens |
|---|---|
| Sem foco visível ou fluxo só pelo mouse | A1 |
| Controle sem nome acessível | A2 (no perfil Admin, também K2) |
| Conteúdo ou controle cortado, sobreposto ou fora de alcance em 320 px ou com zoom de 200%; texto cortado sem acesso ao texto inteiro | A3 |
| Movimento reduzido ignorado; estado indicado só por animação | A4 |
| Significado só pela cor (estado, urgência, tipo de pedido) | C3; nos perfis de toque, também O6, R1 e H2 |
| Cor fora dos tokens, com o contraste deixado ao acaso | C1 |
| Exclusão ou zeragem num clique só | K8 |
| Alvo de toque abaixo do mínimo da superfície, ou ação só no hover | O2 |

## Buscas

Busque no código de UI do projeto, excluindo a pasta copiada do kit (`colibri-ui/`), dependências (`node_modules/`, `wwwroot/lib/`, `vendor/`) e saídas de build (`bin/`, `obj/`, `dist/`, `build/`). Cada ocorrência é candidata: confirme no contexto antes de reprovar.

- W1: `autoplay|setInterval|carousel|carrossel|swiper|slick|embla|instal(e|ar) o app|beforeinstallprompt|modal.*(promo|cupom)`
- W2: `ct-loja__(info|estado)|taxa|m[ií]nimo|Fechado`
- W3: `ct-topo|ct-abas|ct-item__(link|add)|ct-itens--grade|ct-destaque` (grade com item sem foto, + só em parte dos itens)
- W4: `@modal|\(\.\)|intercept|ct-produto__(falta|rodape)|ct-grupo__cabeca` (produto sem rota própria, passos no celular)
- W5: `ct-sacola|Desfazer|Editar` (item sem edição na sacola, remoção sem desfazer)
- W6: `font-size:\s*1[0-5]px|100vh|viewport-fit|safe-area-inset|generateMetadata|openGraph|next/image|<img\b` (campo abaixo de 16 px, vh em barra, sem prévia nem imagem otimizada)
- B3: `fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs|unpkg\.com|fontawesome|typekit`
- B4: `rel=["'](shortcut )?icon`
- B5: `\bfa-|material-icons|glyphicon|\.(png|gif)["')]` e `@phosphor-icons|@tabler/icons` (só em figura de categoria ou de alérgeno, com o nome ao lado)
- C1: `#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(` em CSS, SCSS, `style=` e componentes
- C4: `data-theme|prefers-color-scheme|theme\s*===?`
- T1: `font-family`
- T4: `text-transform:\s*uppercase|\buppercase\b`
- S3: `cm-page--home`
- K3: `rowAlternationEnabled|table-striped|striped|showBorders`
- K7: `draggable|drag-handle|is-drop-|onDragOver|dragover` (linha inteira arrastável, alça ou barra de soltura com CSS próprio)
- K5: `\bconfirm\(|\balert\(`
- K6: `box-shadow|border-radius|border-left:\s*\d+px\s+solid` (sombra decorativa, canto fora da escala, faixa colorida num lado só)
- K8: `excluir|remover|zerar|delete|remove|onDelete|DeleteAsync` (handler de exclusão que executa sem diálogo de confirmação nem "Desfazer")
- A1: `outline:\s*(none|0)`
- A2: `<(button|a)\b[^>]*>\s*<i\b` (botão ou link só com ícone: confira o `aria-label`) e, com `rg -P`, `<img\b(?![^>]*\balt=)` (imagem sem `alt`)
- A3: `text-overflow:\s*ellipsis|line-clamp|white-space:\s*nowrap|min-width:\s*\d{3,}px|width:\s*\d{4,}px|minmax\(\d{3,}px` (corte sem dica, largura fixa ou mínimo de coluna que força rolagem); a medição em 320 e 640 px é a parte N (um `<iframe width="320">` serve quando a janela do navegador não desce a 320 px)
- A4: `animation|transition|prefers-reduced-motion` (animação sem o bloco de movimento reduzido)
- A5: `\d+(\.\d+)?m?s\b|ease-in[;,) ]|cubic-bezier` (duração acima de 300 ms fora dos ritmos nomeados, `ease-in`, curva própria)
- A6: `transition(-property)?:\s*all|transition:[^;]*\b(width|height|margin|padding|top|left|right|bottom|grid-template)|scale\(0\)` e as propriedades de cada `@keyframes` do projeto
- A7: `:hover[^{]*\{[^}]*(transform|translate)|@media\s*\(hover|is-closing|\.hidden\s*=\s*true|hidden=\{` (deslocamento no hover sem a consulta de mouse, camada escondida sem a saída)
- K9: `ct-app|ct-btn|ct-tag|draggable|cm-tag--(entrega|mesa|balcao|ficha|retirada)|cm-origem|cm-tile|cm-board|cm-tiles|cm-master` (painel de operação na escala do toque, cartão arrastável, tipo com ícone, origem sem o logo ou sem o nome)
- K10: `tabindex|keydown|ArrowDown|ArrowRight|ctrlKey|cm-shortcuts` (navegação por teclado ausente na fila, mais de um `tabindex="0"`, atalhos sem rodapé)
- O4 (só no CSS do perfil Operação: `colibri-touch`, `colibri-producao`, `colibri-cards` e o CSS próprio das telas de toque; o `colibri-ui.css` do Admin usa `:has()` e `@container` de propósito): `oklch\(|lab\(|color-mix\(|:has\(|@container|\bscale:|\btranslate:|\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b`
- O7: `animate-pulse|animation:|ct-order__qty|ct-order__state` (pulso fora do `.ct-order--late`, quantidade e nome com cor própria)
- R1: `cp-card--(atencao|atraso|pausa)|ct-order__urgency|border[^;]*cp-card` (urgência por borda ou faixa no card de produção)
- R2: `cp-card__(qtd|nome)|bi-circle\b|font-weight:\s*(600|700|bold)` (negrito no nome, aguardando com o círculo antigo)
- R3: `bi-clock|bi-stopwatch|bi-alarm|cp-card__alergeno|Alérgeno` (relógio fora do aguardando, palavra "Alérgeno" na tag)
- R4: `cp-modo-(toque|bump)|cp-card__estado-btn|is-cursor|is-selecionado`
- R5: `min-height|column-count|masonry|grid-row` (altura mínima nos cards, colunas do CSS)
- R6: `ct-order--group|ct-order__(origin|ref|title|total)|cp-card__(produto|total|origem|ref|ref-tempo)|cp-card__faixa--aviso` (cartão antigo na visão por produto de quem adotou o perfil Produção)
- O14: `vk-key|keypad-key|VirtualKeyboard|Keypad|ct-keyboard|ct-keypad|ct-key\b|ct-teclado|--ct-tecla` (teclado próprio no lugar do do kit, tecla com tamanho ou moldura próprios, tons da tecla sobrescritos, numérico esticado)
- O13: `ct-app--vidro|backdrop-filter|--ct-vidro-|derivarVidro|ct-secao__titulo` (opacidade ou tons do vidro escritos à mão, vidro fora das telas de consumidor, texto solto sobre o fundo)
- O12: `ct-product__foot[^"]*ct-btn|ct-product__(link|add)|aria-label="(Adicionar|Montar|Escolher)` (ação de texto no rodapé do cartão, + só em parte dos cartões, + sem o produto no rótulo)
- O11: `--ct-cols|--ct-col-min|--cp-card-min|grid-template-columns` (colunas fixas sem o limite da largura do card, limite sobrescrito)
- H1: `--cc-(tinta|veu)[\w-]*:|--cc-respiro|tintaSobre|veuSobre|respiroDe|cc-sinal--(atraso|respira)|cc-respirar|prefers-reduced-motion|box-shadow|border[^;]*cc-sinal` (tinta ou véu fixos sobre cor livre, tinta escolhida pelo lojista, mais de um estado respirando, respiro sem a parada do movimento reduzido)
- H2: `cc-urgencia|bi-[\w-]+-fill|min-height|border[^;]*cc-sinal` (estado só pela cor, faixa ausente que faz o card pular, urgência por borda)
- H3: `cc-sinal__(rotulo|timer|valor|rodape)|cc-veu|text-transform:\s*uppercase` (corpo de itens no card de sinal, duas informações do tamanho da principal, caixa alta)
- H4: `cc-grade|cc-mais|dashed|align-items:\s*stretch` (borda tracejada no transbordo, cards esticados)
- H5: `cc-painel--(cliente|tv)|data-theme|derivarEsquema|--cc-piso|--cc-t` (painel do cliente com tempo ou hex, cor própria sem o motor, TV sem a escala fluida)
- O10: `font-weight:\s*(700|800|900|bold)|--ct-w-|--ct-control-text|--ct-btn-line|--ct-option-checked|--ct-price-text|--ct-tag-` (peso forte ou token sobrescrito nas telas de consumidor)
- O9: `ct-destaques|carousel|carrossel|swiper|slick|embla|autoplay|setInterval` (carrossel fora do componente, sem pausa no toque, girando com movimento reduzido ou na vitrine web)
- O8: emoji no código e nos dados de estação (`rg -P "[\x{1F300}-\x{1FAFF}\x{2300}-\x{23FF}\x{2600}-\x{27BF}]"`; a faixa pula `U+2400`–`U+25FF`, dos traços de desenho de caixa (`──`) dos comentários de seção), `ct-bar|ct-board|ct-stat|--ct-stat-size` (tamanho ou peso próprios na barra, painel com o número sobrescrito) e cartões de métrica no painel

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
