---
name: extrair-requisitos-delphi
description: Extracao de requisitos Delphi para PRD de paridade em C#. Use ao investigar uma feature legada ou comparar seu comportamento com o C# existente. Nao use para definir arquitetura ou implementar a migracao.
---

# Extrair requisitos de legado Delphi

Atue como orquestrador de uma investigacao orientada a evidencia. O resultado e um PRD em Markdown e, somente quando a feature usa banco de dados, um documento auxiliar de dados. Nao inclua codigo Delphi nos documentos finais.

## Preparar a investigacao

1. Localize e leia as instrucoes do repositorio antes de explorar.
2. Identifique a feature, os diretorios do legado e, se houver, do sistema C# atual. Derive um slug curto em kebab-case e resolva `tasks/prd-[slug]/prd.md` no repositorio de destino. Se existir, reutilize sem sobrescrever; atualize apenas quando autorizado, preservando IDs e secoes inalterados.
3. Se objetivo, limites, versao de referencia ou destino da migracao permanecerem ambiguos depois de uma busca inicial, peca um esclarecimento conciso. Use a ferramenta de perguntas quando ela estiver disponivel.

**Saida:** feature, fontes, slug, destino e operacao definidos; ambiguidades bloqueantes identificadas.

## Delegar a exploracao

Mantenha a sintese e as decisoes no agente principal. Delegue a leitura intensiva a subagentes economicos, preferencialmente `gpt-5.6-luna`, com tarefas independentes e somente leitura. Use `spawn_agent` com contexto minimo (`fork_turns="none"` quando suficiente), no maximo tres sondagens simultaneas.

Distribua apenas as sondagens necessarias dentre estas frentes:

- pontos de entrada: menus, formularios, eventos, units e chamadas que iniciam o fluxo;
- jornada e regras: telas, estados, campos, validacoes, permissoes, calculos e mensagens;
- dados e efeitos: tabelas, consultas, arquivos, impressoes, integracoes, transacoes e efeitos colaterais;
- paridade e bordas: diferencas no C# atual, falhas, cancelamentos, dados ausentes, repeticao e comportamentos legados implicitos.

Forneca a cada subagente: objetivo delimitado, diretorios autorizados, termos conhecidos e a pergunta a responder. Exija retorno conciso contendo achados, evidencias (`arquivo:linha` ou simbolo), caminhos alternativos e lacunas. Nao permita alteracoes, conclusoes arquiteturais ou redacao do PRD pelos subagentes.

Se houver acesso efetivo ao banco pela feature, delegue tambem uma sondagem de dados. Ela deve levantar cada tabela, view, function e procedure, operacao e ordem de uso, parametros e seus significados, campos retornados ou alterados, filtros, joins, transacoes, geracao de chaves, regras de integridade, efeitos colaterais, erros e permissoes observaveis.

Exemplo de pedido:

> Explore somente os pontos de entrada e a jornada de [feature] em [caminho]. Identifique eventos, telas, transicoes, validacoes visiveis e mensagens. Retorne achados com `arquivo:linha`, incluindo fluxos alternativos; nao modifique arquivos nem proponha implementacao.

**Saida:** cada frente aplicavel tem achados com evidencias e lacunas explicitas. Se subagentes estiverem indisponiveis, execute as mesmas sondagens no agente principal.

## Consolidar requisitos de paridade

Confronte os retornos com o codigo-fonte relevante. Registre como requisito somente comportamento sustentado por evidencia. Cubra, quando aplicavel: atores, pre-condicoes, entradas, passos, regras e calculos, persistencia, efeitos externos, apresentacao, permissoes, estados, erros, cancelamentos e casos de borda.

Quando o legado e o C# atual divergirem, descreva o comportamento de referencia necessario para a paridade, sem prescrever como codifica-lo. Quando a evidencia for insuficiente ou contraditoria, nao invente uma regra: explicite a lacuna para o usuario e solicite a decisao que muda o escopo.

**Saida:** fluxos principal e alternativos cobertos; cada comportamento tem fonte, e cada divergencia tem referencia definida ou decisao pendente. Separe fatos comprovados, premissas e decisoes de produto em `Premissas e fontes`; use links para evidencias locais e registre metricas ou limites desconhecidos como pendencias.

## Documentar o uso do banco de dados

Crie `BANCO-DE-DADOS.md` na mesma pasta do PRD somente se a feature consultar ou alterar dados persistidos em banco, direta ou indiretamente por datasets, DAO, queries, views, functions ou procedures. Nao o crie apenas porque a aplicacao possui configuracao de conexao.

Leia integralmente [references/banco-de-dados-template.md](references/banco-de-dados-template.md) antes de redigi-lo. Preencha cada operacao com informacao suficiente para a camada de dados C# reproduzir o comportamento sem uma nova exploracao do legado. Registre lacunas comprovadamente inacessiveis como pendencias, sem supor seu comportamento.

**Saida:** todas as operacoes encontradas estao documentadas nos campos do template, ou a ausencia de acesso ao banco esta comprovada.

## Entregar

1. Antes de redigir o PRD, leia integralmente [o template padrao de sdd-criar-prd](../sdd-criar-prd/assets/prd.template.md), fonte unica de sua estrutura. Essa skill irma deve estar disponivel junto desta; se o arquivo estiver ausente, informe a dependencia faltante e solicite seu caminho antes de gerar o PRD.
   **Saida:** template canonico carregado, sem criar um formato alternativo.
2. Preencha em portugues todas as secoes aplicaveis, preservando titulos, ordem e colunas do template; siga suas instrucoes para secoes opcionais. Use IDs unicos e estaveis `OBJ-01`, `US-01`, `RF-01` e `RNF-01`, com aceite observavel para cada requisito. Mantenha o PRD orientado ao produto; detalhes de implementacao pertencem a TechSpec, e objetos de banco ao documento auxiliar. Referencie esse auxiliar em `Premissas e fontes` quando existir.
   **Saida:** estrutura padrao preenchida e gate de aceite conferido; lacunas e itens do gate ainda nao satisfeitos explicitamente pendentes.
3. Grave o PRD no destino definido na preparacao e, quando aplicavel, o auxiliar na mesma pasta. Releia os artefatos para verificar estrutura, IDs, aceite e cobertura contra as evidencias consolidadas.
   **Saida:** arquivos revisaveis em disco; reporte links, pendencias e obrigacoes adicionadas, alteradas ou removidas. Aponte derivados a revalidar sem edita-los; no fluxo SDD, devolva o PRD para HIL de produto.

## Integracao

Ao configurar a apresentacao da skill no Codex, use [agents/openai.yaml](agents/openai.yaml).
