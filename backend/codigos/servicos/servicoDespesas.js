const pool = require("../conexaoBanco");

// Criar erros que podem ser devolvidos pela API
function criarErro(mensagem, status) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir o usuario identificado pelo JWT
function validarUsuario(idUsuario) {
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        throw criarErro("Usuario autenticado invalido.", 401);
    }
}

// Conferir o ID informado na URL
function validarIdDespesa(idDespesa) {
    if (!Number.isSafeInteger(idDespesa) || idDespesa <= 0) {
        throw criarErro("Identificador da despesa invalido.", 400);
    }
}

// Validar os campos utilizados no cadastro e na edicao
function validarDadosDespesa(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro("Envie os dados da despesa.", 400);
    }

    const nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
    const valor = dados.valor;
    const data = dados.data;
    const idCategoria = dados.id_categoria;

    if (!nome || nome.length > 100) {
        throw criarErro("Informe um nome valido com ate 100 caracteres.", 400);
    }

    // O banco guarda valores positivos com duas casas decimais
    const formatoValor = /^\d{1,10}(\.\d{1,2})?$/;

    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !formatoValor.test(String(valor))
    ) {
        throw criarErro("Informe um valor positivo com ate duas casas decimais.", 400);
    }

    const formatoData = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (typeof data !== "string" || !formatoData.test(data)) {
        throw criarErro("Informe uma data valida no formato AAAA-MM-DD.", 400);
    }

    const dataVerificada = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(dataVerificada.getTime()) ||
        dataVerificada.toISOString().slice(0, 10) !== data
    ) {
        throw criarErro("A data informada nao existe.", 400);
    }

    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        throw criarErro("Informe uma categoria valida.", 400);
    }

    return { nome, valor, data, idCategoria };
}

// Garantir que a categoria seja de DESPESA e esteja disponivel ao usuario
async function verificarCategoriaDespesa(idCategoria, idUsuario) {
    const categorias = await pool.query(
        `SELECT id_categoria
         FROM categorias
         WHERE id_categoria = ?
           AND tipo = 'DESPESA'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        throw criarErro("Categoria invalida para esta despesa.", 400);
    }
}

// Cadastrar uma despesa para o usuario autenticado
async function cadastrarDespesa(idUsuario, dados) {
    validarUsuario(idUsuario);

    const { nome, valor, data, idCategoria } = validarDadosDespesa(dados);
    await verificarCategoriaDespesa(idCategoria, idUsuario);

    const resultado = await pool.query(
        `INSERT INTO despesas
         (id_usuario, id_categoria, nome, valor, data)
         VALUES (?, ?, ?, ?, ?)`,
        [idUsuario, idCategoria, nome, valor, data]
    );

    return {
        id_despesa: Number(resultado.insertId),
        id_usuario: idUsuario,
        id_categoria: idCategoria,
        nome,
        valor,
        data
    };
}

// Consultar somente as despesas pertencentes ao usuario autenticado
async function listarDespesas(idUsuario) {
    validarUsuario(idUsuario);

    const despesas = await pool.query(
        `SELECT
            id_despesa,
            id_categoria,
            nome,
            valor,
            DATE_FORMAT(data, '%Y-%m-%d') AS data
         FROM despesas
         WHERE id_usuario = ?
         ORDER BY data DESC, id_despesa DESC`,
        [idUsuario]
    );

    return despesas.map((despesa) => ({
        id_despesa: despesa.id_despesa,
        id_categoria: despesa.id_categoria,
        nome: despesa.nome,
        valor: Number(despesa.valor),
        data: despesa.data
    }));
}

// Editar uma despesa sem permitir acesso a registros de outro usuario
async function atualizarDespesa(idUsuario, idDespesa, dados) {
    validarUsuario(idUsuario);
    validarIdDespesa(idDespesa);

    const { nome, valor, data, idCategoria } = validarDadosDespesa(dados);
    await verificarCategoriaDespesa(idCategoria, idUsuario);

    await pool.query(
        `UPDATE despesas
         SET id_categoria = ?,
             nome = ?,
             valor = ?,
             data = ?
         WHERE id_despesa = ?
           AND id_usuario = ?`,
        [idCategoria, nome, valor, data, idDespesa, idUsuario]
    );

    const despesas = await pool.query(
        `SELECT
            id_despesa,
            id_usuario,
            id_categoria,
            nome,
            valor,
            DATE_FORMAT(data, '%Y-%m-%d') AS data
         FROM despesas
         WHERE id_despesa = ?
           AND id_usuario = ?
         LIMIT 1`,
        [idDespesa, idUsuario]
    );

    // O mesmo HTTP 404 atende registros inexistentes e de outros usuarios
    if (despesas.length === 0) {
        throw criarErro("Despesa nao encontrada.", 404);
    }

    const despesa = despesas[0];

    return {
        id_despesa: despesa.id_despesa,
        id_usuario: despesa.id_usuario,
        id_categoria: despesa.id_categoria,
        nome: despesa.nome,
        valor: Number(despesa.valor),
        data: despesa.data
    };
}

// Excluir somente uma despesa do proprio usuario
async function excluirDespesa(idUsuario, idDespesa) {
    validarUsuario(idUsuario);
    validarIdDespesa(idDespesa);

    const resultado = await pool.query(
        `DELETE FROM despesas
         WHERE id_despesa = ?
           AND id_usuario = ?`,
        [idDespesa, idUsuario]
    );

    if (resultado.affectedRows === 0) {
        throw criarErro("Despesa nao encontrada.", 404);
    }

    return { id_despesa: idDespesa };
}

module.exports = {
    cadastrarDespesa,
    listarDespesas,
    atualizarDespesa,
    excluirDespesa
};