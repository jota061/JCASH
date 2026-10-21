const {
    cadastrarDespesa,
    listarDespesas,
    atualizarDespesa,
    excluirDespesa
} = require("../servicos/servicoDespesas");

// Tratar erros previstos sem revelar detalhes internos do banco
function responderErro(resposta, erro, operacao) {
    if ([400, 401, 404].includes(erro.status)) {
        return resposta.status(erro.status).json({
            status: "erro",
            mensagem: erro.message
        });
    }

    console.error(`Erro ao ${operacao} despesa:`, erro);

    return resposta.status(500).json({
        status: "erro",
        mensagem: `Erro interno ao ${operacao} despesa.`
    });
}

// Receber os dados enviados para cadastrar uma despesa
async function registrarDespesa(requisicao, resposta) {
    try {
        const idUsuario = requisicao.usuario.id_usuario;
        const despesa = await cadastrarDespesa(idUsuario, requisicao.body);

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Despesa cadastrada com sucesso.",
            despesa
        });
    } catch (erro) {
        return responderErro(resposta, erro, "cadastrar");
    }
}

// Consultar as despesas do usuario autenticado
async function consultarDespesas(requisicao, resposta) {
    try {
        const idUsuario = requisicao.usuario.id_usuario;
        const despesas = await listarDespesas(idUsuario);

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Despesas consultadas com sucesso.",
            despesas
        });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

// Receber os novos dados para editar uma despesa
async function editarDespesa(requisicao, resposta) {
    try {
        const idUsuario = requisicao.usuario.id_usuario;
        const idDespesa = Number(requisicao.params.id);

        const despesa = await atualizarDespesa(
            idUsuario,
            idDespesa,
            requisicao.body
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Despesa atualizada com sucesso.",
            despesa
        });
    } catch (erro) {
        return responderErro(resposta, erro, "atualizar");
    }
}

// Excluir a despesa indicada na URL
async function removerDespesa(requisicao, resposta) {
    try {
        const idUsuario = requisicao.usuario.id_usuario;
        const idDespesa = Number(requisicao.params.id);

        const despesa = await excluirDespesa(idUsuario, idDespesa);

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Despesa excluida com sucesso.",
            despesa
        });
    } catch (erro) {
        return responderErro(resposta, erro, "excluir");
    }
}

module.exports = {
    registrarDespesa,
    consultarDespesas,
    editarDespesa,
    removerDespesa
};