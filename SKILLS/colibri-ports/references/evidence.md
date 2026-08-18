# Evidências: leitura de portas no ambiente Colibri

## Matriz

| ID | Afirmação | Evidência na referência | Classificação |
| --- | --- | --- | --- |
| E1 | `ConfiguracoesDeAmbiente` lê o ambiente e inicializa portas/conexões | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:17-69,239-337`; `DConnect/Source/Extensions.cs:41` | observado |
| E2 | Master usa `ncrmaster.cfg`; cliente usa `launcher.boot` e `launcher.conexao` | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:194,199-204,337-359,365-385,415-430` | observado |
| E3 | A referência transforma a chave do DConnect em uma propriedade específica de `Portas` | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:388-401,484-524` | observado; caso concreto reutilizável para orientar outras propriedades |
| E4 | `Portas.DConnect` e `Master.Porta` são distintas, com defaults 5600 e 4000 | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:252-254,571-573,614-629` | observado |
| E5 | `ProvedorDeConfiguracoesDoAmbiente` expõe propriedades de ambiente e portas | `_lib/CoLib.Colibri/Source/IProvedorDeConfiguracoesDoAmbiente.cs:7-48`; `_lib/CoLib.Colibri/Source/ProvedorDeConfiguracoesDoAmbiente.cs:4-38` | observado |
| E6 | A configuração é carregada por instâncias estáticas/lazy | `DConnect/Source/Extensions.cs:41`; `_lib/CoLib.Colibri/Source/ProvedorDeConfiguracoesDoAmbiente.cs:4-6` | observado; reload desconhecido |
| E7 | Arquivos obrigatórios falham explicitamente e o cache opcional preserva defaults | `_lib/CoLib.Ambiente/Source/ConfiguracoesDeAmbiente.cs:344-359,422-457,571-573` | observado |
| E8 | Não há teste direto do parsing real das configurações de ambiente | `DConnect.Testes/Source/InicializadorDoDConnectTestes.cs:28-48,61-106`; `DConnect.Testes/DConnect.Testes.csproj:61-66` | observado como lacuna |
| E9 | As bibliotecas Colibri são código local, sem versão NuGet comprovada | `DConnect/DConnect.csproj:3,81,106`; `_lib/CoLib.Ambiente/CoLib.Ambiente.csproj:4-19`; `_lib/CoLib.Colibri/Colibri.projitems:12-16` | observado |

## Lacunas que o alvo deve resolver

- componente que grava ou atualiza `launcher.conexao`;
- propriedade solicitada que não esteja exposta no contrato Colibri;
- compatibilidade de versão e forma de inclusão das bibliotecas Colibri;
- cobertura de testes de parsing, propriedade selecionada e ciclo de vida.
