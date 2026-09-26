# Adoção por framework

Complementa o passo 3 do `SKILL.md`. A marcação de cada componente está em `../assets/kit/exemplo.html` (`#historico` abre o painel lateral; `#inicio` mostra a marca-d'água).

## Ordem de carga (todos os frameworks)

1. CSS do framework e tema da biblioteca de componentes, se houver.
2. `icons/bootstrap-icons.min.css` (ou o CSS do pacote npm `bootstrap-icons`).
3. `colibri-ui.css`.
4. Adaptadores, se usados: `colibri-ui.bootstrap3.css` e/ou `colibri-ui.devexpress.css`.

`fonts/` e `logos/` ficam ao lado de `colibri-ui.css` (`url('fonts/…')` e `url('logos/…')` são relativos ao CSS). Se um bundler reescrever caminhos, confira que as WOFF2 e o SVG são emitidos e resolvem. Nada de fontes ou ícones por CDN: tudo precisa funcionar sem internet.

## Por framework

| Stack | Como aplicar |
|---|---|
| Bootstrap 3 / AngularJS | `colibri-ui.css` + `colibri-ui.bootstrap3.css` (cobre `.btn`, `.modal`, `.form-control`, `.form-group`, `.input-group-addon`, `.has-error`, `.checkbox`/`.radio`, angular-growl, Dropzone, `ng-cloak`). Menus: `.cm-menu` junto com `.dropdown-menu`. Diretivas/templates do projeto passam a emitir as classes `cm-`. |
| Bootstrap 4/5, React, Vue, Blazor sem biblioteca | Não use o adaptador Bootstrap 3. Implemente os componentes com as classes `cm-` ou transponha os tokens `--cm-*` para o tema do framework (ex.: variáveis `--bs-*`), usando o adaptador só como referência. |
| DevExpress Blazor | `colibri-ui.devexpress.css` depois do tema. Temas Fluent: variáveis `--dxds-font-family-*`; clássicos/Bootstrap externo: `--bs-*`. Escolha o `SizeMode` mais próximo da escala (13 px, controle de 32 px) e ajuste o resto por `--dxds-font-size-*`. Classes internas (`--dxbl-*`, `.dxbl-*`) só sem alternativa, com o motivo em `DECISOES.md`. |
| DevExtreme (React, Angular, Vue, jQuery) | `colibri-ui.devexpress.css` fixa a fonte em `.dx-widget` e `.dx-overlay-wrapper` (popups anexados ao `<body>`). Prefira temas *compact*. Não carregue Roboto/Inter do tema. |

Em qualquer biblioteca de terceiros, a fonte vai em `:root`/`body` e nas classes raiz dos componentes, nunca só num contêiner da página, porque calendários, listas suspensas e diálogos são renderizados fora dele.

## Comportamentos que o projeto precisa implementar

O CSS do kit só entrega o visual; reimplemente no framework do projeto (o `exemplo.html` traz uma versão mínima em JavaScript puro):

- **Lateral:** acima de 920 px, o botão alterna `.cm-shell--collapsed`; até 920 px, alterna `.cm-shell--overlay-open` (abre sobre o conteúdo com `.cm-shell__backdrop`). Esc fecha, o foco entra no menu ao abrir e volta ao botão ao fechar; clicar no fundo fecha.
- **Grupos da lateral** (`.cm-nav__section`): recolher/expandir com `aria-expanded`.
- **Menus suspensos** (`.cm-menu`): abrir/fechar, Esc, clique fora e retorno de foco.
- **Painel lateral** (`.cm-drawer`): `.is-open`; Esc fecha e devolve o foco a quem abriu.
- **Diálogos:** Tab circula dentro, Enter aciona o botão padrão, Esc cancela. O botão padrão é sempre o principal, inclusive em exclusões (regra em `DESIGN.md`, "Camadas"):
  - Com campos: o conteúdo é um `<form>` com envio pelo Enter (botão `type="submit"` oculto ou o próprio principal como `submit`) e `autofocus` no primeiro campo.
  - Sem campos (confirmações): o principal recebe o foco ao abrir (`autofocus`/`autoFocus` no botão; em MUI, a prop `autoFocus` do `Button` dentro do `Dialog`; em Bootstrap 3, `shown.bs.modal` → `.focus()`; em DevExpress Blazor, `FocusAsync` no `DxButton` após abrir).
  - Se o componente de diálogo for compartilhado entre sistemas, não troque o padrão dele: passe o foco a partir de cada tela.
- **Foco dos botões com biblioteca de componentes:** o contorno interno do kit (`outline-offset: -3px`, focado com `z-index: 3`, contorno claro no principal) precisa valer também nos botões da biblioteca. Em MUI com `StyledEngineProvider injectFirst`, o CSS do Emotion é injetado antes do kit e perde para a regra global `:is(a, button, [tabindex]):focus-visible` (mesma especificidade): escreva o ajuste em CSS carregado depois do kit (`.MuiButton-root.Mui-focusVisible`, `.MuiButton-contained.Mui-focusVisible`, `.MuiDialogActions-root > .MuiButton-root.Mui-focusVisible`, `.MuiButtonGroup-root .MuiButton-root.Mui-focusVisible`), não só no tema.
- **Estados de componente:** `.is-active`, `.is-open`, `.is-disabled`, `.is-invalid`, `.is-hidden` são aplicados pelo código do projeto.

## Página inicial

Somente o contêiner da página inicial recebe `cm-page--home` (`<div class="cm-page cm-page--home">`). Se a marca rolar junto com a página ou sumir, procure `transform`, `filter` ou `contain` em algum ancestral de `.cm-page`.

## Refatoração página a página

Depois do shell, refatore uma página por vez seguindo a anatomia de página do `DESIGN.md` (seção 5, `### Anatomia de página`), começando pela mais usada. Confira o alinhamento em 1440, 1920 e ~900 px antes de dar a página por concluída e atualize a lista de páginas em `docs/design/DECISOES.md`.
