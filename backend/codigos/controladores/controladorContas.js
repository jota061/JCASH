const { cadastrarConta, listarContas, consultarConta, atualizarConta, pagarConta, cancelarConta, excluirConta } = require("../servicos/servicoContas");

// Tratar erros previstos sem mostrar detalhes internos do banco
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

    console.error(`Erro ao ${operacao} conta:`, erro);

    return resposta.status(500).json({
        status: "erro", 
        mensagem: `Erro interno ao ${operacao} conta.`
    });
}

// Cadastrar uma conta de pagamento unico
async function registrarConta(requisicao, resposta) {
    try {
        const conta = await cadastrarConta(
            requisicao.usuario.id_usuario,
            requisicao.body
        );

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Conta cadastrada com sucesso.",
            conta
        });
    } catch (erro) {
        return responderErro(
            resposta, 
            erro, 
            "cadastrar");
    }
}

// Listar contas do usuario autenticado
async function consultarContas(requisicao, resposta) {
    try {
        const contas = await listarContas(requisicao.usuario.id_usuario, requisicao.query);

        return resposta.status(200).json({ status: "sucesso", contas });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

// Consultar uma conta pelo identificador
async function consultarContaPorId(requisicao, resposta) {
    try {
        const conta = await consultarConta(requisicao.usuario.id_usuario, Number(requisicao.params.id));

        return resposta.status(200).json({ status: "sucesso", conta });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

// Editar uma conta
async function editarConta(requisicao, resposta) {
    try {
        const conta = await atualizarConta(requisicao.usuario.id_usuario, Number(requisicao.params.id), requisicao.body);

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Conta atualizada.",
            conta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "atualizar");
    }
}

// Marcar uma conta como paga
async function registrarPagamento(requisicao, resposta) {
    try {
        const conta = await pagarConta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id),
            requisicao.body
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Pagamento registrado.",
            conta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "pagar");
    }
}

// Cancelar uma conta sem apaga-la do historico
async function registrarCancelamento(requisicao, resposta) {
    try {
        const conta = await cancelarConta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id)
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Conta cancelada.",
            conta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "cancelar");
    }
}

// Excluir uma conta unica pendente
async function removerConta(requisicao, resposta) {
    try {
        const conta = await excluirConta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id)
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Conta excluida.",
            conta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "excluir");
    }
}

module.exports = {
    registrarConta,
    consultarContas,
    consultarContaPorId,
    editarConta,
    registrarPagamento,
    registrarCancelamento,
    removerConta
};