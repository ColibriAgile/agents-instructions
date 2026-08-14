---
name: colibri-logging
description: Logs — Use quando o agente adiciona, refatora ou padroniza o logging de aplicação C# para o padrão Colibri. Não use para decisões que substituam a pilha de logging, retenção ou política de segurança de payload.
---

# Logs Colibri

Torne toda alteração de logging rastreável pelo log viewer: descrição curta antes do primeiro `|`, detalhes estruturados depois dele e configuração centralizada em `CoLib.Logging`.

## Fluxo

**Etapa 1: Fixar a paridade**

1. Leia `references/rules.md` e `references/guardrails.md` integralmente antes de editar.
2. Localize o ponto de entrada, os projetos referenciados, os `ILogger` envolvidos e os testes do fluxo afetado.
3. Quando a alteração envolver uma exceção, divergência de versão, payload sensível, logger temporário ou uma dúvida de precedência, leia `references/evidence.md` integralmente.
4. Classifique a alteração como bootstrap da aplicação, classe com DI, biblioteca sem DI, mensagem existente, payload HTTP ou teste.

*Concluído quando:* cada arquivo alterado e cada ponto de configuração/teste impactado está classificado, e toda exceção de paridade está identificada.

**Etapa 2: Paralelizar a implementação**

1. Separe o plano em superfícies sem arquivos compartilhados: configuração de host (`Program.cs`, `.csproj`), chamadas de logging de produção e testes.
2. Quando existirem duas ou mais superfícies independentes, inicie em uma única rodada paralela até três subagentes especializados:
   - configuração: bootstrap, DI, pasta, subpasta, `.logc` e configuração externa;
   - escrita: mensagens, exceções, propriedades estruturadas e payloads;
   - testes: `CoLib.Logging.Fake`, middleware e clientes HTTP.
3. Dê a cada subagente os arquivos exclusivos, as regras e guardrails aplicáveis, e o conteúdo integral de `references/rules.md` e `references/guardrails.md`.
4. Exija de cada subagente: alterações somente nos arquivos atribuídos, decisões escaladas, validação tentada e um relatório com arquivos modificados, regras R/G atendidas, resultado da validação e bloqueios.
5. Execute centralmente as superfícies sobrepostas ou dependentes e retenha a decisão sobre bibliotecas, versões, retenção, rotação, segurança de payload e exceções operacionais.
6. Reúna os resultados, resolva dependências e confirme que cada arquivo teve um único responsável por escrita.
7. Quando um subagente falhar ou relatar bloqueio, retome centralmente o seu escopo exclusivo mantendo as mesmas regras e guardrails.

*Concluído quando:* cada frente independente teve proprietário exclusivo, os resultados foram integrados e toda decisão transversal permaneceu centralizada.

**Etapa 3: Aplicar o padrão**

1. Ao adicionar os pacotes da tabela de `references/rules.md`: se já existirem no projeto-alvo, mantenha a versão instalada; se ainda não existirem, adicione a versão estável mais recente disponível no feed. Nunca force upgrade/downgrade só para bater com a versão observada na referência.
2. Aplique R1 e R10 para o bootstrap, DI ou biblioteca sem DI conforme a classificação da etapa anterior.
3. Aplique R2, R3 e R4 para pasta, subpasta, arquivo diário `.logc` e configuração externa.
4. Aplique R5, R6 e R7 a toda mensagem nova ou refatorada: descrição antes do primeiro `|`, detalhes estruturados depois dele e exceção no overload de logging.
5. Aplique R8 quando o escopo tocar template, níveis ou campos do arquivo.
6. Aplique R9 e R12 para pipeline ASP.NET, bodies HTTP ou payloads de integração.
7. Preserve os invariantes G1-G8 e G10, e escale cada condição listada em `references/guardrails.md`.

*Concluído quando:* cada regra aplicável foi executada e cada invariante aplicável foi preservado ou escalado.

**Etapa 4: Provar o loop**

1. Revise o diff para confirmar nome de arquivo, pasta, `OutputTemplate`, nível, structured logging e overload de exceção.
2. Para código que usa `LibLoggerFactory`, teste os eventos com `CoLib.Logging.Fake` e `SetupFakeLogger<T>()`.
3. Para middleware ou clientes HTTP, preserve ou amplie os testes existentes de body JSON, omissão de HTML, redação e truncamento.
4. Execute a menor validação existente que cubra o componente alterado.
5. Escale a mudança quando ela alterar bibliotecas, versões, retenção, rotação, extensão `.logc`, template, subpasta, dados sensíveis ou exceções operacionais.

*Concluído quando:* cada alteração passa pela validação aplicável e toda decisão fora da paridade está escalada em vez de ser escolhida implicitamente.
