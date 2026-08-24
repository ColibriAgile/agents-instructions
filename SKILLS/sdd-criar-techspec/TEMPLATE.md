# Especificação técnica

## Resumo

[Fornecer uma visão técnica breve da abordagem da solução. Resumir as principais decisões de arquitetura e a estratégia de implementação em 1–2 parágrafos.]

## Arquitetura do sistema

### Visão dos componentes

[Descrição breve dos principais componentes, listando cada componente novo ou modificado:

- Nomes dos componentes e funções principais
- Principais relacionamentos entre componentes
- Visão geral do fluxo de dados]

## Design de implementação

### Principais interfaces

[Definir as principais interfaces de serviço (≤20 linhas por exemplo):

```typescript
interface ServiceName {
  methodName(input: InputType): Promise<OutputType>;
}
```

]

### Modelos de dados

Documentar **cada** entidade/contrato no padrão do scaffold abaixo: subseção própria, tabela de campos e JSON de exemplo com valores realistas. Variantes/degradações, envelopes de erro, mapeamentos e parâmetros fixados ganham seus próprios blocos, como demonstrado.

Contratos JSON do backend — prontos para exibição na UI. [Completar contexto específico da feature. Campos ausentes no upstream são normalizados para `null`.]

#### `[NomeDoTipo]` — [descrição curta]

| Campo     | Tipo     | Obrigatório | Descrição   |
| --------- | -------- | ----------- | ----------- |
| `[campo]` | `[tipo]` | sim/não     | [Descrição] |

```json
{
  "[campo]": "[valor realista]"
}
```

[Repetir o padrão acima para cada entidade/contrato principal: payload agregado, tipos de entrada, tipos de erro, etc.]

> **[Variante/degradação (se aplicável)]:** [Explicar quando ocorre e o impacto no payload.]

```json
{
  "[secao_afetada]": null
}
```

#### `[NomeDoErro]` — envelope de erro tipado

| Código     | HTTP       | Significado |
| ---------- | ---------- | ----------- |
| `[codigo]` | `[status]` | [Descrição] |

```json
{
  "error": {
    "code": "[codigo]",
    "message": "[mensagem em inglês ou PT-BR conforme padrão do projeto]"
  }
}
```

#### Mapeamento [Origem externa] → contrato

| Origem ([API/fonte]) | Destino (contrato) |
| -------------------- | ------------------ |
| `[campo_origem]`     | `[campo_destino]`  |

#### Parâmetros fixados no upstream (backend)

| API               | Parâmetros principais              |
| ----------------- | ---------------------------------- |
| **[Nome da API]** | `[param1=valor]`, `[param2=valor]` |

[Se aplicável: esquemas de banco de dados — mesmo padrão (subseção + tabela + exemplo JSON/SQL).]

### Endpoints da API

Documentar **cada** endpoint no padrão do scaffold abaixo, cobrindo todos os cenários relevantes: sucesso, lista vazia, erro de validação, erro upstream, degradação parcial. Comportamentos não óbvios em blockquote (`>`); para payloads já documentados em Modelos de dados, referenciar o exemplo existente em vez de duplicar.

#### Visão geral

| Método           | Rota           | Descrição         |
| ---------------- | -------------- | ----------------- |
| `[GET/POST/...]` | `[ /api/... ]` | [Descrição breve] |

---

#### `[MÉTODO] [ /api/rota ]`

[Descrição breve do propósito do endpoint.]

**Query params** _(ou **Body** para POST/PUT/PATCH)_

| Param     | Tipo     | Default          | Regras                |
| --------- | -------- | ---------------- | --------------------- |
| `[param]` | `[tipo]` | `[default ou —]` | [Validações e regras] |

**Respostas**

| Status  | Corpo            | Quando                          |
| ------- | ---------------- | ------------------------------- |
| `[200]` | `[TipoResposta]` | [Condição de sucesso]           |
| `[400]` | `[TipoErro]`     | [Condição de erro de validação] |
| `[502]` | `[TipoErro]`     | [Condição de falha upstream]    |

**Exemplo — sucesso**

```http
[MÉTODO] [ /api/rota?param=valor ]
```

```json
{
  "[campo]": "[valor realista]"
}
```

**Exemplo — [cenário alternativo, ex.: nenhuma correspondência]**

```http
[MÉTODO] [ /api/rota?param=valor ]
```

```json
{
  "[corpo]": []
}
```

> [Nota sobre comportamento no frontend/cliente, se aplicável.]

**Exemplo — [cenário de erro]**

```http
[MÉTODO] [ /api/rota ]
```

```json
{
  "error": {
    "code": "[codigo]",
    "message": "[mensagem]"
  }
}
```

[Repetir o padrão acima para cada endpoint, separando-os com `---`.]

---

## Pontos de integração

[Incluir apenas se a funcionalidade exigir integrações externas:

- Serviços ou APIs externos
- Requisitos de autenticação
- Abordagem de tratamento de erros]

## Abordagem de testes

### Testes unitários

[Estratégia de testes unitários:

- Principais componentes a testar
- Mocks somente para serviços externos
- Cenários de teste críticos]

### Testes de integração

[Se necessário:

- Componentes a testar em conjunto
- Requisitos de dados de teste]

### Testes E2E

[Se necessário: testar o frontend junto com o backend, usando Playwright]

## Sequenciamento do desenvolvimento

### Ordem de construção

[Sequência de implementação:

1. Primeiro componente/funcionalidade (por que primeiro)
2. Segundo componente/funcionalidade (dependências)
3. Componentes subsequentes
4. Integração e testes]

### Dependências técnicas

[Bloqueadores de dependências:

- Infraestrutura necessária
- Disponibilidade de serviços externos]

## Monitoramento e observabilidade

[Abordagem de monitoramento usando a infraestrutura existente do projeto:

- Métricas ou health checks a expor
- Principais logs e níveis de log]

## Considerações técnicas

### Principais decisões

[Decisões técnicas importantes:

- Escolha da abordagem e justificativa
- Trade-offs considerados
- Alternativas descartadas e por quê]

### Riscos conhecidos

[Riscos técnicos:

- Desafios potenciais
- Abordagens de mitigação
- Áreas que precisam de pesquisa]

### Conformidade com skills

[Listar as skills do projeto (`.claude/skills`) aplicáveis a esta especificação]

### Arquivos relevantes e dependentes

[Listar os arquivos relevantes e dependentes]
