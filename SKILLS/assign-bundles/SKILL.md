---
name: assign-bundles
description: Atribui interativamente cada skill de SKILLS/ sem bundle a um bundle existente ou novo em bundles.yaml, perguntando skill por skill com opções de bundle existente, bundle novo sugerido e nome customizado.
disable-model-invocation: true
---

# Assign Bundles

Atribui cada skill órfã (sem bundle) a um bundle em `bundles.yaml`, uma pergunta por skill.

## Steps

**Step 1: Levantar as órfãs**
1. Execute `node bin/colibri-skills.mjs catalog orphans` a partir da raiz do repositório (read-only). Se o comando disser que falta o build, rode `npm ci --ignore-scripts` e `npm run build` antes.
2. Se a saída for "Todas as skills pertencem a pelo menos 1 bundle.", pare e informe ao usuário que não há trabalho a fazer.

*Done when:* a lista de skills órfãs (ou a confirmação de que está vazia) está em mãos.

**Step 2: Analisar cada órfã**
1. Para cada skill órfã, leia o frontmatter `description` de `SKILLS/<skill>/SKILL.md` para entender seu objetivo.
2. Releia `bundles.yaml` e monte, para essa skill: o(s) bundle(s) já existentes cujo tema mais se encaixa, e um nome de bundle novo que casaria perfeitamente, com uma descrição de uma linha no mesmo estilo das já presentes em `bundles.yaml`.

*Done when:* toda skill órfã tem pelo menos 1 bundle existente candidato e 1 sugestão de bundle novo com descrição rascunhada.

**Step 3: Perguntar, skill por skill**
1. Para cada skill órfã, monte uma pergunta com pelo menos 3 opções: o(s) bundle(s) existentes candidatos (rótulo = nome do bundle, descrição = a description dele em `bundles.yaml`) e a sugestão de bundle novo (rótulo = nome sugerido, descrição = a description rascunhada). Confie no "Other" automático da tool de pergunta para cobrir o nome customizado de texto livre.
2. Agrupe até 4 perguntas por chamada da tool quando houver múltiplas órfãs pendentes.

*Done when:* toda skill órfã tem uma resposta — um bundle existente, a sugestão nova aceita, ou um nome customizado via "Other".

**Step 4: Aplicar em bundles.yaml**
1. Para cada resposta, execute `node bin/colibri-skills.mjs catalog assign -s <skill> -b <nome> --yes` (mutating), acrescentando `--description "<descrição>"` sempre que `<nome>` ainda não existir em `bundles.yaml` (sugestão nova aceita ou nome customizado). Crie um bundle novo por comando.
2. Se o comando falhar (mensagem `Erro:` em stderr), corrija o argumento apontado e rode de novo.

*Done when:* rodar o Step 1 de novo mostra "Todas as skills pertencem a pelo menos 1 bundle."

**Step 5: Resumir**
1. Liste skill → bundle (marcando os bundles novos criados, com a descrição usada) para cada órfã tratada.

*Done when:* o resumo cobre cada skill que estava órfã no Step 1.

## Error Handling
* Se `catalog assign` falhar por bundle inexistente sem `--description`, repita o comando informando a descrição rascunhada no Step 2.
* Se o comando não encontrar `bundles.yaml`/`SKILLS/`, confirme que ele está sendo executado a partir da raiz do repositório `agents-instructions`.
* O comando muda o `bundles.yaml` do clone e não faz commit. Diga ao usuário para revisar com `git diff`.
