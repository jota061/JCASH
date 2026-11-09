
const {
    buscarPerfilUsuario,
    atualizarNomeSocial,
    alterarSenhaUsuario,
    excluirContaUsuario
} = require("../servicos/servicoPerfil");

// Responder aos erros sem expor dados internos
function responderErro(resposta, erro, operacao) {
    if ([400, 401, 404, 409].includes(erro.status)) {
        return resposta.status(erro.status).json({
            status: "erro",
            mensagem: erro.message
        });
    }

    console.error(`Erro ao ${operacao} perfil:`, erro);

    return resposta.status(500).json({
        status: "erro",
        mensagem: "Erro interno ao processar o perfil."
    });
}

// Consultar os dados do usuario autenticado
async function consultarPerfil(requisicao, resposta) {
    try {
        const usuario = await buscarPerfilUsuario(
            requisicao.usuario.id_usuario
        );

        return resposta.status(200).json({
            status: "sucesso",
            usuario
        });

    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

// Atualizar o nome social do usuario autenticado
async function editarNomeSocial(requisicao, resposta) {
    try {
        const usuario = await atualizarNomeSocial(
            requisicao.usuario.id_usuario,
            requisicao.body
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Nome social atualizado com sucesso.",
            usuario
        });

    } catch (erro) {
        return responderErro(resposta, erro, "atualizar");
    }
}

// Alterar a senha do usuario autenticado
async function alterarSenha(requisicao, resposta) {
    try {
        await alterarSenhaUsuario(
            requisicao.usuario.id_usuario,
            requisicao.body
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Senha atualizada com sucesso."
        });

    } catch (erro) {
        return responderErro(resposta, erro, "alterar senha do");
    }
}

// Excluir definitivamente a conta do usuario autenticado
async function excluirConta(requisicao, resposta) {
    try {
        // O identificador vem do JWT validado pelo middleware
        const idUsuario = requisicao.usuario.id_usuario;

        // O servico confirma a senha antes de excluir a conta
        const resultado = await excluirContaUsuario(
            idUsuario,
            requisicao.body
        );

        // Responder somente depois da exclusao ser concluida
        return resposta.status(200).json({
            status: "sucesso",
            mensagem: resultado.mensagem
        });

    } catch (erro) {
        return responderErro(
            resposta,
            erro,
            "excluir conta do"
        );
    }
}

module.exports = {
    consultarPerfil,
    editarNomeSocial,
    alterarSenha,
    excluirConta
};
