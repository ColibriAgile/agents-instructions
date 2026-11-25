using System.Data;
using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using NJ = Newtonsoft.Json;

CultureInfo.CurrentCulture = new CultureInfo("pt-BR");
var stjD = new JsonSerializerOptions();
var stjT = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true, NumberHandling = JsonNumberHandling.AllowReadingFromString,
    IncludeFields = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    Converters = { new JsonStringEnumConverter() }
};

string Ex(Exception e) { var m = e.Message.Replace("\r", "").Replace("\n", " "); return $"THROW {e.GetType().Name}: {(m.Length > 95 ? m[..95] : m)}"; }
string T(Func<string?> f) { try { return f() ?? "<null>"; } catch (Exception e) { return Ex(e); } }
string V(object? o) => o switch { null => "<null>", DateTime d => $"{d:yyyy-MM-ddTHH:mm:ss.fff} Kind={d.Kind}", DateTimeOffset d => d.ToString("o"), decimal m => m.ToString(CultureInfo.InvariantCulture) + "m", double m => m.ToString("R", CultureInfo.InvariantCulture) + "d", string s => $"\"{s}\"", _ => $"{o} ({o.GetType().Name})" };
void H(string t) => Console.WriteLine($"\n##### {t}");
void Row(string label, string ns, string d, string t)
{
    var flag = ns == d && d == t ? "=" : (d.StartsWith("THROW") || t.StartsWith("THROW")) && !ns.StartsWith("THROW") ? "THROWS" : ns.StartsWith("THROW") ? "NS-THROWS" : "SILENT";
    Console.WriteLine($"[{flag}] {label}\n    NS : {ns}\n    STJ: {d}" + (t == d ? "" : $"\n    TOL: {t}"));
}
void D<TT>(string label, string json, Func<TT, object?> show, NJ.JsonSerializerSettings? ns = null) =>
    Row($"{label}   <= {json}", T(() => V(show(NJ.JsonConvert.DeserializeObject<TT>(json, ns)!))), T(() => V(show(JsonSerializer.Deserialize<TT>(json, stjD)!))), T(() => V(show(JsonSerializer.Deserialize<TT>(json, stjT)!))));
void S(string label, object? v, NJ.JsonSerializerSettings? ns = null) =>
    Row(label, T(() => NJ.JsonConvert.SerializeObject(v, ns)), T(() => JsonSerializer.Serialize(v, stjD)), T(() => JsonSerializer.Serialize(v, stjT)));
void Dom(string label, Func<string?> ns, Func<string?> stj) { var a = T(ns); var b = T(stj); Row(label, a, b, b); }

H("1. LEITURA: nomes e tolerancia de sintaxe");
D<PNome>("case diferente", "{\"nome\":\"a\"}", p => p.Nome);
D<PNome>("membro desconhecido", "{\"Nome\":\"a\",\"Extra\":1}", p => p.Nome);
D<PNome>("comentario", "{/*c*/\"Nome\":\"a\"}", p => p.Nome);
D<PNome>("virgula final", "{\"Nome\":\"a\",}", p => p.Nome);
D<PNome>("aspas simples", "{'Nome':'a'}", p => p.Nome);
D<PNome>("nome sem aspas", "{Nome:\"a\"}", p => p.Nome);
D<PNome>("propriedade duplicada", "{\"Nome\":\"a\",\"Nome\":\"b\"}", p => p.Nome);
D<PNome>("texto vazio", "", p => p?.Nome ?? "<objeto null>");
D<PNome>("so espacos", "  ", p => p?.Nome ?? "<objeto null>");
D<PNome>("literal null", "null", p => p?.Nome ?? "<objeto null>");
D<PNome>("array no lugar de objeto", "[]", p => p?.Nome);
D<List<PNome>>("objeto no lugar de lista", "{\"Nome\":\"a\"}", p => p?.Count);
D<PNome>("BOM no inicio", "\uFEFF{\"Nome\":\"a\"}", p => p.Nome);

H("2. LEITURA: coercao de tipos primitivos");
D<PInt>("numero entre aspas -> int", "{\"Valor\":\"12\"}", p => p.Valor);
D<PInt>("12.0 -> int", "{\"Valor\":12.0}", p => p.Valor);
D<PInt>("12.5 -> int", "{\"Valor\":12.5}", p => p.Valor);
D<PInt>("\"12.0\" -> int", "{\"Valor\":\"12.0\"}", p => p.Valor);
D<PInt>("null -> int", "{\"Valor\":null}", p => p.Valor);
D<PInt>("\"\" -> int", "{\"Valor\":\"\"}", p => p.Valor);
D<PIntN>("\"\" -> int?", "{\"Valor\":\"\"}", p => p.Valor);
D<PInt>("true -> int", "{\"Valor\":true}", p => p.Valor);
D<PLong>("1e3 -> long", "{\"Valor\":1e3}", p => p.Valor);
D<PStr>("numero -> string", "{\"Valor\":12}", p => p.Valor);
D<PStr>("decimal -> string", "{\"Valor\":12.50}", p => p.Valor);
D<PStr>("bool -> string", "{\"Valor\":true}", p => p.Valor);
D<PStr>("objeto -> string", "{\"Valor\":{\"a\":1}}", p => p.Valor);
D<PStr>("data ISO -> string", "{\"Valor\":\"2026-11-25T10:00:00-03:00\"}", p => p.Valor);
D<PBool>("\"true\" -> bool", "{\"Ativo\":\"true\"}", p => p.Ativo);
D<PBool>("1 -> bool", "{\"Ativo\":1}", p => p.Ativo);
D<PBool>("\"1\" -> bool", "{\"Ativo\":\"1\"}", p => p.Ativo);
D<PBool>("null -> bool", "{\"Ativo\":null}", p => p.Ativo);
D<PDec>("\"1,5\" virgula -> decimal", "{\"Valor\":\"1,5\"}", p => p.Valor);
D<PDec>("\"1.5\" -> decimal", "{\"Valor\":\"1.5\"}", p => p.Valor);
D<PDec>("6.66 -> decimal", "{\"Valor\":6.66}", p => p.Valor);
D<PDec>("1.10 -> decimal (escala)", "{\"Valor\":1.10}", p => p.Valor);
D<PDecN>("\"\" -> decimal?", "{\"Valor\":\"\"}", p => p.Valor);
D<PDbl>("\"NaN\" -> double", "{\"Valor\":\"NaN\"}", p => p.Valor);
D<PDbl>("NaN literal -> double", "{\"Valor\":NaN}", p => p.Valor);
D<PGuid>("guid sem hifens", "{\"Valor\":\"0f8fad5bd9cb469fa16570867728950e\"}", p => p.Valor);
D<PGuid>("guid com chaves", "{\"Valor\":\"{0f8fad5b-d9cb-469f-a165-70867728950e}\"}", p => p.Valor);
D<PGuid>("\"\" -> Guid", "{\"Valor\":\"\"}", p => p.Valor);
D<PGuidN>("\"\" -> Guid?", "{\"Valor\":\"\"}", p => p.Valor);
D<PSub>("\"\" -> objeto", "{\"Valor\":\"\"}", p => p.Valor?.Nome ?? "<sub null>");
D<PList>("\"\" -> lista", "{\"Valor\":\"\"}", p => p.Valor?.Count);
D<PList>("null -> lista com inicializador", "{\"Valor\":null}", p => p.Valor?.Count);
D<PList>("valor unico no lugar de lista", "{\"Valor\":5}", p => p.Valor?.Count);
D<PBytes>("array de numeros -> byte[]", "{\"Valor\":[1,2]}", p => p.Valor?.Length);

H("3. LEITURA: datas");
foreach (var d in new[] { "2026-11-25T10:00:00", "2026-11-25T10:00:00Z", "2026-11-25T10:00:00-03:00", "2026-11-25T10:00:00.1234567890Z", "2026-11-25", "2026-11-25 10:00:00", "20261125 10:00:00", "25/11/2026", "25/11/2026 10:00:00", "11/25/2026", "/Date(1795600800000)/", "2026-11-25t10:00:00z", "" })
    D<PDate>("DateTime", $"{{\"Valor\":\"{d.Replace("/", "\\/")}\"}}", p => p.Valor);
D<PDateN>("\"\" -> DateTime?", "{\"Valor\":\"\"}", p => p.Valor);
D<PDate>("numero -> DateTime", "{\"Valor\":1795600800}", p => p.Valor);
D<PDto>("DateTimeOffset sem offset", "{\"Valor\":\"2026-11-25T10:00:00\"}", p => p.Valor);
D<PDto>("DateTimeOffset espaco", "{\"Valor\":\"2026-11-25 10:00:00\"}", p => p.Valor);
D<PTs>("TimeSpan hh:mm", "{\"Valor\":\"01:30\"}", p => p.Valor);
D<PTs>("TimeSpan com dias", "{\"Valor\":\"1.02:03:04\"}", p => p.Valor);
D<PTs>("TimeSpan numero", "{\"Valor\":90}", p => p.Valor);
D<PDateOnly>("DateOnly", "{\"Valor\":\"2026-11-25\"}", p => p.Valor);
D<PDateOnly>("DateOnly com hora", "{\"Valor\":\"2026-11-25T00:00:00\"}", p => p.Valor);

H("4. LEITURA: enums");
D<PEnum>("enum texto", "{\"Valor\":\"Mesa\"}", p => p.Valor);
D<PEnum>("enum texto minusculo", "{\"Valor\":\"mesa\"}", p => p.Valor);
D<PEnum>("enum numero", "{\"Valor\":1}", p => p.Valor);
D<PEnum>("enum numero em texto", "{\"Valor\":\"1\"}", p => p.Valor);
D<PEnum>("enum EnumMember", "{\"Valor\":\"em_mesa\"}", p => p.Valor);
D<PEnum>("enum desconhecido texto", "{\"Valor\":\"Outro\"}", p => p.Valor);
D<PEnum>("enum numero fora da faixa", "{\"Valor\":99}", p => p.Valor);
D<PEnum>("enum \"\"", "{\"Valor\":\"\"}", p => p.Valor);
D<PEnumN>("enum? \"\"", "{\"Valor\":\"\"}", p => p.Valor);
D<PEnum>("enum null", "{\"Valor\":null}", p => p.Valor);

H("5. LEITURA: object, dicionario");
foreach (var j in new[] { "12", "12.5", "\"txt\"", "true", "\"2026-11-25T10:00:00\"", "{\"a\":1}", "[1,2]" })
    D<PObj>("object", $"{{\"Valor\":{j}}}", p => p.Valor is null ? "<null>" : $"{p.Valor.GetType().Name}");
D<PDict>("Dictionary<string,object>", "{\"Valor\":{\"n\":1,\"s\":\"x\",\"o\":{\"a\":1}}}", p => string.Join(",", p.Valor.Select(k => $"{k.Key}:{k.Value?.GetType().Name}")));
D<Dictionary<string, object>>("dict raiz + cast (long)", "{\"n\":1}", p => (long)p["n"]);
D<Dictionary<string, object>>("dict raiz + Convert.ToInt32", "{\"n\":1}", p => Convert.ToInt32(p["n"]));
D<Dictionary<string, object>>("dict raiz + ToString", "{\"n\":1.50,\"s\":\"x\"}", p => $"{p["n"]}|{p["s"]}");
D<Dictionary<string, object>>("dict raiz + is string", "{\"s\":\"x\"}", p => p["s"] is string);
D<Dictionary<string, string>>("Dictionary<string,string> com numero", "{\"n\":1}", p => p["n"]);
D<Dictionary<int, string>>("Dictionary<int,string>", "{\"1\":\"a\"}", p => p[1]);

H("6. LEITURA: visibilidade, construtores, required");
D<PrivSet>("setter privado sem atributo", "{\"Nome\":\"a\"}", p => p.Ver());
D<PrivSetAttr>("setter privado com atributo", "{\"Nome\":\"a\"}", p => p.Ver());
D<PrivProp>("propriedade privada com [JsonProperty]", "{\"nome\":\"a\"}", p => p.Ver());
D<GetOnlyList>("lista get-only (popular)", "{\"Itens\":[1,2]}", p => p.Itens.Count);
D<GetOnlyObj>("objeto get-only (popular)", "{\"Sub\":{\"Nome\":\"novo\"}}", p => p.Sub.Nome);
D<PList>("lista com inicializador {9} + [1]", "{\"Valor\":[1]}", p => string.Join(",", p.Valor!));
D<ComCampo>("campo publico", "{\"Campo\":\"a\"}", p => p.Campo);
D<Ctor1>("construtor com parametros", "{\"Nome\":\"a\",\"Idade\":3}", p => $"{p.Nome}/{p.Idade}");
D<Ctor1>("construtor: falta parametro", "{\"Nome\":\"a\"}", p => $"{p.Nome}/{p.Idade}");
D<CtorDiff>("construtor: nome do parametro != propriedade", "{\"Nome\":\"a\"}", p => p.Nome ?? "<null>");
D<Ctor2>("2 construtores publicos", "{\"Nome\":\"a\",\"Idade\":3}", p => $"{p.Nome}/{p.Idade}");
D<CtorPriv>("so construtor privado", "{\"Nome\":\"a\"}", p => p.Nome);
D<Req>("required ausente", "{\"Idade\":3}", p => p.Nome ?? "<null>");
D<Req>("required null", "{\"Nome\":null}", p => p.Nome ?? "<null>");
D<NaoNulo>("null em string nao anulavel com padrao", "{\"Nome\":null,\"Itens\":null}", p => $"{p.Nome ?? "<null>"}/{(p.Itens is null ? "<null>" : "lista")}");
D<NaoNulo>("idem + NullValueHandling.Ignore", "{\"Nome\":null,\"Itens\":null}", p => $"{p.Nome ?? "<null>"}/{(p.Itens is null ? "<null>" : "lista")}", new() { NullValueHandling = NJ.NullValueHandling.Ignore });
D<PInt>("null -> int + NullValueHandling.Ignore", "{\"Valor\":null}", p => p.Valor, new() { NullValueHandling = NJ.NullValueHandling.Ignore });
D<AttrNewtonsoft>("atributo Newtonsoft lido", "{\"nome_completo\":\"a\",\"Segredo\":\"s\"}", p => $"{p.Nome ?? "<null>"}/{p.Segredo ?? "<null>"}");
D<AttrStj>("atributo STJ lido", "{\"nome_completo\":\"a\",\"Segredo\":\"s\"}", p => $"{p.Nome ?? "<null>"}/{p.Segredo ?? "<null>"}");
D<AttrDc>("DataMember lido", "{\"nome_dc\":\"a\"}", p => p.Nome ?? "<null>");
D<TemBase>("propriedade interface", "{\"Animal\":{\"Nome\":\"x\"}}", p => p.Animal?.Nome);
D<Colide>("Id e ID", "{\"Id\":1,\"ID\":2}", p => $"{p.Id}/{p.ID}");
D<St>("struct com campo", "{\"X\":1,\"Y\":2}", p => $"{p.X}/{p.Y}");
D<(int, string)>("ValueTuple", "{\"Item1\":1,\"Item2\":\"a\"}", p => $"{p.Item1}/{p.Item2}");
D<Loop>("profundidade 70", string.Concat(Enumerable.Repeat("{\"Eu\":", 70)) + "null" + new string('}', 70), p => "ok");

H("7. ESCRITA");
S("acentos e simbolos", new PStr { Valor = "ação <b> & 'x' + \"y\" / \u00a0\u2028 😀" });
S("acentos com EscapeNonAscii", new PStr { Valor = "ação <b>" }, new() { StringEscapeHandling = NJ.StringEscapeHandling.EscapeNonAscii });
S("decimal 5m", new PDec { Valor = 5m });
S("decimal 5.00m", new PDec { Valor = 5.00m });
S("decimal 0.1m+0.2m", new PDec { Valor = 0.1m + 0.2m });
S("double 5.0", new PDbl { Valor = 5.0 });
S("double 0.1+0.2", new PDbl { Valor = 0.1 + 0.2 });
S("double 1e21", new PDbl { Valor = 1e21 });
S("double NaN", new PDbl { Valor = double.NaN });
S("float 1.1f em object", new PObj { Valor = 1.1f });
S("DateTime Unspecified", new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0) });
S("DateTime Local", new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0, DateTimeKind.Local) });
S("DateTime Utc + ms", new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0, 120, DateTimeKind.Utc) });
S("DateTime com ticks", new PDate { Valor = new DateTime(2026, 11, 25, 10, 0, 0).AddTicks(1234567) });
S("DateTimeOffset", new PDto { Valor = new DateTimeOffset(2026, 11, 25, 10, 0, 0, TimeSpan.FromHours(-3)) });
S("TimeSpan", new PTs { Valor = new TimeSpan(1, 2, 3, 4, 5) });
S("DateOnly", new PDateOnly { Valor = new DateOnly(2026, 11, 25) });
S("Guid", new PGuid { Valor = Guid.Parse("0f8fad5b-d9cb-469f-a165-70867728950e") });
S("byte[]", new PBytes { Valor = [1, 2, 255] });
S("enum, flags, chave enum", new ComEnums());
S("enum + StringEnumConverter (NS)", new ComEnums(), new() { Converters = { new NJ.Converters.StringEnumConverter() } });
S("null e padrao", new PSub());
S("campo publico", new ComCampo { Campo = "a" });
S("struct com campo", new St { X = 1, Y = 2 });
S("ValueTuple", new ComTupla());
S("Tuple<int,string>", Tuple.Create(1, "a"));
S("anonimo", new { Nome = "a", Sub = new { X = 1 } });
S("atributo Newtonsoft", new AttrNewtonsoft { Nome = "a", Segredo = "s" });
S("atributo STJ", new AttrStj { Nome = "a", Segredo = "s" });
S("DataContract/DataMember", new AttrDc { Nome = "a", SemAtributo = "b" });
S("ShouldSerializeX", new ComShould());
S("[DefaultValue] + DefaultValueHandling.Ignore", new ComDefault(), new() { DefaultValueHandling = NJ.DefaultValueHandling.Ignore });
S("propriedade privada [JsonProperty]", ((Func<PrivProp>)(() => { var p = new PrivProp(); p.Set("a"); return p; }))());
S("derivado declarado como base / interface", new TemBase { Item = new Deriv(), Lista = { new Deriv() }, Animal = new Gato() });
S("raiz derivada (ordem das propriedades)", new Deriv());
S("object com derivado", new PObj { Valor = new Deriv() });
S("ciclo de referencia", ((Func<Loop>)(() => { var l = new Loop(); l.Eu = l; return l; }))());
S("ciclo + ReferenceLoopHandling.Ignore", ((Func<Loop>)(() => { var l = new Loop(); l.Eu = l; return l; }))(), new() { ReferenceLoopHandling = NJ.ReferenceLoopHandling.Ignore });
S("Type", new ComType());
S("delegate", new ComAction());
S("Exception", new InvalidOperationException("falhou", new Exception("interna")));
S("DataTable", ((Func<DataTable>)(() => { var t = new DataTable(); t.Columns.Add("a", typeof(int)); t.Rows.Add(1); return t; }))());
S("Id e ID", new Colide { Id = 1, ID = 2 });
S("JObject dentro de objeto", new PObj { Valor = JObject.Parse("{\"a\":1}") });
S("JsonObject dentro de objeto", new PObj { Valor = JsonNode.Parse("{\"a\":1}") });
S("Dictionary<string,object> misto", new Dictionary<string, object?> { ["n"] = 1, ["d"] = 1.5m, ["dt"] = new DateTime(2026, 1, 2), ["x"] = null });
S("IEnumerable preguicoso", Enumerable.Range(1, 2).Select(i => new PInt { Valor = i }));
S("string com \\r\\n e tab", new PStr { Valor = "a\r\n\tb" });
S("long maior que 2^53", new PLong { Valor = 9007199254740993 });
string Vis(string s) => s.Replace("\r", "\\r").Replace("\n", "\\n");
Console.WriteLine("    NS  indentado: " + Vis(NJ.JsonConvert.SerializeObject(new { S = new { N = "a" }, L = Array.Empty<int>(), O = new { }, A = new[] { 1 } }, NJ.Formatting.Indented)));
Console.WriteLine("    STJ indentado: " + Vis(JsonSerializer.Serialize(new { S = new { N = "a" }, L = Array.Empty<int>(), O = new { }, A = new[] { 1 } }, new JsonSerializerOptions { WriteIndented = true })));

H("8. NOMES: politicas");
var n = new Nomes { IdDoPDV = 1 };
Console.WriteLine("  NS  snake : " + NJ.JsonConvert.SerializeObject(n, new NJ.JsonSerializerSettings { ContractResolver = new DefaultContractResolver { NamingStrategy = new SnakeCaseNamingStrategy() } }));
Console.WriteLine("  STJ snake : " + JsonSerializer.Serialize(n, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower }));
Console.WriteLine("  NS  camel : " + NJ.JsonConvert.SerializeObject(n, new NJ.JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() }));
Console.WriteLine("  NS  camel2: " + NJ.JsonConvert.SerializeObject(n, new NJ.JsonSerializerSettings { ContractResolver = new DefaultContractResolver { NamingStrategy = new CamelCaseNamingStrategy() } }));
Console.WriteLine("  STJ camel : " + JsonSerializer.Serialize(n, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
Console.WriteLine("  STJ Web   : " + JsonSerializer.Serialize(n, JsonSerializerOptions.Web));

H("9. DOM: JToken x JsonNode");
const string dj = "{\"n\":12,\"s\":\"12\",\"f\":1.0,\"d\":6.66,\"data\":\"2026-11-25T10:00:00\",\"nulo\":null,\"o\":{\"x\":1},\"a\":[1,2],\"big\":12345678901234567890,\"txt\":\"olá\"}";
JObject jo() => JObject.Parse(dj); JsonNode jn() => JsonNode.Parse(dj)!;
Dom("int de texto \"12\"", () => jo()["s"]!.Value<int>().ToString(), () => jn()["s"]!.GetValue<int>().ToString());
Dom("string de numero 12", () => jo()["n"]!.Value<string>(), () => jn()["n"]!.GetValue<string>());
Dom("(string) de numero 12", () => (string?)jo()["n"], () => (string?)jn()["n"]);
Dom("long de 1.0", () => jo()["f"]!.Value<long>().ToString(), () => jn()["f"]!.GetValue<long>().ToString());
Dom("int de 12", () => jo()["n"]!.Value<int>().ToString(), () => jn()["n"]!.GetValue<int>().ToString());
Dom("decimal de 6.66", () => V(jo()["d"]!.Value<decimal>()), () => V(jn()["d"]!.GetValue<decimal>()));
Dom("(decimal) de double 6.66 no .NET 11", () => V((decimal)6.66d), () => V((decimal)jn()["d"]!.GetValue<double>()));
Dom("bool de numero", () => jo()["n"]!.Value<bool>().ToString(), () => jn()["n"]!.GetValue<bool>().ToString());
Dom("ToString() de texto", () => jo()["txt"]!.ToString(), () => jn()["txt"]!.ToString());
Dom("ToString() de data ISO", () => jo()["data"]!.ToString(), () => jn()["data"]!.ToString());
Dom("tipo do token de data", () => jo()["data"]!.Type.ToString(), () => jn()["data"]!.GetValueKind().ToString());
Dom("ToString() de objeto (indentacao)", () => Vis(jo()["o"]!.ToString()), () => Vis(jn()["o"]!.ToString()));
Dom("membro em valor nulo", () => "[" + jo()["nulo"]!.ToString() + "] tipo=" + jo()["nulo"]!.Type, () => "[" + jn()["nulo"]!.ToString() + "]");
Dom("nulo is null", () => (jo()["nulo"] is null).ToString(), () => (jn()["nulo"] is null).ToString());
Dom("propriedade ausente encadeada", () => jo()["nao"]?["x"]?.ToString() ?? "<null>", () => jn()["nao"]?["x"]?.ToString() ?? "<null>");
Dom("indice em valor escalar", () => jo()["n"]!["x"]?.ToString() ?? "<null>", () => jn()["n"]!["x"]?.ToString() ?? "<null>");
Dom("indice de array fora da faixa", () => jo()["a"]![5]?.ToString() ?? "<null>", () => jn()["a"]![5]?.ToString() ?? "<null>");
Dom("nome com outra caixa", () => jo()["N"]?.ToString() ?? "<null>", () => jn()["N"]?.ToString() ?? "<null>");
Dom("numero maior que long", () => jo()["big"]!.Type + " " + jo()["big"], () => jn()["big"]!.GetValue<long>().ToString());
Dom("ToObject<PInt> de {\"valor\":\"1\"}", () => JObject.Parse("{\"valor\":\"1\"}").ToObject<PInt>()!.Valor.ToString(), () => JsonNode.Parse("{\"valor\":\"1\"}").Deserialize<PInt>()!.Valor.ToString());
Dom("mover no para outro pai", () => { var a = jo(); var b = new JObject { ["c"] = a["o"] }; return b.ToString(NJ.Formatting.None) + " (clonou)"; }, () => { var a = jn(); var b = new JsonObject { ["c"] = a["o"] }; return b.ToJsonString(); });
Dom("Parse com chave duplicada", () => JObject.Parse("{\"a\":1,\"a\":2}")["a"]!.ToString(), () => JsonNode.Parse("{\"a\":1,\"a\":2}")!["a"]!.ToString());
Dom("Parse de \"\"", () => JToken.Parse("")?.ToString(), () => JsonNode.Parse("")?.ToString());
Dom("Parse de \"null\"", () => JToken.Parse("null").Type.ToString(), () => JsonNode.Parse("null") is null ? "C# null" : "node");
Dom("Parse com comentario/aspas simples", () => JObject.Parse("{'a':1 /*c*/}")["a"]!.ToString(), () => JsonNode.Parse("{'a':1 /*c*/}")!["a"]!.ToString());
Dom("Add com chave existente", () => { var a = jo(); a.Add("n", 1); return "ok"; }, () => { var a = jn().AsObject(); a.Add("n", 1); return "ok"; });
Dom("valor decimal criado em codigo 5.0m", () => new JObject { ["v"] = 5.0m }.ToString(NJ.Formatting.None), () => new JsonObject { ["v"] = 5.0m }.ToJsonString());
Dom("valor double criado em codigo 5.0", () => new JObject { ["v"] = 5.0 }.ToString(NJ.Formatting.None), () => new JsonObject { ["v"] = 5.0 }.ToJsonString());
Dom("DOM escreve acento", () => new JObject { ["v"] = "ação<" }.ToString(NJ.Formatting.None), () => new JsonObject { ["v"] = "ação<" }.ToJsonString());
Dom("DateTime via DOM", () => JObject.FromObject(new { D = new DateTime(2026, 1, 2, 3, 4, 5) })["D"]!.ToString(), () => JsonSerializer.SerializeToNode(new { D = new DateTime(2026, 1, 2, 3, 4, 5) })!["D"]!.ToString());
Dom("DeepEquals 1 vs 1.0", () => JToken.DeepEquals(JToken.Parse("1"), JToken.Parse("1.0")).ToString(), () => JsonNode.DeepEquals(JsonNode.Parse("1"), JsonNode.Parse("1.0")).ToString());
Dom("GetValue<long> em no criado com int", () => new JValue(1).Value<long>().ToString(), () => JsonValue.Create(1).GetValue<long>().ToString());
Dom("GetValue<decimal> em no criado com double", () => V(new JValue(1.5).Value<decimal>()), () => V(JsonValue.Create(1.5).GetValue<decimal>()));
Dom("object lido: Convert.ToDecimal", () => V(Convert.ToDecimal(NJ.JsonConvert.DeserializeObject<PObj>("{\"Valor\":1.5}")!.Valor)), () => V(Convert.ToDecimal(JsonSerializer.Deserialize<PObj>("{\"Valor\":1.5}")!.Valor)));
Dom("object lido: Equals(\"x\")", () => Equals(NJ.JsonConvert.DeserializeObject<PObj>("{\"Valor\":\"x\"}")!.Valor, "x").ToString(), () => Equals(JsonSerializer.Deserialize<PObj>("{\"Valor\":\"x\"}")!.Valor, "x").ToString());
Dom("JsonElement depois do Dispose do JsonDocument", () => "n/a", () => { JsonElement e; using (var doc = JsonDocument.Parse("{\"a\":1}")) e = doc.RootElement; return e.GetProperty("a").GetInt32().ToString(); });

H("10. CONTEXTO GERADO (sem reflexao) e opcoes");
var sg = new JsonSerializerOptions { TypeInfoResolver = Ctx.Default };
Console.WriteLine("  tipo fora do contexto      : " + T(() => JsonSerializer.Serialize(new NaoRegistrado(), sg)));
Console.WriteLine("  List<T> de tipo registrado : " + T(() => JsonSerializer.Serialize(new List<PNome> { new() }, sg)));
Console.WriteLine("  object com tipo fora       : " + T(() => JsonSerializer.Serialize(new PObj { Valor = new NaoRegistrado() }, sg)));
Console.WriteLine("  object com int             : " + T(() => JsonSerializer.Serialize(new PObj { Valor = 1 }, sg)));
Console.WriteLine("  object com Dictionary      : " + T(() => JsonSerializer.Serialize(new PObj { Valor = new Dictionary<string, object> { ["a"] = 1 } }, sg)));
Console.WriteLine("  anonimo                    : " + T(() => JsonSerializer.Serialize(new { A = 1 }, sg)));
Console.WriteLine("  ler tipo fora do contexto  : " + T(() => JsonSerializer.Deserialize<NaoRegistrado>("{}", sg)!.X));
Console.WriteLine("  derivado em contexto gerado: " + T(() => JsonSerializer.Serialize(new TemBase { Item = new Deriv() }, sg)));
Console.WriteLine("  mudar opcoes depois do uso : " + T(() => { var o = new JsonSerializerOptions(); JsonSerializer.Serialize(1, o); o.PropertyNameCaseInsensitive = true; return "ok"; }));
Console.WriteLine("  NS com tipo que so tem atributo STJ: " + NJ.JsonConvert.SerializeObject(new AttrStj { Nome = "a", Segredo = "s" }));
Console.WriteLine($"  runtime: {Environment.Version}  NS: {typeof(NJ.JsonConvert).Assembly.GetName().Version}  TZ: {TimeZoneInfo.Local.BaseUtcOffset}");

await Parte2.Run();
Parte3.Run();
Parte4.Run();
Parte3b.Run();
