# Adotar ou atualizar o kit

Procedimento do verbo `adotar` (e do argumento que não é verbo). Leva o kit ao repositório de destino ou atualiza a versão já adotada.

## 1. Levantar o projeto

Rode `<pasta-da-skill-impeccable>/scripts/impeccable context` uma vez (com `--target <pasta do frontend>` em monorepo) e, sem alterar nada, descubra e anote:

- Framework e biblioteca de componentes, com versão: Bootstrap 3/AngularJS, Bootstrap 4/5, React, Blazor (DevExpress, com tema), DevExtreme etc.
- Pasta de estáticos servida e a entrada HTML que o navegador carrega (layout/_Host/index.html).
- Página inicial (recebe `.cm-page--home`) e página mais usada.
- Superfícies de toque (perfil Operação): cardápio de tablet, totem, telas de produção de KDS, painel de pedidos prontos. Para cada uma: orientação e resolução, navegador e versão mínima do aparelho (WebView), alvo de build declarado (`lightningcss`, `build.target`), se é tela de consumidor ou de produção (KDS), e se já existe tema ou cor configurável pelo lojista (campos, onde grava, como chega ao app). Tema existente entra como migração para o esquema por canal (seção 9 do `DESIGN.md` do kit).
- Fontes/ícones hospedados em CDN ou em pacote de fonte do tema (Roboto, Inter) que precisarão sair.
- Se já existem `PRODUCT.md`, `DESIGN.md` (no caminho que o `context` resolveu), `.impeccable/` ou `docs/design/DECISOES.md`. Se existirem, este é um fluxo de **atualização**: leia-os, rode `impeccable doctor --json` e mostre ao usuário o que será refeito; nada é sobrescrito sem confirmação.
  - Kit adotado antes de 09/10/2026 não tem `colibri-base.css` ao lado do `colibri-ui.css`. O `colibri-ui.css` novo importa a base (`@import url('colibri-base.css')`): copiar só ele deixa a aplicação sem tokens e sem fontes. Na atualização, os dois vão juntos.
  - Artefatos do impeccable 3.x (`## Register` no `PRODUCT.md`, H2 numerados como `## 1. Overview` e `## 4. Elevation` no `DESIGN.md`) entram na atualização como migração, conforme [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md) ("Migração de um PRODUCT.md…" e "Migração de um DESIGN.md…").

## 2. Confirmar com o usuário

Use a ferramenta de perguntas estruturadas do harness (ou pergunte no chat e aguarde), em rodadas de no máximo três perguntas, como o `impeccable init` exige. Pergunte apenas:

**Rodada 1 (produto):**

1. Usuários: quem usa, em que contexto e com que frequência (ofereça o texto padrão do modelo como opção).
2. Propósito e página mais usada: o que a aplicação precisa permitir e o que essa página deve favorecer.
3. Posicionamento em uma frase ("o lugar onde [quem] faz [o quê]").

**Rodada 2 (projeto):**

4. Nome do produto (título do `PRODUCT.md` e da lateral).
5. Pasta de destino dos estáticos e página inicial, apresentando o que o passo 1 encontrou como opção recomendada.
6. Perfis e adaptadores: Admin e/ou Operação (com as superfícies de toque e os canais de consumidor) e, no perfil Admin, Bootstrap 3 e/ou DevExpress/DevExtreme, apresentando o que o passo 1 detectou.

**Rodada 3, só se houver geração de imagem** (ferramenta de imagem do harness ou `IMAGE_GEN_AVAILABLE` no `impeccable context`) e `buildPath` ainda não estiver gravado: como novas superfícies começam, em pergunta própria. Explique a troca: **code-first** (constrói direto no código; recomendado aqui, porque o mundo visual já está fixado pelo kit) ou **comp-first** (uma imagem define a meta antes do código). Grave só a resposta recebida; sem resposta, não grave nada.

As respostas confirmadas aqui valem como a entrevista exigida pelo `impeccable init`.

## 3. Copiar os arquivos do kit

Para `<estáticos>/colibri-ui/` (ou a pasta confirmada), mantendo `fonts/` e `logos/` ao lado do CSS, pois os caminhos são relativos:

- `colibri-base.css`, `colibri-ui.css`, `fonts/`, `logos/`. O `colibri-ui.css` importa `colibri-base.css` (tokens dos dois temas, fontes e camadas) pelo caminho relativo: os dois ficam na mesma pasta.
- `logos/colibri.ico` também numa pasta pública servida pela entrada HTML (quando `colibri-ui/` não for servida diretamente), trocando o ícone da aba do projeto.
- Com tela de entrada (login) ou páginas de erro: `logos/colibri-marca.svg` na mesma pasta pública, pois é `<img>` do HTML, não `url()` do CSS.
- `icons/` (Bootstrap Icons 1.13.1 local), ou `npm install bootstrap-icons` quando o projeto usa npm para estáticos.
- `colibri-ui.bootstrap3.css` somente com Bootstrap 3/AngularJS; `colibri-ui.devexpress.css` somente com DevExpress Blazor ou DevExtreme (remova dele os blocos da biblioteca não usada).
- Perfil Operação: `colibri-touch.css` (importa `colibri-base.css`, na mesma pasta) e, com canal de consumidor, `colibri-esquema.js` (e `colibri-esquema.d.ts` em TypeScript), importados pelo código do app e pela prévia do admin. Num projeto com os dois perfis, cada entrada carrega só o seu CSS (`colibri-ui.css` no admin, `colibri-touch.css` nas telas de toque).
- Perfil Cards (telas de produção do KDS): `colibri-cards.css`, carregado depois do `colibri-touch.css` nas telas com o card de produção.
- Não copie `DESIGN.md`, `PRODUCT.template.md`, `PRODUCT.toque.template.md`, `LEIA-ME.md`, `exemplo.html`, `exemplo-entrada.html` nem `exemplo-toque.html` para o projeto: o `DESIGN.md` e os modelos de `PRODUCT.md` viram arquivos do impeccable nos passos 4–5; os demais são referência da skill.

Depois ajuste a carga na entrada HTML, nesta ordem: CSS do framework e tema da biblioteca → `bootstrap-icons.min.css` → `colibri-ui.css` → adaptadores (perfil Operação: `bootstrap-icons.min.css` → `colibri-touch.css` → `colibri-cards.css`, este só com o perfil Cards). Remova fontes e ícones de CDN. Detalhes por framework e comportamentos de JavaScript do shell: [`./adocao-por-framework.md`](./adocao-por-framework.md).

Se o usuário pediu só a documentação (sem tocar no código), pule este passo e registre isso em `DECISOES.md`.

## 4. Acionar `impeccable init` (PRODUCT.md e configuração do live)

Invoque a skill `impeccable` com o argumento `init` (`/impeccable init` no Claude Code, `$impeccable init` no Codex) e siga `reference/init.md` dela, com estas entradas:

- **Entrevista (passo 3 do init):** as respostas do passo 2. Não repita perguntas já respondidas nem pergunte direção estética (o init também proíbe).
- **PRODUCT.md (passo 4 do init):** parta de [`../assets/kit/PRODUCT.template.md`](../assets/kit/PRODUCT.template.md) (projeto com admin, mesmo que tenha também telas de toque) ou de [`../assets/kit/PRODUCT.toque.template.md`](../assets/kit/PRODUCT.toque.template.md) (projeto só de toque, ex.: totem); os dois já estão no schema 1. Preencha os colchetes com as respostas; mantenha com o mesmo texto as partes já preenchidas do modelo (cenário de `## Operating Context`, a restrição de `## Capabilities and Constraints`, `## Brand Commitments` com personalidade e antirreferências, os quatro princípios fixos, `## Accessibility & Inclusion`); troque o título pelo nome do produto; mantenha o comentário `impeccable:product-schema 1` e remova o comentário do modelo. Regras de cada seção em [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md).
- **Passo 5 do init:** grave em `.impeccable/config.json` o `buildPath` somente se a rodada 3 teve resposta. Configure o live seguindo `reference/live-setup.md`: `.impeccable/live/config.json` com a entrada HTML do passo 1 e `impeccable detect-csp`; o patch de CSP continua exigindo consentimento.
- **Passo 6 do init:** o init não oferece `DESIGN.md`; siga para o passo 5 desta skill. Se o usuário quiser, acrescente ao `AGENTS.md` um ponteiro "Design Context" para `PRODUCT.md`, `DESIGN.md` e `docs/design/DECISOES.md`.

## 5. Acionar `impeccable document` (DESIGN.md e `.impeccable/design.json`)

Invoque a skill `impeccable` com o argumento `document` em **modo scan** (nunca seed) e siga `reference/document.md` dela, usando o kit como fonte principal e o código do projeto como complemento. As regras de conversão (11 seções do kit → 8 seções da spec, grupos de frontmatter permitidos, conteúdo do sidecar, onde entra "Implementação neste projeto") e o checklist de fidelidade estão em [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md). Leia-o antes de escrever o `DESIGN.md`.

No passo 3 do document (linguagem qualitativa, duas rodadas de perguntas), não abra perguntas: apresente as respostas herdadas do kit (tabela no mapeamento) e só pergunte se o usuário quiser mudar algo — mudança é desvio e vai para `DECISOES.md`.

## 6. Registrar as decisões (`docs/design/DECISOES.md`)

Crie o arquivo a partir de [`../assets/DECISOES.template.md`](../assets/DECISOES.template.md) (ou acrescente uma entrada, se já existir). Registre: versão do kit (data da entrada mais recente de "Versões" do `LEIA-ME.md`), versão do impeccable, framework e biblioteca com versão, perfis com as entradas e páginas de cada um (no Operação, cada superfície, se é de consumidor ou de produção, e os canais; é por esse campo que `aderencia` e `refatorar` decidem o perfil da página), adaptadores, onde ficam os arquivos, página inicial, cada desvio do kit com o motivo, e a lista de páginas a refatorar com a mais usada primeiro.

## 7. Validar e relatar

Confira antes de concluir:

- `impeccable context` imprime `PRODUCT.md` e `DESIGN.md` sem `NO_PRODUCT_MD`.
- `impeccable doctor --json` volta sem findings de `PRODUCT.md`, `DESIGN.md` ou sidecar (em especial, sem `product-deprecated-register`). Finding de outra natureza é relatado como o `reference/doctor.md` manda; não corrija por conta própria.
- `DESIGN.md` passa no checklist de [`./mapeamento-impeccable.md`](./mapeamento-impeccable.md) (oito seções na ordem, frontmatter só com grupos permitidos, todas as regras nomeadas do kit presentes).
- `.impeccable/design.json` é JSON válido com `schemaVersion: 2` (valide com o runtime disponível: `node`, `python -m json.tool` ou `ConvertFrom-Json`).
- Se o passo 3 rodou: `impeccable detect --json` uma vez sobre os arquivos de UI alterados no projeto. Achados em arquivos do projeto são corrigidos ou relatados; achados nos arquivos copiados do kit (`colibri-ui/`) não se corrigem no projeto: relate e leve ao kit (seção "Evoluir o kit" do `SKILL.md`).
- Se o passo 3 rodou: a aplicação carrega sem 404 para `fonts/`, `logos/` e ícones; nenhuma fonte/ícone vem de CDN; a página inicial mostra a marca-d'água e as demais não; a aba mostra o ícone do kit (`colibri.ico`), sem 404 e sem o ícone antigo ou o padrão do framework. Com DevExpress/DevExtreme, faça a verificação obrigatória da seção 3 do `DESIGN.md` do kit (calendário, seletor de hora, lista suspensa, dica e validação em Google Sans Flex); gráficos do DevExtreme escrevem a fonte no SVG e precisam de tema de visualização próprio (ver `adocao-por-framework.md`). Com grade de biblioteca, meça no navegador cabeçalho (36 px) e linha (36 px mais o divisor) e confira as bordas em `--cm-line` nos dois temas, inclusive na linha selecionada e na em edição, e abra o filtro de cabeçalho no tema escuro (itens legíveis, divisores em `--cm-line`) (regra da grade como tabela, seção 7); no projeto, a grade não leva zebra, borda própria nem CSS de grade que o adaptador já cobre. Com o tema escuro, a alternância na barra superior troca `data-theme` no `<html>` sem piscar o tema claro ao carregar, e as páginas, popups e componentes de biblioteca ficam no tema escuro. No perfil Operação: o build declara o alvo Chrome 101 e o CSS gerado não tem cor da paleta do Tailwind em `oklch()` sem alternativa hex, nem `scale:`/`translate:` separados; meça no navegador, na resolução real de cada superfície, os alvos de toque (nenhum abaixo do mínimo da tabela da seção 9); nas telas de consumidor, aplique um esquema claro e um escuro e confira que a tela segue os `--ct-*` sem cor própria e que o esquema gravado é aplicado antes de pintar; nas de produção, os dois temas; urgência com borda, faixa, ícone e rótulo. O que não puder ser verificado aqui (app não sobe, falta banco, sem o aparelho real), relate como não verificado.

Relate ao usuário: arquivos criados/alterados, desvios registrados, o que ficou sem verificação e os próximos passos, página a página, começando pelo shell e depois pela mais usada. Indique os verbos desta skill com o alvo já preenchido:

- `colibri-design-kit aderencia` para a nota de partida do frontend e a ordem das páginas, da menos aderente à mais;
- `colibri-design-kit refatorar <página>` para cada página da lista, começando pelo shell e pela mais usada;
- `impeccable live` (ou `impeccable generate`) para iterar no navegador, se o live foi configurado e o servidor de desenvolvimento estiver rodando.
