---
id: caminho-drive
titulo: Caminho fixo com letra de unidade em OutputPath e similares
fase: pos-build
status: confirmado
ajuste: com-risco
checagem: caminho_drive
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
---

## Sintoma

Nenhum erro. O build cria dentro do projeto uma árvore de pastas literalmente chamada `D:` ou `d:`.

## Causa

No Linux, `D:\projetos\saida` é um caminho relativo.

## Correção

Mantenha o destino no Windows e deixe o padrão (`bin/`) nos outros sistemas, juntando à condição existente:

```xml
<OutputPath Condition="'$(Configuration)' == 'Debug' And $([MSBuild]::IsOSPlatform('Windows'))">D:\projetos\saida\</OutputPath>
```

Se várias propriedades do mesmo `PropertyGroup` dependerem do caminho, condicione o grupo.

## Riscos e opções

- **Risco:** condicionado ao sistema, o Windows não muda; no Linux a saída vai para `bin/`, e scripts, empacotamento
  ou depuração que esperam o destino antigo deixam de encontrar os arquivos. Remover o caminho muda também o Windows.
- **Opção recomendada:** condicionar ao Windows.
- **Alternativa:** tornar o destino uma propriedade configurável, com o valor atual como padrão no Windows.

## Armadilhas

- As pastas criadas continuam lá após a correção. Procure com `find . -iname '?:'` (há `D:` e `d:`) e confira, pela
  data e pelo `git ls-files`, que foi o build que as criou antes de apagar.
- O `.gitignore` pode escondê-las do `git status`.
- Caminhos relativos que saem do repositório (`..\..\outro\`) não são apontados: funcionam nos dois sistemas, mas
  escrevem fora do projeto.
- Outros alvos podem supor o destino antigo (empacotamento, `launchSettings.json`). O `launchSettings.json` não
  afeta o build.

## Evidência

Projetos de aplicação e de submódulo em cinco repositórios. Com a condição, nenhuma pasta foi criada no Linux.
