---
name: delphi-xe2-build
description: 'Compilação Delphi XE2 (RAD Studio 9.0) por linha de comando: use quando for preciso compilar, buildar ou validar a compilação de um projeto Delphi XE2 (.dproj, .dpr, .dpk, .groupproj) com MSBuild e rsvars.bat, compilar pacotes antes das aplicações, redirecionar saídas para não sobrescrever a instalação do Sistema Colibri ou diagnosticar F1026, MSB1006 e MSB3073. Não use para outras versões do Delphi, instalar componentes na IDE, editar código Pascal ou gerar instaladores.'
argument-hint: 'Informe o .dproj ou .groupproj a compilar e se a saída pode ir para a instalação do Sistema Colibri.'
---

# Compilação Delphi XE2

Compila projetos Delphi XE2 fora da IDE com [scripts/Invoke-XE2Build.ps1](./scripts/Invoke-XE2Build.ps1). O script chama o `rsvars.bat` do RAD Studio 9.0 e o MSBuild do .NET 4 e passa explicitamente as propriedades que os `.dproj` só recebem dentro da IDE: caminho de units, pastas de saída e `NCRColibri`, preenchida com a variável `SISTEMA_COLIBRI`.

## Passo 1: Identificar o alvo e a ordem

1. Localize o `.dproj` pedido. Se houver `.groupproj` na raiz, leia os `<Projects Include="...">`: a ordem ali é a ordem de compilação, com os pacotes (`.dpk`, por exemplo `_agile-lib/prj/agileLib.dproj` e `_colibri-lib/prj/colibriLib.dproj`) antes das aplicações.
2. Para cada `.dproj`, leia `DCC_ExeOutput`, `DCC_DcuOutput`, `DCC_BplOutput`, `DCC_DcpOutput`, `DCC_UnitSearchPath` e `PostBuildEvent`. Anote destinos que usam `$(NCRColibri)`, `$(CLIB32)` ou `$(CBPL32)` e eventos pós-build que copiam arquivos.
3. Rode `git status --porcelain` no repositório e guarde o resultado, para separar depois as mudanças do build das que já existiam.

**Saída:** lista ordenada de `.dproj`, destinos de saída e eventos pós-build conhecidos, e o estado Git anterior.

## Passo 2: Conferir o ambiente

1. Confira se `C:\Program Files (x86)\Embarcadero\RAD Studio\9.0\bin\rsvars.bat` e `%WINDIR%\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe` existem. Se não existirem, pare e informe: sem eles não há build.
2. Confira as pastas do caminho de units: `D:/Vcl/xe2lib` e `D:/Vcl/xe2bpl` (terceiros) e o co2lib (`D:/Vcl/co2lib`, onde ficam os DCUs dos pacotes da solução). A referência das variáveis está em [references/diagnostico.md](./references/diagnostico.md#variáveis-do-ambiente-xe2).
3. Resolva `SISTEMA_COLIBRI` (processo, depois usuário, depois máquina). Um terminal aberto antes de a variável ser criada não a herda; o script lê os escopos de usuário e de máquina por conta própria.

**Saída:** ferramentas presentes, pastas do caminho de units conferidas e `SISTEMA_COLIBRI` resolvida, ou o bloqueio exato.

## Passo 3: Proteger a instalação

O `DCC_ExeOutput` e os eventos pós-build costumam apontar para `$(NCRColibri)\master\...`, isto é, para a instalação do Sistema Colibri usada no dia a dia.

- Para validar a compilação, sempre passe `-ExeOut`, `-DcuOut`, `-BplOut` e `-DcpOut` para uma pasta temporária, e `-SistemaColibri` para uma pasta temporária que contenha a estrutura esperada pelo pós-build (por exemplo `<temp>\Sistema Colibri\master\colibri\guard`).
- Grave na instalação real só quando o usuário pedir. Nesse caso, confira antes se as pastas de destino do pós-build existem: `copy` para uma pasta inexistente grava um arquivo com o nome dela.
- Não crie nem sobrescreva `D:\Vcl\co2lib` sem pedido. Use um co2lib temporário.

**Saída:** pastas de saída escolhidas e autorização registrada para qualquer escrita fora da pasta temporária.

## Passo 4: Compilar os pacotes

Se as DCUs dos pacotes da solução não estiverem no co2lib, compile cada pacote, na ordem do `.groupproj`, com todas as saídas no mesmo co2lib:

```powershell
$co2 = "<temp>\co2lib"
& <skill>\scripts\Invoke-XE2Build.ps1 -Dproj <pacote>.dproj `
  -DcuOut $co2 -BplOut $co2 -DcpOut $co2 -ExeOut "<temp>\exe" `
  -UnitSearchPath 'D:/Vcl/Xe2lib','D:/Vcl/Xe2bpl',$co2 `
  -SistemaColibri "<temp>\Sistema Colibri\" *> "<temp>\<pacote>.log"
```

Rode a partir da pasta do `.dproj` (`Set-Location`), porque os eventos de build usam caminhos relativos. Um pacote que depende de outro (por exemplo `colibriLib` de `agileLib`) encontra o `.dcp` pelo co2lib.

**Saída:** `.bpl`, `.dcp` e `.dcu` de cada pacote no co2lib.

## Passo 5: Compilar as aplicações

Compile cada aplicação com o mesmo comando do passo 4, trocando o `.dproj`. O co2lib precisa estar em `-UnitSearchPath`: o compilador não procura units na pasta de saída de DCUs. Redirecione a saída completa para um log (`*> <log>`) em vez de filtrar a saída na tela, porque o `cmd /c` do script não passa pelo pipe do PowerShell.

**Saída:** executáveis gerados na pasta de saída, com data e hora da compilação.

## Passo 6: Verificar

1. O script lança `Build falhou (<código>)` quando o MSBuild termina com erro. Com falha, procure no log a primeira linha com `Fatal`, ` error ` ou `MSB` e siga [references/diagnostico.md](./references/diagnostico.md). Um `MSB3073` só no pós-build significa que a compilação terminou e a cópia falhou: confira se o executável foi gerado antes de concluir qualquer coisa.
2. Confira que cada executável ou `.bpl` esperado existe e tem data desta compilação.
3. Quando o build valida uma mudança de código, procure no binário um literal que só existe na versão nova (por exemplo, o texto de um SQL alterado).
4. Rode `git status --porcelain` de novo e compare com o passo 1. O build regera os `.res` rastreados: confira com `git diff`. Artefatos novos (`.dcu`, `.exe`, `.bpl`) dentro do repositório indicam que uma saída não foi redirecionada.

**Saída:** resultado do build por projeto, com evidência (log, executável e data), e nenhuma mudança não explicada no repositório.

## Regras

- Não altere `.dproj`, `.groupproj` ou eventos de build sem autorização. Se um evento pós-build quebrar por falta de aspas, proponha a correção.
- Arquivos `.pas` e `.dfm` costumam estar em Windows-1252; nunca os converta para UTF-8 ao editar.
- Duas falhas seguidas com a mesma causa de ambiente (biblioteca de terceiros ausente, ferramenta faltando) viram bloqueio reportado ao usuário, com a mensagem do compilador.
- Não execute o programa compilado nem instale pacotes na IDE como parte da validação.
