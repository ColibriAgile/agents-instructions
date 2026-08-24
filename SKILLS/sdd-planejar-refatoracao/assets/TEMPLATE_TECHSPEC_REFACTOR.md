# TechSpec: Refatoração de [Nome do módulo/Form]

- **Referência:** `prd.md` desta mesma pasta
- **Status:** Rascunho / Aprovado

## Decisões técnicas

Decisões de como a refatoração será feita (não o quê — isso está no PRD):

- Ex: Extrair lógica de negócio do code-behind para `XxxPresenter`, com interface `IXxxView` mockável via NSubstitute
- Ex: Usar Golden Master (dump JSON) para comparar output do grid antes/depois
- Ex: Escrever testes de caracterização para [área] antes de tocar no código, por cobertura atual ser fraca/inexistente

## Componentes afetados

| Componente | Tipo | Observação |
|---|---|---|
| Ex: `PedidoForm.cs` | Code-behind WinForms | Contém lógica de validação misturada com eventos de UI |
| Ex: `gridPedidos` (DevExpress) | Controle com binding automático | Risco de regressão silenciosa — binding implícito ao datasource |
| Ex: `PedidoValidator` (novo) | Classe extraída | Vai receber a lógica de validação, testável via xUnit |

> Sinalizar aqui explicitamente qualquer controle DevExpress com comportamento implícito (auto binding, eventos disparados em cascata) — é onde regressão silenciosa mais aparece.

## Estratégia de rede de segurança

**Lógica extraível (testável via xUnit):** o que sai do code-behind para classes plain C#.

**Lógica não extraível (ligada a framework):** o que fica no code-behind/controles e só é verificável manualmente ou via golden master.

## Test cases

> Esta seção alimenta diretamente a skill `sdd-planejar-tasks` — cada linha deve virar um teste concreto (automatizado ou manual) mapeado a um requisito do PRD.

| ID | Requisito (PRD) | Tipo | Descrição do teste | Automatizável? |
|---|---|---|---|---|
| T1 | R1 | Unitário (xUnit) | Ex: `PedidoValidatorTests.CampoVazio_RetornaErro` | Sim |
| T2 | R1 | Caracterização | Ex: capturar output atual do cálculo de total antes do refactor | Sim (golden master) |
| T3 | R2 | Manual | Ex: passo a passo de clique no Form, resultado esperado | Não — roteiro manual |
| T4 | | | | |

## Plano de execução (ordem por risco/dependência)

> Compatível com o critério de ordenação da `sdd-planejar-tasks` ("dependências antes das dependentes") — aqui a dependência é por risco: extrair lógica testável primeiro, mexer em UI/controles por último.

1. **[Baixo risco]** Escrever testes de caracterização faltantes (T2, ...)
2. **[Baixo risco]** Extrair lógica de negócio para classes testáveis (componentes novos da tabela acima)
3. **[Médio risco]** Ajustar code-behind para delegar ao código extraído
4. **[Alto risco]** Mexer em layout/controles/binding, se necessário
5. Executar roteiro de verificação manual (T3, ...)
6. Comparar golden master (T2, ...)

## Checkpoints e rollback

- Branch/commit de checkpoint antes de cada etapa de risco médio/alto:
- Critério para reverter uma etapa (o que conta como "quebrou"):
