// Converters de leitura tolerante para System.Text.Json.
// Eles repetem as conversões que o Newtonsoft fazia sem configuração.
// Copie este arquivo para o projeto, troque o namespace e registre os converters no perfil JSON.
// Prova de cada caso: assets/jsondiff (seção 15).

using System.Buffers;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Colibri.Json.Tolerante;

/// <summary>
/// Lê <c>""</c> e texto em branco como <c>null</c> em QUALQUER tipo de valor anulável
/// (<c>int?</c>, <c>decimal?</c>, <c>Guid?</c>, <c>DateTime?</c>, enum anulável).
/// Os outros valores vão para o converter do tipo não anulável do mesmo perfil.
/// </summary>
/// <remarks>
/// Motivo: um <c>JsonConverter&lt;T&gt;</c> não recebe o <c>null</c> de um <c>T?</c>, mas recebe o <c>""</c>.
/// Um converter só para <c>T</c> lança com <c>""</c>. O Newtonsoft devolvia <c>null</c>.
/// Usa reflexão (<c>MakeGenericType</c>): não use em aplicação publicada com trimming ou AOT.
/// Custo medido no .NET 11: 19% a mais de tempo e 0 bytes a mais na leitura de um objeto com 6 campos anuláveis
/// (assets/jsondiff, seção 16). Um número em texto num campo numérico anulável usa um caminho mais lento.
/// </remarks>
public sealed class VazioComoNuloConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
        => Nullable.GetUnderlyingType(typeToConvert) is not null;

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        var tipo = Nullable.GetUnderlyingType(typeToConvert)!;

        return (JsonConverter)Activator.CreateInstance(typeof(VazioComoNuloConverter<>).MakeGenericType(tipo))!;
    }

    private sealed class VazioComoNuloConverter<T> : JsonConverter<T?>
        where T : struct
    {
        private static readonly bool _numerico = Type.GetTypeCode(typeof(T)) is >= TypeCode.SByte and <= TypeCode.Decimal;

        private JsonConverter<T>? _interno;
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
            // Só nesse caso a leitura passa pelo JsonSerializer, que é mais lento (medido: cerca de 2 vezes).
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

        private JsonConverter<T> Interno(JsonSerializerOptions options)
        {
            if (_interno is not null)
                return _interno;

            var interno = (JsonConverter<T>)options.GetConverter(typeof(T));
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
/// Lê número e booleano em campo <c>string</c>. O texto fica igual ao do json (<c>12.50</c> vira <c>"12.50"</c>).
/// </summary>
public sealed class TextoToleranteJsonConverter : JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType switch
        {
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Number or JsonTokenType.True or JsonTokenType.False => TextoBruto(ref reader),
            _ => throw new JsonException($"O valor {reader.TokenType} não pode ser lido como texto.")
        };

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);

    // HasValueSequence: o ASP.NET Core 10 entrega o valor em vários segmentos.
    private static string TextoBruto(ref Utf8JsonReader reader)
        => reader.HasValueSequence
            ? Encoding.UTF8.GetString(reader.ValueSequence.ToArray())
            : Encoding.UTF8.GetString(reader.ValueSpan);
}

/// <summary>
/// Lê <c>true</c>/<c>false</c>, <c>"true"</c>/<c>"false"</c> sem diferenciar a caixa, e número (0 é falso).
/// </summary>
public sealed class BoolToleranteJsonConverter : JsonConverter<bool>
{
    public override bool Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType switch
        {
            JsonTokenType.True => true,
            JsonTokenType.False => false,
            JsonTokenType.Number when reader.TryGetDecimal(out var numero) => numero != 0,
            JsonTokenType.String when bool.TryParse(reader.GetString(), out var valor) => valor,
            _ => throw new JsonException($"O valor {Recebido.Texto(ref reader)} não pode ser lido como booleano.")
        };

    public override void Write(Utf8JsonWriter writer, bool value, JsonSerializerOptions options)
        => writer.WriteBooleanValue(value);
}

/// <summary>
/// Lê GUID com chaves, com parênteses, sem hifens ou no formato padrão.
/// </summary>
public sealed class GuidToleranteJsonConverter : JsonConverter<Guid>
{
    public override Guid Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.String && Guid.TryParse(reader.GetString(), out var guid)
            ? guid
            : throw new JsonException($"O valor {Recebido.Texto(ref reader)} não é um GUID.");

    public override void Write(Utf8JsonWriter writer, Guid value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);
}

/// <summary>
/// Lê data no formato ISO 8601 e nos formatos extras do contrato. Escreve como o System.Text.Json.
/// </summary>
/// <remarks>
/// Passe só os formatos que a origem envia de fato. Um formato ambíguo (<c>dd/MM</c> e <c>MM/dd</c>) lê a data errada sem erro.
/// </remarks>
public sealed class DataToleranteJsonConverter(params string[] formatosExtras) : JsonConverter<DateTime>
{
    // "yyyy-MM-dd HH:mm:ss" (espaço no lugar do T) é o formato que o Newtonsoft aceitava e o System.Text.Json recusa.
    private readonly string[] _formatos = [.. formatosExtras, "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm:ss.FFFFFFF"];

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            if (reader.TryGetDateTime(out var data))
                return data;

            if (DateTime.TryParseExact(reader.GetString(), _formatos, CultureInfo.InvariantCulture, DateTimeStyles.None, out data))
                return data;
        }

        throw new JsonException($"O valor {Recebido.Texto(ref reader)} não é uma data aceita pelo contrato.");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);
}

/// <summary>
/// Lê enum em número, em texto (sem diferenciar a caixa) e em número dentro de texto. Escreve o enum como NÚMERO.
/// </summary>
/// <remarks>
/// Motivo: o Newtonsoft lia texto e número, e escrevia número. O <c>JsonStringEnumConverter</c> também lê os dois,
/// mas escreve texto: ele muda o json enviado. Use o <c>JsonStringEnumConverter</c> só no enum que tinha
/// <c>StringEnumConverter</c> no Newtonsoft.
/// </remarks>
public sealed class EnumToleranteConverterFactory : JsonConverterFactory
{
    // Um converter na coleção Converters ganha do atributo [JsonConverter] do tipo (no Newtonsoft era o contrário).
    // Sem esta condição, um enum com JsonStringEnumConverter no tipo passaria a ser escrito como número.
    public override bool CanConvert(Type typeToConvert)
        => typeToConvert.IsEnum && !typeToConvert.IsDefined(typeof(JsonConverterAttribute), inherit: false);

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
        => (JsonConverter)Activator.CreateInstance(typeof(EnumToleranteConverter<>).MakeGenericType(typeToConvert))!;

    private sealed class EnumToleranteConverter<T> : JsonConverter<T>
        where T : struct, Enum
    {
        private static readonly bool _semSinal = Type.GetTypeCode(typeof(T)) == TypeCode.UInt64;

        public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.TokenType switch
            {
                JsonTokenType.Number when _semSinal && reader.TryGetUInt64(out var numero) => (T)Enum.ToObject(typeof(T), numero),
                JsonTokenType.Number when reader.TryGetInt64(out var numero) => (T)Enum.ToObject(typeof(T), numero),
                JsonTokenType.String when Enum.TryParse<T>(reader.GetString(), ignoreCase: true, out var valor) => valor,
                _ => throw new JsonException($"O valor {Recebido.Texto(ref reader)} não pode ser lido como {typeof(T).Name}.")
            };

        public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
        {
            if (_semSinal)
                writer.WriteNumberValue(Convert.ToUInt64(value, CultureInfo.InvariantCulture));
            else
                writer.WriteNumberValue(Convert.ToInt64(value, CultureInfo.InvariantCulture));
        }
    }
}

/// <summary>
/// Texto do valor recebido, para a mensagem de erro. Sem ele, o log de produção não mostra o dado que causou a falha.
/// </summary>
/// <remarks>
/// Decisão: os converters de GUID, data, booleano e enum mostram o valor, cortado em 60 caracteres.
/// O converter de texto não mostra, porque um campo de texto pode ter dado pessoal ou segredo.
/// Se a regra do projeto proíbe dado externo no log, troque <c>Recebido.Texto(ref reader)</c> por <c>reader.TokenType</c>.
/// </remarks>
internal static class Recebido
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

        return reader.TokenType == JsonTokenType.String ? $"\"{texto}\"" : texto;
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
    public static JsonSerializerOptions ComLeituraTolerante(this JsonSerializerOptions opcoes, params string[] formatosDeData)
    {
        opcoes.PropertyNameCaseInsensitive = true;
        opcoes.NumberHandling |= JsonNumberHandling.AllowReadingFromString;
        opcoes.Converters.Add(new VazioComoNuloConverterFactory());
        opcoes.Converters.Add(new TextoToleranteJsonConverter());
        opcoes.Converters.Add(new BoolToleranteJsonConverter());
        opcoes.Converters.Add(new GuidToleranteJsonConverter());
        opcoes.Converters.Add(new DataToleranteJsonConverter(formatosDeData));
        opcoes.Converters.Add(new EnumToleranteConverterFactory());

        return opcoes;
    }
}
