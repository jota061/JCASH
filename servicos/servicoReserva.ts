import * as SecureStore from "expo-secure-store";

import {
    ENDERECO_API
} from "../configuracoes/configuracaoApi";

import { formatarDataISO } from "../utils/datas";

const CHAVE_TOKEN = "jcash_token";

export interface CategoriaReserva {
    id_categoria: number;
    nome: string;
    tipo: "RESERVA";
}

export interface ResumoReserva {
    total_aportes: number;
    total_resgates: number;
    saldo: number;
}

export interface MovimentoReserva {
    id_movimento: number;
    id_categoria: number | null;
    tipo: "APORTE" | "RESGATE";
    valor: number;
    data_movimento: string;
    motivo: string | null;
}

export interface ResultadoMovimentoReserva {
    movimento: MovimentoReserva;
    resumo: ResumoReserva;
}

interface RespostaApi {
    status: string;
    mensagem?: string;
}

interface RespostaResumo extends RespostaApi {
    resumo?: ResumoReserva;
}

interface RespostaCategorias extends RespostaApi {
    categorias?: CategoriaReserva[];
}

interface RespostaMovimento extends RespostaApi {
    movimento?: MovimentoReserva;
    resumo?: ResumoReserva;
}

// Consultar a API usando o token do usuario autenticado.
async function requisitar<T extends RespostaApi>(
    caminho: string,
    metodo: "GET" | "POST",
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
                metodo === "GET"
                    ? "A consulta demorou demais. Tente novamente."
                    : "A operação demorou demais. Confira o saldo antes de tentar novamente."
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

// Conferir os valores retornados pelo MariaDB.
function validarResumo(
    resumo: ResumoReserva | undefined
): ResumoReserva {
    if (
        !resumo ||
        typeof resumo.total_aportes !== "number" ||
        typeof resumo.total_resgates !== "number" ||
        typeof resumo.saldo !== "number" ||
        !Number.isFinite(resumo.total_aportes) ||
        !Number.isFinite(resumo.total_resgates) ||
        !Number.isFinite(resumo.saldo) ||
        resumo.total_aportes < 0 ||
        resumo.total_resgates < 0 ||
        resumo.saldo < 0
    ) {
        throw new Error(
            "A API retornou um resumo inválido da reserva."
        );
    }

    const saldoCalculado =
        Math.round(resumo.total_aportes * 100) -
        Math.round(resumo.total_resgates * 100);

    if (Math.round(resumo.saldo * 100) !== saldoCalculado) {
        throw new Error(
            "Os totais da reserva não correspondem ao saldo."
        );
    }

    return resumo;
}

function validarValor(valor: number): void {
    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        valor > 9999999999.99 ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(String(valor))
    ) {
        throw new Error(
            "Informe um valor positivo com até duas casas decimais."
        );
    }
}

// Confirmar o movimento e o novo resumo retornados pela API.
function validarResultado(
    resposta: RespostaMovimento
): ResultadoMovimentoReserva {
    const movimento = resposta.movimento;

    if (
        !movimento ||
        !Number.isSafeInteger(movimento.id_movimento) ||
        movimento.id_movimento <= 0 ||
        !["APORTE", "RESGATE"].includes(movimento.tipo) ||
        typeof movimento.valor !== "number" ||
        !Number.isFinite(movimento.valor) ||
        movimento.valor <= 0 ||
        typeof movimento.data_movimento !== "string"
    ) {
        throw new Error(
            "A API não confirmou corretamente a movimentação. Consulte o saldo antes de tentar novamente."
        );
    }

    return {
        movimento,
        resumo: validarResumo(resposta.resumo)
    };
}

// Consultar os totais e o saldo real.
export async function consultarResumoReserva(): Promise<ResumoReserva> {
    const resposta = await requisitar<RespostaResumo>(
        "/reserva",
        "GET"
    );

    return validarResumo(resposta.resumo);
}

// Consultar as categorias RESERVA do MariaDB.
export async function listarCategoriasReserva(): Promise<CategoriaReserva[]> {
    const resposta = await requisitar<RespostaCategorias>(
        "/categorias?tipo=RESERVA",
        "GET"
    );

    if (
        !Array.isArray(resposta.categorias) ||
        !resposta.categorias.every((categoria) =>
            Number.isSafeInteger(categoria.id_categoria) &&
            categoria.id_categoria > 0 &&
            typeof categoria.nome === "string" &&
            categoria.nome.trim().length > 0 &&
            categoria.tipo === "RESERVA"
        )
    ) {
        throw new Error(
            "A API retornou categorias inválidas da reserva."
        );
    }

    return resposta.categorias;
}

// Registrar um aporte sem categoria e sem motivo.
export async function registrarAporteReserva(
    valor: number
): Promise<ResultadoMovimentoReserva> {
    validarValor(valor);

    const resposta = await requisitar<RespostaMovimento>(
        "/reserva/movimentos",
        "POST",
        {
            tipo: "APORTE",
            valor,
            data_movimento: formatarDataISO(new Date())
        }
    );

    return validarResultado(resposta);
}

// Registrar um resgate com categoria e motivo obrigatorios.
export async function registrarResgateReserva(
    valor: number,
    idCategoria: number,
    motivo: string
): Promise<ResultadoMovimentoReserva> {
    validarValor(valor);

    if (
        !Number.isSafeInteger(idCategoria) ||
        idCategoria <= 0
    ) {
        throw new Error(
            "Selecione uma categoria válida para o resgate."
        );
    }

    const motivoTratado = motivo.trim();

    if (
        motivoTratado.length === 0 ||
        motivoTratado.length > 255
    ) {
        throw new Error(
            "Informe o motivo do resgate com até 255 caracteres."
        );
    }

    const resposta = await requisitar<RespostaMovimento>(
        "/reserva/movimentos",
        "POST",
        {
            tipo: "RESGATE",
            valor,
            data_movimento: formatarDataISO(new Date()),
            id_categoria: idCategoria,
            motivo: motivoTratado
        }
    );

    return validarResultado(resposta);
}