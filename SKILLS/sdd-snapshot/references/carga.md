# Carregar o snapshot

Protocolo para a skill SDD que começa ou retoma trabalho numa feature com `snapshot-contexto.md`. Formato, cabeçalho e camadas estão em `SKILL.md` da skill `sdd-snapshot`.

1. Localize o snapshot como a skill chamadora indicar. Leia cabeçalho e mapa de carga. Abaixo de 8 KiB, leia o arquivo inteiro numa chamada; acima, leia até o fim do resumo do próximo passo e use `Grep` para as entradas.
2. Valide o cabeçalho:
   - `cobre_ate` contra a fonte da etapa (`Estado` do manifesto, `done/` da revisão ou mapa). Se a fonte mostrar mais progresso, o snapshot está atrasado: mantenha as entradas, mas trate o resumo do próximo passo como obsoleto e selecione de novo.
   - `git_head` contra `git rev-parse HEAD`, e `worktree` contra `git status --porcelain`. Com arquivos alterados desde o snapshot, entradas cujos gatilhos ou `fonte` casem com esses caminhos são suspeitas: confira antes de confiar.
   - `substituido` manda seguir `substituido_por`. `encerrado` significa que a etapa descrita terminou; reporte e não retome a partir dele.
   - Cabeçalho ilegível transforma o arquivo inteiro em lista de pistas: rederive o estado pela fonte da etapa e confira qualquer entrada antes de usar.
3. **Etapa independente.** Uma sessão que executa `sdd-revisar-codigo` carrega só cabeçalho, resumo do próximo passo, `Pendências abertas` e entradas `ao-executar` (fatos de ambiente e comandos). Pula `Decisões`, `Mapa de código` e os demais `Aprendizados`, que carregam o enquadramento do autor, e deriva das fontes o que julga. Se esta própria sessão escreveu o código em revisão, pare e aplique a regra de independência da pausa de sessão (`references/continuidade-sessao.md` da skill `sdd-orquestrar-tasks`).
4. Carregue a camada `agora`. Para pendências aguardando o usuário, pergunte antes de iniciar o trabalho que elas bloqueiam.
5. Depois de escolher a unidade, carregue as entradas `ao-selecionar` que casarem. Mantenha em vista os gatilhos `ao-editar` e `ao-executar` e carregue essas entradas quando o trabalho chegar a eles.
6. Siga um ponteiro `fonte:` só quando o resumo deixar uma dúvida que o trabalho precisa responder, lendo apenas a seção citada.

**Concluído quando:** o cabeçalho foi validado com as entradas suspeitas nomeadas, a camada `agora` está carregada e os gatilhos das demais camadas estão em vista; ou o snapshot foi rebaixado a pistas com o motivo informado.
