const express = require("express");

const {
    registrarRecorrencia,
    consultarRecorrencias,
    editarRecorrencia,
    gerarMensalidade,
    removerRecorrencia
} = require("../controladores/controladorRecorrencias");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const roteador = express.Router();

// Proteger todas as rotas de recorrencias com JWT
roteador.use(verificarAutenticacao);

// Cadastrar e consultar recorrencias
roteador.post("/", registrarRecorrencia);
roteador.get("/", consultarRecorrencias);

// Editar uma recorrencia ativa
roteador.put("/:id", editarRecorrencia);

// Gerar a conta de um mes especifico
roteador.post("/:id/gerar", gerarMensalidade);

// Encerrar uma recorrencia utilizando a Regra B
roteador.delete("/:id", removerRecorrencia);

module.exports = roteador;