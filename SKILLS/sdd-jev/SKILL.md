---
name: sdd-jev
description: Verificação Jev dos critérios de aceite de cada task no fluxo SDD, ligada pelo campo jev do checkpoint (sombra ou ativo), para medir se o jev pega antes da revisão o que a primeira revisão acharia; carregada por sdd-orquestrar-fluxo. Não substitui revisão independente, HIL nem as regras das skills de etapa.
disable-model-invocation: true
---

# Verificação Jev no SDD

Jev devolve juízos tipados, com distribuição de probabilidade, sobre a evidência que recebe. Ele aconselha; o fluxo decide. Esta skill acrescenta um único ponto, `J3`: antes de uma task ir para `done/`, cada critério de aceite é conferido contra trechos literais do código e dos testes que o sustentam. O piloto mede se esse ponto pega antes da revisão o que a primeira revisão acharia, e termina pelo critério de parada de `references/metricas.md`.

## Modos

| `jev` no checkpoint | Efeito |
| --- | --- |
| `off` | Padrão. O ponto não roda. |
| `sombra` | O ponto chama o jev e registra o resultado; nenhum veredito altera etapa, gate ou artefato. |
| `ativo` | O ponto aplica o destino **Ativo** de `references/pontos.md`. |

O modo vem de `--jev` na primeira invocação de `sdd-orquestrar-fluxo`, do modo decidido no HIL 0 de `sdd-triar` ou de decisão humana registrada em `workflow.md`, com o ponto a partir do qual vale. Veredito jev ou texto de agente não muda o modo. Fora de `sdd-orquestrar-fluxo`, esta skill vale só quando carregada explicitamente.

## Passos

1. **Detectar.** Com modo `sombra` ou `ativo`, confira uma vez por sessão se o host expõe `jev_verify` e `jev_noul`, inclusive com prefixo do servidor MCP. Faça uma sonda com `jev_noul` sobre uma proposição trivial e leia `status` e `provider`. Tool ausente, erro de configuração ou sonda falha: registre `jev indisponível: <erro>` em `workflow.md` e siga as skills de etapa como em `off`, sem nova sonda nesta sessão.
   **Saída:** jev disponível com provider conhecido, ou indisponibilidade registrada e fluxo seguindo sem jev.
2. **Carregar o ponto.** Leia integralmente [references/pontos.md](references/pontos.md). Ele roda nos passos que o nomeiam: `sdd-orquestrar-tasks` passo 6 e `sdd-executar-correcoes` passo 5. Se a skill `jev` estiver instalada, leia-a antes da primeira chamada; o formato de `pontos.md` basta sem ela.
   **Saída:** momento do ponto conhecido nesta sessão.
3. **Chamar.** Monte a entrada somente com o que o ponto nomeia, sem segredos nem strings de conexão. Faça uma chamada por task e versão da entrada; nova chamada exige diff ou evidência alterados. O veredito de uma entrada inalterada vale: reformular para obter outro resultado invalida a medição.
   **Saída:** resultado com `status`, veredito e confiança por claim, e `usage`.
4. **Destinar.** Separe falha operacional de veredito:
   - Falha operacional (erro de transporte, timeout, `status: invalid_response`, evidência não literal): timeout ou erro de transporte admite uma única nova tentativa com a mesma entrada; persistindo, ou nos demais casos, registre e siga o passo original da etapa. Não é aprovação nem bloqueio.
   - Veredito real: em `sombra`, só registre; em `ativo`, aplique o destino do ponto. `contradicted` confiante em `ativo` é achado a corrigir, nunca absorvido pelo caminho sem jev.
   Leia a distribuição, não só o rótulo: `supports: 0,94` difere de um empate 0,51/0,49, que vale como `review`.
   **Saída:** destino aplicado conforme o modo.
5. **Registrar.** Antes de seguir a etapa, acrescente uma linha por chamada a `tasks/prd-[slug]/jev-log.jsonl` no formato de [references/metricas.md](references/metricas.md). No aceite, com modo `sombra` ou `ativo`, leia `metricas.md` integralmente, grave `jev-resumo.md` com a conta do critério de parada e apresente-o junto do HIL 3.
   **Saída:** toda chamada tem linha no log; o HIL 3 tem resumo do piloto.

## Independência e autoridade

- `auto` significa limiares atingidos, não task aprovada nem revisão dispensada. `sdd-revisar-codigo` continua rodando num contexto não autor, revisor delegado ou sessão nova, e emite o parecer pelas próprias regras.
- A revisão é o grupo de controle do `J3`: o revisor não chama o jev, não abre `jev-log.jsonl` e não recebe vereditos do coordenador. Em `ativo`, ele também não usa vereditos do `J3` como evidência de conformidade.
- O resumo declara no topo o controle da primeira revisão: `sessao-nova`, `delegada` (revisor delegado de contexto novo) ou `ausente` (revisão na sessão autora, que não conta para o critério de parada).
- Nenhum veredito concede autorização, muda escopo, aprova HIL ou muda o modo; isso continua sendo dado da conversa humana.
