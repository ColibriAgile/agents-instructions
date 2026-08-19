---
name: atualizar-testes-mtp
description: 'MTP: migra um projeto de testes .NET de VSTest para Microsoft.Testing.Platform, para imediatamente sem alterar nada quando o projeto já é MTP, remove Microsoft.NET.Test.Sdk e coverlet.collector, adiciona Microsoft.Testing.Extensions.CodeCoverage, alinha xUnit à MTP v2 e corrige o CS0619 da migração xUnit v3 para v4, troca a action do workflow testes.yml para a action MTP dedicada e recupera zero-testes com o fallback InvokeTestingPlatform. Use quando o usuário pedir para migrar testes de VSTest para MTP, quando a execução falhar ao carregar a extensão de cobertura MTP, quando um teste retornar zero resultados ou o erro "Testing with VSTest target is no longer supported", ou quando um workflow de testes precisar trocar para a action MTP. Don''t use for atualizar pacotes de um projeto que já é MTP (use atualizar-pacotes-nuget) nem para escrever novos testes.'
---

# Atualizar testes para MTP

Migra um projeto de testes .NET de VSTest para Microsoft.Testing.Platform (MTP) uma única vez, como decisão de configuração explícita. Um projeto já MTP não é trabalho desta skill.

## Invariantes

- É uma migração de mão única: confirme VSTest antes de tocar em qualquer arquivo; um projeto já MTP para o fluxo sem alteração.
- Trate VSTest/MTP como decisão de `global.json` + preflight MSBuild, nunca como troca de flags por tentativa e erro.
- Trate zero testes retornados pelo agregador MTP como diagnóstico de tooling até a execução `InvokeTestingPlatform` por projeto confirmar o contrário.
- Tudo que a migração exigir para o projeto rodar em MTP é escopo desta skill: arquivos de configuração (`global.json`, `.csproj`, workflow) e pacotes NuGet (remover, adicionar, atualizar versão), incluindo qualquer requisito não listado explicitamente aqui que a investigação da migração revelar. Execute cada um diretamente, sem perguntar — criar/editar `global.json`, ajustar pacotes, `OutputType` e a versão do xUnit exigida pela cobertura MTP v2 são exemplos, não uma lista fechada. Solicite autorização explícita apenas antes de aplicar a migração xUnit v4 (CS0619), pois ela muda o comportamento de paralelização dos testes.

## Passos

### 1. Confirmar que a migração se aplica

1. Localize o `global.json` mais próximo do diretório da solução ou projeto. Uma configuração em `_lib/global.json` governa comandos iniciados em `_lib`, mas não um `dotnet test` iniciado na raiz que executa a solução principal.
2. Considere o projeto já MTP quando esse `global.json`, ou um ancestral aplicável, contiver:

   ```json
   { "test": { "runner": "Microsoft.Testing.Platform" } }
   ```

3. Após restore, use o MSBuild como segunda fonte de verdade por projeto de teste:

   ```text
   rtk dotnet msbuild <projeto.csproj> -getProperty:IsTestingPlatformApplication -getProperty:UseMicrosoftTestingPlatformRunner
   ```

4. Se o `global.json` já declarar MTP ou `UseMicrosoftTestingPlatformRunner=true`, o projeto já está migrado: pare aqui, não altere pacotes, `global.json` nem workflow. Informe que atualizações de pacotes desse projeto seguem por `atualizar-pacotes-nuget`.
5. Caso contrário — VSTest confirmado ou nenhum sinal de MTP encontrado —, prossiga com a migração nos próximos passos.

*Done when:* o projeto tem status de runner decidido e registrado, e o resultado é um de dois: fluxo encerrado por já ser MTP (nenhuma alteração feita), ou VSTest confirmado e a migração segue direto para o passo 2.

### 2. Ajustar o projeto de teste

1. Em cada projeto de teste migrado, remova as referências `Microsoft.NET.Test.Sdk` e `coverlet.collector`; nenhum dos dois é usado pelo runtime MTP.
2. Adicione `Microsoft.Testing.Extensions.CodeCoverage` em cada projeto que participará de execução com cobertura; `coverlet.collector` sozinho não habilita os argumentos de cobertura MTP e não pode coexistir com a extensão.
3. Defina `<OutputType>Exe</OutputType>` no `.csproj` de cada projeto de teste migrado quando ainda não estiver presente; MTP exige que o projeto de teste seja executável. Siga o padrão já usado por outro projeto MTP do repositório (ex.: `_lib`) quando houver um. É parte obrigatória da migração, não peça confirmação.

*Done when:* todo `.csproj` migrado não referencia mais `Microsoft.NET.Test.Sdk` nem `coverlet.collector`, referencia `Microsoft.Testing.Extensions.CodeCoverage` em vez deles, e declara `OutputType=Exe`.

### 3. Ativar o MTP via global.json

1. Crie/edite diretamente o `global.json` mínimo na raiz da solução com o bloco `test.runner` do passo 1; é parte obrigatória da migração, não peça confirmação.
2. Não adicione `UseMicrosoftTestingPlatformRunner` diretamente no projeto apenas porque um agregador retornou zero testes; confirme primeiro o preflight do passo 1 e o fallback do passo 7.

*Done when:* `global.json` reflete o modo MTP para a solução.

### 4. Alinhar o xUnit à MTP v2 e corrigir o CS0619

1. `Microsoft.Testing.Extensions.CodeCoverage` requer MTP v2. Um projeto com `xunit.v3` abaixo de `4.0.0` traz MTP v1: o build passa, mas a execução falha ao carregar a extensão de cobertura. Quando detectar essa combinação, atualize `xunit.v3` e `xunit.runner.visualstudio` para `4.0.0` ou superior diretamente, sem pedir confirmação; é parte obrigatória da migração.
2. Após a atualização, espere o erro `CS0619` em `CollectionBehaviorAttribute.DisableTestParallelization` no build quando o projeto usar esse atributo.
3. Solicite autorização e aplique a migração que preserva execução serial:

   ```csharp
   [assembly: Xunit.v3.Parallelization(Mode = Xunit.Sdk.ParallelMode.None)]
   ```

4. Use o namespace totalmente qualificado quando o arquivo de atributos não importar `Xunit.v3` e `Xunit.Sdk`.
5. Não transforme outros avisos xUnit em correções presumidas; trate apenas o `CS0619` confirmado no projeto afetado.

*Done when:* o projeto usa `xunit.v3` e `xunit.runner.visualstudio` em `4.0.0` ou superior, compila sem `CS0619`, e a execução de testes carrega a extensão de cobertura sem erro.

### 5. Atualizar o workflow de testes

1. Troque toda action VSTest por `ColibriAgile/build-tools/.github/actions/test-dotnet-mtp@master` em cada workflow `.github\workflows\*.yml` que executa testes da solução ou projeto migrado. A migração fica incompleta enquanto qualquer um desses workflows ainda apontar para a action VSTest.
2. Para uma action externa que ainda usa `dotnet test <projeto>` posicional, inspecione sua implementação: atualize para `dotnet test --project <projeto>` quando controlada pelo repositório, ou registre o bloqueio quando não houver código disponível. Não declare o workflow validado apenas por uma execução local equivalente.

*Done when:* todo workflow de testes que executa a solução ou projeto migrado usa a action MTP, sem nenhuma referência residual à action VSTest, ou o bloqueio de uma action externa está registrado.

### 6. Executar testes MTP

1. Use a solução com a forma explícita:

   ```text
   rtk dotnet test --solution <solução> --no-build --no-restore --nologo --verbosity:minimal --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml --report-xunit-trx --report-xunit-trx-filename <solução>.trx --results-directory <diretório-de-resultados>
   ```

2. Ou um projeto com a forma explícita:

   ```text
   rtk dotnet test --project <projeto.csproj> --no-build --no-restore --nologo --verbosity:minimal --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml --report-xunit-trx --report-xunit-trx-filename <projeto>.trx --results-directory <diretório-de-resultados>
   ```

3. Não use `--logger "console;verbosity=minimal"`; é uma opção VSTest. Use os relatórios e a saída nativa do runner MTP.
4. Se `--solution` for rejeitado como `Unknown switch`, o comando está no modo VSTest; volte ao passo 1, não troque argumentos aleatoriamente.
5. Quando vários projetos compartilharem o diretório de resultados, use um nome de arquivo de cobertura por projeto.

*Done when:* a execução retornou sucesso e quantidade de testes maior que zero, ou retornou zero/erro e o passo 7 foi executado.

### 7. Recuperar zero testes

1. Use este fallback somente depois de `dotnet test --solution` e de cada `dotnet test --project` retornarem zero testes, código 5 ou argumento inválido.
2. Execute para cada projeto executável:

   ```text
   rtk dotnet msbuild <projeto.csproj> -target:InvokeTestingPlatform -property:Configuration=Debug -property:VSTestNoBuild=true -property:TestingPlatformShowTestsFailure=true -property:TestingPlatformCaptureOutput=true -verbosity:minimal
   ```

3. Para cobertura, acrescente uma propriedade com nome único por projeto:

   ```text
   -property:TestingPlatformCommandLineArguments="--coverage --coverage-output-format cobertura --coverage-output <projeto>.cobertura.xml --results-directory TestResults\Mtp"
   ```

4. Some os totais de todos os projetos executáveis. Se o fallback passar e o front-end `dotnet test` continuar retornando zero, classifique o caso como diagnóstico do agregador/tooling — não como flakiness e não como motivo para editar os projetos de teste.

*Done when:* todos os projetos executáveis da solução passaram pelo fallback com quantidade total maior que zero, e qualquer divergência entre agregador e fallback está registrada como diagnóstico de tooling.

## Regras de segurança

- Um projeto já MTP não sofre nenhuma alteração desta skill; encerre no passo 1 e direcione atualizações de pacotes para `atualizar-pacotes-nuget`.
- Para uma action externa sem código disponível, registre o bloqueio; não declare o workflow validado por execução local equivalente.
