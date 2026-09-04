---
name: investigar-logs
description: "Log gigante sob controle: investiga arquivos de log grandes sem ler o arquivo inteiro. Use when o usuário pedir para investigar, localizar ou reconstituir evidências em arquivos de log. Don't use for buscas em código-fonte, edição de arquivos ou monitoramento contínuo de logs."
---

# Investigação de logs grandes

Impõe o mesmo processo a cada investigação de log: medir, localizar por busca, ler só as faixas — o arquivo completo nunca é carregado.

## Steps — investigação

**Step 1: Medir antes de ler**
1. Confirmar o caminho com `Test-Path -LiteralPath`.
2. Obter nome, tamanho, extensão e data de escrita com `Get-Item`.
3. Espiar no máximo 5 linhas com `Get-Content -TotalCount` para confirmar formato texto, codificação e esquema da linha (extensões como `.logc` podem ser texto puro).

*Done when:* tamanho, formato e esquema da linha conhecidos sem ter lido mais que um punhado de linhas.

**Step 2: Localizar por busca indexada**
1. Prefixar todo comando de shell com `rtk` e contar ocorrências com `rtk rg -n -i -c "padrao" <arquivo>` antes de extrair (busca case-insensitive para IDs e GUIDs).
2. Combinar padrões relacionados em uma única passagem.
3. Despejar os matches com número da linha em arquivo temporário no diretório temporário aprovado, truncando linhas acima de ~2500 caracteres.
4. Filtrar o temporário com `rg`; nunca recarregá-lo com um pipeline completo.

*Done when:* cada ocorrência localizada por número da linha, sem o arquivo completo carregado.

**Step 3: Ler só as faixas**
1. Extrair janelas limitadas de linhas ao redor dos matches, truncando linhas de payload longas e anotando o comprimento original.
2. Registrar o total de linhas para orientar os cortes.
3. Montar a linha do tempo somente com as faixas extraídas.

*Done when:* a sequência de eventos reconstituída a partir das faixas, e o arquivo completo jamais carregado em leitura.

## Reference — regras de busca e leitura

- Preferir `rg` a `Get-ChildItem -Recurse | Select-String` para localizar conteúdo.
- Nunca usar `Select-Object -Last N` como substituto de contagem ou escopo adequados.
- Truncar saída longa em vez de suprimi-la; reduzir ruído sem descartar o contexto necessário ao diagnóstico.
- Cruzar cada evento da linha do tempo com o código que emite a mensagem antes de afirmar a causa.

## Error Handling

- Se a espiada revelar conteúdo binário ou ilegível, reportar o formato e interromper antes da busca.
- Se a contagem retornar zero, ampliar o padrão (caixa, hífens, trechos) e reconfirmar o caminho antes de concluir ausência.
- Se um match isolado tiver linha gigante, truncar e anotar o comprimento; nunca imprimi-la integralmente.
