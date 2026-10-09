---
name: csharp-tests-refactor
description: "Refatoração e limpeza de suítes de teste C# inteiras, módulo por módulo, com plano persistido, rede de segurança (testes + Stryker antes e depois) e um commit por módulo. Use sempre que o usuário pedir para limpar, organizar, enxugar, reduzir, reorganizar ou refatorar os testes de um projeto ou solução, reclamar de testes demais, testes gerados por IA, suíte lenta ou inflada, ou pedir para 'dar uma geral' nos testes, mesmo sem dizer 'módulo' ou 'refatorar'. Para criar ou revisar testes de uma unidade específica, use csharp-tests diretamente; esta skill a usa como critério em cada módulo."
argument-hint: "Caminho da solução ou do projeto de teste, e opcionalmente o módulo por onde começar"
---

# Refatoração de testes C# por módulo

Uma suíte inflada não se limpa de uma vez: o diff fica irrevisável e o agente apaga o que importava junto com o que sobrava. Esta skill divide o trabalho em módulos, fecha cada um com rede de segurança e commit próprio, e guarda o progresso num arquivo para retomar em outra sessão. O critério do que fica e do que sai não está aqui: vem da skill `csharp-tests` (triagem, plano comportamento → mutante → teste, critério de parada, anti-catálogo). Leia o `SKILL.md` dela antes de tocar no primeiro módulo.

## Regras que valem a sessão inteira

- **Nunca altere código de produção.** Se um teste só fica bom extraindo uma decisão da cola ou criando uma interface, registre como "pendência de produção" no relatório e siga.
- **Nunca apague um teste para fazer a suíte passar.** Baseline vermelho é diagnosticado e reportado; a limpeza começa só com baseline verde ou com a falha documentada e isolada.
- **Um módulo por vez, um commit por módulo.** Nada do módulo seguinte entra no commit do atual.
- **Pare após cada módulo e mostre o relatório.** Continue para o próximo só quando o usuário disser; se ele autorizar "até o fim", continue sozinho mas mantenha um commit por módulo e o arquivo de plano atualizado.
- Para `dotnet build` e `dotnet test`, use a skill `dotnet-efficient-validation`; para PostgreSQL, `pgsql-test-runner`; para o runner (VSTest ou MTP) e o Stryker, as referências de `csharp-tests`.

## Fase 0 — Inventário e plano (uma vez por projeto)

1. Procure `tests-refactor-plan.md` na raiz do repositório. Se existe, leia e pule para a Fase 1 no primeiro módulo `pendente`. Se não existe, continue.
2. Rode `python scripts/inventario.py <raiz-da-solucao>` a partir da pasta desta skill. Ele lista cada projeto de teste, seu runner, a contagem de `[Fact]`/`[Theory]` por pasta e a pasta de produção correspondente (por nome ou namespace). Se o script não cobrir a estrutura do projeto, faça o levantamento à mão com `grep` e registre o que descobriu.
3. Defina os módulos. Módulo é a menor pasta de teste que corresponde a um conceito de produção (um bounded context, uma feature, um namespace de domínio). Pasta com mais de ~40 testes ou que mistura conceitos é dividida; pasta com menos de 5 é agrupada com a vizinha.
4. Estime a criticidade de cada módulo com a tabela de triagem de `csharp-tests` aplicada ao que a produção faz, não ao que os testes dizem: domínio financeiro e persistência são Críticos; controllers e handlers são Cola; DTOs e mapeamentos são Triviais.
5. Ordene: primeiro os módulos **Cola** e **Trivial** mais inflados (maior ganho, menor risco, e calibram o que o usuário espera), depois os **Comuns**, por último os **Críticos**, que exigem Stryker antes e depois.
6. Escreva `tests-refactor-plan.md` no formato de `references/plano-e-relatorio.md`, mostre ao usuário e peça confirmação da ordem antes de iniciar. Mudança de ordem pedida pelo usuário é registrada no arquivo, não só na conversa.

## Fase 1 — Um módulo

Repita para o módulo marcado como `em andamento` (marque-o assim antes de começar).

### 1. Baseline

- Rode só os testes do módulo (`--filter` por namespace ou classe). Anote total e resultado.
- Se o módulo é Crítico, rode Stryker restrito ao escopo de produção dele e anote o score. Sem score antes, não há como saber se a limpeza removeu proteção.
- Leia todas as classes de teste do módulo e as classes de produção que elas cobrem. Não decida nada por nome de teste; leia o corpo.

### 2. Classificação e plano

Para cada classe de produção coberta, aplique `csharp-tests`:

- Declare o nível (Crítico, Comum, Cola, Trivial).
- Monte a tabela comportamento → mutante → teste com os testes **que deveriam existir**.
- Compare com os que existem. Cada teste existente cai em uma de quatro ações:
  - **Mantém**: mata um mutante do plano que nenhum outro mata.
  - **Funde**: dois ou mais testes matam o mesmo mutante; vira um, normalmente `[Theory]`.
  - **Reescreve**: cobre um comportamento do plano mas não mata o mutante (está no anti-catálogo: `ShouldNotBeNull` solitário, `Received(Arg.Any)`, teste do mock, etc.).
  - **Apaga**: não corresponde a nenhuma linha do plano, ou testa unidade Trivial, ou é unitário com mocks de unidade Cola.
- Mutante do plano sem teste existente é **cria**, mas só se o módulo não é Cola; em Cola, registre a lacuna para teste de integração em vez de criar unitário.

### 3. Execução

- Aplique as ações na ordem apaga → funde → reescreve → cria, rodando os testes do módulo ao fim de cada lote.
- Reorganize para a estrutura alvo: pasta de teste espelha o namespace de produção, uma classe `XTestes` por classe `X`, fixtures e builders compartilhados na pasta que o projeto já usa (ou `Infra/` se não há convenção). Mover arquivo é só mover; não misture reorganização com reescrita no mesmo arquivo sem necessidade.
- Padronize nomes para `Metodo_Condicao_ResultadoEsperado` e AAA com comentários, conforme `csharp-tests`. Renomear não justifica reescrever uma asserção que já mata mutante.

### 4. Verificação

- Rode os testes do módulo: têm que passar.
- Rode a suíte relacionada (projetos que referenciam o mesmo código de produção): tem que passar.
- Em módulo Crítico, rode o Stryker de novo no mesmo escopo. Score igual ou maior com menos testes é sucesso; score menor significa que um teste apagado matava mutante exclusivo. Restaure-o (ou escreva o equivalente a partir do relatório do Stryker) antes de fechar o módulo.

### 5. Fechamento

- Escreva o relatório do módulo no formato de `references/plano-e-relatorio.md` e cole no `tests-refactor-plan.md` sob o módulo, marcando-o `concluído`.
- Faça um commit só com as mudanças do módulo e o arquivo de plano. Mensagem: `test(<modulo>): limpa e reorganiza testes (<antes> → <depois>, Stryker <x>% → <y>%)`. Sem Stryker, omita a parte dele.
- Mostre o relatório ao usuário em prosa curta: antes/depois, o que foi apagado e por quê, pendências de produção. Pergunte se segue para o próximo módulo.

## Quando parar ou pedir ajuda

- Baseline vermelho que não é drift de ambiente: pare, mostre, não limpe.
- Módulo com mais de ~60 testes depois de dividido: proponha nova divisão antes de começar.
- Teste que você não entende o que protege (nome vago, asserção obscura, cobre comportamento que não aparece no código de produção): mantém, marca `[?]` no relatório e pergunta. Apagar por não entender é a forma mais comum de perder proteção.
- Projeto sem Stryker instalado em módulo Crítico: instale (`dotnet tool install -g dotnet-stryker`); se não puder, diga que o módulo será fechado sem rede de mutação e peça confirmação.

## Critérios de conclusão (por módulo)

- Baseline registrado antes de qualquer mudança (testes e, se Crítico, Stryker).
- Toda classe de produção do módulo tem nível declarado e tabela de plano no relatório.
- Toda remoção e fusão tem o teste que a tornou redundante nomeado no relatório.
- Nenhum código de produção foi alterado; pendências de produção estão listadas.
- Testes do módulo e suíte relacionada passam; em Crítico, score do Stryker não caiu.
- Commit único do módulo feito e `tests-refactor-plan.md` atualizado.
