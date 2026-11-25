using System.Text.Json;
using System.Text.Json.Serialization;
using Colibri.Json.Tolerante;
using NJ = Newtonsoft.Json;

public class Sujo
{
    public int? I { get; set; }
    public decimal? D { get; set; }
    public Guid? Gn { get; set; }
    public Guid G { get; set; }
    public DateTime? Dtn { get; set; }
    public DateTime Dt { get; set; }
    public Modo? Mn { get; set; }
    public Modo M { get; set; }
    public string? S { get; set; }
    public bool B { get; set; }
    public bool? Bn { get; set; }
    public long L { get; set; }
}

[JsonSerializable(typeof(Sujo))]
public partial class CtxSujo : JsonSerializerContext { }

public static class Parte3
{
    static string T(Func<string?> f) { try { return f() ?? "<null>"; } catch (Exception e) { var m = e.Message.Replace("\r", "").Replace("\n", " "); return $"THROW {e.GetType().Name}: {(m.Length > 90 ? m[..90] : m)}"; } }

    public static void Run()
    {
        Console.WriteLine("\n##### 15. CONVERTERS TOLERANTES DA SKILL x NEWTONSOFT");
        var refl = new JsonSerializerOptions().ComLeituraTolerante("yyyyMMdd HH:mm:ss");
        var gerado = new JsonSerializerOptions { TypeInfoResolver = CtxSujo.Default }.ComLeituraTolerante("yyyyMMdd HH:mm:ss");
        var casos = new (string nome, string json)[]
        {
            ("vazio em todos os anulaveis", "{\"i\":\"\",\"d\":\"\",\"gn\":\"\",\"dtn\":\"\",\"mn\":\"\",\"bn\":\"\"}"),
            ("espacos em anulaveis", "{\"i\":\"  \",\"d\":\" \",\"dtn\":\" \"}"),
            ("null em anulaveis", "{\"i\":null,\"d\":null,\"gn\":null,\"dtn\":null,\"mn\":null}"),
            ("numero em texto em anulaveis", "{\"i\":\"12\",\"d\":\"1.50\",\"l\":\"9\"}"),
            ("numero em anulaveis", "{\"i\":12,\"d\":1.50}"),
            ("guid com chaves", "{\"g\":\"{0f8fad5b-d9cb-469f-a165-70867728950e}\",\"gn\":\"{0f8fad5b-d9cb-469f-a165-70867728950e}\"}"),
            ("guid sem hifens", "{\"g\":\"0f8fad5bd9cb469fa16570867728950e\"}"),
            ("data com espaco", "{\"dt\":\"2026-11-25 10:00:00\",\"dtn\":\"2026-11-25 10:00:00\"}"),
            ("data ISO", "{\"dt\":\"2026-11-25T10:00:00\",\"dtn\":\"2026-11-25T10:00:00Z\"}"),
            ("data do CIS (formato extra)", "{\"dt\":\"20261125 10:00:00\",\"dtn\":\"20261125 10:00:00\"}"),
            ("enum texto / minusculo / numero em texto", "{\"m\":\"Mesa\",\"mn\":\"balcao\"}"),
            ("enum numero em texto", "{\"m\":\"1\",\"mn\":\"2\"}"),
            ("enum numero", "{\"m\":1,\"mn\":2}"),
            ("numero e bool em string", "{\"s\":12.50}"),
            ("bool em string", "{\"s\":true}"),
            ("texto em bool", "{\"b\":\"true\",\"bn\":\"False\"}"),
            ("numero em bool", "{\"b\":1,\"bn\":0}"),
            ("INVALIDO: vazio em int nao anulavel", "{\"l\":\"\"}"),
            ("INVALIDO: vazio em Guid nao anulavel", "{\"g\":\"\"}"),
            ("INVALIDO: texto em int", "{\"i\":\"abc\"}"),
            ("INVALIDO: data errada", "{\"dt\":\"abc\"}"),
        };
        string Ver(Sujo s) => $"I={s.I?.ToString() ?? "null"} D={s.D?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "null"} Gn={(s.Gn is null ? "null" : "ok")} G={(s.G == Guid.Empty ? "vazio" : "ok")} Dtn={s.Dtn?.ToString("s") ?? "null"} Dt={s.Dt:s} Mn={s.Mn?.ToString() ?? "null"} M={s.M} S={s.S ?? "null"} B={s.B} Bn={s.Bn?.ToString() ?? "null"} L={s.L}";
        foreach (var (nome, json) in casos)
        {
            var ns = T(() => Ver(NJ.JsonConvert.DeserializeObject<Sujo>(json, new NJ.JsonSerializerSettings { DateFormatString = "yyyyMMdd HH:mm:ss" })!));
            var a = T(() => Ver(JsonSerializer.Deserialize<Sujo>(json, refl)!));
            var b = T(() => Ver(JsonSerializer.Deserialize<Sujo>(json, gerado)!));
            var igual = ns == a && a == b ? "=" : ns.StartsWith("THROW") && a.StartsWith("THROW") && b.StartsWith("THROW") ? "= (os 3 lancam)" : "DIFERENTE";
            Console.WriteLine($"[{igual}] {nome}");
            if (igual == "DIFERENTE")
                Console.WriteLine($"    NS      : {ns}\n    reflexao: {a}\n    gerado  : {b}");
        }

        var obj = new Sujo { I = 1, D = 5m, G = Guid.Empty, M = Modo.Mesa, Mn = Modo.Balcao, S = "ação", B = true, Dt = new DateTime(2026, 11, 25, 10, 0, 0) };
        Console.WriteLine("  escrita NS      : " + NJ.JsonConvert.SerializeObject(obj));
        Console.WriteLine("  escrita reflexao: " + T(() => JsonSerializer.Serialize(obj, refl)));
        Console.WriteLine("  escrita gerado  : " + T(() => JsonSerializer.Serialize(obj, gerado)));
    }
}

[JsonConverter(typeof(JsonStringEnumConverter<ModoComTexto>))]
public enum ModoComTexto { Balcao = 0, Mesa = 1 }
public class PModoComTexto { public ModoComTexto M { get; set; } = ModoComTexto.Mesa; public ModoComTexto? Mn { get; set; } = ModoComTexto.Mesa; public Modo Numero { get; set; } = Modo.Mesa; }

public static class Parte3b
{
    public static void Run()
    {
        Console.WriteLine("\n##### 17. ENUM COM CONVERTER NO TIPO x EnumToleranteConverterFactory (G9)");
        var tol = new JsonSerializerOptions().ComLeituraTolerante();
        Console.WriteLine("  sem a leitura tolerante : " + JsonSerializer.Serialize(new PModoComTexto()));
        Console.WriteLine("  com a leitura tolerante : " + JsonSerializer.Serialize(new PModoComTexto(), tol));
        try { var p = JsonSerializer.Deserialize<PModoComTexto>("{\"m\":\"balcao\",\"mn\":\"\",\"numero\":\"mesa\"}", tol)!; Console.WriteLine($"  leitura tolerante       : M={p.M} Mn={p.Mn?.ToString() ?? "null"} Numero={p.Numero}"); }
        catch (Exception e) { Console.WriteLine("  leitura tolerante       : THROW " + e.Message); }
    }
}
