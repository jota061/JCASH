const express = require("express");
const pool = require("../conexaoBanco");
const router = express.Router();

// Verificar o funcionamento da API
router.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
        aplicacao: "JCASH",
        mensagem: "API funcionando corretamente"
    });
});

// Verificar a conexao com o MariaDB
router.get("/db", async (req, res) => {
    try {
        await pool.query("SELECT 1 AS conectado");

        res.status(200).json({
            status: "ok",
            banco: "conectado"
        });

    } catch (erro) {
        console.error("Erro na conexao com MariaDB:", erro.message);

        res.status(503).json({
            status: "erro",
            mensagem: "Banco de dados indisponivel"
        });
    }
});

module.exports = router;
