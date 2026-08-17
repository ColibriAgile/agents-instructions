---
name: atualizar-pacotes-nuget
description: 'tight NuGet: atualiza dependências .NET com dotnet outdated, decide VSTest/MTP antes dos testes, valida restore/build/testes e sincroniza submódulos. Use quando uma solução .NET precisar de atualização de pacotes, quando testes quebrarem após uma atualização ou quando um workflow precisar acompanhar MTP. Don''t use for alterações de código sem relação com dependências ou rollback sem confirmação explícita.'
argument-hint: 'Informe a solução .sln ou .slnx; sem caminho, a skill seleciona uma solução única na raiz ou solicita escolha.'
disable-model-invocation: true
---

# Atualizar pacotes NuGet

Mantém uma atualização NuGet **tight**: uma solução por vez, restore explícito, build sem restore, decisão de runner antes do teste e incompatibilidades autorizadas.

## Invariantes

- Descubra atualizações somente com `dotnet outdated`.
- Mantenha uma solução em foco até restore, build e testes concluírem.
- Trate o modo VSTest/MTP como uma decisão de configuração, não como tentativa de sintaxe.
- Trate zero testes retornados pelo agregador MTP como diagnóstico de tooling até a execução controlada do projeto confirmar o contrário.

## Passos

### 1. Planejar

1. Resolva a solução informada como caminho absoluto ou relativo e aceite `.sln` e `.slnx`.
2. Sem solução informada, liste somente `.sln` e `.slnx` diretamente na raiz do repositório. Se houver uma, selecione-a; se houver várias, solicite escolha; se não houver, solicite o caminho.
3. Detecte `_lib` como submódulo ou diretório Git e localize sua solução. Use `_lib/CoLib.Library.sln` quando existir; caso contrário, registre a solução encontrada.
4. Registre a ordem: solução de `_lib`, quando aplicável, depois solução principal.
5. Inspecione o working tree dos repositórios planejados. Classifique cada alteração pré-existente por caminho e preserve-a.
6. Execute `git symbolic-ref --quiet --short HEAD` em cada repositório antes do respectivo `git pull --ff-only`. Pare em detached HEAD ou em qualquer falha de pull.
7. Registre versões atuais dos pacotes, `global.json`, SDK, projetos de teste e workflows que executam testes.
8. Para cada solução, localize o `global.json` mais próximo do diretório da solução e registre se ele contém `test.runner`. Uma configuração em `_lib` governa uma execução iniciada em `_lib`, mas não uma execução iniciada na raiz do repositório.
9. Para cada projeto de teste, registre `TargetFramework`, `IsTestProject`, pacotes de runner/cobertura e propriedades MTP existentes. Use o projeto real da solução, não um projeto parecido de outro repositório.

*Done when:* toda solução planejada, ordem de processamento, branch, alteração pré-existente e baseline de dependências está registrada.

### 2. Preparar ferramentas

1. Carregue `dotnet-efficient-validation` antes de qualquer `build`, `test`, `publish` ou `run`.
2. Execute `rtk dotnet tool list --global` e confirme o comando `dotnet-outdated`.
3. Se ausente, execute `rtk dotnet tool install --global dotnet-outdated-tool` e confirme novamente. Pare quando a instalação falhar.

*Done when:* `dotnet outdated` está disponível, a estratégia de validação .NET está carregada e o baseline de runner está registrado.

### 3. Atualizar uma solução

1. Processe somente a próxima solução da ordem registrada.
2. Execute `rtk dotnet outdated -u <solução> --no-restore`.
3. Registre cada pacote alterado no formato `pacote: versão anterior => versão nova`.
4. Classifique atualizações major, prévias, mudanças de runner e avisos de dependência como risco de compatibilidade.
5. Ao atualizar `xunit.runner.visualstudio` de 3.x para 4.x, leia `references/mtp.md` em full e substitua `coverlet.collector` por `Microsoft.Testing.Extensions.CodeCoverage` no projeto de teste afetado.
6. Pare antes da próxima solução quando `dotnet outdated` falhar, não resolver uma dependência ou indicar incompatibilidade de versão.

*Done when:* a solução atualizou ou confirmou todos os pacotes disponíveis, cada mudança de versão e risco está registrado, e a troca de cobertura foi aplicada quando `xunit.runner.visualstudio` cruzou para 4.x.

### 4. Restaurar e compilar

1. Execute `rtk dotnet restore <solução> --nologo --verbosity:minimal` após qualquer alteração de referência.
2. Execute `rtk dotnet build <solução> --no-restore --nologo --verbosity:minimal`.
3. Analise erros e warnings. Remova um warning somente quando a correção ficar restrita aos arquivos da atualização, preservar API e comportamento e não ocultar o diagnóstico.
4. Após o restore, quando houver projetos MTP, execute o preflight MSBuild descrito em `references/mtp.md` antes de escolher `dotnet test`.
5. Em falha de restore ou build, repita somente a etapa necessária com saída normal ou `rtk proxy`, preserve o primeiro erro e pare o fluxo.

*Done when:* o restore passou, o build da solução atual passou sem erros e cada warning foi classificado como resolvido, existente ou bloqueador; o modo de teste está determinado ou aguardando decisão explícita de configuração.

### 5. Decidir o runner

1. Quando houver .NET 10, `global.json` com `test.runner` MTP, pacote MTP, xUnit v4 ou cobertura MTP, leia `references/mtp.md` em full antes de executar testes.
2. Considere MTP ativo para a solução quando o `global.json` aplicável declarar `"test": { "runner": "Microsoft.Testing.Platform" }`.
3. Em .NET 10, se o preflight de um projeto de teste retornar `IsTestingPlatformApplication=true` e não houver `global.json` MTP aplicável à raiz da solução, registre a configuração ausente e solicite autorização antes de criar ou alterar `global.json`.
4. Se não houver configuração MTP aplicável nem projeto MTP, selecione VSTest. Se houver configuração MTP, selecione MTP. Não escolha o modo pela forma que parece mais curta.

*Done when:* a solução tem um modo de teste registrado, cada projeto executável tem seu runner e cobertura identificados e qualquer opt-in MTP ausente tem decisão explícita.

### 6. Validar testes

1. No modo VSTest, execute `rtk dotnet test <solução> --no-build --no-restore --nologo --logger "console;verbosity=minimal"`.
2. No modo MTP, use `--solution <solução>` ou `--project <projeto>`; não passe a solução ou projeto como argumento posicional. Quando houver cobertura MTP, inclua os argumentos e nomes de relatório únicos descritos em `references/mtp.md`.
3. Se `--solution` for rejeitado como `Unknown switch`, o comando está no modo VSTest; volte à decisão de runner, não troque argumentos aleatoriamente.
4. Se a execução MTP agregada retornar zero testes, código 5 ou argumento inválido, execute cada projeto com `--project` e registre os resultados. Se os projetos também retornarem zero, não altere propriedades de runner por tentativa: execute o fallback controlado `InvokeTestingPlatform` descrito em `references/mtp.md` para cada projeto executável.
5. Considere a validação concluída somente com sucesso e quantidade maior que zero no agregador ou no fallback controlado para todos os projetos executáveis. Explique projetos sem testes e relatórios de cobertura ausentes.
6. Se um teste falhar, repita somente esse teste ou projeto com saída suficiente para identificar a causa. Depois de corrigir uma incompatibilidade autorizada, repita restore quando referências mudarem, build e testes.
7. Classifique uma falha que passa isolada e na repetição da suíte como flakiness; registre o teste e o resultado, sem alterar o comportamento para silenciar o sinal.

*Done when:* todos os testes executáveis da solução passaram, a quantidade total foi registrada e cada zero-testes, warning, flakiness, projeto sem testes ou diagnóstico do agregador recebeu explicação.

### 7. Corrigir incompatibilidades autorizadas

1. Ao detectar uma quebra causada pela atualização, informe pacote, projeto, erro e etapa afetada.
2. Solicite uma escolha entre corrigir a incompatibilidade e fazer rollback com versão fixada. Continue somente com autorização explícita; rollback nunca é automático.
3. Para MTP autorizado, aplique a menor correção compatível: configuração `global.json` na raiz da solução, pacote de cobertura exigido pelo workflow e chamada `--solution`/`--project` no workflow ou action controlado pelo repositório. Não adicione `UseMicrosoftTestingPlatformRunner` somente porque o agregador retornou zero; confirme primeiro o preflight e o fallback controlado.
4. Para xUnit v3 versão 4.0.0, trate `CS0619` em `CollectionBehaviorAttribute.DisableTestParallelization` como migração de API. Preserve o comportamento com `[assembly: Xunit.v3.Parallelization(Mode = Xunit.Sdk.ParallelMode.None)]`, após autorização e confirmação do erro no projeto afetado.
5. Para uma action externa que ainda usa `dotnet test <projeto>` posicional, registre o bloqueio e corrija a action quando ela estiver no escopo; não declare o workflow validado apenas por uma execução local equivalente.
6. Após qualquer correção, reexecute somente restore afetado, build afetado e testes afetados; depois repita a suíte da solução.

*Done when:* a incompatibilidade tem correção mínima autorizada ou rollback explicitamente documentado, e a solução afetada passou novamente.

### 8. Encerrar

1. Execute `rtk dotnet outdated <solução> --no-restore` para confirmar que não há atualizações disponíveis restantes.
2. Revise `git diff --stat`, `git diff --check`, `git status --short --branch` e o status do submódulo. Separe alterações de `_lib` das alterações do repositório principal.
3. Quando a atualização envolver `_lib`, leia `references/commit-template.md` em full e gere duas mensagens de commit sem executar `git commit`.
4. Informe soluções processadas, pacotes, arquivos, builds, testes e quantidade, warnings, incompatibilidades, decisões pendentes e mensagens de commit.

*Done when:* o pós-scan não mostra dependências desatualizadas, todo arquivo alterado está explicado e o resumo distingue sucesso, avisos e itens não resolvidos.

## Regras de segurança

- Preserve alterações não relacionadas e nunca use rollback destrutivo.
- Mantenha uma solução em foco até restore, build e testes concluírem.
- Trate uma falha de restore, build ou teste como bloqueio até sua causa e decisão estarem registradas.
- Use somente `dotnet outdated` para descobrir atualizações; fixe versão apenas em rollback autorizado.
