---
name: colibri-ports
description: Leitura de portas Colibri: use quando um projeto C# precisar criar ou adaptar código para ler o valor de uma porta usando CoLib.Ambiente e CoLib.Colibri, preservando fontes, propriedades, defaults, erros e ciclo de vida comprovados pelo DConnect. Não use para consumir endpoints do DConnect, ler portas fora do ambiente Colibri ou alterar o formato de launcher.conexao sem evidência.
---

# Leitura de portas Colibri

Esta skill orienta a criação de código C# que lê um valor de porta a partir das configurações oficiais do ambiente Colibri. O DConnect é apenas a aplicação de referência; a implementação-alvo deve ler a propriedade solicitada, sem criar um cliente do DConnect.

## Steps

**Step 1: Fixar o contrato**

1. O agente deve identificar o projeto-alvo, o tipo de host, o target framework, as instruções aplicáveis, os arquivos afetados e os testes existentes.
2. O agente deve registrar a propriedade de porta solicitada, sua finalidade local, as fontes Master/cliente, defaults, erros e ciclo de vida esperados.
3. Se não houver projeto-alvo concreto, o agente deve produzir orientação de paridade e manter a adoção como lacuna, sem inventar APIs.

*Done when:* fonte, alvo, escopo, glob `**/*.cs`, propriedade de porta e critério de paridade estão explícitos.

**Step 2: Carregar a referência comprovada**

1. Quando a tarefa envolver leitura de uma porta do ambiente Colibri, o agente deve ler `references/rules.md` em full antes de alterar C#.
2. Antes de escolher uma adaptação, o agente deve ler `references/guardrails.md` em full.
3. Quando uma afirmação precisar de proveniência, o agente deve consultar `references/evidence.md` em full e usar as localizações exatas da referência.

*Done when:* cada comportamento que será preservado está ligado a uma regra, guardrail e evidência ou marcado como lacuna.

**Step 3: Confrontar o alvo**

1. O agente deve localizar a fonte de configuração, imports ou referências de `CoLib.Ambiente` e `CoLib.Colibri`, a propriedade de porta equivalente e os testes de configuração.
2. O agente deve mapear cada regra como `adotar`, `adaptar`, `incompatível`, `não aplicável` ou `lacuna`.
3. O agente deve escalar diferenças de versão, formato de arquivo, propriedade, ciclo de vida, exceções ou contratos antes de escolher substitutos.

*Done when:* toda regra aplicável tem decisão no alvo, toda incompatibilidade tem impacto registrado e nenhuma premissa de integração permanece implícita.

**Step 4: Implementar o fluxo**

1. O agente deve usar `CoLib.Ambiente.ConfiguracoesDeAmbiente` como fonte de leitura e selecionar a propriedade de porta comprovada para o requisito.
2. O agente deve usar `IProvedorDeConfiguracoesDoAmbiente` ou `ProvedorDeConfiguracoesDoAmbiente` somente quando a propriedade solicitada existir nesse contrato; para propriedades fora dele, deve usar a adaptação comprovada ou escalar a lacuna.
3. O agente deve preservar a distinção entre `Portas.<propriedade>` e `Master.Porta`, sem inferir a propriedade pela finalidade do serviço.
4. O agente deve centralizar o parsing na lib Colibri e manter o código-alvo responsável apenas por obter e expor o valor necessário.

*Done when:* o código-alvo lê a propriedade correta pelas abstrações Colibri, não contém parser concorrente e todos os arquivos modificados estão cobertos por testes ou por uma lacuna explícita.

**Step 5: Validar a paridade**

1. O agente deve testar as fontes Master e cliente, a propriedade solicitada, defaults, arquivos obrigatórios ausentes e cache inválido.
2. O agente deve testar a distinção entre propriedades de porta e confirmar que o valor lido é o usado pelo código-alvo local.
3. O agente deve executar somente os comandos de validação já existentes no alvo; antes de `dotnet build`, `dotnet test`, `dotnet publish` ou `dotnet run`, deve carregar `dotnet-efficient-validation`.

*Done when:* as validações direcionadas passam, as diferenças são explicadas e nenhum erro ou fallback foi silenciado.

**Step 6: Auditar a entrega**

1. O agente deve reler as alterações e confirmar que cada decisão normativa aponta para evidência ou para uma decisão explícita do alvo.
2. O agente deve registrar versões não comprovadas, origem desconhecida de `launcher.conexao`, propriedades ausentes no contrato e ausência de testes diretos.

*Done when:* o relatório final separa observado, inferido e desconhecido, e não contém arquitetura nova apresentada como paridade.

## Error Handling

- Se `CoLib.Ambiente` ou `CoLib.Colibri` não estiver disponível, o agente deve marcar `incompatível` e escalar a escolha da dependência; a implementação deve preservar a proveniência em vez de substituir a biblioteca por semelhança nominal.
- Se `ncrmaster.cfg` ou `launcher.boot` forem obrigatórios e estiverem ausentes, o agente deve preservar a falha explícita observada.
- Se `launcher.conexao` tiver formato ou produtor desconhecido, o agente deve preservar a leitura somente após confirmar o contrato; caso contrário, deve registrar uma lacuna.
- Se a propriedade solicitada não existir no contrato Colibri comprovado, o agente deve registrar a lacuna e escalar a adaptação antes de criar uma nova abstração.
- Se o alvo exigir reload, validação de faixa, probe de disponibilidade, retry ou consumo de endpoint, o agente deve tratar isso como decisão fora da evidência extraída.
