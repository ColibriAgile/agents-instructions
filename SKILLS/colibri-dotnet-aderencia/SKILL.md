---
name: colibri-dotnet-aderencia
description: 'Aderência .NET Colibri: audita um projeto C#/.NET contra os padrões Colibri (submódulos dotnet-lib e inno-lib, CoLib.Logging com .logc na pasta padrão, porta e banco por ConfiguracoesDeAmbiente, publicação SingleFile dependente de framework, workflows build/testes/deploy do build-tools, testes xUnit v3 com MTP, NSSM e manifesto.server) e grava um relatório de aderência com evidência arquivo:linha, severidade e executor de cada correção, sem alterar o código. Use quando um projeto .NET entrar no Colibri, vier de outro time, precisar ser padronizado, ou quando pedirem checklist, auditoria, gap analysis, conformidade ou "o que falta para seguir o padrão Colibri". Não use para aplicar correções (use colibri-logging, colibri-ports, colibri-connection-string, atualizar-testes-mtp), para revisar um diff ou PR, nem para projetos Delphi ou frontend.'
argument-hint: '[caminho do projeto] [caminho do relatório]'
---

# Aderência .NET Colibri

Esta skill mede o quanto um projeto .NET segue os padrões Colibri e grava um relatório. Ela não corrige nada. O relatório indica, para cada achado, a skill ou o caminho que executa a correção. A execução é uma escolha do usuário, depois do relatório.

Os padrões vêm de 3 repositórios de referência (DConnect, pos-integration-service e back-office-connect) e da `dotnet-lib`. A rubrica fica em `references/checklist.md`. A evidência das referências fica em `references/padroes-referencia.md`.

## Limites desta skill

- A única gravação é o arquivo do relatório. Não edite código, csproj, workflow, `.gitmodules` nem configuração do alvo.
- Não execute `dotnet build`, `dotnet test`, `dotnet publish`, `dotnet restore`, `git submodule update` nem instaladores. A auditoria lê arquivos. Um build mudaria `bin/` e `obj/` e não muda a nota.
- Não copie o valor de um segredo para o relatório, para o chat nem para a saída de um comando. Indique só o arquivo, a linha e o tipo. Quando você ler um arquivo com segredo, leia só as linhas necessárias e não repita o literal.
- Uma regra que só 1 ou 2 referências seguem (`parcial`) não reprova o alvo. Uma regra que só os repositórios padronizados por último seguem (`nova`) também não reprova. O campo "Força" de cada item diz isto.

## Steps

**Step 1: Delimitar o alvo**

1. Resolva o caminho do alvo: o argumento, ou a raiz do repositório atual.
2. Registre o estado do git antes da auditoria: `git -C <alvo> status --porcelain` e `git -C <alvo> rev-parse --short HEAD`. Você usa este estado no Step 6.
3. Identifique o tipo de cada projeto executável: ASP.NET, worker, console, WinForms ou plugin. O tipo decide os itens N/A (porta HTTP, `CoLib.AspNet`, SingleFile de plugin).
4. Defina o caminho do relatório: o segundo argumento, ou `ADERENCIA-DOTNET.md` na raiz do alvo. Se o usuário pediu o relatório só no chat, não grave arquivo.

*Done when:* alvo, commit, estado inicial do git, tipos de host e caminho do relatório estão definidos.

**Step 2: Inventariar**

1. Execute `python -I <skill-dir>/scripts/inventario.py <alvo>` e substitua `<skill-dir>` pelo diretório absoluto desta skill. O script só lê arquivos e imprime JSON. Ele ignora `_lib`, `_lib-inno`, `bin`, `obj` e `node_modules`.
2. Salve a saída numa pasta temporária fora do alvo se ela for grande. Não salve a saída dentro do alvo.
3. Leia `avisos` primeiro. Um aviso de git indisponível deixa SUB-01 e SUB-02 como 🔍 até você conferir de outra forma.

O inventário mostra sinais, não prova conformidade. Um sinal com contagem zero pode vir de um nome diferente. Um sinal positivo pode estar em código morto. Confirme cada status no Step 3 com a leitura do arquivo citado.

*Done when:* o JSON do inventário está disponível e os avisos estão registrados.

**Step 3: Avaliar cada item da rubrica**

1. Leia `references/checklist.md` inteiro.
2. Para cada item, dê um status: ✅, ⚠️, ❌, N/A, ❓ ou 🔍. Use o campo "Verificar" do item para achar a evidência no inventário. Abra o arquivo citado e confirme a linha antes de marcar ❌.
3. Antes de marcar ❌, procure uma decisão documentada do produto: ADR, README, `docs/`, comentários com `DEC-`, `D-` ou "decisão". Se a divergência é uma decisão documentada, marque ❓ e leve o item para a seção "Decisões a confirmar". Uma decisão não é um defeito, mas o relatório mostra o custo dela.
4. Quando um item ❌ contradiz uma referência e existe um clone local da referência (por exemplo, `../dconnect`), abra o arquivo citado em `references/padroes-referencia.md` e confirme que o padrão continua igual. Se a referência mudou, siga a referência atual e registre a mudança em "Limitações".
5. Use a severidade padrão do item. Se você mudar a severidade, escreva o motivo na linha do item.
6. Para SEC-01, classifique cada suspeito do inventário. Um literal em projeto de teste (`em_teste: true`) é quase sempre dado falso; confirme e descarte. Um literal em código de produção, uma credencial em URL ou um token do GitHub é 🔴.
7. Quando PUB-02 for ❌, verifique os bloqueadores de SingleFile da rubrica e diga no relatório se a mudança é viável.

*Done when:* todos os itens da rubrica têm status, evidência no alvo (arquivo:linha ou fato medido) e severidade; nenhum ❌ depende só de um sinal do inventário.

**Step 4: Montar o relatório**

1. Leia `assets/relatorio.template.md` inteiro e siga a estrutura dele.
2. Liste todos os itens da rubrica, inclusive os ✅ e os N/A. Assim uma reavaliação compara item a item pelo ID.
3. Preencha a coluna "Executor" com o "Mapa de execução" da rubrica.
4. Escreva a "Ordem de execução recomendada": bloqueadores primeiro, depois os itens que destravam outros (por exemplo, SUB-01 antes de LOG-*, TST-01 antes de CI-02).
5. Na seção "Itens conformes — não alterar", liste os ✅ que uma correção pode quebrar por engano.
6. Na seção "Limitações", liste os itens 🔍, as referências que você não conferiu e as pastas que o inventário não leu.

*Done when:* o relatório segue o template, as contagens do resumo batem com as tabelas e o texto não contém nenhum valor de segredo.

**Step 5: Gravar o relatório**

1. Confirme que o caminho do relatório fica dentro do alvo, ou num caminho que o usuário deu.
2. Grave o arquivo. Se o arquivo já existe, ele é uma avaliação anterior: leia o arquivo, compare os status por ID e acrescente ao resumo uma linha com o que mudou. Depois, substitua o arquivo.
3. Se você não pode gravar com segurança, entregue o relatório no chat e diga o motivo.

*Done when:* o relatório está gravado, ou está no chat com o motivo.

**Step 6: Provar que nada mais mudou**

1. Execute `git -C <alvo> status --porcelain` de novo.
2. Compare com o estado do Step 1. A única diferença aceita é o arquivo do relatório.
3. Se outro arquivo mudou, diga isto ao usuário, diga qual arquivo e não desfaça nada sem pedir.

*Done when:* a comparação mostra só o relatório como mudança, ou a diferença foi informada.

**Step 7: Oferecer a execução**

1. Mostre ao usuário o resumo: a contagem por severidade, os bloqueadores e o caminho do relatório.
2. Pergunte o que ele quer fazer. Use a tool de perguntas quando ela existe. Opções:
   - Não executar agora.
   - Executar 1 item ou 1 grupo de itens com o executor indicado no relatório.
   - Planejar todos os itens com `sdd-planejar-correcoes`, usando o relatório como entrada.
3. Se o usuário escolher executar, carregue a skill executora indicada e siga as regras dela. Esta skill termina aqui: a auditoria e a correção são etapas separadas.

*Done when:* o usuário recebeu o resumo e escolheu uma opção, ou não respondeu.

## Error Handling

- Se o alvo não tem nenhum `.csproj`, diga que a skill não se aplica e pare.
- Se o Python não está disponível, faça o inventário com buscas dirigidas (os padrões de busca estão em `SINAIS_CS` de `scripts/inventario.py`) e marque a avaliação como provisória em "Limitações".
- Se o `_lib` não existe no alvo, os itens que dependem de ler a lib (por exemplo, a lista de portas tipadas que já existiam, em POR-01 e POR-04) ficam 🔍. Use um clone local da `dotnet-lib` só para leitura, se existir, e registre o commit.
- Se o alvo tem vários produtos (por exemplo, serviço, plugin e mock), avalie cada executável nos itens POR, PUB e SRV e indique o produto na coluna "Evidência no alvo".
- Se a rubrica não cobre um padrão que você vê nas 3 referências, registre o padrão em "Limitações" como candidato a item novo da rubrica. Não invente um ID.

## Validação do script

Ao alterar `scripts/inventario.py`, execute `python <skill-dir>/scripts/test_inventario.py`. Os testes criam repositórios falsos em pasta temporária.
