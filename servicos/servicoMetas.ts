import * as SecureStore from "expo-secure-store";
import { ENDERECO_API } from "../configuracoes/configuracaoApi";

const CHAVE_TOKEN = "jcash_token";

export interface CategoriaMeta {
    id_categoria: number;
    nome: string;
    tipo: "META";
}

export interface MetaFinanceira {
    id_meta: number;
    id_usuario: number;
    id_categoria: number;
    nome: string;
    valor_meta: number;
    data_limite: string;
    total_aportado: number;
    percentual: number;
    percentual_visual: number;
}

export interface DadosNovaMeta {
    nome: string;
    valor_meta: number;
    data_limite: string;
    id_categoria: number;
}

export interface AporteMeta {
    id_aporte: number;
    id_meta: number;
    valor: number;
}

interface RespostaApi {
    status: string;
    mensagem?: string;
}

interface RespostaCategorias extends RespostaApi {
    categorias?: CategoriaMeta[];
}

interface RespostaMetas extends RespostaApi {
    metas?: MetaFinanceira[];
}

interface RespostaMeta extends RespostaApi {
    meta?: MetaFinanceira;
}

interface RespostaAporte extends RespostaApi {
    aporte?: AporteMeta;
}

// O identificador do usuario sempre e obtido pelo JWT no servidor.
async function requisitar<T extends RespostaApi>(
    caminho: string,
    metodo: "GET" | "POST" | "DELETE",
    dados?: object
): Promise<T> {
    const token = await SecureStore.getItemAsync(CHAVE_TOKEN);

    if (!token) {
        throw new Error("Sessão não encontrada. Entre novamente no JCASH.");
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 15000);

    try {
        const resposta = await fetch(`${ENDERECO_API}${caminho}`, {
            method: metodo,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(dados ? { "Content-Type": "application/json" } : {})
            },
            body: dados ? JSON.stringify(dados) : undefined,
            signal: controlador.signal
        });

        let resultado: T;

        try {
            resultado = (await resposta.json()) as T;
        } catch {
            throw new Error("A API retornou uma resposta inválida.");
        }

        if (resposta.status === 401) {
            throw new Error(
                "Sua sessão expirou. Saia da conta e entre novamente."
            );
        }

        if (!resposta.ok || resultado.status !== "sucesso") {
            throw new Error(
                resultado.mensagem || "Não foi possível concluir a operação."
            );
        }

        return resultado;
    } catch (erro) {
        if (controlador.signal.aborted) {
            throw new Error(
                metodo === "GET"
                    ? "A consulta demorou demais. Tente novamente."
                    : "A operação demorou demais. Confira as metas antes de tentar de novo."
            );
        }

        if (erro instanceof TypeError) {
            throw new Error(
                "Não foi possível conectar à API. Verifique o Wi-Fi e o servidor."
            );
        }

        throw erro;
    } finally {
        clearTimeout(temporizador);
    }
}

function conferirMeta(meta: MetaFinanceira | undefined): MetaFinanceira {
    if (
        !meta ||
        !Number.isSafeInteger(meta.id_meta) ||
        meta.id_meta <= 0 ||
        !Number.isSafeInteger(meta.id_categoria) ||
        typeof meta.nome !== "string" ||
        typeof meta.data_limite !== "string" ||
        !Number.isFinite(meta.valor_meta) ||
        meta.valor_meta <= 0 ||
        !Number.isFinite(meta.total_aportado) ||
        meta.total_aportado < 0 ||
        !Number.isFinite(meta.percentual) ||
        !Number.isFinite(meta.percentual_visual)
    ) {
        throw new Error("A API retornou informações inválidas de uma meta.");
    }

    return meta;
}

export async function listarCategoriasMetas(): Promise<CategoriaMeta[]> {
    const resultado = await requisitar<RespostaCategorias>(
        "/categorias?tipo=META", "GET"
    );

    if (
        !Array.isArray(resultado.categorias) ||
        !resultado.categorias.every((categoria) =>
            Number.isSafeInteger(categoria.id_categoria) &&
            categoria.id_categoria > 0 &&
            typeof categoria.nome === "string" &&
            categoria.nome.trim().length > 0 &&
            categoria.tipo === "META"
        )
    ) {
        throw new Error("A API retornou categorias inválidas.");
    }

    return resultado.categorias;
}

export async function listarMetas(): Promise<MetaFinanceira[]> {
    const resultado = await requisitar<RespostaMetas>("/metas", "GET");

    if (!Array.isArray(resultado.metas)) {
        throw new Error("A API retornou uma lista de metas inválida.");
    }

    return resultado.metas.map(conferirMeta);
}

export async function cadastrarMeta(
    dados: DadosNovaMeta
): Promise<MetaFinanceira> {
    const resultado = await requisitar<RespostaMeta>("/metas", "POST", {
        nome: dados.nome.trim(),
        valor_meta: dados.valor_meta,
        data_limite: dados.data_limite,
        id_categoria: dados.id_categoria
    });

    return conferirMeta(resultado.meta);
}

export async function registrarAporteMeta(
    idMeta: number,
    valor: number
): Promise<AporteMeta> {
    const resultado = await requisitar<RespostaAporte>(
        `/metas/${idMeta}/aportes`, "POST", { valor }
    );

    if (
        !resultado.aporte ||
        !Number.isSafeInteger(resultado.aporte.id_aporte) ||
        resultado.aporte.id_meta !== idMeta ||
        resultado.aporte.valor !== valor
    ) {
        throw new Error(
            "A API não confirmou o aporte. Confira a meta antes de tentar novamente."
        );
    }

    return resultado.aporte;
}

// Exclusao logica: o back-end preserva os aportes no historico.
export async function arquivarMeta(idMeta: number): Promise<void> {
    const resultado = await requisitar<RespostaMeta>(
        `/metas/${idMeta}`, "DELETE"
    );

    if (resultado.meta?.id_meta !== idMeta) {
        throw new Error("A API não confirmou o arquivamento da meta.");
    }
}