const express = require("express");

const pool = require("../conexaoBanco");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const roteador = express.Router();

// Tipos que o front-end pode consultar
const TIPOS_PERMITIDOS = [
    "ENTRADA",
    "DESPESA",
    "CONTA",
    "META",
    "RESERVA"
];

// Consultar as categorias do tipo solicitado
roteador.get("/", verificarAutenticacao, async (requisicao, resposta) => {
    try {
        const idUsuario = requisicao.usuario.id_usuario;
        const tipo = requisicao.query.tipo;

        if (!TIPOS_PERMITIDOS.includes(tipo)) {
            return resposta.status(400).json({
                status: "erro",
                mensagem: "Informe um tipo de categoria valido."
            });
        }

        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
            return resposta.status(401).json({
                status: "erro",
                mensagem: "Usuario autenticado invalido."
            });
        }

        // Categorias fixas ou vinculadas ao usuario
        const categorias = await pool.query(
            `SELECT
                id_categoria,
                nome,
                tipo
             FROM categorias
             WHERE tipo = ?
               AND (
                   id_usuario IS NULL
                   OR id_usuario = ?
               )
             ORDER BY id_categoria ASC`,
            [tipo, idUsuario]
        );

        return resposta.status(200).json({
            status: "sucesso",
            categorias: categorias.map((categoria) => ({
                id_categoria: Number(categoria.id_categoria),
                nome: categoria.nome,
                tipo: categoria.tipo
            }))
        });

    } catch (erro) {
        console.error("Erro ao consultar categorias:", erro);

        return resposta.status(500).json({
            status: "erro",
            mensagem: "Erro interno ao consultar categorias."
        });
    }
});

module.exports = roteador;