---
applyTo: "**/*.cs"
---

# Guardrails de refatoração: obtenção de strings de conexão por configuração do sistema

Estes guardrails acompanham a skill `colibri-connection-string`.

## Invariantes de paridade

### G1 — Preservar a fonte de verdade da instalação

- Condição protegida: a instalação continua descobrindo SQL Server e PG pelos arquivos e chaves tratados por `CoLib.Ambiente`, e não por uma configuração paralela específica do serviço.
- Evidência: E1, E2, E3.
- Verificação: inspeção dos consumidores confirma o uso de `InfoDeConexaoPOS`/`InfoDeConexaoPG`; não há parser local duplicado.

### G2 — Preservar o contrato SQL Server já operacional

- Condição protegida: `InfoDeConexaoPOS`, `Microsoft.Data.SqlClient`, a precedência CLI → `string_conexao` → ambiente do sistema, `Func<DbConnection>`, retry e registro singleton continuam compatíveis com os consumidores existentes.
- Evidência: E4, E6, E9, E10, E12, E13.
- Verificação: testes de composição e integração SQL continuam passando com a mesma fábrica e os mesmos pontos de injeção.

### G3 — Não misturar os contratos ODBC e Npgsql

- Condição protegida: uma string ODBC produzida por `LinhaDeComandoExtensions` não é passada a `NpgsqlConnection`; o fluxo PG canônico usa `InfoDeConexaoPG` e `CoLib.Db.PGSql`.
- Evidência: E5, E7, E8.
- Verificação: teste verifica o tipo concreto `NpgsqlConnection` e rejeita a presença de `DRIVER={PostgreSQL Unicode}` no caminho Npgsql.

### G4 — Preservar ciclo de vida, abertura e descarte

- Condição protegida: conexões obtidas pelos resolvedores são abertas conforme o parâmetro/valor padrão comprovado e descartadas pelo chamador; não há cache global de conexão aberta nem reload presumido da configuração.
- Evidência: E7, E14.
- Verificação: testes usam descarte explícito e não dependem de alteração de arquivo durante o mesmo ciclo de vida do provedor.

### G5 — Preservar falhas observadas ou escalonar sua mudança

- Condição protegida: ausência do arquivo base obrigatório continua explícita como `InvalidOperationException`; a supressão existente de falhas de JSON em `launcher.conexao` não é silenciosamente transformada em outro comportamento.
- Evidência: E17.
- Verificação: testes de configuração ausente/inválida registram o comportamento atual; qualquer mudança no tratamento do JSON exige decisão documentada.

### G6 — Não introduzir segredos na configuração de teste ou no código

- Condição protegida: strings de conexão e credenciais continuam vindo do ambiente/fixture, não são commitadas; alterações não ampliam a exposição de strings completas em logs ou mensagens de exceção.
- Evidência: E15, E18.
- Verificação: revisão dos testes, configurações e logs não encontra credenciais versionadas nem novos logs de connection string completa.

## Mudanças que exigem escalonamento

- Adicionar PostgreSQL ao alvo exige decisão explícita sobre a dependência `Npgsql 10.0.3` observada na referência, o Shared Project `CoLib.Db.PGSql`, o contrato de DI e a cobertura de integração; o alvo atual não possui esses componentes.
- Substituir a precedência CLI → `string_conexao` → arquivos do sistema por `IConfiguration`/`appsettings.json` altera o contrato operacional documentado e deve ser aprovado antes da implementação.
- Reutilizar o override PG de `LinhaDeComandoExtensions`, que produz uma string ODBC, com `NpgsqlConnection` é incompatível e deve ser bloqueado até existir um contrato de formato validado.
- Alterar `InfoDeConexaoPG`/`InfoDeConexaoPOS`, defaults, nomes de seção ou o local dos arquivos exige validação com as instalações consumidoras.
- Tornar o registro de providers mutável depois do bootstrap, ou fazer cache de conexões abertas, exige revisão de concorrência, ciclo de vida e descarte.
- Transformar o `catch` vazio de `launcher.conexao` em erro visível pode ser uma melhoria válida, mas muda diagnóstico e inicialização; não fazê-lo como efeito colateral da refatoração.
- Trocar `Microsoft.Data.SqlClient 7.0.2`, `Npgsql 10.0.3` ou o target framework exige comprovação de compatibilidade e atualização dos testes.

## Gates de validação

1. Inspeção confirma que a leitura continua centralizada em `CoLib.Ambiente` e que todos os `R`/`G` aplicáveis apontam para evidências em `EVIDENCE.md`.
2. Testes SQL confirmam precedência, `InfoDeConexaoPOS`, DI singleton, `Func<DbConnection>`, retry e descarte.
3. Se PG for adotado, testes confirmam `InfoDeConexaoPG`, `NpgsqlConnection`, registro `CoLib.Db.PGSql`, campos da string e falhas de configuração.
4. Nenhum teste, `appsettings` ou arquivo versionado contém credenciais reais.
5. Qualquer divergência de versão, formato, erro, cache ou contrato público fica registrada em `EVIDENCE.md` antes de implementar.

## Limites do escopo

- Incluído: `CoLib.Ambiente`, `CoLib.Criptografia`, `CoLib.Db`, `CoLib.Db.SqlServer`, `CoLib.Db.PGSql`, `CoLib.Colibri`, consumidores de conexão do serviço e fixtures de integração.
- Incluído: arquivos `master\config\ncrmaster.cfg`, `client\config\launcher.boot` e `client\config\launcher.conexao`, além das fontes de override já comprovadas no alvo.
- Lacuna: o alvo não tem implementação ou teste PostgreSQL; a forma final de expor PG no serviço depende de requisito não presente nesta extração.
- Lacuna: o comportamento completo de `Criptografia.Descriptografar` para valores ausentes/corrompidos e o formato de deployment dos arquivos não foram comprovados.
- Fora do escopo: escolher uma nova arquitetura de configuração, substituir a política de retry, corrigir a exposição histórica de strings em debug ou alterar o contrato dos consumidores.
