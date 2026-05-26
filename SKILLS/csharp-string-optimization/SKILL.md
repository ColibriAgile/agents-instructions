---
name: csharp-string-optimization
description: CSharp String Optimization Specialist
---

# Skill: CSharp String Optimization Specialist

## Objetivo
Otimizar codigo C# de manipulacao de strings com foco em:
- reduzir alocacoes no heap
- diminuir pressao de GC
- melhorar throughput em hot paths
- preservar legibilidade quando o ganho nao compensa a complexidade

## Base tecnica (extraida do artigo)
- Span<T> e Memory<T> permitem operar sobre fatias de memoria sem copia.
- Zero allocation nao significa sempre o maior ganho de tempo; depende do custo real da operacao.
- Ganhos observados no artigo:
  - CSV parsing com Span: ~4.2x
  - Substring -> Slice: ~6.1x
  - Parse de inteiro via span: ~2.8x
  - ArrayPool para 4KB: ~1.4x (ganho menor, beneficio principal em GC)
  - StringBuilder -> stackalloc/Span: ~2.1x
- Trade-off central: codigo com span pode ficar mais verboso e exige consumo imediato dos dados.

## Regras da Skill
1. Priorizar mudancas de baixo risco primeiro:
   - Substring + Parse -> Parse(ReadOnlySpan<char>)
   - Split em loop quente -> parser com AsSpan/IndexOf/Slice
2. Aplicar stackalloc + Span<char> somente quando:
   - tamanho maximo e conhecido
   - rota realmente quente
   - equipe consegue manter o codigo
3. Em codigo async ou quando dados precisam atravessar await, usar Memory<T> em vez de Span<T>.
4. Evitar over-optimization em caminhos frios, I/O bound, ou baixa frequencia.
5. Nunca propor otimizacao sem:
   - delta de performance
   - delta de alocacao
   - impacto em legibilidade/manutencao

## Matriz de decisao
Use Span<T> quando:
- loop quente de parsing (CSV, logs, protocolo)
- alocacao representa parcela importante do custo
- dado pode ser consumido imediatamente
- ha sinais de pausas de GC em producao

Mantenha string tradicional quando:
- execucao esporadica (< 10k ops/s como referencia do artigo)
- resultado precisa ser armazenado ou passado entre metodos
- simplicidade e manutencao tem maior prioridade

Use ArrayPool<T> + Memory<T> quando:
- buffers grandes e repetidos (especialmente proximos/maiores que LOH)
- tempo de vida cruza fronteiras async
- pressao de GC e o gargalo principal

## Checklist de analise
- O trecho e CPU-bound ou I/O-bound?
- Qual metodo aloca mais? (Split, Substring, concat, StringBuilder, new byte[])
- O trecho e executado em alta frequencia?
- O dado pode ser processado inline sem persistir fatias?
- Ha risco de piorar muito a legibilidade?
- Existe benchmark antes/depois com variancia aceitavel?

## Padrao de resposta da Skill
Quando acionada, a skill deve responder em 5 blocos:
1. Diagnostico rapido
2. Estrategia de otimizacao priorizada
3. Refactor proposto (codigo)
4. Benchmark esperado (tempo + alocacao)
5. Riscos e criterio de rollback

## Snippets de referencia
### 1) Parse sem Substring
```csharp
ReadOnlySpan<char> span = line.AsSpan();
int idx = span.LastIndexOf(',');
int value = int.Parse(span[(idx + 1)..]);
```

### 2) CSV sem Split
```csharp
ReadOnlySpan<char> remaining = line.AsSpan();
while (!remaining.IsEmpty)
{
    int comma = remaining.IndexOf(',');
    ReadOnlySpan<char> field = comma < 0 ? remaining : remaining[..comma];

    // Consumir field imediatamente

    remaining = comma < 0 ? ReadOnlySpan<char>.Empty : remaining[(comma + 1)..];
}
```

### 3) Build de string com stackalloc
```csharp
Span<char> buffer = stackalloc char[64];
int pos = 0;
"ORDER-".AsSpan().CopyTo(buffer[pos..]);
pos += 6;
2026.TryFormat(buffer[pos..], out int w);
pos += w;
buffer[pos++] = '-';
3.TryFormat(buffer[pos..], out w);
pos += w;
return new string(buffer[..pos]);
```
