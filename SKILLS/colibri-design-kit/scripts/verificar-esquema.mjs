// Conferência do motor de esquema do perfil Toque (assets/kit/colibri-esquema.js).
// Uso, na pasta da skill: node scripts/verificar-esquema.mjs
// Sem dependências. Sai com código 1 se alguma verificação falhar.
//
// 1. As constantes de estado do motor são iguais aos tokens --cm-* de colibri-base.css.
// 2. Para uma grade de sementes (claras, escuras, cinzas médios, saturadas, extremas), todo token
//    sai em hex e todo par texto/fundo e preenchimento/fundo atinge o contraste exigido.
// 3. O código não usa APIs acima do piso Chrome 101.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'kit');
const motorPath = join(raiz, 'colibri-esquema.js');
const { derivarEsquema, contraste, ESTADOS_BASE, CONTRASTE } = await import('file://' + motorPath.replace(/\\/g, '/'));

const falhas = [];
const falhar = (msg) => falhas.push(msg);

// 1. Estados = base
const base = readFileSync(join(raiz, 'colibri-base.css'), 'utf8');
function bloco(seletor) {
    const i = base.indexOf(seletor + ' {');
    if (i < 0) throw new Error('Bloco não encontrado em colibri-base.css: ' + seletor);
    return base.slice(i, base.indexOf('}', i));
}
function tokens(texto) {
    const mapa = {};
    for (const m of texto.matchAll(/--cm-([\w-]+):\s*([^;]+);/g)) mapa[m[1]] = m[2].trim().toLowerCase();
    return mapa;
}
const claro = tokens(bloco(':root'));
const escuro = { ...claro, ...tokens(bloco(':root[data-theme="dark"]')) };
for (const [modo, mapa] of [['light', claro], ['dark', escuro]]) {
    for (const [k, v] of Object.entries(ESTADOS_BASE[modo])) {
        if (mapa[k] !== v.toLowerCase()) falhar(`ESTADOS_BASE.${modo}.${k} = ${v}, mas colibri-base.css tem --cm-${k}: ${mapa[k]}`);
    }
}

// 2. Grade de sementes
const ambientes = ['#000000', '#ffffff', '#808080', '#777777', '#5a5a5a', '#c0c0c0', '#0b1120', '#0b1822', '#f2f5f9',
    '#fdf6e3', '#7a1f1f', '#ff0000', '#ffe066', '#1b6ec2', '#2e7d32', '#3b0a45', '#00ffff', '#ff00ff', '#123', '#f80'];
const acoes = ['#f59e0b', '#1b6ec2', '#ffffff', '#000000', '#ff0000', '#808080', '#ffe066', '#6a1b9a', '#00c853', '#0b1120', '#f2f5f9'];
const marcas = [null, '#ff0000', '#004d40', '#ffeb3b', '#ffffff'];
const fundosDe = (t) => [t['--ct-bg'], t['--ct-surface'], t['--ct-surface-2']];
const textos = ['--ct-ink', '--ct-ink-2', '--ct-ink-3', '--ct-action-ink', '--ct-brand-ink', '--ct-success', '--ct-warning', '--ct-danger'];
const preenchimentos = ['--ct-action', '--ct-brand'];
const pares = [['--ct-on-action', '--ct-action'], ['--ct-on-action', '--ct-action-pressed'], ['--ct-on-brand', '--ct-brand'],
    ['--ct-success', '--ct-success-soft'], ['--ct-warning', '--ct-warning-soft'], ['--ct-danger', '--ct-danger-soft']];
let combinacoes = 0;
let comAjuste = 0;
for (const ambiente of ambientes) for (const acao of acoes) for (const marca of marcas) {
    combinacoes++;
    const e = derivarEsquema({ ambiente, acao, marca });
    const t = e.tokens;
    const id = `ambiente ${ambiente}, ação ${acao}, marca ${marca}`;
    if (e.ajustes.length) comAjuste++;
    for (const [k, v] of Object.entries(t)) if (!/^#[0-9a-f]{6}$/.test(v)) falhar(`${id}: ${k} = ${v} não é hex #rrggbb`);
    for (const k of textos) for (const f of fundosDe(t)) {
        const c = contraste(t[k], f);
        if (c < CONTRASTE.texto - 1e-9) falhar(`${id}: ${k} ${t[k]} sobre ${f} = ${c.toFixed(2)}:1 (mínimo ${CONTRASTE.texto})`);
    }
    for (const k of preenchimentos) for (const f of fundosDe(t)) {
        const c = contraste(t[k], f);
        if (c < CONTRASTE.componente - 1e-9) falhar(`${id}: ${k} ${t[k]} sobre ${f} = ${c.toFixed(2)}:1 (mínimo ${CONTRASTE.componente})`);
    }
    // Seleção (opção escolhida, categoria ativa): texto e texto de ação sobre o fundo suave da ação.
    for (const k of ['--ct-ink', '--ct-ink-2', '--ct-action-ink']) {
        const c = contraste(t[k], t['--ct-action-soft']);
        if (c < CONTRASTE.texto - 1e-9) falhar(`${id}: ${k} sobre --ct-action-soft = ${c.toFixed(2)}:1 (mínimo ${CONTRASTE.texto})`);
    }
    for (const [a, b] of pares) {
        const c = contraste(t[a], t[b]);
        if (c < CONTRASTE.texto - 1e-9) falhar(`${id}: ${a} sobre ${b} = ${c.toFixed(2)}:1 (mínimo ${CONTRASTE.texto})`);
    }
}

// Esquema padrão = tema escuro Colibri: o fundo não pode ser ajustado.
const padrao = derivarEsquema({});
if (padrao.tokens['--ct-bg'] !== '#0b1822') falhar(`Esquema padrão: --ct-bg ${padrao.tokens['--ct-bg']} (esperado #0b1822, o plano do tema escuro)`);

// Cor inválida é recusada.
try { derivarEsquema({ ambiente: 'azul' }); falhar('Cor inválida não foi recusada'); } catch { /* esperado */ }

// 3. Piso Chrome 101
const fonte = readFileSync(motorPath, 'utf8');
const acima101 = [/\.toSorted\(/, /\.toReversed\(/, /\.toSpliced\(/, /\.with\(/, /Object\.groupBy/, /Map\.groupBy/, /isWellFormed/, /Array\.fromAsync/, /\/[a-z]*v[a-z]*\.test/];
for (const re of acima101) if (re.test(fonte)) falhar(`colibri-esquema.js usa ${re} (acima do Chrome 101)`);

if (falhas.length) {
    console.error(`FALHOU: ${falhas.length} verificação(ões)`);
    for (const f of falhas.slice(0, 40)) console.error(' - ' + f);
    if (falhas.length > 40) console.error(` … e mais ${falhas.length - 40}`);
    process.exit(1);
}
console.log(`OK: estados iguais à base; ${combinacoes} combinações de sementes com contraste garantido (${comAjuste} com ajuste); sem APIs acima do Chrome 101.`);
for (const [nome, s] of [['padrão Colibri', {}], ['totem atual', { ambiente: '#0b1120', acao: '#f59e0b' }], ['tablet atual', { ambiente: '#020617', acao: '#f99c00' }], ['claro creme', { ambiente: '#fdf6e3', acao: '#c62828', marca: '#1b5e20' }]]) {
    const e = derivarEsquema(s);
    console.log(`  ${nome}: modo ${e.modo}; bg ${e.tokens['--ct-bg']}, surface ${e.tokens['--ct-surface']}, ink-3 ${e.tokens['--ct-ink-3']}, action ${e.tokens['--ct-action']}/${e.tokens['--ct-on-action']}, brand-ink ${e.tokens['--ct-brand-ink']}; ajustes: ${e.ajustes.map((a) => a.token).join(', ') || 'nenhum'}`);
}
