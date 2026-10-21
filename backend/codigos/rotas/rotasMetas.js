const express = require("express");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const {
    registrarMeta,
    consultarMetas,
    consultarMetaPorId,
    editarMeta,
    registrarAporte,
    consultarAportes,
    removerMeta
} = require("../controladores/controladorMetas");

const roteador = express.Router();

// Todas as rotas exigem autenticacao JWT
roteador.use(verificarAutenticacao);

// Cadastro e consulta de metas
roteador.post("/", registrarMeta);
roteador.get("/", consultarMetas);

// Consulta, edicao e exclusao logica
roteador.get("/:id", consultarMetaPorId);
roteador.put("/:id", editarMeta);
roteador.delete("/:id", removerMeta);

// Aportes de uma meta
roteador.post("/:id/aportes", registrarAporte);
roteador.get("/:id/aportes", consultarAportes);

module.exports = roteador;