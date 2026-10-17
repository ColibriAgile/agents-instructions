# Aderência ao kit

Procedimento do verbo `aderencia`. Mede quanto o código de UI e a aplicação em execução seguem as regras do kit, com nota de 0 a 100 e ranking de páginas. Não mede usabilidade: crítica de UX (heurísticas, personas, carga cognitiva) é do `impeccable critique`. A conferência completa do `DESIGN.md` gerado contra o kit é o checklist de fidelidade de [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md), que roda no `adotar`; aqui, o item B6 confere só a estrutura e as regras nomeadas.

A avaliação é somente leitura. A única gravação é o relatório `docs/design/ADERENCIA.md`.

## Rubrica v1

Cada item é **aprovado**, **reprovado**, **n/a** (não se aplica ao alvo, com o motivo), **desvio** (há linha em "Desvios do kit" do `DECISOES.md` com o ID do item na coluna "Regra do kit" e o escopo que cobre o caso) ou **não verificado** (a evidência exige o que não está disponível, como navegador ou aparelho). A regra de cada item está no `DESIGN.md` do kit, na seção indicada; leia a seção antes de julgar o item.

Verificação: **E** estática (busca no código, padrões na tabela "Buscas"), **D** detector (`impeccable detect --json`), **N** navegador (aplicação rodando). Item com E e N é aprovado pela parte estática e reprovado por qualquer uma das duas; sem navegador, a parte N fica registrada como não verificada no próprio item. ★ marca item crítico.

Escopo: itens de **projeto** são avaliados uma vez por execução; itens de **página**, em cada página do alvo. Página do perfil Admin usa todos os grupos, menos O. Página do perfil Operação usa B, C1, C3, T1, T2, T4, A e O.

### Perfil da página

O perfil decide quais itens valem, então é decidido por evidência, na primeira regra que se aplica:

1. **`DECISOES.md`:** a página está listada como superfície de toque (cardápio do tablet, totem, KDS, pedidos prontos) → Operação; listada no perfil Admin → Admin.
2. **Código:** a página usa o contêiner `.ct-app` ou é servida por uma entrada HTML que carrega `colibri-touch.css` → Operação; usa o shell `.cm-shell` ou é servida por uma entrada que carrega `colibri-ui.css` → Admin.
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
| C1 ★ | Cor só por token: CSS e marcação do projeto sem cor literal (hex, `rgb()`, `hsl()`, nome de cor) fora de definição de token; o detector não acusa cor fora do `DESIGN.md`. Exceções do kit: `transparent`, `currentColor`, `inherit` e o texto branco sobre foto ou câmera do perfil Operação. | E, D |
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
| O2 ★ | Alvos de toque no mínimo da superfície, inclusive +/−, fechar e ações de linha, com 8 px entre vizinhos; nenhuma ação só no hover. | E, N |
| O3 | Regra do esquema por sementes: telas de consumidor só com `--ct-*` de `colibri-esquema.js`, esquema aplicado antes de pintar; tipo de pedido e estação só da paleta curada; KDS no tema Colibri. | E, N |
| O4 ★ | Chrome 101: alvo declarado no build; nenhum `oklch()`, `lab()`, `color-mix()` com variável, classe de cor da paleta do Tailwind, `scale:`/`translate:` separados, `:has()` ou `@container` no CSS entregue. | E |
| O5 | Composição: uma ação principal por tela (a do cartão de produto é botão comum); cartões só de produto e de pedido; sem faixa lateral colorida; cantos de 3 e 6 px, sem pílula. | E |
| O6 | Regra da urgência legível: borda de 3 px mais faixa com ícone e rótulo; só o atraso pulsa. n/a sem KDS. | E, N |

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
