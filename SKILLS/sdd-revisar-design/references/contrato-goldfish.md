# Contrato do Goldfish

O Goldfish testa o artefato, não a conversa. Tudo o que ele sabe vem dos arquivos que a instrução lista e do código que esses arquivos citam. Por isso a instrução leva só caminhos, e o próprio Goldfish ignora o restante da pasta da feature.

## Lentes

| Lente | Persona | Escopos |
| --- | --- | --- |
| `compreensao` | [goldfish-compreensao.md](goldfish-compreensao.md) | `produto`, `projeto` |
| `zoom-out` | [goldfish-zoom-out.md](goldfish-zoom-out.md) | `produto`, `projeto` |
| `critico` | [goldfish-critico.md](goldfish-critico.md) | `projeto` |
| `prontidao` | [goldfish-prontidao.md](goldfish-prontidao.md) | `projeto` |
| `codigo` | [goldfish-codigo.md](goldfish-codigo.md) | `projeto` |

## Instrução enviada

Envie, nesta ordem e sem mais nada:

- workspace absoluto, pasta da feature e slug;
- caminho resolvido deste contrato e da persona da lente;
- caminhos dos artefatos alvo do escopo e o arquivo de saída `designreview_[num]/[lente].md`;
- o nível da feature: `nivel` do checkpoint, ou `sdd-completo` sem checkpoint;
- para a lente `critico`, o caminho resolvido de `assets/techspec.template.md` da skill `sdd-criar-techspec`;
- o pedido: "Leia o contrato e a persona, audite os artefatos alvo e grave o resultado no arquivo de saída."

Não envie conversa, resumo do pedido, `brief.md`, snapshot, decisões, relatórios anteriores, justificativas do autor nem avaliação de prontidão. Um Goldfish que recebe o enquadramento do autor deixa de testar o artefato.

## Regras do Goldfish

- **Leitura.** Leia o contrato, a persona, os artefatos alvo e os arquivos que eles citam ou linkam. No código, busque e leia o que a persona pedir. Dentro de `tasks/`, leia somente os artefatos alvo e o PRD que eles citam: `snapshot-contexto.md`, `workflow.md`, `checkpoint.json`, log de decisões, `designreview_*`, `codereview_*` e pastas de outras features ficam fora.
- **Escrita.** Grave somente o arquivo de saída indicado. Não edite artefatos, código nem estado e não rode build ou testes.
- **Postura.** Leia como alguém competente em software que acabou de chegar ao projeto. Termo de engenharia geral não é lacuna; termo deste projeto, time ou design sem definição nem link é. Critique o que está escrito, com evidência; sem elogio nem conversa.
- **Sem perguntas.** Não pergunte ao usuário. Dúvida que o artefato não resolve é achado.

## Formato do arquivo de saída

```markdown
# Goldfish [lente] — designreview_[num]

Alvo: [caminhos lidos]

[Bloco extra que a persona exigir, como a paráfrase da compreensão]

## Achados

### [título curto]
- Severidade: Bloqueante | Maior | Menor
- Escopo: `[arquivo]#[seção ou ID]` ou linhas
- Fato: [o que está escrito, ou o que falta]
- Impacto: [o que um leitor ou implementador faria de errado por causa disso]
- Recomendação: [o que o artefato precisa dizer]

Fim do relatório.
```

Sem achados, escreva `Nenhum achado.` sob `## Achados`. Termine sempre com a linha `Fim do relatório.`: arquivo sem ela está incompleto e a lente roda de novo. Severidade: `Bloqueante` impede entender, aprovar ou implementar corretamente; `Maior` leva a retrabalho ou risco provável; `Menor` é clareza ou forma, sem efeito no resultado.

Devolva ao chamador uma linha: caminho do arquivo e contagem por severidade.
