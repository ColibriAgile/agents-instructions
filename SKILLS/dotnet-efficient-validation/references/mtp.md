# Descoberta e execucao com Microsoft.Testing.Platform

Escolha a rota pela configuracao efetiva. Os exemplos pressupõem assets e build validos; preserve `--configuration`, `--framework` e `--runtime` quando usados no build. Troque `<projeto-de-testes>` pelo caminho do projeto.

## MTP nativo de dotnet test

Use com SDK .NET 10+ e `test.runner` igual a `Microsoft.Testing.Platform` no `global.json` efetivo. Requer MTP 1.7+. Selecione projeto com `--project` ou solucao com `--solution`, em vez de argumento posicional.

```powershell
rtk dotnet test --project <projeto-de-testes> --no-build --no-restore -- --list-tests
rtk dotnet test --project <projeto-de-testes> --no-build --no-restore -- --minimum-expected-tests 1
```

O separador `--` e opcional neste modo; nos exemplos, delimita os argumentos da aplicacao de testes. Todos os projetos selecionados precisam suportar MTP. [Referencia da CLI](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test-mtp).

## MTP via integracao legada de dotnet test

Use somente quando `dotnet test` estiver no modo VSTest e o projeto MTP tiver a integracao `Microsoft.Testing.Platform.MSBuild` com `TestingPlatformDotnetTestSupport=true`. Encaminhe argumentos MTP **apos `--`**. Opcoes VSTest como `--logger` e `--filter` antes desse separador podem ser ignoradas.

```powershell
rtk dotnet test <projeto-de-testes> --no-build --no-restore --nologo -v:minimal -p:TestingPlatformCaptureOutput=false -- --list-tests
rtk dotnet test <projeto-de-testes> --no-build --no-restore --nologo -v:minimal -p:TestingPlatformCaptureOutput=false -- --minimum-expected-tests 1
```

`TestingPlatformCaptureOutput=false` torna a lista e o resumo observaveis. Essa integracao nao e suportada pela combinacao MTP 2 com SDK .NET 10+; nesse caso use o executavel MTP se ja estiver configurado, ou reporte a incompatibilidade. [Modos de dotnet test e compatibilidade](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-dotnet-test).

## Executavel MTP

Quando o projeto ja gera um executavel MTP, execute-o sem depender da integracao de `dotnet test`:

```powershell
rtk dotnet run --project <projeto-de-testes> --no-build --no-restore -- --list-tests
rtk dotnet run --project <projeto-de-testes> --no-build --no-restore -- --minimum-expected-tests 1
```

Tambem e possivel usar `rtk dotnet <caminho/Tests.dll> --list-tests` e executar a mesma DLL sem `--list-tests`, desde que seja a aplicacao MTP compilada correspondente. Argumentos de build/restore nao pertencem a essa invocacao.

No xUnit v3, `dotnet run` pode usar a CLI propria do xUnit. Confirme `UseMicrosoftTestingPlatformRunner=true` ou a ajuda do executavel antes de passar opcoes MTP; a mera referencia a `xunit.v3` nao basta. [Integracao xUnit com MTP](https://xunit.net/docs/getting-started/v3/microsoft-testing-platform).

## Descoberta, filtros e saida

- Use `--list-tests` quando precisar localizar um teste ou diagnosticar descoberta. Se houver duvida sobre argumentos, consulte `--help` da aplicacao pela mesma rota, no lugar de `--list-tests`.
- Escolha o filtro aceito pelo framework e pela versao instalada. MSTest/NUnit com VSTestBridge aceitam `--filter "FullyQualifiedName~Namespace.Classe"`; xUnit v3 em MTP oferece `--filter-class`, `--filter-method` e `--filter-trait`; [TUnit usa `--treenode-filter`](https://tunit.dev/docs/execution/test-filters/). Confirme a sintaxe na ajuda, especialmente para nomes parametrizados.
- Acrescente o filtro aos argumentos da aplicacao tanto na descoberta quanto na execucao. Por exemplo, no modo MTP nativo com xUnit:

  ```powershell
  rtk dotnet test --project <projeto-de-testes> --no-build --no-restore -- --list-tests --filter-class "Namespace.Classe"
  rtk dotnet test --project <projeto-de-testes> --no-build --no-restore -- --minimum-expected-tests 1 --filter-class "Namespace.Classe"
  ```

- `--no-banner` reduz o banner MTP; use outras opcoes de output somente quando anunciadas pela ajuda da versao instalada. `--logger "console;verbosity=minimal"` pertence ao VSTest. Relatorios como `--report-trx` dependem da extensao correspondente instalada.
- Se RTK ocultar a lista ou o resumo, repita somente a descoberta ou o comando afetado com `rtk proxy dotnet ...`. Preserve o codigo de saida e confira testes descobertos, executados, falhos e ignorados; todos ignorados nao validam o comportamento.
- Ausencia dos testes esperados exige revisar alvo, framework, build, filtro e runner. Mantenha `--minimum-expected-tests 1` na execucao; nao use `--ignore-exit-code` nem reduza o minimo para transformar ausencia de testes em sucesso. [Opcoes MTP](https://learn.microsoft.com/en-us/dotnet/core/testing/microsoft-testing-platform-cli-options).
