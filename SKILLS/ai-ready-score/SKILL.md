---
name: ai-ready-score
description: AI Ready avalia a prontidão de um repositório para agentes de IA com nota de 0 a 5 e achados verificáveis. Use para auditar instruções e carregamento de skills ou reavaliar correções do ai-ready-fix. Não use para corrigir arquivos nem para revisão de código, segurança ou performance.
---

# AI Ready Score

Avalie a qualidade das instruções que um agente realmente recebe. A nota mede orientação disponível no repositório, não qualidade do software nem desempenho garantido do agente.

## 1. Delimitar e inventariar

Resolva o caminho do repositório e identifique as ferramentas em escopo por pedido explícito ou configuração/documentação do projeto. Sem evidência suficiente, use o perfil de interoperabilidade com Claude Code, Copilot, Codex e OpenCode e declare essa suposição. Mantenha as quatro ferramentas no relatório; ferramentas fora do escopo ficam como não aplicáveis e não reduzem a nota. Um arquivo compartilhado não conta como vários conteúdos independentes.

Execute `python <skill-dir>/scripts/discover.py <repo>` (somente leitura), substituindo `<skill-dir>` pelo diretório absoluto desta skill. O inventário é evidência de arquivos, não prova de carregamento. Leia as instruções residentes e os alvos locais válidos, uma vez por fonte; abra skills apenas quando necessário para conferir candidatos e referências. Inspecione configurações, imports e instruções por subárvore que alterem o conteúdo efetivo. Links externos são dependências a registrar, sem leitura automática de seu conteúdo.

Confira manifests, scripts, CI e amostras dos módulos relevantes para validar comandos e regras. Diferencie comando encontrado em configuração de comando executado com sucesso. Não execute build/test nem instale dependências só para atribuir a nota. Registre diretórios excluídos e erros de leitura; amplie a busca dirigida se uma exclusão esconder código do projeto. Se faltar evidência para decidir um critério, marque a avaliação como provisória.

Conclua com o escopo declarado, entradas de instrução e fontes efetivas identificadas, e limitações explícitas.

## 2. Julgar o conteúdo efetivo

Use estes critérios em cada fonte e escopo:

- **Delta:** a regra muda uma decisão com base no projeto? Comandos, caminhos e convenções precisam corresponder a evidências locais. Conselhos universais ou afirmações inventadas não qualificam.
- **Frequência:** regras recorrentes pertencem ao escopo residente mais estreito que as necessita. Procedimentos ocasionais extensos pertencem a skills ou referências sob demanda; uma exceção curta e crítica pode permanecer residente.
- **Economia:** remova conceitualmente repetições e informação facilmente derivável. Não exija quantidade de linhas, seções ou skills.
- **Fonte única:** regras comuns têm um lugar autoritativo. Symlinks válidos ou imports suportados podem compartilhá-las; diferenças intencionais de ferramenta/subárvore não são duplicação. Hash igual é indício, não veredito. Link Markdown comum não prova carregamento automático.
- **Operabilidade:** entradas e referências resolvem, comandos incluem diretório/pré-requisitos relevantes, e regras de escopos sobrepostos não se contradizem. Conteúdo de `SKILL.md` existir não prova que a ferramenta o descobre.

Classifique separadamente estado físico (ausente, regular, link, quebrado, externo, ilegível) e qualidade. Registre cada problema com ID estável, evidência `arquivo:linha`, impacto, critério afetado e ação concreta. Sugira extração apenas quando trouxer benefício; escolha entre instrução de subárvore, documento e skill conforme o tipo de conhecimento.

Conclua com cada critério sustentado por evidência ou marcado como não verificado.

## 3. Pontuar e reportar

Rubrica **v2**, cumulativa a partir de 1: escolha o maior nível cujos requisitos de 1 até ele estejam atendidos. A nota 0 se aplica quando o nível 1 não é atendido. Aplique o mesmo escopo na avaliação inicial e na reavaliação.

| Nota | Requisito adicional |
|---|---|
| 0 | Nenhuma instrução utilizável nas ferramentas em escopo (ausente, vazia, ilegível ou quebrada). |
| 1 | Ao menos uma ferramenta recebe instruções não vazias; conteúdo ainda pode ser genérico. |
| 2 | Ao menos uma fonte contém orientação específica e verificável do projeto. |
| 3 | Todas as ferramentas em escopo recebem orientação específica, com fonte única para regras comuns e sem conflitos conhecidos entre escopos. |
| 4 | A orientação cobre o necessário para trabalhar: comandos de validação disponíveis, mapa útil dos módulos e convenções que alteram decisões. Entradas, comandos e referências essenciais foram conferidos contra o repositório. |
| 5 | O contexto residente passa em Delta/Frequência/Economia; procedimentos ocasionais relevantes estão acessíveis sob demanda, com gatilhos e referências conferidos. Pode haver zero skills se nenhuma for necessária. |

Ausência de build/test em um repositório documental não é defeito automático: registre o método de validação aplicável ou a ausência comprovada de automação. Critério não verificado não pode ser declarado atendido; apresente a nota comprovada como provisória e diga o que falta verificar. Relatórios anteriores à v2 precisam ser recalculados antes de comparar notas.

Leia integralmente [assets/report.template.md](assets/report.template.md) ao produzir o relatório. Preencha o modelo e grave `AI-READY-SCORE.md` na raiz, salvo pedido de saída apenas na conversa ou caminho alternativo. Essa é a única mutação da auditoria. Antes de gravar, confira se o destino e seus pais resolvem dentro da raiz; preserve alvos externos. Se não puder gravar com segurança, entregue o relatório na conversa e explique a limitação. Nunca altere instruções durante a avaliação.

Conclua com nota, versão da rubrica, escopo, evidências, limitações e o primeiro requisito não atendido. A nota 5 exige todos os critérios verificados, não apenas ausência de achados.

## Falhas e validação do helper

O helper requer Python 3.9+ e usa apenas a biblioteca padrão. Caminho inválido ou erro de acesso resulta em saída de erro e código não zero; aproveite o inventário parcial, mas não o trate como completo. Corrija o caminho ou faça inspeção dirigida com ferramentas disponíveis. Não transforme erro de leitura em ausência de instruções.

Ao modificar o inventário, execute `python <skill-dir>/scripts/test_discover.py` (testes em diretórios temporários).
