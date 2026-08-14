# Contrato dos documentos de saída

Use este contrato em full durante a redação. Os documentos devem ser escritos em português brasileiro e permanecer prontos para serem copiados para o repositório-alvo.

## Diretório

Grave os arquivos em `./refactor-guidance/[slug]/`:

- `rules.instructions.md`: instruções normativas para implementar o padrão extraído.
- `guardrails.instructions.md`: limites e invariantes que protegem a paridade durante a refatoração.
- `EVIDENCE.md`: proveniência, confiança, mapeamento para o alvo e lacunas.

Os dois arquivos `.instructions.md` devem começar com:

```yaml
---
applyTo: "[glob do alvo]"
---
```

Use o glob mais estreito que cubra todos os arquivos afetados. Quando o escopo for transversal a C#, use `**/*.cs`.

## `rules.instructions.md`

```markdown
---
applyTo: "[glob do alvo]"
---

# Regras extraídas: [nome]

## Contexto

- Aplicação de referência: [repositório, branch ou versão]
- Aplicação-alvo: [repositório, branch ou versão]
- Escopo: [módulos, comportamento ou padrão]
- Objetivo de paridade: [comportamento a preservar]

## Bibliotecas e créditos

| Biblioteca ou pacote | Versão observada | Papel | Uso comprovado no alvo |
| --- | --- | --- | --- |
| [nome] | [versão] | [responsabilidade] | [adoção, adaptação ou lacuna] |

## Regras de implementação

### R1 — [verbo no infinitivo + objeto]

- Regra: [comportamento ou padrão a aplicar]
- Aplicabilidade: [arquivos, camadas e condição]
- Evidência: [E1, E2]
- Confiança: [alta, média ou baixa]
- Verificação: [teste, inspeção ou resultado observável]

## Padrões observados

[Descreva convenções de composição, nomes, DI, configuração, async, logging, erros, dados, serialização e testes somente quando comprovadas.]

## Integrações e configuração

[Registre contratos, registro de serviços, opções, versões, ordem de inicialização e dependências externas.]

## Validação

[Liste os gates que confirmam que as regras foram aplicadas sem alterar a paridade.]
```

Numere todas as regras de forma estável. Mantenha uma regra por comportamento ou decisão; reúna detalhes e exceções sob a mesma regra.

## `guardrails.instructions.md`

```markdown
---
applyTo: "[glob do alvo]"
---

# Guardrails de refatoração: [nome]

## Invariantes de paridade

### G1 — Preservar [invariante]

- Condição protegida: [o que deve continuar verdadeiro]
- Evidência: [E1, E2]
- Verificação: [teste ou observação]

## Mudanças que exigem escalonamento

- [Conflito de biblioteca, versão, contrato, transação, segurança ou comportamento que requer decisão explícita]

## Gates de validação

1. [Gate automatizado ou manual]
2. [Gate de integração, dados, observabilidade ou regressão]

## Limites do escopo

- Incluído: [escopo comprovado]
- Lacunas: [comportamentos não comprovados e decisão necessária]
```

Formule invariantes como resultados positivos: preservar contratos, manter fronteiras transacionais, conservar semântica de erros e repetir a configuração comprovada. Use escalonamento para conflitos que não podem ser resolvidos pela evidência disponível.

## `EVIDENCE.md`

```markdown
# Evidências da extração: [nome]

## Fontes e escopo

- Referência: [repositório, branch, commit ou versão]
- Alvo: [repositório, branch, commit ou versão]
- Investigação: [comportamento ou padrão]
- Data da extração: [data]

## Matriz de evidências

| ID | Afirmação sustentada | Localização na referência | Observação | Confiança | Mapeamento no alvo |
| --- | --- | --- | --- | --- | --- |
| E1 | [afirmação] | [arquivo:linha, símbolo ou pacote] | [fato observado] | [alta, média ou baixa] | [R1, G1, adaptação ou lacuna] |

## Decisões e lacunas

| Item | Impacto | Decisão necessária |
| --- | --- | --- |
| [lacuna ou conflito] | [risco para a paridade] | [pergunta ou ação] |

## Premissas explicitamente aceitas

[Liste somente premissas confirmadas pelo usuário ou inevitáveis para fechar o escopo.]
```

Inclua uma linha para cada afirmação usada por `R` ou `G`. Registre caminhos alternativos, ausência de evidência e divergências do alvo em vez de ocultá-los.
