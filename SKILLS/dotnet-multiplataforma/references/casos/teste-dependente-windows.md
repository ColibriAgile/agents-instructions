---
id: teste-dependente-windows
titulo: Testes que supõem caminhos ou programas do Windows
fase: teste
status: sintoma-confirmado
checagem: nenhuma
verificado_em: Linux, SDK 11.0.100, 2026-11-27
sinais:
  - (DirectoryNotFound|FileNotFound)Exception.*[A-Za-z]:\\
  - process 'cmd\.exe'
  - caminho absoluto\. Valor recebido. ([A-Za-z]:|\\\\)
---

## Sintoma

O build passa e testes falham só fora do Windows: `C:\...` não encontrado, caminho "não absoluto", tentativa de
iniciar `cmd.exe`. Parte das falhas aparece apenas como asserção falsa, sem citar caminho.

## Causa

Fora do Windows, `C:\pasta` e `\\servidor` não são caminhos absolutos e `\` não separa pastas. Isso vale para
`System.IO` e para sistemas de arquivos simulados em teste, que seguem o sistema atual.

## Correção (ainda não validada)

Decida primeiro se o comportamento testado existe no Linux:

- Existe: monte os caminhos com `Path.Combine` a partir de uma raiz neutra (`Path.GetTempPath()` ou a raiz do
  sistema de arquivos simulado). Se a falha revelar `\` fixo no código de produção, corrija a produção.
- Não existe (registro, serviços, COM): pule explicitamente o teste fora do Windows com o recurso do framework em
  uso, para o relatório mostrar "ignorado" em vez de falha.

## Armadilhas

Não troque asserções só para o teste passar; várias falhas podem apontar defeitos reais de portabilidade.

## Evidência

62 de 462 testes falharam em um repositório de ferramentas de build. Nem todas as falhas foram analisadas.
