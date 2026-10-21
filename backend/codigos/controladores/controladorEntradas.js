
const {
    cadastrarEntrada,
    listarEntradas,
    atualizarEntrada,
    excluirEntrada
} = require("../servicos/servicoEntradas");

// Receber os dados e cadastrar uma entrada financeira
async function registrarEntrada(requisicao, resposta) {
    try {
        // Identificar o usuario autenticado pelo JWT
        const idUsuario = requisicao.usuario.id_usuario;

        // Receber os dados enviados pelo aplicativo
        const dados = requisicao.body;

        // Cadastrar a entrada pelo servico
        const entrada = await cadastrarEntrada(idUsuario, dados);

        // Retornar a entrada cadastrada
        return resposta.status(201).json({
            status: "sucesso",
            mensagem: "Entrada cadastrada com sucesso.",
            entrada
        });

    } catch (erro) {
        // Tratar dados invalidos ou usuario nao autorizado
        if (erro.status === 400 || erro.status === 401) {
            return resposta.status(erro.status).json({
                status: "erro",
                mensagem: erro.message
            });
        }

        // Registrar erros inesperados no servidor
        console.error("Erro ao cadastrar entrada:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao cadastrar entrada."
        });
    }
}

// Consultar as entradas do usuario autenticado
async function consultarEntradas(requisicao, resposta) {
    try {
        // Identificar o usuario autenticado pelo JWT
        const idUsuario = requisicao.usuario.id_usuario;

        // Consultar as entradas pelo servico
        const entradas = await listarEntradas(idUsuario);

        // Retornar as entradas encontradas
        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Entradas consultadas com sucesso.",
            entradas
        });

    } catch (erro) {
        // Tratar identificador de usuario invalido
        if (erro.status === 401) {
            return resposta.status(401).json({
                status: "erro",
                mensagem: erro.message
            });
        }

        // Registrar erros inesperados no servidor
        console.error("Erro ao consultar entradas:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao consultar entradas."
        });
    }
}

// Receber os dados e atualizar uma entrada financeira
async function editarEntrada(requisicao, resposta) {
    try {
        // Identificar o usuario autenticado pelo JWT
        const idUsuario = requisicao.usuario.id_usuario;

        // Obter o identificador da entrada pela URL
        const idEntrada = Number(requisicao.params.id);

        // Receber os novos dados da entrada
        const dados = requisicao.body;

        // Atualizar a entrada pelo servico
        const entrada = await atualizarEntrada(
            idUsuario,
            idEntrada,
            dados
        );

        // Retornar a entrada atualizada
        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Entrada atualizada com sucesso.",
            entrada
        });

    } catch (erro) {
        // Tratar dados invalidos e entradas nao encontradas
        if (
            erro.status === 400 ||
            erro.status === 401 ||
            erro.status === 404
        ) {
            return resposta.status(erro.status).json({
                status: "erro",
                mensagem: erro.message
            });
        }

        // Registrar erros inesperados no servidor
        console.error("Erro ao atualizar entrada:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao atualizar entrada."
        });
    }
}

// Receber a solicitacao para excluir uma entrada financeira
async function removerEntrada(requisicao, resposta) {
    try {
        // Identificar o usuario autenticado pelo JWT
        const idUsuario = requisicao.usuario.id_usuario;

        // Obter o identificador da entrada pela URL
        const idEntrada = Number(requisicao.params.id);

        // Excluir a entrada pelo servico
        const resultado = await excluirEntrada(
            idUsuario,
            idEntrada
        );

        // Confirmar a exclusao
        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Entrada excluida com sucesso.",
            entrada: resultado
        });

    } catch (erro) {
        // Tratar identificadores invalidos e entradas nao encontradas
        if (
            erro.status === 400 ||
            erro.status === 401 ||
            erro.status === 404
        ) {
            return resposta.status(erro.status).json({
                status: "erro",
                mensagem: erro.message
            });
        }

        // Registrar erros inesperados no servidor
        console.error("Erro ao excluir entrada:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao excluir entrada."
        });
    }
}

// Exportar as funcoes do controlador
module.exports = {
    registrarEntrada,
    consultarEntradas,
    editarEntrada,
    removerEntrada
};
