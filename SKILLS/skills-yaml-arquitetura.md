# Panorama levantado: arquitetura de skills.yaml (per-projeto vs. bundles curados)

## Fatos-chave
- Dor real e mensurável: 42 skills instaladas hoje, Codex já emite warning de contexto grande, tendência de piora.
- A dor é tripla: custo de tokens, risco de escolha errada de skill, ruído cognitivo pra você.
- Repositório central de skills da empresa já existe e já é usado por outros devs — decisão afeta mais gente que só você.
- Mecanismo atual: um script faz symlink da pasta **inteira** de skills pro nível de **usuário**, igual para todos harnesses e todos projetos — zero escopo por projeto hoje.
- Escala: 50+ projetos no total, ~10 ativos, stacks diferentes, time de 1 pessoa (você) mantendo o repo compartilhado.
- Repositório de skills já tem processo de code review — cobre o risco de mudança inesperada em bundle compartilhado.

## Decisões e preferências
- **Modelo escolhido é híbrido**, não puramente "manifesto por projeto" nem "bundles curados": bundles curados por tema/stack no `skills.yaml` central (fonte da verdade) + um manifesto pequeno **commitado em cada projeto** declarando bundle(s) obrigatório(s).
- **Propagação automática**: bundle central atualizado → todos os projetos que o referenciam ganham a skill nova sem edição manual (referência viva, não lista congelada).
- **Instalação física passa a ser por projeto**: symlink local ao repositório (não mais um único symlink global de usuário) — confirmado que todos os harnesses usados (inclusive Codex) já suportam descoberta de skills em pasta local do projeto.
- **Bundles ad hoc temporários**: dev pode instalar um bundle extra pontual (ex: "authoring" pra editar CLAUDE.md) além do obrigatório, e removê-lo depois.
- **Reconciliação é obrigatória desde a v1**: o script de sync deve detectar skills instaladas que não pertencem ao bundle obrigatório e oferecer remoção interativa — sem isso, o esquecimento de bundles ad hoc reintroduz o problema original.
- **Gatilho preferido, em ordem de fallback**: hook antes do harness subir → git hook (pós-checkout/pull) → manual, se nenhum dos dois existir.
- **Conflito de nomes entre bundles**: bloquear e avisar, nunca sobrescrever silenciosamente.
- **Blast radius de mudança em bundle compartilhado**: risco aceito, coberto pelo code review do repo de skills.

## Assumptions (verificadas)
- Harnesses (Codex incluso) suportam skills em pasta local de projeto — verificado por você.
- Auto-propagação é o comportamento desejado, não lista congelada — confirmado.

## Riscos e mitigação
- Risco: dev esquecer de remover bundle ad hoc → Mitigação: reconciliação interativa obrigatória na v1, disparada o mais cedo possível no ciclo (idealmente antes do harness carregar).
- Risco: conflito de skill com mesmo nome entre bundle obrigatório e ad hoc → Mitigação: bloqueio explícito, resolução manual.
- Risco: mudança de bundle central quebrar projetos ativos silenciosamente → Mitigação: já coberto pelo processo de code review existente no repo de skills.

## Próximo passo concreto
Desenhar o formato do `skills.yaml` central (bundles nomeados por tema/stack, cada um com a lista de skills + source) e o formato do manifesto de projeto (bundle(s) obrigatório(s) commitado), depois escrever o script único que: resolve o(s) bundle(s) do manifesto → symlinka localmente → detecta extras fora do manifesto e oferece remoção → detecta conflitos de nome e bloqueia.
