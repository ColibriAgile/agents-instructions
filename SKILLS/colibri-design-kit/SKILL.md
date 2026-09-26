---
name: colibri-design-kit
description: 'Colibri Design Kit adota a linha visual das aplicações Colibri em um repositório: copia CSS, fontes, ícones e logo do kit, aciona a skill impeccable 4.x (init e document) para gerar PRODUCT.md, DESIGN.md e os arquivos de controle em .impeccable/, e registra as decisões de design do projeto. Use para iniciar ou retomar a refatoração visual de um frontend Colibri, alinhar um projeto ao kit, atualizar a versão do kit adotada ou migrar artefatos gerados pelo impeccable 3.x. Não use para refatorar páginas depois da adoção (peça ao impeccable, com shape, polish ou critique, usando o DESIGN.md gerado), para projetos fora da linha Colibri nem para backend.'
argument-hint: 'Caminho do frontend no repositório (opcional) e framework, ex.: "src/web, Blazor DevExpress"'
---

# Colibri Design Kit

Leva a linha visual Colibri ("Mesa de operação") a um repositório e deixa o projeto pronto para o impeccable trabalhar sobre ela. Ao final o repositório tem:

| Arquivo | Conteúdo | Quem grava |
|---|---|---|
| `<estáticos>/colibri-ui/` | `colibri-ui.css`, adaptadores usados, `fonts/`, `logos/`, `icons/` | esta skill |
| `PRODUCT.md` | usuários, propósito, contexto, compromissos da marca, princípios (modelo do kit preenchido) | impeccable `init` |
| `DESIGN.md` | regras visuais do kit no formato do impeccable + implementação no projeto | impeccable `document` |
| `.impeccable/design.json` | sidecar: metadados de cor, sombras, movimento, breakpoints, componentes | impeccable `document` |
| `.impeccable/live/config.json` | configuração do modo `live` | impeccable `init` |
| `.impeccable/config.json` | `buildPath` (`code` ou `comp`), só quando o usuário escolheu | impeccable `init` |
| `docs/design/DECISOES.md` | registro das decisões de design e desvios do kit | esta skill |

Compatibilidade: impeccable 4.x (conferido na 4.4.0): `PRODUCT.md` no schema de produto 1, `DESIGN.md` com oito seções canônicas, contexto carregado pelo launcher `scripts/impeccable`. Artefatos gerados com o impeccable 3.x são migrados no fluxo de atualização (passo 1).

## Fonte da verdade

O kit em [`./assets/kit/`](./assets/kit/) é normativo. [`./assets/kit/DESIGN.md`](./assets/kit/DESIGN.md) define cores, tipografia, estrutura, anatomia de página e componentes; [`./assets/kit/LEIA-ME.md`](./assets/kit/LEIA-ME.md) define a ordem de carga e a versão do kit (seção "Versões"). Leia os dois antes do passo 1.

Para o impeccable, o kit é um **mundo visual estabelecido**: ele herda, não inventa. Quando o impeccable propuser algo que contraria o kit, **o kit vence**. Em especial, dentro deste fluxo e nas refatorações seguintes:

- Não rode o workshop de mundo visual do impeccable (`new-work` → "Create or replace the visual world", `concept-seed --scope world`, `document --seed`) nem proponha estratégia de cor ou paleta: as cores do kit são marca comprometida.
- Cores em hex no frontmatter (valores exatos do kit); não converta para OKLCH.
- `Platform` é `web`, salvo projeto nativo confirmado pelo usuário. Não grave `## Register` no `PRODUCT.md` (descontinuado na 4.x); as páginas Colibri são do modo **Operate**, que o impeccable registra no brief de cada superfície quando ela for trabalhada.
- Não pergunte o que o kit já decidiu (norte criativo, personalidade, antirreferências, acessibilidade, nomes das cores, elevação, filosofia dos componentes). Mostre o que foi herdado e pergunte só o que é do produto.
- Nenhuma regra do kit pode ser resumida a ponto de sumir, nem enfraquecida ("prefira" no lugar de "nunca").

Desvios do kit são permitidos apenas com confirmação do usuário e sempre registrados em `docs/design/DECISOES.md` com o motivo.

## Pré-requisitos

- A skill `impeccable` 4.x precisa estar instalada no projeto (`.agents/skills/impeccable/` ou `.claude/skills/impeccable/`; a versão está em `metadata.version` do `SKILL.md` dela). Se não estiver, ou se for 3.x (tem `scripts/context.mjs` em vez de `scripts/impeccable`), pare e peça para instalar o bundle `frontend` (`Install-Skills.ps1`) ou, pontualmente, `npx skills add ColibriAgile/agents-instructions -s impeccable -y`.
- O launcher `<pasta-da-skill-impeccable>/scripts/impeccable` (em Windows sem `sh`, `impeccable.cmd`) roda um binário próprio, sem Node. Na primeira execução ele baixa o binário das releases de `pbakaus/impeccable` no GitHub, confere o SHA-256 e guarda em `~/.impeccable/bin/<versão>/`; isso exige rede. Se o launcher falhar, siga o "Launcher unavailable" do `SKILL.md` do impeccable (ler `PRODUCT.md` e `DESIGN.md` direto) e registre a verificação como não realizada.
- Se `impeccable context` imprimir `UPDATE_AVAILABLE`, não rode `npx impeccable update` no projeto: a skill vem do bundle, e a atualização entra no repositório `agents-instructions`. Avise o usuário e siga.
- Trabalhe a partir da raiz do repositório de destino; nunca a partir da pasta da skill.

## Procedimento

### 1. Levantar o projeto

Rode `<pasta-da-skill-impeccable>/scripts/impeccable context` uma vez (com `--target <pasta do frontend>` em monorepo) e, sem alterar nada, descubra e anote:

- Framework e biblioteca de componentes, com versão: Bootstrap 3/AngularJS, Bootstrap 4/5, React, Blazor (DevExpress, com tema), DevExtreme etc.
- Pasta de estáticos servida e a entrada HTML que o navegador carrega (layout/_Host/index.html).
- Página inicial (recebe `.cm-page--home`) e página mais usada.
- Fontes/ícones hospedados em CDN ou em pacote de fonte do tema (Roboto, Inter) que precisarão sair.
- Se já existem `PRODUCT.md`, `DESIGN.md` (no caminho que o `context` resolveu), `.impeccable/` ou `docs/design/DECISOES.md`. Se existirem, este é um fluxo de **atualização**: leia-os, rode `impeccable doctor --json` e mostre ao usuário o que será refeito; nada é sobrescrito sem confirmação.
  - Artefatos do impeccable 3.x (`## Register` no `PRODUCT.md`, H2 numerados como `## 1. Overview` e `## 4. Elevation` no `DESIGN.md`) entram na atualização como migração, conforme [`./references/mapeamento-impeccable.md`](./references/mapeamento-impeccable.md) ("Migração de um PRODUCT.md…" e "Migração de um DESIGN.md…").

### 2. Confirmar com o usuário

Use a ferramenta de perguntas estruturadas do harness (ou pergunte no chat e aguarde), em rodadas de no máximo três perguntas, como o `impeccable init` exige. Pergunte apenas:

**Rodada 1 (produto):**

1. Usuários: quem usa, em que contexto e com que frequência (ofereça o texto padrão do modelo como opção).
2. Propósito e página mais usada: o que a aplicação precisa permitir e o que essa página deve favorecer.
3. Posicionamento em uma frase ("o lugar onde [quem] faz [o quê]").

**Rodada 2 (projeto):**

4. Nome do produto (título do `PRODUCT.md` e da lateral).
5. Pasta de destino dos estáticos e página inicial, apresentando o que o passo 1 encontrou como opção recomendada.
6. Adaptadores: Bootstrap 3 e/ou DevExpress/DevExtreme, apresentando o que o passo 1 detectou.

**Rodada 3, só se houver geração de imagem** (ferramenta de imagem do harness ou `IMAGE_GEN_AVAILABLE` no `impeccable context`) e `buildPath` ainda não estiver gravado: como novas superfícies começam, em pergunta própria. Explique a troca: **code-first** (constrói direto no código; recomendado aqui, porque o mundo visual já está fixado pelo kit) ou **comp-first** (uma imagem define a meta antes do código). Grave só a resposta recebida; sem resposta, não grave nada.

As respostas confirmadas aqui valem como a entrevista exigida pelo `impeccable init`.

### 3. Copiar os arquivos do kit

Para `<estáticos>/colibri-ui/` (ou a pasta confirmada), mantendo `fonts/` e `logos/` ao lado do CSS, pois os caminhos são relativos:

- `colibri-ui.css`, `fonts/`, `logos/`.
- `icons/` (Bootstrap Icons 1.13.1 local), ou `npm install bootstrap-icons` quando o projeto usa npm para estáticos.
- `colibri-ui.bootstrap3.css` somente com Bootstrap 3/AngularJS; `colibri-ui.devexpress.css` somente com DevExpress Blazor ou DevExtreme (remova dele os blocos da biblioteca não usada).
- Não copie `DESIGN.md`, `PRODUCT.template.md`, `LEIA-ME.md` nem `exemplo.html` para o projeto: os dois primeiros viram arquivos do impeccable nos passos 4–5; os demais são referência da skill.

Depois ajuste a carga na entrada HTML, nesta ordem: CSS do framework e tema da biblioteca → `bootstrap-icons.min.css` → `colibri-ui.css` → adaptadores. Remova fontes e ícones de CDN. Detalhes por framework e comportamentos de JavaScript do shell: [`./references/adocao-por-framework.md`](./references/adocao-por-framework.md).

Se o usuário pediu só a documentação (sem tocar no código), pule este passo e registre isso em `DECISOES.md`.

### 4. Acionar `impeccable init` (PRODUCT.md e configuração do live)

Invoque a skill `impeccable` com o argumento `init` (`/impeccable init` no Claude Code, `$impeccable init` no Codex) e siga `reference/init.md` dela, com estas entradas:

- **Entrevista (passo 3 do init):** as respostas do passo 2. Não repita perguntas já respondidas nem pergunte direção estética (o init também proíbe).
- **PRODUCT.md (passo 4 do init):** parta de [`./assets/kit/PRODUCT.template.md`](./assets/kit/PRODUCT.template.md), que já está no schema 1. Preencha os colchetes com as respostas; mantenha com o mesmo texto as partes já preenchidas do modelo (cenário de `## Operating Context`, a restrição de `## Capabilities and Constraints`, `## Brand Commitments` com personalidade e antirreferências, os quatro princípios fixos, `## Accessibility & Inclusion`); troque o título pelo nome do produto; mantenha o comentário `impeccable:product-schema 1` e remova o comentário do modelo. Regras de cada seção em [`./references/mapeamento-impeccable.md`](./references/mapeamento-impeccable.md).
- **Passo 5 do init:** grave em `.impeccable/config.json` o `buildPath` somente se a rodada 3 teve resposta. Configure o live seguindo `reference/live-setup.md`: `.impeccable/live/config.json` com a entrada HTML do passo 1 e `impeccable detect-csp`; o patch de CSP continua exigindo consentimento.
- **Passo 6 do init:** o init não oferece `DESIGN.md`; siga para o passo 5 desta skill. Se o usuário quiser, acrescente ao `AGENTS.md` um ponteiro "Design Context" para `PRODUCT.md`, `DESIGN.md` e `docs/design/DECISOES.md`.

### 5. Acionar `impeccable document` (DESIGN.md e `.impeccable/design.json`)

Invoque a skill `impeccable` com o argumento `document` em **modo scan** (nunca seed) e siga `reference/document.md` dela, usando o kit como fonte principal e o código do projeto como complemento. As regras de conversão (9 seções do kit → 8 seções da spec, grupos de frontmatter permitidos, conteúdo do sidecar, onde entra "Implementação neste projeto") e o checklist de fidelidade estão em [`./references/mapeamento-impeccable.md`](./references/mapeamento-impeccable.md). Leia-o antes de escrever o `DESIGN.md`.

No passo 3 do document (linguagem qualitativa, duas rodadas de perguntas), não abra perguntas: apresente as respostas herdadas do kit (tabela no mapeamento) e só pergunte se o usuário quiser mudar algo — mudança é desvio e vai para `DECISOES.md`.

### 6. Registrar as decisões (`docs/design/DECISOES.md`)

Crie o arquivo a partir de [`./assets/DECISOES.template.md`](./assets/DECISOES.template.md) (ou acrescente uma entrada, se já existir). Registre: versão do kit (data da entrada mais recente de "Versões" do `LEIA-ME.md`), versão do impeccable, framework e biblioteca com versão, adaptadores, onde ficam os arquivos, página inicial, cada desvio do kit com o motivo, e a lista de páginas a refatorar com a mais usada primeiro.

### 7. Validar e relatar

Confira antes de concluir:

- `impeccable context` imprime `PRODUCT.md` e `DESIGN.md` sem `NO_PRODUCT_MD`.
- `impeccable doctor --json` volta sem findings de `PRODUCT.md`, `DESIGN.md` ou sidecar (em especial, sem `product-deprecated-register`). Finding de outra natureza é relatado como o `reference/doctor.md` manda; não corrija por conta própria.
- `DESIGN.md` passa no checklist de [`./references/mapeamento-impeccable.md`](./references/mapeamento-impeccable.md) (oito seções na ordem, frontmatter só com grupos permitidos, todas as regras nomeadas do kit presentes).
- `.impeccable/design.json` é JSON válido com `schemaVersion: 2` (valide com o runtime disponível: `node`, `python -m json.tool` ou `ConvertFrom-Json`).
- Se o passo 3 rodou: `impeccable detect --json` uma vez sobre os arquivos de UI alterados no projeto. Achados em arquivos do projeto são corrigidos ou relatados; achados nos arquivos copiados do kit (`colibri-ui/`) não se corrigem no projeto: relate e leve ao kit (seção "Evoluir o kit").
- Se o passo 3 rodou: a aplicação carrega sem 404 para `fonts/`, `logos/` e ícones; nenhuma fonte/ícone vem de CDN; a página inicial mostra a marca-d'água e as demais não. Com DevExpress/DevExtreme, faça a verificação obrigatória da seção 3 do `DESIGN.md` do kit (calendário, seletor de hora, lista suspensa, dica e validação em Google Sans Flex); gráficos do DevExtreme escrevem a fonte no SVG e precisam de tema de visualização próprio (ver `adocao-por-framework.md`). O que não puder ser verificado aqui (app não sobe, falta banco), relate como não verificado.

Relate ao usuário: arquivos criados/alterados, desvios registrados, o que ficou sem verificação e os próximos passos, página a página, começando pelo shell e depois pela mais usada. `craft` é alias descontinuado no impeccable 4.x; indique:

- pedido direto ao impeccable para refatorar a página seguindo o `DESIGN.md` (ex.: `/impeccable refatore a página Clientes seguindo a anatomia de página do DESIGN.md`). Deixe claro no pedido que o mundo visual e a anatomia de página são do kit, para que o impeccable estenda o mundo estabelecido em vez de abrir um torneio de conceitos;
- `impeccable shape <página>` para planejar e gravar o brief da superfície (modo Operate) antes de implementar;
- `impeccable critique <página>` para medir antes/depois, e `impeccable polish <página>` ou `impeccable audit <página>` no fechamento;
- `impeccable live` (ou `impeccable generate`) para iterar no navegador, se o live foi configurado e o servidor de desenvolvimento estiver rodando.

## Evoluir o kit desta skill

O kit em `./assets/kit/` é mantido diretamente nesta skill e é a fonte da verdade da linha visual Colibri: nenhuma aplicação serve de matriz nem gera o kit. Mudança de design nasce aqui e chega às aplicações pelo fluxo de atualização.

Ao alterar o kit:

- Mude a regra e a implementação juntas: `DESIGN.md` e `colibri-ui.css`, mais os adaptadores afetados (`colibri-ui.bootstrap3.css`, `colibri-ui.devexpress.css`) e a marcação de `exemplo.html` quando o componente aparece nela.
- Regra nova ou alterada entra no checklist de `./references/mapeamento-impeccable.md` (e na tabela, se o `DESIGN.md` mudou de estrutura); comportamento por framework vai para `./references/adocao-por-framework.md`.
- Acrescente no topo de "Versões" do `LEIA-ME.md` uma entrada com a data e o que mudou.
- Ajuste descoberto numa aplicação que vale para todas volta para cá; não fica só no projeto.

Ao atualizar o impeccable no bundle, confira esta skill contra a versão nova: formato do `PRODUCT.md` (`reference/init.md`), seções do `DESIGN.md` e sidecar (`reference/document.md`), verbos do launcher e findings do `doctor`. Rode `impeccable detect --json` sobre `assets/kit/` para ver o que o detector novo acusa no próprio kit.

Nas aplicações que já adotaram o kit, rode esta skill de novo: é o fluxo de atualização do passo 1.
