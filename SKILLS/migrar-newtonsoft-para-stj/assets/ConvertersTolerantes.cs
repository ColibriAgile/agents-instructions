// Converters de leitura tolerante para System.Text.Json.
// Eles repetem as conversões que o Newtonsoft fazia sem configuração.
// Copie este arquivo para o projeto, troque o namespace e registre os converters no perfil JSON.
// Prova de cada caso: assets/jsondiff (seções 15 e 18).

using System.Buffers;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
// Alias e nomes completos: um projeto que ainda tem o Newtonsoft em global using tem tipos com os mesmos nomes
// (JsonConverter, JsonConverter<T>, JsonConverterAttribute, JsonException, JsonSerializer). Sem isto, o arquivo não
// compila nesse projeto (CS0104). Importante num projeto compartilhado (.projitems), que compila dentro de cada consumidor.
using JsonConverter = System.Text.Json.Serialization.JsonConverter;
using JsonException = System.Text.Json.JsonException;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace Colibri.Json.Tolerante;

/// <summary>
/// Lê <c>""</c> e texto em branco como <see langword="null"/> em qualquer tipo de valor anulável
/// (<c>int?</c>, <c>decimal?</c>, <c>Guid?</c>, <c>DateTime?</c>, enum anulável), como o Newtonsoft lia.
/// Os outros valores vão para o converter do tipo não anulável do mesmo perfil.
/// </summary>
/// <remarks>
/// Um <c>JsonConverter&lt;T&gt;</c> não recebe o <c>null</c> de um <c>T?</c>, mas recebe o <c>""</c> e lança.
/// Usa reflexão (<c>MakeGenericType</c>): não use em aplicação publicada com trimming ou AOT. Funciona com
/// <c>JsonSerializerIsReflectionEnabledByDefault=false</c> e com perfil só de contexto gerado (provado).
/// Custo medido no .NET 11: cerca de 19% a mais de tempo e 0 bytes a mais na leitura de um objeto com 6 campos anuláveis
/// (assets/jsondiff, seção 16). Um número em texto num campo numérico anulável usa um caminho mais lento.
/// </remarks>
public sealed class VazioComoNuloConverterFactory : JsonConverterFactory
{
    /// <inheritdoc />
    public override bool CanConvert(Type typeToConvert)
        => Nullable.GetUnderlyingType(typeToConvert) is not null;

    /// <inheritdoc />
    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        var tipo = Nullable.GetUnderlyingType(typeToConvert)!;

        return (JsonConverter)Activator.CreateInstance(typeof(VazioComoNuloConverter<>).MakeGenericType(tipo))!;
    }

    private sealed class VazioComoNuloConverter<T> : System.Text.Json.Serialization.JsonConverter<T?>
        where T : struct
    {
        private static readonly bool _numerico = Type.GetTypeCode(typeof(T)) is >= TypeCode.SByte and <= TypeCode.Decimal;

        private System.Text.Json.Serialization.JsonConverter<T>? _interno;
        private bool _internoDoSistema;

        public override bool HandleNull
            => true;

        public override T? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            if (reader.TokenType == JsonTokenType.String && Vazio(ref reader))
                return null;

            var interno = Interno(options);

            // O converter de número do sistema, chamado direto, não aplica o NumberHandling do perfil ("12" em int?).
            // Só nesse caso a leitura passa pelo JsonSerializer, que é mais lento.
            return _internoDoSistema && _numerico && reader.TokenType == JsonTokenType.String
                ? JsonSerializer.Deserialize<T>(ref reader, options)
                : interno.Read(ref reader, typeof(T), options);
        }

        public override void Write(Utf8JsonWriter writer, T? value, JsonSerializerOptions options)
        {
            if (value is null)
                writer.WriteNullValue();
            else
                Interno(options).Write(writer, value.Value, options);
        }

        private System.Text.Json.Serialization.JsonConverter<T> Interno(JsonSerializerOptions options)
        {
            if (_interno is not null)
                return _interno;

            var interno = (System.Text.Json.Serialization.JsonConverter<T>)options.GetConverter(typeof(T));
            _internoDoSistema = interno.GetType().Assembly == typeof(JsonSerializer).Assembly;

            return _interno = interno;
        }

        // Sem alocar texto no caso comum (valor num só segmento e sem escape).
        private static bool Vazio(ref Utf8JsonReader reader)
        {
            if (reader.HasValueSequence || reader.ValueIsEscaped)
                return string.IsNullOrWhiteSpace(reader.GetString());

            foreach (var octeto in reader.ValueSpan)
            {
                if (octeto is not (0x20 or 0x09 or 0x0D or 0x0A))
                    return false;
            }

            return true;
        }
    }
}

/// <summary>
/// Lê número e booleano em campo <see langword="string"/>, como o Newtonsoft lia.
/// O texto fica igual ao do json (<c>12.50</c> vira <c>"12.50"</c>).
/// </summary>
public sealed class TextoToleranteJsonConverter : System.Text.Json.Serialization.JsonConverter<string>
{
    /// <inheritdoc />
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType switch
        {
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Number or JsonTokenType.True or JsonTokenType.False => TextoBruto(ref reader),
            _ => throw new JsonException($"O valor {reader.TokenType} não pode ser lido como texto.")
        };

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);

    // Chave de dicionário: um converter de T na coleção Converters também recebe a chave de um Dictionary<T, V>.
    // Sem ReadAsPropertyName e WriteAsPropertyName, o dicionário lança NotSupportedException na leitura e na escrita
    // (assets/jsondiff, seção 18). Todo converter deste arquivo para um tipo que pode ser chave tem os 2 métodos.

    /// <inheritdoc />
    public override string ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.GetString()!;

    /// <inheritdoc />
    public override void WriteAsPropertyName(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WritePropertyName(value);

    // HasValueSequence: o ASP.NET Core 10 entrega o valor em vários segmentos.
    private static string TextoBruto(ref Utf8JsonReader reader)
        => reader.HasValueSequence
            ? Encoding.UTF8.GetString(reader.ValueSequence.ToArray())
            : Encoding.UTF8.GetString(reader.ValueSpan);
}

/// <summary>
/// Lê <c>true</c>/<c>false</c>, <c>"true"</c>/<c>"false"</c> sem diferenciar a caixa, e número (0 é falso),
/// como o Newtonsoft lia.
/// </summary>
public sealed class BoolToleranteJsonConverter : System.Text.Json.Serialization.JsonConverter<bool>
{
    /// <inheritdoc />
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType switch
        {
            JsonTokenType.True => true,
            JsonTokenType.False => false,
            JsonTokenType.Number when reader.TryGetDecimal(out var numero) => numero != 0,
            JsonTokenType.String when bool.TryParse(reader.GetString(), out var valor) => valor,
            _ => throw new JsonException($"O valor {ValorRecebido.Texto(ref reader)} não pode ser lido como booleano.")
        };

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        => writer.WriteBooleanValue(value);

    /// <inheritdoc />
    public override bool ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => bool.TryParse(reader.GetString(), out var valor)
            ? valor
            : throw new JsonException($"A chave {ValorRecebido.Texto(ref reader)} não pode ser lida como booleano.");

    /// <inheritdoc />
    public override void WriteAsPropertyName(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        => writer.WritePropertyName(value ? bool.TrueString : bool.FalseString);
}

/// <summary>
/// Lê GUID com chaves, com parênteses, sem hifens ou no formato padrão, como o Newtonsoft lia.
/// </summary>
/// <remarks>
/// Cobre a propriedade <see cref="Guid"/>. O <c>Guid?</c> fica com a <see cref="VazioComoNuloConverterFactory"/>,
/// que delega o valor não vazio a este converter.
/// </remarks>
public sealed class GuidToleranteJsonConverter : System.Text.Json.Serialization.JsonConverter<Guid>
{
    /// <inheritdoc />
    public override Guid Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.String && Guid.TryParse(reader.GetString(), out var guid)
            ? guid
            : throw new JsonException($"O valor {ValorRecebido.Texto(ref reader)} não é um GUID.");

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, Guid value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);

    /// <inheritdoc />
    public override Guid ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => Guid.TryParse(reader.GetString(), out var guid)
            ? guid
            : throw new JsonException($"A chave {ValorRecebido.Texto(ref reader)} não é um GUID.");

    /// <inheritdoc />
    public override void WriteAsPropertyName(Utf8JsonWriter writer, Guid value, JsonSerializerOptions options)
        => writer.WritePropertyName(value.ToString("D"));
}

/// <summary>
/// Lê data no formato ISO 8601 e nos formatos extras do contrato. Escreve como o System.Text.Json.
/// </summary>
/// <remarks>
/// Passe só os formatos que a origem envia de fato. Um formato ambíguo (<c>dd/MM</c> e <c>MM/dd</c>) lê a data errada sem erro.
/// </remarks>
public sealed class DataToleranteJsonConverter(params string[] formatosExtras) : System.Text.Json.Serialization.JsonConverter<DateTime>
{
    // "yyyy-MM-dd HH:mm:ss" (espaço no lugar do T) é o formato que o Newtonsoft aceitava e o System.Text.Json recusa.
    private readonly string[] _formatos = [.. formatosExtras, "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm:ss.FFFFFFF"];

    /// <inheritdoc />
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            if (reader.TryGetDateTime(out var data))
                return data;

            if (DateTime.TryParseExact(reader.GetString(), _formatos, CultureInfo.InvariantCulture, DateTimeStyles.None, out data))
                return data;
        }

        throw new JsonException($"O valor {ValorRecebido.Texto(ref reader)} não é uma data aceita pelo contrato.");
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);

    /// <inheritdoc />
    public override DateTime ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var texto = reader.GetString();

        if (DateTime.TryParseExact(texto, "O", CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var data)
            || DateTime.TryParse(texto, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out data)
            || DateTime.TryParseExact(texto, _formatos, CultureInfo.InvariantCulture, DateTimeStyles.None, out data))
            return data;

        throw new JsonException($"A chave {ValorRecebido.Texto(ref reader)} não é uma data aceita pelo contrato.");
    }

    /// <inheritdoc />
    public override void WriteAsPropertyName(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WritePropertyName(value.ToString("yyyy-MM-ddTHH:mm:ss.FFFFFFFK", CultureInfo.InvariantCulture));
}

/// <summary>
/// Lê enum em número, em texto (sem diferenciar a caixa) e em número dentro de texto. Escreve o enum como número,
/// como o Newtonsoft sem <c>StringEnumConverter</c>.
/// </summary>
/// <remarks>
/// Não assume o enum que tem <c>[JsonConverter]</c> no tipo: um converter da coleção do perfil ganha do atributo do tipo,
/// e o enum com <c>JsonStringEnumConverter</c> passaria a ser escrito como número.
/// Usa reflexão (<c>MakeGenericType</c>): não use em aplicação publicada com trimming ou AOT.
/// </remarks>
public sealed class EnumToleranteConverterFactory : JsonConverterFactory
{
    /// <inheritdoc />
    public override bool CanConvert(Type typeToConvert)
        => typeToConvert.IsEnum && !typeToConvert.IsDefined(typeof(System.Text.Json.Serialization.JsonConverterAttribute), inherit: false);

    /// <inheritdoc />
    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
        => (JsonConverter)Activator.CreateInstance(typeof(EnumToleranteConverter<>).MakeGenericType(typeToConvert))!;

    private sealed class EnumToleranteConverter<T> : System.Text.Json.Serialization.JsonConverter<T>
        where T : struct, Enum
    {
        private static readonly bool _semSinal = Type.GetTypeCode(typeof(T)) == TypeCode.UInt64;

        public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.TokenType switch
            {
                JsonTokenType.Number when _semSinal && reader.TryGetUInt64(out var numero) => (T)Enum.ToObject(typeof(T), numero),
                JsonTokenType.Number when reader.TryGetInt64(out var numero) => (T)Enum.ToObject(typeof(T), numero),
                JsonTokenType.String when Enum.TryParse<T>(reader.GetString(), ignoreCase: true, out var valor) => valor,
                _ => throw new JsonException($"O valor {ValorRecebido.Texto(ref reader)} não pode ser lido como {typeof(T).Name}.")
            };

        public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
        {
            if (_semSinal)
                writer.WriteNumberValue(Convert.ToUInt64(value, CultureInfo.InvariantCulture));
            else
                writer.WriteNumberValue(Convert.ToInt64(value, CultureInfo.InvariantCulture));
        }

        // A chave de dicionário continua como no System.Text.Json: o nome do enum.
        public override T ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => Enum.TryParse<T>(reader.GetString(), ignoreCase: true, out var valor)
                ? valor
                : throw new JsonException($"A chave {ValorRecebido.Texto(ref reader)} não pode ser lida como {typeof(T).Name}.");

        public override void WriteAsPropertyName(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
            => writer.WritePropertyName(value.ToString());
    }
}

/// <summary>
/// Texto do valor recebido, para a mensagem de erro. Sem ele, o log não mostra o dado que causou a falha.
/// </summary>
/// <remarks>
/// Os converters de GUID, data, booleano e enum mostram o valor, cortado em 60 caracteres. O converter de texto não
/// mostra, porque um campo de texto pode ter dado pessoal ou segredo.
/// A classe é file-local: um assembly que enxerga outro pelo InternalsVisibleTo veria 2 classes com o mesmo nome.
/// </remarks>
file static class ValorRecebido
{
    private const int MAXIMO = 60;

    public static string Texto(ref Utf8JsonReader reader)
    {
        if (reader.TokenType is JsonTokenType.StartObject or JsonTokenType.StartArray)
            return reader.TokenType.ToString();

        var texto = reader.HasValueSequence
            ? Encoding.UTF8.GetString(reader.ValueSequence.ToArray())
            : Encoding.UTF8.GetString(reader.ValueSpan);

        if (texto.Length > MAXIMO)
            texto = texto[..MAXIMO] + "...";

        return reader.TokenType is JsonTokenType.String or JsonTokenType.PropertyName ? $"\"{texto}\"" : texto;
    }
}

/// <summary>
/// Registro dos converters na ordem correta.
/// </summary>
public static class LeituraTolerante
{
    /// <summary>
    /// Adiciona os converters ao perfil. Chame antes do primeiro uso das opções.
    /// </summary>
    /// <param name="opcoes">O perfil JSON.</param>
    /// <param name="formatosDeData">Os formatos de data extras do contrato, por exemplo <c>"yyyyMMdd HH:mm:ss"</c>.</param>
    /// <remarks>
    /// O primeiro converter que aceita o tipo ganha. Um converter do projeto para o mesmo tipo (texto, data) precisa ser
    /// adicionado antes desta chamada, ou ele nunca é usado.
    /// </remarks>
    public static JsonSerializerOptions ComLeituraTolerante(this JsonSerializerOptions opcoes, params string[] formatosDeData)
    {
        opcoes.PropertyNameCaseInsensitive = true;
        opcoes.NumberHandling |= JsonNumberHandling.AllowReadingFromString;
        opcoes.Converters.Add(new GuidToleranteJsonConverter());
        opcoes.Converters.Add(new DataToleranteJsonConverter(formatosDeData));
        opcoes.Converters.Add(new TextoToleranteJsonConverter());
        opcoes.Converters.Add(new BoolToleranteJsonConverter());
        opcoes.Converters.Add(new EnumToleranteConverterFactory());
        opcoes.Converters.Add(new VazioComoNuloConverterFactory());

        return opcoes;
    }
}
