# Resolução pelo Elefante

Quem resolve é a sessão que escreveu os artefatos. Ela lembra por que cada decisão foi tomada, e por isso corrige melhor. Ela também quer ter razão, e a vontade de contestar não é evidência de que o Goldfish errou.

## Categorias

Dê a cada achado aberto exatamente uma categoria:

| Categoria | Quando | Efeito |
| --- | --- | --- |
| `CONTESTAR` | O achado está errado, e a prova está num lugar que o Goldfish podia ler: `caminho:linha` do código ou ID registrado nos artefatos (`RF`, `DEC`, `CMP`, `TC`) | Nenhuma edição; o achado fica assentado |
| `ESCALAR` | O achado está errado, mas a prova está fora do alcance do Goldfish (convenção do time, decisão verbal, sistema externo não documentado), ou a correção muda o PRD aprovado no escopo `projeto` | Vai ao humano: confirmar sem mudança, registrar o fato no artefato ou corrigir |
| `CORRIGIR` | O achado procede | Edição exata: local (arquivo, seção ou ID) e texto novo ou remoção |
| `RECUSAR` | Achado `Menor` cuja correção não compensa | Registrado sem edição; o achado fica assentado |

## Regras

- **Contestação verificável.** "Foi intencional" não é evidência. Sem prova que o Goldfish podia ler, use `ESCALAR` ou `CORRIGIR`.
- **Lacuna de compreensão não se contesta.** Se um leitor novo não acompanhou, falta contexto no artefato, mesmo que a sessão autora ache o texto claro.
- **Contexto para leitor humano.** Acrescente contexto quando uma pessoa que lê o artefato precisa dele. Se só um subagente de contexto zero precisaria, use `ESCALAR`.
- **Severidade fixa.** Não rebaixe nem eleve a severidade. Se um `Bloqueante` parece `Menor`, conteste com o motivo.
- **`RECUSAR` só para `Menor`.** `Bloqueante` e `Maior` terminam em `CONTESTAR`, `ESCALAR` ou `CORRIGIR`.
- **IDs preservados.** A correção mantém os IDs existentes (`RF`, `DEC`, `CMP`, `TC`, `T`). Obrigação nova ou removida muda o escopo e vai ao humano como `ESCALAR`.

## Estados do achado

Fonte única destes termos para a skill:

- **Assentado:** decidido sem edição e que não reabre: contestado, recusado, `ESCALAR` confirmado sem mudança ou registrado no artefato, ou aceito como pendência. Um achado novo com o mesmo problema no mesmo escopo de um assentado é marcado assentado, não novo.
- **Corrigido:** teve edição aplicada. Corrigir não assenta: o mesmo problema no mesmo escopo numa rodada seguinte é **reaberto**, porque a correção falhou ou foi desfeita.
- **Aberto:** nem assentado nem corrigido.
- **Rodada limpa:** nenhum achado `Bloqueante` ou `Maior` aberto ou reaberto, decidido antes das correções da rodada, e nenhuma lente `não rodou`. Achados `Menor` não sujam a rodada.

## Decisão item a item

Quando o humano escolhe decidir item a item, percorra os achados que não são `RECUSAR`, um por vez, com escopo, fato, categoria, justificativa e edição proposta. Ofereça:

- para `CORRIGIR`: aceitar a correção, ignorar ou discutir;
- para `CONTESTAR`: manter a contestação, derrubá-la e corrigir, ou discutir;
- para `ESCALAR`: confirmar sem mudança, registrar o fato no artefato, ou discutir; quando a correção muda o PRD aprovado, também aprovar a mudança no PRD, que devolve à redação pela seção Mudança no PRD aprovado do `SKILL.md`.

Registre cada resposta e só edite os artefatos depois da última decisão, numa única passada.
