---
name: sdd-criar-prd
description: Cria ou atualiza um PRD SDD sem definir arquitetura ou tasks.
argument-hint: --prompt "descrição da feature" [--atualizar]
disable-model-invocation: true
---

# Criar PRD SDD

Defina o quê, por quê, limites e resultados mensuráveis. Preserve arquitetura e implementação para a TechSpec.

## Steps — produto

**Step 1: Fixar feature e destino**

1. Extraia a feature de `--prompt` ou do contexto e derive um slug em kebab-case.
2. Resolva `tasks/prd-[slug]/prd.md` antes de redigir.
3. Se o arquivo existir sem `--atualizar`, preserve-o e informe o caminho. Com `--atualizar`, leia-o integralmente e preserve IDs de obrigações inalteradas.

*Done when:* a feature, o slug e a operação de criação ou atualização explícita estão definidos sem risco de sobrescrita.

**Step 2: Construir o inventário de produto**

1. Extraia do pedido problema, usuários, jornadas, resultados, métricas, requisitos, restrições, dependências, acessibilidade e fora de escopo.
2. Consulte primeiro evidência local fornecida pelo usuário ou já existente no projeto.
3. Pesquise somente regras públicas, normas ou integrações externas relevantes; use fontes primárias e registre os links. Trate regras internas e decisões de produto como perguntas ao usuário, não como fatos da web.
4. Pergunte apenas o que altera escopo, aceite ou resultado. Registre premissas não bloqueantes com sua origem.

*Done when:* cada seção do template possui evidência, resposta ou premissa explícita, e toda regra externa tem proveniência.

**Step 3: Redigir o contrato**

1. Leia `assets/prd.template.md` desta skill na íntegra.
2. Escreva requisitos funcionais como `RF-01`, não funcionais como `RNF-01` e histórias como `US-01`.
3. Torne critérios observáveis e preserve detalhes de arquitetura, componentes, código e sequenciamento fora do PRD.
4. Em atualização, mantenha IDs estáveis e liste obrigações adicionadas, alteradas ou removidas; não atualize derivados automaticamente.

*Done when:* todas as seções aplicáveis estão preenchidas, IDs são únicos e cada requisito possui resultado ou aceite verificável.

**Step 4: Gravar e reportar impacto**

1. Crie ou atualize somente `tasks/prd-[slug]/prd.md` conforme a operação autorizada.
2. Informe o caminho, um resumo de uma linha e, em atualização, quais TechSpecs ou planos precisam ser revalidados.

*Done when:* o PRD existe no destino correto e qualquer invalidação de artefato derivado foi reportada sem modificá-lo silenciosamente.

## Error Handling

- Se o pedido não identificar problema ou resultado, solicite a informação mínima antes de criar o arquivo.
- Se uma fonte pública contradisser uma regra interna, preserve ambas e peça a decisão de produto.
- Se o PRD existente tiver IDs duplicados ou inválidos, reporte a inconsistência antes de atualizar.
