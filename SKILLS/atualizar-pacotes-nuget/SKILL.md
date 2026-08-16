---
name: atualizar-pacotes-nuget
description: 'NuGet: atualiza dependências .NET com dotnet outdated, valida restore/build/test, trata migração para Microsoft.Testing.Platform e sincroniza submódulos. Use quando uma solução .NET precisar de atualização de pacotes, quando testes quebrarem após uma atualização ou quando um workflow de testes precisar acompanhar MTP. Don''t use for alterações de código sem relação com dependências ou para rollback sem confirmação explícita.'
argument-hint: 'Informe a solução .sln ou .slnx; sem caminho, a skill seleciona uma solução única na raiz ou solicita escolha.'
disable-model-invocation: true
---

# Atualizar pacotes NuGet

Mantém uma atualização NuGet **tight**: uma solução por vez, restore explícito, build sem restore, testes compatíveis com o runner e decisão explícita para incompatibilidades.

## Passos

### 1. Planejar

1. Resolva a solução informada como caminho absoluto ou relativo e aceite `.sln` e `.slnx`.
2. Sem solução informada, liste somente `.sln` e `.slnx` diretamente na raiz do repositório. Se houver uma, selecione-a; se houver várias, solicite escolha; se não houver, solicite o caminho.
3. Detecte `_lib` como submódulo ou diretório Git e localize sua solução. Use `_lib/CoLib.Library.sln` quando existir; caso contrário, registre a solução encontrada.
4. Registre a ordem: solução de `_lib`, quando aplicável, depois solução principal.
5. Inspecione o working tree dos repositórios planejados. Classifique cada alteração pré-existente por caminho e preserve-a.
6. Execute `git symbolic-ref --quiet --short HEAD` em cada repositório antes do respectivo `git pull --ff-only`. Pare em detached HEAD ou em qualquer falha de pull.
7. Registre versões atuais dos pacotes, `global.json`, SDK, projetos de teste e workflows que executam testes.

*Done when:* toda solução planejada, ordem de processamento, branch, alteração pré-existente e baseline de dependências está registrada.

### 2. Preparar ferramentas

1. Carregue `dotnet-efficient-validation` antes de qualquer `build`, `test`, `publish` ou `run`.
2. Execute `rtk dotnet tool list --global` e confirme o comando `dotnet-outdated`.
3. Se ausente, execute `rtk dotnet tool install --global dotnet-outdated-tool` e confirme novamente. Pare quando a instalação falhar.

*Done when:* `dotnet outdated` está disponível e a estratégia de validação .NET está carregada.

### 3. Atualizar uma solução

1. Processe somente a próxima solução da ordem registrada.
2. Execute `rtk dotnet outdated -u <solução> --no-restore`.
3. Registre cada pacote alterado no formato `pacote: versão anterior => versão nova`.
4. Classifique atualizações major, prévias, mudanças de runner e avisos de dependência como risco de compatibilidade.
5. Pare antes da próxima solução quando `dotnet outdated` falhar, não resolver uma dependência ou indicar incompatibilidade de versão.

*Done when:* a solução atualizou ou confirmou todos os pacotes disponíveis, e cada mudança de versão e risco está registrado.

### 4. Restaurar e compilar

1. Execute `rtk dotnet restore <solução> --nologo --verbosity:minimal` após qualquer alteração de referência.
2. Execute `rtk dotnet build <solução> --no-restore --nologo --verbosity:minimal`.
3. Analise erros e warnings. Remova um warning somente quando a correção ficar restrita aos arquivos da atualização, preservar API e comportamento e não ocultar o diagnóstico.
4. Em falha de restore ou build, repita somente a etapa necessária com saída normal ou `rtk proxy`, preserve o primeiro erro e pare o fluxo.

*Done when:* o restore passou e o build da solução atual passou sem erros; todos os warnings estão classificados como resolvidos, existentes ou bloqueadores.

### 5. Validar testes

1. Detecte o modo de teste antes de escolher a linha de comando. Quando houver .NET 10, `global.json` com `test.runner` MTP, pacote `Microsoft.Testing.Platform`, xUnit v4 ou cobertura MTP, leia `references/mtp.md` em full.
2. No modo VSTest, execute `rtk dotnet test <solução> --no-build --no-restore --nologo --logger "console;verbosity=minimal"`.
3. No modo MTP, use `--solution <solução>` ou `--project <projeto>`; não passe a solução ou projeto como argumento posicional. Quando a solução usa cobertura, inclua os argumentos MTP de cobertura e relatório definidos em `references/mtp.md`.
4. Se a execução agregada MTP retornar zero testes ou código de argumento inválido, execute cada projeto de teste com `--project`, agregue os resultados e trate o problema do agregador como diagnóstico de tooling.
5. Se um teste falhar, repita somente esse teste ou projeto com saída suficiente para identificar a causa. Depois de corrigir uma incompatibilidade autorizada, repita restore quando referências mudarem, build e testes.
6. Classifique uma falha que passa isolada e na repetição da suíte como flakiness; registre o teste e o resultado, sem alterar o comportamento para silenciar o sinal.

*Done when:* todos os testes executáveis da solução passaram, a quantidade total foi registrada e cada zero-testes, warning, flakiness ou projeto sem testes recebeu explicação.

### 6. Corrigir incompatibilidades autorizadas

1. Ao detectar uma quebra causada pela atualização, informe pacote, projeto, erro e etapa afetada.
2. Solicite uma escolha entre corrigir a incompatibilidade e fazer rollback com versão fixada. Continue somente com autorização explícita; rollback nunca é automático.
3. Para MTP autorizado, aplique a menor correção compatível: configuração `global.json`, propriedade do runner no projeto de testes, pacote de cobertura exigido pelo workflow e chamada `--solution`/`--project` no workflow ou action controlado pelo repositório.
4. Para uma action externa que ainda usa `dotnet test <projeto>` posicional, registre o bloqueio e corrija a action quando ela estiver no escopo; não declare o workflow validado apenas por uma execução local equivalente.
5. Após qualquer correção, reexecute somente restore afetado, build afetado e testes afetados; depois repita a suíte da solução.

*Done when:* a incompatibilidade tem correção mínima autorizada ou rollback explicitamente documentado, e a solução afetada passou novamente.

### 7. Encerrar

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
