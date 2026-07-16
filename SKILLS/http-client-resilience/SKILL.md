---
name: http-client-resilience
description: 'Adiciona resiliência HTTP em projetos .NET que usam HttpClient, IHttpClientFactory ou Flurl.Http. Use ao instalar Microsoft.Extensions.Http.Resilience, configurar AddStandardResilienceHandler ou AddResilienceHandler, definir retry, timeout, circuit breaker, rate limiter, ou integrar Flurl a um HttpClient da DI.'
argument-hint: 'Projeto ou cliente HTTP que deve receber resiliência'
---

# Resiliência HTTP para .NET

Implemente resiliência para chamadas HTTP de saída com `Microsoft.Extensions.Http.Resilience`, preservando a semântica das operações e a arquitetura existente do projeto. Aplique o pipeline ao `HttpClient` que realmente executa a chamada; isso requer atenção especial quando há Flurl.Http.

## Quando Usar

- Adicionar retry, timeout, circuit breaker ou rate limiter a clientes `HttpClient`.
- Registrar clientes nomeados ou tipados com `IHttpClientFactory`.
- Substituir políticas HTTP manuais ou antigas por `Microsoft.Extensions.Http.Resilience`.
- Fazer chamadas do Flurl.Http passarem por um `HttpClient` configurado pela DI.
- Revisar uma implementação de resiliência HTTP que pode duplicar handlers, repetir operações de escrita ou não cobrir o cliente efetivamente usado.

## Princípios

- Adicione somente um manipulador de resiliência por `HttpClient`. Não empilhe `AddStandardResilienceHandler`, `AddStandardHedgingHandler` e `AddResilienceHandler` no mesmo cliente.
- Comece pelo handler padrão. Use um pipeline customizado apenas quando houver requisito mensurável que não seja atendido pelos padrões.
- Retry para métodos que alteram estado exige uma decisão de domínio: idempotência comprovada, chave de idempotência no serviço remoto ou desabilitação do retry.
- Não altere globalmente todos os clientes sem confirmar que seus destinos, tempos limite e semânticas são compatíveis.
- Preserve autenticação, telemetria, cabeçalhos, base address e handlers existentes. Investigue a ordem de registro antes de alterá-la.

## Procedimento

### 1. Mapear o cliente que executa a chamada

1. Localize usos de `HttpClient`, `IHttpClientFactory` e `AddHttpClient`.
2. Verifique todos os arquivos de projeto e de dependências por `Flurl.Http`, então pesquise `FlurlClient`, `IFlurlClient`, `FlurlHttp` e factories de Flurl no código.
3. Defina `usaFlurl` como verdadeiro somente quando houver referência ao pacote ou uso efetivo do Flurl. Se `usaFlurl` for falso, não crie factory, registro nem abstração de Flurl: prossiga diretamente com o `HttpClient` padrão.
4. Para cada integração externa, determine se o cliente é nomeado, tipado, criado diretamente, singleton/estático ou, quando `usaFlurl` for verdadeiro, gerenciado pelo Flurl.
5. Verifique pacotes, framework-alvo, handlers/políticas já registrados e testes das integrações afetadas.
6. Identifique operações de escrita (`POST`, `PUT`, `PATCH`, `DELETE`, `CONNECT`) e confirme sua idempotência antes de habilitar retry.

### 2. Escolher o caminho

| Situação | Ação |
| --- | --- |
| Cliente já registrado com `AddHttpClient` | Encadear um único handler de resiliência nesse registro. |
| Cliente tipado | Configurar o cliente tipado via `AddHttpClient<TClient>` e manter a injeção de `HttpClient` no construtor. |
| Cliente nomeado | Configurar o mesmo nome usado em `CreateClient(nome)`. |
| `new HttpClient()` ou cliente estático/singleton | Não adicione DI apenas como atalho. Avalie migrar para `IHttpClientFactory`; se a migração não for possível, siga a orientação de resiliência para clientes estáticos e mantenha o ciclo de vida atual seguro. |
| Projeto sem Flurl (`usaFlurl = falso`) | Não altere a arquitetura para Flurl. Finalize a implementação com o `HttpClient` padrão. |
| Flurl gerencia seu próprio cliente | O handler registrado com `AddHttpClient` não será aplicado. Integre o Flurl a um cliente da DI antes de declarar a tarefa concluída. |
| Flurl já recebe um `HttpClient` ou usa factory customizada | Confirme que a instância vem do cliente nomeado/tipado com o handler e aplique a configuração nele. |
| Necessidade de estratégias, predicados, limites ou recarga fora do padrão | Use um único `AddResilienceHandler` customizado e documente o requisito. |

### 3. Instalar e registrar

1. Adicione o pacote ao projeto que contém o registro da DI:

   ```dotnetcli
   dotnet add package Microsoft.Extensions.Http.Resilience
   ```

2. Para um cliente comum, registre o handler padrão no `IHttpClientBuilder` correto:

   ```csharp
   builder.Services
       .AddHttpClient<ServicoExternoClient>(static client =>
       {
           client.BaseAddress = new Uri("https://api.exemplo.com/");
       })
       .AddStandardResilienceHandler();
   ```

3. Quando operações não idempotentes não tiverem proteção de domínio, desabilite o retry para elas:

   ```csharp
   builder.Services
       .AddHttpClient<ServicoExternoClient>()
       .AddStandardResilienceHandler(static options =>
       {
           options.Retry.DisableForUnsafeHttpMethods();
       });
   ```

4. Para uma necessidade específica, use `AddResilienceHandler("NomeDoPipeline", ...)` uma única vez e configure apenas as estratégias exigidas. Inclua `TimeoutRejectedException` no tratamento quando o pipeline combinar timeout e retry.
5. Se o projeto usar defaults globais com `ConfigureHttpClientDefaults`, remova handlers já aplicados ao cliente que receberá uma estratégia diferente antes de adicionar a nova estratégia.

### 4. Integrar Flurl.Http somente quando `usaFlurl` for verdadeiro

1. Se `usaFlurl` for falso, ignore esta seção e avance para a validação do `HttpClient` padrão.
2. Verifique a versão instalada do Flurl e a configuração atual. Não presuma que chamadas como `url.GetAsync()` usam os clientes registrados por `AddHttpClient`.
3. Se o Flurl cria e gerencia os próprios `HttpClient`s, crie ou adapte a integração para que ele receba um `HttpClient` fornecido por `IHttpClientFactory` ou uma factory de Flurl que o obtenha da DI.
4. Registre o cliente de destino na DI e aplique a resiliência nele:

   ```csharp
   builder.Services
       .AddHttpClient("ServicoExterno", static client =>
       {
           client.BaseAddress = new Uri("https://api.exemplo.com/");
       })
       .AddStandardResilienceHandler();
   ```

5. Faça a factory ou o `IFlurlClient` usado pela aplicação obter exatamente o cliente `"ServicoExterno"`. Siga a API da versão de Flurl já instalada e o padrão de factory existente no repositório; não introduza uma segunda instância independente de `HttpClient`.
6. Confirme por teste ou depuração que a chamada Flurl percorre o handler configurado. Registrar apenas `AddStandardResilienceHandler` na DI não basta quando Flurl continua usando seu cliente interno.

### 5. Validar

1. Compile o projeto alterado e execute os testes focados do cliente/integrador.
2. Em teste controlado, faça uma requisição de leitura receber uma falha transitória seguida de sucesso e confirme o número esperado de tentativas.
3. Teste uma operação de escrita: confirme que ela não é repetida sem idempotência explícita, ou que a chave/garantia de idempotência impede duplicidade.
4. Verifique que timeouts e cancelamento continuam respeitando o `CancellationToken` do chamador.
5. Em integrações Flurl, prove que o handler da DI é acionado; um teste sem rede com handler fake é preferível a depender de um endpoint externo.
6. Revise logs e telemetria para garantir que a configuração não removeu instrumentação existente.

## Critérios de Conclusão

- O pacote está referenciado no projeto que configura o cliente.
- Cada cliente afetado tem no máximo um handler de resiliência.
- O cliente registrado é o mesmo cliente usado em produção; quando `usaFlurl` for verdadeiro, isso inclui a chamada que passa por Flurl.
- O comportamento de retry para operações de escrita foi decidido e testado.
- Build e testes focados passam, sem alterar clientes não relacionados.
- A configuração final, incluindo exceções ao padrão, está documentada no código ou na configuração do projeto conforme a convenção local.

## Referências

- [Criar aplicativos HTTP resilientes: principais padrões de desenvolvimento - .NET](https://learn.microsoft.com/pt-br/dotnet/core/resilience/http-resilience?tabs=dotnet-cli)
- [Diretrizes para HttpClient no .NET](https://learn.microsoft.com/pt-br/dotnet/fundamentals/networking/http/httpclient-guidelines)

## Créditos

- `Microsoft.Extensions.Http.Resilience`, biblioteca da Microsoft baseada em `Microsoft.Extensions.Resilience` e Polly.
- Flurl.Http, cuja integração deve respeitar a versão e a factory configuradas pelo projeto.