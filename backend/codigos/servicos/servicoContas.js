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

function validarId(idConta) {
    if (!Number.isSafeInteger(idConta) || idConta <= 0) {
        throw criarErro("Identificador da conta invalido.", 400);
    }
}

function validarData(data) {
    if (
        typeof data !== "string" ||
        !/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)
    ) {
        throw criarErro("Informe uma data no formato AAAA-MM-DD.", 400);
    }

    const verificada = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(verificada.getTime()) ||
        verificada.toISOString().slice(0, 10) !== data
    ) {
        throw criarErro("A data informada nao existe.", 400);
    }

    return data;
}

function validarDados(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro("Envie os dados da conta.", 400);
    }

    const nome = typeof dados.nome === "string"
        ? dados.nome.trim()
        : "";

    const valor = dados.valor;
    const idCategoria = dados.id_categoria;
    const vencimento = validarData(dados.data_vencimento);

    if (!nome || nome.length > 100) {
        throw criarErro(
            "Informe um nome valido com ate 100 caracteres.",
            400
        );
    }

    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(String(valor))
    ) {
        throw criarErro(
            "Informe um valor positivo com ate duas casas decimais.",
            400
        );
    }

    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        throw criarErro("Informe uma categoria valida.", 400);
    }

    return { nome, valor, idCategoria, vencimento };
}

// Verificar a categoria e seu vinculo com o usuario.
async function validarCategoria(conexao, idCategoria, idUsuario) {
    const categorias = await conexao.query(
        `SELECT id_categoria
         FROM categorias
         WHERE id_categoria = ?
           AND tipo = 'CONTA'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        throw criarErro("Categoria invalida para esta conta.", 400);
    }
}

// Campos retornados pelas consultas de contas.
const camposConta = `
    SELECT
        id_conta,
        id_usuario,
        id_categoria,
        id_recorrencia,
        recorrencia_excluida,
        nome,
        valor,
        DATE_FORMAT(data_vencimento, '%Y-%m-%d') AS data_vencimento,
        tipo_cobranca,
        status,
        DATE_FORMAT(data_pagamento, '%Y-%m-%d') AS data_pagamento
    FROM contas
`;

function formatarConta(conta) {
    return {
        id_conta: Number(conta.id_conta),
        id_usuario: Number(conta.id_usuario),
        id_categoria: Number(conta.id_categoria),
        id_recorrencia: conta.id_recorrencia === null
            ? null
            : Number(conta.id_recorrencia),
        recorrencia_excluida: Boolean(conta.recorrencia_excluida),
        nome: conta.nome,
        valor: Number(conta.valor),
        data_vencimento: conta.data_vencimento,
        tipo_cobranca: conta.tipo_cobranca,
        status: conta.status,
        data_pagamento: conta.data_pagamento
    };
}

// Buscar somente contas pertencentes ao usuario.
async function buscarConta(conexao, idUsuario, idConta, bloquear = false) {
    const encontradas = await conexao.query(
        `${camposConta}
         WHERE id_conta = ?
           AND id_usuario = ?
         LIMIT 1${bloquear ? " FOR UPDATE" : ""}`,
        [idConta, idUsuario]
    );

    if (encontradas.length === 0) {
        throw criarErro("Conta nao encontrada.", 404);
    }

    return formatarConta(encontradas[0]);
}

// Cadastrar contas de pagamento unico.
async function cadastrarConta(idUsuario, dados) {
    validarUsuario(idUsuario);

    const campos = validarDados(dados);

    if (
        dados.tipo_cobranca !== "PAGAMENTO_UNICO" ||
        dados.id_recorrencia !== undefined ||
        dados.status !== undefined ||
        dados.data_pagamento !== undefined ||
        dados.recorrencia_excluida !== undefined
    ) {
        throw criarErro(
            "Cadastre uma conta de PAGAMENTO_UNICO sem status ou recorrencia.",
            400
        );
    }

    await validarCategoria(pool, campos.idCategoria, idUsuario);

    const resultado = await pool.query(
        `INSERT INTO contas
         (id_usuario, id_categoria, nome, valor, data_vencimento, tipo_cobranca)
         VALUES (?, ?, ?, ?, ?, 'PAGAMENTO_UNICO')`,
        [
            idUsuario,
            campos.idCategoria,
            campos.nome,
            campos.valor,
            campos.vencimento
        ]
    );

    return buscarConta(
        pool,
        idUsuario,
        Number(resultado.insertId)
    );
}

// Listar contas, com filtros opcionais.
async function listarContas(idUsuario, filtros = {}) {
    validarUsuario(idUsuario);

    const condicoes = ["id_usuario = ?"];
    const parametros = [idUsuario];

    if (filtros.mes !== undefined) {
        if (
            typeof filtros.mes !== "string" ||
            !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(filtros.mes)
        ) {
            throw criarErro("Mes invalido. Use AAAA-MM.", 400);
        }

        condicoes.push("DATE_FORMAT(data_vencimento, '%Y-%m') = ?");
        parametros.push(filtros.mes);
    }

    if (filtros.status !== undefined) {
        if (
            !["PENDENTE", "PAGA", "CANCELADA"].includes(
                filtros.status
            )
        ) {
            throw criarErro("Status invalido.", 400);
        }

        condicoes.push("status = ?");
        parametros.push(filtros.status);
    }

    const contas = await pool.query(
        `${camposConta}
         WHERE ${condicoes.join(" AND ")}
         ORDER BY data_vencimento ASC, id_conta ASC`,
        parametros
    );

    return contas.map(formatarConta);
}

async function consultarConta(idUsuario, idConta) {
    validarUsuario(idUsuario);
    validarId(idConta);

    return buscarConta(pool, idUsuario, idConta);
}

// Editar somente contas pendentes.
async function atualizarConta(idUsuario, idConta, dados) {
    validarUsuario(idUsuario);
    validarId(idConta);

    const campos = validarDados(dados);
    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const atual = await buscarConta(
            conexao,
            idUsuario,
            idConta,
            true
        );

        if (atual.status !== "PENDENTE") {
            throw criarErro(
                "Somente contas pendentes podem ser editadas.",
                409
            );
        }

        // Mensalidades mantem a categoria e o vencimento.
        if (
            atual.tipo_cobranca === "MENSAL" &&
            (
                campos.idCategoria !== atual.id_categoria ||
                campos.vencimento !== atual.data_vencimento
            )
        ) {
            throw criarErro(
                "Em uma conta mensal, categoria e vencimento nao podem mudar.",
                409
            );
        }

        await validarCategoria(
            conexao,
            campos.idCategoria,
            idUsuario
        );

        await conexao.query(
            `UPDATE contas
             SET id_categoria = ?,
                 nome = ?,
                 valor = ?,
                 data_vencimento = ?
             WHERE id_conta = ?
               AND id_usuario = ?
               AND status = 'PENDENTE'`,
            [
                campos.idCategoria,
                campos.nome,
                campos.valor,
                campos.vencimento,
                idConta,
                idUsuario
            ]
        );

        const atualizada = await buscarConta(
            conexao,
            idUsuario,
            idConta
        );

        await conexao.commit();
        return atualizada;

    } catch (erro) {
        if (conexao) await conexao.rollback();
        throw erro;

    } finally {
        if (conexao) await conexao.release();
    }
}

// Registrar um pagamento uma unica vez.
async function pagarConta(idUsuario, idConta, dados) {
    validarUsuario(idUsuario);
    validarId(idConta);

    const dataPagamento = validarData(
        dados && dados.data_pagamento
    );

    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        // O bloqueio impede pagamentos concorrentes da mesma conta.
        const atual = await buscarConta(
            conexao,
            idUsuario,
            idConta,
            true
        );

        if (atual.status !== "PENDENTE") {
            throw criarErro(
                "Somente contas pendentes podem ser pagas.",
                409
            );
        }

        // O horario real do pagamento e salvo na mesma transacao.
        await conexao.query(
            `UPDATE contas
             SET status = 'PAGA',
                 data_pagamento = ?,
                 pago_em = CURRENT_TIMESTAMP(6)
             WHERE id_conta = ?
               AND id_usuario = ?
               AND status = 'PENDENTE'`,
            [dataPagamento, idConta, idUsuario]
        );

        const paga = await buscarConta(
            conexao,
            idUsuario,
            idConta
        );

        await conexao.commit();
        return paga;

    } catch (erro) {
        if (conexao) await conexao.rollback();
        throw erro;

    } finally {
        if (conexao) await conexao.release();
    }
}

// Cancelar uma conta pendente, preservando seu historico.
async function cancelarConta(idUsuario, idConta) {
    validarUsuario(idUsuario);
    validarId(idConta);

    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const atual = await buscarConta(
            conexao,
            idUsuario,
            idConta,
            true
        );

        if (atual.status !== "PENDENTE") {
            throw criarErro(
                "Somente contas pendentes podem ser canceladas.",
                409
            );
        }

        await conexao.query(
            `UPDATE contas
             SET status = 'CANCELADA',
                 data_pagamento = NULL
             WHERE id_conta = ?
               AND id_usuario = ?
               AND status = 'PENDENTE'`,
            [idConta, idUsuario]
        );

        const cancelada = await buscarConta(
            conexao,
            idUsuario,
            idConta
        );

        await conexao.commit();
        return cancelada;

    } catch (erro) {
        if (conexao) await conexao.rollback();
        throw erro;

    } finally {
        if (conexao) await conexao.release();
    }
}

// Excluir fisicamente somente contas unicas pendentes.
async function excluirConta(idUsuario, idConta) {
    validarUsuario(idUsuario);
    validarId(idConta);

    let conexao;

    try {
        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const atual = await buscarConta(
            conexao,
            idUsuario,
            idConta,
            true
        );

        if (
            atual.tipo_cobranca !== "PAGAMENTO_UNICO" ||
            atual.status !== "PENDENTE"
        ) {
            throw criarErro(
                "So e possivel excluir contas unicas pendentes.",
                409
            );
        }

        await conexao.query(
            `DELETE FROM contas
             WHERE id_conta = ?
               AND id_usuario = ?`,
            [idConta, idUsuario]
        );

        await conexao.commit();
        return { id_conta: idConta };

    } catch (erro) {
        if (conexao) await conexao.rollback();
        throw erro;

    } finally {
        if (conexao) await conexao.release();
    }
}

module.exports = {
    cadastrarConta,
    listarContas,
    consultarConta,
    atualizarConta,
    pagarConta,
    cancelarConta,
    excluirConta
};