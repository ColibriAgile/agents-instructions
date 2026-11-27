---
id: caminho-caixa
titulo: Caminho com maiúsculas ou minúsculas diferentes do disco
fase: build
status: confirmado
ajuste: seguro
checagem: caminho_caixa
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - error CS2001
  - MSB9008
---

## Sintoma

`error CS2001: Arquivo de origem "..." não pode ser encontrado`, para um arquivo que existe com outra caixa.
Em um `ProjectReference`, o sintoma engana: sai só o aviso `MSB9008: o projeto referenciado ... não existe`, e os
erros são `CS0103` ou `CS0234` (nome ou namespace inexistente) no código que usa o projeto. Procure o aviso antes de
mexer no código. A mesma causa afeta `Import`, recursos e entradas da solução.

## Causa

O sistema de arquivos do Linux distingue `source/` de `Source/`; o do Windows, por padrão, não. Referências erradas
se acumulam em `.projitems`, `.csproj`, `.props`, `.targets`, `.sln` e `.slnx`.

## Correção

Ajuste a **referência** para o nome que está no disco, com `scripts/corrigir_caixa.py`. Não exige renomear nada e é
neutro no Windows.

Só renomeie o arquivo se o nome no disco for o errado. No Windows, mudar apenas a caixa exige dois passos:
`git mv source tmp` e depois `git mv tmp Source`.

## Riscos e opções

- **Risco:** nenhum conhecido no Windows, que ignora a diferença. Referências ambíguas exigem decisão e saem desta classe.
- **Opção recomendada:** corrigir as referências com `corrigir_caixa.py`.
- **Alternativa:** renomear arquivos ou pastas; mexe em mais lugares e pede `git mv` em dois passos no Windows.

## Armadilhas

- O primeiro build mostra só parte das ocorrências (as dos projetos que chegaram a compilar). Use o diagnóstico.
- Links simbólicos com a caixa errada não equivalem à correção: em um teste, sobraram erros `CS0234` que sumiram
  quando as referências foram corrigidas de verdade.
- O script não cobre caminhos dentro do código C# (`Path.Combine("recursos", ...)`), globs depois do primeiro
  curinga, caminhos montados com outras propriedades MSBuild nem arquivos fora do MSBuild (scripts, `appsettings`).
- Dois nomes que só diferem na caixa na mesma pasta são relatados como ambíguos e ficam para correção manual.

## Evidência

Referência de projeto isolada (SDK 11.0.100): `MSB9008` seguido de `CS0103`.

Seis repositórios: 1 a 70 referências em cada um, quase todas em um submódulo compartilhado. Após a correção
automática (somada às de outros casos), todas as soluções compilaram em cópias.
