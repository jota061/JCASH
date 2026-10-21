
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

function validarId(idRecorrencia) {
    if (!Number.isSafeInteger(idRecorrencia) || idRecorrencia <= 0) {
        throw criarErro("Identificador da recorrencia invalido.", 400);
    }
}

function validarData(data) {
    const formato = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (typeof data !== "string" || !formato.test(data)) {
        throw criarErro("Informe datas validas no formato AAAA-MM-DD.", 400);
    }

    const dataConvertida = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(dataConvertida.getTime()) ||
        dataConvertida.toISOString().slice(0, 10) !== data
    ) {
        throw criarErro("A data informada nao existe.", 400);
    }

    return data;
}

function validarDados(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro("Envie os dados da recorrencia.", 400);
    }

    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
    const valor = dados.valor;
    const idCategoria = dados.id_categoria;
    const dataInicio = validarData(dados.data_inicio);
    const dataFim = validarData(dados.data_fim);

    if (!nome || nome.length > 100) {
        throw criarErro("Informe um nome valido com ate 100 caracteres.", 400);
    }

    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(String(valor))
    ) {
        throw criarErro("Informe um valor positivo com ate duas casas decimais.", 400);
    }

    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        throw criarErro("Informe uma categoria valida.", 400);
    }

    if (dataFim < dataInicio) {
        throw criarErro("A data final nao pode ser anterior a data inicial.", 400);
    }

    return { nome, valor, idCategoria, dataInicio, dataFim };
}

// Conferir se a categoria pertence ao tipo CONTA
async function validarCategoria(conexao, idCategoria, idUsuario) {
    const categorias = await conexao.query(
        `SELECT id_categoria FROM categorias
         WHERE id_categoria = ?
           AND tipo = 'CONTA'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        throw criarErro("Categoria invalida para esta recorrencia.", 400);
    }
}

function formatarRecorrencia(recorrencia) {
    return {
        id_recorrencia: Number(recorrencia.id_recorrencia),
        id_categoria: Number(recorrencia.id_categoria),
        nome: recorrencia.nome,
        valor: Number(recorrencia.valor),
        data_inicio: recorrencia.data_inicio,
        data_fim: recorrencia.data_fim,
        ativa: recorrencia.deleted_at === null
    };
}

const consultaRecorrencia = `
    SELECT id_recorrencia, id_categoria, nome, valor,
           DATE_FORMAT(data_inicio, '%Y-%m-%d') AS data_inicio,
           DATE_FORMAT(data_fim, '%Y-%m-%d') AS data_fim,
           deleted_at
    FROM recorrencias_conta`;

// Cadastrar uma recorrencia
async function cadastrarRecorrencia(idUsuario, dados) {
    validarUsuario(idUsuario);

    const valores = validarDados(dados);
    await validarCategoria(pool, valores.idCategoria, idUsuario);

    const resultado = await pool.query(
        `INSERT INTO recorrencias_conta
         (id_usuario, id_categoria, nome, valor, data_inicio, data_fim)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            idUsuario,
            valores.idCategoria,
            valores.nome,
            valores.valor,
            valores.dataInicio,
            valores.dataFim
        ]
    );

    return {
        id_recorrencia: Number(resultado.insertId),
        id_categoria: valores.idCategoria,
        nome: valores.nome,
        valor: valores.valor,
        data_inicio: valores.dataInicio,
        data_fim: valores.dataFim,
        ativa: true
    };
}

// Listar recorrencias, inclusive as excluidas do historico
async function listarRecorrencias(idUsuario) {
    validarUsuario(idUsuario);

    const recorrencias = await pool.query(
        `${consultaRecorrencia}
         WHERE id_usuario = ?
         ORDER BY id_recorrencia DESC`,
        [idUsuario]
    );

    return recorrencias.map(formatarRecorrencia);
}

// Atualizar uma recorrencia ainda ativa
async function atualizarRecorrencia(idUsuario, idRecorrencia, dados) {
    validarUsuario(idUsuario);
    validarId(idRecorrencia);

    const valores = validarDados(dados);
    await validarCategoria(pool, valores.idCategoria, idUsuario);

    try {
        const resultado = await pool.query(
            `UPDATE recorrencias_conta
             SET id_categoria = ?,
                 nome = ?,
                 valor = ?,
                 data_inicio = ?,
                 data_fim = ?
             WHERE id_recorrencia = ?
               AND id_usuario = ?
               AND deleted_at IS NULL`,
            [
                valores.idCategoria,
                valores.nome,
                valores.valor,
                valores.dataInicio,
                valores.dataFim,
                idRecorrencia,
                idUsuario
            ]
        );

        if (Number(resultado.affectedRows) === 0) {
            // Uma edicao sem mudancas pode afetar zero linhas
            const existentes = await pool.query(
                `SELECT id_recorrencia FROM recorrencias_conta
                 WHERE id_recorrencia = ?
                   AND id_usuario = ?
                   AND deleted_at IS NULL
                 LIMIT 1`,
                [idRecorrencia, idUsuario]
            );

            if (existentes.length === 0) {
                throw criarErro("Recorrencia nao encontrada ou excluida.", 404);
            }
        }
    } catch (erro) {
        if (erro.errno === 1644 || erro.errno === 4025) {
            throw criarErro("A alteracao conflita com contas ja vinculadas.", 409);
        }

        throw erro;
    }

    const encontrados = await pool.query(
        `${consultaRecorrencia}
         WHERE id_recorrencia = ?
           AND id_usuario = ?
         LIMIT 1`,
        [idRecorrencia, idUsuario]
    );

    return formatarRecorrencia(encontrados[0]);
}

// Gerar somente a conta do mes solicitado: AAAA-MM
async function gerarContaMensal(idUsuario, idRecorrencia, mes) {
    validarUsuario(idUsuario);
    validarId(idRecorrencia);

    if (
        typeof mes !== "string" ||
        !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(mes)
    ) {
        throw criarErro("Informe o mes no formato AAAA-MM.", 400);
    }

    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        // Bloquear alteracoes simultaneas na recorrencia
        const recorrencias = await conexao.query(
            `${consultaRecorrencia}
             WHERE id_recorrencia = ?
               AND id_usuario = ?
               AND deleted_at IS NULL
             FOR UPDATE`,
            [idRecorrencia, idUsuario]
        );

        if (recorrencias.length === 0) {
            throw criarErro("Recorrencia nao encontrada ou excluida.", 404);
        }

        const recorrencia = recorrencias[0];
        const [ano, numeroMes] = mes.split("-").map(Number);

        // Manter o dia original, ajustando meses mais curtos
        const diaOriginal = Number(recorrencia.data_inicio.slice(8, 10));
        const ultimoDia = new Date(
            Date.UTC(ano, numeroMes, 0)
        ).getUTCDate();

        const dia = Math.min(diaOriginal, ultimoDia);
        const vencimento = `${mes}-${String(dia).padStart(2, "0")}`;

        if (
            vencimento < recorrencia.data_inicio ||
            vencimento > recorrencia.data_fim
        ) {
            throw criarErro("Mes fora do periodo permitido para a recorrencia.", 400);
        }

        // Impedir a criacao de duas contas no mesmo mes
        const existentes = await conexao.query(
            `SELECT id_conta FROM contas
             WHERE id_recorrencia = ?
               AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?
             LIMIT 1`,
            [idRecorrencia, mes]
        );

        if (existentes.length > 0) {
            await conexao.commit();

            return {
                id_conta: Number(existentes[0].id_conta),
                data_vencimento: vencimento,
                criada: false
            };
        }

        const resultado = await conexao.query(
            `INSERT INTO contas
             (id_usuario, id_categoria, id_recorrencia,
              nome, valor, data_vencimento, tipo_cobranca, status)
             VALUES (?, ?, ?, ?, ?, ?, 'MENSAL', 'PENDENTE')`,
            [
                idUsuario,
                recorrencia.id_categoria,
                idRecorrencia,
                recorrencia.nome,
                recorrencia.valor,
                vencimento
            ]
        );

        await conexao.commit();

        return {
            id_conta: Number(resultado.insertId),
            data_vencimento: vencimento,
            criada: true
        };
    } catch (erro) {
        if (conexao) {
            await conexao.rollback();
        }

        throw erro;
    } finally {
        if (conexao) {
            await conexao.release();
        }
    }
}

// Regra B: preservar contas pagas e pendentes vencidas.
// Remover somente as contas futuras que continuam pendentes.
async function excluirRecorrencia(idUsuario, idRecorrencia) {
    validarUsuario(idUsuario);
    validarId(idRecorrencia);

    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const recorrencias = await conexao.query(
            `SELECT id_recorrencia
             FROM recorrencias_conta
             WHERE id_recorrencia = ?
               AND id_usuario = ?
               AND deleted_at IS NULL
             FOR UPDATE`,
            [idRecorrencia, idUsuario]
        );

        if (recorrencias.length === 0) {
            throw criarErro("Recorrencia nao encontrada ou excluida.", 404);
        }

        // Contas futuras e pendentes deixam de existir
        const exclusaoFuturas = await conexao.query(
            `DELETE FROM contas
             WHERE id_recorrencia = ?
               AND id_usuario = ?
               AND status = 'PENDENTE'
               AND data_vencimento > CURDATE()`,
            [idRecorrencia, idUsuario]
        );

        // A recorrencia e marcada como excluida, preservando o historico
        await conexao.query(
            `UPDATE recorrencias_conta
             SET deleted_at = NOW()
             WHERE id_recorrencia = ?
               AND id_usuario = ?`,
            [idRecorrencia, idUsuario]
        );

        await conexao.commit();

        return {
            id_recorrencia: idRecorrencia,
            contas_futuras_removidas: Number(exclusaoFuturas.affectedRows)
        };
    } catch (erro) {
        if (conexao) {
            await conexao.rollback();
        }

        throw erro;
    } finally {
        if (conexao) {
            await conexao.release();
        }
    }
}

module.exports = {
    cadastrarRecorrencia,
    listarRecorrencias,
    atualizarRecorrencia,
    gerarContaMensal,
    excluirRecorrencia
};
