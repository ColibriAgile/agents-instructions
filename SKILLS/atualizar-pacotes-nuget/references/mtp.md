# Microsoft.Testing.Platform

Leia esta referência quando o projeto usar .NET 10, `global.json` com `test.runner`, `Microsoft.Testing.Platform`, xUnit v4, `Microsoft.Testing.Extensions.CodeCoverage` ou um workflow MTP.

## Detecção e configuração

1. Considere MTP ativo quando `global.json` contém:

   ```json
   {
     "test": {
       "runner": "Microsoft.Testing.Platform"
     }
   }
   ```

2. Para xUnit v3/v4 que será executado pelo MTP, confirme `<UseMicrosoftTestingPlatformRunner>true</UseMicrosoftTestingPlatformRunner>` no projeto de teste ou em uma propriedade compartilhada aplicável.
3. Para cobertura MTP, confirme `Microsoft.Testing.Extensions.CodeCoverage` em cada projeto de teste que receberá `--coverage`.
4. Para .NET 10, use a configuração MTP na raiz da solução que será executada; uma configuração somente em `_lib` não governa uma chamada iniciada na raiz do repositório.

## Comandos

Use a solução com a forma explícita:

```text
rtk dotnet test --solution <solução> --no-build --no-restore --nologo --verbosity:minimal --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml --report-xunit-trx --report-xunit-trx-filename <solução>.trx --results-directory <diretório-de-resultados>
```

Use um projeto com a forma explícita:

```text
rtk dotnet test --project <projeto.csproj> --no-build --no-restore --nologo --verbosity:minimal --coverage --coverage-output-format cobertura --coverage-output coverage.cobertura.xml --report-xunit-trx --report-xunit-trx-filename <projeto>.trx --results-directory <diretório-de-resultados>
```

`--logger "console;verbosity=minimal"` é uma opção VSTest. No modo MTP, use os relatórios MTP e a saída nativa do runner. O relatório de cobertura precisa usar um nome de arquivo por projeto quando vários projetos compartilham o diretório de resultados.

## Workflow

Troque uma action VSTest por uma action MTP somente quando a action exigir `global.json` MTP e o pacote de cobertura. Inspecione a implementação da action: uma chamada `dotnet test <projeto>` posicional precisa ser atualizada para `dotnet test --project <projeto>` ou substituída por uma chamada controlada pelo repositório.

## Critério

Considere a validação MTP concluída somente quando a solução ou todos os projetos de teste executáveis retornarem sucesso, quantidade total maior que zero quando houver testes e relatórios esperados no diretório de resultados.
