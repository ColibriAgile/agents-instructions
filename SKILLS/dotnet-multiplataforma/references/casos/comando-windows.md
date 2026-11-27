---
id: comando-windows
titulo: Exec ou evento de build que só funciona no cmd.exe
fase: pos-build
status: confirmado
ajuste: com-risco
checagem: comando_windows
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - error MSB3073
---

## Sintoma

`error MSB3073: O comando "..." foi encerrado com o código 127` (comando não encontrado no `/bin/sh`).

## Causa

`<Exec>`, `PreBuildEvent` e `PostBuildEvent` rodam no `cmd.exe` no Windows e no `/bin/sh` fora dele. Mesmo um `echo`
quebra: em `echo $(DefineConstants)`, os `;` da lista separam comandos no shell.

## Correção

Prefira tarefas do próprio MSBuild, que funcionam nos dois sistemas sem condição.

Em vez de `echo`:

```xml
<Message Importance="high" Text="DefineConstants: $(DefineConstants)" />
```

Em vez de `xcopy "Html\*.*" "$(OutputPath)\Html\" /I /Y`:

```xml
<ItemGroup>
  <_ArquivosHtml Include="Html\*.*" />
</ItemGroup>
<Copy SourceFiles="@(_ArquivosHtml)" DestinationFolder="$(OutputPath)Html" SkipUnchangedFiles="true" />
```

Para `xcopy /E` (subpastas), use `Include="Html\**\*.*"` e
`DestinationFiles="@(_ArquivosHtml->'$(OutputPath)Html\%(RecursiveDir)%(Filename)%(Extension)')"`.
Equivalentes: `del` -> `Delete`, `mkdir` -> `MakeDir`, `rmdir` -> `RemoveDir`, `move` -> `Move`.

Se o passo só faz sentido no Windows (registro COM, assinatura, instalador), condicione o `Target`:
`Condition="$([MSBuild]::IsOSPlatform('Windows'))"`, e avise que o artefato correspondente não sai no Linux.

## Riscos e opções

- **Risco:** reescrever o comando muda também o build do Windows (`Copy` e `xcopy` diferem em subpastas, atributos e
  tratamento de erro). Condicionar o passo ao Windows deixa o Linux sem o artefato que ele gera.
- **Opção recomendada:** tarefa do MSBuild quando há equivalente direto; confirmar a saída no Windows.
- **Alternativa:** dois alvos condicionados por sistema, mantendo o comando original no Windows.

## Armadilhas

- Dentro de `<Target>`, `Include` é avaliado na execução; declare o `ItemGroup` ali se os arquivos forem gerados.
- A checagem usa uma lista de comandos conhecidos. Ferramentas próprias chamadas sem extensão passam despercebidas.

## Evidência

`echo` falhou com código 127 em um projeto WinForms compartilhado. Com `Message` e `Copy`, a solução compilou e os
arquivos foram copiados para a saída. As demais equivalências e o caso com subpastas não foram testados.
