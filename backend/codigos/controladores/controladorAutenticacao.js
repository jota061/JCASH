const {
    cadastrarUsuario,
    loginUsuario
} = require("../servicos/servicoAutenticacao");

// Recebe os dados do cadastro e devolve a resposta
async function registrarUsuario(requisicao, resposta) {
    try {
        const dados = requisicao.body;

        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
            return resposta.status(400).json({
                status: "erro",
                mensagem: "Envie os dados do cadastro."
            });
        }

        const usuario = await cadastrarUsuario(dados);

        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Usuário cadastrado com sucesso.",
            usuario
        });

    } catch (erro) {
        if (erro.status === 400 || erro.status === 409) {
            return resposta.status(erro.status).json({
                status: "erro",
                mensagem: erro.message
            });
        }

        console.error("Erro ao cadastrar usuário:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao cadastrar usuário."
        });
    }
}

// Recebe as credenciais e devolve o resultado do login
async function autenticarUsuario(requisicao, resposta) {
    try {
        const dados = requisicao.body;

        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
            return resposta.status(400).json({
                status: "erro",
                mensagem: "Envie os dados do login."
            });
        }

        // Verificar as credenciais no servico
        const resultado = await loginUsuario(dados);

        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Login realizado com sucesso.",
            token: resultado.token,
            usuario: resultado.usuario
        });

    } catch (erro) {
        // Tratar dados invalidos e credenciais incorretas
        if (erro.status === 400 || erro.status === 401) {
            return resposta.status(erro.status).json({
                status: "erro",
                mensagem: erro.message
            });
        }

        console.error("Erro ao realizar login:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao realizar login."
        });
    }
}

// Exportar as funcoes de autenticacao
module.exports = { registrarUsuario, autenticarUsuario };