# Microsoft.Testing.Platform

Leia esta referência **em full** quando a solução usar .NET 10, `global.json` com `test.runner`, `Microsoft.Testing.Platform`, xUnit v4, `Microsoft.Testing.Extensions.CodeCoverage` ou um workflow MTP.

## Decisão rápida

1. Localize o `global.json` mais próximo do diretório da solução. MTP governa a solução somente quando esse arquivo, ou um arquivo ancestral aplicável, contém:

   ```json
   {
     "test": {
       "runner": "Microsoft.Testing.Platform"
     }
   }
   ```

2. Uma configuração em `_lib/global.json` governa comandos iniciados em `_lib`, mas não um `dotnet test` iniciado na raiz que executa uma solução principal.
3. Após restore, use o MSBuild como fonte de verdade para cada projeto de teste:

   ```text
   rtk dotnet msbuild <projeto.csproj> -getProperty:IsTestingPlatformApplication -getProperty:GenerateTestingPlatformEntryPoint -getProperty:UseMicrosoftTestingPlatformRunner
   ```

4. Em .NET 10, `IsTestingPlatformApplication=true` sem opt-in MTP na raiz produz o erro `Testing with VSTest target is no longer supported by Microsoft.Testing.Platform`. Solicite autorização para adicionar o `global.json` mínimo antes dos testes.
5. O pacote `xunit.v3` versão `4.0.0` importa o suporte MTP v2, mas o zero-test do agregador não autoriza, sozinho, adicionar `UseMicrosoftTestingPlatformRunner`. Primeiro use o fallback `InvokeTestingPlatform`.
6. Para cobertura MTP, confirme `Microsoft.Testing.Extensions.CodeCoverage` em cada projeto que receberá `--coverage`. `coverlet.collector` sozinho não habilita os argumentos de cobertura MTP.

## Comandos MTP

Use a solução com a forma explícita:

```text
rtk dotnet test --solution <solução> --no-build --no-restore --nologo --verbosity:minimal --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml --report-xunit-trx --report-xunit-trx-filename <solução>.trx --results-directory <diretório-de-resultados>
```

Use um projeto com a forma explícita:

```text
rtk dotnet test --project <projeto.csproj> --no-build --no-restore --nologo --verbosity:minimal --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml --report-xunit-trx --report-xunit-trx-filename <projeto>.trx --results-directory <diretório-de-resultados>
```

`--logger "console;verbosity=minimal"` é uma opção VSTest. No modo MTP, use os relatórios MTP e a saída nativa do runner. O relatório de cobertura precisa usar um nome de arquivo por projeto quando vários projetos compartilham o diretório de resultados.

## Fallback do agregador

Use este fallback somente depois de `dotnet test --solution` e de cada `dotnet test --project` retornarem zero testes, código 5 ou argumento inválido:

```text
rtk dotnet msbuild <projeto.csproj> -target:InvokeTestingPlatform -property:Configuration=Debug -property:VSTestNoBuild=true -property:TestingPlatformShowTestsFailure=true -property:TestingPlatformCaptureOutput=true -verbosity:minimal
```

O alvo `InvokeTestingPlatform` é a task MTP controlada pelo próprio MSBuild; não é uma execução VSTest alternativa nem um teste direto do assembly. Execute-o para cada projeto executável e some os totais. Para cobertura, acrescente uma propriedade com nomes únicos:

```text
-property:TestingPlatformCommandLineArguments="--coverage --coverage-output-format cobertura --coverage-output <projeto>.cobertura.xml --results-directory TestResults\Mtp"
```

Se o fallback passar e o front-end `dotnet test` continuar retornando zero, classifique o caso como diagnóstico do agregador/tooling, não como flakiness e não como motivo para editar os projetos de teste.

## Workflow

Troque uma action VSTest por uma action MTP somente quando a action exigir `global.json` MTP e o pacote de cobertura. Inspecione a implementação da action: uma chamada `dotnet test <projeto>` posicional precisa ser atualizada para `dotnet test --project <projeto>` ou substituída por uma chamada controlada pelo repositório. Para uma action externa sem código disponível, registre o bloqueio e não declare o workflow validado por uma execução local equivalente.

## xUnit 4

Ao atualizar `xunit.v3` de 3.x para `4.0.0`, pesquise `DisableTestParallelization` antes de testar. O erro esperado é `CS0619` em `CollectionBehaviorAttribute.DisableTestParallelization`. A migração que preserva execução serial é:

```csharp
[assembly: Xunit.v3.Parallelization(Mode = Xunit.Sdk.ParallelMode.None)]
```

Use o namespace totalmente qualificado quando o arquivo de atributos não importar `Xunit.v3` e `Xunit.Sdk`. Solicite autorização antes de aplicar a migração ou fazer rollback; não transforme outros avisos xUnit em correções presumidas.

## Critério

Considere a validação MTP concluída somente quando a solução ou todos os projetos de teste executáveis retornarem sucesso, quantidade total maior que zero quando houver testes e relatórios esperados no diretório de resultados. Se o front-end MTP retornar zero mas o fallback controlado passar, registre ambos os resultados e o diagnóstico de tooling.
