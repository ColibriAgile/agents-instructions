using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Colibri.Json.Tolerante;
using Newtonsoft.Json.Linq;
using NJ = Newtonsoft.Json;

public class Chaves
{
    public Dictionary<string, int>? PorTexto { get; set; }
    public Dictionary<Guid, string>? PorGuid { get; set; }
    public Dictionary<Modo, int>? PorEnum { get; set; }
    public Dictionary<DateTime, int>? PorData { get; set; }
    public Dictionary<bool, int>? PorBooleano { get; set; }
}

// Converter de texto sem ReadAsPropertyName e WriteAsPropertyName: o defeito que a seção 18 mostra.
public sealed class TextoSemChaveJsonConverter : System.Text.Json.Serialization.JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.GetString();

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);
}

public static class Parte5
{
    private static string T(Func<string?> f)
    {
        try
        {
            return f() ?? "<null>";
        }
        catch (Exception e)
        {
            var m = e.Message.Replace("\r", "").Replace("\n", " ");

            return $"THROW {e.GetType().Name}: {(m.Length > 110 ? m[..110] : m)}";
        }
    }

    public static void Run()
    {
        Console.WriteLine("\n##### 18. CONVERTER DO PERFIL x CHAVE DE DICIONARIO (G10), COM REFLEXAO");
        Console.WriteLine("  Com a reflexao ligada, o STJ usa o converter interno para a chave e o defeito nao aparece.");
        Console.WriteLine("  Com JsonSerializerIsReflectionEnabledByDefault=false, o converter sem os 2 metodos lanca: veja assets/jsondiff-sem-reflexao.");
        const string json = "{\"PorTexto\":{\"a\":1},\"PorGuid\":{\"0f8fad5b-d9cb-469f-a165-70867728950e\":\"x\"},\"PorEnum\":{\"Mesa\":7},\"PorData\":{\"2026-11-25T10:00:00\":2},\"PorBooleano\":{\"True\":3}}";
        var padrao = new JsonSerializerOptions();
        var semChave = new JsonSerializerOptions { Converters = { new TextoSemChaveJsonConverter() } };
        var tolerante = new JsonSerializerOptions().ComLeituraTolerante();

        string Ida(JsonSerializerOptions o) => T(() => JsonSerializer.Serialize(JsonSerializer.Deserialize<Chaves>(json, o), o));

        Console.WriteLine($"  entrada                          : {json}");
        Console.WriteLine($"  NS  ler e escrever               : {T(() => NJ.JsonConvert.SerializeObject(NJ.JsonConvert.DeserializeObject<Chaves>(json)))}");
        Console.WriteLine($"  STJ padrao                       : {Ida(padrao)}");
        Console.WriteLine($"  STJ converter de string SEM chave: {Ida(semChave)}");
        Console.WriteLine($"  STJ ComLeituraTolerante          : {Ida(tolerante)}");
        Console.WriteLine($"  igual ao STJ padrao              : {Ida(tolerante) == Ida(padrao)}");

        Console.WriteLine("\n##### 19. JToken.ToString() E CASTS x JsonNode (N16 a N20), cultura pt-BR");
        CultureInfo.CurrentCulture = new CultureInfo("pt-BR");
        var texto = "{\"n\":1.50,\"i\":12,\"b\":true,\"z\":null,\"s\":\"abc\",\"d\":\"2026-11-25T10:00:00\",\"o\":{\"a\":1},\"t\":\"true\",\"v\":\"9,50\",\"u\":1}";
        var ns = JObject.Parse(texto);
        var stj = JsonNode.Parse(texto)!.AsObject();

        void Linha(string caso, Func<string?> antigo, Func<string?> novo)
            => Console.WriteLine($"  {caso,-34} NS : {T(antigo),-30} STJ: {T(novo)}");

        Linha("ToString() de 1.50 (N16)", () => ns["n"]!.ToString(), () => stj["n"]!.ToString());
        Linha("ToString() de 12", () => ns["i"]!.ToString(), () => stj["i"]!.ToString());
        Linha("ToString() de true (N17)", () => ns["b"]!.ToString(), () => stj["b"]!.ToString());
        Linha("ToString() de null (N3)", () => ns["z"]!.ToString(), () => stj["z"]!.ToString());
        Linha("?.ToString() de null (N3)", () => ns["z"]?.ToString(), () => stj["z"]?.ToString());
        Linha("ToString() de data ISO (N5)", () => ns["d"]!.ToString(), () => stj["d"]!.ToString());
        Linha("ToString() de objeto", () => ns["o"]!.ToString().Replace("\r\n", "\\n"), () => stj["o"]!.ToString().Replace("\r\n", "\\n"));
        Linha("campo ausente is null", () => (ns["x"] is null).ToString(), () => (stj["x"] is null).ToString());
        Linha("campo null is null (N18)", () => (ns["z"] is null).ToString(), () => (stj["z"] is null).ToString());
        Linha("(bool?) de \"true\" (N1)", () => ((bool?)ns["t"]).ToString(), () => ((bool?)stj["t"]).ToString());
        Linha("(bool?) de 1 (N1)", () => ((bool?)ns["u"]).ToString(), () => ((bool?)stj["u"]).ToString());
        Linha("Value<decimal?> de \"9,50\" (N19)", () => ns["v"]!.Value<decimal?>()?.ToString(CultureInfo.InvariantCulture), () => stj["v"]!.GetValue<decimal?>()?.ToString(CultureInfo.InvariantCulture));
        Linha("Value<decimal?> de 1.50", () => ns["n"]!.Value<decimal?>()?.ToString(CultureInfo.InvariantCulture), () => stj["n"]!.GetValue<decimal>().ToString(CultureInfo.InvariantCulture));

        dynamic caractere = 'x';
        Linha("[\"c\"] = (dynamic)'x' (N20)", () => new JObject { ["c"] = caractere }.ToString(NJ.Formatting.None), () => new JsonObject { ["c"] = 'x' }.ToJsonString());
        Linha("objeto.ToString() sem argumento", () => new JObject { ["a"] = 1 }.ToString().Replace("\r\n", "\\n"), () => new JsonObject { ["a"] = 1 }.ToString().Replace("\r\n", "\\n"));
        Linha("objeto compacto", () => new JObject { ["a"] = "ação" }.ToString(NJ.Formatting.None), () => new JsonObject { ["a"] = "ação" }.ToJsonString());
    }
}
