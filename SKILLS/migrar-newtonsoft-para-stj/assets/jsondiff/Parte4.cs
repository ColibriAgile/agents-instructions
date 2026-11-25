using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Colibri.Json.Tolerante;

public static class Parte4
{
    public static void Run()
    {
        Console.WriteLine("\n##### 16. CUSTO DA VazioComoNuloConverterFactory");
        const string json = "{\"I\":12,\"D\":1.50,\"Gn\":\"0f8fad5b-d9cb-469f-a165-70867728950e\",\"Dtn\":\"2026-11-25T10:00:00\",\"Mn\":1,\"Bn\":true,\"S\":\"abc\",\"L\":9}";
        var sem = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, NumberHandling = JsonNumberHandling.AllowReadingFromString };
        var com = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, NumberHandling = JsonNumberHandling.AllowReadingFromString, Converters = { new VazioComoNuloConverterFactory() } };
        var todos = new JsonSerializerOptions().ComLeituraTolerante();
        const int n = 300_000;
        double Medir(JsonSerializerOptions o)
        {
            for (var i = 0; i < 20_000; i++) JsonSerializer.Deserialize<Sujo>(json, o);
            var melhor = double.MaxValue;
            for (var r = 0; r < 5; r++)
            {
                var sw = Stopwatch.StartNew();
                for (var i = 0; i < n; i++) JsonSerializer.Deserialize<Sujo>(json, o);
                melhor = Math.Min(melhor, sw.Elapsed.TotalMilliseconds);
            }
            return melhor * 1_000_000 / n;
        }
        long Alocado(JsonSerializerOptions o)
        {
            var antes = GC.GetAllocatedBytesForCurrentThread();
            for (var i = 0; i < 10_000; i++) JsonSerializer.Deserialize<Sujo>(json, o);
            return (GC.GetAllocatedBytesForCurrentThread() - antes) / 10_000;
        }
        var a = Medir(sem); var b = Medir(com); var c = Medir(todos);
        Console.WriteLine($"  objeto com 6 campos anulaveis preenchidos, {n} leituras, melhor de 5:");
        Console.WriteLine($"  sem a fabrica            : {a,7:F0} ns por objeto, {Alocado(sem)} bytes");
        Console.WriteLine($"  com VazioComoNulo        : {b,7:F0} ns por objeto, {Alocado(com)} bytes  ({b / a:F2}x)");
        Console.WriteLine($"  com ComLeituraTolerante  : {c,7:F0} ns por objeto, {Alocado(todos)} bytes  ({c / a:F2}x)");
    }
}
