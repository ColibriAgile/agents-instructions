---
name: jira-issue-description-generator
description: 'Gera descrição estruturada para chamados do Jira com base no contexto da sessão atual. Use quando o usuário pedir "Gerar descrição para tarefa do tipo <tipo>" ou simplesmente "Gerar descrição para o Jira". Inspeciona o contexto da sessão (código analisado, conversa, memória de repo) e produz uma descrição pronta para colar no Jira, seguindo o template correto para cada tipo: Bug, QA Defect, Internal Defect, Feature, Improvement, Spike, UI/UX, Deficit, Technical, Doc. Se o tipo não for informado, deduz pelo contexto. Usa sempre Markdown puro (não ADF), pois a saída é para colar manualmente.'
argument-hint: 'Ex.: "Gerar descrição para tarefa do tipo Bug" ou apenas "Gerar descrição para o Jira"'
user-invocable: true
disable-model-invocation: false
---

# Jira Issue Description Generator

## Quando usar

Use esta skill quando o usuário pedir:

- `Gerar descrição para tarefa do tipo <tipo>`
- `Gerar descrição para o Jira`
- `Criar descrição de bug/feature/spike/...`
- Qualquer variação que peça uma descrição estruturada para chamado no Jira

## O que esta skill faz

1. Lê o contexto disponível na sessão: conversa atual, código analisado, memória de repo, arquivos abertos ou referenciados.
2. Determina o **tipo da issue** — pelo argumento ou deduzido do contexto.
3. Aplica o **template correto** para o tipo determinado.
4. Gera a descrição completa em Markdown, pronta para colar manualmente no Jira.
5. Exibe o resultado como bloco de código Markdown para facilitar a cópia.

---

## Mapeamento de Tipos e Aliases

| Tipo canônico   | Aliases aceitos                                      |
|-----------------|------------------------------------------------------|
| Bug             | bug, defect, erro, falha                             |
| QA Defect       | qa defect, bug de qa, defeito de homologação         |
| Internal Defect | internal defect, defeito interno                     |
| Feature         | feature, funcionalidade, nova feature                |
| Improvement     | improvement, improvment, melhoria                    |
| Spike           | spike, investigação, poc                             |
| UI/UX           | ui, ux, ui/ux, experiência, design                   |
| Deficit         | deficit, déficit, gap                                |
| Technical       | technical, tech, técnico                             |
| Doc             | doc, documentação                                    |

---

## Templates por Tipo

### Bug

```
## Contexto
<texto corrido: origem, motivação, quando foi percebido>

## Como reproduzir
1. <passo 1>
2. <passo 2>
...
**Pré-condições:** <estado necessário>
**Massa de dados:** <dados necessários, se aplicável>
**Ambiente:** <produção / homologação / local>

## Comportamento Atual
<sintoma observável, impacto, frequência>

## Comportamento Esperado
<resultado correto, sem prescrever implementação salvo quando já restringido pela issue>

## Critérios de Aceite
- [ ] Correção verificada no ambiente <X>
- [ ] Não regressão em <fluxos relacionados>
- [ ] <validação de log / mensagem / estado persistido, quando aplicável>

## Notas Técnicas
<integrações, componentes, riscos, decisões, pontos em aberto>

## Sugestão de Story Points
<pontuação> — <justificativa curta: complexidade, risco, esforço>
```

**Diretrizes adicionais:**
- Em *Como reproduzir*, liste passos numerados, pré-condições, massa de dados e ambiente quando disponíveis.
- Em *Comportamento Atual*, descreva sintoma observável, impacto e frequência.
- Em *Comportamento Esperado*, descreva o resultado correto sem prescrever implementação, salvo quando a própria issue já restringir a solução.
- Nos critérios de aceite, inclua correção, não regressão e, quando aplicável, validação de logs, mensagens ou estados persistidos.

---

### QA Defect

```
## Contexto
<texto corrido>

## Como reproduzir
1. <passo 1>
...
**Ambiente:** <sandbox / homologação / suíte de teste>

## Evidências de QA
- **Ciclo de teste:** <nome / versão do ciclo>
- **Ambiente:** <URL ou identificação>
- **Severidade percebida:** <crítica / alta / média / baixa>
- **Casos de teste relacionados:** <IDs ou títulos>
- **Evidências:** <descrição de screenshots, logs ou registros nos comentários>

## Comportamento Atual
<sintoma observável>

## Comportamento Esperado
<resultado correto>

## Critérios de Aceite
- [ ] Reteste aprovado no ambiente de homologação
- [ ] Regressão dirigida nos fluxos adjacentes
- [ ] <critério adicional>

## Notas Técnicas
<contexto técnico relevante>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

**Diretrizes adicionais:**
- Em *Evidências de QA*, cite ciclo de teste, ambiente, evidências descritas em comentário, severidade e casos de teste relacionados.
- Priorize critérios que facilitem reteste e regressão dirigida.
- Quando houver dados de homologação, sandbox ou suíte de teste, preserve esse contexto explicitamente.

---

### Internal Defect

```
## Contexto
<texto corrido>

## Como reproduzir
1. <passo 1>
...

## Impacto Operacional
<reflexo para times internos: suporte, monitoramento, conciliação, backoffice, integrações administrativas>
**Workaround temporário (se houver):** <descrição — não é solução definitiva>

## Comportamento Atual
<sintoma>

## Comportamento Esperado
<resultado correto>

## Critérios de Aceite
- [ ] <correção verificada>
- [ ] <observabilidade / alertas verificados>
- [ ] <procedimento de mitigação documentado ou removido>

## Notas Técnicas
<riscos de recorrência, observabilidade, mitigação>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

**Diretrizes adicionais:**
- Em *Impacto Operacional*, detalhe reflexo para times internos, suporte, monitoramento, conciliação, backoffice ou integrações administrativas.
- Valorize riscos de recorrência, observabilidade e procedimentos de mitigação.
- Quando houver workaround interno, registre-o como temporário, não como solução definitiva.

---

### Feature

```
## Contexto
<texto corrido: problema, motivação, impacto, origem da demanda>

## User Story
Como <perfil>, quero <objetivo>, para <benefício>.

## Escopo Funcional
**Fluxo principal:** <descrição>
**Regras de negócio:** <lista>
**Variações relevantes:** <lista>
**Fora do escopo:** <o que não será coberto>

## Critérios de Aceite
- [ ] <cenário feliz>
- [ ] <cenário alternativo>
- [ ] <permissões / validações / mensagens>

## Notas Técnicas
<integrações, dependências, riscos, decisões, pontos em aberto>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

**Diretrizes adicionais:**
- Em *Escopo Funcional*, descreva fluxo principal, regras de negócio, variações relevantes e limites do escopo.
- Quando houver valor de negócio claro, explicite benefício esperado, público impactado e resultado desejado.
- Nos critérios de aceite, cubra cenário feliz, alternativos, permissões, validações e mensagens relevantes.

---

### Improvement

```
## Contexto
<texto corrido>

## Situação Atual
<fricção, limitação ou ineficiência existente; métricas/SLA/tempo atual se disponíveis>

## Melhoria Proposta
<ganho incremental esperado; antes/depois quando mensurável>

## Critérios de Aceite
- [ ] <critério verificável>
- [ ] <antes/depois de métrica, SLA ou experiência, quando aplicável>

## Notas Técnicas
<contexto técnico>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

---

### Spike

```
## Contexto
<texto corrido: motivação, risco ou incerteza que originou a investigação>

## Objetivo da Investigação
<o que se quer descobrir ou validar>

## Perguntas a Responder
1. <pergunta 1>
2. <pergunta 2>

## Critérios de Saída
<quando a investigação pode ser considerada concluída>

## Entregáveis Esperados
- <documento / recomendação técnica / PoC / benchmark / plano de implementação posterior>

## Notas Técnicas
<restrições, tecnologias, riscos conhecidos>

## Sugestão de Story Points
<pontuação> — <justificativa: esforço investigativo, incerteza, timebox esperado>
```

**Diretrizes adicionais:**
- Não force User Story em spikes, salvo se a issue vier explicitamente orientada a valor de usuário.
- Em *Critérios de Saída*, detalhe quando a investigação pode ser considerada concluída.
- Em *Entregáveis Esperados*, cite documento, recomendação, PoC, benchmark, riscos ou plano posterior.

---

### UI/UX

```
## Contexto
<texto corrido>

## Problema de Experiência
<fricção, confusão, inconsistência visual, acessibilidade ou quebra de jornada>

## Solução Proposta
<descrição da solução; não prescrever implementação técnica salvo quando necessário>

## Critérios de Aceite
- [ ] <usabilidade verificável>
- [ ] <acessibilidade>
- [ ] <feedback visual e consistência com design system>
- [ ] <responsividade, se aplicável>

## Referências de UX/UI
- <Figma / protótipo / guideline / componente / estado visual>

## Notas Técnicas
<contexto de implementação>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

---

### Deficit

```
## Contexto
<texto corrido>

## Gap Identificado
<o que está faltando, o que deveria existir e qual impacto essa ausência causa>

## Escopo da Correção
**O que será coberto:** <lista>
**Fora do escopo desta issue:** <lista>

## Critérios de Aceite
- [ ] <gap coberto e verificável>
- [ ] <não regressão>

## Notas Técnicas
<contexto técnico>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

---

### Technical

```
## Contexto
<texto corrido>

## Objetivo Técnico
<porquê técnico: dívida, performance, segurança, escalabilidade, manutenibilidade, observabilidade ou atualização>

## Escopo Técnico
<componentes, serviços, camadas, contratos, migrações e impactos esperados>

## Critérios de Aceite
- [ ] <evidência técnica verificável: cobertura, telemetria, performance, compatibilidade>
- [ ] <rollout seguro / feature flag / rollback, quando aplicável>

## Notas Técnicas
<decisões, riscos, dependências, pontos em aberto>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

---

### Doc

```
## Contexto
<texto corrido>

## Objetivo da Documentação
<para quem será útil e qual dor resolve>

## Escopo da Documentação
**Artefatos esperados:** <lista>
**Tópicos cobertos:** <lista>
**Formato e local de publicação:** <Confluence / README / Wiki>
**Fora do escopo:** <o que não será documentado>

## Critérios de Aceite
- [ ] <artefato publicado no local correto>
- [ ] <revisado por <perfil>>
- [ ] <critério de completude>

## Referências e Fontes
- <documentação existente, ADRs, fluxos, telas, APIs>

## Sugestão de Story Points
<pontuação> — <justificativa>
```

---

## Processo de Geração

1. **Determinar o tipo**: leia o argumento do usuário; se ausente, deduza pelo contexto da sessão (código analisado, natureza do problema discutido, memória de repo).
   - **Se o tipo foi deduzido** (não informado explicitamente), pergunte antes de gerar:
     > "Identifiquei que o tipo mais adequado para essa issue é **\<Tipo\>**. Confirma, ou prefere outro tipo?"
   - Aguarde a confirmação antes de prosseguir.
2. **Coletar contexto**: extraia da sessão os elementos relevantes — problema identificado, comportamentos observados, código envolvido, fluxos discutidos, dados de reprodução, impacto.
3. **Preencher o template**: substitua todos os placeholders com informação concreta. Omita seções sem dados apenas se explicitamente irrelevantes para o tipo.
4. **Sugerir Story Points**: use sempre a escala **Fibonacci** (1, 2, 3, 5, 8, 13, 21) como padrão, salvo quando o usuário especificar outro padrão explicitamente. Baseie a escolha em complexidade, risco, esforço e incerteza percebidos no contexto.
5. **Exibir como bloco Markdown**: envolva a saída em um bloco de código Markdown para facilitar a cópia.

### Regra de qualidade

- Nunca deixe placeholders `<...>` vazios na saída final — preencha com informação real ou omita a linha.
- Seções sem dados concretos disponíveis devem ser preenchidas com o melhor inferido do contexto, com nota `_(a confirmar)_` quando necessário.
- A saída deve ser diretamente utilizável sem edição manual de formato.
- Story Points devem sempre ser um valor da sequência Fibonacci (1, 2, 3, 5, 8, 13, 21), exceto quando o usuário especificar outro padrão.
