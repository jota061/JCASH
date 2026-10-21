const pool = require("../conexaoBanco");

function criarErro(mensagem, status) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function validarId(valor, nome) {
    if (!Number.isSafeInteger(valor) || valor <= 0) {
        throw criarErro(`${nome} invalido.`, 400);
    }
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
        throw criarErro("Informe uma data valida no formato AAAA-MM-DD.", 400);
    }

    const verificada = new Date(`${data}T00:00:00Z`);

    if (Number.isNaN(verificada.getTime()) ||
        verificada.toISOString().slice(0, 10) !== data) {
        throw criarErro("A data informada nao existe.", 400);
    }

    return data;
}

function validarDadosMeta(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro("Envie os dados da meta.", 400);
    }

    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";

    if (!nome || nome.length > 100) {
        throw criarErro("Informe um nome de meta com ate 100 caracteres.", 400);
    }

    validarId(dados.id_categoria, "Categoria");

    return {
        nome,
        idCategoria: dados.id_categoria,
        valorMeta: validarValor(dados.valor_meta),
        dataLimite: validarData(dados.data_limite)
    };
}

// Conferir a categoria e o usuario
async function validarCategoria(idUsuario, idCategoria) {
    const categorias = await pool.query(
        `SELECT id_categoria FROM categorias
         WHERE id_categoria = ? AND tipo = 'META'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        throw criarErro("Categoria invalida para esta meta.", 400);
    }
}

// O total aportado e calculado a partir dos aportes registrados
const consultaMetas = `
    SELECT m.id_meta, m.id_usuario, m.id_categoria, m.nome, m.valor_meta,
           DATE_FORMAT(m.data_limite, '%Y-%m-%d') AS data_limite,
           COALESCE((SELECT SUM(a.valor)
                     FROM aportes_metas a
                     WHERE a.id_meta = m.id_meta), 0) AS total_aportado
    FROM metas m`;

function formatarMeta(meta) {
    const objetivo = Number(meta.valor_meta);
    const total = Number(meta.total_aportado);
    const percentual = Number(((total / objetivo) * 100).toFixed(2));

    return {
        id_meta: Number(meta.id_meta),
        id_usuario: Number(meta.id_usuario),
        id_categoria: Number(meta.id_categoria),
        nome: meta.nome,
        valor_meta: objetivo,
        data_limite: meta.data_limite,
        total_aportado: total,
        percentual,
        percentual_visual: Math.min(percentual, 100)
    };
}

// Consultar uma meta ativa pertencente ao usuario
async function consultarMeta(idUsuario, idMeta) {
    validarUsuario(idUsuario);
    validarId(idMeta, "Identificador da meta");

    const metas = await pool.query(
        `${consultaMetas}
         WHERE m.id_meta = ? AND m.id_usuario = ? AND m.deleted_at IS NULL
         LIMIT 1`,
        [idMeta, idUsuario]
    );

    if (metas.length === 0) {
        throw criarErro("Meta nao encontrada.", 404);
    }

    return formatarMeta(metas[0]);
}

// Listar somente as metas ativas do usuario
async function listarMetas(idUsuario) {
    validarUsuario(idUsuario);

    const metas = await pool.query(
        `${consultaMetas}
         WHERE m.id_usuario = ? AND m.deleted_at IS NULL
         ORDER BY m.id_meta DESC`,
        [idUsuario]
    );

    return metas.map(formatarMeta);
}

// Cadastrar uma meta financeira
async function cadastrarMeta(idUsuario, dados) {
    validarUsuario(idUsuario);

    const valores = validarDadosMeta(dados);
    await validarCategoria(idUsuario, valores.idCategoria);

    const resultado = await pool.query(
        `INSERT INTO metas (id_usuario, id_categoria, nome, valor_meta, data_limite)
         VALUES (?, ?, ?, ?, ?)`,
        [
            idUsuario,
            valores.idCategoria,
            valores.nome,
            valores.valorMeta,
            valores.dataLimite
        ]
    );

    return consultarMeta(idUsuario, Number(resultado.insertId));
}

// Editar uma meta ativa
async function atualizarMeta(idUsuario, idMeta, dados) {
    validarUsuario(idUsuario);
    validarId(idMeta, "Identificador da meta");

    const valores = validarDadosMeta(dados);
    await validarCategoria(idUsuario, valores.idCategoria);

    const resultado = await pool.query(
        `UPDATE metas
         SET id_categoria = ?, nome = ?, valor_meta = ?, data_limite = ?
         WHERE id_meta = ? AND id_usuario = ? AND deleted_at IS NULL`,
        [
            valores.idCategoria,
            valores.nome,
            valores.valorMeta,
            valores.dataLimite,
            idMeta,
            idUsuario
        ]
    );

    if (Number(resultado.affectedRows) === 0) {
        // Tambem permite conferir uma edicao sem mudanca de valores
        return consultarMeta(idUsuario, idMeta);
    }

    return consultarMeta(idUsuario, idMeta);
}

// Registrar apenas aportes positivos
async function registrarAporteMeta(idUsuario, idMeta, dados) {
    validarUsuario(idUsuario);
    validarId(idMeta, "Identificador da meta");

    const valor = validarValor(dados && dados.valor);
    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        // Evitar aportes em uma meta excluida durante a operacao
        const metas = await conexao.query(
            `SELECT id_meta FROM metas
             WHERE id_meta = ? AND id_usuario = ? AND deleted_at IS NULL
             FOR UPDATE`,
            [idMeta, idUsuario]
        );

        if (metas.length === 0) {
            throw criarErro("Meta nao encontrada.", 404);
        }

        const resultado = await conexao.query(
            `INSERT INTO aportes_metas (id_meta, valor) VALUES (?, ?)`,
            [idMeta, valor]
        );

        await conexao.commit();

        return {
            id_aporte: Number(resultado.insertId),
            id_meta: idMeta,
            valor
        };
    } catch (erro) {
        if (conexao) await conexao.rollback();
        throw erro;
    } finally {
        if (conexao) conexao.release();
    }
}

// Consultar os aportes de uma meta
async function listarAportesMeta(idUsuario, idMeta) {
    await consultarMeta(idUsuario, idMeta);

    const aportes = await pool.query(
        `SELECT a.id_aporte, a.id_meta, a.valor,
                DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS criado_em
         FROM aportes_metas a
         INNER JOIN metas m ON m.id_meta = a.id_meta
         WHERE a.id_meta = ? AND m.id_usuario = ? AND m.deleted_at IS NULL
         ORDER BY a.id_aporte DESC`,
        [idMeta, idUsuario]
    );

    return aportes.map((aporte) => ({
        id_aporte: Number(aporte.id_aporte),
        id_meta: Number(aporte.id_meta),
        valor: Number(aporte.valor),
        criado_em: aporte.criado_em
    }));
}

// Exclusao logica: os aportes permanecem armazenados
async function excluirMeta(idUsuario, idMeta) {
    validarUsuario(idUsuario);
    validarId(idMeta, "Identificador da meta");

    const resultado = await pool.query(
        `UPDATE metas SET deleted_at = NOW()
         WHERE id_meta = ? AND id_usuario = ? AND deleted_at IS NULL`,
        [idMeta, idUsuario]
    );

    if (Number(resultado.affectedRows) === 0) {
        throw criarErro("Meta nao encontrada.", 404);
    }

    return { id_meta: idMeta };
}

module.exports = {
    cadastrarMeta,
    listarMetas,
    consultarMeta,
    atualizarMeta,
    registrarAporteMeta,
    listarAportesMeta,
    excluirMeta
};