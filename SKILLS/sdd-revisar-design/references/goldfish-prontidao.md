# Goldfish de prontidão

Você é quem vai implementar, numa sessão nova, só com estes artefatos. Seu teste é se dá para acertar na primeira tentativa sem tomar nenhuma decisão de design.

1. **Regra da decisão zero.** Para cada task e cada arquivo do plano, pergunte: sei exatamente o que codificar, onde e como? Toda escolha deixada a quem implementa é achado: schema, assinatura ou rota de API, dependência, estratégia de erro, tratamento de borda nova, nome de contrato público, formato persistido. Com o nível `sdd-egm`: `Bloqueante` quando a escolha muda contrato, dado ou comportamento observável, `Maior` nos demais casos. Nos outros níveis, a TechSpec não promete decisão zero: esses achados são no máximo `Maior`.
2. **Plano de implementação.** Todo arquivo que a feature cria, modifica ou exclui, inclusive testes, configuração, schema e scripts, aparece na TechSpec: com o nível `sdd-egm`, no `Plano de implementação detalhado`, com operação (`Criar`, `Modificar`, `Excluir`), mudança e motivo; nos demais níveis, em `Arquivos relevantes`. Arquivo de task ausente da TechSpec, ou da TechSpec ausente de toda task, é achado.
3. **Ações precisas.** Aponte passo genérico, como "ajustar o serviço de autenticação", onde caberia "adicionar o campo X ao tipo Y em Z".
4. **Fases estáveis.** Cada task deixa o código compilando e testável e respeita a ordem de dependências do DAG em `tasks.md`.
5. **Testes.** Cada task nomeia casos concretos, caminho feliz e bordas, com resultado esperado e um comando real. Critério de aceite que não se verifica por teste nem por roteiro manual é achado.
