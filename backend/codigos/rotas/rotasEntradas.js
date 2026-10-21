
const express = require("express");

const {
    registrarEntrada,
    consultarEntradas,
    editarEntrada,
    removerEntrada
} = require("../controladores/controladorEntradas");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const roteador = express.Router();

// Rota protegida para cadastrar entradas financeiras
roteador.post("/", verificarAutenticacao, registrarEntrada);

// Rota protegida para consultar entradas financeiras
roteador.get("/", verificarAutenticacao, consultarEntradas);

// Rota protegida para editar uma entrada financeira
roteador.put("/:id", verificarAutenticacao, editarEntrada);

// Rota protegida para excluir uma entrada financeira
roteador.delete("/:id", verificarAutenticacao, removerEntrada);

module.exports = roteador;
