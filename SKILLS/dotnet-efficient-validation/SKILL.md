---
name: dotnet-efficient-validation
description: "Executa build, testes, publish e run de projetos .NET com baixo ruido e sem trabalho redundante. Use obrigatoriamente ao executar dotnet build, test, publish ou run, especialmente com no-restore, no-build, verbosity, filtros, PowerShell ou validação apos alteracoes."
argument-hint: "Informe a solucao, projeto ou teste .NET que deve ser validado."
user-invocable: true
---

# Validacao .NET eficiente

## Quando usar

Use esta skill antes de qualquer execucao de:

- `dotnet build`;
- `dotnet test`;
- `dotnet publish`;
- `dotnet run`;
- validacao de uma solucao, projeto ou teste C#.

## Procedimento

1. Identifique o projeto ou a solucao diretamente afetada.
2. Prefira o teste mais especifico. Use `--filter` quando a alteracao tiver um alvo claro.
3. Se os assets de restauracao estiverem validos, execute o build sem restauracao:

   ```powershell
   rtk dotnet build <projeto-ou-solucao> --no-restore --nologo --verbosity:minimal
   ```

4. Depois de um build valido, execute os testes sem recompilar ou restaurar:

   ```powershell
   rtk dotnet test <projeto-ou-solucao> --no-build --no-restore --nologo --logger "console;verbosity=minimal"
   ```

5. Se as referencias de pacote mudaram, execute primeiro uma restauracao explicita e concisa. Nao use `--no-restore` antes de os assets estarem atualizados:

   ```powershell
   rtk dotnet restore <projeto-ou-solucao> --nologo --verbosity:minimal
   ```

6. Execute `dotnet publish` somente quando o artefato publicado ou a validacao de empacotamento for necessaria. Prefira `--no-restore`; use `--no-build` somente quando o build correspondente ja estiver valido.
7. Para `dotnet run`, use `--no-build --no-restore` quando houver build valido. Nunca use `Out-Null` como diagnostico principal.
8. Em PowerShell, preserve o codigo de saida. Depois de pipes ou comandos compostos, verifique `$LASTEXITCODE` e propague falhas.
9. Use verbosity minima nativa (`--verbosity:minimal`, `-v:minimal`, `--nologo`) antes de filtrar a saida com `Select-Object`.
10. `Select-Object -Last N` reduz o contexto recebido pelo agente, mas nao reduz o trabalho do processo e pode esconder a causa de uma falha. Use-o apenas para uma inspecao complementar depois de preservar o resultado do comando.
11. Se a validacao minima falhar, repita somente a etapa necessaria com saida normal ou `rtk proxy`, preservando o primeiro erro. Nao execute novamente a suite inteira sem motivo.

## Regras

- Sempre prefixe comandos de shell com `rtk`, conforme as instrucoes globais.
- Nao execute suite completa quando um projeto ou filtro especifico atender ao objetivo.
- Nao combine build e test de modo que o teste recompilhe o mesmo codigo sem necessidade.
- Nao silencie `build`, `test`, `publish` ou `run` com `Out-Null`.
- Nao trate a reducao de output como reducao de tempo de compilacao, restauracao, teste ou publish.

## Criterios de conclusao

- O escopo executado corresponde ao comportamento alterado.
- Restauracao, build e testes nao foram repetidos sem necessidade.
- A saida padrao e concisa, mas erros e codigo de saida continuam observaveis.
- Publish ou run so foram executados quando eram necessarios.
