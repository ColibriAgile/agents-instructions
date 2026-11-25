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
