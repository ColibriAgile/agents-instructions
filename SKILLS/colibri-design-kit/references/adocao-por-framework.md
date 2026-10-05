# Adoção por framework

Complementa o passo 3 do `SKILL.md`. A marcação de cada componente está em `../assets/kit/exemplo.html` (`#historico` abre o painel lateral; `#inicio` mostra a marca-d'água).

## Ordem de carga (todos os frameworks)

1. CSS do framework e tema da biblioteca de componentes, se houver.
2. `icons/bootstrap-icons.min.css` (ou o CSS do pacote npm `bootstrap-icons`).
3. `colibri-ui.css`.
4. Adaptadores, se usados: `colibri-ui.bootstrap3.css` e/ou `colibri-ui.devexpress.css`.

`fonts/` e `logos/` ficam ao lado de `colibri-ui.css` (`url('fonts/…')` e `url('logos/…')` são relativos ao CSS). Se um bundler reescrever caminhos, confira que as WOFF2 e o SVG são emitidos e resolvem. Nada de fontes ou ícones por CDN: tudo precisa funcionar sem internet.

## Ícone da aba (todos os frameworks)

`logos/colibri.ico` é pedido pelo navegador a partir do `<link rel="icon">` da entrada HTML, não pelo CSS, então precisa estar numa pasta que o servidor entrega no caminho do `<link>`:

- **Create React App / Vite:** copie para `public/` (ex.: `public/static/colibri.ico`) e use `href="%PUBLIC_URL%/static/colibri.ico"` (CRA) ou `href="/colibri.ico"` (Vite). O que fica em `src/` só é servido quando importado pelo código.
- **Blazor / ASP.NET:** em `wwwroot/` (ex.: `wwwroot/colibri-ui/logos/colibri.ico`), com `<link rel="icon" href="colibri-ui/logos/colibri.ico">` em `App.razor`, `_Host.cshtml` ou `index.html`; remova o `favicon.png`/`favicon.ico` do modelo do projeto.
- **AngularJS / páginas servidas pelo backend:** no mesmo diretório de estáticos do `colibri-ui/`, com o caminho que o template do backend gera.
- Substituindo um ícone antigo, mude o nome ou acrescente `?v=` ao `href`: o navegador mantém o anterior em cache. Se a entrada HTML passa por um motor de templates (Jinja, Razor), confira que o caminho sai certo depois da renderização.

## Por framework

| Stack | Como aplicar |
|---|---|
| Bootstrap 3 / AngularJS | `colibri-ui.css` + `colibri-ui.bootstrap3.css` (cobre `.btn`, `.modal`, `.form-control`, `.form-group`, `.input-group-addon`, `.has-error`, `.checkbox`/`.radio`, angular-growl, Dropzone, `ng-cloak`). Menus: `.cm-menu` junto com `.dropdown-menu`. Diretivas/templates do projeto passam a emitir as classes `cm-`. |
| Bootstrap 4/5, React, Vue, Blazor sem biblioteca | Não use o adaptador Bootstrap 3. Implemente os componentes com as classes `cm-` ou transponha os tokens `--cm-*` para o tema do framework (ex.: variáveis `--bs-*`), usando o adaptador só como referência. |
| DevExpress Blazor | `colibri-ui.devexpress.css` depois do tema. Temas Fluent: variáveis `--dxds-font-family-*`; clássicos/Bootstrap externo: `--bs-*`. Escolha o `SizeMode` mais próximo da escala (13 px, controle de 32 px) e ajuste o resto por `--dxds-font-size-*`. Classes internas (`--dxbl-*`, `.dxbl-*`) só sem alternativa, com o motivo em `DECISOES.md`. Grade (`DxGrid`), pela regra da grade como tabela: o adaptador ainda não traz esse bloco, porque não foi conferido numa aplicação Blazor. Parta das variáveis do tema em `.dxbl-grid` (`--dxbl-grid-font-size: 13px`, `--dxbl-grid-bg: var(--cm-surface)`, `--dxbl-grid-color: var(--cm-ink)`, `--dxbl-grid-border-color: var(--cm-line)`, `--dxbl-grid-header-bg: var(--cm-surface-2)`, `--dxbl-grid-header-color: var(--cm-ink-2)`, `--dxbl-grid-hover-bg: var(--cm-hover)`, `--dxbl-grid-selection-bg: var(--cm-accent-soft)`, `--dxbl-grid-selection-color: var(--cm-ink)`, `--dxbl-grid-focus-frame-color: var(--cm-focus)`, `--dxbl-grid-text-cell-padding-x: 8px` e o `--dxbl-grid-text-cell-padding-y` que leve a linha a 42 px com o `--dxbl-grid-line-height` do tema), meça cabeçalho e linha no navegador e, conferido, leve o bloco ao adaptador. |
| DevExtreme (React, Angular, Vue, jQuery) | `colibri-ui.devexpress.css` fixa a fonte em `.dx-widget` e `.dx-overlay-wrapper` (popups anexados ao `<body>`) e leva a DataGrid e a caixa de seleção à regra da grade como tabela, nos dois temas. Na página, a grade fica num `.cm-panel` com `showBorders={false}`, sem `rowAlternationEnabled` nem `showColumnLines`; colunas de versão, data e contagem recebem `cssClass="cm-mono"`; na coluna de comandos (`type="buttons"`), os botões usam `icon="bi bi-…"` e a ação destrutiva `cssClass="cm-icon-btn--danger"`. Não repita no CSS do projeto o que o adaptador já cobre: ajuste de grade que valha para todas as aplicações volta ao kit. Prefira temas *compact*. Não carregue Roboto/Inter do tema (inclusive `@import` do Google Fonts dentro de CSS gerado pelo ThemeBuilder). Gráficos (`dxChart`, `dxPieChart` etc.) escrevem a fonte como estilo inline no SVG, a partir do tema de visualização, e o adaptador não os alcança: registre um tema de visualização com `font.family` igual a `--cm-font` (`registerTheme`/`currentTheme` de `devextreme/viz/themes`) e confira no navegador. |

Em qualquer biblioteca de terceiros, a fonte vai em `:root`/`body` e nas classes raiz dos componentes, nunca só num contêiner da página, porque calendários, listas suspensas e diálogos são renderizados fora dele.

## Comportamentos que o projeto precisa implementar

O CSS do kit só entrega o visual; reimplemente no framework do projeto (o `exemplo.html` traz uma versão mínima em JavaScript puro):

- **Lateral:** acima de 920 px, o botão alterna `.cm-shell--collapsed`; até 920 px, alterna `.cm-shell--overlay-open` (abre sobre o conteúdo com `.cm-shell__backdrop`). Esc fecha, o foco entra no menu ao abrir e volta ao botão ao fechar; clicar no fundo fecha.
- **Grupos da lateral** (`.cm-nav__section`): recolher/expandir alternando `.is-open`, `aria-expanded` no botão e o atributo `hidden` na `.cm-nav__list`. O CSS do kit mantém a lista recolhida contando na largura, para a lateral não mudar de tamanho. Não esconda a lista com `display: none` próprio.
- **Menus suspensos** (`.cm-menu`): abrir/fechar, Esc, clique fora e retorno de foco.
- **Painel lateral** (`.cm-drawer`): `.is-open`; Esc fecha e devolve o foco a quem abriu.
- **Diálogos:** Tab circula dentro, Enter aciona o botão padrão, Esc cancela. O botão padrão é sempre o principal, inclusive em exclusões (regra em `DESIGN.md`, "Camadas"):
  - Com campos: o conteúdo é um `<form>` com envio pelo Enter (botão `type="submit"` oculto ou o próprio principal como `submit`) e `autofocus` no primeiro campo.
  - Sem campos (confirmações): o principal recebe o foco ao abrir (`autofocus`/`autoFocus` no botão; em MUI, a prop `autoFocus` do `Button` dentro do `Dialog`; em Bootstrap 3, `shown.bs.modal` → `.focus()`; em DevExpress Blazor, `FocusAsync` no `DxButton` após abrir).
  - Se o componente de diálogo for compartilhado entre sistemas, não troque o padrão dele: passe o foco a partir de cada tela.
- **Foco dos botões com biblioteca de componentes:** o contorno interno do kit (`outline-offset: -3px`, focado com `z-index: 3`, contorno claro no principal) precisa valer também nos botões da biblioteca. Em MUI com `StyledEngineProvider injectFirst`, o CSS do Emotion é injetado antes do kit e perde para a regra global `:is(a, button, [tabindex]):focus-visible` (mesma especificidade): escreva o ajuste em CSS carregado depois do kit (`.MuiButton-root.Mui-focusVisible`, `.MuiButton-contained.Mui-focusVisible`, `.MuiDialogActions-root > .MuiButton-root.Mui-focusVisible`, `.MuiButtonGroup-root .MuiButton-root.Mui-focusVisible`), não só no tema.
- **Tema escuro:** um `.cm-topbar__action` só com ícone, antes do idioma, alterna `data-theme` entre `"light"` e `"dark"` em `document.documentElement` (nunca num contêiner: popups ficam fora dele). Sem escolha gravada, siga `prefers-color-scheme` e acompanhe a mudança do sistema; com escolha, grave no `localStorage` (em `try/catch`) e use-a na próxima visita. Aplique o atributo antes do primeiro desenho (script no `<head>` ou antes de montar a aplicação), para não piscar o tema claro. `aria-label` e `title` dizem o tema que o botão liga.
  - **MUI:** monte o tema com o mesmo modo (`palette.mode`) e as cores dos tokens do kit (fundos, textos, divisor, primária em `action`) e troque-o junto com o atributo. Não herde degradês nem paletas escuras de temas compartilhados que fujam do kit.
  - **DevExtreme:** o tema Material/Generic é claro ou escuro por arquivo. A grade (com a barra de busca e agrupamento acima dela), a caixa de seleção, o texto e o placeholder dos campos, as listas e o filtro de cabeçalho (itens, divisores, botões OK e Cancelar) e o indicador de carregamento já vêm nos tokens `--cm-*` pelo adaptador; vista os demais componentes usados (paginador, calendário, menus de contexto etc.) com os tokens no CSS do projeto ou carregue o tema *dark* correspondente e troque com `themes.current()`. Registre a escolha em `DECISOES.md`.
  - **DevExpress Blazor:** use a variante escura do tema Fluent junto com o atributo.
- **Estados de componente:** `.is-active`, `.is-open`, `.is-disabled`, `.is-invalid`, `.is-hidden` são aplicados pelo código do projeto.

## Página inicial

Somente o contêiner da página inicial recebe `cm-page--home` (`<div class="cm-page cm-page--home">`). Se a marca rolar junto com a página ou sumir, procure `transform`, `filter` ou `contain` em algum ancestral de `.cm-page`.

## Refatoração página a página

Depois do shell, refatore uma página por vez seguindo a anatomia de página do `DESIGN.md` (seção `## Layout`, `### Anatomia de página`), começando pela mais usada. No impeccable 4.x, peça a refatoração direto (ou use `impeccable shape <página>` para planejar antes), deixando claro que mundo visual e anatomia vêm do kit; `craft` é alias descontinuado. Confira o alinhamento em 1440, 1920 e ~900 px antes de dar a página por concluída e atualize a lista de páginas em `docs/design/DECISOES.md`.
