---
id: referencia-com
titulo: COMReference não é suportado pelo dotnet build
fase: build
status: sintoma-confirmado
ajuste: incompativel
checagem: dependencia_windows
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - MSB4803
---

## Sintoma

`error MSB4803: a tarefa "ResolveComReference" não é compatível com a versão do .NET Core do MSBuild`.

## Causa

A resolução de referências COM só existe no MSBuild do .NET Framework, que roda no Windows.

## Correção

Não há equivalente no MSBuild do .NET.

## Riscos e opções

- **Manter só Windows:** compilar esse projeto com o `msbuild.exe` e excluí-lo do build Linux (`.slnf`).
- **Gerar o assembly de interop uma vez no Windows** e referenciá-lo como DLL ou pacote: compila, mas o COM continua
  indisponível em execução no Linux.
- **Substituir o componente COM** por uma biblioteca portável.

## Armadilhas

A mensagem indica que o `dotnet build` também falha no Windows; confirme antes de tratar como regressão de portabilidade.

## Evidência

Projeto mínimo com `COMReference` falhou com `MSB4803` no Linux.
