/*
 * Colibri UI — esquema de cores por canal (perfil Operação).
 *
 * O lojista escolhe três sementes (ambiente, ação e, opcional, marca); este módulo deriva os tokens
 * --ct-* em hex, garante o contraste ajustando a luminosidade (nunca só avisa) e decide o modo
 * (claro ou escuro). As cores de estado (sucesso, aviso, erro) não são configuráveis: são os tokens
 * de colibri-base.css do modo decidido, emitidos também como --ct-*.
 *
 * No perfil Cards, a cor de cada estado do card (e o fundo do painel) pode ser livre do lojista; a tinta,
 * o véu e o respiro sobre ela saem daqui (tintaSobre, veuSobre, respiroDe), nunca da escolha dele, para o
 * texto do card ter 4,5:1 ou mais com qualquer cor.
 *
 * Uma implementação só: a prévia do admin e o app em execução usam este arquivo.
 * Sintaxe ES2019, sem dependências (piso Chrome 101). Saída sempre em hex (#rrggbb), menos o véu (rgba).
 * Regras de uso: ver DESIGN.md do kit, seções "Perfil Operação" e "Perfil Cards".
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
 * @param {'light'|'dark'} [modoForcado] claro ou escuro escolhido (ex.: pelo cliente no cardápio); sem ele, o modo
 *   sai da luminância do ambiente. Os neutros vêm do ambiente e o contraste é garantido nos dois modos.
 * @returns {{versao: string, modo: 'light'|'dark', sementes: object, tokens: Object<string,string>, ajustes: Array}}
 */
export function derivarEsquema(sementes, modoForcado) {
    var s = normalizar(sementes);
    var modo = (modoForcado === 'light' || modoForcado === 'dark') ? modoForcado : decidirModo(s.ambiente);
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

/* ---------- Card de cor livre (perfil Cards) ----------
 * A cor do estado (ou do card) é do lojista; o que vai sobre ela é calculado. Os padrões do kit (espera
 * azul, atenção âmbar, atraso vermelho) já trazem tinta branca e o respiro calibrado em colibri-cards.css;
 * estas funções são para a cor que o lojista escolhe. Mesma lógica do painel de chamados do ColibriTablet
 * (corDoTexto e corDoRespiro), com a tinta de reserva para as cores médias. */

/* Tintas do card: branco, o texto principal do tema claro (--cm-ink) e, de reserva, o preto. Branco e
 * --cm-ink não chegam a 4,5:1 nas cores médias (vermelho puro, cinza médio: perto de 4:1); com o preto,
 * uma das duas pontas sempre passa (o pior caso, entre branco e preto, tem 4,58:1). */
var TINTA_CLARA = '#ffffff';
var TINTA_ESCURA = '#1d2733';
var TINTA_RESERVA = '#000000';

/* Véu sob a faixa de urgência e os selos: escurece sob tinta clara e clareia sob tinta escura (o contraste
 * do texto só aumenta). Alfa fixo, e não color-mix() com variável (piso Chrome 101). */
var VEU_ESCURO = 'rgba(0, 0, 0, .24)';
var VEU_CLARO = 'rgba(255, 255, 255, .45)';

/* Quanto o respiro pode puxar a cor do card para o preto ou o branco. */
var RESPIRO_MAXIMO = 0.45;

/**
 * Tinta (texto e ícones) sobre a cor de um card: o branco ou o texto principal do kit, o que tiver mais
 * contraste; se nenhum dos dois chegar a 4,5:1, o preto.
 * @param {string} fundo cor do card (#rgb ou #rrggbb)
 * @returns {string} '#ffffff', '#1d2733' ou '#000000'
 */
export function tintaSobre(fundo) {
    var f = rgbParaHex(hexParaRgb(fundo));
    var tinta = contraste(TINTA_CLARA, f) >= contraste(TINTA_ESCURA, f) ? TINTA_CLARA : TINTA_ESCURA;
    return contraste(tinta, f) >= CONTRASTE.texto ? tinta : TINTA_RESERVA;
}

/**
 * Véu da faixa de urgência e dos selos sobre a cor de um card: escuro sob tinta branca, claro sob tinta
 * escura.
 * @param {string} fundo cor do card (#rgb ou #rrggbb)
 * @returns {string} 'rgba(0, 0, 0, .24)' ou 'rgba(255, 255, 255, .45)'
 */
export function veuSobre(fundo) {
    return tintaSobre(fundo) === TINTA_CLARA ? VEU_ESCURO : VEU_CLARO;
}

/**
 * Cor do respiro do estado mais grave: o card vai e volta entre a sua cor e esta. É a mesma cor puxada
 * para o preto ou para o branco (até 45%), o lado que mais se destaca dela sem deixar a tinta do card
 * abaixo de 4,5:1.
 * @param {string} fundo cor do card (#rgb ou #rrggbb)
 * @returns {string} hex (#rrggbb)
 */
export function respiroDe(fundo) {
    var f = rgbParaHex(hexParaRgb(fundo));
    var tinta = tintaSobre(f);
    return ['#000000', '#ffffff'].map(function (alvo) {
        for (var peso = RESPIRO_MAXIMO; peso > 0.01; peso -= 0.01) {
            var cor = misturar(alvo, f, peso);
            if (contraste(tinta, cor) >= CONTRASTE.texto) return cor;
        }
        return f;
    }).reduce(function (melhor, cor) { return contraste(f, cor) > contraste(f, melhor) ? cor : melhor; });
}

/* ---------- Acabamento de vidro (telas de consumidor: tablet, totem e vitrine web) ----------
 * O vidro é a superfície translúcida sobre um fundo (a marca Colibri ou a imagem do lojista). O texto sobre
 * ele precisa de 4,5:1 sobre o pior ponto do fundo, já desfocado e filtrado como o vidro o mostra. Daqui sai
 * o vidro (claro ou escuro), a menor opacidade com que todos os textos passam e os textos de ação e de marca
 * ajustados para o vidro. Os textos de apoio são tons próprios do vidro, mais próximos do principal: com o
 * cinza médio de sempre, o vidro precisaria de 80% a 94% de opacidade e deixaria de ser vidro. */
export const VIDROS = {
    escuro: { classe: 'ct-app--vidro-escuro', tema: 'dark', tinta: '#0c1824', direcao: 1, acao: '#a9d2f8',
        textos: { '--ct-vidro-ink': '#f4f7fa', '--ct-vidro-ink-2': '#d3dae1', '--ct-vidro-ink-3': '#c3ccd5' } },
    claro: { classe: 'ct-app--vidro-claro', tema: 'light', tinta: '#ffffff', direcao: -1, acao: '#0a3b70',
        textos: { '--ct-vidro-ink': '#16202a', '--ct-vidro-ink-2': '#26313c', '--ct-vidro-ink-3': '#2c3742' } }
};
/* Folga sobre 4,5:1 (as amostras são uma grade, não todos os pixels) e limites da opacidade: abaixo de 22%,
 * o vidro deixa de se ler como superfície, mesmo com o contraste garantido. */
var VIDRO_FOLGA = 0.1;
var VIDRO_MINIMO = 0.22;
var VIDRO_MINIMO_ECONOMICO = 0.3;
var VIDRO_MAXIMO = 0.95;

function amostrasUnicas(amostras) {
    var vistos = {}, r = [];
    amostras.forEach(function (c) { var h = rgbParaHex(hexParaRgb(c)); if (!vistos[h]) { vistos[h] = 1; r.push(h); } });
    return r;
}

/* Para um vidro e uma opacidade: os textos fixos passam? E até onde a ação e a marca precisam ir? */
function provarVidro(v, a, fundos, acoes) {
    var vidros = fundos.map(function (f) { return misturar(v.tinta, f, a); });
    var minimo = CONTRASTE.texto + VIDRO_FOLGA;
    var ok = function (hex) { return contrasteMinimo(hex, vidros) >= minimo; };
    if (!Object.keys(v.textos).every(function (k) { return ok(v.textos[k]); })) return null;
    var ajustadas = acoes.map(function (c) { return ajustarLuminosidade(oklch(c), v.direcao, ok); });
    return ajustadas.every(ok) ? ajustadas : null;
}

/**
 * Vidro sobre um fundo: escolhe o vidro (claro ou escuro) que fica mais aberto, ou o que o lojista escolheu, com a
 * menor opacidade em que todos os textos têm 4,5:1 sobre todas as amostras. Se nem 95% bastar, devolve 95%.
 * @param {string[]} amostras cores do fundo como o vidro o vê (desfocado, com saturate(1.8) brightness(1.08);
 *   no modo econômico, nítido), numa grade sobre a área toda; ou 'marca-escura' / 'marca-clara', os fundos do kit
 * @param {object} [esquema] o esquema do canal (derivarEsquema): a ação e a marca dele são ajustadas para o vidro
 * @param {{ economico?: boolean, modo?: 'escuro'|'claro' }} [opcoes] economico: sem desfoque ao vivo (fundo nítido; piso
 *   visual de 30%, e não 22%); modo: o vidro escolhido pelo lojista no admin (sem ele, o que fica mais aberto)
 * @returns {{ modo: 'escuro'|'claro', tema: 'dark'|'light', classe: string, opacidade: number, tokens: object }}
 *   grave os tokens no contêiner .ct-app junto da classe; passe `tema` a derivarEsquema para os estados
 */
export function derivarVidro(amostras, esquema, opcoes) {
    var fundo = typeof amostras === 'string' ? FUNDOS_DO_VIDRO[amostras] : null;
    if (typeof amostras === 'string' && !fundo) throw new Error('Fundo de vidro desconhecido: ' + amostras);
    var fundos = amostrasUnicas(fundo ? fundo[opcoes && opcoes.economico ? 'economico' : 'vivo'] : amostras);
    if (!fundos.length) throw new Error('derivarVidro: sem amostras do fundo');
    var t = esquema && esquema.tokens ? esquema.tokens : null;
    var melhor = null;
    var forcado = opcoes && (opcoes.modo === 'escuro' || opcoes.modo === 'claro') ? opcoes.modo : null;
    (forcado ? [forcado] : ['escuro', 'claro']).forEach(function (nome) {
        var v = VIDROS[nome];
        var acoes = [t ? t['--ct-action-ink'] : v.acao, t ? t['--ct-brand-ink'] : v.acao];
        for (var p = Math.round((opcoes && opcoes.economico ? VIDRO_MINIMO_ECONOMICO : VIDRO_MINIMO) * 100); p <= Math.round(VIDRO_MAXIMO * 100); p++) {
            var r = provarVidro(v, p / 100, fundos, acoes);
            if (r) { if (!melhor || p / 100 < melhor.opacidade) melhor = { nome: nome, opacidade: p / 100, acoes: r }; return; }
        }
    });
    if (!melhor) { var reserva = forcado || 'escuro'; melhor = { nome: reserva, opacidade: VIDRO_MAXIMO, acoes: [VIDROS[reserva].acao, VIDROS[reserva].acao] }; }
    var v = VIDROS[melhor.nome], acao = hexParaRgb(melhor.acoes[0]).map(function (c) { return Math.round(c * 255); });
    var tokens = {
        '--ct-vidro-a': String(melhor.opacidade),
        '--ct-vidro-a2': String(Math.min(VIDRO_MAXIMO + 0.02, Math.round((melhor.opacidade + 0.08) * 100) / 100)),
        '--ct-vidro-acao': melhor.acoes[0],
        '--ct-vidro-marca': melhor.acoes[1],
        '--ct-vidro-acao-suave': 'rgba(' + acao.join(', ') + ', ' + (melhor.nome === 'escuro' ? '.16' : '.14') + ')'
    };
    return { modo: melhor.nome, tema: v.tema, classe: v.classe, opacidade: melhor.opacidade, tokens: tokens };
}

/* Fundos do vidro da marca Colibri (.ct-app--vidro-escuro e --vidro-claro em colibri-touch.css): as 24 cores mais
 * escuras e as 24 mais claras de cada fundo, medidas no navegador em seis telas (390×844 a 1920×1080), como o vidro
 * as vê (vivo: desfocadas e filtradas; economico: nítidas). Mudou o fundo no CSS, meça de novo. */
var FUNDOS_DO_VIDRO = {
    'marca-escura': {
        vivo: [
            '#001636', '#001637', '#001837', '#001839', '#00183b', '#001938', '#00193a', '#00193c',
            '#001a39', '#00193e', '#001a3a', '#001a3b', '#001a3d', '#001b3a', '#021b39', '#041b38',
            '#001a3f', '#001b3c', '#001b3d', '#001c39', '#001b3e', '#001c3b', '#051c38', '#071c37',
            '#00769b', '#146dca', '#007795', '#007798', '#046fc6', '#007891', '#106ec9', '#086fc6',
            '#016fc7', '#026fc7', '#00779a', '#007893', '#086fc8', '#007990', '#007992', '#0770c7',
            '#0570c8', '#007994', '#0271c6', '#007a93', '#007a95', '#007b93', '#007b94', '#007b95'
        ],
        economico: [
            '#02101f', '#021020', '#021120', '#021121', '#021122', '#021221', '#021222', '#021223',
            '#021322', '#021323', '#031322', '#021324', '#031323', '#021325', '#021424', '#021425',
            '#031424', '#021426', '#031425', '#021427', '#041426', '#061424', '#081423', '#0a1421',
            '#6e6e7b', '#6f6e79', '#6e6e7c', '#6f6e7a', '#6f6e7b', '#736e72', '#6f6f79', '#706f78',
            '#716f76', '#706f79', '#716f77', '#726f75', '#716f78', '#726f76', '#727075', '#737074',
            '#737075', '#747073', '#747172', '#747173', '#757171', '#767170', '#767171', '#77716f'
        ]
    },
    'marca-clara': {
        vivo: [
            '#79b1ff', '#7bb1ff', '#77b2ff', '#73b3ff', '#75b3ff', '#7cb2ff', '#77b3ff', '#78b3ff',
            '#7eb2ff', '#74b4ff', '#7ab3ff', '#6fb5ff', '#76b4ff', '#71b5ff', '#7db3ff', '#78b4ff',
            '#73b5ff', '#6db6ff', '#79b4ff', '#7fb3ff', '#6eb6ff', '#7ab4ff', '#75b5ff', '#7bb4ff',
            '#e1e9f6', '#dceafa', '#dbeafe', '#dceafc', '#deeaf8', '#dceafd', '#deeaf9', '#deeafb',
            '#e0eaf7', '#daebfd', '#e0eaf9', '#dcebfd', '#dcebff', '#ddebfd', '#deebfb', '#dfebfb',
            '#dbecff', '#ddecfc', '#ddecfe', '#dbedfe', '#daeeff', '#d9efff', '#daefff', '#d9f0ff'
        ],
        economico: [
            '#54a8e3', '#55a8e3', '#56a8e3', '#56a9e2', '#57a9e2', '#56a9e3', '#57a9e3', '#58a9e3',
            '#83a2e2', '#84a2e2', '#84a2e3', '#85a2e2', '#81a3e2', '#58aae3', '#85a2e3', '#86a2e2',
            '#59aae3', '#82a3e2', '#86a2e3', '#5aaae3', '#87a2e2', '#83a3e2', '#5baae3', '#87a2e3',
            '#c7e5ec', '#cce3f3', '#c9e5e8', '#c9e5e9', '#cfe3ee', '#cde3f3', '#cae5e8', '#d0e3ed',
            '#cae5e9', '#cee3f3', '#c7e6ec', '#d4e3eb', '#c9e6ea', '#cae6e9', '#cee4f3', '#cae6ea',
            '#cae6eb', '#cbe6e9', '#cbe6ea', '#cbe7eb', '#cce7ec', '#cce7ed', '#cde7ee', '#cce8ed'
        ]
    }
};
