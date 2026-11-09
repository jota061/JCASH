const express = require("express");
const { registrarUsuario, autenticarUsuario } = require("../controladores/controladorAutenticacao");
const { consultarPerfil, editarNomeSocial, alterarSenha, excluirConta } = require("../controladores/controladorPerfil");
const { verificarAutenticacao } = require("../intermediarios/verificarAutenticacao");
const roteador = express.Router();

// Cadastrar usuarios
roteador.post("/cadastro", registrarUsuario);

// Realizar login
roteador.post("/login", autenticarUsuario);

// Verificar um JWT
roteador.get("/verificar", verificarAutenticacao,
    (requisicao, resposta) => {
        return resposta.status(200).json({
            status: "sucesso",
            mensagem: "Token valido. Acesso autorizado.",
            usuario: { id_usuario: requisicao.usuario.id_usuario }
        });
    }
);

// Consultar os dados reais do usuario autenticado
roteador.get("/perfil", verificarAutenticacao, consultarPerfil);

// Atualizar o nome social do usuario autenticado
roteador.patch("/perfil", verificarAutenticacao, editarNomeSocial);

// Alterar a senha do usuario autenticado
roteador.patch("/perfil/senha", verificarAutenticacao, alterarSenha
);

// Excluir definitivamente a conta do usuario autenticado
roteador.delete("/perfil", verificarAutenticacao, excluirConta);

module.exports = roteador;
