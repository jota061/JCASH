import * as SecureStore from "expo-secure-store";

import {
    ENDERECO_API
} from "../configuracoes/configuracaoApi";

const CHAVE_TOKEN = "jcash_token";

interface RespostaApi {
    status: string;
    mensagem?: string;
}

interface RespostaPerfil extends RespostaApi {
    usuario: {
        id_usuario: number;
        nome: string;
        nome_social: string;
        email: string;
    };
}

interface RegistroFinanceiro {
    nome: string;
    valor: number;
    data: string;
}

interface Entrada extends RegistroFinanceiro {
    id_entrada: number;
}

interface Despesa extends RegistroFinanceiro {
    id_despesa: number;
}

interface RespostaEntradas extends RespostaApi {
    entradas: Entrada[];
}

interface RespostaDespesas extends RespostaApi {
    despesas: Despesa[];
}

interface ContaFinanceira {
    id_conta: number;
    nome: string;
    valor: number;
    status: "PENDENTE" | "PAGA" | "CANCELADA";
    data_pagamento: string | null;
}

interface RespostaContas extends RespostaApi {
    contas: ContaFinanceira[];
}

interface RespostaReserva extends RespostaApi {
    resumo: {
        saldo: number;
    };
}

export interface MovimentacaoHome {
    id: string;
    titulo: string;
    categoria: string;
    valor: number;
    data: string;
    tipo: "ENTRADA" | "DESPESA";
}

interface RespostaMovimentacoes extends RespostaApi {
    movimentacoes: MovimentacaoHome[];
}

export interface DadosHome {
    nomeSocial: string;
    entradas: number;
    despesas: number;
    saldo: number;
    reserva: number;
    movimentacoes: MovimentacaoHome[];
}

// Verificar valores financeiros recebidos da API.
function validarValor(valor: unknown): number {
    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor < 0
    ) {
        throw new Error(
            "A API retornou um valor financeiro inválido."
        );
    }

    return valor;
}

// Consultar um endpoint protegido pelo JWT.
async function consultarApi<T extends RespostaApi>(
    caminho: string,
    token: string,
    sinal: AbortSignal
): Promise<T> {
    const resposta = await fetch(
        `${ENDERECO_API}${caminho}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
            signal: sinal
        }
    );

    let dados: T;

    try {
        dados = (await resposta.json()) as T;
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

    if (!resposta.ok || dados.status !== "sucesso") {
        throw new Error(
            dados.mensagem ||
            "Não foi possível consultar os dados financeiros."
        );
    }

    return dados;
}

// Somar valores em centavos para evitar erros de arredondamento.
function somarValores(
    registros: { valor: number }[]
): number {
    const centavos = registros.reduce(
        (total, item) => {
            return total +
                Math.round(validarValor(item.valor) * 100);
        },
        0
    );

    if (!Number.isSafeInteger(centavos)) {
        throw new Error(
            "O total financeiro ultrapassou o limite permitido."
        );
    }

    return centavos / 100;
}

// Considerar cada conta paga somente uma vez.
function obterContasPagas(
    contas: ContaFinanceira[]
): ContaFinanceira[] {
    const identificadores = new Set<number>();

    return contas.filter((conta) => {
        if (conta.status !== "PAGA") {
            return false;
        }

        if (
            !Number.isSafeInteger(conta.id_conta) ||
            conta.id_conta <= 0 ||
            typeof conta.nome !== "string" ||
            typeof conta.data_pagamento !== "string"
        ) {
            throw new Error(
                "A API retornou dados inválidos de uma conta paga."
            );
        }

        validarValor(conta.valor);

        if (identificadores.has(conta.id_conta)) {
            return false;
        }

        identificadores.add(conta.id_conta);
        return true;
    });
}

// Conferir as movimentacoes ordenadas pelo servidor.
function validarMovimentacoes(
    registros: unknown
): MovimentacaoHome[] {
    if (!Array.isArray(registros) || registros.length > 5) {
        throw new Error(
            "A API retornou movimentações inválidas."
        );
    }

    const valido = registros.every((item) => (
        typeof item.id === "string" &&
        typeof item.titulo === "string" &&
        typeof item.categoria === "string" &&
        typeof item.valor === "number" &&
        Number.isFinite(item.valor) &&
        typeof item.data === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.data) &&
        (item.tipo === "ENTRADA" || item.tipo === "DESPESA")
    ));

    if (!valido) {
        throw new Error(
            "A API retornou movimentações inválidas."
        );
    }

    // A ordem ja foi definida pelo MariaDB.
    return registros as MovimentacaoHome[];
}

// Carregar os dados reais para a tela inicial.
export async function carregarDadosHome(): Promise<DadosHome> {
    const token = await SecureStore.getItemAsync(
        CHAVE_TOKEN
    );

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
        const [
            respostaPerfil,
            respostaEntradas,
            respostaDespesas,
            respostaContas,
            respostaReserva,
            respostaMovimentacoes
        ] = await Promise.all([
            consultarApi<RespostaPerfil>(
                "/autenticacao/perfil",
                token,
                controlador.signal
            ),
            consultarApi<RespostaEntradas>(
                "/entradas",
                token,
                controlador.signal
            ),
            consultarApi<RespostaDespesas>(
                "/despesas",
                token,
                controlador.signal
            ),
            consultarApi<RespostaContas>(
                "/contas",
                token,
                controlador.signal
            ),
            consultarApi<RespostaReserva>(
                "/reserva",
                token,
                controlador.signal
            ),
            consultarApi<RespostaMovimentacoes>(
                "/movimentacoes/recentes",
                token,
                controlador.signal
            )
        ]);

        if (
            !respostaPerfil.usuario ||
            typeof respostaPerfil.usuario.nome !== "string" ||
            typeof respostaPerfil.usuario.nome_social !== "string" ||
            !Array.isArray(respostaEntradas.entradas) ||
            !Array.isArray(respostaDespesas.despesas) ||
            !Array.isArray(respostaContas.contas) ||
            !respostaReserva.resumo
        ) {
            throw new Error(
                "A API retornou informações incompletas."
            );
        }

        const entradas = somarValores(
            respostaEntradas.entradas
        );

        const despesasAvulsas = somarValores(
            respostaDespesas.despesas
        );

        const contasPagas = somarValores(
            obterContasPagas(respostaContas.contas)
        );

        const despesasCentavos =
            Math.round(despesasAvulsas * 100) +
            Math.round(contasPagas * 100);

        const saldoCentavos =
            Math.round(entradas * 100) -
            despesasCentavos;

        if (
            !Number.isSafeInteger(despesasCentavos) ||
            !Number.isSafeInteger(saldoCentavos)
        ) {
            throw new Error(
                "O saldo ultrapassou o limite permitido."
            );
        }

        const nomeSocial =
            respostaPerfil.usuario.nome_social.trim() ||
            respostaPerfil.usuario.nome.trim().split(" ")[0] ||
            "Usuário";

        return {
            nomeSocial,
            entradas,
            despesas: despesasCentavos / 100,
            saldo: saldoCentavos / 100,
            reserva: validarValor(
                respostaReserva.resumo.saldo
            ),
            movimentacoes: validarMovimentacoes(
                respostaMovimentacoes.movimentacoes
            )
        };

    } catch (erro) {
        if (controlador.signal.aborted) {
            throw new Error(
                "A consulta demorou demais. Verifique a conexão."
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