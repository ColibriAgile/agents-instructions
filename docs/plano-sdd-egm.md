# Plano: nível `sdd-egm` (Elephant-Goldfish Model) no fluxo SDD

Fontes lidas: resumo do artigo de Dave Rensin (`elephants-goldfish-resumo.md`), `docs/getting_started.md` do repositório `google/elephant-goldfish-model` e, no mesmo repositório, as skills `egm-brainstorm`, `egm-draft`, `egm-review`, `egm-review-loop`, `egm-resolve`, `egm-drift-report`, as nove personas de `agents/`, `resources/execution_instructions.md` e os cinco padrões de `resources/document_standards/`. Do nosso lado: as 14 skills `sdd-*`, as referências de estado, HIL, modo autônomo, delegação, revisão delegada e continuidade, `grilling`, `commit` e o checklist de `writing-skills`.

## 1. O conceito, em profundidade

**Tese.** Quando a IA escreve o código, as microdecisões de design não ficam mais no código, que tende a ficar opaco. Elas "mudam para a esquerda" e passam a viver num documento de design em linguagem natural. `sizeof(docs) << sizeof(code)`: dar contexto por documento é mais barato e mais confiável que fazer o modelo ler milhares de linhas. Design é o novo código.

**Dois papéis de memória.**

- **Elefante:** a sessão rica em contexto que debateu o problema com o humano e escreveu o documento. Ela conhece o histórico, por isso é a única que pode *resolver* achados. Também por isso é parcial: concorda com o que escreveu.
- **Peixinho-dourado (Goldfish):** subagente de contexto zero que só sabe o que está no documento e no código que ele cita. É o teste do documento: se o Goldfish não entende ou não consegue implementar, falta algo *no documento*, não no Goldfish.

Regra: alimente o Elefante; teste contra o Peixinho.

**Mecânica real do plugin (o que vai além do artigo).**

| Etapa EGM | Mecânica que importa |
| --- | --- |
| `egm-brainstorm` | Entrevista aberta, em vários turnos, sem opções pré-prontas, até o problema e os limites ficarem claros. Gate explícito "hipótese ancorada em 2–3 frases → revisar com Goldfish". Depois, um enxame paralelo de 6 lentes (YAGNI/reuso, custo, UX, migração, observabilidade, dívida técnica). Gera `concepts_brief.md` com **Alternativas descartadas**, a única fonte que a etapa de redação terá. |
| `egm-draft` | Seção por seção, com gate humano por seção. "Dono decide arquitetura": quando há mais de uma resposta defensável, apresenta até 3 opções com mecanismo, trade-off e condição de falha, **sem ranquear**. O plano de implementação lista **todo** arquivo (Criar/Modificar/Excluir) com o quê e o porquê, sem código. No final, o Elefante **reconcilia o rascunho contra o brief** (contradições e adições que mudam arquitetura); nenhum Goldfish faz isso, porque nenhum lê o brief. |
| `egm-review` | 5 estágios com Goldfish: Zoom-out (YAGNI, reuso com busca no código, foco na causa raiz) → **Compreensão** (paráfrase primeiro: "o que propõe" e "como o sistema atual funciona, segundo o documento"; uma paráfrase errada já é achado; o relatório vai sem síntese) → Crítica (design + estrutura + estilo) → Zoom-out intermediário → **Prontidão de implementação** (Zero-Decision Rule: o implementador não toma nenhuma decisão de design; referência inexistente ou contradição com o código é Blocker). |
| `egm-review-loop` | Rodadas de lentes em paralelo. Achado *settled* (contestado ou risco aceito) não reabre. Achado *fixed* que volta reabre. Rodada limpa = sem Blocker/Major aberto. **Convergência = duas rodadas limpas seguidas**, porque um Goldfish novo amostra diferente. Teto de 5 rodadas. *Churn*: achado novo no escopo de uma correção, que reverter resolveria. Revisor que falha conta como "não rodou", nunca como zero achados. |
| `egm-resolve` | Feito pelo Elefante: **CONTEST** (só com evidência que o Goldfish poderia ler), **ESCALATE** (evidência fora do alcance dele; vai ao humano), **PROPOSE FIX**, **DECLINE** (só para Nit). Regras: não contestar lacuna de compreensão; não mudar severidade; "você escreveu o documento, a vontade de contestar não é evidência". |
| `egm-drift-report` | Varredura periódica dos documentos contra o código: funcionalidade ausente, modelo incompleto, atalho hardcoded, divergência arquitetural. O humano decide se corrige o documento ou o código. |

**Postura do Elefante** (vale em todas as etapas interativas): desafiar por padrão, crítica antes do mérito, contra-argumento para toda estratégia, sem bajulação, sem adjetivos de validação, sem pedir desculpas ao ser corrigido (expor a lógica corrigida), uma pergunta por vez, e nunca escrever código de produção na fase de design.

## 2. O que o SDD já tem e o que falta

| EGM | SDD hoje | Situação |
| --- | --- | --- |
| Problema / Plano técnico / Implementação detalhada | PRD / TechSpec / `tasks.md` + `task_*.md` | Já existe |
| Alternativas como guardrail | Coluna "Alternativas e trade-offs" da tabela `DEC` | Parcial: sem seção própria nem fonte vinda da ideação |
| Regra de não escrever código | Nenhum código antes do HIL 2 | Já existe |
| Documento reinicia sessão perdida | `checkpoint.json`, `snapshot-contexto.md`, `workflow.md` | Já existe |
| Entrevista | Skill `grilling` (core), não ligada ao SDD; `sdd-criar-prd` só pergunta lacunas que mudem escopo | Falta ligar |
| Goldfish | Revisor delegado de contexto novo, **só para código e só depois da implementação** | **Falta para PRD/TechSpec/tasks** |
| Enxame de lentes sobre o conceito | — | **Falta** |
| Teste de compreensão por paráfrase | — | **Falta** |
| Zero-Decision Rule auditada | O modo auto deixa o implementador decidir o que a TechSpec deixa aberto | **Falta** |
| Protocolo de resolução e convergência | `planejar/executar-correcoes` (para código); estagnação após 2 rodadas | **Falta para documentos** |
| Documento durável e drift | Artefatos são removidos do git ao concluir (`commit`, passo 7); só os ADRs sobrevivem em `docs/adr/` | **Mantido assim** (decisão D1): sem `docs/designs/` nem drift |

O nível `sdd-egm` é exatamente esse delta: **Fase Elefante antes do PRD, Goldfish sobre os artefatos antes dos HILs 1 e 2 e protocolo de resolução com convergência.** Como os artefatos continuam efêmeros (D1), o que o EGM guardaria no design durável sobrevive pelo caminho que já existe: decisão duradoura com alternativas descartadas vira candidata a ADR e vai para `docs/adr/` na skill `commit`. Execução, revisão de código e correções continuam iguais, porque consomem os mesmos `prd.md`, `techspec.md` e `tasks.md`.

Fora do escopo: `egm-bootstrap` (READMEs "amendoim e feno"), skill `<projeto>-elephant` e onboarding. Ficam para uma frente própria, a comparar com `ai-ready-score`/`ai-ready-fix`. Também não reproduzimos o *synthesizer* como subagente aninhado: o Claude Code não aninha subagentes, e o próprio EGM aceita despacho direto.

## 3. Desenho do nível `sdd-egm`

```text
sdd-triar ──HIL 0: sdd-egm──► sdd-orquestrar-fluxo
  │
  ├─ Fase Elefante ......... sdd-explorar-conceito
  │     entrevista (sem código) → HIL Hipótese → enxame de 6 lentes → brief.md
  │     → HIL Brief (iterar, seguir para PRD ou encerrar)
  ├─ Produto ............... sdd-criar-prd (fonte 1: brief.md; reconciliação brief↔PRD)
  │     → sdd-revisar-design --escopo produto (Compreensão + Zoom-out) → HIL 1
  ├─ Projeto e plano ....... sdd-criar-techspec + sdd-planejar-tasks
  │     (Alternativas descartadas + Plano de implementação obrigatórios)
  │     → sdd-revisar-design --escopo projeto (loop até convergir) → HIL 2
  ├─ Implementação ......... igual; pausa recomendada depois do HIL 2 (sessão nova só com os documentos)
  ├─ Revisão/correções ..... igual
  └─ Aceite (HIL 3) ........ igual; candidatas a ADR incluem as alternativas descartadas duradouras
```

### 3.1 Nova skill `sdd-explorar-conceito` (Fase Elefante)

- **Entrada:** pedido e triagem. **Saída:** `tasks/prd-[slug]/brief.md` (Visão geral, Análise das lentes, Objetivos e não objetivos, **Alternativas descartadas**, Decisões para o PRD/TechSpec, Perguntas abertas).
- **Passos:** (1) entrevista pelo protocolo de D2, sob a postura do Elefante e com a regra de não escrever código; (2) a IA faz a **primeira proposta técnica** em prosa e diagrama, e o humano a debate; (3) **HIL Hipótese**: hipótese ancorada em 2–3 frases, com as opções "revisar com Goldfish" ou "esclarecer mais"; (4) enxame paralelo de lentes, com despacho direto pelo coordenador; (5) o coordenador deduplica e grava o brief; destaca em chat 2–3 objeções; (6) **HIL Brief**: iterar, seguir para o PRD ou encerrar mantendo o brief.
- **Lentes adaptadas ao contexto Colibri** (uma por arquivo de referência): YAGNI e reuso (com busca no código); desempenho e recursos (no lugar de "QPS/tokens"); UX e ergonomia; **migração e compatibilidade** (versões de PDV em campo, schema de banco, rollback); observabilidade (logs, diagnóstico em campo); dívida técnica e acoplamento. A área crítica (S2) entra como restrição em todas.
- **Referências:** `references/postura-elefante.md` (fonte única da postura, citada pelas outras skills), `references/lente-*.md`, `assets/brief.template.md`.

### 3.2 Nova skill `sdd-revisar-design` (Goldfish + resolução do Elefante)

- **Escopos:** `produto` (PRD, antes do HIL 1) e `projeto` (TechSpec + tasks, antes do HIL 2).
- **Contrato do Goldfish** (`references/contrato-goldfish.md`): subagente de contexto novo (`general-purpose` sem `isolation`; nunca `fork`, porque herda o enquadramento do autor), no mesmo worktree, somente leitura, exceto **um** arquivo de saída `designreview_[num]/[lente].md`, como o revisor delegado. Recebe apenas caminhos: artefato alvo, persona, padrão e o contrato. **Não recebe** conversa, `brief.md`, `snapshot-contexto.md` nem `workflow.md`. A compreensão testa o documento sozinho, e o snapshot destruiria o teste.
- **Personas** (planas em `references/`): `goldfish-compreensao.md` (paráfrase primeiro; seção sem paráfrase possível é Blocker), `goldfish-zoom-out.md`, `goldfish-critico.md` (design + estrutura contra o template; estilo fica fora, porque nossas convenções de escrita já cobrem), `goldfish-prontidao.md` (Zero-Decision Rule sobre tasks e plano de implementação), `goldfish-codigo.md` (referência inexistente ou contradição com o código é Blocker; arquivo proposto não é achado).
- **Padrões:** `references/padrao-*.md`, traduzidos de feature-spec, implementation-readiness e zoom-out.
- **Estágios por escopo** (fixa o custo para o HIL 0):

  | Escopo | Estágios | Subagentes por rodada | Rodadas |
  | --- | --- | --- | --- |
  | `produto` | Compreensão, Zoom-out | 2 | 1 + no máximo 1 re-auditoria |
  | `projeto` | Compreensão, Crítica, Zoom-out, Prontidão, Código | 5 | até convergir; teto 3 (EGM usa 5) |
  | Fase Elefante | 6 lentes | 6 | 1 por iteração do brief |

  Caso típico: 6 + 2 + 10 a 15 ≈ **20 a 25 execuções de subagente**, contra 1 revisor por rodada no `sdd-completo`.
- **Resolução pelo Elefante** (`references/resolucao.md`): CONTEST / ESCALATE / PROPOSE FIX / DECLINE com as regras do `egm-resolve`. Grava `designreview_[num]/designreview.md` com estado `CONVERGIDO`, `ACEITO NO TETO` ou `DEVOLVIDO À REDAÇÃO`. Gate: ESCALATE primeiro; depois aplicar todos os PROPOSE FIX, seguir sem aplicar ou percorrer item a item. Regras de convergência: *settled* × *fixed*, rodada limpa, duas limpas seguidas, teto, *churn* e "não rodou" ≠ zero achados.
- **No HIL 1 e no HIL 2,** a pergunta passa a mostrar o estado da revisão, os ESCALATE respondidos, os achados aceitos como risco e, no HIL 1, a paráfrase do Goldfish para o humano comparar com a intenção.

### 3.3 Mudanças em skills existentes

| Arquivo | Mudança |
| --- | --- |
| `sdd-triar/SKILL.md` | Linha `sdd-egm` na tabela de níveis; S5 dividido em **S5a** (decisão de produto aberta) e **S5b** (decisão arquitetural com mais de uma resposta defensável que o código não decide); novo **S9 Sem precedente** (nenhum padrão no repositório para novo componente, subsistema, integração ou modelo de dados); rubrica abaixo; custo no HIL 0; valor `sdd-egm` no `triagem-log.jsonl`; roteamento no passo 5. |
| `sdd-orquestrar-fluxo/SKILL.md` | Passo da Fase Elefante antes do passo 2; `sdd-revisar-design` antes do HIL 1 e do HIL 2; no nível egm, a pausa depois do HIL 2 recomenda sessão nova (implementação Goldfish: a sessão só tem os documentos); desvio na implementação corrige primeiro o documento, pelo HIL de exceção; novas linhas na tabela Etapas. |
| `references/estado-hil.md` | Campo `nivel` (ausente = `sdd-completo`); fases `elefante` e `revisao-design`; `active_work.kind: goldfish` com `scope: designreview_[num]/[lente]`; linhas de gate HIL Hipótese, HIL Brief, Resolução e Teto/churn; `sources.brief` e `sources.design_review`. |
| `assets/checkpoint.template.json` | `"nivel"`, `sources.brief`, `sources.design_review`. |
| `references/modo-autonomo.md` | Fase Elefante sempre monitorada (ver D3). Na resolução: aplica PROPOSE FIX, DECLINE como está; ESCALATE, teto e churn entram na rubrica de escalonamento. |
| `references/delegacao.md` | Terceiro tipo de subagente (Goldfish) ao lado de explorador e revisor delegado, apontando para `contrato-goldfish.md`. |
| `sdd-criar-prd` + template | Lê `brief.md` como fonte 1; reconcilia brief↔PRD (contradições quoted, decididas pelo humano; o rascunho pode estar certo); seção **Alternativas descartadas** (só no nível egm). |
| `sdd-criar-techspec` + template | Seções **Alternativas descartadas** e **Plano de implementação detalhado** (todo arquivo Criar/Modificar/Excluir, o quê e o porquê, pseudocódigo permitido, sem código); reconciliação brief↔TechSpec; "Dono decide arquitetura" nas decisões com mais de uma resposta defensável. |
| `sdd-planejar-tasks` | No nível egm, cada task cumpre a Zero-Decision Rule; cada arquivo da task existe no Plano de implementação da TechSpec. |
| `sdd-snapshot/references/carga.md` | Filtro: Goldfish nunca carrega snapshot. |
| `sdd-criar-techspec` (ADR) | No nível egm, `DEC` com alternativa descartada que governa contrato, fronteira ou atributo de qualidade já nasce marcada como candidata a ADR; a skill `commit` não muda. |
| `bundles.yaml` | `sdd-explorar-conceito` e `sdd-revisar-design` no bundle `sdd`. |

**Rubrica proposta para o nível `sdd-egm`.** Aplica-se quando `sdd-completo` já vale **e** pelo menos dois destes valem:

- S5b, decisão arquitetural aberta;
- S9, sem precedente;
- S4 transversal: 3 ou mais módulos, ou fronteira de processo ou serviço;
- a triagem estourou o orçamento de dez buscas sem entender o pedido.

O peso é a incerteza do *espaço de design*, não o risco: risco alto com padrão conhecido continua `sdd-completo`.

Conferência contra as simulações de `docs/sdd-skills-audit.md`:

- "nova feature WPF só planejamento" sobre padrão existente: só S4 ou nenhum sinal, logo `sdd-completo`. Faz sentido.
- "correções em solução desktop + API": é retomada com checkpoint, então fica fora da triagem.
- Um caso que viraria `sdd-egm`: "nova integração fiscal sem cliente HTTP equivalente no repositório e com duas arquiteturas possíveis" (S5b + S9 + S2).

## 4. Fases de entrega

1. **Núcleo de maior valor: Goldfish sobre os artefatos.** Itens: `sdd-revisar-design` (contrato, personas, padrões, resolução); seções novas de TechSpec e PRD; integração no fluxo antes dos HILs 1 e 2; estado e checkpoint; `sdd-triar` com S5a/S5b/S9 e o nível. Esta fase já entrega o nível `sdd-egm`, partindo do pedido em vez do brief.
2. **Fase Elefante.** Itens: `sdd-explorar-conceito`, `brief.md`, reconciliação brief↔PRD/TechSpec e a regra do modo auto.

## 5. Verificação prometida

- O checklist `writing-skills/references/checklist.md` passa item a item em cada skill nova ou alterada, registrado num anexo deste documento, como em `sdd-skills-audit.md`.
- `validate-metadata.py` passa nas skills novas, o bundle `sdd` bate com as pastas, os links locais resolvem e `git diff --check` não acusa nada.
- Simulação estática de pelo menos três cenários, com um revisor independente:
  1. feature `sdd-egm` do pedido ao HIL 2, com um ESCALATE e uma paráfrase errada;
  2. modo auto com o loop atingindo o teto e churn;
  3. retomada no meio de `revisao-design` com um Goldfish sem término confirmado.
- Calibração: depois de cerca de 10 triagens, comparar no `triagem-log.jsonl` as recomendações `sdd-egm` com a decisão humana e ajustar os limiares.
- Custo real: registrar tokens e duração de uma feature egm contra uma `sdd-completo` comparável, quando o host expuser esses números. Antes disso, o custo da seção 3.2 é estimativa.

## 5.1 Estado da implementação (2026-10-31)

Fase 1 implementada. Divergências em relação às seções 3.2 e 3.3:

- Não há fases novas no checkpoint: a revisão de design roda dentro de `produto` e `projeto-plano`. O estado vem do campo `nivel` e de `sources.design_review`.
- A lente de estilo não entrou. As lentes `critico`, `prontidao` e `codigo` recebem o nível da feature, porque as seções exclusivas do egm só valem nesse nível.
- O PRD não mudou nesta fase: "Alternativas descartadas" no PRD depende do brief da fase 2.
- A candidata a ADR nasce em `Alternativas descartadas` com `ADR: sim` e é registrada por `sdd-executar-task` no handoff da task que implementa a `DEC`, então a skill `commit` não precisou mudar.
- O snapshot não mudou: o contrato do Goldfish já proíbe enviar e ler `snapshot-contexto.md`.
- O custo citado no HIL 0 foi recalculado para 12 a 19 execuções de subagente: o PRD com 2 lentes em 1 a 2 rodadas e TechSpec mais tasks com 5 lentes em 2 a 3 rodadas.

A fase 2 foi implementada depois; ver a seção 5.2.

### Verificação da fase 1

- `validate-metadata.py` passou para `sdd-revisar-design` e `sdd-triar`. O parse do `checkpoint.template.json` passou, todos os links locais das skills `sdd-*` resolvem e `git diff --check` saiu sem erros.
- Um revisor independente, de contexto novo, simulou quatro cenários:
  - `sdd-egm` monitorado do HIL 0 ao HIL 2, com um ESCALAR e uma paráfrase errada;
  - modo auto no teto, com Bloqueante aberto e com churn;
  - retomada no meio de uma rodada Goldfish;
  - uso avulso numa feature `sdd-completo`.
- A primeira passada encontrou 19 problemas, entre eles: teto sem caso convergido, a definição de "assentado" espalhada, ninguém comparando a paráfrase com a intenção, retomada sem regra e falha na checagem de contaminação. Corrigi 18; o da rota `sdd-planejar-auditoria` ficou fora de propósito, porque essa rota não passa pela triagem.
- A segunda passada confirmou 17 resolvidos e um parcial, e apontou 4 problemas novos, entre eles a retomada depois da resolução confundida com contaminação. Corrigi o parcial e os quatro, mas sem uma terceira passada do revisor.
- Checklist de `writing-skills` aplicado a `sdd-revisar-design`:
  - Fail na primeira passada: descrição com identidade, critério de conclusão do passo 7 sem o ramo de retorno, co-localização, fonte única e estados de falha.
  - Correções feitas:
    - a descrição ficou só com gatilhos;
    - a Saída do passo 7 passou a cobrir a volta ao passo 2;
    - os estados do achado viraram fonte única em `resolucao.md`;
    - a mudança no PRD ganhou seção própria;
    - a recuperação de rodada interrompida foi definida.
  - Os demais itens passaram, e CLI e papéis de helpers não se aplicam.
- Não houve execução real de uma feature `sdd-egm`. O custo da seção 3.2 segue estimado.

## 5.2 Fase 2 — Fase Elefante (2026-10-31)

Skill nova `sdd-explorar-conceito`. Os oito passos rodam na pasta da feature, antes do PRD:

1. preparar;
2. entrevistar pela skill `grilling`, sob `references/postura-elefante.md`;
3. propor a primeira proposta técnica, gravada no brief;
4. HIL Hipótese;
5. as 6 lentes em `conceito_[num]/`;
6. sintetizar no `brief.md`;
7. HIL Brief;
8. devolver.

O que entrou nesta fase, em relação à seção 3.1:

- **Lentes:** as seis lentes ficam num único arquivo, `references/lentes-conceito.md`, com contrato e formato próprios. Cada lente grava só o seu arquivo e termina com `Fim do relatório.`, como na revisão de design.
- **Reconciliação:** a regra brief↔artefato é fonte única em `references/reconciliacao-brief.md` e é seguida por `sdd-criar-prd` e `sdd-criar-techspec`. Contradições vão ao humano; o rascunho não é alinhado ao brief por conta própria.
- **Templates:** o PRD ganhou a seção `Alternativas descartadas` (de produto), exclusiva do nível egm. A TechSpec passou a herdar as alternativas técnicas do brief.
- **Estado do fluxo:**
  - fase `conceito` no checkpoint;
  - `sources.brief`;
  - gates HIL Hipótese e HIL Brief;
  - retomada de lente interrompida generalizada para `conceito_[num]/`.
- **Recorte:** com recorte, `sdd-orquestrar-prds` roda a Fase Elefante por recorte, entre a aprovação do recorte e a redação de cada PRD.
- **Modo auto (D3):** a Fase Elefante sempre pergunta ao humano e segue a pausa monitorada. Contradição com o brief aprovado entra na rubrica de escalonamento.
- **Custo citado no HIL 0:** de 18 a 25 execuções de subagente, sem contar retries, rodada extra nem iterações do brief.

### Verificação da fase 2

- `validate-metadata.py` passou para as skills alteradas; o JSON do checkpoint, os links locais e `git diff --check` também.
- Um revisor independente simulou cinco cenários:
  - feature única monitorada, com uma lente falhando, uma iteração e uma contradição entre a TechSpec e o brief;
  - modo auto com o ContextBrake reiniciando a sessão no meio da entrevista;
  - dois recortes;
  - retomada com uma pasta de lentes incompleta;
  - uso avulso.
- A primeira passada encontrou 15 problemas. Os mais graves:
  - lente que não rodou era despachada de novo para sempre (o mesmo defeito existia em `sdd-revisar-design` e foi corrigido lá também);
  - a primeira proposta técnica furava a regra "Dono decide arquitetura";
  - recortes rodavam sem checkpoint;
  - a entrevista se perdia num reinício;
  - o estado do brief era ambíguo.
- A segunda passada confirmou 12 resolvidos e 3 parciais, e apontou 3 problemas novos, entre eles a triagem decidindo `sdd-egm` sem o humano no modo auto. Corrigi os parciais e os novos, sem uma terceira passada do revisor.
- No checklist de `writing-skills`, todos os itens passam na segunda passada.
- Não houve execução real de uma feature.

## 6. Decisões tomadas (2026-10-31)

- **D1. Durabilidade: manter efêmero.** Os artefatos seguem o ciclo atual e são removidos pela skill `commit`. Não há `docs/designs/`, SITEMAP nem `sdd-detectar-drift`. O nível egm entrega qualidade de especificação, e as decisões duradouras sobrevivem como ADR.
- **D2. Entrevista: `grilling` + postura do Elefante.** Rodadas por fronteira com ferramenta de pergunta e recomendação primeiro. Decisões de arquitetura com mais de uma resposta defensável são apresentadas sem ranking, com mecanismo, trade-off e condição de falha.
- **D3. Modo auto: Fase Elefante monitorada.** Com `--modo auto`, a entrevista, o HIL Hipótese e o HIL Brief sempre perguntam ao humano. O modo auto vale a partir do brief aprovado, e a revisão Goldfish roda com resolução autônoma pela rubrica de escalonamento.
