const pool = require("../conexaoBanco");

function criarErro(mensagem, status) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function validarUsuario(idUsuario) {
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        throw criarErro("Usuario autenticado invalido.", 401);
    }
}

function validarValor(valor) {
    if (typeof valor !== "number" || !Number.isFinite(valor) ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(String(valor)) || valor <= 0) {
        throw criarErro("Informe um valor positivo com ate duas casas decimais.", 400);
    }

    return valor;
}

function validarData(data) {
    if (typeof data !== "string" ||
        !/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)) {
        throw criarErro("Informe uma data no formato AAAA-MM-DD.", 400);
    }

    const verificada = new Date(`${data}T00:00:00Z`);

    if (Number.isNaN(verificada.getTime()) ||
        verificada.toISOString().slice(0, 10) !== data) {
        throw criarErro("A data informada nao existe.", 400);
    }

    return data;
}

// Verificar os dados de um aporte ou resgate
function validarMovimento(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro("Envie os dados do movimento.", 400);
    }

    const tipo = dados.tipo;

    if (tipo !== "APORTE" && tipo !== "RESGATE") {
        throw criarErro("Tipo deve ser APORTE ou RESGATE.", 400);
    }

    const motivo = dados.motivo === undefined || dados.motivo === null
        ? null
        : typeof dados.motivo === "string" ? dados.motivo.trim() : "";

    if (motivo !== null && motivo.length > 255) {
        throw criarErro("O motivo deve ter ate 255 caracteres.", 400);
    }

    // Aportes nao possuem categoria
    if (tipo === "APORTE" && dados.id_categoria != null) {
        throw criarErro("Aportes nao possuem categoria.", 400);
    }

    // Resgates exigem categoria e motivo
    if (tipo === "RESGATE") {
        if (!Number.isSafeInteger(dados.id_categoria) ||
            dados.id_categoria <= 0) {
            throw criarErro("O resgate exige uma categoria valida.", 400);
        }

        if (!motivo) {
            throw criarErro("Informe o motivo do resgate.", 400);
        }
    }

    return {
        tipo,
        valor: validarValor(dados.valor),
        dataMovimento: validarData(dados.data_movimento),
        idCategoria: tipo === "APORTE" ? null : dados.id_categoria,
        motivo: motivo || null
    };
}

// Uma categoria de resgate precisa ser do tipo RESERVA
async function validarCategoriaResgate(conexao, idUsuario, idCategoria) {
    const categorias = await conexao.query(
        `SELECT id_categoria FROM categorias
         WHERE id_categoria = ? AND tipo = 'RESERVA'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        throw criarErro("Categoria invalida para este resgate.", 400);
    }
}

// Trabalhar com centavos evita erros comuns de comparacao decimal
function paraCentavos(valor) {
    const centavos = Math.round(Number(valor) * 100);

    if (!Number.isSafeInteger(centavos)) {
        throw criarErro("Total financeiro excede o limite permitido.", 409);
    }

    return centavos;
}

// Calcular o saldo, sem armazenar uma coluna de saldo
async function obterResumo(conexao, idUsuario) {
    const registros = await conexao.query(
        `SELECT
            COALESCE(SUM(CASE WHEN tipo = 'APORTE' THEN valor ELSE 0 END), 0)
                AS total_aportes,
            COALESCE(SUM(CASE WHEN tipo = 'RESGATE' THEN valor ELSE 0 END), 0)
                AS total_resgates
         FROM movimentos_reserva
         WHERE id_usuario = ?`,
        [idUsuario]
    );

    const totalAportes = paraCentavos(registros[0].total_aportes);
    const totalResgates = paraCentavos(registros[0].total_resgates);

    return {
        total_aportes: totalAportes / 100,
        total_resgates: totalResgates / 100,
        saldo: (totalAportes - totalResgates) / 100
    };
}

// Consultar o resumo financeiro da reserva
async function consultarReserva(idUsuario) {
    validarUsuario(idUsuario);
    return obterResumo(pool, idUsuario);
}

// Consultar o historico de movimentos do usuario
async function listarMovimentos(idUsuario) {
    validarUsuario(idUsuario);

    const movimentos = await pool.query(
        `SELECT id_movimento, id_categoria, tipo, valor,
                DATE_FORMAT(data_movimento, '%Y-%m-%d') AS data_movimento,
                motivo
         FROM movimentos_reserva
         WHERE id_usuario = ?
         ORDER BY data_movimento DESC, id_movimento DESC`,
        [idUsuario]
    );

    return movimentos.map((movimento) => ({
        id_movimento: Number(movimento.id_movimento),
        id_categoria: movimento.id_categoria === null
            ? null
            : Number(movimento.id_categoria),
        tipo: movimento.tipo,
        valor: Number(movimento.valor),
        data_movimento: movimento.data_movimento,
        motivo: movimento.motivo
    }));
}

// Registrar um aporte ou resgate na reserva
async function registrarMovimento(idUsuario, dados) {
    validarUsuario(idUsuario);

    const movimento = validarMovimento(dados);
    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        // Evitar que resgates simultaneos ultrapassem o saldo
        const usuarios = await conexao.query(
            `SELECT id_usuario FROM usuarios
             WHERE id_usuario = ? FOR UPDATE`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            throw criarErro("Usuario nao encontrado.", 404);
        }

        if (movimento.tipo === "RESGATE") {
            await validarCategoriaResgate(
                conexao,
                idUsuario,
                movimento.idCategoria
            );

            const resumoAtual = await obterResumo(conexao, idUsuario);

            if (
                paraCentavos(movimento.valor) >
                paraCentavos(resumoAtual.saldo)
            ) {
                throw criarErro(
                    "Saldo insuficiente na reserva de emergencia.",
                    409
                );
            }
        }

        const resultado = await conexao.query(
            `INSERT INTO movimentos_reserva
             (id_usuario, id_categoria, tipo, valor, data_movimento, motivo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                idUsuario,
                movimento.idCategoria,
                movimento.tipo,
                movimento.valor,
                movimento.dataMovimento,
                movimento.motivo
            ]
        );

        const resumo = await obterResumo(conexao, idUsuario);

        await conexao.commit();

        return {
            movimento: {
                id_movimento: Number(resultado.insertId),
                id_categoria: movimento.idCategoria,
                tipo: movimento.tipo,
                valor: movimento.valor,
                data_movimento: movimento.dataMovimento,
                motivo: movimento.motivo
            },
            resumo
        };
    } catch (erro) {
        if (conexao) await conexao.rollback();
        throw erro;
    } finally {
        if (conexao) conexao.release();
    }
}

module.exports = {
    consultarReserva,
    listarMovimentos,
    registrarMovimento
};