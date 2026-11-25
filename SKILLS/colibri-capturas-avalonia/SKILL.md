---
name: colibri-capturas-avalonia
description: "Capturas Avalonia: gera imagens PNG das telas Avalonia de um projeto Colibri sem monitor (headless com Skia), nos temas claro e escuro, revisa cada imagem e, quando pedido, põe as imagens num comentário do Jira. Use quando o usuário pedir imagens, prints, screenshots ou capturas das telas Avalonia para uma tarefa, um PR, uma documentação ou o QA, ou quando quiser conferir o visual das telas sem abrir o aplicativo. Não use para testes headless de comportamento (use os testes do projeto), para telas WinForms ou web, nem para migrar telas para Avalonia (use migrar-ui-para-avalonia)."
---

# Capturas das telas Avalonia

A skill abre as telas Avalonia de um projeto num processo headless com o renderizador Skia e grava 1 PNG por tela e por tema. Ela não precisa de monitor, do POS nem do aplicativo instalado. A revisão das imagens faz parte da skill: uma captura também é uma conferência visual, e defeitos de contraste ou de layout aparecem nela.

## Passo 1: Inventariar as telas

1. Ache as janelas Avalonia do projeto: classes que herdam de `Window` (ou de uma base do projeto, como `TelaTef`).
2. Para cada janela, anote como ela abre:
   - construtor público e `Show()`;
   - método estático `ExecutarAsync`/`MostrarAsync`, que cria a janela;
   - construtor `internal` para testes, com dados falsos.
3. Ache o carregamento do tema. Procure, nesta ordem:
   - o `TestAppBuilder` do projeto de testes headless (`*Testes*`, pacote `Avalonia.Headless`);
   - a classe `Application` do projeto (`Initialize`, `Styles.Add`, `StyleInclude`);
   - o padrão da biblioteca: `FluentTheme` e `avares://CoLib.Ui.Avalonia/Tema/TemaColibri.axaml`.
4. Ache o `InternalsVisibleTo` dos assemblies das telas (`Properties/AssemblyInfo.cs` ou `.csproj`). O nome do assembly de testes dá acesso aos membros `internal`: abas, combos, botões e construtores de teste.
5. Anote as telas que leem o banco ou a instalação local (por exemplo `new Configuracao(...)`). Elas podem mostrar dados reais.
6. Mostre a lista de telas ao usuário. Inclua para cada uma o estado que a imagem mostra (por exemplo "menu com 4 itens", "aba Pix"). Se o usuário não deu a lista, **pergunte** se a lista está certa.

*Pronto quando:* cada tela tem um modo de abrir, um estado para a imagem e o carregamento do tema.

## Passo 2: Criar o projeto de captura

O projeto fica no scratchpad da sessão, fora do repositório. Ele não entra em commit.

1. Copie `assets/Capturas.csproj` e `assets/Program.cs` para `<scratchpad>/capturas/`.
2. No `.csproj`, ajuste os itens marcados com `AJUSTE`:
   - `AssemblyName`: o nome do assembly que está no `InternalsVisibleTo`. Sem acesso a internos, use `Capturas`.
   - `TargetFramework` e `PlatformTarget`: os mesmos dos projetos das telas.
   - As versões de `Avalonia.Headless` e `Avalonia.Skia`: a mesma versão do `Avalonia` do projeto. Versões diferentes falham ao carregar.
   - `ProjectReference`: caminho absoluto dos projetos das telas.
3. No `Program.cs`, ajuste os itens marcados com `AJUSTE`:
   - `AppCapturas.Initialize`: o carregamento do tema do passo 1.
   - Os blocos de captura: 1 bloco por tela do inventário. Os 3 blocos de exemplo mostram os 3 modos de abrir.
4. Se 2 namespaces têm a mesma classe (por exemplo `CoLib.Ui.Avalonia.Dialogos.DlgAguarde` e a do projeto), use um alias `using X = ...;`.

Leia as regras do headless antes de escrever um bloco. Cada regra vem de uma falha real:

| Regra | Motivo |
|---|---|
| `UseSkia()` com `UseHeadlessDrawing = false` | Com `UseHeadlessDrawing = true` (o padrão dos testes), nada é desenhado e o frame vem vazio. |
| `SetupWithoutStarting()` e tudo na thread principal | O processo não tem loop de mensagens. A thread principal é a thread de UI. |
| Não use `await` em `ExecutarAsync` | A tarefa só termina quando a janela fecha. Chame sem `await` (`_ = ...`) e capture a janela aberta. |
| `Processar()` antes de cada captura | `RunJobs()` aplica o layout, e `ForceRenderTimerTick()` desenha o frame. Uma só chamada pode deixar o frame antigo. |
| Janela maximizada vira `Normal` com 1280×720 | Sem monitor, uma janela maximizada não tem tamanho definido. |
| Lifetime desktop com a lista de janelas | O `JanelaModal` da biblioteca e a busca da janela aberta usam `Windows` do lifetime. |
| Feche todas as janelas entre as telas | Uma janela que fica aberta entra na captura seguinte. |
| `CoLib.Ambiente.PastasDoSistema.Base` para telas que leem o banco | A configuração local vem da instalação do Colibri (em geral `D:\projetos\sistema colibri`). |

*Pronto quando:* `dotnet build` termina com 0 erros.

## Passo 3: Gerar as imagens

1. Rode o executável com a pasta de saída: `bin/Debug/<tfm>/<AssemblyName>.exe "<scratchpad>\capturas\png"`. Use `dotnet run` só quando o `AssemblyName` não é o do projeto de testes, porque o `dotnet run` procura o nome do projeto.
2. Cada linha da saída mostra a imagem e o tamanho em pixels. As linhas `não abriu` e `sem frame` são falhas: corrija o bloco e rode de novo.
3. O nome de cada arquivo é `NN-tela-tema.png` (por exemplo `05-pix-qrcode-claro.png`). O número dá a ordem das imagens no comentário do Jira.

*Pronto quando:* cada tela do inventário tem 1 PNG por tema.

## Passo 4: Revisar cada imagem

Abra cada PNG com a ferramenta de leitura de imagens. Não publique uma imagem que você não viu.

1. **Dados sensíveis:** chaves, tokens, senhas, CPF, CNPJ ou nomes reais de clientes vindos do banco local. Se uma imagem tem esses dados, troque o valor no bloco de captura (por exemplo `form.Campo.Text = "exemplo"`) e gere de novo.
2. **Defeitos visuais:** texto com pouco contraste, texto cortado, controle fora do painel, tela vazia, tema errado. Compare a imagem clara com a escura: um texto que só aparece num tema é um defeito de cor.
3. **Limites do headless:** um fundo semitransparente (sobreposição do TEF, QR Code) sai sobre preto. Isso não é defeito; diga isso na legenda.
4. Se há um defeito no código, mostre a imagem e a causa ao usuário e **pergunte** se a skill corrige antes de publicar. Uma correção ganha um teste headless que falha com o código antigo.

*Pronto quando:* cada imagem foi vista, e não há dado sensível nem defeito sem decisão do usuário.

## Passo 5: Publicar

1. Se o usuário pediu só as imagens, informe a pasta e a lista de arquivos. Pare aqui.
2. Para o Jira, leia `references/jira-anexos.md` e siga os passos de lá.
3. Para um PR ou documentação, copie os PNG para o destino que o usuário indicar. As imagens do scratchpad somem num reinício.

*Pronto quando:* as imagens estão no destino pedido, e o relatório tem a pasta das imagens, os defeitos achados e os links publicados.
