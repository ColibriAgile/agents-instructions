# Mapeamento do kit para o formato do impeccable

Vale para o impeccable 4.x (conferido na 4.4.0). O `DESIGN.md` do kit (`../assets/kit/DESIGN.md`) tem 9 seções em português. O `impeccable document` usa a spec do DESIGN.md: frontmatter YAML restrito e até **oito seções H2 canônicas, em ordem fixa**, reconhecidas pelo nome em inglês. O `PRODUCT.md` segue o schema de produto 1 do `impeccable init`. Este arquivo diz como converter sem perder regra.

## PRODUCT.md

Parta de `../assets/kit/PRODUCT.template.md`, que já está no schema 1:

- Mantenha o comentário `<!-- impeccable:product-schema 1 -->` exatamente como está.
- Não escreva `## Register`: a 4.x descontinuou esse campo e o `doctor` aponta `product-deprecated-register`. O modo das páginas Colibri é **Operate** (a pessoa conclui uma tarefa); o impeccable o registra no brief de cada superfície quando a página for trabalhada, não no `PRODUCT.md`.
- `## Platform` é `web`, salvo projeto nativo confirmado pelo usuário.
- A personalidade e as três antirreferências da linha Colibri ficam em `## Brand Commitments`, com o mesmo texto do modelo; os cinco princípios ficam em `## Product Principles`.
- `## Operating Context` começa com o cenário fixo da linha (estações Windows, janela reduzida até tablet) e recebe os fluxos do produto; `## Capabilities and Constraints` mantém a restrição de operação sem internet.
- `## Stack` só em projeto sem código (não é o caso de uma adoção). `## Evidence on Hand` só quando o usuário apontar dados ou material reais; senão, omita.
- Não entram no `PRODUCT.md`: cores, tipografia, componentes nem anatomia de página (isso é `DESIGN.md`).

### Migração de um PRODUCT.md do impeccable 3.x

Mostre ao usuário e, com confirmação: apague `## Register`; mova `## Brand Personality` e `## Anti-references` para `## Brand Commitments`; renomeie `## Design Principles` para `## Product Principles`; separe de `## Users` o cenário de uso para `## Operating Context`; acrescente `## Capabilities and Constraints` e o comentário de schema. Não mude o conteúdo já confirmado.

## Convenções de escrita do DESIGN.md

- Títulos H2 exatamente, sem número e nesta ordem: `## Overview`, `## Colors`, `## Typography`, `## Layout`, `## Elevation & Depth`, `## Shapes`, `## Components`, `## Do's and Don'ts`. Nada de seções H2 extras. H3 (subseções) podem ser em português.
- Corpo em português do Brasil, com os valores e classes do kit.
- Título do documento: `# Design System: <Nome do produto>`.
- Norte criativo exatamente: `**Creative North Star: "Mesa de operação"**`.
- Cores: uma por item, no formato `- **<Nome>** (<valor>): <uso>`, com o valor exato do frontmatter entre parênteses (hex ou o degradê). Nome e valor fora desse formato não são lidos como cor.
- Fontes: `**Body Font:** Google Sans Flex (with Segoe UI, Arial, sans-serif)` e `**Data Font:** Google Sans Mono (with Consolas, monospace)`, cada uma numa linha, sem outro parêntese; o resto da explicação vai no parágrafo seguinte.
- Regras nomeadas no formato `**The <Nome> Rule.** <texto em português>`. Nomes fixos na tabela de regras abaixo.
- Do's and Don'ts em `### Do:` e `### Don't:`, cada item começando com `**Do**` / `**Don't**` seguido do texto em português.

## Seções: kit → spec

| Kit | Destino no DESIGN.md do projeto |
|---|---|
| Parágrafos iniciais (sobre o kit e como adotar) | Não entram. O que for do projeto vai para `### Implementação neste projeto`. |
| 1. Visão geral | `## Overview`: norte criativo, parágrafo de cena (usuários e contexto do `PRODUCT.md`), o que o sistema rejeita (antirreferências de `## Brand Commitments`), `**Key Characteristics:**` com as seis características do kit. |
| 2. Cores | `## Colors`: `### Primary` (família do azul de ação e foco), `### Neutral` (plano, superfícies, textos, divisores, botão, lateral), `### Status` (sucesso, aviso, erro, cada um com `-soft`/`-line`), regra da ação rara. Sem Secondary/Tertiary: o kit tem um acento só. |
| 3. Tipografia | `## Typography`: linhas de fonte, `**Character:**`, `### Hierarchy` com cada papel do frontmatter, limite de 65–80 caracteres, regras da informação primeiro e da tipografia única, e a subseção `### Bibliotecas de componentes` inteira. |
| 5. Estrutura da aplicação (medidas e regiões) e 6. Anatomia de página (composição) | `## Layout`: modelo espacial do shell (lateral de 230 px + área principal com barra superior de 56 px e área rolável `.cm-scroll` > `.cm-content`; avisos globais logo abaixo da barra), densidade (conteúdo útil na primeira tela), responsivo (920 px: lateral sobre o conteúdo; perto da largura de tablet: esconder colunas secundárias; 760 px: linhas viram blocos com rótulos), conferência em 1440, 1920 e ~900 px, e `### Anatomia de página` (página não repete título, toolbar, seções, estado, contagens, cartões). |
| 4. Elevação e movimento | `## Elevation & Depth`: plano por padrão, `### Shadow Vocabulary` só com sombras funcionais de camadas flutuantes, hover muda a superfície. Durações e easing vão para `### Movimento` em Components. |
| Cantos e bordas (frontmatter `rounded` e seção 7) | `## Shapes`: cantos de 3 px em controles (botões, campos, caixas de seleção), 4 px em ações de ícone e itens da lateral, 6 px em superfícies (painéis, tabelas, diálogos, menus, faixas de estado), 10 px em etiquetas, rádio circular; divisores e bordas de 1 px; cantos arredondados só nas extremidades de grupos de botões; nenhuma forma decorativa. |
| 5. Estrutura da aplicação (comportamento) | `## Components` → `### Shell e navegação` (lateral: nome do produto sem ícone e sem versão, recolher, grupos recolhíveis, versão no rodapé, sobreposição até 920 px com Esc e retorno de foco; barra superior: título, idioma, divisor, acesso). |
| 6. Anatomia de página (marca, vazio e carregamento) | `## Components` → `### Marca da página inicial` (regra da marca-d'água com todos os subitens) e `### Vazio e carregamento`. |
| 7. Componentes | `## Components` → `### Buttons`, `### Lists and Tables`, `### Inputs / Fields`, `### Camadas` (diálogo, painel lateral, notificações, menu), `### Ícones`, `### Movimento`. |
| 8. Faça / Não faça | `## Do's and Don'ts`, todos os itens, com as antirreferências do `PRODUCT.md` repetidas com as mesmas palavras (são compromissos da marca, não restrições de uma página). |
| 9. Implementação neste projeto | Última subseção de Components: `### Implementação neste projeto` (caminhos, ordem de carga, adaptadores, página com `.cm-page--home`, biblioteca e tema com versão, como cada componente `cm-` é produzido no framework, classes internas de terceiros usadas e o motivo). Aponte para `docs/design/DECISOES.md`. |

### Migração de um DESIGN.md do impeccable 3.x

O formato antigo tinha seis H2 numerados (`## 1. Overview` … `## 6. Do's and Don'ts`) e `## 4. Elevation`. Com confirmação do usuário (o `document` exige escolher entre refresh, overwrite ou merge), reescreva no formato acima: tire os números, renomeie Elevation para `## Elevation & Depth`, crie `## Layout` com o shell e a anatomia de página que estavam em Components e crie `## Shapes`. Nenhuma regra muda; só muda de lugar. Regere o sidecar em seguida.

## Regras nomeadas

| Regra do kit | Forma no DESIGN.md | Seção |
|---|---|---|
| Regra da ação rara | `**The Rare Action Rule.**` | Colors |
| Regra da informação primeiro | `**The Information First Rule.**` | Typography |
| Regra da tipografia única | `**The Single Typeface Rule.**` | Typography |
| Plano por padrão (seção 4) | `**The Flat-By-Default Rule.**` | Elevation & Depth |
| Regra dos botões adjacentes | `**The Adjacent Buttons Rule.**` | Components |
| Marca na página inicial | `**The Home Watermark Rule.**` | Components |

## Frontmatter

Grupos aceitos pela spec: `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, `components`. O frontmatter do kit tem dois grupos fora da spec, que precisam ser redistribuídos:

- `sizes` → alturas e larguras dos `components` (`control-height` em `button-*` e `input`; `topbar-height` em `topbar`; `sidebar-width` em `sidebar`; `row-min-height` em `table-row`; `button-group-min-width` em `button-group`).
- `motion` → `extensions.motion` do sidecar.

Demais regras:

- `name`: nome do produto. `description`: `"Linha visual Colibri — mesa de operação compacta, sóbria e precisa"` ou equivalente confirmado.
- `colors`: as chaves e os valores do kit, sem renomear, em hex (não converta para OKLCH). Os degradês da lateral ficam como string CSS (`linear-gradient(...)`), que a spec aceita. Acrescente as variantes de estado `*-soft`/`*-line`, `muted-soft` e `button-hover` com os valores de `colibri-ui.css`: o detector do impeccable acusa como "fora do DESIGN.md" toda cor usada no CSS que não esteja no frontmatter.
- `typography`: os papéis do kit, com `fontFamily` completo como no CSS: `"Google Sans Flex, Segoe UI, Arial, sans-serif"` e `"Google Sans Mono, Consolas, monospace"`. No papel `data`, pode acrescentar `fontFeature: "\"tnum\" 1"` (algarismos tabulares do CSS).
- `rounded`: os quatro do kit (`control`, `small`, `surface`, `tag`).
- `spacing`: só se houver escala reutilizada no `colibri-ui.css`; não invente.
- `components`: apenas as 8 propriedades da spec (`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`), com referências `{colors.x}` / `{rounded.y}`. Borda, sombra, foco e gap não cabem: vão no CSS do sidecar. Entradas sugeridas: `button-primary`, `button-primary-hover`, `button-secondary`, `button-secondary-hover`, `button-sm`, `button-group`, `input`, `sidebar`, `topbar`, `table-row`, `tag`, `dialog`.

Correspondência entre chaves do frontmatter e variáveis de `colibri-ui.css` (use as variáveis no CSS do sidecar):

| Frontmatter | CSS |
|---|---|
| `action`, `action-hover`, `action-border`, `action-soft`, `action-line` | `--cm-accent`, `--cm-accent-hover`, `--cm-accent-border`, `--cm-accent-soft`, `--cm-accent-line` |
| `page`, `surface`, `surface-2`, `hover` | `--cm-bg`, `--cm-surface`, `--cm-surface-2`, `--cm-hover` |
| `ink`, `ink-2`, `ink-3`, `line`, `line-strong` | `--cm-ink`, `--cm-ink-2`, `--cm-ink-3`, `--cm-line`, `--cm-line-strong` |
| `button-ink`, `button-line`, `button-hover` | `--cm-btn-ink`, `--cm-btn-line`, `--cm-btn-hover` |
| `focus` | `--cm-focus` (halo: `--cm-focus-ring`) |
| `success`, `warning`, `danger`, `muted-soft` | `--cm-success`, `--cm-warning`, `--cm-danger` (+ `-soft`, `-line`), `--cm-muted-soft` |
| `sidebar`, `sidebar-head`, `sidebar-ink` | `--cm-sidebar-bg`, `--cm-sidebar-head-bg`, `--cm-nav-ink` |
| `rounded.control`, `rounded.small`, `rounded.surface` | `--cm-btn-radius`, `--cm-radius-sm`, `--cm-radius` |
| `control-height`, `topbar-height`, `sidebar-width` | `--cm-control-h`, `--cm-topbar-h`, `--cm-sidebar-w` |
| fontes | `--cm-font`, `--cm-mono`; easing `--cm-ease` |

Se o `colibri-ui.css` do projeto divergir dessa tabela (kit mais novo), o CSS copiado vence; ajuste o DESIGN.md e registre em `DECISOES.md`.

## Sidecar `.impeccable/design.json`

Siga o schema `schemaVersion: 2` do `reference/document.md` do impeccable, com:

- `colorMeta`: uma entrada por cor do frontmatter; `role` `primary`, `neutral` ou `status`; `displayName` igual ao nome em negrito usado em `## Colors` ("Azul de ação", "Plano de trabalho", "Superfície", "Texto principal", "Texto de apoio", "Divisor", "Foco", "Sucesso", "Aviso", "Erro", "Degradê azul Colibri" etc.); `canonical` no mesmo valor do frontmatter; `tonalRamp` de 8 passos (nos degradês, a partir da cor final).
- `typographyMeta`: `purpose` de cada papel conforme a seção 3 do kit.
- `shadows`: as sombras funcionais de `colibri-ui.css` (menu suspenso, painel lateral, diálogo, hover de cartão-link), com o valor exato copiado do CSS.
- `motion`: `--cm-ease`, estado 120–200 ms, painel lateral 260–280 ms, e a regra de `prefers-reduced-motion`.
- `breakpoints`: `920px` (lateral sobre o conteúdo) e `760px` (linhas viram blocos com rótulos).
- `components`: 6 a 10 trechos autocontidos, classes com prefixo `ds-`, CSS usando `var(--cm-*)`, estados `:hover` e `:focus-visible`, ícones como SVG inline (sem fonte de ícones). Marcação de referência: `../assets/kit/exemplo.html`. Cubra: botão principal, botão secundário, grupo de botões (com o principal à direita), campo com rótulo, item da lateral (normal e ativo), etiqueta de estado, faixa de estado (`notice`) e linha de tabela com ação de ícone.
- `narrative`: copiada do DESIGN.md gerado, sem reescrever (norte, visão geral, características, regras com `section` em minúsculas — `colors`, `typography`, `elevation`, `components` —, do's, don'ts). Gere-a lendo o arquivo gravado, não reescrevendo à mão.

## Respostas herdadas para o passo 3 do `document`

O `document` pede essas respostas em duas rodadas de perguntas. Apresente ao usuário como decididas; não pergunte.

| Pergunta do impeccable | Resposta do kit |
|---|---|
| Creative North Star | "Mesa de operação" |
| Voz da visão geral | Sóbrio, preciso e discreto; registro de produto; rejeita página promocional, excesso de cartões e interface espaçosa que esconde informação. |
| Nomes das cores | Os nomes da seção 2 do kit (tabela do sidecar acima). |
| Filosofia de elevação | Plano por padrão; sombra só funcional, em camadas flutuantes. |
| Filosofia dos componentes | Compacto e preciso: 32 px, cantos de 3 px, botões adjacentes sempre agrupados. |

## Checklist de fidelidade

Antes de concluir, confirme que o DESIGN.md gerado contém cada item. Faltou algum, corrija antes de relatar.

- [ ] Oito H2 na ordem e com os nomes exatos, sem número; nenhum H2 extra; `**Creative North Star: "Mesa de operação"**` presente.
- [ ] Frontmatter sem `sizes` nem `motion`; `components` só com as 8 propriedades; valores idênticos ao kit.
- [ ] As seis regras nomeadas da tabela, cada uma na sua seção.
- [ ] Cores: uma por item com o valor entre parênteses; acento só para ação e seleção; texto de apoio nunca mais claro que `ink-3`; estado sempre com rótulo ou ícone; detalhes da lateral (degradê, cabeçalho mais escuro, itens `#d7d7d7`, ativo branco sobre `rgba(255,255,255,.36)`, separadores a 16%, versão 11 px a 60%); foco de 2 px e halo dos campos; foco dos botões interno, focado acima dos vizinhos do grupo e claro no principal.
- [ ] Tipografia: linhas `**Body Font:**` e `**Data Font:**` no formato da convenção; Google Sans Flex/Mono locais; mono com algarismos tabulares para versões, datas, horários, contagens, identificadores e logs; maior texto é o título da barra superior (18 px); títulos em conteúdo rico até 16 px; 65–80 caracteres por linha; subseção de bibliotecas completa (família, como aplicar, popups fora da página, tamanho e peso, fontes locais, verificação obrigatória).
- [ ] Layout: shell (230 px, 56 px, área rolável, avisos abaixo da barra); primeira tela com conteúdo útil; 920 px, colunas secundárias perto do tablet e blocos com rótulos abaixo de 760 px; conferência em 1440, 1920 e ~900 px; anatomia: página não repete título; toolbar com busca/contexto à esquerda e estado + grupo de ações à direita; cabeçalho de seção com título, contagem e ferramentas; `.cm-notice` × `.cm-alert`; contagens como `.cm-tag`/`.cm-tag-filter`, nunca cartões de métrica; cartões só na inicial e em resumos, cartão-link inteiro com chevron.
- [ ] Elevation & Depth: sem sombra decorativa; sombras funcionais com valor exato; hover muda superfície, não levanta nem desloca.
- [ ] Shapes: 3 / 4 / 6 / 10 px com onde cada um se aplica, rádio circular, bordas de 1 px, cantos só nas extremidades de grupos.
- [ ] Shell e navegação: lateral com nome do produto sem ícone e sem versão, botão de recolher, grupos recolhíveis, versão no rodapé; até 920 px sobreposta com fundo escurecido, Esc fecha e foco volta ao botão; barra superior com título, idioma, divisor e acesso.
- [ ] Marca da página inicial com todos os subitens (SVG sem alteração, `position: fixed`, 12%, até 540 px/42%, decorativa, ancestrais sem `transform`/`filter`/`contain`, caminho relativo); vazio e carregamento.
- [ ] Botões: 32 px, 13 px regular `#495057`, borda `#d7dee7`, 3 px; principal `#1b6ec2`/`#0f5aa6`; `--sm` 28 px; ações de linha só ícone com `title` e `aria-label`, destrutivas por último e vermelhas só no hover, indisponíveis desabilitadas (não somem); os cinco itens da regra dos botões adjacentes.
- [ ] Tabelas: superfície única, grid com `--cm-cols`, ações com largura fixa à direita; ordenação com uma única seta só na coluna ativa; chevron na linha do título; listas de configuração com valor mono e ação "Alterar"; etiquetas.
- [ ] Formulários: painel, fieldset, campo com rótulo sempre visível, erro associado, `.cm-form-row`/`.cm-form-grid`, `.cm-input-group`, `.cm-choices`, caixas e rádios de 16 px, `.cm-check--nested`, `.cm-toggles`, Salvar/Cancelar agrupados à direita, assistente `.cm-wizard`.
- [ ] Camadas: diálogo (título 16 px, corpo 16 px de respiro, rodapé `surface-2`, Tab circula, Enter aciona o padrão, Esc cancela; botão padrão é o principal, inclusive em exclusões; foco inicial no primeiro campo ou, sem campos, no principal); painel lateral 420 px com cabeçalho de 56 px; notificações no canto superior direito abaixo da barra; menu com itens de 32 px e item atual com marca.
- [ ] Ícones: Bootstrap Icons locais, um por item/ação, 15–16 px na navegação e ações, 14 px em botões, nada de PNG/GIF.
- [ ] Movimento: 120–200 ms / 260–280 ms com `--cm-ease` e alternativa de movimento reduzido.
- [ ] Do's e Don'ts: os 6 "Faça" e os 7 "Não faça" do kit, mais as três antirreferências do `PRODUCT.md` com as mesmas palavras.
- [ ] `### Implementação neste projeto` preenchida com dados reais do projeto (nada entre colchetes).
