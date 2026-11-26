using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using Newtonsoft.Json.Linq;
using NJ = Newtonsoft.Json;

// Seção 20: casos da auditoria do plugins-manager (2026-11-26). DOM que passa pelo host e retorno de UI em texto.
public static class Parte6
{
    private static readonly JsonSerializerOptions _relaxado = new() { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    private static string T(Func<string?> f)
    {
        try
        {
            return f() ?? "<null>";
        }
        catch (Exception e)
        {
            return $"THROW {e.GetType().Name}";
        }
    }

    private static void L(string caso, string ns, string stj)
        => Console.WriteLine($"  {caso,-40} NS : {ns.Replace("\n", "\\n"),-36} STJ: {stj.Replace("\n", "\\n")}");

    // O ParseJson comum: FloatParseHandling.Decimal e DateParseHandling.DateTime (padrão).
    private static JObject LerDecimal(string json)
    {
        using var r = new NJ.JsonTextReader(new StringReader(json)) { FloatParseHandling = NJ.FloatParseHandling.Decimal };
        return (JObject)JToken.ReadFrom(r);
    }

    public static void Run()
    {
        var cultura = CultureInfo.CurrentCulture;
        CultureInfo.CurrentCulture = new CultureInfo("pt-BR");

        try
        {
            Console.WriteLine("\n##### 20. PASSAGEM DE DOM, ToString() E ESCAPE (N21 a N24, W17, W18), cultura pt-BR, fuso local");
            Console.WriteLine($"  fuso local: {TimeZoneInfo.Local.BaseUtcOffset}");

            // N23: JObject.Parse + ToString(Formatting.None) x JsonNode.Parse + ToJsonString.
            foreach (var v in new[]
                     {
                         "\"2026-11-25T10:00:00\"", "\"2026-11-25T10:00:00.000\"", "\"2026-11-25T10:00:00+05:00\"", "\"/Date(1764064800000)/\"",
                         "1.50", "1e3", "1e400", "-0", "0.12345678901234567890123456789"
                     })
            {
                var json = "{\"v\":" + v + "}";
                L($"passagem {v} (N23)", T(() => JObject.Parse(json).ToString(NJ.Formatting.None)), T(() => JsonNode.Parse(json)!.ToJsonString(_relaxado)));
            }

            // N21: o substituto natural de JToken.ToString() (ToJsonString) não indenta.
            L("objeto: ToString() x ToJsonString() (N21)", T(() => JObject.Parse("{\"o\":{\"a\":1}}")["o"]!.ToString()), T(() => JsonNode.Parse("{\"o\":{\"a\":1}}")!["o"]!.ToJsonString()));

            // N22: Value<T>() de número fracionário e de booleano.
            L("Value<int?> de 1.5 (N22)", T(() => JObject.Parse("{\"v\":1.5}")["v"]!.Value<int?>()?.ToString()), T(() => JsonNode.Parse("{\"v\":1.5}")!["v"]!.GetValue<int>().ToString()));
            L("Value<int?> de 2.5 (N22)", T(() => JObject.Parse("{\"v\":2.5}")["v"]!.Value<int?>()?.ToString()), T(() => JsonNode.Parse("{\"v\":2.5}")!["v"]!.GetValue<int>().ToString()));
            L("Value<int?> de true (N22)", T(() => JObject.Parse("{\"v\":true}")["v"]!.Value<int?>()?.ToString()), T(() => JsonNode.Parse("{\"v\":true}")!["v"]!.GetValue<int>().ToString()));
            L("Value<decimal?> de true (N22)", T(() => JObject.Parse("{\"v\":true}")["v"]!.Value<decimal?>()?.ToString()), T(() => JsonNode.Parse("{\"v\":true}")!["v"]!.GetValue<decimal>().ToString()));

            // N24: o texto de um número depende do FloatParseHandling de quem leu.
            L("ToString() de 1.50, JObject.Parse (N24)", T(() => JObject.Parse("{\"v\":1.50}")["v"]!.ToString()), T(() => JsonNode.Parse("{\"v\":1.50}")!["v"]!.ToJsonString()));
            L("ToString() de 1.50, Decimal (N24)", T(() => LerDecimal("{\"v\":1.50}")["v"]!.ToString()), T(() => JsonNode.Parse("{\"v\":1.50}")!["v"]!.ToJsonString()));
            L("ToString() de data com fuso (N5)", T(() => JObject.Parse("{\"v\":\"2026-11-25T10:00:00+05:00\"}")["v"]!.ToString()), T(() => JsonNode.Parse("{\"v\":\"2026-11-25T10:00:00+05:00\"}")!["v"]!.GetValue<string>()));

            // W17: o encoder relaxado ainda escapa.
            foreach (var (nome, texto) in new[] { ("emoji", "😀"), ("U+007F", "\u007f"), ("U+0080", "\u0080"), ("U+00A0", "\u00a0") })
                L($"escrita relaxada de {nome} (W17)", T(() => new JObject { ["x"] = texto }.ToString(NJ.Formatting.None)), T(() => new JsonObject { ["x"] = texto }.ToJsonString(_relaxado)));

            // W2: ToJsonString() padrão x EscapeNonAscii.
            L("ToJsonString() padrão de aspas (W2)", T(() =>
            {
                using var sw = new StringWriter(CultureInfo.InvariantCulture);
                using var jw = new NJ.JsonTextWriter(sw) { StringEscapeHandling = NJ.StringEscapeHandling.EscapeNonAscii };
                new NJ.JsonSerializer().Serialize(jw, new JObject { ["x"] = "a\"<b>" });
                return sw.ToString();
            }), T(() => new JsonObject { ["x"] = "a\"<b>" }.ToJsonString()));

            // W18: surrogate isolado lido do json e escrito de novo.
            L("passagem de \"\\ud800\" (W18)", T(() => JObject.Parse("{\"v\":\"\\ud800\"}").ToString(NJ.Formatting.None).Length.ToString()),
                T(() => JsonNode.Parse("{\"v\":\"\\ud800\"}")!.ToJsonString(_relaxado)));
            L("passagem de \"\\ud800\" via JsonElement (W18)", "n/a",
                T(() =>
                {
                    using var doc = JsonDocument.Parse("{\"v\":\"\\ud800\"}");
                    return new JsonObject { ["v"] = JsonValue.Create(doc.RootElement.GetProperty("v").Clone()) }.ToJsonString(_relaxado);
                }));
        }
        finally
        {
            CultureInfo.CurrentCulture = cultura;
        }
    }
}
