---
applyTo: "**/*.cs"
---

# Regras extraídas: obtenção de strings de conexão por configuração do sistema

Esta referência acompanha a skill `colibri-connection-string`.

## Contexto

- Aplicação de referência: submódulo `_lib` (`dotnet-lib`), commit `292303d27449e5d6d21ee94a521cf4491070f21b`, branch `master-64-g292303d2`.
- Aplicação-alvo: `ColibriAgile/pos-integration-service`, commit `adf01a1e044210b643bccdfb16d494ced3c8e667`, branch `master`.
- Escopo: leitura de configuração externa e obtenção de conexões SQL Server e PostgreSQL, incluindo registro de provedores, precedência no serviço e testes.
- Objetivo de paridade: usar os arquivos de configuração do sistema e as bibliotecas internas comprovadas, conservar o contrato SQL Server existente e evitar confundir strings ODBC com a conexão Npgsql.

## Bibliotecas e créditos

| Biblioteca ou pacote | Versão observada | Papel | Uso comprovado no alvo |
| --- | --- | --- | --- |
| `CoLib.Ambiente` | Projeto `net10.0`; versão do submódulo | Lê `ncrmaster.cfg`, `launcher.boot` e `launcher.conexao` e expõe `InfoDeConexaoPOS`/`InfoDeConexaoPG` | Adotado pelo serviço por meio de `ConfiguracoesDeAmbiente.InfoDeConexaoPOS`; PG ainda é lacuna |
| `CoLib.Criptografia` | Não determinada nesta extração | Descriptografa senhas armazenadas na configuração Master | Indiretamente adotado por `CoLib.Ambiente`; não duplicar a descriptografia |
| `CoLib.Db` | Shared Project | Resolve o banco (`Banco.POS` ou `Banco.PgSql`), cria e abre conexões e define o contrato de descarte pelo chamador | O alvo usa seu próprio `Conexao`; adotar apenas quando o contrato for compatível |
| `CoLib.Db.SqlServer` | Shared Project | Registra `MsSql` como `SqlConnection` | O alvo já referencia o Shared Project SQL Server |
| `CoLib.Db.PGSql` | Shared Project | Registra `Npgsql` como `NpgsqlConnection` | Não referenciado pelo alvo; adicionar somente com requisito explícito de PG |
| `CoLib.Colibri` / `ProvedorDeConfiguracoesDoAmbiente` | Shared Project | Oferece instância cacheada de `ConfiguracoesDeAmbiente` | Alternativa comprovada; usar somente quando o ciclo de vida cacheado for desejado |
| `Microsoft.Data.SqlClient` | `7.0.2` | Driver SQL Server e `SqlConnectionStringBuilder` | Adotado pelo alvo e pela referência |
| `Npgsql` | `10.0.3` observado em consumidores da referência | Driver PostgreSQL e `NpgsqlConnection` | Ausente no alvo; sua adoção é uma adaptação condicionada ao requisito PG |
| `CoLib.Polly.SqlServer` | Versão do Shared Project | Resiliência/retry da conexão SQL Server no serviço | Adotado pelo alvo no caminho `ResilientDbConnection` |

## Regras de implementação

### R1 — Centralizar a leitura da configuração nos componentes internos de ambiente

- Regra: obter os dados de conexão por `ConfiguracoesDeAmbiente`, preferencialmente por `InfoDeConexaoPOS` para SQL Server e `InfoDeConexaoPG` para PostgreSQL. Não duplicar o parsing dos arquivos do sistema em controllers, repositórios ou fixtures.
- Aplicabilidade: qualquer código C# que precise descobrir uma conexão a partir da instalação do POS/Master.
- Evidência: E1, E2, E3.
- Confiança: alta.
- Verificação: inspeção confirma uma única fronteira de leitura em `CoLib.Ambiente`; testes de integração conseguem resolver a conexão sem uma segunda implementação de parser.

### R2 — Respeitar os arquivos, seções, chaves e defaults comprovados

- Regra: para a instalação Master, ler `master\config\ncrmaster.cfg`, usando as seções `Banco` para SQL Server e `BancoPG` para PostgreSQL; para a instalação cliente/Launcher, exigir `client\config\launcher.boot` e consultar `client\config\launcher.conexao` com as propriedades `portas`, `dados_conexao` e `dados_pgsql`. Preservar os defaults observados: host SQL `localhost`, banco SQL POS `ncrcolibri`, banco PG `ncrsolution`, usuário PG Master `ncrmaster` e porta PG `4500`.
- Aplicabilidade: implementação ou refatoração de `CoLib.Ambiente` e seus consumidores.
- Evidência: E3, E4, E5.
- Confiança: alta para os formatos e defaults observados.
- Verificação: teste ou inspeção de configuração comprova as chaves e os defaults sem introduzir nomes paralelos.

### R3 — Usar a string SQL Server canônica da biblioteca, sem remontagem local

- Regra: consumir a string produzida por `InfoDeConexaoPOS` e pelo `SqlConnectionStringBuilder` interno. Preservar catálogo/banco, `MultipleActiveResultSets`, `TrustServerCertificate=true`, autenticação integrada quando `UsuarioSql` estiver vazio e a normalização de host local para `tcp:<host>,1433`.
- Aplicabilidade: conexões SQL Server do serviço, bibliotecas de dados e testes de integração.
- Evidência: E4, E6.
- Confiança: alta.
- Verificação: a conexão criada usa `Microsoft.Data.SqlClient.SqlConnection`; testes validam o servidor, catálogo e propriedades relevantes sem reconstruir a string em outro componente.

### R4 — Usar uma conexão Npgsql para PostgreSQL

- Regra: quando houver requisito explícito de PG, usar `InfoDeConexaoPG` com `NpgsqlConnection` e o registro de `CoLib.Db.PGSql`. A string canônica deve representar `Host`, `Port`, `Username`, `Password`, `Database` e `Timeout=30`, seguindo o `DbConnectionStringBuilder` observado na referência e não uma string ODBC.
- Aplicabilidade: somente fluxos PostgreSQL novos ou refatorados.
- Evidência: E5, E7, E8.
- Confiança: alta para a biblioteca e os campos; média para qualquer adaptação ainda não existente no alvo.
- Verificação: teste de composição e abertura confirma que o tipo concreto é `NpgsqlConnection` e que a porta, banco e timeout chegam ao driver.

### R5 — Manter a precedência de configuração já adotada pelo serviço

- Regra: no serviço atual, preservar a precedência `argumento de linha de comando` → variável de ambiente de processo `string_conexao` → `ConfiguracoesDeAmbiente.InfoDeConexaoPOS.connString`. Não introduzir `appsettings.json` como fonte concorrente para o banco sem uma mudança contratual explícita.
- Aplicabilidade: `Pos.Integration.Service/Source/Dados/Conexao.cs` e pontos de composição equivalentes.
- Evidência: E9, E10, E11.
- Confiança: alta.
- Verificação: testes de precedência cobrem cada fonte isoladamente e confirmam que a configuração do sistema continua sendo o fallback operacional.

### R6 — Preservar a fronteira de DI do serviço ao adicionar um novo provedor

- Regra: manter `Conexao` como singleton e `Func<DbConnection>` para os consumidores SQL/POS existentes. Se PG for introduzido, adicionar uma fábrica ou abstração explícita por provedor sem substituir silenciosamente o contrato SQL atual; registrar os provedores uma única vez durante a inicialização.
- Aplicabilidade: `Startup`, composição de serviços e `CoLib.Db`/Shared Projects.
- Evidência: E7, E12, E13.
- Confiança: alta para o contrato atual; média para a forma de extensão PG.
- Verificação: testes de composição resolvem o contrato SQL existente e o novo contrato PG separadamente, sem registro tardio ou troca global de fábrica.

### R7 — Manter o ciclo de vida e a responsabilidade pela conexão

- Regra: considerar que `DadosDeConexao.ObterConexao[Async]` abre a conexão por padrão e que o chamador é responsável por descartá-la. Não criar um cache global de conexões abertas. A configuração é carregada na construção de `ConfiguracoesDeAmbiente`; o provedor cacheado não faz reload automático.
- Aplicabilidade: serviços de dados, factories e integrações que usam as bibliotecas internas.
- Evidência: E7, E14.
- Confiança: alta.
- Verificação: testes usam `using`/`await using` no chamador e uma alteração de arquivo só passa a valer após o ciclo de vida esperado, normalmente reinício do processo.

### R8 — Cobrir a obtenção da conexão no nível da configuração e do provedor

- Regra: testes SQL devem seguir o padrão de `DbFixture`: ler `DbName`, `DbPassword`, `DbUser` e `DbServer` de variável de ambiente do usuário antes da variável do processo, permitir banco nomeado ou temporário e injetar a factory do serviço. Se PG for adotado, acrescentar testes para precedência, arquivos inválidos/ausentes, registro Npgsql e abertura da conexão.
- Aplicabilidade: `Pos.Integration.Service.Testes` e testes das bibliotecas compartilhadas.
- Evidência: E15, E16.
- Confiança: alta para o padrão SQL observado; média para a cobertura PG necessária no alvo.
- Verificação: testes de integração exercitam a configuração real ou fixture temporário sem credenciais versionadas.

## Padrões observados

- A configuração externa é descoberta pela biblioteca de ambiente, não pela seção `ConnectionStrings` do ASP.NET.
- Senhas do arquivo Master passam por `CoLib.Criptografia.Descriptografar`.
- As factories de SQL e PG são registradas por `ModuleInitializer` em registros estáticos dos Shared Projects.
- `ConfiguracoesDeAmbiente` aceita portas como número ou texto conversível para `int`, e o JSON do Launcher é lido sem distinção de maiúsculas/minúsculas.
- `CoLib.Payment.Conexao` possui fallback PG local específico do componente; esse fallback não é o padrão geral e não deve ser propagado.

## Integrações e configuração

- Master: `master\config\ncrmaster.cfg`, com `Banco` e `BancoPG`.
- Cliente: `client\config\launcher.boot` e, quando disponível, `client\config\launcher.conexao`.
- SQL Server: `CoLib.Db.SqlServer`/`Microsoft.Data.SqlClient`.
- PostgreSQL: `CoLib.Db.PGSql`/`Npgsql`; o alvo ainda precisa de uma decisão explícita para adotar essa combinação.
- Serviço atual: `Startup` registra a conexão SQL e a expõe por `Func<DbConnection>`; `Conexao` aplica a política de retry SQL.

## Validação

1. Confirmar que a fonte de configuração continua sendo `CoLib.Ambiente`, sem parser paralelo ou nova precedência implícita.
2. Confirmar que SQL Server continua usando `Microsoft.Data.SqlClient 7.0.2`, a string canônica e a política de retry existente.
3. Se PG for incluído, confirmar a dependência `Npgsql`, o registro `CoLib.Db.PGSql`, a string compatível com Npgsql e testes de abertura.
4. Executar os testes direcionados de configuração, DI e integração sem versionar segredos.
