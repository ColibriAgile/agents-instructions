# Mapeamento do kit para o formato do impeccable

O `DESIGN.md` do kit (`../assets/kit/DESIGN.md`) tem 9 seções em português. O `impeccable document` exige a spec do DESIGN.md: frontmatter YAML restrito e **seis seções H2 fixas**, que o parser (`scripts/lib/design-parser.mjs` do impeccable) reconhece pelo nome em inglês. Este arquivo diz como converter sem perder regra.

## Convenções de escrita

- Títulos H2 exatamente: `## 1. Overview`, `## 2. Colors`, `## 3. Typography`, `## 4. Elevation`, `## 5. Components`, `## 6. Do's and Don'ts`. Nada de seções H2 extras. H3 (subseções) podem ser em português.
- Corpo em português do Brasil, com os valores e classes do kit.
- Título do documento: `# Design System: <Nome do produto>`.
- Norte criativo exatamente: `**Creative North Star: "Mesa de operação"**`.
- Regras nomeadas no formato que o parser lê: `**The <Nome> Rule.** <texto em português>`. Nomes fixos na tabela de regras abaixo.
- Do's and Don'ts em `### Do:` e `### Don't:`, cada item começando com `**Do**` / `**Don't**` seguido do texto em português.

## Seções: kit → spec

| Kit | Destino no DESIGN.md do projeto |
|---|---|
| Parágrafos iniciais (sobre o kit e como adotar) | Não entram. O que for do projeto vai para `### Implementação neste projeto`. |
| 1. Visão geral | `## 1. Overview`: norte criativo, parágrafo de cena (usuários/contexto do `PRODUCT.md`), o que o sistema rejeita, `**Key Characteristics:**` com as seis características do kit. |
| 2. Cores | `## 2. Colors`: `### Primary` (família do azul de ação e foco), `### Neutral` (plano, superfícies, textos, divisores, lateral), `### Status` (sucesso, aviso, erro, com `-soft`/`-line`), regra da ação rara. Sem Secondary/Tertiary: o kit tem um acento só. |
| 3. Tipografia | `## 3. Typography`: famílias e fallbacks, `### Hierarchy` com cada papel do frontmatter, limite de 65–80 caracteres, regras da informação primeiro e da tipografia única, e a subseção `### Bibliotecas de componentes` inteira. |
| 4. Elevação e movimento | `## 4. Elevation`: plano por padrão, sombras funcionais só em camadas flutuantes, hover muda a superfície. Durações e easing vão para `### Movimento` em Components. |
| 5. Estrutura da aplicação | `## 5. Components` → `### Shell e navegação` (shell, lateral, barra superior, avisos globais, comportamento até 920 px). |
| 6. Anatomia de página | `## 5. Components` → `### Anatomia de página` (toolbar, seções, estado, cartões, marca da página inicial com todos os subitens, vazio e carregamento). |
| 7. Componentes | `## 5. Components` → `### Buttons`, `### Lists and Tables`, `### Inputs / Fields`, `### Camadas` (diálogo, painel lateral, notificações, menu), `### Ícones`, `### Movimento`. |
| 8. Faça / Não faça | `## 6. Do's and Don'ts`, todos os itens, com as antirreferências do `PRODUCT.md` repetidas com as mesmas palavras. |
| 9. Implementação neste projeto | Última subseção de Components: `### Implementação neste projeto` (caminhos, ordem de carga, adaptadores, página com `.cm-page--home`, biblioteca e tema com versão, como cada componente `cm-` é produzido no framework, classes internas de terceiros usadas e o motivo). Aponte para `docs/design/DECISOES.md`. |

## Regras nomeadas

| Regra do kit | Forma no DESIGN.md | Seção |
|---|---|---|
| Regra da ação rara | `**The Rare Action Rule.**` | Colors |
| Regra da informação primeiro | `**The Information First Rule.**` | Typography |
| Regra da tipografia única | `**The Single Typeface Rule.**` | Typography |
| Plano por padrão (seção 4) | `**The Flat-By-Default Rule.**` | Elevation |
| Regra dos botões adjacentes | `**The Adjacent Buttons Rule.**` | Components |
| Marca na página inicial | `**The Home Watermark Rule.**` | Components |

## Frontmatter

Grupos aceitos pela spec: `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, `components`. O frontmatter do kit tem dois grupos fora da spec, que precisam ser redistribuídos:

- `sizes` → alturas e larguras dos `components` (`control-height` em `button-*` e `input`; `topbar-height` em `topbar`; `sidebar-width` em `sidebar`; `row-min-height` em `table-row`; `button-group-min-width` em `button-group`).
- `motion` → `extensions.motion` do sidecar.

Demais regras:

- `name`: nome do produto. `description`: `"Linha visual Colibri — mesa de operação compacta, sóbria e precisa"` ou equivalente confirmado.
- `colors`: as chaves e os hex do kit, sem renomear. Os degradês da lateral ficam como string (o linter do Stitch avisa; é aceito). Pode acrescentar as variantes de estado `*-soft`/`*-line` e `muted-soft` com os valores de `colibri-ui.css`.
- `typography`: os papéis do kit, com `fontFamily` completo como no CSS: `"Google Sans Flex, Segoe UI, Arial, sans-serif"` e `"Google Sans Mono, Consolas, monospace"`.
- `rounded`: os quatro do kit (`control`, `small`, `surface`, `tag`).
- `spacing`: só se houver escala reutilizada no `colibri-ui.css`; não invente.
- `components`: apenas as 8 propriedades da spec (`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`), com referências `{colors.x}` / `{rounded.y}`. Borda, sombra, foco e gap não cabem: vão no CSS do sidecar. Entradas sugeridas: `button-primary`, `button-primary-hover`, `button-secondary`, `button-sm`, `button-group`, `input`, `sidebar`, `topbar`, `table-row`, `tag`, `dialog`.

Correspondência entre chaves do frontmatter e variáveis de `colibri-ui.css` (use as variáveis no CSS do sidecar):

| Frontmatter | CSS |
|---|---|
| `action`, `action-hover`, `action-border`, `action-soft`, `action-line` | `--cm-accent`, `--cm-accent-hover`, `--cm-accent-border`, `--cm-accent-soft`, `--cm-accent-line` |
| `page`, `surface`, `surface-2`, `hover` | `--cm-bg`, `--cm-surface`, `--cm-surface-2`, `--cm-hover` |
| `ink`, `ink-2`, `ink-3`, `line`, `line-strong` | `--cm-ink`, `--cm-ink-2`, `--cm-ink-3`, `--cm-line`, `--cm-line-strong` |
| `button-ink`, `button-line` | `--cm-btn-ink`, `--cm-btn-line` |
| `focus` | `--cm-focus` (halo: `--cm-focus-ring`) |
| `success`, `warning`, `danger` | `--cm-success`, `--cm-warning`, `--cm-danger` (+ `-soft`, `-line`) |
| `sidebar`, `sidebar-head`, `sidebar-ink` | `--cm-sidebar-bg`, `--cm-sidebar-head-bg`, `--cm-nav-ink` |
| `rounded.control`, `rounded.small`, `rounded.surface` | `--cm-btn-radius`, `--cm-radius-sm`, `--cm-radius` |
| `control-height`, `topbar-height`, `sidebar-width` | `--cm-control-h`, `--cm-topbar-h`, `--cm-sidebar-w` |
| fontes | `--cm-font`, `--cm-mono`; easing `--cm-ease` |

Se o `colibri-ui.css` do projeto divergir dessa tabela (kit mais novo), o CSS copiado vence; ajuste o DESIGN.md e registre em `DECISOES.md`.

## Sidecar `.impeccable/design.json`

Siga o schema `schemaVersion: 2` do `reference/document.md` do impeccable, com:

- `colorMeta`: uma entrada por cor do frontmatter; `role` `primary`, `neutral` ou `status`; `displayName` com o nome usado no kit ("Azul de ação", "Plano de trabalho", "Superfície", "Texto principal", "Texto de apoio", "Divisor", "Foco", "Sucesso", "Aviso", "Erro", "Degradê azul Colibri" etc.); `canonical` no mesmo hex do frontmatter; `tonalRamp` de 8 passos.
- `typographyMeta`: `purpose` de cada papel conforme a seção 3 do kit.
- `shadows`: as sombras funcionais de `colibri-ui.css` (menu suspenso, painel lateral, diálogo, hover de cartão-link), com o valor exato copiado do CSS.
- `motion`: `--cm-ease`, estado 120–200 ms, painel lateral 260–280 ms, e a regra de `prefers-reduced-motion`.
- `breakpoints`: `920px` (lateral sobre o conteúdo) e `760px` (linhas viram blocos com rótulos).
- `components`: 6 a 10 trechos autocontidos, classes com prefixo `ds-`, CSS usando `var(--cm-*)`, estados `:hover` e `:focus-visible`, ícones como SVG inline (sem fonte de ícones). Marcação de referência: `../assets/kit/exemplo.html`. Cubra: botão principal, botão secundário, grupo de botões (com o principal à direita), campo com rótulo, item da lateral (normal e ativo), etiqueta de estado, faixa de estado (`notice`) e linha de tabela com ação de ícone.
- `narrative`: copiada do DESIGN.md gerado, sem reescrever (norte, visão geral, características, regras, do's, don'ts).

## Respostas herdadas para o passo 3 do `document`

Apresente ao usuário como decididas; não pergunte.

| Pergunta do impeccable | Resposta do kit |
|---|---|
| Creative North Star | "Mesa de operação" |
| Voz da visão geral | Sóbrio, preciso e discreto; registro de produto; rejeita página promocional, excesso de cartões e interface espaçosa que esconde informação. |
| Nomes das cores | Os nomes da seção 2 do kit (tabela do sidecar acima). |
| Filosofia de elevação | Plano por padrão; sombra só funcional, em camadas flutuantes. |
| Filosofia dos componentes | Compacto e preciso: 32 px, cantos de 3 px, botões adjacentes sempre agrupados. |

## Checklist de fidelidade

Antes de concluir, confirme que o DESIGN.md gerado contém cada item. Faltou algum, corrija antes de relatar.

- [ ] Seis H2 na ordem e com os nomes exatos; nenhum H2 extra; `**Creative North Star: "Mesa de operação"**` presente.
- [ ] Frontmatter sem `sizes` nem `motion`; `components` só com as 8 propriedades; hex idênticos ao kit.
- [ ] As seis regras nomeadas da tabela, cada uma na sua seção.
- [ ] Cores: acento só para ação e seleção; texto de apoio nunca mais claro que `ink-3`; estado sempre com rótulo ou ícone; detalhes da lateral (degradê, cabeçalho mais escuro, itens `#d7d7d7`, ativo branco sobre `rgba(255,255,255,.36)`, separadores a 16%, versão 11 px a 60%); foco de 2 px e halo dos campos; foco dos botões interno, focado acima dos vizinhos do grupo e claro no principal.
- [ ] Tipografia: Google Sans Flex/Mono locais com fallbacks; mono com algarismos tabulares para versões, datas, horários, contagens, identificadores e logs; maior texto é o título da barra superior (18 px); títulos em conteúdo rico até 16 px; 65–80 caracteres por linha; subseção de bibliotecas completa (família, como aplicar, popups fora da página, tamanho e peso, fontes locais, verificação obrigatória).
- [ ] Elevação: sem sombra decorativa; hover muda superfície, não levanta nem desloca; movimento 120–200 ms / 260–280 ms com `--cm-ease` e alternativa de movimento reduzido.
- [ ] Shell: lateral de 230 px com nome do produto sem ícone e sem versão, botão de recolher, grupos recolhíveis, versão no rodapé; até 920 px sobreposta com fundo escurecido, Esc fecha e foco volta ao botão; barra superior de 56 px com título, idioma, divisor e acesso; banners abaixo da barra.
- [ ] Anatomia: página não repete título; toolbar com busca/contexto à esquerda e estado + grupo de ações à direita; cabeçalho de seção com título, contagem e ferramentas; `.cm-notice` × `.cm-alert`; contagens como `.cm-tag`/`.cm-tag-filter`, nunca cartões de métrica; cartões só na inicial e em resumos, cartão-link inteiro com chevron; marca da página inicial com todos os subitens (SVG sem alteração, `position: fixed`, 12%, até 540 px/42%, decorativa, ancestrais sem `transform`/`filter`/`contain`, caminho relativo); vazio e carregamento.
- [ ] Botões: 32 px, 13 px regular `#495057`, borda `#d7dee7`, 3 px; principal `#1b6ec2`/`#0f5aa6`; `--sm` 28 px; ações de linha só ícone com `title` e `aria-label`, destrutivas por último e vermelhas só no hover, indisponíveis desabilitadas (não somem); os cinco itens da regra dos botões adjacentes.
- [ ] Tabelas: superfície única, grid com `--cm-cols`, ações com largura fixa à direita; ordenação com uma única seta só na coluna ativa; chevron na linha do título; listas de configuração com valor mono e ação "Alterar"; etiquetas; responsivo (colunas secundárias perto do tablet, blocos com rótulos abaixo de 760 px).
- [ ] Formulários: painel, fieldset, campo com rótulo sempre visível, erro associado, `.cm-form-row`/`.cm-form-grid`, `.cm-input-group`, `.cm-choices`, caixas e rádios de 16 px, `.cm-check--nested`, `.cm-toggles`, Salvar/Cancelar agrupados à direita, assistente `.cm-wizard`.
- [ ] Camadas: diálogo (título 16 px, corpo 16 px de respiro, rodapé `surface-2`, Tab circula, Enter aciona o padrão, Esc cancela; botão padrão é o principal, inclusive em exclusões; foco inicial no primeiro campo ou, sem campos, no principal); painel lateral 420 px com cabeçalho de 56 px; notificações no canto superior direito abaixo da barra; menu com itens de 32 px e item atual com marca.
- [ ] Ícones: Bootstrap Icons locais, um por item/ação, 15–16 px na navegação e ações, 14 px em botões, nada de PNG/GIF.
- [ ] Do's e Don'ts: os 6 "Faça" e os 7 "Não faça" do kit, mais as três antirreferências do `PRODUCT.md` com as mesmas palavras.
- [ ] `### Implementação neste projeto` preenchida com dados reais do projeto (nada entre colchetes).
