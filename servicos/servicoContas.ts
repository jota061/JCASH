import * as SecureStore from "expo-secure-store";

import {
    ENDERECO_API
} from "../configuracoes/configuracaoApi";

const CHAVE_TOKEN = "jcash_token";

export interface CategoriaConta {
    id_categoria: number;
    nome: string;
    tipo: "CONTA";
}

export interface ContaRegistrada {
    id_conta: number;
    id_usuario: number;
    id_categoria: number;
    id_recorrencia: number | null;
    recorrencia_excluida: boolean;
    nome: string;
    valor: number;
    data_vencimento: string;
    tipo_cobranca: "MENSAL" | "PAGAMENTO_UNICO";
    status: "PENDENTE" | "PAGA" | "CANCELADA";
    data_pagamento: string | null;
}

export interface RecorrenciaConta {
    id_recorrencia: number;
    id_categoria: number;
    nome: string;
    valor: number;
    data_inicio: string;
    data_fim: string;
    ativa: boolean;
}

export interface DadosConta {
    nome: string;
    valor: number;
    id_categoria: number;
    data_vencimento: string;
}

export interface DadosRecorrencia {
    nome: string;
    valor: number;
    id_categoria: number;
    data_inicio: string;
    data_fim: string;
}

interface RespostaApi {
    status: string;
    mensagem?: string;
}

interface RespostaCategorias extends RespostaApi {
    categorias: CategoriaConta[];
}

interface RespostaContas extends RespostaApi {
    contas: ContaRegistrada[];
}

interface RespostaRecorrencias extends RespostaApi {
    recorrencias: RecorrenciaConta[];
}

interface RespostaConta extends RespostaApi {
    conta: ContaRegistrada;
}

interface RespostaRecorrencia extends RespostaApi {
    recorrencia: RecorrenciaConta;
}

interface RespostaMensalidade extends RespostaApi {
    conta: {
        id_conta: number;
        data_vencimento: string;
        criada: boolean;
    };
}

// Realizar uma requisicao autenticada
async function requisitarApi<T extends RespostaApi>(
    caminho: string,
    metodo: "GET" | "POST" | "PATCH" | "DELETE",
    dados?: object
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
                "O servidor retornou uma resposta inválida."
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
                metodo === "GET"
                    ? "A consulta demorou demais. Tente novamente."
                    : "A operação demorou demais. Consulte a lista antes de tentar novamente."
            );
        }

        if (erro instanceof TypeError) {
            throw new Error(
                "Não foi possível conectar à API do JCASH."
            );
        }

        throw erro;

    } finally {
        clearTimeout(temporizador);
    }
}

// Consultar as categorias de contas
export async function listarCategoriasContas():
    Promise<CategoriaConta[]> {
    const resultado = await requisitarApi<RespostaCategorias>(
        "/categorias?tipo=CONTA",
        "GET"
    );

    if (!Array.isArray(resultado.categorias)) {
        throw new Error("Lista de categorias inválida.");
    }

    if (!resultado.categorias.every(
        (item) =>
            Number.isSafeInteger(item.id_categoria) &&
            item.id_categoria > 0 &&
            typeof item.nome === "string" &&
            item.tipo === "CONTA"
    )) {
        throw new Error("A API retornou categorias inválidas.");
    }

    return resultado.categorias;
}

// Consultar as contas do usuario autenticado
export async function listarContas():
    Promise<ContaRegistrada[]> {
    const resultado = await requisitarApi<RespostaContas>(
        "/contas",
        "GET"
    );

    if (!Array.isArray(resultado.contas)) {
        throw new Error("Lista de contas inválida.");
    }

    return resultado.contas;
}

// Consultar recorrencias ativas e historicas
export async function listarRecorrencias():
    Promise<RecorrenciaConta[]> {
    const resultado = await requisitarApi<RespostaRecorrencias>(
        "/recorrencias",
        "GET"
    );

    if (!Array.isArray(resultado.recorrencias)) {
        throw new Error("Lista de recorrências inválida.");
    }

    return resultado.recorrencias;
}

// Cadastrar uma conta de pagamento unico
export async function cadastrarContaUnica(
    dados: DadosConta
): Promise<ContaRegistrada> {
    const resultado = await requisitarApi<RespostaConta>(
        "/contas",
        "POST",
        {
            ...dados,
            tipo_cobranca: "PAGAMENTO_UNICO"
        }
    );

    if (!resultado.conta?.id_conta) {
        throw new Error(
            "A API não confirmou o cadastro da conta."
        );
    }

    return resultado.conta;
}

// Cadastrar a regra de uma conta mensal
export async function cadastrarRecorrencia(
    dados: DadosRecorrencia
): Promise<RecorrenciaConta> {
    const resultado = await requisitarApi<RespostaRecorrencia>(
        "/recorrencias",
        "POST",
        dados
    );

    if (!resultado.recorrencia?.id_recorrencia) {
        throw new Error(
            "A API não confirmou o cadastro da recorrência."
        );
    }

    return resultado.recorrencia;
}

// Gerar ou consultar o vencimento de um mes especifico
export async function gerarMensalidade(
    idRecorrencia: number,
    mes: string
): Promise<RespostaMensalidade["conta"]> {
    const resultado = await requisitarApi<RespostaMensalidade>(
        `/recorrencias/${idRecorrencia}/gerar`,
        "POST",
        { mes }
    );

    if (!resultado.conta?.id_conta) {
        throw new Error(
            "A API não confirmou a mensalidade."
        );
    }

    return resultado.conta;
}

// Determinar os meses com vencimento dentro da recorrencia
function calcularMeses(recorrencia: RecorrenciaConta): string[] {
    const [anoInicial, mesInicial, diaInicial] =
        recorrencia.data_inicio.split("-").map(Number);

    const [anoFinal, mesFinal] =
        recorrencia.data_fim.split("-").map(Number);

    const meses: string[] = [];

    let ano = anoInicial;
    let mes = mesInicial;

    while (
        ano < anoFinal ||
        (ano === anoFinal && mes <= mesFinal)
    ) {
        const mesTexto = String(mes).padStart(2, "0");
        const ultimoDia = new Date(ano, mes, 0).getDate();

        const diaVencimento = Math.min(
            diaInicial,
            ultimoDia
        );

        const vencimento =
            `${ano}-${mesTexto}-${String(diaVencimento).padStart(2, "0")}`;

        if (
            vencimento >= recorrencia.data_inicio &&
            vencimento <= recorrencia.data_fim
        ) {
            meses.push(`${ano}-${mesTexto}`);
        }

        mes += 1;

        if (mes > 12) {
            mes = 1;
            ano += 1;
        }
    }

    return meses;
}

// Gerar todos os vencimentos validos do periodo
// O back-end impede a duplicacao no mesmo mes
export async function gerarMensalidadesDaRecorrencia(
    recorrencia: RecorrenciaConta
): Promise<number> {
    if (!recorrencia.ativa) {
        throw new Error(
            "Essa recorrência já foi encerrada."
        );
    }

    const meses = calcularMeses(recorrencia);
    let quantidadeCriada = 0;

    for (const mes of meses) {
        const resultado = await gerarMensalidade(
            recorrencia.id_recorrencia,
            mes
        );

        if (resultado.criada) {
            quantidadeCriada++;
        }
    }

    return quantidadeCriada;
}

// Marcar uma conta pendente como paga
export async function marcarContaComoPaga(
    idConta: number,
    dataPagamento: string
): Promise<ContaRegistrada> {
    const resultado = await requisitarApi<RespostaConta>(
        `/contas/${idConta}/pagar`,
        "PATCH",
        {
            data_pagamento: dataPagamento
        }
    );

    return resultado.conta;
}

// Excluir fisicamente uma conta unica pendente
export async function excluirContaUnica(
    idConta: number
): Promise<void> {
    await requisitarApi<RespostaApi>(
        `/contas/${idConta}`,
        "DELETE"
    );
}

// Encerrar recorrencia aplicando a Regra B
export async function encerrarRecorrencia(
    idRecorrencia: number
): Promise<void> {
    await requisitarApi<RespostaApi>(
        `/recorrencias/${idRecorrencia}`,
        "DELETE"
    );
}