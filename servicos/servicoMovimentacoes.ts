import * as SecureStore from "expo-secure-store";

import {
    ENDERECO_API
} from "../configuracoes/configuracaoApi";

const CHAVE_TOKEN = "jcash_token";

export type TipoMovimentacao = "ENTRADA" | "DESPESA";

export interface CategoriaMovimentacao {
    id_categoria: number;
    nome: string;
    tipo: TipoMovimentacao;
}

export interface DadosNovaMovimentacao {
    nome: string;
    valor: number;
    data: string;
    id_categoria: number;
}

interface RespostaApi {
    status: string;
    mensagem?: string;
}

interface RespostaCategorias extends RespostaApi {
    categorias?: CategoriaMovimentacao[];
}

interface RespostaCadastro extends RespostaApi {
    entrada?: {
        id_entrada: number;
    };
    despesa?: {
        id_despesa: number;
    };
}

// Executar uma requisicao autenticada com prazo limite
async function requisitarApi<T extends RespostaApi>(
    caminho: string,
    metodo: "GET" | "POST",
    dados?: DadosNovaMovimentacao
): Promise<T> {
    const token = await SecureStore.getItemAsync(CHAVE_TOKEN);

    if (!token) {
        throw new Error(
            "Sessão não encontrada. Entre novamente no JCASH."
        );
    }

    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
        controlador.abort();
    }, 15000);

    try {
        const resposta = await fetch(
            `${ENDERECO_API}${caminho}`,
            {
                method: metodo,
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...(dados
                        ? { "Content-Type": "application/json" }
                        : {})
                },
                body: dados
                    ? JSON.stringify(dados)
                    : undefined,
                signal: controlador.signal
            }
        );

        let resultado: T;

        try {
            resultado = (await resposta.json()) as T;
        } catch {
            throw new Error(
                "A API retornou uma resposta inválida."
            );
        }

        if (resposta.status === 401) {
            throw new Error(
                "Sua sessão expirou. Saia da conta e entre novamente."
            );
        }

        if (!resposta.ok || resultado.status !== "sucesso") {
            throw new Error(
                resultado.mensagem ||
                "Não foi possível concluir a operação."
            );
        }

        return resultado;

    } catch (erro) {
        if (controlador.signal.aborted) {
            throw new Error(
                metodo === "POST"
                    ? "A conexão demorou demais. Consulte a Home antes de tentar cadastrar novamente."
                    : "A consulta demorou demais. Tente novamente."
            );
        }

        if (erro instanceof TypeError) {
            throw new Error(
                "Não foi possível conectar à API. Verifique o Wi-Fi e o servidor JCASH."
            );
        }

        throw erro;

    } finally {
        clearTimeout(temporizador);
    }
}

// Consultar as categorias e os IDs reais do MariaDB
export async function listarCategorias(
    tipo: TipoMovimentacao
): Promise<CategoriaMovimentacao[]> {
    const resultado = await requisitarApi<RespostaCategorias>(
        `/categorias?tipo=${tipo}`,
        "GET"
    );

    if (!Array.isArray(resultado.categorias)) {
        throw new Error(
            "A API retornou uma lista de categorias inválida."
        );
    }

    const categoriasValidas = resultado.categorias.every(
        (categoria) =>
            Number.isSafeInteger(categoria.id_categoria) &&
            categoria.id_categoria > 0 &&
            typeof categoria.nome === "string" &&
            categoria.nome.trim() !== "" &&
            categoria.tipo === tipo
    );

    if (!categoriasValidas) {
        throw new Error(
            "A API retornou categorias inválidas."
        );
    }

    return resultado.categorias;
}

// Cadastrar uma entrada ou despesa real
export async function cadastrarMovimentacao(
    tipo: TipoMovimentacao,
    dados: DadosNovaMovimentacao
): Promise<number> {
    const caminho =
        tipo === "ENTRADA" ? "/entradas" : "/despesas";

    const resultado = await requisitarApi<RespostaCadastro>(
        caminho,
        "POST",
        {
            nome: dados.nome.trim(),
            valor: dados.valor,
            data: dados.data,
            id_categoria: dados.id_categoria
        }
    );

    const idRegistrado =
        tipo === "ENTRADA"
            ? resultado.entrada?.id_entrada
            : resultado.despesa?.id_despesa;

    if (
        !Number.isSafeInteger(idRegistrado) ||
        typeof idRegistrado !== "number" ||
        idRegistrado <= 0
    ) {
        throw new Error(
            "O servidor não confirmou corretamente o cadastro. Consulte a Home antes de tentar novamente."
        );
    }

    return idRegistrado;
}