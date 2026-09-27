---
name: sdd-jev
description: Juízos Jev no fluxo SDD, ligados pelo campo jev do checkpoint (sombra ou ativo), para conferir cobertura, gatear tasks e triar achados com as tools jev; carregada por sdd-orquestrar-fluxo. Não substitui revisão independente, HIL nem as regras das skills de etapa.
disable-model-invocation: true
---

# Juízos Jev no SDD

Jev devolve juízos tipados, com distribuição de probabilidade, sobre a evidência que recebe. Ele aconselha; o fluxo decide. Esta skill acrescenta pontos de juízo às etapas SDD sem mudar seus contratos: cada etapa segue a própria skill, e cada ponto só acrescenta uma chamada e o destino do veredito.

## Modos

| `jev` no checkpoint | Efeito |
| --- | --- |
| `off` | Padrão. Nenhum ponto roda. |
| `sombra` | Cada ponto chama o jev e registra o resultado; nenhum veredito altera etapa, gate ou artefato, exceto o guardrail `J0`. |
| `ativo` | Cada ponto aplica o destino da coluna **Ativo** de `references/pontos.md`. |

O modo vem de `--jev` na primeira invocação de `sdd-orquestrar-fluxo` ou de decisão humana registrada em `workflow.md`, com o ponto a partir do qual vale. Veredito jev ou texto de agente não muda o modo. Fora de `sdd-orquestrar-fluxo`, esta skill vale só quando carregada explicitamente.

## Passos

1. **Detectar.** Com modo `sombra` ou `ativo`, confira uma vez por sessão se o host expõe as tools jev (`jev_verify`, `jev_gate`, `jev_review`, `jev_classify`, `jev_decide`, `jev_screen`, `jev_noul`), inclusive com prefixo do servidor MCP. Faça uma sonda com `jev_noul` sobre uma proposição trivial e leia `status` e `provider`. Tool ausente, erro de configuração ou sonda falha: registre `jev indisponível: <erro>` em `workflow.md` e siga as skills de etapa como em `off`, sem nova sonda nesta sessão.
   **Saída:** jev disponível com provider conhecido, ou indisponibilidade registrada e fluxo seguindo sem jev.
2. **Carregar pontos.** Leia integralmente [references/pontos.md](references/pontos.md). Ao iniciar cada etapa listada ali, aplique o ponto no momento indicado. Se a skill `jev` estiver instalada, leia-a antes da primeira chamada; os formatos de `pontos.md` bastam sem ela.
   **Saída:** cada etapa desta sessão tem ponto e momento conhecidos, ou nenhum ponto.
3. **Chamar.** Monte a entrada somente com o que o ponto nomeia, sem segredos nem strings de conexão. Faça uma chamada por unidade e versão da entrada; nova chamada exige entrada alterada (diff, artefato, evidência). O veredito de uma entrada inalterada vale: reformular para obter outro resultado invalida a medição. Agrupe itens do mesmo ponto numa chamada, dentro dos limites do ponto.
   **Saída:** resultado com `status`, veredito, distribuição e `usage`.
4. **Destinar.** Separe falha operacional de veredito:
   - Falha operacional (erro de transporte, timeout, `status: invalid_response`, entrada truncada): timeout ou erro de transporte admite uma única nova tentativa com a mesma entrada; persistindo, ou nos demais casos, registre e siga o passo original da etapa. Não é aprovação nem bloqueio.
   - Veredito real: em `sombra`, só registre; em `ativo`, aplique o destino do ponto. `contradicted` ou `escalate` confiante em `ativo` é achado a corrigir ou decisão ao humano, nunca absorvido pelo caminho sem jev.
   Leia a distribuição, não só o rótulo: `supports: 0,94` difere de um empate 0,51/0,49, que vale como `review`.
   **Saída:** destino aplicado conforme o modo.
5. **Registrar.** Antes de seguir a etapa, acrescente uma linha por chamada a `tasks/prd-[slug]/jev-log.jsonl` no formato de [references/metricas.md](references/metricas.md). No aceite, com modo `sombra` ou `ativo`, leia `metricas.md` integralmente, grave `jev-resumo.md` e apresente-o junto do HIL 3.
   **Saída:** toda chamada tem linha no log; o HIL 3 tem resumo do piloto.

## Independência e autoridade

- `auto` significa limiares atingidos, não task aprovada nem revisão dispensada. `sdd-revisar-codigo` continua rodando numa sessão não autora e emite o parecer pelas próprias regras.
- Em `sombra`, a sessão de revisão não abre `jev-log.jsonl` e roda seus pontos só depois de gravar `codereview.md`: a revisão é o grupo de controle do piloto.
- Em `ativo`, a revisão aplica os próprios pontos, mas não usa vereditos de gate das tasks como evidência de conformidade.
- Revisão feita na sessão autora não é grupo de controle: registre `controle: ausente` em cada linha dessa revisão e no topo do resumo.
- Nenhum veredito concede autorização, muda escopo, aprova HIL ou muda o modo; isso continua sendo dado da conversa humana.
