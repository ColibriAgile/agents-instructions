# Testes que detectam a falha antes da produção

Os testes comuns não detectam a diferença entre o Newtonsoft e o System.Text.Json (STJ) por 3 motivos:

1. O teste cria a entrada com o serializador novo (`RespondWithJson(objeto)`, `Serializar(esperado)`). Ele prova só que o perfil lê o que ele mesmo escreve.
2. A entrada do teste é limpa. O sistema real envia `""`, número em texto e GUID com chaves.
3. A migração reescreve o assert junto com o código.

Os 4 testes abaixo fecham essas lacunas. O teste 3 (oráculo) é o que mais detecta diferenças. Use os nomes e a pilha do projeto (xUnit v3, Shouldly, Verify).

## 1. Bateria de entradas sujas por perfil

Crie 1 teste por perfil JSON que lê dado externo. O teste usa um tipo de sonda com 1 propriedade de cada tipo, e não um DTO real. Assim o teste continua válido quando os DTOs mudam.

```csharp
public sealed class Sonda
{
    public int? Inteiro { get; set; }
    public decimal? Decimal { get; set; }
    public Guid Guid { get; set; }
    public Guid? GuidAnulavel { get; set; }
    public DateTime Data { get; set; }
    public DateTime? DataAnulavel { get; set; }
    public MeuEnum? Enum { get; set; }
    public string? Texto { get; set; }
    public bool Booleano { get; set; }
    public Dictionary<string, int>? PorTexto { get; set; }   // G10: a chave também passa pelo converter de string
    public Dictionary<Guid, int>? PorGuid { get; set; }      // G10
}

[Theory]
[InlineData("""{"inteiro":""}""")]                 // T4
[InlineData("""{"decimal":""}""")]                 // T4
[InlineData("""{"guidAnulavel":""}""")]            // T4
[InlineData("""{"dataAnulavel":""}""")]            // T4 (incidente de produção)
[InlineData("""{"enum":""}""")]                    // T4
[InlineData("""{"INTEIRO":1}""")]                  // L1
[InlineData("""{"inteiro":"12"}""")]               // T1
[InlineData("""{"decimal":"1.50"}""")]             // T1
[InlineData("""{"guid":"{0f8fad5b-d9cb-469f-a165-70867728950e}"}""")]  // T8 (incidente de produção)
[InlineData("""{"guid":"0f8fad5bd9cb469fa16570867728950e"}""")]        // T8
[InlineData("""{"data":"2026-11-25 10:00:00"}""")] // D1
[InlineData("""{"enum":"valorUm"}""")]             // E1
[InlineData("""{"enum":"1"}""")]                   // E1
[InlineData("""{"texto":12}""")]                   // T2
[InlineData("""{"booleano":"true"}""")]            // T3
[InlineData("""{"booleano":1}""")]                 // T3
[InlineData("""{"campoNovo":1}""")]                // membro desconhecido
[InlineData("""{"porTexto":{"a":1}}""")]           // G10
[InlineData("""{"porGuid":{"0f8fad5b-d9cb-469f-a165-70867728950e":1}}""")]  // G10
public void Ler_QuandoEntradaSuja_DeveLerSemExcecao(string json)
    => Should.NotThrow(() => JsonSerializer.Deserialize<Sonda>(json, PerfilDoProjeto.Opcoes));
```

Regras:

- Mantenha só as linhas que o Newtonsoft aceitava com a configuração antiga do projeto. Se há dúvida, execute o caso em `assets/jsondiff`.
- Acrescente os formatos de data reais do contrato (por exemplo `yyyyMMdd HH:mm:ss` do CIS).
- Um perfil com contexto gerado precisa do tipo `Sonda` no contexto de teste. Combine o contexto de teste com o do perfil por `JsonTypeInfoResolver.Combine`.
- Acrescente um segundo teste que confirma o valor lido nos casos de incidente (`""` vira `null`, GUID com chaves vira o GUID).
- A sonda tem `Guid` e `Guid?`, `DateTime` e `DateTime?` de propósito. Um formato que funciona no tipo anulável pode falhar no tipo não anulável, e o contrário. Ao testar um DTO real, escolha um campo de cada tipo.
- Confirme que o teste detecta o defeito: execute 1 vez com a correção revertida. Os casos de incidente devem falhar.
- Fixe os nomes da sonda com `[JsonPropertyName]` quando o perfil tem política de nomes. Um nome que não casa é ignorado sem aviso, e o `Should.NotThrow` passa sem ler o campo. Prefira comparar o valor lido.
- A cópia do perfil com outro resolver prova os converters, mas não prova o perfil congelado nem o contexto gerado. Acrescente 1 leitura suja por perfil com um DTO já registrado no contexto real, sem cópia: `JsonSerializer.Deserialize(json, Perfil.Opcoes.GetTypeInfo(typeof(Dto)))`.
- Acrescente 1 teste de ida e volta de dicionário (leitura e escrita) e confirme que a chave escrita não mudou.
- Confirme que a escrita não mudou: serialize a sonda com o perfil e compare com um texto literal. Um converter novo na coleção `Converters` pode mudar a escrita de um tipo que tinha `[JsonConverter]` (G9).
- O teste do projeto roda com a reflexão ligada. Se um consumidor usa `JsonSerializerIsReflectionEnabledByDefault=false`, trimming ou AOT, execute `assets/jsondiff-sem-reflexao` depois de alterar um converter. O defeito G10 só aparece nessa condição.

## 2. Teste de contrato do contexto gerado

Um perfil só com `JsonSerializerContext` lança `NotSupportedException` para um tipo não registrado. O erro aparece só quando o código serializa esse tipo. Este teste percorre os tipos e falha no build de testes.

```csharp
public static TheoryData<Type> TiposDoContrato()
    => [.. typeof(TipoDoAssembly).Assembly.GetExportedTypes()
        .Where(static t => t.Namespace?.Contains(".Modelos") == true && !t.IsAbstract && !t.IsGenericTypeDefinition)];

[Theory]
[MemberData(nameof(TiposDoContrato))]
public void Contexto_QuandoTipoDoContrato_DeveTerMetadado(Type tipo)
    => Should.NotThrow(() => PerfilDoProjeto.Opcoes.GetTypeInfo(tipo));
```

Ajuste o filtro para os tipos que o projeto serializa. Registre também `List<T>`, `T[]` e `Dictionary<string, T>` quando o código os serializa na raiz.

## 3. Equivalência com o Newtonsoft como oráculo

Este é o teste mais forte. Ele executa a mesma entrada no código antigo e no código novo e compara os resultados. Ele não depende de um arquivo que alguém pode aceitar de novo sem ler.

1. Copie o código antigo de serialização (modelos e funções que usam o Newtonsoft) para uma pasta `Legado` do projeto de **testes**, num namespace próprio (por exemplo `Projeto.Legado`). Obtenha o código com `git show <commit-base>:<arquivo>`.
2. Referencie o pacote `Newtonsoft.Json` só no projeto de testes. O projeto de produção fica sem ele.
3. Escreva 1 teoria de leitura: cada entrada passa pelo legado e pelo novo. Compare os valores lidos, ou compare "os 2 lançam".
4. Escreva 1 teoria de escrita: cada objeto de exemplo é escrito pelos 2 lados. Compare o texto.
5. Registre cada diferença aceita como um caso explícito com a linha da matriz. Exemplo: o legado devolve `6.6600000000000001421` e o novo devolve `6.66` (N12).

```csharp
[Theory]
[MemberData(nameof(Entradas))]   // inclua as entradas sujas da seção 1
public void Ler_QuandoMesmaEntrada_DeveDarOMesmoResultadoDoLegado(string json)
{
    var legado = Tentar(() => Legado.Cliente.Ler(json));
    var novo = Tentar(() => Cliente.Ler(json));

    novo.Lancou.ShouldBe(legado.Lancou);
    novo.Valor.ShouldBeEquivalentTo(legado.Valor);
}
```

Quando o legado não cabe no projeto de testes (dependências demais), use o golden em arquivo abaixo.

### Golden do json enviado, criado com o Newtonsoft

O golden prova que o json enviado não mudou. Ele só tem valor se o Newtonsoft criou o arquivo.

1. Antes de trocar a biblioteca, escreva o teste que serializa objetos de exemplo com o código atual e grava o texto com o Verify.
2. Faça o commit desse teste e dos arquivos `.verified.txt` **sozinho**, com o Newtonsoft ainda no projeto.
3. Troque a biblioteca em outro commit. O teste deve passar sem alteração nos arquivos `.verified.txt`.
4. Se um arquivo `.verified.txt` precisa mudar, registre a linha da matriz que justifica a mudança.

Grave o texto do json (`Verify(json)` ou `VerifyJson`), e não o objeto: o `Verify(objeto)` usa um serializador próprio e não mostra a diferença.

Dados do objeto de exemplo que revelam diferenças: texto com acento e `<`, `decimal` inteiro (`5m`), `double` inteiro, data local e UTC, enum, propriedade `null`, tipo derivado em propriedade do tipo base, tupla e dicionário.

Se o projeto já migrou, crie o golden a partir do último commit com Newtonsoft (`git worktree add`), ou compare os 2 serializadores em `assets/jsondiff`.

## 4. Entrada real na resposta HTTP simulada

- Use `RespondWith(texto)` com o texto que o sistema externo envia. Guarde uma resposta real por operação num arquivo do projeto de testes.
- Não use `RespondWithJson(objeto)` nem `Serializar(esperado)` para criar a entrada de um teste de leitura.
- Use a palavra "real" no nome do teste só quando o texto foi capturado do sistema externo. Um json montado à mão recebe um nome que diz isso (por exemplo `Ler_JsonNoFormatoDoCis_...`), e o resumo declara que falta a captura real.
- Retire os dados pessoais e os segredos da resposta real antes de gravar o arquivo.

### Captura do json que um host envia (COM, plugin, processo instalado)

Use quando o json chega por uma chamada de método (por exemplo `Notificar(evento, contexto)` de um host Delphi) e não há log do texto bruto. Peça a autorização do usuário antes do passo 3: ele troca um binário instalado e para um serviço.

1. **Encontre o commit instalado.** Leia o `ProductVersion` da DLL instalada (`1.2.1.93+<hash>`) e o do submódulo. Crie um `git worktree` nesse commit. No worktree, aponte o submódulo para o clone local (`git config submodule._lib.url <caminho local>`, `git -c protocol.file.allow=always submodule update --init`) e use `core.longpaths=true` no Windows.
2. **Grave o texto bruto.** Acrescente 1 linha de gravação no início de cada ponto de entrada, antes do parse. Grave só se uma pasta de captura existe, num arquivo por chamada (processo, origem, sequência), e engula toda exceção da gravação. Este código não entra no repositório.
3. **Troque o binário.** Compile em `Release`, confira que a DLL tem a gravação (procure o texto da pasta no binário) e faça o backup do original com o hash. Para o serviço que carrega a DLL, copie e inicie de novo. A operação pede administrador: use um script `Start-Process -Verb RunAs` e diga ao usuário que aceite o UAC.
4. **Gere o tráfego.** Chame as rotas HTTP do host com `curl`, inclusive corpo com quebra de linha, tab, aspas, caractere de controle e emoji. Para o que só acontece na tela do host, peça ao usuário as operações (venda, cancelamento com permissão, pagamento) quando não há controle do desktop.
5. **Restaure.** Feche todos os processos que carregam a DLL (o host, as telas de configuração), copie o original e confira o hash.
6. **Prove.** Execute cada captura no oráculo e no código novo (seção 3). Grave 1 captura por tipo de evento e por origem no projeto de testes e troque nomes de pessoas reais.

Registre também o que não foi capturado: um callback que nenhum plugin chamou continua sem prova.

### Prova de que o teste falha sem a correção

Ao reverter a correção para contar as falhas, o `Copy-Item` de volta preserva a data do arquivo, e o build incremental pode reutilizar a DLL antiga. Toque os arquivos restaurados (`LastWriteTime = Get-Date`) antes do build final, ou confira que os testes novos passam de novo.

## 5. Caracterização de código com `JObject`, `JToken` ou `dynamic`

Use este teste para migrar um projeto que monta e lê json por DOM (`JObject`, `JToken.ToString()`, `Value<T>()`, `dynamic`). O compilador não mostra as diferenças, e a matriz tem 24 linhas só para o DOM (N1 a N24).

1. Antes de trocar a biblioteca, escreva um teste temporário que chama cada função pública que escreve ou lê json e grava a saída num arquivo. Use entradas que revelam diferenças:
   - **Escrita:** texto com acento e `< > & ' + "`, `decimal` inteiro (`5m`), `double` inteiro, `float`, data local e UTC, `Guid`, enum, `null`, `TimeSpan`, `char`, lista, dicionário, tupla, campo público, tipo derivado e objeto anônimo.
   - **Leitura:** texto vazio e em branco, campo ausente, campo `null`, número em texto, texto em campo numérico, `true` em texto, número fracionário, texto com data ISO, objeto e lista onde o código espera texto, nome em outra caixa, vírgula final, aspas simples, `[]` e `null` na raiz.
2. Fixe a cultura no teste (`CultureInfo.CurrentCulture`). O `JToken.ToString()` de um número depende da cultura (N16).
3. Transforme o arquivo em testes com texto literal esperado. Cuidado com `\uXXXX` no texto esperado: escreva o escape literal, e não o caractere.
4. Execute os testes com o código antigo. Todos passam. Guarde os testes no git (`git add` ou um commit próprio) antes da troca.
5. Troque a biblioteca. O arquivo de teste não muda: `git diff` do arquivo fica vazio.
6. Para cada caso que você decidir não repetir (por exemplo N5, N12, L4), tire o caso do teste de caracterização e crie um teste de "diferença aceita" com o resultado antigo e a linha da matriz no comentário.

Um caso que lança no código antigo também é um resultado: registre o tipo da exceção.
