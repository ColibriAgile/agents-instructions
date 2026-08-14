---
name: extrair-requisitos-csharp
description: "Evidência — inspeciona aplicações C# para extrair comportamento, bibliotecas, padrões e invariantes e gerar instruções reutilizáveis de rules e guardrails para refatoração em outro sistema. Use quando uma aplicação de referência precisar ser comparada com um alvo para preservar paridade ou quando padrões comprovados precisarem ser transformados em instruções de refatoração. Não use para implementar a refatoração, revisar apenas um diff ou desenhar uma arquitetura sem evidência do código-fonte."
---

# Extrair requisitos C# para refatoração

Conduza uma investigação somente leitura, orientada por evidência, sobre uma aplicação C# de referência e um sistema-alvo. Gere regras de implementação, guardrails de preservação e um inventário de evidências para que outro agente refatore o alvo usando as mesmas bibliotecas e padrões comprovados.

## Fluxo

### 1. Fixar o contrato da extração

1. Localize a aplicação de referência, a aplicação-alvo, os diretórios autorizados e as instruções de cada repositório.
2. Leia as instruções aplicáveis ao código C#, à documentação e à stack envolvida antes de explorar.
3. Delimite o comportamento ou padrão a investigar: pontos de entrada, casos de uso, camada, bibliotecas, integrações, dados, testes e arquivos-alvo.
4. Derive um slug curto em kebab-case e adote `./refactor-guidance/[slug]/` como saída padrão. Se outro diretório de saída for exigido, registre-o antes de escrever.
5. Se fonte, alvo, escopo, globs de aplicação ou critério de paridade permanecerem ambíguos após uma busca inicial, use a ferramenta de perguntas para obter a decisão.

*Pronto quando:* fonte, alvo, escopo, globs, slug, diretório de saída e decisões pendentes estiverem explícitos.

### 2. Construir o mapa de evidências

1. Explore a aplicação de referência em modo somente leitura. Mantenha a síntese e as decisões no agente principal.
2. Delegue, no máximo, três sondagens independentes e somente leitura quando a exploração for ampla:
   - comportamento: pontos de entrada, jornada, estados, validações, efeitos e falhas;
   - stack: projetos, pacotes, versões, DI, configuração, serialização, logging, persistência e testes;
   - paridade: pontos de integração do alvo, divergências, conflitos de dependência e lacunas de validação.
3. Exija de cada sondagem achados concisos, evidências em `arquivo:linha` ou símbolo, confiança, caminhos alternativos e lacunas. Centralize a redação no agente principal.
4. Rastreie o fluxo completo: entrada, pré-condições, transformação, chamada de biblioteca, persistência ou efeito externo, saída, erro, cancelamento, repetição e concorrência quando observados.
5. Para cada biblioteca ou padrão, registre identidade, versão observada, responsabilidade, ponto de registro, modo de uso, ciclo de vida, configuração, convenções e testes que comprovam o uso.
6. Separe cada achado em `observado`, `inferido` ou `desconhecido`. Transforme em regra somente o que estiver observado ou corroborado por múltiplas evidências.

*Pronto quando:* cada comportamento, biblioteca, padrão e invariante candidato tiver evidência rastreável, confiança e classificação, cobrindo todos os fluxos relevantes encontrados.

### 3. Confrontar a referência com o alvo

1. Leia o código, projetos, pacotes, configurações, abstrações e testes do alvo no mesmo escopo.
2. Mapeie cada achado da referência para uma decisão no alvo: `adotar`, `adaptar`, `incompatível`, `não aplicável` ou `lacuna`.
3. Identifique diferenças de versão, APIs, convenções, contratos públicos, ciclo de vida, tratamento de erros, transações, cancelamento, observabilidade e cobertura de testes.
4. Converta cada divergência relevante em uma regra de adaptação ou em um guardrail que exija escalonamento antes da implementação.
5. Preserve a distinção entre paridade comprovada e escolha arquitetural nova; decisões novas ficam fora das regras extraídas e são registradas como lacunas.

*Pronto quando:* todos os achados candidatos tiverem mapeamento no alvo, toda incompatibilidade tiver impacto registrado e nenhuma premissa implícita permanecer na saída.

### 4. Redigir os documentos consumíveis pelo agente

1. Ao iniciar a redação, leia `references/output-contract.md` in full. Siga seus nomes, cabeçalhos, frontmatter, IDs e relações.
2. Grave `./refactor-guidance/[slug]/rules.instructions.md` com as regras positivas de bibliotecas, padrões, contratos, integração, testes e validação.
3. Grave `./refactor-guidance/[slug]/guardrails.instructions.md` com invariantes, limites de mudança, condições de escalonamento e gates de validação.
4. Grave `./refactor-guidance/[slug]/EVIDENCE.md` com a matriz que liga cada regra e guardrail a evidências da referência e decisões do alvo.
5. Use conteúdo em português brasileiro. Mantenha exemplos mínimos e representativos; prefira nomes de símbolos, contratos e referências de arquivo a transcrições de código.
6. Faça cada regra e guardrail declarar escopo, evidência, confiança, comportamento esperado e verificação. Use IDs estáveis `R1...` para regras, `G1...` para guardrails e `E1...` para evidências.

*Pronto quando:* os três arquivos existirem no diretório correto, seguirem integralmente o contrato, tiverem frontmatter válido e cada `R` ou `G` apontar para pelo menos um `E`.

### 5. Auditar a entrega

1. Releia os três documentos gerados e confronte cada afirmação com a matriz de evidências.
2. Remova prescrições sem suporte, versões não comprovadas, duplicações e qualquer regra que misture comportamento observado com arquitetura inventada.
3. Confirme que `rules.instructions.md` e `guardrails.instructions.md` podem ser copiados para `.github/instructions/` do alvo sem perder o `applyTo`.
4. Registre em `EVIDENCE.md` toda lacuna que impeça comprovar comportamento, dependência ou compatibilidade; associe a ela o impacto e a decisão necessária.

*Pronto quando:* cada afirmação normativa for rastreável, os documentos forem aplicáveis ao escopo declarado e todas as lacunas relevantes estiverem explícitas.

## Guardrails da própria extração

- Mantenha a exploração somente leitura; a única escrita da execução são os documentos gerados.
- Baseie regras em evidência verificável e marque inferências como inferências.
- Preserve o comportamento observado, incluindo falhas, cancelamentos, efeitos colaterais e semântica de repetição.
- Escalone conflitos de biblioteca, versão ou contrato em vez de escolher silenciosamente um substituto.
- Use as referências exatas de banco, configuração, pacote e símbolo; abstrações genéricas não substituem a proveniência.
