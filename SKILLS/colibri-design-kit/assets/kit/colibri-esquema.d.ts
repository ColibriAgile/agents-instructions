/* Tipos de colibri-esquema.js (perfil Operação). */

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
export declare function derivarEsquema(sementes?: SementesEsquema): Esquema;
/** Sem `alvo`: grava no <html> (com data-theme). Com `alvo`: só no elemento (prévia). Com `esquema` nulo: remove. */
export declare function aplicarEsquema(esquema: Esquema | null, alvo?: HTMLElement): void;
