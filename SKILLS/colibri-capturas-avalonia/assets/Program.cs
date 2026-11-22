// Gerador de capturas das telas Avalonia, sem monitor (headless com Skia).
// Uso: <AssemblyName>.exe "<pasta de saída>"
// Os itens marcados com AJUSTE mudam por projeto. O resto é a infraestrutura comum.
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Headless;
using Avalonia.Styling;
using Avalonia.Threading;
// AJUSTE: os namespaces das telas. Use um alias quando 2 namespaces têm a mesma classe:
// using DlgAguarde = CoLib.Payment.Ui.DlgAguarde;
using CoLib.Payment.Configurador;
using CoLib.Payment.Ui;
using CoLib.Ui.Avalonia.Dialogos;
using Microsoft.Extensions.Logging.Abstractions;

var saida = args.Length > 0 ? args[0] : Path.Combine(AppContext.BaseDirectory, "png");
Directory.CreateDirectory(saida);

// UseHeadlessDrawing = false: sem isso o Skia não desenha e o frame vem vazio.
AppBuilder.Configure<AppCapturas>()
    .UseSkia()
    .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false })
    .SetupWithoutStarting();

// AJUSTE: só para telas que leem o banco ou a instalação local.
CoLib.Ambiente.PastasDoSistema.Base = @"D:\projetos\sistema colibri";

foreach (var (tema, sufixo) in new[] { (ThemeVariant.Light, "claro"), (ThemeVariant.Dark, "escuro") })
{
    Application.Current!.RequestedThemeVariant = tema;
    Processar();

    // AJUSTE: 1 bloco por tela. Os 3 exemplos abaixo mostram os 3 modos de abrir uma tela.

    // Modo 1: método estático que cria e mostra a janela. Sem await: a tarefa só termina quando a janela fecha.
    _ = MsgPayment.MostrarAsync("Confirma o cancelamento da transação?", BotoesMsg.SimNao, titulo: "Payment");
    Capturar<DlgMsg>($"01-mensagem-{sufixo}");
    FecharTodas();

    // Modo 2: construtor público e método de exibição, com estados internos (abas) mudados antes de cada captura.
    var form = new FormConfig(NullLoggerFactory.Instance) { TefVisivel = true, ShipayVisivel = true, PixVisivel = true };
    _ = form.ExecutarAsync(JanelaPai.Nenhuma);
    Capturar<FormConfig>($"02-config-tef-{sufixo}");
    form.Abas.SelectedItem = form.AbaPix;
    Capturar<FormConfig>($"03-config-pix-{sufixo}");
    FecharTodas();

    // Modo 3: construtor internal de teste com dados falsos e Show().
    var config = new CoLib.Payment.Config.Configuracao(NullLoggerFactory.Instance);
    var carteiras = new FormCarteirasShipay(NullLoggerFactory.Instance, config, new() { [9] = "PicPay" },
        static () => Task.FromResult<string?>("""{"wallets":[{"name":"pix"},{"name":"picpay"}]}"""));
    carteiras.Show();
    Capturar<FormCarteirasShipay>($"04-config-carteiras-{sufixo}");
    FecharTodas();
}

Console.WriteLine($"Capturas em {saida}");
return;

// RunJobs aplica o layout; ForceRenderTimerTick desenha o frame. Algumas voltas garantem o frame atual.
void Processar()
{
    for (var i = 0; i < 5; i++)
    {
        Dispatcher.UIThread.RunJobs();
        AvaloniaHeadlessPlatform.ForceRenderTimerTick();
        Thread.Sleep(30);
    }
}

void Capturar<T>(string nome) where T : Window
{
    Processar();
    var janela = Desktop().Windows.OfType<T>().LastOrDefault(static w => w.IsVisible);
    if (janela is null)
    {
        Console.WriteLine($"{nome}: {typeof(T).Name} não abriu");
        return;
    }

    // Sem monitor, uma janela maximizada não tem tamanho definido.
    if (janela.WindowState == WindowState.Maximized)
    {
        janela.WindowState = WindowState.Normal;
        janela.Width = 1280;
        janela.Height = 720;
    }

    Processar();
    var frame = janela.CaptureRenderedFrame();
    if (frame is null)
    {
        Console.WriteLine($"{nome}: sem frame");
        return;
    }

    frame.Save(Path.Combine(saida, nome + ".png"), Avalonia.Media.Imaging.PngBitmapEncoderOptions.Default);
    Console.WriteLine($"{nome}: {frame.PixelSize}");
}

void FecharTodas()
{
    foreach (var w in Desktop().Windows.Reverse().ToList())
        w.Close();
    Processar();
}

static IClassicDesktopStyleApplicationLifetime Desktop()
    => (IClassicDesktopStyleApplicationLifetime)Application.Current!.ApplicationLifetime!;

public sealed class AppCapturas : Application
{
    public override void RegisterServices()
    {
        ApplicationLifetime = new LifetimeCapturas();
        base.RegisterServices();
    }

    // AJUSTE: o carregamento do tema do projeto. Sem um carregador próprio, use o padrão da biblioteca:
    //   Styles.Add(new Avalonia.Themes.Fluent.FluentTheme());
    //   Styles.Add(new Avalonia.Markup.Xaml.Styling.StyleInclude(new Uri("avares://Capturas/"))
    //       { Source = new Uri("avares://CoLib.Ui.Avalonia/Tema/TemaColibri.axaml") });
    public override void Initialize() => AplicacaoPayment.CarregarTema(this);
}

// Lifetime desktop com a lista de janelas abertas: o JanelaModal e o Capturar usam essa lista.
internal sealed class LifetimeCapturas : ClassicDesktopStyleApplicationLifetime, IClassicDesktopStyleApplicationLifetime
{
    private readonly List<Window> _janelas = [];

    public LifetimeCapturas()
    {
        ShutdownMode = ShutdownMode.OnExplicitShutdown;
        Window.WindowOpenedEvent.AddClassHandler(typeof(Window), (j, _) => { if (j is Window w && !_janelas.Contains(w)) _janelas.Add(w); });
        Window.WindowClosedEvent.AddClassHandler(typeof(Window), (j, _) => { if (j is Window w) _janelas.Remove(w); });
    }

    IReadOnlyList<Window> IClassicDesktopStyleApplicationLifetime.Windows => _janelas;
}
