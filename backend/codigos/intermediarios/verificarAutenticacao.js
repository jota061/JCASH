const jwt = require("jsonwebtoken");
const pool = require("../conexaoBanco");

// Verificar se o usuario possui um token valido
async function verificarAutenticacao(requisicao, resposta, proximo) {
    const autorizacao = requisicao.headers.authorization;

    // Verificar se o token foi enviado
    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
        return resposta.status(401).json({
            status: "erro",
            mensagem: "Token de autenticacao nao informado."
        });
    }

    // Extrair o token do cabecalho
    const token = autorizacao.slice(7).trim();

    if (!token) {
        return resposta.status(401).json({
            status: "erro",
            mensagem: "Token de autenticacao nao informado."
        });
    }

    // Verificar se a chave JWT esta configurada
    if (!process.env.JWT_SEGREDO) {
        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno na autenticacao."
        });
    }

    let idUsuario;

    try {
        // Verificar a assinatura e a validade do token
        const dados = jwt.verify(
            token,
            process.env.JWT_SEGREDO,
            { algorithms: ["HS256"] }
        );

        // Conferir o identificador recebido do JWT
        if (
            !Number.isSafeInteger(dados.id_usuario) ||
            dados.id_usuario <= 0
        ) {
            return resposta.status(401).json({
                status: "erro",
                mensagem: "Token invalido ou expirado."
            });
        }

        idUsuario = dados.id_usuario;

    } catch {
        return resposta.status(401).json({
            status: "erro",
            mensagem: "Token invalido ou expirado."
        });
    }

    try {
        // Confirmar que a conta ainda existe no Banco de Dados
        const usuarios = await pool.query(
            `SELECT id_usuario
             FROM usuarios
             WHERE id_usuario = ?
             LIMIT 1`,
            [idUsuario]
        );

        // Impedir o acesso com tokens de contas excluidas
        if (usuarios.length === 0) {
            return resposta.status(401).json({
                status: "erro",
                mensagem: "Conta nao encontrada. Acesso negado."
            });
        }

    } catch (erro) {
        // Uma falha no banco nao deve liberar o acesso
        console.error(
            "[JCASH] Erro ao verificar usuario autenticado:",
            erro
        );

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno na autenticacao."
        });
    }

    // Disponibilizar o identificador para as proximas funcoes
    requisicao.usuario = {
        id_usuario: idUsuario
    };

    // Permitir o acesso somente ao usuario existente
    return proximo();
}

module.exports = { verificarAutenticacao };
