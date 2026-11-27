---
id: api-windows
titulo: API exclusiva do Windows no código (registro, P/Invoke, serviços)
fase: execucao
status: sintoma-confirmado
ajuste: incompativel
checagem: dependencia_windows
verificado_em: Linux, SDK 11.0.100, 2026-11-27 (Windows não testado)
sinais:
  - CA1416
  - DllNotFoundException
  - PlatformNotSupportedException
---

## Sintoma

O build passa, no máximo com avisos `CA1416`. Em execução surgem `DllNotFoundException`, `NullReferenceException` no registro ou `PlatformNotSupportedException`.

## Causa

O registro, as DLLs do sistema e pacotes como `System.ServiceProcess` ou `System.Management` não existem fora do Windows.

## Correção

Depende da função de cada chamada.

## Riscos e opções

- **Proteger a chamada:** `if (OperatingSystem.IsWindows())` com comportamento definido para os outros sistemas.
- **Abstrair:** interface com uma implementação por sistema (por exemplo, arquivo de configuração no lugar do registro).
- **Substituir:** usar a API portável equivalente do .NET, quando existir.
- **Declarar exclusivo:** `[SupportedOSPlatform("windows")]`, para o analisador cobrar quem chama.

## Armadilhas

- A ausência de aviso não prova portabilidade: o `DllImport` testado não gerou `CA1416`.
- A busca é textual e por lista conhecida; DLLs de terceiros e chamadas por reflexão passam despercebidas.
- Um achado já protegido por `OperatingSystem.IsWindows()` pode ser legítimo; confira o fluxo.

## Evidência

`Registry.CurrentUser` gerou `CA1416` e `NullReferenceException`; `DllImport` de `kernel32.dll` gerou `DllNotFoundException`.
