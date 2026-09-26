---
name: colibri-design-kit
description: 'Colibri Design Kit adota a linha visual das aplicações Colibri em um repositório: copia CSS, fontes, ícones e logo do kit, aciona a skill impeccable (init e document) para gerar PRODUCT.md, DESIGN.md e os arquivos de controle em .impeccable/, e registra as decisões de design do projeto. Use para iniciar ou retomar a refatoração visual de um frontend Colibri, alinhar um projeto ao kit ou atualizar a versão do kit adotada. Não use para refatorar páginas depois da adoção (use impeccable craft/polish com o DESIGN.md gerado), para projetos fora da linha Colibri nem para backend.'
argument-hint: 'Caminho do frontend no repositório (opcional) e framework, ex.: "src/web, Blazor DevExpress"'
---

# Colibri Design Kit

Leva a linha visual Colibri ("Mesa de operação") a um repositório e deixa o projeto pronto para o impeccable trabalhar sobre ela. Ao final o repositório tem:

| Arquivo | Conteúdo | Quem grava |
|---|---|---|
| `<estáticos>/colibri-ui/` | `colibri-ui.css`, adaptadores usados, `fonts/`, `logos/`, `icons/` | esta skill |
| `PRODUCT.md` | usuários, propósito, princípios (modelo do kit preenchido) | impeccable `init` |
| `DESIGN.md` | regras visuais do kit no formato do impeccable + implementação no projeto | impeccable `document` |
| `.impeccable/design.json` | sidecar: metadados de cor, sombras, movimento, breakpoints, componentes | impeccable `document` |
| `.impeccable/live/config.json` | configuração do modo `live` | impeccable `init` |
| `docs/design/DECISOES.md` | registro das decisões de design e desvios do kit | esta skill |

## Fonte da verdade

O kit em [`./assets/kit/`](./assets/kit/) é normativo. [`./assets/kit/DESIGN.md`](./assets/kit/DESIGN.md) define cores, tipografia, estrutura, anatomia de página e componentes; [`./assets/kit/LEIA-ME.md`](./assets/kit/LEIA-ME.md) define a ordem de carga e a versão do kit (seção "Versões"). Leia os dois antes do passo 1.

Quando o impeccable propuser algo que contraria o kit, **o kit vence**. Em especial, dentro deste fluxo:

- Não rode `palette.mjs` nem proponha paleta: as cores do kit são marca comprometida.
- Cores em hex no frontmatter (valores exatos do kit); não converta para OKLCH.
- `Register` é `product` e `Platform` é `web`, salvo projeto nativo confirmado pelo usuário.
- Não pergunte o que o kit já decidiu (norte criativo, personalidade, antirreferências, acessibilidade, nomes das cores, elevação, filosofia dos componentes). Mostre o que foi herdado e pergunte só o que é do produto.
- Nenhuma regra do kit pode ser resumida a ponto de sumir, nem enfraquecida ("prefira" no lugar de "nunca").

Desvios do kit são permitidos apenas com confirmação do usuário e sempre registrados em `docs/design/DECISOES.md` com o motivo.

## Pré-requisitos

- A skill `impeccable` precisa estar instalada no projeto (`.agents/skills/impeccable/` ou `.claude/skills/impeccable/`). Se não estiver, pare e peça para instalar o bundle `frontend` (`Install-Skills.ps1`) ou, pontualmente, `npx skills add ColibriAgile/agents-instructions -s impeccable -y`.
- Node disponível no PATH (scripts do impeccable).
- Trabalhe a partir da raiz do repositório de destino; nunca a partir da pasta da skill.

## Procedimento

### 1. Levantar o projeto

Sem alterar nada, descubra e anote:

- Framework e biblioteca de componentes, com versão: Bootstrap 3/AngularJS, Bootstrap 4/5, React, Blazor (DevExpress, com tema), DevExtreme etc.
- Pasta de estáticos servida e a entrada HTML que o navegador carrega (layout/_Host/index.html).
- Página inicial (recebe `.cm-page--home`) e página mais usada.
- Fontes/ícones hospedados em CDN que precisarão sair.
- Se já existem `PRODUCT.md`, `DESIGN.md` (raiz, `docs/` ou `.agents/context/`), `.impeccable/` ou `docs/design/DECISOES.md`. Se existirem, este é um fluxo de **atualização**: leia-os e mostre ao usuário o que será refeito; nada é sobrescrito sem confirmação.

### 2. Confirmar com o usuário (uma rodada)

Use a ferramenta de perguntas estruturadas do harness (ou pergunte no chat e aguarde). Pergunte apenas:

1. Nome do produto (título do `PRODUCT.md` e da lateral).
2. Usuários: quem usa, em que contexto e com que frequência (ofereça o texto padrão do modelo como opção).
3. Propósito e página mais usada: o que a aplicação precisa permitir e o que essa página deve favorecer.
4. Posicionamento em uma frase ("o lugar onde [quem] faz [o quê]").
5. Pasta de destino dos estáticos e página inicial, apresentando o que o passo 1 encontrou como opção recomendada.
6. Adaptadores: Bootstrap 3 e/ou DevExpress/DevExtreme, apresentando o que o passo 1 detectou.

As respostas confirmadas aqui valem como a rodada de entrevista exigida pelo `impeccable init`.

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

- **Rodada de entrevista:** as respostas do passo 2. Não repita perguntas já respondidas.
- **PRODUCT.md:** parta de [`./assets/kit/PRODUCT.template.md`](./assets/kit/PRODUCT.template.md). Preencha os colchetes com as respostas; mantenha as seções já preenchidas do modelo (Brand Personality, Anti-references, os quatro princípios fixos, Accessibility & Inclusion) com o mesmo texto; troque o título pelo nome do produto; remova o comentário HTML do modelo.
- **Passo 5 do init (DESIGN.md):** aceite e siga para o passo 5 desta skill.
- **Passo 6 do init (live):** grave `.impeccable/live/config.json` com a entrada HTML do passo 1; o patch de CSP continua exigindo consentimento.
- **Passo 7 do init:** aceite o ponteiro de "Design Context" no `AGENTS.md` se o usuário quiser; mencione ali também `docs/design/DECISOES.md`.

### 5. Acionar `impeccable document` (DESIGN.md e `.impeccable/design.json`)

Invoque a skill `impeccable` com o argumento `document` em **modo scan** e siga `reference/document.md` dela, usando o kit como fonte principal e o código do projeto como complemento. As regras de conversão (9 seções do kit → 6 seções da spec, grupos de frontmatter permitidos, conteúdo do sidecar, onde entra "Implementação neste projeto") e o checklist de fidelidade estão em [`./references/mapeamento-impeccable.md`](./references/mapeamento-impeccable.md). Leia-o antes de escrever o `DESIGN.md`.

No passo 3 do document (linguagem qualitativa), não abra perguntas: apresente as respostas herdadas do kit (tabela no mapeamento) e só pergunte se o usuário quiser mudar algo — mudança é desvio e vai para `DECISOES.md`.

### 6. Registrar as decisões (`docs/design/DECISOES.md`)

Crie o arquivo a partir de [`./assets/DECISOES.template.md`](./assets/DECISOES.template.md) (ou acrescente uma entrada, se já existir). Registre: versão do kit (data da entrada mais recente de "Versões" do `LEIA-ME.md`), framework e biblioteca com versão, adaptadores, onde ficam os arquivos, página inicial, cada desvio do kit com o motivo, e a lista de páginas a refatorar com a mais usada primeiro.

### 7. Validar e relatar

Confira antes de concluir:

- `node <pasta-da-skill-impeccable>/scripts/context.mjs` imprime `PRODUCT.md` e `DESIGN.md` sem `NO_PRODUCT_MD` e sem aviso de `Platform`.
- `DESIGN.md` passa no checklist de [`./references/mapeamento-impeccable.md`](./references/mapeamento-impeccable.md) (seis seções na ordem, frontmatter só com grupos permitidos, todas as regras nomeadas do kit presentes).
- `.impeccable/design.json` é JSON válido com `schemaVersion: 2`.
- Se o passo 3 rodou: a aplicação carrega sem 404 para `fonts/`, `logos/` e ícones; nenhuma fonte/ícone vem de CDN; a página inicial mostra a marca-d'água e as demais não. Com DevExpress/DevExtreme, faça a verificação obrigatória da seção 3 do `DESIGN.md` do kit (calendário, seletor de hora, lista suspensa, dica e validação em Google Sans Flex). O que não puder ser verificado aqui (app não sobe, falta banco), relate como não verificado.

Relate ao usuário: arquivos criados/alterados, desvios registrados, o que ficou sem verificação e os próximos comandos, página a página, começando pela mais usada:

- `impeccable shape <página>` ou `impeccable craft <página>` para refatorar seguindo a seção 6 (anatomia de página) do kit;
- `impeccable critique <página>` para medir antes/depois;
- `impeccable live` para iterar no navegador (se o live foi configurado).

## Evoluir o kit desta skill

O kit em `./assets/kit/` é mantido diretamente nesta skill e é a fonte da verdade da linha visual Colibri: nenhuma aplicação serve de matriz nem gera o kit. Mudança de design nasce aqui e chega às aplicações pelo fluxo de atualização.

Ao alterar o kit:

- Mude a regra e a implementação juntas: `DESIGN.md` e `colibri-ui.css`, mais os adaptadores afetados (`colibri-ui.bootstrap3.css`, `colibri-ui.devexpress.css`) e a marcação de `exemplo.html` quando o componente aparece nela.
- Regra nova ou alterada entra no checklist de `./references/mapeamento-impeccable.md` (e na tabela, se o `DESIGN.md` mudou de estrutura); comportamento por framework vai para `./references/adocao-por-framework.md`.
- Acrescente no topo de "Versões" do `LEIA-ME.md` uma entrada com a data e o que mudou.
- Ajuste descoberto numa aplicação que vale para todas volta para cá; não fica só no projeto.

Nas aplicações que já adotaram o kit, rode esta skill de novo: é o fluxo de atualização do passo 1.
