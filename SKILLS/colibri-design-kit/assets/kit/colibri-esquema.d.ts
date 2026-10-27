/* Tipos de colibri-esquema.js (perfis Operação e Cards). */

export type ModoEsquema = 'light' | 'dark';

export interface SementesEsquema {
    /** Cor de fundo do canal; superfícies, linhas e textos são derivados dela. */
    ambiente?: string;
    /** Cor de ação: Adicionar, Finalizar, Pagar, opção escolhida, categoria ativa, foco. */
    acao?: string;
    /** Cor de marca: nome da loja, preço, selo "Destaque". Vazia = igual à ação. */
    marca?: string | null;
}

export interface AjusteEsquema {
    token: string;
    pedido: string;
    obtido: string;
    motivo: string;
}

export interface Esquema {
    versao: string;
    modo: ModoEsquema;
    sementes: Required<Omit<SementesEsquema, 'marca'>> & { marca: string | null };
    /** Tokens --ct-* em hex (#rrggbb). */
    tokens: Record<string, string>;
    /** Cores que o motor mudou para atingir o contraste; a prévia deve mostrá-las. */
    ajustes: AjusteEsquema[];
}

export declare const ESQUEMA_VERSAO: string;
export declare const ESQUEMA_PADRAO: { ambiente: string; acao: string; marca: null };
export declare const ESTADOS_BASE: Record<ModoEsquema, Record<string, string>>;
export declare const CONTRASTE: { texto: number; componente: number };

export declare function contraste(a: string, b: string): number;
export declare function derivarEsquema(sementes?: SementesEsquema, modoForcado?: ModoEsquema): Esquema;
/** Sem `alvo`: grava no <html> (com data-theme). Com `alvo`: só no elemento (prévia). Com `esquema` nulo: remove. */
export declare function aplicarEsquema(esquema: Esquema | null, alvo?: HTMLElement): void;

/* Perfil Cards: o que vai sobre a cor livre de um card (texto com 4,5:1 ou mais com qualquer cor). */
/** Tinta do texto e dos ícones sobre a cor do card: '#ffffff', '#1d2733' ou, nas cores médias, '#000000'. */
export declare function tintaSobre(fundo: string): '#ffffff' | '#1d2733' | '#000000';
/** Véu da faixa de urgência e dos selos: 'rgba(0, 0, 0, .24)' sob tinta branca, 'rgba(255, 255, 255, .45)' sob tinta escura. */
export declare function veuSobre(fundo: string): string;
/** Cor do respiro do estado mais grave (hex): a cor do card puxada para o preto ou o branco, com a tinta em 4,5:1 ou mais. */
export declare function respiroDe(fundo: string): string;
