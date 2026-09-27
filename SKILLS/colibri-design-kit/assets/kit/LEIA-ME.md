# Kit de design Colibri

Kit da linha visual comum das aplicações Colibri, para adotar em qualquer uma delas ou atualizar a versão já adotada.

## Conteúdo

| Arquivo | Para quê |
|---|---|
| `DESIGN.md` | Regras visuais da linha Colibri: cores, tipografia, estrutura da aplicação, anatomia de página e componentes. Copie para a raiz do repositório. |
| `PRODUCT.template.md` | Modelo de `PRODUCT.md` (usuários, propósito, contexto, compromissos da marca, princípios), no schema de produto do impeccable 4.x. Copie para a raiz como `PRODUCT.md` e preencha os trechos entre colchetes. |
| `colibri-ui.css` | Implementação de referência em CSS puro (prefixo `cm-`), sem dependência de framework. |
| `colibri-ui.bootstrap3.css` | Adaptador opcional para projetos com Bootstrap 3, AngularJS, angular-growl ou Dropzone. |
| `colibri-ui.devexpress.css` | Adaptador opcional de tipografia para DevExpress Blazor (temas Fluent, clássicos e Bootstrap externo) e DevExtreme (React etc.): leva a fonte do kit aos elementos internos e popups dos componentes. |
| `logos/` | `colibri-colorido.svg`, marca-d'água obrigatória da página inicial (`.cm-page--home`), e `colibri.ico`, ícone da aba de toda aplicação Colibri (16 a 256 px). |
| `exemplo.html` | Página de demonstração com a marcação de cada componente. Abra direto no navegador. `exemplo.html#historico` abre o painel lateral; `exemplo.html#inicio` mostra a marca-d'água da página inicial; `exemplo.html#escuro` abre no tema escuro (a alternância fica na barra superior). |
| `fonts/` | Google Sans Flex e Google Sans Mono (WOFF2), servidas localmente. |
| `icons/` | Bootstrap Icons 1.13.1 (fonte local). Em projetos com npm, prefira `npm install bootstrap-icons`. |

## Como adotar em um repositório

1. Copie `DESIGN.md` para a raiz e `PRODUCT.template.md` para a raiz como `PRODUCT.md`; preencha o `PRODUCT.md` e a seção 9 do `DESIGN.md` ("Implementação neste projeto").
2. Copie `colibri-ui.css`, `fonts/`, `logos/` e os ícones para a pasta de estáticos do projeto, mantendo `fonts/` e `logos/` ao lado do CSS (os caminhos são relativos).
3. Carregue na página, nesta ordem: CSS do framework e tema da biblioteca de componentes (se houver) → `bootstrap-icons.min.css` → `colibri-ui.css` → adaptadores: `colibri-ui.bootstrap3.css` (somente com Bootstrap 3/AngularJS) e/ou `colibri-ui.devexpress.css` (com DevExpress Blazor ou DevExtreme).
4. Monte o shell (lateral + barra superior) usando a marcação de `exemplo.html`, depois refatore página a página seguindo a seção 6 do `DESIGN.md`.
5. Na página inicial, acrescente `cm-page--home` ao contêiner (`<div class="cm-page cm-page--home">`) para exibir a marca-d'água do colibri. Somente nela.
6. Troque o ícone da aba por `logos/colibri.ico`: `<link rel="icon" href="…/colibri.ico">` na entrada HTML, servido de uma pasta pública do projeto, no lugar do ícone padrão do framework ou do antigo (seção 5 do `DESIGN.md`, "Ícone da aba").
7. Com Bootstrap 4/5, React, Blazor etc., não use o adaptador Bootstrap 3: implemente os componentes do framework com as classes `cm-` ou transponha os tokens `--cm-*` para o tema do framework, usando o adaptador apenas como referência.
8. Tema escuro: alternância na barra superior que grava `data-theme="dark"` ou `"light"` no `<html>`, seguindo `prefers-color-scheme` até a pessoa escolher (seção 2 do `DESIGN.md`, "Tema escuro"). Leve o modo também ao tema da biblioteca de componentes.
9. Com DevExpress/DevExtreme, confira que o calendário e o seletor de hora do controle de data/hora, listas suspensas, grades e dicas estão em Google Sans Flex (seção 3 do `DESIGN.md`, "Bibliotecas de componentes").

## Observações

- Tudo funciona sem internet; não troque fontes ou ícones por versões hospedadas em CDN.
- A lateral e a barra superior dependem de pequenos comportamentos em JavaScript (recolher, abrir sobre o conteúdo até 920 px, menus). `exemplo.html` traz uma versão mínima; reimplemente no framework do projeto com Esc para fechar e retorno de foco.
- Menus suspensos (`.cm-menu`) têm só o visual; abrir/fechar é responsabilidade do projeto (no Bootstrap 3, use `.dropdown-menu` junto).

## Versões

Mais recente no topo. Todos os arquivos do kit são mantidos à mão.

- **27/09/2026 (campos no diálogo):** correção: `.cm-dialog__body label` (margem inferior de 6 px, para rótulo solto) vencia `label.cm-field__label` por vir depois no CSS e, dentro de `.cm-field`, somava com o `gap`, deixando 12 px entre rótulo e controle. `.cm-dialog__body .cm-field__label` zera a margem; rótulo solto, `.cm-check` e `.cm-toggle` no diálogo não mudam (`colibri-ui.css`; regra em `DESIGN.md` seção 7, "Camadas"). Vinda do Colibri Market Place.
- **27/09/2026 (ícone da aba):** `logos/colibri.ico`, colibri branco sobre o degradê azul da lateral (16 a 256 px), passa a ser o ícone da aba de toda aplicação Colibri, igual nos dois temas (`DESIGN.md` seção 5, "Ícone da aba", e do/don't). `exemplo.html` usa o ícone. Vinda do Colibri Revendas.
- **26/09/2026 (tema escuro):** tema escuro em azul petróleo profundo, ligado por `data-theme="dark"` no `<html>`, com a lateral igual à do tema claro (`DESIGN.md` seção 2, "Tema escuro", e regra do tema por token; `colibri-ui.css`). Tokens novos, também no tema claro, no lugar das cores fixas do CSS e do adaptador Bootstrap 3 (sem mudança visual no claro): `--cm-accent-ink` (texto, link e ícone em azul; os preenchimentos seguem em `--cm-accent`), `--cm-topbar-bg`, `--cm-scroll-bg`, `--cm-disabled-ink`, `--cm-check-hover`, `--cm-import-line`, `--cm-import-hover`, `--cm-tag-filter-ring`, `--cm-shadow-menu`, `--cm-shadow-card`, `--cm-shadow-drawer`, `--cm-shadow-dialog` e `--cm-backdrop`. Barra superior com a alternância de tema antes do idioma (`DESIGN.md` seção 5); `exemplo.html` com a alternância e `#escuro`. Vinda do Colibri Market Place.
- **26/09/2026 (lateral):** a lateral cresce até o rótulo mais longo, em qualquer idioma; 230 px (`--cm-sidebar-w`) passa a ser o mínimo. Rótulos sempre completos e em uma linha, nunca reticências, quebra ou abreviação (`DESIGN.md` seção 5, `colibri-ui.css`). Correção: grupo recolhido com `hidden` não escondia a lista, porque o `display: flex` do kit anulava o atributo; agora a lista some sem mudar a largura. `exemplo.html` recolhe os grupos. Vinda do Colibri Revendas.
- **26/09/2026:** `PRODUCT.template.md` no schema de produto 1 do impeccable 4.x: sem `## Register`; personalidade e antirreferências em `## Brand Commitments`; princípios em `## Product Principles`; cenário de uso em `## Operating Context`; operação sem internet em `## Capabilities and Constraints`. Regras visuais sem mudança.
- **25/09/2026:** foco interno em todo botão (`outline-offset: -3px`), com o focado acima dos vizinhos e do principal em grupos e rodapés de diálogo, e contorno claro no principal e no destrutivo (`DESIGN.md` seção 2, `colibri-ui.css`, `colibri-ui.bootstrap3.css`); regra do botão padrão do diálogo (`DESIGN.md` seção 7, "Camadas").
- **24/09/2026:** primeira versão.
