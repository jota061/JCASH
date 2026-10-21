const pool = require("../conexaoBanco");

// Criar erros com o codigo HTTP adequado
function criarErro(mensagem, status) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir o identificador recebido do JWT
function validarUsuario(idUsuario) {
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        throw criarErro("Usuario autenticado invalido.", 401);
    }
}

// Consultar apenas o usuario autenticado
async function buscarPerfilUsuario(idUsuario) {
    validarUsuario(idUsuario);

    const usuarios = await pool.query(
        `SELECT id_usuario, nome, nome_social, email
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1`,
        [idUsuario]
    );

    if (usuarios.length === 0) {
        throw criarErro("Usuario nao encontrado.", 404);
    }

    const usuario = usuarios[0];

    // Nunca devolver a senha_hash
    return {
        id_usuario: Number(usuario.id_usuario),
        nome: usuario.nome,
        nome_social: usuario.nome_social,
        email: usuario.email
    };
}

// Atualizar somente o nome social
async function atualizarNomeSocial(idUsuario, dados) {
    validarUsuario(idUsuario);

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro("Envie os dados do perfil.", 400);
    }

    const nomeSocial =
        typeof dados.nome_social === "string"
            ? dados.nome_social.trim()
            : "";

    if (!nomeSocial || Array.from(nomeSocial).length > 100) {
        throw criarErro(
            "Informe um nome social valido com ate 100 caracteres.",
            400
        );
    }

    // O proprietario e identificado pelo JWT
    await pool.query(
        `UPDATE usuarios
         SET nome_social = ?
         WHERE id_usuario = ?`,
        [nomeSocial, idUsuario]
    );

    return buscarPerfilUsuario(idUsuario);
}

module.exports = {
    buscarPerfilUsuario,
    atualizarNomeSocial
};