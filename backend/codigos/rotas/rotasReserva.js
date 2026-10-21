const express = require("express");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const {
    consultarSaldo,
    consultarMovimentos,
    registrarMovimentoReserva
} = require("../controladores/controladorReserva");

const roteador = express.Router();

// Protecao JWT obrigatoria
roteador.use(verificarAutenticacao);

// Consultar resumo e saldo
roteador.get("/", consultarSaldo);

// Consultar e registrar movimentos
roteador.get("/movimentos", consultarMovimentos);
roteador.post("/movimentos", registrarMovimentoReserva);

module.exports = roteador;