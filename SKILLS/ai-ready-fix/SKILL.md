---
name: ai-ready-fix
description: AI Ready Fix corrige achados do AI-READY-SCORE.md e reavalia a prontidão do repositório para agentes de IA. Use para aplicar a auditoria ou elevar a nota até 5. Não use para somente pontuar (ai-ready-score) nem para editar instruções sem relação com essa auditoria.
---

# AI Ready Fix

Corrija lacunas comprovadas de orientação para agentes, preservando decisões do projeto. Busque nota 5 na rubrica do `ai-ready-score`, sem alterar o escopo ou inventar regras para obter a nota.

## 1. Estabelecer a avaliação inicial

Leia integralmente a skill `ai-ready-score` disponível no ambiente e execute seu fluxo no repositório alvo. Ela é a autoridade da rubrica e do relatório; localize-a no catálogo se necessário. Se indisponível, informe a dependência e não prometa uma nota validada. Registre nota inicial, versão, ferramentas em escopo e achados por ID. Mesmo com relatório existente, confira o estado atual dos arquivos antes de planejar correções.

Confira alterações locais e leia as instruções existentes antes de substituí-las. O resultado desta etapa é uma lista de achados ainda válidos, cada um com evidência e critério afetado. Se já houver nota 5 confirmada, conclua sem reescrever arquivos.

## 2. Resolver as lacunas de conhecimento

Explore apenas o necessário para os achados: manifests/runtime, módulos, comandos e CI, convenções em código, testes e regras existentes. Cite os caminhos que sustentam cada conclusão. Em projetos grandes, use subagentes em temas independentes se disponíveis; em projetos pequenos ou sem delegação, faça a mesma investigação diretamente. Não dependa de nomes específicos de ferramentas como `Explore` ou `AskUserQuestion`.

Para cada achado, defina a menor correção e sua verificação. Preserve regras específicas válidas, diferenças de subárvore e adaptações de ferramenta. Faça perguntas apenas quando uma decisão material não puder ser inferida nem já estiver autorizada; continue as correções independentes enquanto aguarda. Lacunas não respondidas ficam explícitas, sem convertê-las em fatos.

Conclua quando cada achado tiver uma ação sustentada por evidência ou uma dependência identificada.

## 3. Corrigir conteúdo e distribuição

Escolha a fonte autoritativa existente que melhor preserve as regras válidas; se não existir, prefira `AGENTS.md` na raiz. Consolide conteúdo único antes de substituir duplicatas. Use Delta/Frequência/Economia definidos no `ai-ready-score`; se disponível, consulte `writing-agents-md` para redação ou redução substancial.

Escreva comandos com o diretório de execução e pré-requisitos relevantes. Diferencie comandos conferidos em manifests/CI dos efetivamente executados. Registre a validação aplicável ao tipo de repositório. Políticas de compatibilidade, produção, migrações e remoção de código exigem evidência ou decisão explícita do usuário; não insira um bloco Greenfield Alpha por padrão.

Mova procedimentos ocasionais extensos para o mecanismo sob demanda já adotado. Conhecimento de uma subárvore pode ficar em instruções locais; documentação explicativa pode continuar em documento vinculado. Crie skills somente para fluxos com gatilhos claros e confira sua descoberta pelas ferramentas em escopo. Se não houver mecanismo, escolha um suportado por essas ferramentas, sem impor um diretório exclusivo de outra ferramenta. Ao criar skills, use `writing-skills` se disponível. Na fonte residente, deixe apenas o ponteiro necessário com condição de leitura.

Compartilhe regras comuns por symlink relativo ou import suportado e verificado. Preserve adaptações específicas em seus escopos. Não transforme todas as instruções aninhadas em aliases da raiz. Não confunda arquivo contendo o texto de um caminho com symlink real.

### Helpers de arquivos

Substitua `<skill-dir>` pelo diretório absoluto desta skill; forneça caminhos absolutos dos arquivos e da raiz, sem componentes `..`. Ambos os helpers requerem Python 3.9+ e usam somente a biblioteca padrão.

Antes de qualquer gravação de instruções, execute `python <skill-dir>/scripts/check_target.py <arquivo> <repo>` (somente leitura). O helper verifica o destino resolvido, inclusive pais que sejam links/junctions:

- `REAL`, `MISSING` e `IN_REPO_SYMLINK`: o caminho permanece no repositório; confira o conteúdo e os consumidores antes de editá-lo.
- `EXTERNAL_SYMLINK` ou `EXTERNAL_PATH`: preserve o alvo externo. Um link final pode ser substituído por conteúdo local após preservar as regras relevantes; um pai externo precisa ser resolvido antes de qualquer gravação.
- `BROKEN_SYMLINK`, `INVALID_TARGET` ou erro: examine o alvo e corrija a referência; não escreva através do caminho às cegas.

Para criar um alias, execute `python <skill-dir>/scripts/symlink.py <link> <fonte> --repo-root <repo>` (mutação). O helper cria pais locais ausentes, usa alvo relativo, é idempotente e recusa substituir conteúdo existente sem `--force`. Use `--force` apenas depois de consolidar conteúdo único e conferir o diff; a autorização para corrigir já cobre a substituição de duplicatas identificadas. Mudanças locais conflitantes ou conteúdo de intenção desconhecida exigem esclarecimento.

Se a plataforma negar symlinks, use um import somente se houver suporte comprovado na ferramenta. Caso contrário, registre o bloqueio e a alternativa necessária; não eleve privilégios nem altere configurações do sistema automaticamente. Falhas na criação do link preservam o arquivo existente.

Conclua com cada correção implementada ou bloqueada, fontes externas preservadas e todo conteúdo deslocado acessível no escopo certo.

## 4. Verificar e reavaliar

Revise o diff para garantir preservação das regras válidas e ausência de afirmações sem evidência. Confira resolução dos aliases, imports, links de documentos e descoberta das skills. Execute validações proporcionais às mudanças; não instale dependências nem rode suites completas para conferir apenas instruções.

Execute novamente `ai-ready-score` com a mesma rubrica e ferramentas. Se houver achados corrigíveis, volte à ação correspondente e reavalie após mudanças concretas. Encerre com nota 5 comprovada ou com pendências explícitas quando depender de informação, permissão ou recurso indisponível. Se o mesmo achado reaparecer sem progresso, investigue a causa e reporte a limitação em vez de repetir o ciclo sem mudanças. Nunca edite a nota manualmente nem afrouxe critérios para encerrar.

Entregue nota antes/depois, arquivos alterados, validações realizadas e pendências. Cada ID da avaliação inicial deve estar resolvido com evidência ou permanecer no relatório com motivo e próximo passo.

Ao modificar os helpers, execute `python <skill-dir>/scripts/test_helpers.py` (testes em diretórios temporários).
