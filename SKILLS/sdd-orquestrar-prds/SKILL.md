---
name: sdd-orquestrar-prds
description: Recorte SDD quando um pedido amplo deve virar vários PRDs coesos sob um prefixo comum; para um único PRD, use sdd-criar-prd.
argument-hint: --prompt "descrição ampla" [--prefixo slug-comum]
disable-model-invocation: true
---

# Orquestrar PRDs SDD

Um pedido amplo vira um conjunto de recortes: cada recorte tem um resultado principal, um PRD próprio e uma TechSpec que cabe sem ramificar. O usuário aprova o recorte antes de qualquer PRD existir em disco.

1. **Entender o pedido e fixar o prefixo.** Levante objetivo, usuários, jornadas, superfícies, integrações, restrições e fora de escopo declarado. Consulte evidência local antes de fonte pública e marque cada obrigação como fato, premissa ou decisão de produto. Derive o prefixo em kebab-case do domínio do pedido, ou use `--prefixo` quando fornecido. Liste `tasks/prd-[prefixo]-*` já existentes e reutilize o slug correspondente quando o escopo coincidir.
   **Saída:** prefixo resolvido, inventário de obrigações com origem, e recortes já gravados identificados; peça apenas a informação ausente que impeça inventariar.
2. **Elaborar o recorte.** Agrupe as obrigações por coesão: um resultado principal por recorte, acoplamento mínimo entre recortes e escopo que uma TechSpec cubra num subsistema. Separe jornadas independentes, superfícies distintas e camadas entregáveis em ordens diferentes; mantenha unido o que compartilha o mesmo contrato e falharia sozinho. Atribua cada obrigação transversal (autenticação, observabilidade, RNF) a um recorte dono e cite-a como restrição nos demais. Numere na ordem de dependência e nomeie cada slug `[prefixo]-[NN]-[recorte]`.
   **Saída:** toda obrigação do passo 1 pertence a exatamente um recorte; cada recorte tem um só resultado principal; dependências entre recortes formam ordem sem ciclo. Recorte único é resultado válido quando o pedido tem um só resultado principal.
3. **Aprovar o recorte.** Apresente cada recorte com slug, resultado, obrigações cobertas e dependências. Use a tool de perguntas disponível (`AskUserQuestion`) ou, sem ela, pergunta textual com as mesmas opções, cada uma nomeando os slugs que produz: a divisão proposta, uma alternativa mais granular e uma mais agrupada. Confie no "Other" automático para o usuário digitar a divisão que quiser, inclusive outro prefixo. Remapeie as obrigações sobre a divisão escolhida e pergunte de novo apenas quando ela deixar obrigação sem dono ou criar ciclo.
   **Saída:** divisão aprovada na conversa e remapeada sobre o inventário; disco intacto até essa resposta.
4. **Delegar a redação.** Para cada recorte aprovado, delegue `sdd-criar-prd` com nome e caminho exatos da skill, o slug final, as obrigações e evidências daquele recorte, os slugs irmãos como limite, e a instrução de registrar dependências em `Restrições e dependências` e fronteiras em `Fora do escopo`. Envie contexto mínimo por agente: obrigações do recorte, fontes citadas e limites. Paralelize recortes sem fonte disputada; sem subagentes, redija sequencialmente pela mesma skill e informe a limitação.
   **Saída:** cada recorte aprovado tem `tasks/prd-[prefixo]-[NN]-[recorte]/prd.md` gravado, ou bloqueio com causa concreta que impede só aquele recorte.
5. **Conferir o conjunto e reportar.** Confira cobertura contra o inventário do passo 1, IDs únicos dentro de cada PRD, cada requisito funcional aparecendo num único recorte, e dependências declaradas nos dois lados. Devolva divergência ao dono do recorte antes de reportar. Reporte caminhos, ordem sugerida para `sdd-criar-techspec` e pendências herdadas dos PRDs.
   **Saída:** conjunto revisável em disco; obrigação sem dono e requisito repetido resolvidos ou explicitamente pendentes.

Leia cada fonte uma vez por versão. Em pedido que amplia um prefixo existente, preserve os PRDs gravados e trate o escopo novo como recortes adicionais a partir da próxima numeração livre.
