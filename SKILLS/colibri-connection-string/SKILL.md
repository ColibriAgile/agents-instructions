---
name: colibri-connection-string
description: >-
  Configuração de conexões — Use when a tarefa precisar incluir ou refatorar a obtenção de strings SQL Server ou PostgreSQL por arquivos de configuração do sistema, integrar CoLib.Ambiente ou CoLib.Db em _lib, ou preservar precedência, DI, erros e testes conforme as referências empacotadas nesta skill. Don't use for criar uma arquitetura nova de configuração, trocar provedor sem requisito explícito, ou alterar pooling e retry sem relação com a obtenção da conexão.
---

# Configuração de strings de conexão

## Steps

**Step 1: Classificar o fluxo**

1. Identificar se a tarefa inclui uma nova obtenção de conexão ou refatora um fluxo existente.
2. Delimitar o provedor (`Microsoft.Data.SqlClient` ou `Npgsql`), a aplicação-alvo, as fontes de configuração, os overrides, a composição de DI e os testes afetados.
3. Quando PostgreSQL não for requisito explícito, preservar o fluxo SQL Server e registrar a necessidade de decisão antes de introduzir dependências ou contratos PG.

*Done when:* todos os projetos, arquivos, provedores e decisões comportamentais afetados estiverem listados, sem ambiguidade sobre a necessidade de PostgreSQL.

**Step 2: Carregar o contrato de paridade**

1. Quando a tarefa tocar a obtenção de uma conexão, ler `references/rules.instructions.md` e `references/guardrails.instructions.md` em full antes de editar.
2. Quando surgir uma divergência de versão, formato, erro, ciclo de vida ou contrato, ler `references/EVIDENCE.md` em full e associar a decisão aos IDs de evidência.
3. Transformar lacunas não resolvidas em escalonamento explícito, mantendo separadas a paridade observada e qualquer escolha arquitetural nova.

*Done when:* cada decisão de implementação estiver ligada a regras e guardrails aplicáveis, e cada lacuna tiver impacto e decisão necessária registrados.

**Step 3: Rastrear a implementação atual**

1. Inspecionar `CoLib.Ambiente.ConfiguracoesDeAmbiente` em `_lib` como fronteira de leitura da instalação.
2. Para SQL Server, confirmar o consumo de `InfoDeConexaoPOS`, `Microsoft.Data.SqlClient`, a precedência de linha de comando → `string_conexao` → arquivos do sistema e o contrato de DI já usado pelo alvo.
3. Para PostgreSQL, confirmar `InfoDeConexaoPG`, `CoLib.Db.PGSql` e `NpgsqlConnection`; tratar a ausência desses componentes no alvo como lacuna, não como autorização para substituição.
4. Rastrear entrada, parsing, descriptografia, composição da string, criação/abertura, descarte, retry, erros, cache e testes.

*Done when:* o fluxo completo de cada provedor estiver descrito do arquivo de configuração ao objeto de conexão, incluindo consumidores existentes e efeitos de erro.

**Step 4: Implementar a mudança**

1. Encaminhar a leitura para `CoLib.Ambiente` e reutilizar `InfoDeConexaoPOS` ou `InfoDeConexaoPG`; manter o parsing de arquivos fora de controllers, repositórios e fixtures.
2. Manter a precedência e o contrato SQL Server existentes; a seção `ConnectionStrings` de `appsettings.json` só entra mediante decisão contratual explícita.
3. Com requisito PG confirmado, usar `CoLib.Db.PGSql` e `NpgsqlConnection` com os campos `Host`, `Port`, `Username`, `Password`, `Database` e `Timeout`; manter esse caminho separado de strings ODBC.
4. Preservar DI, retry, abertura padrão, descarte pelo chamador, cache de configuração e semântica de erros; manter credenciais fora do código e dos arquivos versionados.
5. Atualizar testes de precedência, configuração, registro de provider e abertura de conexão conforme o provedor alterado.

*Done when:* o código alterado reutilizar as bibliotecas internas, não duplicar o parser, conservar os consumidores existentes e possuir teste ou escalonamento para cada comportamento afetado.

**Step 5: Validar e auditar**

1. Antes de buscas ou inspeção de diff, invocar `repository-cli-efficiency`; restringir a inspeção aos projetos afetados.
2. Antes de executar `dotnet build`, `dotnet test`, `dotnet publish` ou `dotnet run`, invocar `dotnet-efficient-validation` e usar o menor comando direcionado que cubra a mudança.
3. Separar falhas de ambiente de banco das falhas de código, preservando a mensagem e o contexto necessários para diagnóstico.
4. Auditar cada arquivo, pacote, chave de configuração, registro DI, teste e mudança de comportamento contra as regras, guardrails e evidências carregados.

*Done when:* a validação direcionada passa ou apresenta falha classificada, todos os arquivos modificados estão auditados e nenhuma divergência sem decisão permanece.

## Reference — tripwires operacionais

- `CoLib.Ambiente` é a fonte de configuração do sistema: Master usa `master/config/ncrmaster.cfg`; cliente usa `client/config/launcher.boot` e `client/config/launcher.conexao`.
- SQL Server usa `InfoDeConexaoPOS` e `Microsoft.Data.SqlClient`; PostgreSQL usa `InfoDeConexaoPG`, `CoLib.Db.PGSql` e `Npgsql` quando o requisito estiver confirmado.
- O alvo atual preserva a precedência linha de comando → `string_conexao` → configuração externa e expõe `Func<DbConnection>`; alterações devem manter esse contrato.
- Quando os detalhes de formato, versão ou falha forem necessários para decidir a implementação, retornar a `references/EVIDENCE.md` em full em vez de inferir.

## Error Handling

- Quando as instruções ou evidências não estiverem disponíveis, sinalizar a ausência e manter o código inalterado até o contrato ser recuperado.
- Quando o alvo não tiver PostgreSQL, solicitar ou registrar a decisão sobre dependência, DI, formato e testes antes de adicionar o provedor.
- Quando versões, APIs ou formatos divergirem da referência, preservar o caminho comprovado e escalar a incompatibilidade antes de escolher substituto.
- Quando a configuração base estiver ausente ou inválida, preservar a semântica observada e cobrir o caso em teste; mudanças no tratamento de JSON suprimido exigem decisão explícita.
