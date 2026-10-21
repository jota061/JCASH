const express = require("express");

const {
    registrarDespesa,
    consultarDespesas,
    editarDespesa,
    removerDespesa
} = require("../controladores/controladorDespesas");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const roteador = express.Router();

// Todas as rotas de despesas exigem autenticacao JWT
roteador.post("/", verificarAutenticacao, registrarDespesa);
roteador.get("/", verificarAutenticacao, consultarDespesas);
roteador.put("/:id", verificarAutenticacao, editarDespesa);
roteador.delete("/:id", verificarAutenticacao, removerDespesa);

module.exports = roteador;