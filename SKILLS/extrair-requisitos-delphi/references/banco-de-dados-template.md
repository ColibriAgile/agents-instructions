# Uso de Banco de Dados — [Nome da feature]

## Escopo

[Descrever quais partes da feature usam dados persistidos, qual a origem de dados e quando o acesso ocorre.]

## Objetos de banco utilizados

| Objeto | Tipo | Finalidade na feature | Operacoes |
| --- | --- | --- | --- |
| [nome] | [tabela/view/function/procedure] | [finalidade] | [leitura/inclusao/alteracao/exclusao] |

## Operacoes de dados

### [Nome da operacao]

- Disparo e pre-condicoes: [acao ou estado que a executa]
- Objetos e ordem de acesso: [objetos de banco, incluindo dependencias]
- Acao: [consulta/inclusao/alteracao/exclusao]
- Entradas: [parametro, significado de negocio, tipo/formato, obrigatoriedade e valor especial]
- Selecao e relacionamento: [filtros, joins, ordenacao, agrupamento e regras de vigencia]
- Saidas: [campos retornados ou alterados, significado, tipo/formato, nulidade e mapeamento esperado]
- Efeitos e integridade: [chaves geradas, defaults, constraints, triggers, atualizacoes derivadas e auditoria]
- Transacao e concorrencia: [fronteiras, locks, confirmacao/cancelamento e comportamento em repeticao]
- Falhas e permissoes: [erros tratados, mensagens/resultados e autorizacao necessaria]

## Regras transversais

[Documentar transacoes que abrangem mais de uma operacao, regras de consistencia, formatos de data/valor, isolamento, dados sensiveis e retencao, quando evidenciados.]

## Lacunas e dependencias externas

[Listar somente comportamentos que a exploracao nao conseguiu comprovar, com o impacto para a implementacao C#.]
