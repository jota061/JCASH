
const bcrypt = require("bcryptjs");
const { Buffer } = require("node:buffer");
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

// Alterar a senha do usuario autenticado
async function alterarSenhaUsuario(idUsuario, dados) {
    validarUsuario(idUsuario);

    // Verificar se os dados foram enviados corretamente
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(
            "Envie os dados para alterar a senha.",
            400
        );
    }

    const senhaAtual = dados.senha_atual;
    const novaSenha = dados.nova_senha;

    // Validar os campos obrigatorios
    if (
        typeof senhaAtual !== "string" ||
        senhaAtual.length === 0 ||
        typeof novaSenha !== "string" ||
        novaSenha.length === 0
    ) {
        throw criarErro(
            "Informe a senha atual e a nova senha.",
            400
        );
    }

    // Manter o tamanho minimo utilizado no cadastro
    if (Array.from(novaSenha).length < 10) {
        throw criarErro(
            "A nova senha deve ter pelo menos 10 caracteres.",
            400
        );
    }

    // Respeitar o limite tecnico do bcrypt
    if (Buffer.byteLength(novaSenha, "utf8") > 72) {
        throw criarErro(
            "Sua nova senha e muito longa. Utilize uma senha mais curta.",
            400
        );
    }

    // Aplicar os requisitos da tela de alteracao de senha
    const senhaForte =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._+=-]).+$/.test(novaSenha);

    if (!senhaForte) {
        throw criarErro(
            "A nova senha deve conter uma letra maiuscula, um numero e um caractere especial.",
            400
        );
    }

    // Buscar o hash da senha atual no MariaDB
    const usuarios = await pool.query(
        `SELECT senha_hash
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1`,
        [idUsuario]
    );

    if (usuarios.length === 0) {
        throw criarErro("Usuario nao encontrado.", 404);
    }

    const senhaHashAtual = usuarios[0].senha_hash;

    // Conferir se a senha atual informada esta correta
    const senhaCorreta = await bcrypt.compare(
        senhaAtual,
        senhaHashAtual
    );

    if (!senhaCorreta) {
        throw criarErro("Senha atual incorreta.", 400);
    }

    // Impedir que a nova senha seja igual a senha atual
    const mesmaSenha = await bcrypt.compare(
        novaSenha,
        senhaHashAtual
    );

    if (mesmaSenha) {
        throw criarErro(
            "A nova senha deve ser diferente da senha atual.",
            400
        );
    }

    // Gerar o hash da nova senha
    const novoHash = await bcrypt.hash(novaSenha, 12);

    // Atualizar somente se a senha anterior nao mudou
    const resultado = await pool.query(
        `UPDATE usuarios
         SET senha_hash = ?
         WHERE id_usuario = ?
           AND senha_hash = ?`,
        [novoHash, idUsuario, senhaHashAtual]
    );

    if (Number(resultado.affectedRows) !== 1) {
        throw criarErro(
            "Nao foi possivel atualizar a senha. Tente novamente.",
            409
        );
    }
}

// Excluir definitivamente a conta do usuario autenticado
async function excluirContaUsuario(idUsuario, dados) {
    validarUsuario(idUsuario);

    // Exigir os dados de confirmacao da exclusao
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(
            "Envie a senha atual para confirmar a exclusao.",
            400
        );
    }

    const senhaAtual = dados.senha_atual;

    // A exclusao nunca deve acontecer sem a senha atual
    if (
        typeof senhaAtual !== "string" ||
        senhaAtual.length === 0
    ) {
        throw criarErro(
            "Informe sua senha atual para excluir a conta.",
            400
        );
    }

    // Buscar o hash apenas do usuario autenticado
    const usuarios = await pool.query(
        `SELECT senha_hash
         FROM usuarios
         WHERE id_usuario = ?
         LIMIT 1`,
        [idUsuario]
    );

    if (usuarios.length === 0) {
        throw criarErro("Usuario nao encontrado.", 404);
    }

    // Confirmar a senha antes de permitir a exclusao
    const senhaCorreta = await bcrypt.compare(
        senhaAtual,
        usuarios[0].senha_hash
    );

    if (!senhaCorreta) {
        throw criarErro(
            "Senha atual incorreta. A conta nao foi excluida.",
            400
        );
    }

    // O procedimento realiza a exclusao em uma transacao
    // e cancela as alteracoes caso ocorra algum erro
    await pool.query(
        "CALL jcash.excluir_usuario_definitivamente(?)",
        [idUsuario]
    );

    // Retornar sucesso apenas se o procedimento terminar
    return {
        mensagem: "Conta excluida definitivamente."
    };
}

module.exports = {
    buscarPerfilUsuario,
    atualizarNomeSocial,
    alterarSenhaUsuario,
    excluirContaUsuario
};
