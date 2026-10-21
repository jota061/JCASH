const {
    cadastrarMeta,
    listarMetas,
    consultarMeta,
    atualizarMeta,
    registrarAporteMeta,
    listarAportesMeta,
    excluirMeta
} = require("../servicos/servicoMetas");

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

    console.error(`Erro ao ${operacao} meta:`, erro);

    return resposta.status(500).json({
        status: "erro",
        mensagem: "Erro interno no modulo de metas."
    });
}

async function registrarMeta(requisicao, resposta) {
    try {
        const meta = await cadastrarMeta(
            requisicao.usuario.id_usuario,
            requisicao.body
        );

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Meta cadastrada.",
            meta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "cadastrar");
    }
}

async function consultarMetas(requisicao, resposta) {
    try {
        const metas = await listarMetas(requisicao.usuario.id_usuario);

        return resposta.status(200).json({
            status: "sucesso",
            metas
        });
    } catch (erro) {
        return responderErro(resposta, erro, "listar");
    }
}

async function consultarMetaPorId(requisicao, resposta) {
    try {
        const meta = await consultarMeta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id)
        );

        return resposta.status(200).json({
            status: "sucesso",
            meta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar");
    }
}

async function editarMeta(requisicao, resposta) {
    try {
        const meta = await atualizarMeta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id),
            requisicao.body
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Meta atualizada.",
            meta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "editar");
    }
}

async function registrarAporte(requisicao, resposta) {
    try {
        const aporte = await registrarAporteMeta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id),
            requisicao.body
        );

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Aporte registrado.",
            aporte
        });
    } catch (erro) {
        return responderErro(resposta, erro, "registrar aporte na");
    }
}

async function consultarAportes(requisicao, resposta) {
    try {
        const aportes = await listarAportesMeta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id)
        );

        return resposta.status(200).json({
            status: "sucesso",
            aportes
        });
    } catch (erro) {
        return responderErro(resposta, erro, "consultar aportes da");
    }
}

async function removerMeta(requisicao, resposta) {
    try {
        const meta = await excluirMeta(
            requisicao.usuario.id_usuario,
            Number(requisicao.params.id)
        );

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Meta arquivada.",
            meta
        });
    } catch (erro) {
        return responderErro(resposta, erro, "arquivar");
    }
}

module.exports = {
    registrarMeta,
    consultarMetas,
    consultarMetaPorId,
    editarMeta,
    registrarAporte,
    consultarAportes,
    removerMeta
};