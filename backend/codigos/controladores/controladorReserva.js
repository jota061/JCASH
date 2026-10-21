const {
    consultarReserva,
    listarMovimentos,
    registrarMovimento
} = require("../servicos/servicoReserva");

function responderErro(resposta, erro, operacao) {
    if ([400, 401, 404, 409].includes(erro.status)) {
        return resposta.status(erro.status).json({
            status: "erro",
            mensagem: erro.message
        });
    }

    if ([1062, 1644, 4025].includes(erro.errno)) {
        return resposta.status(409).json({
            status: "erro",
            mensagem: "Operacao rejeitada por uma regra do banco de dados."
        });
    }

    console.error(`Erro ao ${operacao} reserva:`, erro);

    return resposta.status(500).json({
        status: "erro",
        mensagem: "Erro interno no modulo de reserva."
    });
}

// Consultar o saldo e os totais da reserva
async function consultarSaldo(requisicao, resposta) {
    try {
        const resumo = await consultarReserva(
            requisicao.usuario.id_usuario
        );

        return resposta.status(200).json({
            status: "sucesso",
            resumo
        });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

// Consultar o historico de aportes e resgates
async function consultarMovimentos(requisicao, resposta) {
    try {
        const movimentos = await listarMovimentos(
            requisicao.usuario.id_usuario
        );

        return resposta.status(200).json({
            status: "sucesso",
            movimentos
        });
    } catch (erro) {
        return responderErro(resposta, erro, "listar movimentos da");
    }
}

// Registrar um novo movimento financeiro
async function registrarMovimentoReserva(requisicao, resposta) {
    try {
        const resultado = await registrarMovimento(
            requisicao.usuario.id_usuario,
            requisicao.body
        );

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Movimento registrado na reserva.",
            ...resultado
        });
    } catch (erro) {
        return responderErro(resposta, erro, "registrar movimento na");
    }
}

module.exports = {
    consultarSaldo,
    consultarMovimentos,
    registrarMovimentoReserva
};