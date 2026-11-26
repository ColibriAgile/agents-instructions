// Repete o texto do JToken.ToString() do Newtonsoft para um JsonNode (N5, N16, N17, N21, N24 da matriz).
// Copie este arquivo para o projeto e troque o namespace.
// Prova: Newtonsoft como oráculo em plugins-manager 8ec907f (LegacyComPayloadConverterEquivalenciaTestes):
// número, inteiro grande, booleano, null, objeto, data ISO com e sem fração e fuso, /Date()/ e textos que não são data.
// O valor deve vir de um JsonDocument/JsonNode.Parse: o número usa o texto do json.

using System.Globalization;
using System.Numerics;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Colibri.Json.Tolerante;

/// <summary>
/// O texto de um valor json como o <c>JToken.ToString()</c> do Newtonsoft devolvia antes da troca para o System.Text.Json.
/// </summary>
/// <remarks>
/// <para>
/// Use quando um campo json chega ao consumidor como texto (<c>token.ToString()</c> no código antigo).
/// O Newtonsoft lia o json com <c>DateParseHandling.DateTime</c>, então o texto final depende da cultura atual:
/// </para>
/// <list type="bullet">
/// <item>Número: <c>12,5</c> em pt-BR. Um inteiro sai com os mesmos dígitos.</item>
/// <item>Booleano: <c>True</c> ou <c>False</c>.</item>
/// <item>Data ISO (<c>yyyy-MM-ddTHH:mm:ss</c>, fração de até 7 dígitos, fuso opcional) e <c>/Date(ms)/</c>:
/// <see cref="DateTime.ToString()"/>. Uma data com fuso numérico vai para o fuso local.</item>
/// <item>Objeto e array: json indentado.</item>
/// </list>
/// <para>
/// Diferença conhecida: dentro de um objeto ou array, as datas e os números saem com o texto original.
/// O Newtonsoft os reescrevia.
/// </para>
/// </remarks>
internal static class TextoComoJToken
{
    private static readonly JsonSerializerOptions _indentado = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly DateTime _epoca = new(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>
    /// O texto do valor. O literal null devolve texto vazio.
    /// </summary>
    /// <param name="valor">O valor lido de um texto json (<c>JsonNode.Parse</c> ou <c>JsonDocument</c>).</param>
    /// <param name="fracaoComoDouble">
    /// <see langword="true"/> repete o <c>JObject.Parse</c> padrão (fração como <see langword="double"/>: <c>1.50</c> vira <c>1,5</c>).
    /// <see langword="false"/> repete um reader com <c>FloatParseHandling.Decimal</c>, como o <c>ParseJson</c> da CoLib
    /// (fração como <see langword="decimal"/>: <c>1.50</c> vira <c>1,50</c>). Confira o parse do código antigo (N24).
    /// </param>
    public static string Ler(JsonNode? valor, bool fracaoComoDouble)
    {
        if (valor is null)
            return string.Empty;

        if (valor is not JsonValue)
            return valor.ToJsonString(_indentado);

        return valor.GetValueKind() switch
        {
            JsonValueKind.Null => string.Empty,
            JsonValueKind.True => bool.TrueString,
            JsonValueKind.False => bool.FalseString,
            JsonValueKind.Number => Numero(valor.ToJsonString(), fracaoComoDouble),
            _ => Texto(valor.GetValue<string>())
        };
    }

    private static string Numero(string bruto, bool fracaoComoDouble)
    {
        var cultura = CultureInfo.CurrentCulture;

        if (bruto.AsSpan().IndexOfAny('.', 'e', 'E') < 0)
        {
            return long.TryParse(bruto, NumberStyles.Integer, CultureInfo.InvariantCulture, out var inteiro)
                ? inteiro.ToString(cultura)
                : BigInteger.Parse(bruto, NumberStyles.Integer, CultureInfo.InvariantCulture).ToString(cultura);
        }

        if (!fracaoComoDouble && decimal.TryParse(bruto, NumberStyles.Float, CultureInfo.InvariantCulture, out var dec))
            return dec.ToString(cultura);

        return double.Parse(bruto, NumberStyles.Float, CultureInfo.InvariantCulture).ToString(cultura);
    }

    private static string Texto(string texto)
        => LerData(texto) is { } data ? data.ToString(CultureInfo.CurrentCulture) : texto;

    // Mesma condição do DateTimeUtils.TryParseDateTime do Newtonsoft.
    private static DateTime? LerData(string texto)
    {
        if (texto.StartsWith('/'))
            return texto.Length >= 9 && texto.StartsWith("/Date(", StringComparison.Ordinal) && texto.EndsWith(")/", StringComparison.Ordinal)
                ? LerDataMicrosoft(texto[6..^2])
                : null;

        return texto.Length is >= 19 and <= 40 && char.IsAsciiDigit(texto[0]) && texto[10] == 'T'
            ? LerDataIso(texto)
            : null;
    }

    private static DateTime? LerDataIso(string texto)
    {
        if (!Digitos(texto, 0, 4, out var ano) || texto[4] != '-' || !Digitos(texto, 5, 2, out var mes) || texto[7] != '-'
            || !Digitos(texto, 8, 2, out var dia) || !Digitos(texto, 11, 2, out var hora) || texto[13] != ':'
            || !Digitos(texto, 14, 2, out var minuto) || texto[16] != ':' || !Digitos(texto, 17, 2, out var segundo))
            return null;

        var posicao = 19;
        long fracao = 0;

        if (posicao < texto.Length && texto[posicao] == '.')
        {
            var inicio = ++posicao;

            while (posicao < texto.Length && posicao - inicio < 7 && char.IsAsciiDigit(texto[posicao]))
                fracao = fracao * 10 + (texto[posicao++] - '0');

            var digitos = posicao - inicio;

            // Sem dígito, ou com mais de 7: o texto não é data.
            if (digitos == 0 || (posicao < texto.Length && char.IsAsciiDigit(texto[posicao])))
                return null;

            for (var i = digitos; i < 7; i++)
                fracao *= 10;
        }

        if (hora > 23 || minuto > 59 || segundo > 59 || mes is < 1 or > 12 || ano < 1 || dia < 1 || dia > DateTime.DaysInMonth(ano, mes))
            return null;

        var ticks = new DateTime(ano, mes, dia, hora, minuto, segundo).Ticks + fracao;

        if (posicao == texto.Length)
            return new DateTime(ticks, DateTimeKind.Unspecified);

        if (texto[posicao] == 'Z' && posicao + 1 == texto.Length)
            return new DateTime(ticks, DateTimeKind.Utc);

        if (texto[posicao] is not ('+' or '-') || LerFuso(texto, posicao + 1) is not { } fuso)
            return null;

        var deslocamento = texto[posicao] == '+' ? fuso : -fuso;

        return new DateTime(ticks - deslocamento.Ticks, DateTimeKind.Utc).ToLocalTime();
    }

    // HH, HH:mm ou HHmm até o fim do texto.
    private static TimeSpan? LerFuso(string texto, int posicao)
    {
        if (!Digitos(texto, posicao, 2, out var horas))
            return null;

        posicao += 2;
        var minutos = 0;

        if (posicao < texto.Length)
        {
            if (texto[posicao] == ':')
                posicao++;

            if (!Digitos(texto, posicao, 2, out minutos))
                return null;

            posicao += 2;
        }

        return posicao == texto.Length && horas <= 23 && minutos <= 59 ? new TimeSpan(horas, minutos, 0) : null;
    }

    // ms desde 1970 (pode ser negativo), com fuso opcional +HHmm ou -HHmm.
    private static DateTime? LerDataMicrosoft(string conteudo)
    {
        var fimDosMs = conteudo.Length;
        var sinal = conteudo.IndexOfAny(['+', '-'], 1);

        if (sinal > 0)
            fimDosMs = sinal;

        if (!long.TryParse(conteudo.AsSpan(0, fimDosMs), NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var ms))
            return null;

        var utc = _epoca.AddMilliseconds(ms);

        if (sinal < 0)
            return utc;

        return conteudo.Length - sinal == 5 && Digitos(conteudo, sinal + 1, 4, out _) ? utc.ToLocalTime() : null;
    }

    private static bool Digitos(string texto, int inicio, int quantidade, out int valor)
    {
        valor = 0;

        if (inicio + quantidade > texto.Length)
            return false;

        for (var i = inicio; i < inicio + quantidade; i++)
        {
            if (!char.IsAsciiDigit(texto[i]))
                return false;

            valor = valor * 10 + (texto[i] - '0');
        }

        return true;
    }
}
