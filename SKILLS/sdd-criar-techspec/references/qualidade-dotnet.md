# Perfil de qualidade C#/.NET

Registre o perfil na TechSpec para que execução, orquestração e revisão apliquem as mesmas regras sem redescobri-las. O perfil é o contrato de qualidade da feature: o executor o aplica ao escrever, e cada gate a jusante o verifica com os comandos aqui registrados.

Selecione **somente as regras que a feature pode violar**, tipicamente cinco a oito. Uma feature sem assincronia não carrega as regras de async; uma que não registra serviços não carrega as de DI. Perfil que vira catálogo é ignorado por excesso de contexto; perfil curto e pertinente é seguido.

## Classes

Duas classes, com destinos diferentes na revisão:

- **Bloqueante** — defeito com caminho de falha concreto. Hit não justificado na TechSpec impede a conclusão da task e reprova a revisão.
- **Ressalva** — custo de manutenção sem falha demonstrada. Hit vai ao relatório como melhoria opcional e conta para o gatilho de escalonamento; nunca reprova sozinho.

Uma regra pode ter justificativa prévia registrada na TechSpec (`DEC-NN`): nesse caso o hit correspondente é esperado e não é achado. Justificativa vale para o ponto específico, não para o arquivo inteiro.

Hit já listado no **Baseline do terreno** é dívida anterior à feature e não é achado da task: cobrá-lo do executor pune quem encostou no arquivo por último e transforma o perfil em ruído. Só é achado o hit que a task introduziu, ou o hit pré-existente que ela agravou — mais um caso no `switch` saturado, mais uma dependência no construtor já grande. Arquivo alvo ausente do baseline conta como não medido, e todo hit nele é tratado como novo.

## Conjunto grepável

Escopado aos arquivos que a task tocou, nunca ao repositório. Defina as exclusões uma vez:

```powershell
$src = @('-g','!**/bin/**','-g','!**/obj/**','-g','!**/*.g.cs','-g','!**/*.Designer.cs')
$arquivos = @()   # os arquivos do diff da task
```

**Bloqueantes**

```powershell
rtk rg -n --type cs @src 'async void|\.Result\b|\.Wait\(\)|GetAwaiter\(\)\.GetResult\(\)' $arquivos
rtk rg -n --type cs @src 'GetRequiredService<|GetService<|ServiceLocator' $arquivos
rtk rg -n --type cs @src 'catch\s*\{\s*\}|catch \(Exception\w*\)\s*\{\s*\}' $arquivos
rtk rg -n --type cs @src '#nullable disable|#pragma warning disable' $arquivos
```

| Regra | Por que bloqueia |
| --- | --- |
| `async void` fora de event handler | a exceção não pode ser observada nem aguardada |
| `.Result` / `.Wait()` / `GetAwaiter().GetResult()` | deadlock em contexto com sincronização; o remédio é async até a entrada |
| `GetRequiredService`/`GetService` em código de negócio | dependência some da assinatura; o compilador deixa de acusar o que o tipo precisa |
| `catch { }` ou `catch (Exception) { }` vazio | a falha desaparece dos logs e do comportamento |
| `#nullable disable` / `#pragma warning disable` | silencia diagnóstico que o build reportaria; exige `DEC-NN` nomeando o warning |

**Ressalvas**

```powershell
rtk rg -n --type cs @src 'throw new Exception\(|DateTime\.(Now|UtcNow)' $arquivos
rtk rg -n --type cs @src '\w+\((?:[^),]+,){3,}[^)]*\)' $arquivos
rtk rg -c '^' --type cs @src $arquivos | Sort-Object { [int]($_ -split ':')[-1] } -Descending | Select-Object -First 5
```

| Regra | Limiar |
| --- | --- |
| `throw new Exception(` | tipo genérico onde um específico expressa a falha |
| `DateTime.Now`/`UtcNow` em lógica | relógio não injetado impede teste determinístico; `TimeProvider` é a saída |
| Lista de parâmetros | 4+ parâmetros pedem um `record`; construtor com 6+ dependências é responsabilidade demais |
| Tamanho de arquivo | acima de 500 linhas |

O gate é assimétrico: arquivo limpo devolve saída vazia e não consome contexto. O custo acompanha os problemas encontrados, não o tamanho do código.

## Escalonamento

O perfil nunca dispara auditoria pesada dentro do ciclo. Ele acumula contagem para que a revisão **sugira** uma, com número concreto, e a decisão fique no HIL. Gatilhos objetivos:

- oito ou mais hits de ressalva na feature, ou
- um arquivo tocado que cruzou 500 linhas, ou
- o mesmo símbolo ou bloco duplicado em três ou mais pontos do diff.

Nomeie a skill correspondente ao sinal quando ela estiver instalada: duplicação e acoplamento vão para `refactoring-analysis`; código morto e dependências entre projetos vão para `architectural-analysis`; revisão completa do diff vai para `deep-review`. Sem gatilho disparado, não sugira nenhuma.

## Registro na TechSpec

Preencha a seção **Perfil de qualidade** do template com as regras selecionadas, a classe de cada uma, o comando que a verifica e as justificativas prévias. Regra ausente do perfil não é verificada por nenhum gate — a seleção é a decisão que importa. Quando `architectural-analysis` ou `refactoring-analysis` estiverem instaladas, seus catálogos são a fonte de classificação e severidade; este arquivo carrega apenas o subconjunto executável, para que a TechSpec permaneça suficiente sem elas.
