using System.Globalization;
using System.Reflection;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Flurl.Http;
using Flurl.Http.Configuration;
using Flurl.Http.Testing;
using Newtonsoft.Json.Linq;
using NJ = Newtonsoft.Json;

// Cópias dos converters da _lib (HEAD), para provar o comportamento com "" e tipos anuláveis.
public sealed class DecimalComPonto : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type t, JsonSerializerOptions o) => reader.TokenType switch
    {
        JsonTokenType.Number => reader.GetDecimal(),
        JsonTokenType.String when decimal.TryParse(reader.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var v) => v,
        _ => throw new JsonException($"O valor {reader.TokenType} não pode ser lido como {t.Name}.")
    };
    public override void Write(Utf8JsonWriter w, decimal v, JsonSerializerOptions o) => w.WriteNumberValue(v);
}
public sealed class GuidLeniente : JsonConverter<Guid?>
{
    public override bool HandleNull => true;
    public override Guid? Read(ref Utf8JsonReader reader, Type t, JsonSerializerOptions o)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;
        var texto = reader.TokenType == JsonTokenType.String ? reader.GetString() : throw new JsonException("nao e GUID");
        if (string.IsNullOrWhiteSpace(texto)) return null;
        return Guid.TryParse(texto, out var g) ? g : throw new JsonException("nao e GUID");
    }
    public override void Write(Utf8JsonWriter w, Guid? v, JsonSerializerOptions o) { if (v is null) w.WriteNullValue(); else w.WriteStringValue(v.Value); }
}
public sealed class ConvA : JsonConverter<Marcado> { public override Marcado Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o) => throw new NotImplementedException(); public override void Write(Utf8JsonWriter w, Marcado v, JsonSerializerOptions o) => w.WriteStringValue("atributo-do-tipo"); }
public sealed class ConvB : JsonConverter<Marcado> { public override Marcado Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o) => throw new NotImplementedException(); public override void Write(Utf8JsonWriter w, Marcado v, JsonSerializerOptions o) => w.WriteStringValue("colecao-Converters"); }
public sealed class NConvA : NJ.JsonConverter<Marcado> { public override Marcado ReadJson(NJ.JsonReader r, Type t, Marcado? e, bool h, NJ.JsonSerializer s) => throw new NotImplementedException(); public override void WriteJson(NJ.JsonWriter w, Marcado? v, NJ.JsonSerializer s) => w.WriteValue("atributo-do-tipo"); }
public sealed class NConvB : NJ.JsonConverter<Marcado> { public override Marcado ReadJson(NJ.JsonReader r, Type t, Marcado? e, bool h, NJ.JsonSerializer s) => throw new NotImplementedException(); public override void WriteJson(NJ.JsonWriter w, Marcado? v, NJ.JsonSerializer s) => w.WriteValue("colecao-Converters"); }
[JsonConverter(typeof(ConvA)), NJ.JsonConverter(typeof(NConvA))] public class Marcado { }
[NJ.JsonObject(ItemNullValueHandling = NJ.NullValueHandling.Ignore)] public class SemNulosNs { public string? A { get; set; } public string? B { get; set; } = "b"; }
public enum ModoSnake { VendaNoBalcao }
public class PModoSnake { [NJ.JsonConverter(typeof(NJ.Converters.StringEnumConverter), typeof(NJ.Serialization.SnakeCaseNamingStrategy))] public ModoSnake M { get; set; } }

public static class Parte2
{
    static string T(Func<string?> f) { try { return f() ?? "<null>"; } catch (Exception e) { var x = e is TargetInvocationException or AggregateException ? e.InnerException! : e; var m = x.Message.Replace("\r", "").Replace("\n", " "); return $"THROW {x.GetType().Name}: {(m.Length > 110 ? m[..110] : m)}"; } }
    static void L(string label, string v) => Console.WriteLine($"  {label,-58}: {v}");

    public static async Task Run()
    {
        Console.WriteLine("\n##### 11. PERFIL COMO O DO CIS (case-insensitive + AllowReadingFromString + converters da _lib)");
        var cis = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, NumberHandling = JsonNumberHandling.AllowReadingFromString, Converters = { new DecimalComPonto(), new GuidLeniente() } };
        L("\"\" -> decimal? (DecimalComPonto e JsonConverter<decimal>)", T(() => $"{JsonSerializer.Deserialize<PDecN>("{\"valor\":\"\"}", cis)!.Valor?.ToString() ?? "null"}"));
        L("\"\" -> decimal", T(() => $"{JsonSerializer.Deserialize<PDec>("{\"valor\":\"\"}", cis)!.Valor}"));
        L("null -> decimal?", T(() => $"{JsonSerializer.Deserialize<PDecN>("{\"valor\":null}", cis)!.Valor?.ToString() ?? "null"}"));
        L("\"\" -> int?", T(() => $"{JsonSerializer.Deserialize<PIntN>("{\"valor\":\"\"}", cis)!.Valor?.ToString() ?? "null"}"));
        L("\"\" -> Guid? (GuidLeniente)", T(() => $"{JsonSerializer.Deserialize<PGuidN>("{\"valor\":\"\"}", cis)!.Valor?.ToString() ?? "null"}"));
        L("\"{guid}\" -> Guid NAO anulavel (GuidLeniente e de Guid?)", T(() => $"{JsonSerializer.Deserialize<PGuid>("{\"valor\":\"{0f8fad5b-d9cb-469f-a165-70867728950e}\"}", cis)!.Valor}"));
        L("\"\" -> Guid NAO anulavel", T(() => $"{JsonSerializer.Deserialize<PGuid>("{\"valor\":\"\"}", cis)!.Valor}"));
        L("\"\" -> enum?", T(() => $"{JsonSerializer.Deserialize<PEnumN>("{\"valor\":\"\"}", cis)!.Valor?.ToString() ?? "null"}"));
        L("\"1\" -> enum (numero em texto, sem converter de enum)", T(() => $"{JsonSerializer.Deserialize<PEnum>("{\"valor\":\"1\"}", cis)!.Valor}"));
        L("12 -> string", T(() => JsonSerializer.Deserialize<PStr>("{\"valor\":12}", cis)!.Valor));
        L("\"true\" -> bool", T(() => $"{JsonSerializer.Deserialize<PBool>("{\"ativo\":\"true\"}", cis)!.Ativo}"));
        L("\"S\" -> bool", T(() => $"{JsonSerializer.Deserialize<PBool>("{\"ativo\":\"S\"}", cis)!.Ativo}"));
        L("\"12.0\" -> int (AllowReadingFromString)", T(() => $"{JsonSerializer.Deserialize<PInt>("{\"valor\":\"12.0\"}", cis)!.Valor}"));
        L("\" 12 \" -> int (espacos)", T(() => $"{JsonSerializer.Deserialize<PInt>("{\"valor\":\" 12 \"}", cis)!.Valor}"));
        L("  NS: \" 12 \" -> int", T(() => $"{NJ.JsonConvert.DeserializeObject<PInt>("{\"valor\":\" 12 \"}")!.Valor}"));

        Console.WriteLine("\n##### 12. ITENS ANTES SEM PROVA");
        L("D4 NS IsoDateTimeConverter AssumeLocal le sem fuso", T(() => { var d = NJ.JsonConvert.DeserializeObject<PDate>("{\"Valor\":\"2026-11-25T10:00:00\"}", new NJ.JsonSerializerSettings { Converters = { new NJ.Converters.IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeLocal } } })!.Valor; return $"{d:s} Kind={d.Kind}"; }));
        L("D4 STJ le sem fuso", T(() => { var d = JsonSerializer.Deserialize<PDate>("{\"Valor\":\"2026-11-25T10:00:00\"}")!.Valor; return $"{d:s} Kind={d.Kind}"; }));
        L("D4 NS AssumeLocal escreve Unspecified", T(() => NJ.JsonConvert.SerializeObject(new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0) }, new NJ.JsonSerializerSettings { Converters = { new NJ.Converters.IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeLocal } } })));
        L("D4 STJ escreve Unspecified", T(() => JsonSerializer.Serialize(new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0) })));
        L("D4 NS DateTimeZoneHandling.Utc escreve Local", T(() => NJ.JsonConvert.SerializeObject(new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0, DateTimeKind.Local) }, new NJ.JsonSerializerSettings { DateTimeZoneHandling = NJ.DateTimeZoneHandling.Utc })));
        L("E4 NS StringEnumConverter + SnakeCase", T(() => NJ.JsonConvert.SerializeObject(new PModoSnake())));
        L("E4 STJ JsonStringEnumConverter()", T(() => JsonSerializer.Serialize(new PModoSnake(), new JsonSerializerOptions { Converters = { new JsonStringEnumConverter() } })));
        L("E4 STJ JsonStringEnumConverter(SnakeCaseLower)", T(() => JsonSerializer.Serialize(new PModoSnake(), new JsonSerializerOptions { Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) } })));
        L("E4 STJ le \"VendaNoBalcao\" com conv SnakeCaseLower", T(() => $"{JsonSerializer.Deserialize<PModoSnake>("{\"M\":\"VendaNoBalcao\"}", new JsonSerializerOptions { Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) } })!.M}"));
        L("W8 NS [JsonObject(ItemNullValueHandling.Ignore)]", T(() => NJ.JsonConvert.SerializeObject(new SemNulosNs())));
        L("W8 STJ mesmo tipo", T(() => JsonSerializer.Serialize(new SemNulosNs())));
        L("G9 NS: atributo no tipo x Converters", T(() => NJ.JsonConvert.SerializeObject(new Marcado(), new NJ.JsonSerializerSettings { Converters = { new NConvB() } })));
        L("G9 STJ: atributo no tipo x Converters", T(() => JsonSerializer.Serialize(new Marcado(), new JsonSerializerOptions { Converters = { new ConvB() } })));
        Loop Ciclo() { var l = new Loop(); l.Eu = l; return l; }
        L("W9 NS ReferenceLoopHandling.Ignore", T(() => NJ.JsonConvert.SerializeObject(Ciclo(), new NJ.JsonSerializerSettings { ReferenceLoopHandling = NJ.ReferenceLoopHandling.Ignore })));
        L("W9 STJ ReferenceHandler.IgnoreCycles", T(() => JsonSerializer.Serialize(Ciclo(), new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles })));
        L("dynamic sobre JObject: d.a.b + 1", T(() => { dynamic d = JObject.Parse("{\"a\":{\"b\":1}}"); return ((int)d.a.b + 1).ToString(); }));
        L("dynamic sobre JsonNode: d.a.b", T(() => { dynamic d = JsonNode.Parse("{\"a\":{\"b\":1}}")!; return ((int)d.a.b + 1).ToString(); }));
        L("dynamic sobre JsonElement (object lido): d.a", T(() => { dynamic d = JsonSerializer.Deserialize<object>("{\"a\":1}")!; return ((int)d.a).ToString(); }));
        L("dynamic sobre ExpandoObject lido pelo STJ", T(() => { dynamic d = JsonSerializer.Deserialize<System.Dynamic.ExpandoObject>("{\"a\":1}")!; return ((object)d.a).GetType().Name; }));
        L("Merge NS padrao (array concat, null da origem ignorado)", T(() => { var a = JObject.Parse("{\"l\":[1],\"n\":1,\"o\":{\"x\":1}}"); a.Merge(JObject.Parse("{\"l\":[2],\"n\":null,\"o\":{\"y\":2}}")); return a.ToString(NJ.Formatting.None); }));
        L("JsonNode: nao existe Merge", "sem API. Cada projeto escreve a propria regra de array e de null");

        Console.WriteLine("\n##### 13. FLURL 4.0.2");
        var flurl = new DefaultJsonSerializer();
        var campo = typeof(DefaultJsonSerializer).GetFields(BindingFlags.NonPublic | BindingFlags.Instance).FirstOrDefault(f => f.FieldType == typeof(JsonSerializerOptions));
        var fo = campo?.GetValue(flurl) as JsonSerializerOptions;
        L("opcoes padrao do DefaultJsonSerializer", fo is null ? "campo nulo (usa JsonSerializerOptions padrao?)" : Opcoes(fo));
        L("le {\"nome\":\"a\"} em Nome", T(() => flurl.Deserialize<PNome>("{\"nome\":\"a\"}")!.Nome));
        L("le {\"Valor\":\"12\"} em int", T(() => flurl.Deserialize<PInt>("{\"Valor\":\"12\"}")!.Valor.ToString()));
        L("le \"\" (corpo vazio)", T(() => flurl.Deserialize<PNome>("") is null ? "null" : "objeto"));
        L("escreve acento, enum, derivado", T(() => flurl.Serialize(new { T = "ação<", M = Modo.Mesa, B = (Base)new Deriv() })));
        using (var http = new HttpTest())
        {
            http.RespondWithJson(new { NomeCompleto = "ação", Attr = new AttrStj { Nome = "a", Segredo = "s" } });
            L("HttpTest.RespondWithJson emite", T(() => "http://x.test/a".GetStringAsync().GetAwaiter().GetResult()));
            http.RespondWith("", 200);
            L("GetJsonAsync<T> com corpo vazio 200", T(() => "http://x.test/b".GetJsonAsync<PNome>().GetAwaiter().GetResult() is null ? "null" : "objeto"));
            http.RespondWith("<html>erro</html>", 200);
            L("GetJsonAsync<T> com corpo HTML 200", T(() => "http://x.test/c".GetJsonAsync<PNome>().GetAwaiter().GetResult() is null ? "null" : "objeto"));
            http.RespondWith("{\"nome\":\"a\"}", 200);
            L("GetJsonAsync<PNome> com {\"nome\"}", T(() => "http://x.test/d".GetJsonAsync<PNome>().GetAwaiter().GetResult().Nome));
            await "http://x.test/e".PostJsonAsync(new { NomeCompleto = "ação", D = 5m });
            L("PostJsonAsync envia", http.CallLog.Last().RequestBody);
        }

        Console.WriteLine("\n##### 14. REFIT 17.0.0");
        foreach (var asm in new[] { "Refit", "Refit.Reflection" })
        {
            try
            {
                var a = Assembly.Load(asm);
                var t = a.GetTypes().FirstOrDefault(x => x.Name == "SystemTextJsonContentSerializer");
                L($"{asm}: versao", a.GetName().Version!.ToString());
                if (t is null) { L($"{asm}: SystemTextJsonContentSerializer", "nao existe neste assembly"); continue; }
                var m = t.GetMethod("GetDefaultJsonSerializerOptions", BindingFlags.Public | BindingFlags.Static);
                L("GetDefaultJsonSerializerOptions()", m is null ? "metodo nao existe" : Opcoes((JsonSerializerOptions)m.Invoke(null, null)!));
                L("construtores", string.Join(" | ", t.GetConstructors().Select(c => "(" + string.Join(",", c.GetParameters().Select(p => p.ParameterType.Name)) + ")")));
                var rs = a.GetTypes().FirstOrDefault(x => x.Name == "RefitSettings");
                if (rs is not null)
                    L("new RefitSettings().ContentSerializer", T(() => { var s = Activator.CreateInstance(rs)!; var cs = rs.GetProperty("ContentSerializer")!.GetValue(s); if (cs is null) return "null"; var f = cs.GetType().GetFields(BindingFlags.NonPublic | BindingFlags.Instance).FirstOrDefault(x => x.FieldType == typeof(JsonSerializerOptions)); return cs.GetType().Name + " " + (f?.GetValue(cs) is JsonSerializerOptions o ? Opcoes(o) : ""); }));
            }
            catch (Exception e) { L(asm, "THROW " + e.GetType().Name + ": " + e.Message); }
        }
    }

    static string Opcoes(JsonSerializerOptions o) =>
        $"CaseInsensitive={o.PropertyNameCaseInsensitive}; Naming={o.PropertyNamingPolicy?.GetType().Name ?? "null"}; DictKey={o.DictionaryKeyPolicy?.GetType().Name ?? "null"}; NumberHandling={o.NumberHandling}; IgnoreReadOnly={o.IgnoreReadOnlyProperties}; DefaultIgnore={o.DefaultIgnoreCondition}; IncludeFields={o.IncludeFields}; Encoder={(o.Encoder is null ? "padrao" : o.Encoder == JavaScriptEncoder.UnsafeRelaxedJsonEscaping ? "relaxado" : o.Encoder.GetType().Name)}; Converters=[{string.Join(",", o.Converters.Select(c => c.GetType().Name))}]";
}
