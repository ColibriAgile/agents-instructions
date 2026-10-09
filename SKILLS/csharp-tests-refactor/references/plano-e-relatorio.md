# Formato do `tests-refactor-plan.md` e do relatório por módulo

O arquivo vive na raiz do repositório e é commitado junto com cada módulo. Ele é a memória da refatoração: outra sessão (ou outro agente) lê o arquivo e continua do primeiro módulo `pendente`.

## Cabeçalho

```markdown
# Plano de refatoração de testes

Solução: `Minha.Solucao.sln`
Gerado em: 2026-10-09
Runner: MTP (xunit.v3)  <!-- ou VSTest -->
Ordem confirmada pelo usuário em: 2026-10-09

| # | Módulo | Pasta de teste | Pasta de produção | Nível | Testes | Status |
|---|--------|----------------|-------------------|-------|--------|--------|
| 1 | Api.Pedidos | tests/Api.Testes/Pedidos | src/Api/Pedidos | Cola | 48 | concluído |
| 2 | Dominio.Clientes | tests/Dominio.Testes/Clientes | src/Dominio/Clientes | Comum | 31 | em andamento |
| 3 | Dominio.Precificacao | tests/Dominio.Testes/Precificacao | src/Dominio/Precificacao | Crítico | 57 | pendente |
```

Status possíveis: `pendente`, `em andamento`, `concluído`, `bloqueado` (com motivo na seção do módulo).

## Seção por módulo

Preencha ao fechar o módulo; a tabela de plano por classe pode ser resumida se o módulo tem muitas classes, mas toda remoção precisa do teste que a justificou.

```markdown
## 1. Api.Pedidos — concluído em 2026-10-09

**Baseline:** 48 testes, verdes. Stryker: não aplicável (Cola).
**Resultado:** 11 testes, verdes. Commit `a1b2c3d`.

### PedidosController → Cola
Unitários com mocks de `IPedidoService`, `ILogger` e `IMapper` apagados; comportamento coberto por `PedidosEndpointTestes` (integração via WebApplicationFactory).

| Comportamento | Mutante | Teste |
|---|---|---|
| POST válido devolve 201 com Location | remover `CreatedAtAction` → `Ok` | `Post_PedidoValido_Retorna201ComLocation` |
| POST inválido devolve 400 com erros | `if (!ModelState.IsValid)` → `if (true)` | `Post_PedidoInvalido_Retorna400` |

### Ações
- **Apagados (34):** `PedidosControllerTestes.*` (32) — unitários de cola; `PedidoDtoTestes.*` (2) — Trivial.
- **Fundidos (3 → 1):** `Post_Quantidade0_Retorna400`, `Post_QuantidadeNegativa_Retorna400`, `Post_Quantidade1_Retorna201` → `Post_Quantidade_RespeitaFronteira` ([Theory] com 0, -1, 1).
- **Reescritos (2):** `Get_Existente_NaoLancaExcecao` → `Get_Existente_RetornaPedido` (asserção de valor).
- **Criados (1):** `Delete_SemPermissao_Retorna403` — mutante "remover `[Authorize]`" não tinha teste.
- **Mantidos (7).**
- **Movidos:** `tests/Api.Testes/Controllers/Pedidos*` → `tests/Api.Testes/Pedidos/`.

### Pendências de produção
- `PedidosController.Post` contém regra de desconto inline (linha 42); deveria estar no domínio para ser testável unitariamente.

### Dúvidas `[?]`
- `Get_ComHeaderXLegacy_RetornaVazio` mantido: não encontrei nada em produção que trate `X-Legacy`. Confirmar se pode apagar.
```

## O que vai na mensagem de commit

```
test(Api.Pedidos): limpa e reorganiza testes (48 → 11)
test(Dominio.Precificacao): limpa e reorganiza testes (57 → 19, Stryker 71% → 84%)
```
