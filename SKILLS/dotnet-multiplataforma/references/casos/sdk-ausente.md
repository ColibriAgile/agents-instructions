---
id: sdk-ausente
titulo: global.json pede um SDK que não está instalado
fase: restore
status: confirmado
ajuste: seguro
checagem: sdk_global_json
verificado_em: Linux, 2026-11-27
sinais:
  - A compatible \.NET SDK was not found
---

## Sintoma

`A compatible .NET SDK was not found. Requested SDK version: X` ao rodar `dotnet` dentro da pasta.

## Causa

Não é diferença entre sistemas, mas aparece ao preparar uma máquina nova. `rollForward: latestFeature` não passa
para outra versão principal: com apenas o SDK 11, um `global.json` que pede 10.0.x falha.

## Correção

Instale a versão pedida (podem coexistir):
`dotnet-install.sh --channel 10.0 --install-dir "$HOME/.dotnet"`.
Pacotes da distribuição podem estar atrás da versão pedida. Alterar o `global.json` afeta todos: pergunte antes.

## Riscos e opções

- **Risco:** nenhum ao instalar o SDK pedido na máquina. Mudar o `global.json` afeta todos e deixa de ser seguro.
- **Opção recomendada:** instalar a versão pedida ao lado das existentes.
- **Alternativa:** alterar o `global.json`, com acordo da equipe.

## Armadilhas

- Vale o `global.json` encontrado subindo a partir da pasta atual, não o da pasta do projeto passado como argumento.
- Um `global.json` só com a seção `test` não restringe o SDK.

## Evidência

Mensagem reproduzida com um `global.json` pedindo uma versão ausente.
