# Adoção por framework

Complementa o passo 3 de [`./adotar.md`](./adotar.md). A marcação de cada componente está em `../assets/kit/exemplo.html` (o painel de operação, em `../assets/kit/exemplo-pedidos.html`) (`#historico` abre o painel lateral; `#inicio` mostra a marca-d'água) e a da tela de entrada em `../assets/kit/exemplo-entrada.html` (`#erro` mostra a página de erro).

## Ordem de carga (todos os frameworks)

1. CSS do framework e tema da biblioteca de componentes, se houver.
2. `icons/bootstrap-icons.min.css` (ou o CSS do pacote npm `bootstrap-icons`).
3. `colibri-ui.css` (ele traz `colibri-base.css` por `@import`; não carregue a base de novo).
4. Adaptadores, se usados: `colibri-ui.bootstrap3.css` e/ou `colibri-ui.devexpress.css`.

`colibri-base.css`, `fonts/` e `logos/` ficam ao lado de `colibri-ui.css` (`@import url('colibri-base.css')`, `url('fonts/…')` e `url('logos/…')` são relativos ao CSS). Com bundler (Vite, webpack), o `@import` é resolvido e embutido no build; sem bundler, o navegador pede `colibri-base.css` ao lado do `colibri-ui.css`. Se um bundler reescrever caminhos, confira que as WOFF2 e o SVG são emitidos e resolvem. Nada de fontes ou ícones por CDN: tudo precisa funcionar sem internet.

## Ícone da aba (todos os frameworks)

`logos/colibri.ico` é pedido pelo navegador a partir do `<link rel="icon">` da entrada HTML, não pelo CSS, então precisa estar numa pasta que o servidor entrega no caminho do `<link>`:

- **Create React App / Vite:** copie para `public/` (ex.: `public/static/colibri.ico`) e use `href="%PUBLIC_URL%/static/colibri.ico"` (CRA) ou `href="/colibri.ico"` (Vite). O que fica em `src/` só é servido quando importado pelo código.
- **Blazor / ASP.NET:** em `wwwroot/` (ex.: `wwwroot/colibri-ui/logos/colibri.ico`), com `<link rel="icon" href="colibri-ui/logos/colibri.ico">` em `App.razor`, `_Host.cshtml` ou `index.html`; remova o `favicon.png`/`favicon.ico` do modelo do projeto.
- **AngularJS / páginas servidas pelo backend:** no mesmo diretório de estáticos do `colibri-ui/`, com o caminho que o template do backend gera.
- Substituindo um ícone antigo, mude o nome ou acrescente `?v=` ao `href`: o navegador mantém o anterior em cache. Se a entrada HTML passa por um motor de templates (Jinja, Razor), confira que o caminho sai certo depois da renderização.
- Responda também `/favicon.ico` na raiz com o mesmo arquivo (cópia ou redirecionamento da rota): o navegador pede esse endereço nas páginas sem `<link rel="icon">`, como respostas do backend.

## Tela de entrada e páginas de erro (todos os frameworks)

`logos/colibri-marca.svg` é uma imagem do HTML, não do CSS: sirva-a da mesma pasta pública do `colibri-ui/` e use o caminho na `<img>` da marca. A tela carrega só os ícones e `colibri-ui.css` (com a base ao lado), sem o CSS do framework nem o legado da aplicação, e aplica o tema gravado (`cm-theme`) antes do primeiro desenho, com o mesmo script da aplicação. Páginas de erro servidas pelo backend (404, 500) costumam não ter o idioma da aplicação: escolha os textos pelo idioma do navegador.

## Por framework

| Stack | Como aplicar |
|---|---|
| Bootstrap 3 / AngularJS | `colibri-ui.css` + `colibri-ui.bootstrap3.css`, carregado depois do CSS das bibliotecas (cobre `.btn`, `.modal`, `.form-control` (borda de foco também no `.modal-body`; somente leitura e desabilitado com os tokens), `.form-group`, `.input-group` (halo do foco no conjunto, como no `.cm-input-group`) e `.input-group-addon`, `.has-error` (com o halo do kit no foco), `.checkbox`/`.radio`, `.cm-check` e `.cm-toggle` no `.modal-body`, angular-growl, pnotify 1.2 e PNotify 5, chosen (também com o `chosen-bootstrap.css`), bootstrap-daterangepicker 2.1 (Cancelar | Aplicar agrupados), c3, Dropzone, `ng-cloak`). Nos gráficos c3, passe as cores das séries pela paleta `--cm-chart-*` (lida com `getComputedStyle`), porque o c3 escreve a cor no SVG. Menus: `.cm-menu` junto com `.dropdown-menu`. Diretivas/templates do projeto passam a emitir as classes `cm-`. No rodapé do modal, a ação destrutiva à parte usa `.btn.cm-btn--danger-text.cm-dialog__aside`. Com pnotify, configure posição e largura (abaixo). |
| Bootstrap 4/5, React, Vue, Blazor sem biblioteca | Não use o adaptador Bootstrap 3. Implemente os componentes com as classes `cm-` ou transponha os tokens `--cm-*` para o tema do framework (ex.: variáveis `--bs-*`), usando o adaptador só como referência. |
| DevExpress Blazor | `colibri-ui.devexpress.css` depois do tema. Temas Fluent: variáveis `--dxds-font-family-*`; clássicos/Bootstrap externo: `--bs-*`. Escolha o `SizeMode` mais próximo da escala (13 px, controle de 32 px) e ajuste o resto por `--dxds-font-size-*`. Classes internas (`--dxbl-*`, `.dxbl-*`) só sem alternativa, com o motivo em `DECISOES.md`. Grade (`DxGrid`), pela regra da grade como tabela: o adaptador ainda não traz esse bloco, porque não foi conferido numa aplicação Blazor. Parta das variáveis do tema em `.dxbl-grid` (`--dxbl-grid-font-size: 13px`, `--dxbl-grid-bg: var(--cm-surface)`, `--dxbl-grid-color: var(--cm-ink)`, `--dxbl-grid-border-color: var(--cm-line)`, `--dxbl-grid-header-bg: var(--cm-surface-2)`, `--dxbl-grid-header-color: var(--cm-ink-2)`, `--dxbl-grid-hover-bg: var(--cm-hover)`, `--dxbl-grid-selection-bg: var(--cm-accent-soft)`, `--dxbl-grid-selection-color: var(--cm-ink)`, `--dxbl-grid-focus-frame-color: var(--cm-focus)`, `--dxbl-grid-text-cell-padding-x: 8px` e o `--dxbl-grid-text-cell-padding-y` que leve a linha a 36 px com o `--dxbl-grid-line-height` do tema), meça cabeçalho e linha no navegador e, conferido, leve o bloco ao adaptador. |
| Avalonia (aplicação desktop .NET) | Sem CSS: o kit chega pelo tema `CoLib.Ui.Avalonia` do submódulo `_lib` (dotnet-lib), que transpõe os tokens e os componentes `cm-` para XAML. Siga a seção "Avalonia" abaixo: ordem dos `StyleInclude`, classes equivalentes, as armadilhas do tema Fluent (o `DataGridCell` fixa 15 px; a seleção usa o acento do Fluent a 60%) e a medição headless. |
| DevExtreme (React, Angular, Vue, jQuery) | `colibri-ui.devexpress.css` fixa a fonte em `.dx-widget` e `.dx-overlay-wrapper` (popups anexados ao `<body>`) e leva a DataGrid e a caixa de seleção à regra da grade como tabela, nos dois temas. Na página, a grade fica num `.cm-panel` com `showBorders={false}`, sem `rowAlternationEnabled` nem `showColumnLines`; colunas de versão, data e contagem recebem `cssClass="cm-mono"`; na coluna de comandos (`type="buttons"`), os botões usam `icon="bi bi-…"` e a ação destrutiva `cssClass="cm-icon-btn--danger"`; colunas numéricas (código, quantidade, valor) recebem `alignment="right"`, e as que chegam como texto ordenam pelo número com `calculateSortValue`. Em grades que exportam, aplique formatação só de tela (ex.: caixa de frase) com `cellTemplate`/`groupCellTemplate`, não com `customizeText`, que também vai para o arquivo. O TreeList (`dxTreeList`) não é coberto pelo adaptador: prefira uma `.cm-table` com recuo pelo nível. Não repita no CSS do projeto o que o adaptador já cobre: ajuste de grade que valha para todas as aplicações volta ao kit. Prefira temas *compact*. Não carregue Roboto/Inter do tema (inclusive `@import` do Google Fonts dentro de CSS gerado pelo ThemeBuilder). Gráficos (`dxChart`, `dxPieChart` etc.) escrevem a fonte como estilo inline no SVG, a partir do tema de visualização, e o adaptador não os alcança: registre um tema de visualização com `font.family` igual a `--cm-font` (`registerTheme`/`currentTheme` de `devextreme/viz/themes`) e confira no navegador (exemplo abaixo). Com diálogos do kit ou do Bootstrap, suba a camada dos popups do DevExtreme (abaixo). |

Em qualquer biblioteca de terceiros, a fonte vai em `:root`/`body` e nas classes raiz dos componentes, nunca só num contêiner da página, porque calendários, listas suspensas e diálogos são renderizados fora dele.

### DevExtreme: camada dos popups e tema dos gráficos

Duas configurações em JavaScript, uma vez, ao iniciar a aplicação (o CSS não as alcança):

```js
// Popups (lista suspensa, calendário, dica) abertos dentro de um diálogo: o padrão do DevExtreme (1500) fica atrás
// de --cm-layer-modal (1900); 1950 fica acima do diálogo e abaixo das notificações (--cm-layer-toast, 2000).
DevExpress.ui.dxOverlay.baseZIndex(1950);

// Gráficos: a fonte vai inline no SVG, pelo tema de visualização. Um tema claro e um escuro com a fonte do kit,
// escolhidos pelo data-theme do <html> ao criar o gráfico e trocados junto com o tema da aplicação.
var fonte = getComputedStyle(document.documentElement).getPropertyValue('--cm-font').trim();
DevExpress.viz.registerTheme({name: 'colibri.light', font: {family: fonte}}, 'generic.light');
DevExpress.viz.registerTheme({name: 'colibri.dark', font: {family: fonte}}, 'generic.dark');
DevExpress.viz.currentTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'colibri.dark' : 'colibri.light');
// Na alternância de tema: DevExpress.viz.currentTheme('colibri.dark' ou 'colibri.light') e DevExpress.viz.refreshTheme().
```

Em módulos (React etc.), `baseZIndex` vem de `devextreme/ui/overlay` e `registerTheme`/`currentTheme` de `devextreme/viz/themes`. Séries com identidade própria recebem a paleta `--cm-chart-*` (`palette` do gráfico), na ordem.

### Notificações com pnotify (Bootstrap 3)

O adaptador veste o pnotify 1.2 (`pnotify-colibri`, estilo `bootstrap`) como as notificações do kit, trocando os glyphicons pelos Bootstrap Icons conforme o tipo. Posição e largura são estilo inline do pnotify, que o CSS não alcança: configure no serviço que dispara as notificações, uma vez, com a pilha compartilhada entre elas:

```js
var pilha = {dir1: 'down', dir2: 'left', push: 'bottom', firstpos1: 64, firstpos2: 16, spacing1: 8, spacing2: 8};
$.pnotify({
    title: titulo, text: mensagem, type: tipo,  // 'success', 'info', 'notice' (aviso) ou 'error'
    width: 'min(calc(100vw - 32px), 380px)',
    stack: pilha, sticker: false, shadow: false, history: false
});
```

`firstpos1: 64` põe a primeira notificação logo abaixo da barra superior de 56 px. Com o PNotify 5 (`@pnotify/core` com os módulos `bootstrap3` e ícones `bootstrap3`), o adaptador veste `.pnotify` da mesma forma. A pilha padrão do PNotify 5 abre no topo da janela, por cima da barra superior, com 360 px: ajuste-a uma vez, ao registrar os módulos (mantém o `maxOpen` da pilha padrão, uma notificação por vez):

```js
Object.assign(PNotify.defaultStack, {firstpos1: 64, firstpos2: 16, spacing1: 8, spacing2: 8});
PNotify.defaults.width = 'min(calc(100vw - 32px), 380px)';
``` Se o serviço passar um ícone próprio (`icon: 'bi bi-…'`), dê também uma classe por tipo (`addclass`) e pinte o ícone pelo token do estado no CSS do projeto.

## Avalonia (aplicação desktop .NET)

Aplicação desktop Avalonia com o perfil Admin (ex.: `Plugins.Manager.Config`). Conferido no Avalonia 12.1.6 com o `Avalonia.Controls.DataGrid` 12.1.2; em outra versão, meça de novo (abaixo), porque os nomes de parte e os valores do tema Fluent mudam. As regras são as mesmas do `DESIGN.md`; muda só a implementação. 1 px do kit é 1 DIP do Avalonia (a escala do Windows multiplica os dois do mesmo jeito).

**Onde fica a implementação.** No tema `CoLib.Ui.Avalonia` do submódulo `_lib` (dotnet-lib), não no projeto: `Tema/Tokens.axaml` (tokens claro e escuro em `ThemeDictionaries`, fontes embutidas, medidas), `Tema/TemaColibri.axaml` (janela, tipografia, botões, campos, lateral, barra superior, ação de linha) e `Tema/TemaColibri.DataGrid.axaml` (grade como tabela). Ajuste de componente que vale para todas as aplicações vai para o tema da `_lib`, por PR no dotnet-lib, e a regra correspondente volta a esta skill. No `App.axaml` do projeto ficam só os estilos próprios dele. Nada é copiado de `assets/kit/` para o projeto: o `DESIGN.md` e o `PRODUCT.md` continuam na raiz.

**Ordem dos estilos** (`App.axaml`, `RequestedThemeVariant="Default"` para seguir o Windows):

```xml
<Application.Styles>
    <FluentTheme />
    <StyleInclude Source="avares://Avalonia.Controls.DataGrid/Themes/Fluent.xaml" />
    <StyleInclude Source="avares://CoLib.Ui.Avalonia/Tema/TemaColibri.axaml" />
    <StyleInclude Source="avares://CoLib.Ui.Avalonia/Tema/TemaColibri.DataGrid.axaml" />
</Application.Styles>
```

O tema Colibri vem depois do Fluent. Precedência, conferida na medição:

- Um `Style` de `Application.Styles` vence o setter simples de `ControlTheme`, por isso os ajustes de componente usam seletor de parte do template (`/template/ ContentPresenter#PART_ContentPresenter`, `/template/ Rectangle#BackgroundRectangle`).
- Ele **não** vence o estilo do tema com pseudo-classe (`^:focus`, `^:current`, `^:selected`) se o seletor daqui não repetir a pseudo-classe: escreva `DataGridCell:focus /template/ Grid#FocusVisual`, não `DataGridCell /template/ Grid#FocusVisual`.
- Ele também não vence um valor escrito no próprio template (ex.: `Fill` do `PART_ColumnHeadersAndRowsSeparator`): aí, troque o recurso do Fluent em `Styles.Resources`, com a cor do token por `DynamicResource` (`<SolidColorBrush x:Key="DataGridGridLinesBrush" Color="{DynamicResource CmLineColor}" />`).

Confira cada ajuste na medição; compilar não prova que o estilo pegou. Cor só por `{DynamicResource Cm…Brush}`, para acompanhar o tema escuro; `StaticResource` só nos pincéis iguais nos dois temas (lateral, `CmActionBorderBrush`).

**Classes equivalentes** (lista completa no cabeçalho de `TemaColibri.axaml`):

| Kit | Avalonia |
|---|---|
| `.cm-btn--primary`, `.cm-btn--danger-text` | `Button.primario`, `Button.perigo` |
| `.cm-icon-btn`, `.cm-icon-btn--danger` | `Button.acao-linha`, `Button.acao-linha.perigo` (30 × 30, sem moldura; `ToolTip.Tip` e `AutomationProperties.Name` obrigatórios) |
| `.cm-panel` | `Border.superficie` (a grade fica dentro, com `ClipToBounds="True"`) |
| `.cm-topbar`, `.cm-topbar__title`, `.cm-topbar__menu` | `Border.barra-superior`, `TextBlock.titulo-pagina`, `Button.barra-menu` |
| `.cm-sidebar`, `__head`, `__brand`, `__collapse`, `.cm-nav`, `.cm-nav__link` (`.is-active`), `.cm-nav__section`, `__section-toggle`, `.cm-sidebar__foot` | `Border.lateral`, `Border.lateral-cabeca`, `TextBlock.lateral-marca`, `Button.lateral-recolher`, `StackPanel.lateral-nav`, `Button.lateral` (`.selecionado`), `Border.lateral-secao`, `TextBlock.lateral-grupo`, `Border.lateral-rodape` |
| `.cm-field__label`, `.cm-mono` | `TextBlock.rotulo`, `TextBlock.dado` |
| `.bi` | `TextBlock.icone` com o código do glifo (`Text="&#xF503;"`; o código está em `icons/bootstrap-icons.min.css` do kit) |

**Lateral.** Monte com a estrutura do comentário de `TemaColibri.axaml`: `Border.lateral` encaixado à esquerda de um `DockPanel`, com `MinWidth` 230 (nunca `Width`, para crescer até o rótulo mais longo); cabeçalho com o nome do produto e o botão de recolher à direita; itens com ícone e rótulo; versão completa no rodapé. Recolher esconde a lateral inteira (`IsVisible`) e mostra o `Button.barra-menu` à esquerda do título na barra superior. **Não use `SplitView` com `CompactInline`**: o trilho de ícones de 48 px não existe no kit, e o `SplitView` fixa a largura do painel.

**Grade (`DataGrid`), pela regra da grade como tabela.** `TemaColibri.DataGrid.axaml` já cobre o que o tema Fluent do DataGrid faz fora do kit; não repita no projeto:

- O tema Fluent põe `FontSize="15"` no `DataGridCell`, e isso vence o 13 herdado do `DataGrid`: **definir `FontSize` no `DataGrid` não muda o texto das linhas**. O tema da `_lib` fixa 13 na célula.
- Texto da célula com margem `12,0,12,0` (24 entre colunas) e cabeçalho com recuo 12: o tema da `_lib` leva a 16 na primeira coluna (`:nth-child(1)`) e a 16 entre colunas. Na última coluna o recuo direito fica em 8 (o kit pede 12), por falta de seletor confiável da última coluna.
- Seleção em `SystemAccentColor` com opacidade 0,6 por `StaticResource` (trocar o pincel não basta): o tema da `_lib` põe `action-soft` opaco no `BackgroundRectangle` da linha, e o hover em `hover`.
- Separador vertical e hover cinza no cabeçalho, separador entre cabeçalho e linhas em preto a 40%, retângulo de foco de 2 px preto/branco e marcador de célula atual: desligados ou trocados por `line`. O foco aparece como contorno `focus` de 2 px na linha selecionada com a grade em `:focus` (a grade não recebe `:focus-visible` ao andar pelas setas depois de um clique). Numa grade editável, sem a marca da célula atual, não foi conferido: meça antes de usar.
- Na página: `GridLinesVisibility="Horizontal"`, `HeadersVisibility="Column"`, sem `AlternatingRowBackground`. Colunas com `CellStyleClasses="dado"` em versão, data, hora, contagem e código (mono 12/500), `"numero"` nas numéricas (valor à direita, título com `<TextBlock TextAlignment="Right"/>` no `Header`) e `"acao"` na coluna de `Button.acao-linha`.
- **Limitação conhecida:** o cabeçalho do DataGrid reserva à direita uma coluna de 32 para a seta de ordenação, então o título de uma coluna numérica termina 24 antes do valor, e a seta não passa para a esquerda do rótulo como no `.cm-sort.cm-cell--end`. Até o tema da `_lib` trazer um modelo de cabeçalho próprio, aceite e não compense com margem negativa.

**Armadilhas do XAML.**

- Comentário XML não aceita dois hífens seguidos: não escreva `.cm-btn--primary` nem `--cm-*` dentro de `<!-- -->` (erro `AVLN1001` no build); escreva `cm-btn + primary`.
- O Fluent encolhe o botão pressionado para 98%: o tema da `_lib` desliga isso (`RenderTransform` nulo), porque o retorno por escala é do perfil Operação.
- Foco na lateral em branco a 75%, não no azul-claro do resto da janela, que some no degradê.

**Medir sem o ambiente real.** A aplicação costuma depender de banco e licença para abrir. Para conferir a grade e a lateral, monte um projeto descartável (fora do repositório) que referencia o projeto da aplicação, `Avalonia.Headless` e `Avalonia.Skia` na versão do Avalonia dela e `NSubstitute`, cria os ViewModels com dublês (como nos testes), abre a janela real e captura:

```csharp
AppBuilder.Configure<App>().UseSkia()
    .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false })
    .SetupWithoutStarting();
Application.Current!.RequestedThemeVariant = ThemeVariant.Dark; // e Light
var janela = new JanelaPrincipal(viewModel);
janela.Show();
Dispatcher.UIThread.RunJobs(); AvaloniaHeadlessPlatform.ForceRenderTimerTick();
janela.CaptureRenderedFrame()!.Save("tela.png");
```

Com WinForms no projeto, remova os usings implícitos (`<Using Remove="System.Windows.Forms" />` e `System.Drawing`), que colidem com `Button`, `Point` e `DataGrid` do Avalonia. Meça pela árvore visual (`GetVisualDescendants()`): cabeçalho 36, `DataGridRow` 37 (36 + divisor), `DataGridCell.FontSize` 13 com a família Google Sans Flex, texto da primeira coluna em x = 16, `BackgroundRectangle` da linha selecionada em `action-soft` com opacidade 1, `Button.lateral` com 37 de altura e x = 16 na lateral. Exercite também a interação, porque é nela que o tema Fluent volta: clique numa célula (`janela.MouseDown`/`MouseUp`), seta para baixo (`janela.KeyPress`) e passe o mouse numa linha (`janela.MouseMove`); confira `FocusVisual` e `CurrencyVisual` invisíveis na célula com `:focus`/`:current`, o `Fill` do `PART_ColumnHeadersAndRowsSeparator` em `line`, o contorno `focus` na linha selecionada e o hover em `hover`. Confira as capturas nos dois temas e com a lateral recolhida.

**Fora do alcance no desktop.** Itens só de navegador ficam n/a: link "Pular para o conteúdo", `data-theme`, `prefers-reduced-motion` em CSS, 320 px, ícone da aba e a lateral sobre o conteúdo até 920 px. No lugar dessas larguras, confira a janela na largura mínima dela (`MinWidth`), com a lateral aberta e recolhida: nada cortado nem sobreposto, e só a grade rola por dentro.

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
- **Chave liga/desliga** (`.cm-switch`, regra em `DESIGN.md`, "Formulários"): o CSS desenha a chave sobre o `input[type="checkbox"]`; o projeto põe `role="switch"`, dá o nome do que ela liga ao leitor de tela (`aria-label` ou `aria-labelledby` apontando para o rótulo do campo, o título da linha ou o cabeçalho da coluna) e troca o texto ao lado com o estado ("Sim"/"Não", ou o par do contexto). O texto ao lado leva `aria-hidden="true"`: o estado já é anunciado pelo `role="switch"`, e repetir "Sim" no nome confunde. A chave vale ao salvar, como os outros campos do grupo. JavaScript puro: o trecho "Chave liga/desliga" do `exemplo.html` (`data-on`/`data-off`). Em React, um componente só para o projeto todo (referência, do Colibri Totem):

  ```tsx
  export function Switch({ checked, onChange, ariaLabel, on = 'Sim', off = 'Não', disabled }: {
    checked: boolean
    onChange: (next: boolean) => void
    ariaLabel: string
    on?: ReactNode
    off?: ReactNode
    disabled?: boolean
  }) {
    return (
      <label className="cm-switch">
        <input type="checkbox" role="switch" aria-label={ariaLabel} checked={checked}
          disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span aria-hidden="true">{checked ? on : off}</span>
      </label>
    )
  }
  ```

  Num formulário, o mesmo componente vai dentro de um `.cm-field`, com o rótulo do campo (`<span class="cm-field__label" id>`) apontado pelo `aria-labelledby` da chave e a dica em `.cm-field__hint` (`aria-describedby`); o dependente leva `.cm-field--nested` e `disabled`. No Colibri Totem, `SwitchField`.

  Em Vue, Angular ou Blazor, a mesma marcação com o texto ligado ao estado (`v-model`, `[(ngModel)]`, `@bind`). Com biblioteca de componentes, não use a chave dela (`dxSwitch`, `MatSlideToggle`, `MuiSwitch`, `DxCheckBox` em modo chave): o visual, a ausência do texto ao lado e a cor de destaque são do tema dela; use a marcação do kit.
- **Estados de componente:** `.is-active`, `.is-open`, `.is-disabled`, `.is-invalid`, `.is-hidden` são aplicados pelo código do projeto.
- **Diálogos empilhados no Bootstrap 3** (ex.: seletor de imagens aberto sobre um diálogo de edição, ou o diálogo de carregamento sobre outro): todos os modais têm a mesma camada (`--cm-layer-modal`), então o último no DOM fica por cima; declare o de cima depois do de baixo. Ao fechar qualquer modal, o Bootstrap 3 tira `modal-open` do `<body>` e o diálogo que ficou aberto perde a rolagem: devolva a classe num handler global, testando o estado do próprio Bootstrap (um modal pode ficar com a classe `in` já escondido):

  ```js
  $(document).on('hidden.bs.modal', '.modal', function () {
      var aberto = $('.modal').filter(function () {
          var modal = $(this).data('bs.modal');
          return modal && modal.isShown;
      }).length > 0;
      if (aberto) { $('body').addClass('modal-open'); }
  });
  ```

## Perfil Operação (tablet, totem, KDS, pedidos prontos)

Regras em `DESIGN.md` do kit, seção 9; marcação em `../assets/kit/exemplo-toque.html` (sirva a pasta por um servidor local para o seletor de esquema funcionar: módulos ES não carregam em `file://`).

- **Carga:** `icons/bootstrap-icons.min.css` → `colibri-touch.css` (traz a base por `@import`). Num app com admin e telas de toque no mesmo bundle (ex.: React + Vite com rotas `/admin` e `/tablet`), importe `colibri-ui.css` só no código do admin e `colibri-touch.css` só no das telas de toque, para um não vazar no outro.
- **Perfil Produção (card de produção do KDS):** `colibri-producao.css` depois do `colibri-touch.css`, e o modo da estação na raiz da grade (`.cp-modo-toque` ou `.cp-modo-bump`). A grade empilha os cards em JavaScript (coluna mais baixa, na ordem da fila, posições recalculadas só quando um pedido entra ou sai; `DESIGN.md`, seção 10, "Grade"), com as colunas efetivas `min(colunas do admin, Math.floor((largura útil + gap) / (280 × zoom + gap)))`, recalculadas no `resize` (a regra das colunas pela largura do card; o CSS de `.ct-orders` faz o mesmo como rede de proteção, mas não sabe empilhar); o admin oferece 2, 3, 4 e 5 colunas, com a dica "Em telas menores, a estação usa menos colunas para o card não ficar estreito."; o toque longo do botão de estado usa `pointerdown`/`pointerup` com um limiar (ex.: 500 ms) e cancela o toque comum quando dispara; a bump bar segue a regra dos dois níveis (seção 10).
- **Perfil Cards (painéis de chamado):** `colibri-cards.css` depois do `colibri-touch.css`, com `.cc-painel` na raiz do painel (mais `.cc-painel--tv` na TV e `.cc-painel--cliente` no painel de senhas) e `.cc-grade` na grade (com colunas escolhidas pelo lojista, de 3 a 6, também `.cc-grade--cols` e `--cc-cols` no estilo da grade); o título, a contagem, a data, a hora e as ações do painel vão no `.cc-cabecalho`. A cor de cada estado vai no painel por variável: da paleta pelo nome (`--cc-espera: var(--cm-palette-petroleo)`) ou hex livre do lojista, e com hex livre o componente grava junto a tinta e o véu calculados pelo motor (`--cc-tinta-espera: tintaSobre(cor)`, `--cc-veu-espera: veuSobre(cor)`; no atraso, também `--cc-atraso-respiro: respiroDe(cor)`), nunca a tinta escolhida pelo lojista. O estado do card é a classe (`.cc-sinal--atencao`, `.cc-sinal--atraso`), trocada pelo componente quando o tempo passa dos limites configurados, com a faixa `.cc-urgencia` sempre presente (vazia no prazo); num kanban colunado com estados próprios, o componente grava `--cc-cor`, `--cc-tinta` e `--cc-veu` no card, `.cc-urgencia--ativa` na faixa preenchida e `.cc-sinal--respira` (com `--cc-respiro`) só no estado mais grave. Cor própria de fundo: `derivarEsquema({ ambiente: cor, ... })` aplicado ao painel com `aplicarEsquema`, e o piso em `--cc-piso: var(--ct-bg)`. O que não cabe vira um `.cc-mais` "+N chamados", calculado pelo componente (`DESIGN.md`, seção 11).
- **Contêiner:** `<div class="ct-app ct-app--tablet ct-app--kiosk">` (ou `--totem`, `--kds`, `--tv`) na raiz da tela. A altura total (`html`, `body`, raiz do app com `height: 100%`) fica com o projeto.
- **Alvo de build Chrome 101:** com Vite, `css: { transformer: 'lightningcss', lightningcss: { targets: { chrome: 101 << 16 } } }`, `build: { cssMinify: 'lightningcss', cssTarget: 'chrome101', target: 'chrome101' }` (e `lightningcss` nas dependências de desenvolvimento). O `lightningcss` rebaixa `oklch()`, `lab()` e `color-mix()` estáticos para hex, mas **não** converte `:has()` nem as propriedades `scale`/`translate` separadas: as utilidades `scale-*`, `translate-*` e `active:scale-*` do Tailwind 4 geram essas propriedades e são descartadas no Chrome 101. Use as classes do kit (o retorno de toque já vem em `.ct-btn`, `.ct-icon-btn`, `.ct-qty__btn`) ou `transform` escrito no CSS do projeto.
- **Tailwind 4:** só utilitários de layout (`flex`, `grid`, `gap-*`, `p-*`, `w-*`); nenhuma classe de cor da paleta (`bg-*`, `text-*`, `border-*`, `ring-*` com cor) nem `shadow-*` com cor. A cor vem das classes `ct-` ou de `var(--ct-*)`. O CSS do kit não está em `@layer` e vence o preflight e as utilidades do Tailwind.
- **Esquema por canal (telas de consumidor):** o backend grava as sementes do canal (`{ "schema": "colibri-esquema/1", "canal": "totem", "ambiente": "#…", "acao": "#…", "marca": null }`) e as entrega ao app com a configuração. No app:

  ```js
  import { derivarEsquema, aplicarEsquema } from './colibri-ui/colibri-esquema.js';

  const esquema = derivarEsquema(config.esquema);   // tokens --ct-* em hex, modo e ajustes
  aplicarEsquema(esquema);                          // <html>: tokens + data-theme
  try { localStorage.setItem('ct-esquema', JSON.stringify({ modo: esquema.modo, tokens: esquema.tokens })); } catch (e) {}
  ```

  No `<head>` da entrada HTML, antes do bundle, aplique o último esquema gravado sem recalcular (o motor não carrega antes do bundle):

  ```html
  <script>
    try {
      var e = JSON.parse(localStorage.getItem('ct-esquema'));
      if (e) { var r = document.documentElement; r.setAttribute('data-theme', e.modo);
        for (var k in e.tokens) r.style.setProperty(k, e.tokens[k]); }
    } catch (x) {}
  </script>
  ```

  Mudança de esquema no admin chega ao app como a do tema do KDS hoje (evento em tempo real ou recarga da configuração) e é reaplicada com `aplicarEsquema`. Splash, barra de status do Android e janela do Electron usam a cor de `--ct-bg` do esquema gravado quando o plugin permitir; senão, a cor padrão do produto, registrada em `DECISOES.md`.
- **Claro ou escuro escolhido pelo cliente** (opcional, por canal): `derivarEsquema(sementes, 'light' | 'dark')` força o modo; sem o segundo argumento, ele sai da luminância do Ambiente. O contraste continua garantido, inclusive com o modo contra o Ambiente (claro sobre um Ambiente escuro). Com o Ambiente padrão, troque-o pelo plano do outro tema antes de derivar (`#0b1822` ↔ `#f2f5f9`), para o resultado ser o tema Colibri do modo escolhido, e não o petróleo clareado; Ambiente próprio do lojista não muda. Grave a escolha do cliente no aparelho e reaplique-a no script de pré-pintura junto com o esquema.
- **Prévia no admin:** três campos de cor (Ambiente, Ação, Marca opcional) e uma prévia da tela num contêiner, com `aplicarEsquema(derivarEsquema(sementes), contêiner)`. Mostre a lista `esquema.ajustes` ("a cor de ação foi escurecida para manter a leitura") e a cor efetiva ao lado da escolhida. Nada de campo por token nem de aviso de contraste: o motor já garante.
- **Migração de tema existente** (ex.: o totem com oito cores): a semente Ambiente vem do fundo gravado e a Ação, do destaque; superfícies, linhas e textos passam a ser derivados (valores gravados que divergem se perdem; mostre antes e depois ao lojista); campos sem uso saem. Registre em `DECISOES.md`.
- **KDS:** tema Colibri (`data-theme` por configuração global ou da estação), sem esquema. Tipo de pedido no modificador do cartão (`.ct-order--mesa`) ou, configurado, `style="--ct-order-color: var(--ct-palette-azul)"`: o admin oferece só as oito cores da paleta, gravadas pelo nome (`azul`), não pelo hex. Urgência: `.ct-order--attention` e `.ct-order--late` com a faixa `.ct-order__urgency` (ícone e rótulo), calculadas pelos limites configurados.
- **Comportamentos:** folha (`.ct-sheet`) com véu (`.ct-backdrop`) que fecha ao toque, Esc quando houver teclado e foco devolvido a quem abriu; `.ct-toast` some sozinho (1,6 s), com `.is-closing` antes de sair;
- **Saída das camadas** (folha, painel lateral, diálogo centralizado, tela cheia dividida): ao fechar, ponha `.is-closing` no contêiner que recebe o `hidden` (ou que sai do DOM) e só esconda no `animationend` de um filho direto, com um limite de 300 ms caso nenhuma animação rode; reabrir tira a classe (e a entrada recomeça do início: o `@keyframes`, única opção no Chrome 101, não continua de onde a saída parou). Véu e folha ficam juntos dentro desse contêiner (num fragmento sem pai, envolva os dois num `div`, que recebe `.is-closing` e `hidden`); a confirmação curta recebe a classe nela mesma (`.ct-toast.is-closing`). Em React, Vue ou Blazor, mantenha a camada montada até esse momento (estado "fechando" entre aberto e fechado), em vez de desmontá-la no clique. Com movimento reduzido, a saída dura 1 ms e o mesmo código serve. Marcação e função de referência: `abrir` e `fechar` em `exemplo-toque.html`; quantidade anunciada (`aria-live`); totem e tablet voltam à tela de descanso por inatividade com aviso antes ("Ainda está aí?") e opção de continuar.

## Acabamento de vidro (tablet, totem e vitrine web)

Regras na seção 9 do `DESIGN.md` ("Acabamento de vidro"); marcação nas demonstrações (`#tablet-vidro`, `#loja-vidro-escuro`).

- **Configuração do canal:** vidro ligado ou não; fundo (marca escura, marca clara ou imagem); vidro Automático, Claro ou Escuro; modo econômico por modelo de aparelho.
- **Fundo da marca:** ponha `ct-app--vidro ct-app--vidro-escuro` (ou `-claro`) no contêiner `.ct-app`. Sem esquema de canal, os tokens do CSS bastam; com esquema, grave no contêiner os tokens de `derivarVidro('marca-escura', esquema)` (a ação e a marca do canal ajustadas para o vidro) e passe `vidro.tema` a `derivarEsquema`.
- **Imagem do lojista, no admin, no envio:** desenhe a imagem num `canvas` do tamanho de cada tela-alvo (celular, tablet, totem), com `ctx.filter = 'blur(16px) saturate(1.8) brightness(1.08)'`; leia uma grade de pixels (a cada 6 a 8 px) e passe as cores em hex a `derivarVidro(amostras, esquema, { modo })`; para o modo econômico, a mesma leitura sem o filtro e `{ economico: true }`. Grave a classe e os tokens com o canal e aplique-os no app sem recalcular, como o esquema. Mostre a prévia com o texto por cima.
- **Desfoque:** `backdrop-filter` com o prefixo `-webkit-` (Safari); já está no CSS do kit. Não anime o vidro nem o fundo.
- **Fundo fixo:** o fundo é um `::before` com `position: fixed`; não ponha `transform`, `filter` ou `will-change` no `.ct-app`, que prenderiam o fundo dentro dele.

## Vitrine web (Colibri Delivery, Next.js)

A vitrine é o perfil Operação na superfície `.ct-app--web` (seção 9 do `DESIGN.md`, "Vitrine web"), com a marcação de `exemplo-web.html`. O kit entrega CSS, marcação e regras; a aplicação faz as rotas, os dados e a finalização.

- **Carga:** `colibri-touch.css` (e `colibri-base.css` ao lado), fontes e ícones servidos pela própria aplicação, em `public/colibri-ui/`, importados no layout raiz. `colibri-esquema.js` com o esquema do canal "delivery": grave os tokens derivados com a configuração da loja e aplique-os no HTML gerado no servidor (atributo `style` e `data-theme` no `<html>`), para a página não piscar o tema padrão.
- **Viewport:** `export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }` no layout raiz. Sem `maximumScale` nem `userScalable: false`: o zoom do navegador é do cliente.
- **Cardápio gerado no servidor:** a página da loja é um componente de servidor, com o cardápio vindo da API em geração estática com revalidação (`revalidate`) ou na hora da requisição. A primeira tela chega pronta, sem esperar JavaScript; só a sacola, a busca e a marcação da aba atual são componentes de cliente.
- **Produto com endereço próprio:** a rota `app/[loja]/produto/[id]/page.tsx` é a página (link direto, compartilhamento, celular). No computador, o clique no cardápio abre o mesmo conteúdo em modal com rota interceptada: slot paralelo `@modal` com `app/[loja]/@modal/(.)produto/[id]/page.tsx` renderizando `.ct-sheet.ct-sheet--center.ct-produto-modal` sobre o `.ct-backdrop`. Escolha página ou modal pela largura (a partir de 1024 px, modal); o Voltar do navegador fecha o modal (`router.back()`).
- **Prévia do link** (WhatsApp, redes): `generateMetadata` por loja (nome, cidade, capa) e por produto (nome, preço, foto), com `openGraph.images` em 1200×630.
- **Imagens:** `next/image` para capa, logo e fotos, com `sizes` pela largura de cada uso (item: 104 px; mini card: um terço da tela; produto: largura da tela ou 560 px) e `priority` só na capa. Sem foto, o ícone do kit no lugar, nunca uma imagem genérica.
- **Abas presas:** marque a aba da seção à vista com um `IntersectionObserver` nas `.ct-secao` (troque `.is-active` e `aria-current`); o clique na aba rola até a seção, que já tem `scroll-margin-top` para não ficar sob o topo preso.
- **Saída das camadas:** o modal do produto segue o padrão `.is-closing` do perfil (seção "Perfil Operação", acima), mantido montado até o `animationend`.
- **Sacola:** estado no cliente, guardado no aparelho; a barra só aparece com itens; remover a última unidade mostra a notificação com "Desfazer"; Editar reabre o produto com as escolhas.
- **Finalização:** pedido como convidado, com o login opcional; o CEP pedido cedo só para taxa e prazo; nenhum pedido para instalar um app.

## Página inicial

Somente o contêiner da página inicial recebe `cm-page--home` (`<div class="cm-page cm-page--home">`). Se a marca rolar junto com a página ou sumir, procure `transform`, `filter` ou `contain` em algum ancestral de `.cm-page`.

## Refatoração página a página

Depois do shell, refatore uma página por vez com o verbo `refatorar <página>` ([`./refatorar.md`](./refatorar.md)), começando pela mais usada ou pela pior colocada no ranking da `aderencia`. Ele mede a página, pede ao impeccable a refatoração já enquadrada no kit, confere o alinhamento em 1440, 1920, ~900 e 320 px e marca a página em `docs/design/DECISOES.md`.
