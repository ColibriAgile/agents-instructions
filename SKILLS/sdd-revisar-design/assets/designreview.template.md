# Revisão de design — [slug] — designreview_[num]

- Escopo: `produto` | `projeto`
- Alvo: [caminhos dos artefatos]
- Rodada: [n] de [teto do escopo]; rodada anterior do ciclo: `designreview_[num]` | —
- Base: `HEAD` [hash curto]; `git status --porcelain`: [saída ou vazio]
- Artefatos alvo: `[caminho]` sha256 [hash]
- Rodada limpa: sim | não; rodadas limpas seguidas: [k]
- Resolução aplicada: não | sim
- Estado: EM ANDAMENTO | CONVERGIDO | ACEITO COM PENDÊNCIAS | DEVOLVIDO À REDAÇÃO | BLOQUEADO

## Lentes

| Lente | Estado | Arquivo | Bloqueante | Maior | Menor |
| --- | --- | --- | ---: | ---: | ---: |
| `compreensao` | concluída / não rodou | `compreensao.md` | 0 | 0 | 0 |

## Paráfrase da compreensão

[Copiada sem resumir de `compreensao.md`: "O que propõe" e "Como o sistema atual funciona, segundo os artefatos".]

Comparação com a intenção: [confere | diverge em: ... → achado DR[num]-NN]

## Achados

| ID | Lente | Severidade | Escopo | Fato | Situação | Categoria | Justificativa | Edição proposta | Decisão |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DR[num]-01 | `[lente]` | Bloqueante / Maior / Menor | `[arquivo]#[seção ou ID]` | [fato] | novo / reaberto de `DR..` | CONTESTAR / ESCALAR / CORRIGIR / RECUSAR | [evidência ou motivo] | [local e texto] ou — | [aplicada / ignorada / confirmada sem mudança / registrada no artefato / pendente] por [humano / AUTO-NN] |

## Achados assentados

[IDs assentados nesta rodada e herdados das anteriores, com a rodada de origem.]

## Pendências aceitas

[No estado `ACEITO COM PENDÊNCIAS`: achados abertos e correções aplicadas sem re-auditoria, por severidade, com quem aceitou. Remova a seção nos demais estados.]

## Limitações

[Lente que não rodou, rodada contaminada, artefato ausente ou outra limitação. `Nenhuma` quando não houver.]
