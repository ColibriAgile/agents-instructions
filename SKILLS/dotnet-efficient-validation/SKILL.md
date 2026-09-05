---
name: dotnet-efficient-validation
description: "Validacao .NET com baixo ruido e sem trabalho redundante. Use obrigatoriamente ao executar dotnet build, publish ou run, ou detectar, listar e executar testes com VSTest ou Microsoft.Testing.Platform (MTP). Nao use para migrar frameworks de teste."
argument-hint: "Informe a solucao, projeto ou teste .NET que deve ser validado."
user-invocable: true
---

# Validacao .NET eficiente

## Quando usar

Use esta skill antes de qualquer execucao de:

- `dotnet build`;
- descoberta ou execucao de testes com VSTest ou Microsoft.Testing.Platform (MTP);
- `dotnet publish`;
- `dotnet run`;
- validacao de uma solucao, projeto ou teste C#.

## Procedimento

1. Identifique o projeto ou a solucao diretamente afetada. Para testes, determine o runner conforme **Deteccao do runner** antes de escolher argumentos.
2. Prefira o teste mais especifico. Em VSTest, use `--filter`; para MTP, leia integralmente [references/mtp.md](references/mtp.md) antes de listar ou executar testes.
3. Se faltarem assets de restauracao ou as referencias de pacote mudaram, restaure uma vez:

   ```powershell
   rtk dotnet restore <projeto-ou-solucao> --nologo --verbosity:minimal
   ```

4. Com os assets atualizados, execute o build sem restauracao, somente se ainda nao houver build valido:

   ```powershell
   rtk dotnet build <projeto-ou-solucao> --no-restore --nologo --verbosity:minimal
   ```

5. Reutilize o build somente para o mesmo codigo, configuracao, framework e runtime. Em **VSTest**, execute sem recompilar ou restaurar:

   ```powershell
   rtk dotnet test <projeto-ou-solucao> --no-build --no-restore --nologo --logger "console;verbosity=minimal"
   ```

   Para descobrir nomes ou investigar um filtro sem correspondencias, acrescente `--list-tests` e confira os testes listados. A listagem nao substitui a execucao. Em MTP, use o comando do modo identificado na referencia.

6. Execute `dotnet publish` somente quando o artefato publicado ou a validacao de empacotamento for necessaria. Prefira `--no-restore`; use `--no-build` somente quando o build correspondente ja estiver valido.
7. Para `dotnet run`, use `--no-build --no-restore` quando houver build valido. Nunca use `Out-Null` como diagnostico principal.
8. Em PowerShell, preserve o codigo de saida. Depois de pipes ou comandos compostos, verifique `$LASTEXITCODE` e propague falhas.
9. Use as opcoes de saida concisa aceitas pelo runner. `--verbosity:minimal` e `--nologo` servem aos comandos de build e VSTest; as opcoes MTP estao na referencia.
10. `Select-Object -Last N` reduz o contexto recebido pelo agente, mas nao reduz o trabalho do processo e pode esconder a causa de uma falha. Use-o apenas para uma inspecao complementar depois de preservar o resultado do comando.
11. Se a validacao minima falhar, repita somente a etapa necessaria com saida normal ou `rtk proxy`, preservando o primeiro erro. Nao execute novamente a suite inteira sem motivo.

## Deteccao do runner

- Confira o SDK selecionado com `rtk dotnet --version`, o `global.json` efetivo e os projetos de teste no escopo. Considere `Directory.Build.props`, `Directory.Build.targets`, `Directory.Packages.props` e imports aplicaveis.
- Procure `test.runner: "Microsoft.Testing.Platform"` no `global.json`, SDKs como `MSTest.Sdk`, pacotes `Microsoft.Testing.Platform`/`.MSBuild`, `TUnit` ou `xunit.v3`, e propriedades `IsTestingPlatformApplication`, `EnableMSTestRunner`, `EnableNUnitRunner`, `UseMicrosoftTestingPlatformRunner` e `TestingPlatformDotnetTestSupport`. Sao evidencias a combinar com versoes e valores efetivos; a presenca de um pacote sozinha nao define o modo de execucao.
- Inclua projetos MTP mesmo sem `Microsoft.NET.Test.Sdk`, adapter VSTest ou `IsTestProject=true` explicito. A presenca desses elementos tambem nao exclui MTP.
- Se imports ou condicoes deixarem duvida, consulte as propriedades avaliadas sem executar targets, preservando a configuracao e o framework do alvo:

  ```powershell
  rtk dotnet msbuild <projeto-de-testes> -getProperty:IsTestProject,IsTestingPlatformApplication,TestingPlatformDotnetTestSupport,EnableMSTestRunner,EnableNUnitRunner,UseMicrosoftTestingPlatformRunner,TargetFrameworks
  ```

- Registre por projeto o runner e a rota: VSTest, MTP nativo de `dotnet test`, MTP via integracao legada ou executavel MTP. Em solucoes mistas, execute por projeto com argumentos compativeis. Preserve a configuracao existente; validar testes nao exige migrar o runner.

## Regras

- Sempre prefixe comandos de shell com `rtk`, conforme as instrucoes globais.
- Nao execute suite completa quando um projeto ou filtro especifico atender ao objetivo.
- Nao combine build e test de modo que o teste recompilhe o mesmo codigo sem necessidade.
- Nao silencie `build`, `test`, `publish` ou `run` com `Out-Null`.
- Nao trate a reducao de output como reducao de tempo de compilacao, restauracao, teste ou publish.

## Criterios de conclusao

- O escopo executado corresponde ao comportamento alterado.
- O runner foi identificado e os testes esperados foram executados. Zero testes, apenas build ou apenas listagem nao comprovam validacao; investigue descoberta, filtro e modo de execucao antes de concluir.
- Restauracao, build e testes nao foram repetidos sem necessidade.
- A saida padrao e concisa, mas erros e codigo de saida continuam observaveis.
- Publish ou run so foram executados quando eram necessarios.
