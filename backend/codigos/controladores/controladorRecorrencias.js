const {
    cadastrarRecorrencia,
    listarRecorrencias,
    atualizarRecorrencia,
    gerarContaMensal,
    excluirRecorrencia
} = require("../servicos/servicoRecorrencias");

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
            mensagem: "A operacao conflita com uma regra do banco de dados."
        });
    }

    console.error(`Erro ao ${operacao} recorrencia:`, erro);

    return resposta.status(500).json({
        status: "erro",
        mensagem: `Erro interno ao ${operacao} recorrencia.`
    });
}

// Cadastrar uma recorrencia mensal
async function registrarRecorrencia(requisicao, resposta) {
    try {
        const recorrencia = await cadastrarRecorrencia(
            requisicao.usuario.id_usuario,
            requisicao.body
        );

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Recorrencia cadastrada.",
            recorrencia
        });
    } catch (erro) {
        return responderErro(resposta, erro, "cadastrar");
    }
}

// Consultar recorrencias, inclusive o historico das excluidas
async function consultarRecorrencias(requisicao, resposta) {
    try {
        const recorrencias = await listarRecorrencias(
            requisicao.usuario.id_usuario
        );

        return resposta.status(200).json({
            status: "sucesso",
            recorrencias
        });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

// Atualizar uma recorrencia ativa
async function editarRecorrencia(requisicao, resposta) {
    try {
        const recorrencia = await atualizarRecorrencia(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id),
            requisicao.body
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Recorrencia atualizada.",
            recorrencia
        });
    } catch (erro) {
        return responderErro(resposta, erro, "atualizar");
    }
}

// Gerar a conta do mes solicitado
async function gerarMensalidade(requisicao, resposta) {
    try {
        const conta = await gerarContaMensal(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id),
            requisicao.body && requisicao.body.mes
        );

        return resposta.status(conta.criada ? 201 : 200).json({
            status: "sucesso",
            mensagem: conta.criada
                ? "Conta mensal gerada."
                : "Conta mensal ja existente.",
            conta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "gerar mensalidade de");
    }
}

// Encerrar uma recorrencia aplicando a Regra B
async function removerRecorrencia(requisicao, resposta) {
    try {
        const recorrencia = await excluirRecorrencia(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id)
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Recorrencia encerrada pela Regra B.",
            recorrencia
        });
    } catch (erro) {
        return responderErro(resposta, erro, "excluir");
    }
}

module.exports = {
    registrarRecorrencia,
    consultarRecorrencias,
    editarRecorrencia,
    gerarMensalidade,
    removerRecorrencia
};