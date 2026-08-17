# Evidências da extração: obtenção de strings de conexão por configuração do sistema

Estas evidências acompanham a skill `colibri-connection-string`.

## Fontes e escopo

- Referência: submódulo `_lib` (`dotnet-lib`), commit `292303d27449e5d6d21ee94a521cf4491070f21b`, branch `master-64-g292303d2`.
- Alvo: `ColibriAgile/pos-integration-service`, commit `adf01a1e044210b643bccdfb16d494ced3c8e667`, branch `master`.
- Investigação: obtenção de strings SQL Server e PostgreSQL por arquivos de configuração do sistema, integração das bibliotecas internas, DI, precedência, erros e testes.
- Data da extração: 2026-08-14.

## Matriz de evidências

| ID | Afirmação sustentada | Localização na referência | Observação | Confiança | Mapeamento no alvo |
| --- | --- | --- | --- | --- | --- |
| E1 | O sistema de referência é o submódulo compartilhado `_lib` | `_lib/.gitmodules`; `git submodule status` | [observado] URL `dotnet-lib`; revisão `292303d...` presente na árvore atual | alta | Contexto de R1, G1 |
| E2 | O serviço atual é o alvo da extração | `Pos.Integration.Service/Pos.Integration.Service.csproj`; commit `adf01a1...` | [observado] serviço ASP.NET Core e testes estão no repositório principal | alta | Contexto de R1, G1 |
| E3 | `ConfiguracoesDeAmbiente` lê os arquivos do sistema e expõe dados POS/PG | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:34-42,289-309,337-359,415-452` | [observado] Master usa `ncrmaster.cfg`; cliente usa `launcher.boot` e `launcher.conexao`; JSON é case-insensitive | alta | R1, R2, G1 |
| E4 | A string SQL usa `SqlConnectionStringBuilder` e propriedades específicas | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:121-154,165-188` | [observado] MARS, certificado confiado, autenticação integrada sem usuário e normalização TCP para host local | alta | R2, R3, G2 |
| E5 | A string PG possui campos e defaults próprios | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:137-145,207-234,276-279,403-412` | [observado] `Host`, `Port`, `Username`, `Password`, `Database`, `Timeout=30`; defaults incluem porta 4500 e banco `ncrsolution` | alta | R2, R4, G1 |
| E6 | Senhas Master são descriptografadas antes da composição | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:194-204,388-413` | [observado] chamada a `Criptografia.Descriptografar` no fluxo de configuração | alta | R3, G6 |
| E7 | `CoLib.Db` resolve bancos e abre conexões por factories de provider | `_lib/CoLib.Db/DadosDeConexao.cs:27-38,42-64,84-106`; `_lib/CoLib.Db/SqlServer/Source/Registro.cs:5-11`; `_lib/CoLib.Db/PGSql/Source/Registro.cs:8-12` | [observado] `Banco.POS` usa `MsSql`; `Banco.PgSql` usa `Npgsql`; abertura padrão e descarte ficam com o chamador | alta | R4, R6, R7, G3, G4 |
| E8 | O parser de argumento PG tem formato ODBC diferente do fluxo Npgsql | `_lib/CoLib.Extensions/Base/Source/LinhaDeComando/LinhaDeComandoExtensions.cs:223-226` | [observado] produz `DRIVER={PostgreSQL Unicode}`; não é a string canônica do `NpgsqlConnection` | alta | R4, G3; incompatibilidade a escalar |
| E9 | O alvo aplica fallback de CLI para ambiente e depois `InfoDeConexaoPOS` | `Pos.Integration.Service/Source/Dados/Conexao.cs:28-33,53-57` | [observado] ordem `argumento` → `string_conexao` → configuração externa | alta | R5, G2 |
| E10 | O alvo mantém `Conexao` singleton e `Func<DbConnection>` | `Pos.Integration.Service/Source/Startup.cs:81,85-86,100` | [observado] contrato de composição atual para consumidores SQL | alta | R5, R6, G2 |
| E11 | `appsettings` não é fonte de connection string do alvo | `Pos.Integration.Service/appsettings.json:1-24`; `appsettings.Development.json` | [observado] não há seção `ConnectionStrings` nem uso direto de PostgreSQL | alta | R5; decisão de não duplicar configuração |
| E12 | O alvo usa `Microsoft.Data.SqlClient 7.0.2` e Shared Project SQL Server | `Pos.Integration.Service/Pos.Integration.Service.csproj:3,64,102,128,131` | [observado] framework e driver estão alinhados com `CoLib.Ambiente` | alta | R3, R6, G2 |
| E13 | O alvo usa retry SQL e timeout de comando no caminho de conexão | `Pos.Integration.Service/Source/Dados/Conexao.cs:37,43` | [observado] `ResilientDbConnection` e `SqlClientRetryPolicy` com seis tentativas | alta | R6, G2 |
| E14 | Há provedor cacheado, sem evidência de reload | `_lib/CoLib.Colibri/Source/ProvedorDeConfiguracoesDoAmbiente.cs:4-34`; construção em `ConfiguracoesDeAmbiente` | [observado] provedor estático conserva uma instância; [inferido] alterações de arquivo não são recarregadas no mesmo processo | média | R7, G4 |
| E15 | Fixtures SQL priorizam variáveis de usuário, depois processo, e suportam banco temporário | `Pos.Integration.Service.Testes/Source/Fixtures/DbFixture.cs:17,24-41,84-99,116-124,142,271,273` | [observado] `DbName`, `DbPassword`, `DbUser`, `DbServer`; injeta `ConexaoFactory` e usa `TempMsSqlConnection` | alta | R8, G6 |
| E16 | Os testes do alvo não cobrem PostgreSQL; a referência possui teste de parser SQL/PG | `Pos.Integration.Service.Testes/Pos.Integration.Service.Testes.csproj`; `_lib/CoLib.Library.Testes/Source/Extensions/LinhaDeComandoExtensionsTestes.cs:72-150` | [observado] cobertura de integração do alvo é SQL; [lacuna] não há abertura Npgsql no alvo | alta | R8; adaptação PG necessária |
| E17 | Falhas de configuração têm semântica assimétrica na referência | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:344-359,415-457` | [observado] arquivo base ausente lança `InvalidOperationException`; falhas de JSON de `launcher.conexao` são suprimidas | alta | G5; qualquer mudança exige escalonamento |
| E18 | O repositório proíbe credenciais versionadas e recomenda configuração externa | `AGENTS.md: Segurança & Dicas de Configuração`; `README.md: Configuração` | [observado] segredos ficam fora do controle de versão; README usa placeholder | alta | G6 |
| E19 | Fallback PG fixo é específico de Payment, não do resolvedor geral | `_lib/CoLib.Payment/Source/Conexao.cs:8-59` | [observado] `CoLib.Payment.Conexao` possui factory e fallback local próprio | média | Não aplicar ao alvo; lacuna de generalização |
| E20 | Registro estático mutável não tem sincronização demonstrada | `_lib/CoLib.Db/DadosDeConexao.cs:10-13`; `Pos.Integration.Service/Source/Dados/Conexao.cs:15,20,55` | [observado] dicionários/factories são estáticos; [inferido] registro tardio concorrente merece bloqueio | média | G2 e escalonamento de R6 |

## Decisões e lacunas

| Item | Impacto | Decisão necessária |
| --- | --- | --- |
| O alvo não referencia `Npgsql` nem `CoLib.Db.PGSql` | Não é possível afirmar paridade PG implementada no serviço | Só adicionar PG se houver requisito funcional explícito; então definir dependências, DI e testes |
| `LinhaDeComandoExtensions` produz PG em formato ODBC | Reuso direto com Npgsql pode falhar em runtime | Manter separado; validar uma string Npgsql canônica antes de qualquer integração |
| O comportamento de `Criptografia.Descriptografar` para valor ausente/corrompido não foi investigado | Tratamento de credenciais inválidas permanece parcialmente desconhecido | Testar ou consultar o contrato da biblioteca antes de mudar tratamento de erro |
| O formato de deployment dos arquivos `ncrmaster.cfg`, `launcher.boot` e `launcher.conexao` não foi comprovado | Instalações podem divergir da árvore de código | Validar com ambiente de instalação antes de alterar caminhos ou obrigatoriedade |
| Falhas de JSON de `launcher.conexao` são suprimidas | Diagnóstico pode ser tardio ou silencioso | Qualquer mudança para falha explícita precisa de decisão de compatibilidade |
| Não foi comprovada a limpeza de `Conexao.ConexaoFactory` no fixture | Estado estático pode vazar entre testes | Confirmar isolamento do runner antes de alterar o ciclo de vida da factory |
| O registro estático não apresenta sincronização | Registro tardio concorrente pode ser inseguro | Registrar no bootstrap; se houver registro dinâmico, desenhar proteção explicitamente |
| A referência registra a string completa em debug em um caminho de erro | Pode expor senha/metadados | Não ampliar esse comportamento; validar política de logging antes de corrigir ou preservar |

## Premissas explicitamente aceitas

- O pedido trata o repositório principal como alvo e `_lib` como fonte de referência das bibliotecas internas compartilhadas.
- O padrão atual do serviço SQL Server deve ser preservado; PostgreSQL deve ser documentado como capacidade da referência e lacuna do alvo, não inventado como requisito.
- O diretório de saída original foi `refactor-guidance/connection-strings-configuracao/`; seu conteúdo agora está empacotado nesta skill para eliminar a dependência do repositório.
- As versões só foram registradas quando observadas em arquivos de projeto; versões do submódulo e de Shared Projects sem pacote NuGet não foram inventadas.
