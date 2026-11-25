using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using Colibri.Json.Tolerante;
using JsonSerializer = System.Text.Json.JsonSerializer;

// Prova dos converters tolerantes nas condições que o jsondiff principal não cobre:
// reflexão padrão do System.Text.Json desligada, perfil só de contexto gerado e Newtonsoft em global using.
// Execute: dotnet run -c Release. O código de saída é 0 quando não há falha.
Console.WriteLine($"reflexao padrao ligada: {JsonSerializer.IsReflectionEnabledByDefault}");

JsonSerializerOptions Perfil(Action<JsonSerializerOptions> configurar)
{
    var opcoes = new JsonSerializerOptions { TypeInfoResolver = ProvaJsonContext.Default };
    configurar(opcoes);
    opcoes.MakeReadOnly();

    return opcoes;
}

var padrao = Perfil(static _ => { });
var semChave = Perfil(static o => o.Converters.Add(new TextoSemChaveJsonConverter()));
var tolerante = Perfil(static o => o.ComLeituraTolerante());

JsonTypeInfo<T> Tipo<T>(JsonSerializerOptions perfil)
    => (JsonTypeInfo<T>)perfil.GetTypeInfo(typeof(T));

string Tentar(Func<string> acao)
{
    try
    {
        return acao();
    }
    catch (Exception erro)
    {
        var mensagem = erro.Message.Replace("\r", "").Replace("\n", " ");

        return $"THROW {erro.GetType().Name}: {(mensagem.Length > 120 ? mensagem[..120] : mensagem)}";
    }
}

var falhas = 0;

Console.WriteLine("\n##### A. CHAVE DE DICIONARIO COM CONVERTER NO PERFIL (G10)");
const string CHAVES = """{"PorTexto":{"a":1},"PorGuid":{"0f8fad5b-d9cb-469f-a165-70867728950e":"x"},"PorEnum":{"Dois":7},"PorData":{"2026-11-25T10:00:00":2},"PorBooleano":{"True":3}}""";

string IdaEVolta(JsonSerializerOptions perfil)
    => Tentar(() => JsonSerializer.Serialize(JsonSerializer.Deserialize(CHAVES, Tipo<Chaves>(perfil))!, Tipo<Chaves>(perfil)));

var chavesPadrao = IdaEVolta(padrao);
var chavesSemChave = IdaEVolta(semChave);
var chavesTolerante = IdaEVolta(tolerante);
Console.WriteLine($"  sem converter                        : {chavesPadrao}");
Console.WriteLine($"  converter de string SEM os 2 metodos : {chavesSemChave}");
Console.WriteLine($"  ComLeituraTolerante                  : {chavesTolerante}");

if (chavesPadrao != CHAVES || chavesTolerante != CHAVES || !chavesSemChave.StartsWith("THROW NotSupportedException", StringComparison.Ordinal))
{
    falhas++;
    Console.WriteLine("  FALHA: esperado json igual sem converter e com o perfil tolerante, e NotSupportedException no converter sem os 2 metodos.");
}

Console.WriteLine("\n##### B. LEITURA TOLERANTE PELO CONTEXTO GERADO");
var casos = new (string Json, Func<Dto, object?> Campo, object? Esperado)[]
{
    ("""{"InteiroN":""}""", static d => d.InteiroN, null),
    ("""{"InteiroN":"12"}""", static d => d.InteiroN, 12),
    ("""{"LongoN":"12"}""", static d => d.LongoN, 12L),
    ("""{"DecimalN":""}""", static d => d.DecimalN, null),
    ("""{"DecimalN":"1.50"}""", static d => d.DecimalN, 1.50m),
    ("""{"Guid":"{0f8fad5b-d9cb-469f-a165-70867728950e}"}""", static d => d.Guid, Guid.Parse("0f8fad5b-d9cb-469f-a165-70867728950e")),
    ("""{"GuidN":""}""", static d => d.GuidN, null),
    ("""{"GuidN":"0f8fad5bd9cb469fa16570867728950e"}""", static d => d.GuidN, Guid.Parse("0f8fad5b-d9cb-469f-a165-70867728950e")),
    ("""{"Data":"2026-11-25 10:00:00"}""", static d => d.Data, new DateTime(2026, 11, 25, 10, 0, 0)),
    ("""{"DataN":""}""", static d => d.DataN, null),
    ("""{"Enum":"Dois"}""", static d => d.Enum, Opcao.Dois),
    ("""{"EnumN":""}""", static d => d.EnumN, null),
    ("""{"EnumN":"dois"}""", static d => d.EnumN, Opcao.Dois),
    ("""{"EnumComAtributo":"Dois"}""", static d => d.EnumComAtributo, OpcaoComAtributo.Dois),
    ("""{"Texto":12.50}""", static d => d.Texto, "12.50"),
    ("""{"Booleano":"true"}""", static d => d.Booleano, true),
    ("""{"BooleanoN":1}""", static d => d.BooleanoN, true),
    ("""{"BooleanoN":""}""", static d => d.BooleanoN, null),
    ("""{"Lista":["",null,"3",4]}""", static d => string.Join("|", d.Lista!.Select(static i => i?.ToString() ?? "null")), "null|null|3|4")
};

foreach (var (json, campo, esperado) in casos)
{
    var lido = Tentar(() => campo(JsonSerializer.Deserialize(json, Tipo<Dto>(tolerante))!)?.ToString() ?? "<null>");
    var certo = lido == (esperado?.ToString() ?? "<null>");
    Console.WriteLine($"  [{(certo ? "=" : "FALHA")}] {json} -> {lido}");

    if (!certo)
        falhas++;
}

Console.WriteLine("\n##### C. ESCRITA: OS CONVERTERS NAO MUDAM O JSON");
var dto = new Dto { InteiroN = 2, DecimalN = 5m, Enum = Opcao.Dois, EnumComAtributo = OpcaoComAtributo.Dois, Texto = "abc", Booleano = true, Lista = [1, null] };
var escritoPadrao = JsonSerializer.Serialize(dto, Tipo<Dto>(padrao));
var escritoTolerante = JsonSerializer.Serialize(dto, Tipo<Dto>(tolerante));
Console.WriteLine($"  sem converter       : {escritoPadrao}");
Console.WriteLine($"  ComLeituraTolerante : {escritoTolerante}");

if (escritoPadrao != escritoTolerante)
{
    falhas++;
    Console.WriteLine("  FALHA: a escrita mudou.");
}

Console.WriteLine($"\nfalhas={falhas}");

return falhas == 0 ? 0 : 1;

public enum Opcao
{
    Zero,
    Um,
    Dois
}

[System.Text.Json.Serialization.JsonConverter(typeof(JsonStringEnumConverter<OpcaoComAtributo>))]
public enum OpcaoComAtributo
{
    Zero,
    Um,
    Dois
}

public sealed class Dto
{
    public int? InteiroN { get; set; } = -1;
    public long? LongoN { get; set; }
    public decimal? DecimalN { get; set; } = -1;
    public Guid Guid { get; set; }
    public Guid? GuidN { get; set; }
    public DateTime Data { get; set; }
    public DateTime? DataN { get; set; }
    public Opcao Enum { get; set; }
    public Opcao? EnumN { get; set; }
    public OpcaoComAtributo EnumComAtributo { get; set; }
    public string? Texto { get; set; }
    public bool Booleano { get; set; }
    public bool? BooleanoN { get; set; }
    public List<int?>? Lista { get; set; }
}

public sealed class Chaves
{
    public Dictionary<string, int>? PorTexto { get; set; }
    public Dictionary<Guid, string>? PorGuid { get; set; }
    public Dictionary<Opcao, int>? PorEnum { get; set; }
    public Dictionary<DateTime, int>? PorData { get; set; }
    public Dictionary<bool, int>? PorBooleano { get; set; }
}

// O defeito: um converter de string sem ReadAsPropertyName e WriteAsPropertyName.
public sealed class TextoSemChaveJsonConverter : System.Text.Json.Serialization.JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.GetString();

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);
}

[JsonSerializable(typeof(Dto))]
[JsonSerializable(typeof(Chaves))]
internal sealed partial class ProvaJsonContext : JsonSerializerContext;
