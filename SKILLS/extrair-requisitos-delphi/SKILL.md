---
name: extrair-requisitos-delphi
description: Explora uma funcionalidade em projetos legados Delphi e transforma o comportamento comprovado em um PRD para migracao ou portabilidade para C# com paridade funcional. Use quando for preciso investigar formularios, units, regras de negocio, banco, integracoes ou fluxos Delphi para documentar requisitos de uma feature, inclusive quando houver um sistema C# existente a comparar.
---

# Extrair requisitos de legado Delphi

Atue como orquestrador de uma investigacao orientada a evidencia. O resultado e um PRD em Markdown e, somente quando a feature usa banco de dados, um documento auxiliar de dados. Nao inclua codigo Delphi nos documentos finais.

## Preparar a investigacao

1. Localize e leia as instrucoes do repositorio antes de explorar.
2. Confirme a feature, os diretorios do legado e, se houver, do sistema C# atual. Derive um slug curto em kebab-case para o nome da feature.
3. Se objetivo, limites, versao de referencia ou destino da migracao permanecerem ambiguos depois de uma busca inicial, peca um esclarecimento conciso. Use a ferramenta de perguntas quando ela estiver disponivel.
4. Leia [references/prd-template.md](references/prd-template.md). Esse e o formato obrigatorio de entrega.

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

## Consolidar requisitos de paridade

Confronte os retornos com o codigo-fonte relevante. Registre como requisito somente comportamento sustentado por evidencia. Cubra, quando aplicavel: atores, pre-condicoes, entradas, passos, regras e calculos, persistencia, efeitos externos, apresentacao, permissoes, estados, erros, cancelamentos e casos de borda.

Quando o legado e o C# atual divergirem, descreva o comportamento de referencia necessario para a paridade, sem prescrever como codifica-lo. Quando a evidencia for insuficiente ou contraditoria, nao invente uma regra: explicite a lacuna para o usuario e solicite a decisao que muda o escopo.

## Documentar o uso do banco de dados

Crie `BANCO-DE-DADOS.md` na mesma pasta do PRD somente se a feature consultar ou alterar dados persistidos em banco, direta ou indiretamente por datasets, DAO, queries, views, functions ou procedures. Nao o crie apenas porque a aplicacao possui configuracao de conexao.

Leia [references/banco-de-dados-template.md](references/banco-de-dados-template.md) antes de redigi-lo. Preencha cada operacao com informacao suficiente para a camada de dados C# reproduzir o comportamento sem uma nova exploracao do legado: objeto de banco exato, momento e condicao de execucao, leitura ou escrita, entradas, filtros e relacionamento, saidas, alteracoes e regras transacionais. Use nomes de objetos de banco e significados de dados; nunca transcreva codigo Delphi. Registre lacunas comprovadamente inacessiveis como pendencias, sem supor seu comportamento.

## Entregar

1. Crie `./prd/prd-[nome-da-feature]/PRD.md`, substituindo o marcador pelo slug definido. Quando aplicavel, crie tambem `./prd/prd-[nome-da-feature]/BANCO-DE-DADOS.md`.
2. Preencha todas as secoes do template em portugues, com requisitos funcionais numerados (`RF1`, `RF2`, ...), historias de usuario e limites claros.
3. Mantenha o PRD orientado ao produto: nao inclua trechos de Delphi, nomes internos de units/metodos, pseudocodigo, schema ou plano tecnico de migracao.
4. Releia os arquivos gerados e confira: caminho correto, cabecalhos identicos aos templates, nenhuma lacuna inventada e cobertura dos fluxos principal e alternativos encontrados.
