# Correspondência da API e diferenças de comportamento

Fonte: `AGENTS.md` do dotnet-lib, commit `325f79a9`.

Namespaces novos: diálogos em `CoLib.Ui.Avalonia.Dialogos`; posição de janela em `CoLib.Ui.Avalonia.Janelas`; componentes em `CoLib.Ui.Avalonia.Componentes`.

## Correspondência da API

| `CoLib.UI` (antigo) | `CoLib.Ui.Avalonia` (novo) |
| --- | --- |
| `DlgMsg.Mostrar(pai, msg, titulo, MessageBoxButtons, MessageBoxIcon)` → `DialogResult` | `DlgMsg.MostrarAsync(pai, msg, titulo, BotoesMsg, IconeMsg, OpcoesDlgMsg?)` → `ResultadoMsg` |
| `HtmlDlg.MostrarAuto(pai, msg, titulo, botoes, icones, botaoPadrao, autoClose)` | `DlgMsg.MostrarAsync(..., new OpcoesDlgMsg(MaxWidth, AutoClose, BotaoPadrao))` |
| `HtmlDlg.MostrarOkAuto(pai, msg, titulo, icones)` | `DlgMsg.MostrarAsync(pai, msg, titulo, BotoesMsg.Ok, icone)` |
| `HtmlDlg.Erro(pai, msg, titulo, autoClose)` | `DlgMsg.ErroAsync(pai, msg, titulo, new OpcoesDlgMsg(AutoClose: TimeSpan.FromSeconds(n)))` |
| `DlgMsg.Erro` / `Avisar` / `Informar(pai, msg, titulo)` | `DlgMsg.ErroAsync` / `AvisarAsync` / `InformarAsync(pai, msg, titulo, opcoes)` |
| `DlgMsg.Pergunta(pai, msg, titulo)` → `DialogResult` | `DlgMsg.PerguntaAsync(pai, msg, titulo)` → `bool` |
| `DlgMsg.Erro(pai, exception, titulo)` / `DlgErro.Erro(pai, exception, msgAdicional, titulo)` | `DlgErro.ErroAsync(pai, exception, msgAdicional, titulo)` |
| `DlgPedeValor.Executar(pai, titulo, descricao, ref valor, maxLength, mask, maskType, senha)` → `bool` | `DlgPedeValor.ExecutarDesktopAsync(new OpcoesEntradaDesktop(titulo, descricao, valor, tamanhoMaximo, senha, mascara), pai)` → `(Confirmado, Texto)` |
| `DlgPedeValorTouch.Executar(titulo, valor, Modo, permiteTrocarModo, mostrarVirgula, mascara)` | `DlgPedeValor.ExecutarAsync(titulo, valor, ModoTeclado, permiteTrocarModo, mostrarVirgula, mascara, pai)` |
| `DlgPedeValorTouch.ObterInteiro(titulo, valor)` → `(bool, int)` | `DlgPedeValor.ObterInteiroAsync(titulo, valorInicial, pai)` → `(Confirmado, Valor)` |
| `DlgPedeValorTouch.ObterDecimal(titulo, ref valor, mascara)` → `bool` | `DlgPedeValor.ObterDecimalAsync(titulo, valorInicial, pai)` → `(Confirmado, Valor)` |
| `Input.EscolherValor(pai, List<string>, titulo, descricao, selecionado, permiteNovoValor)` | `Input.EscolherValorAsync(pai, IEnumerable<string>, ...)` ou `DlgEscolheValor.ExecutarAsync` |
| `Input.EscolherValor(pai, ComboBoxItemCollection, ...)` | Converta os itens para `string` e use a linha acima |
| `Input.EscolherPastaeArquivo(pai, pastas, arquivo)` | `Input.EscolherPastaEArquivoAsync(pai, pastas, arquivo)` (o `E` agora é maiúsculo) ou `DlgPastaArquivo.ExecutarAsync` |
| `Input.PedirNome(pai, titulo, descricao, ref valor, tamMaximo)` → `bool` | `Input.PedirNomeAsync(pai, titulo, descricao, valorInicial, tamanhoMaximo)` → `(Sucesso, Valor)` |
| `DlgEscolheValorGrid.ObterUm(pai, List<T>, titulo, Action<GridView>?)` | `DlgEscolheValorGrid.ObterUmAsync(pai, IReadOnlyList<T>, titulo, IReadOnlyList<ColunaGrade<T>>)` |
| `DlgEscolheValorGrid.ObterLista(...)` → `List<T>?` | `DlgEscolheValorGrid.ObterListaAsync(...)` → `IReadOnlyList<T>` |
| `DlgEscolheValorGrid.MostrarLista(pai, List<object>, titulo, Action<GridView>?)` | `DlgEscolheValorGrid.MostrarListaAsync<T>(pai, opcoes, titulo, colunas)` |
| `DlgMenuDinamico.Executar(pai, titulo, lista)` → `int` | `DlgMenu.ExecutarAsync(pai, titulo, itens)` → `int` (cancelado = `OpcoesMenu.CANCELADO`, -1) |
| `new DlgAguarde(pai, titulo, mensagem, cts)` + `Progresso` | `using var aguarde = DlgAguarde.Abrir(pai, titulo, mensagem, cts);` + `Progresso`; `Dispose` ou `Fechar` fecha |
| `new HtmlDlgConsulta().ComTitulo(...).ComColunas(params string[]).ComAoAtualizar(Func<IEnumerable<object>>)` | `DlgConsulta<T>.Criar().ComTitulo(...).ComColunas(colunas).ComAoAtualizar(ct => ...).ExecutarAsync(pai, itens)` → `T?` |
| `HtmlDlgConsulta.ComHtmlTemplate(HtmlTemplate)` | `DlgConsulta<T>.ComTemplateItem(IDataTemplate)` |
| `HtmlDlgConsulta.ComPersistenciaDoDialogo(id)` | `DlgConsulta<T>.ComPersistenciaDoDialogo(id, baseDir)` |
| `Teclado` / `HtmlTeclado` | `Teclado` (`UserControl`, `ModoTeclado`; eventos `TeclaDigitada`, `Apagar`, `Limpar`, `Confirmar`, `Cancelar`) |
| `FormStateSaver` (componente do `Form`) | `new FormStateSaver(janela, formId)`; o JSON gravado é igual ao antigo |
| `FormIdleDetector(IContainer)` | `new FormIdleDetector(janela)` + `Start()`; `Dispose()` solta a janela |
| `form.MoverParaMonitor(id, ocultarBarraTarefas)` | `janela.MoverParaMonitor(indice, FormPositionOptions)` |
| `form.MoverParaMonitorDaLinhaDeComando(...)` | `janela.AplicarPosicaoDaLinhaDeComando(FormPositionOptions)` (lê `-monitor`, `-cursor`, `-forcar_vertical`) |
| `control.ExpandirVerticalmente()` em janela | `FormPositionOptions.ExpandirVerticalmente` |
| `IWin32WindowNotificavel` | `IJanelaNotificavel` (`Notificar` e `NotificarAsync`) |
| `HostUiBridgeImplementation(IWin32Window)` | `HostUiBridgeAvalonia(Window)` |
| `UiUtils.ExecutarEmThreadSTA` | `Dispatcher` do Avalonia ou `SincronoNaUi` |

## Valores dos enums de `DlgMsg`

- `MessageBoxButtons` → `BotoesMsg`: `OK` → `Ok`, `YesNo` → `SimNao`, `OKCancel` → `OkCancelar`, `YesNoCancel` → `SimNaoCancelar`, `RetryCancel` → `RepetirCancelar`, `AbortRetryIgnore` → `AnularRepetirIgnorar`.
- `MessageBoxIcon` → `IconeMsg`: `Information`/`Asterisk` → `Informacao`, `Warning`/`Exclamation` → `Aviso`, `Error`/`Hand`/`Stop` → `Erro`, `Question` → `Pergunta`. `Sucesso` é novo.
- `DialogResult` → `ResultadoMsg`: `OK` → `Ok`, `Cancel` → `Cancelar`, `Abort` → `Anular`, `Retry` → `Repetir`, `Ignore` → `Ignorar`, `Yes` → `Sim`, `No` → `Nao`, `None` → `Nenhum`.

## Grade: de `Action<GridView>` para colunas tipadas

```csharp
ColunaGrade<Produto>[] colunas =
[
    new("Código", p => p.Codigo.ToString(CultureInfo.CurrentCulture), Largura: 80),
    new("Nome", p => p.Nome, Expandir: true),
    new("Preço", p => p.Preco.ToString("C", CultureInfo.CurrentCulture), Largura: 100)
];
var produto = await DlgEscolheValorGrid.ObterUmAsync(this, produtos, "Produtos", colunas);
```

## Diferenças de comportamento

- **`autoClose`:** o antigo é um `int` em segundos (0 = desligado). O novo é `TimeSpan?` em `OpcoesDlgMsg.AutoClose` (`null` = desligado). Quando fecha sozinho, o diálogo devolve a ação negativa (Cancelar, Não, Anular; OK no conjunto `Ok`).
- **Botão padrão:** o antigo `botaoPadrao` é um índice. O novo `OpcoesDlgMsg.BotaoPadrao` é um `ResultadoMsg`. O botão padrão fica na ponta direita do grupo.
- **`Pergunta`:** o novo retorna `bool` (`true` = Sim). Troque as comparações com `DialogResult.Yes`.
- **Parâmetros `ref`:** os métodos novos devolvem o valor no retorno (`Texto`, `Valor`). Use o valor só quando `Confirmado` ou `Sucesso` é `true`.
- **`maxLength = 0`:** no novo, "sem limite" é `TamanhoMaximo = null`.
- **Máscaras DevExpress:** o novo não tem `MaskType` nem `EditMask`. `OpcoesEntradaDesktop.Mascara` e o parâmetro `mascara` do modo touch são uma expressão regular para o texto inteiro, com tempo-limite de 50 ms. A validação marca o campo em tempo real e bloqueia só a confirmação. Para números, use `ObterInteiroAsync` ou `ObterDecimalAsync`, que leem pela cultura atual. A máscara de `ObterDecimal` (`\d*,\d\d`) não existe mais.
- **`ObterLista` cancelado:** o antigo retorna `null`. O novo retorna uma lista vazia. Troque `if (lista is null)` por `if (lista.Count == 0)`.
- **Grade:** o novo não ordena por clique no cabeçalho e não tem `GridView` para configurar. Defina as colunas com `ColunaGrade<T>`. O filtro de `DlgConsulta` usa o texto das colunas, ou `ComFiltroTexto`.
- **`DlgConsulta` assíncrona:** `ComAoAtualizar` recebe um `CancellationToken` e retorna `Task<IReadOnlyList<T>>`. Passe o token para a carga: o diálogo cancela a carga anterior quando o usuário atualiza de novo ou fecha a janela.
- **Menu:** o texto `N:Nome` continua a retornar `N`. Sem o prefixo, o retorno é o índice base 0. Cancelado é -1. As teclas 1 a 9 escolhem a opção.
- **`DlgAguarde`:** abra com `using`. O botão Cancelar aparece só com um `CancellationTokenSource`. A janela pai fica bloqueada até o fechamento.
- **Posição de janela:** `-cursor` usa a janela ativa ou o monitor primário, não a posição do cursor. O novo não tem `OcultarBarraDeTarefas` nem as funções da barra de tarefas.
- **Textos:** os textos dos diálogos vêm dos `.resx` da biblioteca (pt, en, es) pela `CultureInfo.CurrentUICulture`. O novo não usa `GerenciadorDeTraducoes`.
- **Copiar:** `DlgMsg` e `DlgErro` têm um botão só com ícone no canto superior direito e o atalho Ctrl+C. `OpcoesDlgMsg.MostrarBotaoCopiar = false` esconde o botão.
