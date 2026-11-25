---
name: migrar-ui-para-avalonia
description: "Avalonia: migração dos diálogos de CoLib.UI (WinForms + DevExpress) e da ponte CoLib.Plugin.UI para CoLib.Ui.Avalonia num projeto Colibri. Use quando o usuário pedir para migrar para Avalonia os diálogos de um projeto (DlgMsg, HtmlDlg, DlgPedeValor, DlgEscolheValorGrid, HtmlDlgConsulta, DlgAguarde). Don't use for reescrever telas próprias do projeto feitas com controles DevExpress (XtraForm, GridControl), para alterar CoLib.UI ou o tema da _lib, nem para o visual do perfil Admin (use colibri-design-kit)."
---

# Migrar diálogos de CoLib.UI para Avalonia

O projeto consumidor troca os diálogos de `CoLib.UI` (WinForms + DevExpress) pelos de `CoLib.Ui.Avalonia`. A biblioteca fica no checkout do dotnet-lib, em geral o submódulo `_lib`. Para o motivo de uma regra, leia `docs/adr/0002` a `0009` desse checkout.

## Regras

- **Biblioteca intacta:** mude só o projeto consumidor. `CoLib.UI` e `CoLib.Plugin.UI` ficam como estão, porque os consumidores antigos ainda os usam.
- **Avalonia puro:** o código migrado usa só Avalonia e o alvo `net11.0` multiplataforma. Troque cada uso de `System.Windows.Forms`, DevExpress, `DllImport` ou `LibraryImport` por um recurso da biblioteca ou do Avalonia.
- **`await` primeiro:** use os métodos `*Async`. Use um método síncrono só quando o contrato do chamador é síncrono, por exemplo a ponte de plugins. Um método síncrono de diálogo chamado de dentro de outro método síncrono na thread de UI faz `SincronoNaUi` lançar `InvalidOperationException`; nesse caso, use `await`.
- **Texto limpo:** escreva o texto dos botões e das opções de menu sem `_`. A biblioteca cria os atalhos Alt+letra.
- **Biblioteca primeiro:** use o diálogo da biblioteca que cobre o caso. Para um item de "Sem equivalente", pare e pergunte ao usuário antes de criar um substituto.

## Sem equivalente

Estes itens de `CoLib.UI` não existem em `CoLib.Ui.Avalonia`:

- `HtmlContent`, `HtmlTemplate`, `HtmlPropEditor` e os editores de HTML/CSS (o novo não aceita HTML arbitrário);
- `DevExpressExtensions` (`Clonar`, `ComMascara*`, `ComLabel` e as outras extensões de controles DevExpress);
- `ImageSliderEx`, `ImpressaoTexto`, `WindowInfo`, `DesignUtils`;
- as funções da barra de tarefas do Windows (`OcultarBarraDeTarefas`, `BarraDeTarefasEstaNoMonitor`).

## Passos

### 1. Localizar a biblioteca

1. Encontre o checkout do dotnet-lib no repositório: procure a pasta que tem `CoLib.Ui.Avalonia/` (em geral `_lib/`).
2. Se esse checkout tem um `AGENTS.md` com a seção de migração dos diálogos, leia a seção. Ela corresponde à versão da biblioteca do projeto e vale mais que `references/correspondencia-api.md` quando os dois divergem.
3. Se o checkout não tem `CoLib.Ui.Avalonia/`, pare e diga ao usuário que a biblioteca do projeto é antiga demais para a migração.

*Done when:* o caminho da pasta `CoLib.Ui.Avalonia/` está registrado, ou o usuário recebeu a mensagem de biblioteca antiga.

### 2. Inventariar os usos

1. Leia por inteiro `references/correspondencia-api.md` antes de classificar o primeiro uso.
2. Procure, nos projetos que o usuário indicou, cada tipo antigo da tabela de correspondência e também `DxVersion`, `IWin32Window`, `DialogResult`, `MessageBoxButtons`, `MessageBoxIcon`, `System.Windows.Forms` e `DevExpress`.
3. Classifique cada ocorrência como "mapeado" (tem linha na tabela) ou "sem equivalente" (está na seção "Sem equivalente").
4. Se há uma ocorrência "sem equivalente", mostre a lista ao usuário e espere a decisão antes de editar.

*Done when:* cada ocorrência tem arquivo, linha e classificação, e cada ocorrência "sem equivalente" tem uma decisão do usuário.

### 3. Trocar as referências e o tema

1. Troque as referências do projeto: `CoLib.UI` → `CoLib.Ui.Avalonia`; `CoLib.Plugin.UI` → `CoLib.Plugin.UI.Avalonia`.
2. Carregue o tema na aplicação, depois do `FluentTheme`. A referência a um tipo da biblioteca carrega o assembly antes do `StyleInclude`:

   ```csharp
   var biblioteca = typeof(CoLib.Ui.Avalonia.SincronoNaUi).Assembly.GetName().Name;
   Styles.Add(new FluentTheme());
   Styles.Add(new StyleInclude(new Uri("avares://MeuApp/"))
   {
       Source = new Uri($"avares://{biblioteca}/Tema/TemaColibri.axaml")
   });
   ```

3. Se a aplicação usa o `DataGrid`, inclua também `Tema/TemaColibri.DataGrid.axaml`, depois do tema Fluent do `DataGrid`.
4. Remova as chamadas a `HtmlDlg.Initialize()`, `HtmlDlgConsulta.Initialize()` e `DxVersion.Register()`. A biblioteca nova não tem inicialização.

*Done when:* nenhum `.csproj` migrado referencia `CoLib.UI` nem `CoLib.Plugin.UI`, o tema carrega depois do `FluentTheme`, e as 3 chamadas de inicialização não existem mais.

### 4. Trocar as chamadas

1. Troque cada ocorrência "mapeado" do inventário pela linha correspondente de `references/correspondencia-api.md`.
2. Troque o parâmetro `IWin32Window? pai` por `Window? pai`. Com `null`, a biblioteca usa a janela ativa ou a última janela aberta.
3. Em cada ponto que você mudou, aplique cada item de "Diferenças de comportamento" da mesma referência.

*Done when:* cada ocorrência do inventário está trocada ou tem a decisão do usuário aplicada, e cada ponto alterado foi conferido contra a lista de diferenças.

### 5. Verificar

1. Procure de novo `CoLib.UI`, `CoLib.Plugin.UI`, `DevExpress` e `System.Windows.Forms` nos projetos migrados. O resultado é zero, exceto nos pontos com decisão do usuário.
2. Compile cada projeto alterado, um por um. O resultado é 0 erros e 0 avisos.
3. Teste o comportamento novo do consumidor com `Avalonia.Headless`. Use `CoLib.Ui.Avalonia.Testes` da biblioteca como exemplo: uma sessão por assembly (`HeadlessUnitTestSession`) e as classes auxiliares em `Dialogos/JanelasDeTeste.cs`.
4. Peça ao usuário para conferir o visual na Demo da biblioteca, nos temas Claro e Escuro e nos 3 idiomas. O headless não maximiza janelas, por isso o `DlgErro` maximizado e o posicionamento em vários monitores só aparecem na Demo:

   ```
   dotnet run --project <biblioteca>/CoLib.Ui.Avalonia.Demo/CoLib.Ui.Avalonia.Demo.csproj
   ```

*Done when:* a busca dá zero, cada projeto compila com 0 erros e 0 avisos, os testes headless passam, e o usuário recebeu o comando da Demo.
