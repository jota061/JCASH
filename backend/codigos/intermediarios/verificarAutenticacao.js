const jwt = require("jsonwebtoken");

// Verificar se o usuario possui um token valido
function verificarAutenticacao(requisicao, resposta, proximo) {
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

    try {
        // Verificar a assinatura e a validade do token
        const dados = jwt.verify(
            token,
            process.env.JWT_SEGREDO,
            { algorithms: ["HS256"] }
        );

        // Conferir o identificador do usuario
        if (!Number.isSafeInteger(dados.id_usuario) || dados.id_usuario <= 0) {
            return resposta.status(401).json({
                status: "erro",
                mensagem: "Token invalido ou expirado."
            });
        }

        // Disponibilizar o identificador para as proximas funcoes
        requisicao.usuario = {
            id_usuario: dados.id_usuario
        };

        // Permitir que a requisicao continue
        return proximo();

    } catch (erro) {
        return resposta.status(401).json({
            status: "erro",
            mensagem: "Token invalido ou expirado."
        });
    }
}

module.exports = { verificarAutenticacao };