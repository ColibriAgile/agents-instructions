---
id: net-framework
titulo: Alvo .NET Framework (net4x) não roda no runtime do .NET
fase: execucao
status: hipotese
ajuste: incompativel
checagem: dependencia_windows
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
---

## Sintoma

O projeto pode compilar no Linux, mas o resultado depende do .NET Framework, que é do Windows.

## Causa

.NET Framework não é distribuído para Linux.

## Correção

Não há ajuste que leve o `net4x` ao runtime do .NET.

## Riscos e opções

- **Manter só Windows:** aceitar a compilação no Linux apenas como verificação.
- **Multi-target:** acrescentar `netstandard2.0` ou `netX.0` se o código não usar APIs exclusivas.
- **Migrar** o projeto para `netX.0`.

## Armadilhas

Mono não foi avaliado. Bibliotecas `net4x` com dependências nativas ou de GAC podem falhar já no build.

## Evidência

Uma biblioteca `net48` mínima compilou. A execução não foi testada.
