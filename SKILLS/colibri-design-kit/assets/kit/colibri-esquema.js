/*
 * Colibri UI — esquema de cores por canal (perfil Operação).
 *
 * O lojista escolhe três sementes (ambiente, ação e, opcional, marca); este módulo deriva os tokens
 * --ct-* em hex, garante o contraste ajustando a luminosidade (nunca só avisa) e decide o modo
 * (claro ou escuro). As cores de estado (sucesso, aviso, erro) não são configuráveis: são os tokens
 * de colibri-base.css do modo decidido, emitidos também como --ct-*.
 *
 * Uma implementação só: a prévia do admin e o app em execução usam este arquivo.
 * Sintaxe ES2019, sem dependências (piso Chrome 101). Saída sempre em hex (#rrggbb).
 * Regras de uso: ver DESIGN.md do kit, seção "Perfil Operação".
 */

export const ESQUEMA_VERSAO = 'colibri-esquema/1';

/* Esquema padrão Colibri (sem configuração do lojista). */
export const ESQUEMA_PADRAO = { ambiente: '#0b1822', acao: '#1b6ec2', marca: null };

/* Estados da base (tokens --cm-success, -soft, -line etc. de colibri-base.css), por modo.
 * Emitidos como --ct-* para a prévia funcionar dentro de um contêiner, e usados para validar o
 * contraste das superfícies derivadas. scripts/verificar-esquema.mjs confere que são iguais à base. */
export const ESTADOS_BASE = {
    light: {
        success: '#1a7549', 'success-soft': '#e6f4ec', 'success-line': '#bfe0cd',
        warning: '#875800', 'warning-soft': '#fdf1d8', 'warning-line': '#f0d9a6',
        danger: '#b02637', 'danger-soft': '#fbe9eb', 'danger-line': '#f1c4ca'
    },
    dark: {
        success: '#4cc38a', 'success-soft': '#0f2e24', 'success-line': '#1d4f3c',
        warning: '#e2ae4a', 'warning-soft': '#2f2511', 'warning-line': '#5a4219',
        danger: '#f27d89', 'danger-soft': '#3a1920', 'danger-line': '#63303a'
    }
};

export const CONTRASTE = { texto: 4.5, componente: 3 };

/* ---------- Conversões (sRGB <-> OKLab/OKLCH) ---------- */

function hexParaRgb(hex) {
    var h = String(hex).trim().replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('Cor inválida: ' + hex + ' (use #rgb ou #rrggbb).');
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

function rgbParaHex(rgb) {
    return '#' + rgb.map(function (v) {
        var n = Math.round(Math.min(1, Math.max(0, v)) * 255);
        return (n < 16 ? '0' : '') + n.toString(16);
    }).join('');
}

function paraLinear(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function deLinear(v) { return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }

function rgbParaOklch(rgb) {
    var r = paraLinear(rgb[0]), g = paraLinear(rgb[1]), b = paraLinear(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var C = Math.sqrt(A * A + B * B);
    var H = C < 1e-4 ? 0 : (Math.atan2(B, A) * 180 / Math.PI + 360) % 360;
    return { l: L, c: C, h: H };
}

function oklchParaRgbBruto(o) {
    var a = o.c * Math.cos(o.h * Math.PI / 180), b = o.c * Math.sin(o.h * Math.PI / 180);
    var l = Math.pow(o.l + 0.3963377774 * a + 0.2158037573 * b, 3);
    var m = Math.pow(o.l - 0.1055613458 * a - 0.0638541728 * b, 3);
    var s = Math.pow(o.l - 0.0894841775 * a - 1.2914855480 * b, 3);
    return [
        deLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        deLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        deLinear(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    ];
}

function dentroDoGamut(rgb) { return rgb.every(function (v) { return v >= -1e-4 && v <= 1 + 1e-4; }); }

/* OKLCH -> hex, reduzindo o croma até caber no sRGB (mantém luminosidade e matiz). */
function oklchParaHex(o) {
    var l = Math.min(1, Math.max(0, o.l));
    var c = Math.max(0, o.c);
    var rgb = oklchParaRgbBruto({ l: l, c: c, h: o.h });
    if (!dentroDoGamut(rgb)) {
        var lo = 0, hi = c;
        for (var i = 0; i < 24; i++) {
            var mid = (lo + hi) / 2;
            if (dentroDoGamut(oklchParaRgbBruto({ l: l, c: mid, h: o.h }))) lo = mid; else hi = mid;
        }
        rgb = oklchParaRgbBruto({ l: l, c: lo, h: o.h });
    }
    return rgbParaHex(rgb);
}

function oklch(hex) { return rgbParaOklch(hexParaRgb(hex)); }

/* ---------- Contraste (WCAG 2.x) ---------- */

function luminancia(hex) {
    var rgb = hexParaRgb(hex).map(paraLinear);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function contraste(a, b) {
    var la = luminancia(a), lb = luminancia(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function contrasteMinimo(cor, fundos) {
    return fundos.reduce(function (min, f) { return Math.min(min, contraste(cor, f)); }, Infinity);
}

/* Move a luminosidade de `base` (OKLCH) na direção `dir` (+1 clareia, -1 escurece) até `ok(hex)`.
 * Devolve o primeiro valor que passa; se nenhum passar, o extremo da direção. */
function ajustarLuminosidade(base, dir, ok) {
    var hex = oklchParaHex(base);
    if (ok(hex)) return hex;
    for (var passo = 1; passo <= 100; passo++) {
        var l = base.l + dir * passo * 0.01;
        if (l < 0 || l > 1) break;
        hex = oklchParaHex({ l: l, c: base.c, h: base.h });
        if (ok(hex)) return hex;
    }
    return oklchParaHex({ l: dir > 0 ? 1 : 0, c: 0, h: base.h });
}

/* ---------- Derivação ---------- */

function normalizar(sementes) {
    var s = sementes || {};
    return {
        ambiente: rgbParaHex(hexParaRgb(s.ambiente || ESQUEMA_PADRAO.ambiente)),
        acao: rgbParaHex(hexParaRgb(s.acao || ESQUEMA_PADRAO.acao)),
        marca: s.marca ? rgbParaHex(hexParaRgb(s.marca)) : null
    };
}

/* Decide o modo pelo lado em que o ambiente tem mais contraste: texto claro (escuro) ou escuro (claro). */
function decidirModo(ambiente) {
    return contraste(ambiente, '#ffffff') >= contraste(ambiente, '#111111') ? 'dark' : 'light';
}

/* Escada dos neutros a partir do fundo, tirada dos temas do kit (colibri-base.css): com o
 * plano do tema escuro (#0b1822) ou do claro (#f2f5f9) como ambiente, o motor devolve os
 * tokens --cm-* desses temas; com outro ambiente, a mesma escada no matiz dele.
 * Superfícies e linhas: degrau de luminosidade (l), croma proporcional ao do fundo (c) e
 * desvio de matiz (h). Textos: luminosidade fixa (abs). Croma limitado para cores fortes. */
var RAMPA = {
    dark: {
        surface: { l: 0.0414, c: 1.24, h: -0.1 },
        'surface-2': { l: 0.0663, c: 1.43, h: 2.5 },
        line: { l: 0.1354, c: 1.65, h: 0.7 },
        ink: { abs: 0.9335, c: 0.41, h: 0.8 },
        'ink-2': { abs: 0.7829, c: 0.86, h: 5.2 },
        'ink-3': { abs: 0.6847, c: 1.12, h: 3.7 }
    },
    light: {
        surface: { l: 0.031, c: 0, h: 0 },
        'surface-2': { l: 0.0095, c: 0.73, h: 2.8 },
        line: { l: -0.0588, c: 1.85, h: -3.4 },
        ink: { abs: 0.2689, c: 4.29, h: -2.2 },
        'ink-2': { abs: 0.4522, c: 4.66, h: -1.4 },
        'ink-3': { abs: 0.544, c: 3.92, h: -2.9 }
    }
};

function neutros(bg, modo) {
    var o = oklch(bg), rampa = RAMPA[modo], n = { bg: bg };
    Object.keys(rampa).forEach(function (k) {
        var p = rampa[k], texto = p.abs !== undefined;
        n[k] = oklchParaHex({
            l: texto ? p.abs : o.l + p.l,
            c: Math.min(o.c * p.c, texto ? 0.035 : 0.08),
            h: o.h + p.h
        });
    });
    return n;
}

function textosDoModo(n, modo) {
    return [n.ink, n['ink-2'], n['ink-3']].concat(['success', 'warning', 'danger'].map(function (k) { return ESTADOS_BASE[modo][k]; }));
}

/* Ambiente: escurece (escuro) ou clareia (claro) o fundo até todos os textos e estados terem 4,5:1
 * sobre fundo e superfícies. Matiz e croma do lojista são mantidos. */
function derivarAmbiente(ambiente, modo) {
    var o = oklch(ambiente), dir = modo === 'dark' ? -1 : 1, n = neutros(ambiente, modo);
    for (var passo = 0; passo <= 100; passo++) {
        var l = o.l + dir * passo * 0.01;
        if (l < 0 || l > 1) break;
        n = neutros(passo === 0 ? ambiente : oklchParaHex({ l: l, c: o.c, h: o.h }), modo);
        var fundos = [n.bg, n.surface, n['surface-2']];
        if (textosDoModo(n, modo).every(function (t) { return contrasteMinimo(t, fundos) >= CONTRASTE.texto; })) return n;
    }
    return neutros(modo === 'dark' ? '#000000' : '#ffffff', modo);
}

/* Cor de preenchimento (ação ou marca) com o texto sobre ela (on-*):
 * preenchimento com 3:1 sobre o fundo e as superfícies; texto com 4,5:1 sobre o preenchimento. */
function derivarPreenchimento(semente, n, modo) {
    var o = oklch(semente), fundos = [n.bg, n.surface, n['surface-2']];
    var claro = oklchParaHex({ l: 0.985, c: Math.min(o.c, 0.01), h: o.h });
    var escuro = oklchParaHex({ l: 0.2, c: Math.min(o.c, 0.04), h: o.h });
    function textoSobre(cor) { return contraste(claro, cor) >= contraste(escuro, cor) ? claro : escuro; }
    function ok(cor) {
        return contrasteMinimo(cor, fundos) >= CONTRASTE.componente && contraste(textoSobre(cor), cor) >= CONTRASTE.texto;
    }
    var dir = modo === 'dark' ? 1 : -1;
    var cor = ajustarLuminosidade(o, dir, ok);
    if (!ok(cor)) cor = ajustarLuminosidade(o, -dir, ok);
    var oc = oklch(cor);
    var on = textoSobre(cor);
    /* Pressionado: 6 pontos de luminosidade na direção que afasta do texto (o contraste só aumenta). */
    var pressionado = oklchParaHex({ l: oc.l + (on === claro ? -0.06 : 0.06), c: oc.c, h: oc.h });
    return { cor: cor, on: on, pressionado: pressionado };
}

/* Texto na cor da semente (link, preço, ícone ativo) com 4,5:1 sobre fundo e superfícies
 * (e sobre os fundos extras, como o suave da seleção). */
function derivarTinta(semente, n, modo, extras) {
    var fundos = [n.bg, n.surface, n['surface-2']].concat(extras || []);
    return ajustarLuminosidade(oklch(semente), modo === 'dark' ? 1 : -1, function (cor) {
        return contrasteMinimo(cor, fundos) >= CONTRASTE.texto;
    });
}

/* Mistura por canal em sRGB (gama), para fundos suaves e bordas: `peso` de `a` sobre `b`.
 * Em sRGB a cor clara não domina a mistura, como aconteceria em RGB linear. */
function misturar(a, b, peso) {
    var ra = hexParaRgb(a), rb = hexParaRgb(b);
    return rgbParaHex(ra.map(function (v, i) { return v * peso + rb[i] * (1 - peso); }));
}

function registrarAjuste(ajustes, token, pedido, obtido, motivo) {
    if (pedido.toLowerCase() !== obtido.toLowerCase()) ajustes.push({ token: token, pedido: pedido, obtido: obtido, motivo: motivo });
}

/**
 * Deriva o esquema a partir das sementes.
 * @param {{ambiente?: string, acao?: string, marca?: string|null}} sementes
 * @returns {{versao: string, modo: 'light'|'dark', sementes: object, tokens: Object<string,string>, ajustes: Array}}
 */
export function derivarEsquema(sementes) {
    var s = normalizar(sementes);
    var modo = decidirModo(s.ambiente);
    var ajustes = [];
    var n = derivarAmbiente(s.ambiente, modo);
    registrarAjuste(ajustes, '--ct-bg', s.ambiente, n.bg, 'fundo ajustado para os textos e estados terem 4,5:1');

    var acao = derivarPreenchimento(s.acao, n, modo);
    registrarAjuste(ajustes, '--ct-action', s.acao, acao.cor, 'ação ajustada para 3:1 sobre o fundo e 4,5:1 no texto do botão');
    /* Fundo suave da seleção: a mistura diminui até o texto e o texto de apoio terem 4,5:1 sobre ele. */
    var acaoSuave = n.surface;
    for (var peso = modo === 'dark' ? 0.16 : 0.12; peso >= 0.04; peso -= 0.02) {
        var suave = misturar(acao.cor, n.surface, peso);
        if (contrasteMinimo(n.ink, [suave]) >= CONTRASTE.texto && contrasteMinimo(n['ink-2'], [suave]) >= CONTRASTE.texto) { acaoSuave = suave; break; }
    }
    var acaoTinta = derivarTinta(s.acao, n, modo, [acaoSuave]);

    var marcaSemente = s.marca || s.acao;
    var marca = s.marca ? derivarPreenchimento(s.marca, n, modo) : acao;
    if (s.marca) registrarAjuste(ajustes, '--ct-brand', s.marca, marca.cor, 'marca ajustada para 3:1 sobre o fundo e 4,5:1 no texto do selo');
    var marcaTinta = derivarTinta(marcaSemente, n, modo);
    registrarAjuste(ajustes, '--ct-brand-ink', marcaSemente, marcaTinta, 'texto da marca (nome, preço) ajustado para 4,5:1 sobre as superfícies');

    var tokens = {
        '--ct-bg': n.bg,
        '--ct-surface': n.surface,
        '--ct-surface-2': n['surface-2'],
        '--ct-line': n.line,
        '--ct-ink': n.ink,
        '--ct-ink-2': n['ink-2'],
        '--ct-ink-3': n['ink-3'],
        '--ct-disabled-ink': misturar(n['ink-3'], n['surface-2'], 0.55),
        '--ct-action': acao.cor,
        '--ct-on-action': acao.on,
        '--ct-action-pressed': acao.pressionado,
        '--ct-action-ink': acaoTinta,
        '--ct-action-soft': acaoSuave,
        '--ct-action-line': misturar(acao.cor, n.surface, modo === 'dark' ? 0.55 : 0.4),
        '--ct-brand': marca.cor,
        '--ct-on-brand': marca.on,
        '--ct-brand-ink': marcaTinta,
        '--ct-focus': acaoTinta
    };
    Object.keys(ESTADOS_BASE[modo]).forEach(function (k) { tokens['--ct-' + k] = ESTADOS_BASE[modo][k]; });
    return { versao: ESQUEMA_VERSAO, modo: modo, sementes: s, tokens: tokens, ajustes: ajustes };
}

/**
 * Aplica o esquema: grava os tokens --ct-* no elemento e data-ct-mode nele.
 * Sem `alvo` (o app em execução), grava no <html> e também data-theme, para as sombras, o véu e o
 * color-scheme da base acompanharem o modo. Com `alvo` (prévia do admin), não mexe no tema da página.
 * Com `esquema` nulo, remove os tokens e data-ct-mode: o elemento volta aos --ct-* padrão (= --cm-*).
 * O data-theme do <html> fica como está; o tema Colibri (claro ou escuro) é decisão do app.
 */
export function aplicarEsquema(esquema, alvo) {
    var raiz = typeof document !== 'undefined' ? document.documentElement : null;
    var el = alvo || raiz;
    if (!el) return;
    var anterior = el.getAttribute('data-ct-tokens');
    if (anterior) anterior.split(' ').forEach(function (t) { el.style.removeProperty(t); });
    if (!esquema) {
        el.removeAttribute('data-ct-tokens');
        el.removeAttribute('data-ct-mode');
        return;
    }
    Object.keys(esquema.tokens).forEach(function (t) { el.style.setProperty(t, esquema.tokens[t]); });
    el.setAttribute('data-ct-tokens', Object.keys(esquema.tokens).join(' '));
    el.setAttribute('data-ct-mode', esquema.modo);
    if (!alvo && raiz) raiz.setAttribute('data-theme', esquema.modo);
}
