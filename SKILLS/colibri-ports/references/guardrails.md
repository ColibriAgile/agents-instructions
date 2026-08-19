# Guardrails: leitura de portas no ambiente Colibri

## Invariantes

1. Selecione a propriedade de porta pelo contrato do requisito; `Portas.DConnect` é apenas a referência concreta do DConnect.
2. Preserve `Master.Porta` como propriedade do serviço Master e diferencie-a das propriedades agrupadas em `Portas`.
3. Preserve as fontes Master/cliente, o parsing e a normalização providos por `CoLib.Ambiente`.
4. Mantenha a exposição por `CoLib.Colibri` quando a propriedade existir em `IProvedorDeConfiguracoesDoAmbiente` ou `ProvedorDeConfiguracoesDoAmbiente`.
5. Preserve defaults, erros de arquivos obrigatórios e a semântica parcial do cache opcional: falhas anteriores à atribuição de `Portas` mantêm os defaults, sem criar rollback para exceções posteriores.
6. Preserve o ciclo de vida carregado; trate reload como decisão explícita.
7. Faça o código-alvo ler e usar o valor localmente, sem transformá-lo em descoberta ou consumo de endpoint do DConnect.

## Escalonamento obrigatório

Escalone antes de implementar quando:

- o alvo não possuir as bibliotecas Colibri ou usar APIs incompatíveis;
- a origem ou o formato de `launcher.conexao` forem diferentes;
- o alvo precisar alterar a precedência de argumentos de linha de comando sobre o INI no modo Master;
- a propriedade solicitada não existir no contrato Colibri comprovado;
- a origem de uma precedência adicional não estiver delimitada;
- o requisito não distinguir `Master.Porta` das propriedades em `Portas`;
- houver requisito de reload, validação de faixa, probe de disponibilidade ou retry;
- a biblioteca for consumida como pacote em vez de fonte compartilhada.

## Gates

1. Confirmar referências, target framework e símbolos disponíveis no alvo.
2. Testar parsing de Master e cliente, valores inválidos, defaults e arquivos ausentes.
3. Testar a propriedade selecionada e a distinção entre ela, `Master.Porta` e outras portas relacionadas.
4. Testar o contrato de `IProvedorDeConfiguracoesDoAmbiente` quando usado.
5. Testar o valor lido no código-alvo, sem exigir conexão com o DConnect.
6. Registrar cada divergência de versão, fonte, exceção ou ciclo de vida antes de aceitar paridade.
