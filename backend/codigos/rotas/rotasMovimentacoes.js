const express = require("express");
const pool = require("../conexaoBanco");

const {
    verificarAutenticacao
} = require("../intermediarios/verificarAutenticacao");

const roteador = express.Router();

// Reunir entradas, despesas e pagamentos pela hora real da operacao.
roteador.get(
    "/recentes",
    verificarAutenticacao,
    async (requisicao, resposta) => {
        const idUsuario = requisicao.usuario.id_usuario;

        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
            return resposta.status(401).json({
                status: "erro",
                mensagem: "Usuario autenticado invalido."
            });
        }

        try {
            const registros = await pool.query(
                `SELECT
                     id,
                     titulo,
                     categoria,
                     valor,
                     data,
                     tipo
                 FROM (
                     SELECT
                         CONCAT('entrada-', id_entrada) AS id,
                         nome AS titulo,
                         'Entrada' AS categoria,
                         valor,
                         DATE_FORMAT(
                             COALESCE(created_at, data),
                             '%Y-%m-%d'
                         ) AS data,
                         created_at AS momento,
                         id_entrada AS ordem,
                         'ENTRADA' AS tipo
                     FROM entradas
                     WHERE id_usuario = ?

                     UNION ALL

                     SELECT
                         CONCAT('despesa-', id_despesa) AS id,
                         nome AS titulo,
                         'Despesa' AS categoria,
                         -valor AS valor,
                         DATE_FORMAT(
                             COALESCE(created_at, data),
                             '%Y-%m-%d'
                         ) AS data,
                         created_at AS momento,
                         id_despesa AS ordem,
                         'DESPESA' AS tipo
                     FROM despesas
                     WHERE id_usuario = ?

                     UNION ALL

                     SELECT
                         CONCAT('conta-', id_conta) AS id,
                         nome AS titulo,
                         'Conta paga' AS categoria,
                         -valor AS valor,
                         DATE_FORMAT(
                             COALESCE(pago_em, data_pagamento),
                             '%Y-%m-%d'
                         ) AS data,
                         pago_em AS momento,
                         id_conta AS ordem,
                         'DESPESA' AS tipo
                     FROM contas
                     WHERE id_usuario = ?
                       AND status = 'PAGA'
                 ) AS historico
                 ORDER BY
                     CASE
                         WHEN momento IS NULL THEN 1
                         ELSE 0
                     END ASC,
                     momento DESC,
                     data DESC,
                     ordem DESC,
                     id DESC
                 LIMIT 5`,
                [idUsuario, idUsuario, idUsuario]
            );

            return resposta.status(200).json({
                status: "sucesso",
                movimentacoes: registros.map((registro) => ({
                    id: registro.id,
                    titulo: registro.titulo,
                    categoria: registro.categoria,
                    valor: Number(registro.valor),
                    data: registro.data,
                    tipo: registro.tipo
                }))
            });

        } catch (erro) {
            console.error(
                "Erro ao consultar movimentacoes recentes:",
                erro
            );

            return resposta.status(500).json({
                status: "erro",
                mensagem:
                    "Nao foi possivel consultar as ultimas movimentacoes."
            });
        }
    }
);

module.exports = roteador;