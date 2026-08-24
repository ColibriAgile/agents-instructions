---
name: sdd-criar-techspec
description: TechSpec de uma feature com PRD existente; não cria requisitos de produto nem tasks.
argument-hint: --prd nome-da-feature [--atualizar]
---

# Criar TechSpec SDD

Defina como satisfazer o PRD usando a arquitetura e os padrões reais do projeto. Referencie obrigações em vez de copiá-las.

## Steps — especificação

**Step 1: Fixar PRD e destino**

1. Resolva `--prd` pelo argumento ou contexto e exija `tasks/prd-[slug]/prd.md`.
2. Leia o PRD integralmente uma vez.
3. Resolva `tasks/prd-[slug]/techspec.md`. Se existir sem `--atualizar`, preserve-o e informe o caminho; com `--atualizar`, leia-o depois do PRD e preserve IDs de decisões inalteradas.

*Done when:* o PRD está carregado e a operação é criação ou atualização explícita sem risco de sobrescrita.

**Step 2: Inventariar obrigações técnicas**

1. Extraia em uma passagem requisitos, métricas, restrições, dependências, fora de escopo e critérios de aceite.
2. Associe cada obrigação a evidência técnica esperada e marque lacunas que alterem arquitetura ou contrato.

*Done when:* toda obrigação do PRD possui consequência técnica ou pendência explícita.

**Step 3: Explorar somente o necessário**

1. Inspecione instruções do repositório, módulos afetados, callers, contratos, configuração, persistência, erros, testes e infraestrutura existentes.
2. Reuse padrões e dependências já instalados quando satisfizerem o contrato; proponha elemento novo somente com lacuna comprovada.
3. Consulte documentação primária apenas para bibliotecas, protocolos ou serviços realmente envolvidos.
4. Separe evidência, premissa e decisão. Pergunte ao usuário somente sobre limite de domínio, trade-off ou contrato que a exploração não resolve.

*Done when:* cada componente novo ou modificado possui localização, responsabilidade, integração e evidência no código atual ou justificativa para ser criado.

**Step 4: Redigir decisões e verificações**

1. Leia `assets/techspec.template.md` desta skill na íntegra.
2. Preserve IDs do PRD e use IDs estáveis como `DEC-01`, `CMP-01` e `TC-01` para itens técnicos.
3. Inclua somente seções aplicáveis: dados, endpoints, UI, persistência, migração, integração, segurança, observabilidade e rollout.
4. Especifique erros, bordas, rollback e testes proporcionais ao risco e ao padrão do projeto; não imponha porcentagem universal de cobertura.
5. Em atualização, mantenha decisões estáveis e liste impactos sobre tasks existentes.

*Done when:* toda obrigação do PRD está coberta por decisão e teste, cada componente foi especificado e seções irrelevantes foram removidas.

**Step 5: Gravar e reportar impacto**

1. Crie ou atualize somente `tasks/prd-[slug]/techspec.md` conforme autorizado.
2. Informe o caminho, as decisões principais, pendências e tasks que precisam ser replanejadas.

*Done when:* a TechSpec existe no destino correto e qualquer plano invalidado foi reportado sem alteração silenciosa.

## Error Handling

- Se faltar PRD, direcione para `sdd-criar-prd`.
- Se código, PRD e documentação externa divergirem, preserve a evidência e solicite a decisão mínima.
- Se uma decisão não puder receber teste, observação ou rollback proporcional ao risco, registre-a como pendente.
- Se a TechSpec existente tiver IDs ou contratos contraditórios, reconcilie-os antes de atualizar.
