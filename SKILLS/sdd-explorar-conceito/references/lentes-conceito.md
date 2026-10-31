# Lentes sobre o conceito

Seis Goldfish estressam o conceito em paralelo, cada um por uma dimensão. Eles leem só o brief e o código: a hipótese tem de se sustentar sem a conversa que a produziu.

## Instrução enviada

Envie a cada subagente novo, nesta ordem e sem mais nada:

- workspace absoluto, pasta da feature e slug;
- caminho resolvido deste arquivo e o nome da lente;
- caminho do `brief.md` e do arquivo de saída `conceito_[num]/[lente].md`;
- o pedido: "Leia o arquivo de lentes, siga a sua lente, avalie o conceito do brief e grave o resultado no arquivo de saída."

Não envie a conversa, resumos, justificativas nem relatórios de outras lentes.

## Regras do Goldfish

- **Leitura.** Leia este arquivo, o brief e o código, a configuração e a documentação do repositório que a lente pedir, incluindo as instruções locais (`CLAUDE.md`, `AGENTS.md`), que declaram as áreas críticas. Dentro de `tasks/`, leia só o `brief.md` indicado.
- **Escrita.** Grave somente o arquivo de saída. Não edite nada e não rode build ou testes.
- **Postura.** Critique o que o brief propõe, com evidência `caminho:linha` sempre que o código sustentar o ponto. Sem elogios e sem perguntas ao usuário: uma dúvida que o brief não resolve é um achado.

## Lentes

| Lente | Pergunta central | Verifique |
| --- | --- | --- |
| `yagni-reuso` | Isto precisa existir agora, e precisa ser escrito? | Se a necessidade é atual ou especulativa. Busque obrigatoriamente no código algo que já resolva a maior parte do problema (componente, serviço, biblioteca, padrão). |
| `desempenho-recursos` | Isto aguenta o volume e o ambiente reais? | Volume e frequência, memória, consultas e bloqueios no banco, latência no terminal, rede intermitente ou offline, limites de máquinas modestas em campo. |
| `ux-ergonomia` | Quem usa entende e erra pouco? | O fluxo do operador ou do desenvolvedor, convenções do produto, mensagens de erro acionáveis, carga cognitiva, acessibilidade. |
| `migracao-compatibilidade` | O que já existe continua funcionando durante e depois da mudança? | Dados e schema existentes, versões diferentes convivendo em campo, contratos serializados, rollout gradual e rollback no meio da migração. |
| `observabilidade` | Dá para diagnosticar uma falha em produção de madrugada? | Logs com contexto e correlação, sinais e health checks, o que o suporte enxerga, como reproduzir um incidente. |
| `divida-acoplamento` | Isto será um peso em dois anos? | Acoplamento entre módulos, máquinas de estado frágeis, dependências novas, fronteiras que bloqueiam evolução, custo de manutenção. |

Em todas as lentes, tocar uma área crítica declarada nas instruções locais é um risco a nomear.

## Formato do arquivo de saída

```markdown
# Lente [lente] — conceito_[num]

## Achados

### [título curto]
- Severidade: Bloqueante | Maior | Menor
- Desafio: [o risco ou a premissa frágil, com evidência]
- Alternativa ou requisito: [o que o conceito precisa adotar, decidir ou reutilizar]

Fim do relatório.
```

Sem achados, escreva `Nenhum achado.` sob `## Achados`. O arquivo sempre termina com `Fim do relatório.`; sem essa linha, está incompleto e a lente roda de novo.

Severidade:
- `Bloqueante`: o conceito não se sustenta assim.
- `Maior`: risco provável ou retrabalho.
- `Menor`: refinamento.

Ao terminar, devolva uma linha: caminho do arquivo e contagem por severidade.
