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
| `logos/` | `colibri-colorido.svg`, marca-d'água obrigatória da página inicial (`.cm-page--home`). |
| `exemplo.html` | Página de demonstração com a marcação de cada componente. Abra direto no navegador. `exemplo.html#historico` abre o painel lateral; `exemplo.html#inicio` mostra a marca-d'água da página inicial. |
| `fonts/` | Google Sans Flex e Google Sans Mono (WOFF2), servidas localmente. |
| `icons/` | Bootstrap Icons 1.13.1 (fonte local). Em projetos com npm, prefira `npm install bootstrap-icons`. |

## Como adotar em um repositório

1. Copie `DESIGN.md` para a raiz e `PRODUCT.template.md` para a raiz como `PRODUCT.md`; preencha o `PRODUCT.md` e a seção 9 do `DESIGN.md` ("Implementação neste projeto").
2. Copie `colibri-ui.css`, `fonts/`, `logos/` e os ícones para a pasta de estáticos do projeto, mantendo `fonts/` e `logos/` ao lado do CSS (os caminhos são relativos).
3. Carregue na página, nesta ordem: CSS do framework e tema da biblioteca de componentes (se houver) → `bootstrap-icons.min.css` → `colibri-ui.css` → adaptadores: `colibri-ui.bootstrap3.css` (somente com Bootstrap 3/AngularJS) e/ou `colibri-ui.devexpress.css` (com DevExpress Blazor ou DevExtreme).
4. Monte o shell (lateral + barra superior) usando a marcação de `exemplo.html`, depois refatore página a página seguindo a seção 6 do `DESIGN.md`.
5. Na página inicial, acrescente `cm-page--home` ao contêiner (`<div class="cm-page cm-page--home">`) para exibir a marca-d'água do colibri. Somente nela.
6. Com Bootstrap 4/5, React, Blazor etc., não use o adaptador Bootstrap 3: implemente os componentes do framework com as classes `cm-` ou transponha os tokens `--cm-*` para o tema do framework, usando o adaptador apenas como referência.
7. Com DevExpress/DevExtreme, confira que o calendário e o seletor de hora do controle de data/hora, listas suspensas, grades e dicas estão em Google Sans Flex (seção 3 do `DESIGN.md`, "Bibliotecas de componentes").

## Observações

- Tudo funciona sem internet; não troque fontes ou ícones por versões hospedadas em CDN.
- A lateral e a barra superior dependem de pequenos comportamentos em JavaScript (recolher, abrir sobre o conteúdo até 920 px, menus). `exemplo.html` traz uma versão mínima; reimplemente no framework do projeto com Esc para fechar e retorno de foco.
- Menus suspensos (`.cm-menu`) têm só o visual; abrir/fechar é responsabilidade do projeto (no Bootstrap 3, use `.dropdown-menu` junto).

## Versões

Mais recente no topo. Todos os arquivos do kit são mantidos à mão.

- **26/09/2026:** `PRODUCT.template.md` no schema de produto 1 do impeccable 4.x: sem `## Register`; personalidade e antirreferências em `## Brand Commitments`; princípios em `## Product Principles`; cenário de uso em `## Operating Context`; operação sem internet em `## Capabilities and Constraints`. Regras visuais sem mudança.
- **25/09/2026:** foco interno em todo botão (`outline-offset: -3px`), com o focado acima dos vizinhos e do principal em grupos e rodapés de diálogo, e contorno claro no principal e no destrutivo (`DESIGN.md` seção 2, `colibri-ui.css`, `colibri-ui.bootstrap3.css`); regra do botão padrão do diálogo (`DESIGN.md` seção 7, "Camadas").
- **24/09/2026:** primeira versão.
