# Snapshot de contexto — [slug da feature]

> Pistas para a próxima sessão, não autoridade: artefatos, manifestos, handoffs, relatórios e código vencem em conflito. Protocolo: skill `sdd-snapshot`.

## Cabeçalho

- status: ativo
- gerado: [AAAA-MM-DD]
- etapa: [planejamento | tasks | correcoes | revisao | aceite]
- fonte_etapa: [tasks.md | codereview_NN/ | .audits/...destinos.md]
- cobre_ate: [última unidade concluída, ex.: T03 | techspec.md | codereview_02]
- autoria_codigo: [sim | nao]
- git_head: [hash curto]
- worktree: [limpo | N alterados: caminhos de primeiro nível]
- proximo_passo: [skill — unidade, ex.: sdd-orquestrar-tasks — T04 (task_04.md)]
- outros_elegiveis: [IDs | —]
- substituido_por: —

## Mapa de carga

| Camada | Carregar quando |
| --- | --- |
| `agora` | Início da sessão: cabeçalho, resumo do próximo passo, pendências aguardando o usuário |
| `ao-selecionar` | A unidade escolhida casa com um gatilho: ID de task ou achado, arquivo afetado ou ID de rastreabilidade |
| `ao-editar` | Prestes a editar ou criar um caminho que casa com um gatilho |
| `ao-executar` | Prestes a rodar um comando que casa, ou ele acabou de falhar |
| `sob-demanda` | O resumo não basta: siga o ponteiro `fonte:`, só aquela seção |

Sessões de revisão carregam só cabeçalho, resumo do próximo passo, `Pendências abertas` e entradas `ao-executar`.

Formato de entrada: `- [ID] (quando: camada: gatilho; gatilho) resumo — fonte: caminho#seção; até: condição`

## Resumo do próximo passo

- Por que é o próximo: [dependências satisfeitas, gate decidido, recomendação]
- Ler primeiro: [arquivo da unidade, depois só as seções de PRD/TechSpec que ele cita]
- Pontos de mudança conhecidos: [`caminho:símbolo` da exploração, conferido no git_head | nenhum ainda]
- Entradas aplicáveis: [IDs]
- Atenção: [uma ou duas linhas, ou —]

## Decisões

- [D-01] (quando: ao-selecionar: T04; DEC-18) [decisão e sua consequência] — fonte: [task_03.md#Handoff | —]; até: [condição]

## Aprendizados

- [A-01] (quando: ao-executar: dotnet test) [fato e o que fazer a respeito] — fonte: [caminho#seção | —]; até: [condição]

## Mapa de código

- [M-01] (quando: ao-editar: src/[area]/**) [`caminho:símbolo` faz o quê, relevante porque] — fonte: —; até: [arquivos alterados se sobrepõem]

## Pendências abertas

- [P-01] (quando: agora) [item pendente, hit de ressalva, bloqueio ou pergunta ao usuário] — fonte: [caminho#seção]; até: [resolvida]
