# Diagnóstico de build Delphi XE2

Procure no log a primeira linha com `Fatal`, ` error ` ou `MSB`. As mensagens do MSBuild saem no idioma do Windows (por exemplo, "A sintaxe do comando está incorreta").

| Sintoma | Causa | Correção |
| --- | --- | --- |
| `F1026 File not found: '<unit>.dcu'`, e a unit é de um pacote da própria solução (`suporte.*`, `licenciamento.*`, `colibri.*`) | O pacote não foi compilado ou a pasta de DCUs dele (`co2lib`) não está no caminho de units | Compile antes os pacotes do `.groupproj` com saída no co2lib e passe o co2lib em `-UnitSearchPath` |
| `F1026 File not found: '<unit>.dcu'`, e a unit é de terceiros (`PythonEngine`, `superobject`, `ACBr*`) | `D:/Vcl/xe2lib` ou `D:/Vcl/xe2bpl` fora do caminho, ou a biblioteca não está instalada | Confira `-UnitSearchPath` e se o `.dcu` existe nessas pastas |
| `F1026` em compilação feita sem o script | Os `.dproj` usam `$(XE2LIB);$(CLIB32);$(CBPL32)` no caminho, e essas variáveis não estão definidas no processo | Use o script, que passa o caminho explícito |
| `MSB1006: Property is not valid` apontando para um trecho de caminho | Valor de propriedade com `;` passado sem aspas | Passe o valor entre aspas ou troque `;` por `%3B` |
| `MSB3073`: o comando `copy ... $(NCRColibri)\...` saiu com código 1 e "A sintaxe do comando está incorreta" | Evento pós-build sem aspas e caminho com espaço (`Sistema Colibri`) | Ponha aspas no destino do `copy` no `.dproj`, com autorização do usuário. Nomes 8.3 costumam estar desativados, então não há contorno pelo script |
| `MSB3073` no `copy` com o destino `\master\colibri\...` | `NCRColibri` vazio: `SISTEMA_COLIBRI` não definida ou não herdada | Passe `-SistemaColibri` ou defina a variável. O script também procura nos escopos de usuário e de máquina |
| O pós-build "funcionou", mas aparece um arquivo sem extensão no lugar de uma pasta | O `copy` com destino inexistente grava um arquivo com o nome da pasta | Crie a pasta de destino antes do build |
| O executável instalado mudou sem pedido | `DCC_ExeOutput` do `.dproj` aponta para `$(NCRColibri)\master\...` | Sempre passe `-ExeOut`, e `-SistemaColibri` para uma pasta temporária, salvo pedido explícito |
| `git status` mostra `.res` modificado | O build regera o `.res` | Confira `git diff`. Se o conteúdo mudou, restaure com `git checkout -- <arquivo>.res` quando o usuário não quiser a mudança |
| `.pas` com acentos quebrados depois de editar | O arquivo é Windows-1252 e foi salvo em UTF-8 | Edite em bytes, preservando a codificação. Confira com `file <arquivo>` (esperado: ISO-8859) |

## Variáveis do ambiente XE2

A referência local é `D:/Vcl/dxe2_enviroment_variables.reg` (chave `HKCU\SOFTWARE\Embarcadero\BDS\9.0\Environment Variables`):

| Variável | Valor esperado | Uso nos `.dproj` |
| --- | --- | --- |
| `XE2LIB` | `D:\Vcl\xe2lib` | DCUs de terceiros |
| `XE2BPL` | `D:\Vcl\xe2bpl` | BPLs e DCPs de terceiros |
| `CLIB32` | `D:\Vcl\co2lib` | Saída de DCUs dos pacotes da solução |
| `CBPL32` | `D:\Vcl\co2lib` | Saída de BPL e DCP dos pacotes da solução |
| `NCRColibri` | Preenchida pelo script com `SISTEMA_COLIBRI` | `ExeOutput` e eventos de build |

Essas variáveis valem dentro do IDE. Em linha de comando elas não existem, a menos que o script ou o processo as defina.
