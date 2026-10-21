const {
    buscarPerfilUsuario,
    atualizarNomeSocial
} = require("../servicos/servicoPerfil");

// Responder aos erros sem expor dados internos
function responderErro(resposta, erro, operacao) {
    if ([400, 401, 404].includes(erro.status)) {
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

module.exports = {
    consultarPerfil,
    editarNomeSocial
};