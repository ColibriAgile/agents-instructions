# Evidências: leitura de portas no ambiente Colibri

## Matriz

| ID | Afirmação | Evidência na referência | Classificação |
| --- | --- | --- | --- |
| E1 | `ConfiguracoesDeAmbiente` lê o ambiente e inicializa portas/conexões | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:17-69,239-337`; `DConnect/Source/Extensions.cs:41` | observado |
| E2 | Master usa `ncrmaster.cfg`; cliente usa `launcher.boot` e `launcher.conexao`; no Master, os valores de porta usam argumentos de linha de comando antes do INI | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:194,199-204,337-359,365-385,388-401,415-430`; `_lib/CoLib.ArquivoIni/Source/ArquivoIni.cs:68-80` | observado |
| E3 | A referência transforma a chave do DConnect em uma propriedade específica de `Portas` | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:388-401,484-524` | observado; caso concreto reutilizável para orientar outras propriedades |
| E4 | `Portas.DConnect` e `Master.Porta` são distintas, com defaults 5600 e 4000 | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:252-254,571-573,614-629` | observado |
| E5 | `ProvedorDeConfiguracoesDoAmbiente` expõe propriedades de ambiente e portas | `_lib/CoLib.Colibri/Source/IProvedorDeConfiguracoesDoAmbiente.cs:7-48`; `_lib/CoLib.Colibri/Source/ProvedorDeConfiguracoesDoAmbiente.cs:4-38` | observado |
| E6 | A configuração é carregada uma vez por campos `static readonly` dos consumidores observados | `DConnect/Source/Extensions.cs:41`; `_lib/CoLib.Colibri/Source/ProvedorDeConfiguracoesDoAmbiente.cs:4-6` | observado; reload desconhecido |
| E7 | Arquivos obrigatórios falham explicitamente; falhas do cache antes da atribuição de `Portas` preservam os defaults, mas não há rollback se uma exceção ocorrer depois dessa atribuição | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:344-359,415-482,484-524,571-573` | observado |
| E8 | Não há teste direto do parsing real das configurações de ambiente | `DConnect.Testes/Source/InicializadorDoDConnectTestes.cs:28-48,61-106`; `DConnect.Testes/DConnect.Testes.csproj:61-66` | observado como lacuna |
| E9 | As bibliotecas Colibri são código local, sem versão NuGet comprovada | `DConnect/DConnect.csproj:3,81,106`; `_lib/CoLib.Ambiente/CoLib.Ambiente.csproj:4-19`; `_lib/CoLib.Colibri/Colibri.projitems:12-16` | observado |

## Lacunas que o alvo deve resolver

- componente que grava ou atualiza `launcher.conexao`;
- propriedade solicitada que não esteja exposta no contrato Colibri;
- necessidade de reproduzir ou substituir a precedência dos argumentos de linha de comando no modo Master;
- compatibilidade de versão e forma de inclusão das bibliotecas Colibri;
- cobertura de testes de parsing, propriedade selecionada e ciclo de vida.
