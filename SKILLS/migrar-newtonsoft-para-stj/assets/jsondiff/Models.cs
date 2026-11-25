using System.ComponentModel;
using System.Runtime.Serialization;
using NJ = Newtonsoft.Json;
using STJ = System.Text.Json.Serialization;

public enum Modo { Nenhum = 0, [EnumMember(Value = "em_mesa")] Mesa = 1, Balcao = 2 }
[Flags] public enum Fl { A = 1, B = 2 }

public class PNome { public string? Nome { get; set; } }
public class PInt { public int Valor { get; set; } }
public class PIntN { public int? Valor { get; set; } }
public class PLong { public long Valor { get; set; } }
public class PStr { public string? Valor { get; set; } }
public class PBool { public bool Ativo { get; set; } }
public class PDec { public decimal Valor { get; set; } }
public class PDecN { public decimal? Valor { get; set; } }
public class PDbl { public double Valor { get; set; } }
public class PDate { public DateTime Valor { get; set; } }
public class PDateN { public DateTime? Valor { get; set; } }
public class PDto { public DateTimeOffset Valor { get; set; } }
public class PGuid { public Guid Valor { get; set; } }
public class PGuidN { public Guid? Valor { get; set; } }
public class PEnum { public Modo Valor { get; set; } }
public class PEnumN { public Modo? Valor { get; set; } }
public class PObj { public object? Valor { get; set; } }
public class PDict { public Dictionary<string, object?> Valor { get; set; } = new(); }
public class PSub { public PNome? Valor { get; set; } }
public class PList { public List<int>? Valor { get; set; } = new() { 9 }; }
public class PTs { public TimeSpan Valor { get; set; } }
public class PBytes { public byte[]? Valor { get; set; } }
public class PDateOnly { public DateOnly Valor { get; set; } }

public class PrivSet { public string? Nome { get; private set; } public string Ver() => Nome ?? "<null>"; }
public class PrivSetAttr { [NJ.JsonProperty, STJ.JsonInclude] public string? Nome { get; private set; } public string Ver() => Nome ?? "<null>"; }
public class PrivProp { [NJ.JsonProperty("nome")] private string? Nome { get; set; } public string Ver() => Nome ?? "<null>"; public void Set(string s) => Nome = s; }
public class GetOnlyList { public List<int> Itens { get; } = new(); }
public class GetOnlyObj { public PNome Sub { get; } = new() { Nome = "inicial" }; }
public class ComCampo { public string? Campo; }
public class Ctor1 { public Ctor1(string nome, int idade) { Nome = nome; Idade = idade; } public string Nome { get; } public int Idade { get; } }
public class CtorDiff { public CtorDiff(string n) { Nome = n; } public string Nome { get; } }
public class Ctor2 { public Ctor2(string nome) { Nome = nome; } public Ctor2(string nome, int idade) { Nome = nome; Idade = idade; } public string Nome { get; set; } public int Idade { get; set; } }
public class CtorPriv { private CtorPriv() { } public string? Nome { get; set; } }
public class Req { public required string Nome { get; set; } public int Idade { get; set; } }
public class NaoNulo { public string Nome { get; set; } = "padrao"; public List<int> Itens { get; set; } = new(); }
public class AttrNewtonsoft { [NJ.JsonProperty("nome_completo")] public string? Nome { get; set; } [NJ.JsonIgnore] public string? Segredo { get; set; } }
public class AttrStj { [STJ.JsonPropertyName("nome_completo")] public string? Nome { get; set; } [STJ.JsonIgnore] public string? Segredo { get; set; } }
[DataContract] public class AttrDc { [DataMember(Name = "nome_dc")] public string? Nome { get; set; } public string? SemAtributo { get; set; } }
public class ComShould { public string? A { get; set; } = "a"; public bool ShouldSerializeA() => false; public string? B { get; set; } = "b"; }
public class ComDefault { [DefaultValue(5)] public int V { get; set; } = 5; public int Z { get; set; } public string? N { get; set; } }
public class Base { public string? B { get; set; } = "base"; }
public class Deriv : Base { public string? D { get; set; } = "deriv"; }
public class TemBase { public Base? Item { get; set; } public List<Base> Lista { get; set; } = new(); public IAnimal? Animal { get; set; } }
public interface IAnimal { string Nome { get; } }
public class Gato : IAnimal { public string Nome { get; set; } = "gato"; public int Vidas { get; set; } = 7; }
public class Loop { public Loop? Eu { get; set; } public string X { get; set; } = "x"; }
public class Colide { public int Id { get; set; } public int ID { get; set; } }
public class ComType { public Type? T { get; set; } = typeof(string); }
public class ComAction { public Action? A { get; set; } = () => { }; public string N { get; set; } = "n"; }
public class ComTupla { public (int, string) T { get; set; } = (1, "a"); }
public struct St { public int X; public int Y { get; set; } }
public class ComEnums { public Modo M { get; set; } = Modo.Mesa; public Fl F { get; set; } = Fl.A | Fl.B; public Dictionary<Modo, int> D { get; set; } = new() { [Modo.Balcao] = 1 }; }
public class Nomes { public int IdDoPDV { get; set; } public string? CNPJDaLoja { get; set; } public string? Endereco2 { get; set; } public string? AB1 { get; set; } public string? URLBase { get; set; } public string? Item1 { get; set; } public string? ID { get; set; } public string? eTag { get; set; } public string? NumeroNFCe { get; set; } public Dictionary<string,int> ChavesDoDic { get; set; } = new() { ["MinhaChave"] = 1 }; }
public class NaoRegistrado { public string? X { get; set; } = "x"; }

[STJ.JsonSerializable(typeof(PNome))]
[STJ.JsonSerializable(typeof(PObj))]
[STJ.JsonSerializable(typeof(TemBase))]
public partial class Ctx : STJ.JsonSerializerContext { }
