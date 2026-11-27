---
id: windows-targeting
titulo: Alvo net*-windows sem EnableWindowsTargeting
fase: restore
status: confirmado
ajuste: seguro
checagem: windows_targeting
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - NETSDK1100
---

## Sintoma

`error NETSDK1100: Para construir um projeto direcionado ao Windows neste sistema operacional, defina a propriedade
EnableWindowsTargeting como verdadeiro.`

## Causa

Fora do Windows, o SDK só baixa os pacotes de referência do Windows Desktop se a propriedade for pedida.

## Correção

No `Directory.Build.props` (na raiz que cobre os projetos):

```xml
<PropertyGroup>
  <EnableWindowsTargeting Condition="!$([MSBuild]::IsOSPlatform('Windows'))">true</EnableWindowsTargeting>
</PropertyGroup>
```

## Riscos e opções

- **Risco:** nenhum no Windows, pois a propriedade fica condicionada aos outros sistemas. Habilita compilar, não executar.
- **Opção recomendada:** propriedade condicionada no `Directory.Build.props` de cada escopo.
- **Alternativa:** tirar o projeto do build no Linux com um filtro de solução (`.slnf`).

## Armadilhas

- O MSBuild importa só o `Directory.Build.props` mais próximo de cada projeto. Submódulo com arquivo próprio precisa
  da propriedade nele também, a menos que esse arquivo importe o de cima.
- A variável de ambiente `EnableWindowsTargeting=true` resolve na sua máquina e esconde o problema dos outros.
  Verifique sem ela.
- Compilar não permite executar: WinForms e WPF continuam dependendo do Windows.

## Evidência

Reproduzido e resolvido com um `Directory.Build.props` por escopo (raiz e submódulo), sem a variável de ambiente.
