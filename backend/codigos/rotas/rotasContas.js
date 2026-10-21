const express = require("express");

const {
    registrarConta,
    consultarContas,
    consultarContaPorId,
    editarConta,
    registrarPagamento,
    registrarCancelamento,
    removerConta
} = require("../controladores/controladorContas");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const roteador = express.Router();

// Todas as rotas de contas exigem autenticacao JWT
roteador.use(verificarAutenticacao);

// Cadastrar pagamento unico
roteador.post("/", registrarConta);

// Consultar contas
roteador.get("/", consultarContas);
roteador.get("/:id", consultarContaPorId);

// Editar, pagar ou cancelar uma conta
roteador.put("/:id", editarConta);
roteador.patch("/:id/pagar", registrarPagamento);
roteador.patch("/:id/cancelar", registrarCancelamento);

// Excluir pagamento unico pendente
roteador.delete("/:id", removerConta);

module.exports = roteador;