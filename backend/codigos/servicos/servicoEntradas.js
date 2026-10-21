
const pool = require("../conexaoBanco");

// Cadastrar uma nova entrada financeira
async function cadastrarEntrada(idUsuario, dados) {

    // Verificar o usuario autenticado
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        const erro = new Error("Usuario autenticado invalido.");
        erro.status = 401;
        throw erro;
    }

    // Verificar os dados recebidos
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        const erro = new Error("Envie os dados da entrada.");
        erro.status = 400;
        throw erro;
    }

    const nome = typeof dados.nome === "string"
        ? dados.nome.trim()
        : "";

    const valor = dados.valor;
    const data = dados.data;
    const idCategoria = dados.id_categoria;

    // Validar o nome da entrada
    if (!nome || nome.length > 100) {
        const erro = new Error("Informe um nome valido com ate 100 caracteres.");
        erro.status = 400;
        throw erro;
    }

    // Validar o valor financeiro
    const formatoValor = /^\d{1,10}(\.\d{1,2})?$/;

    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !formatoValor.test(String(valor))
    ) {
        const erro = new Error("Informe um valor positivo com ate duas casas decimais.");
        erro.status = 400;
        throw erro;
    }

    // Validar a data da entrada
    const formatoData = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (typeof data !== "string" || !formatoData.test(data)) {
        const erro = new Error("Informe uma data valida no formato AAAA-MM-DD.");
        erro.status = 400;
        throw erro;
    }

    const dataVerificada = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(dataVerificada.getTime()) ||
        dataVerificada.toISOString().slice(0, 10) !== data
    ) {
        const erro = new Error("A data informada nao existe.");
        erro.status = 400;
        throw erro;
    }

    // Validar o identificador da categoria
    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        const erro = new Error("Informe uma categoria valida.");
        erro.status = 400;
        throw erro;
    }

    // Conferir se a categoria pode ser utilizada pelo usuario
    const categorias = await pool.query(
        `SELECT id_categoria
         FROM categorias
         WHERE id_categoria = ?
           AND tipo = 'ENTRADA'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        const erro = new Error("Categoria invalida para esta entrada.");
        erro.status = 400;
        throw erro;
    }

    // Salvar a entrada no MariaDB
    const resultado = await pool.query(
        `INSERT INTO entradas
         (id_usuario, id_categoria, nome, valor, data)
         VALUES (?, ?, ?, ?, ?)`,
        [idUsuario, idCategoria, nome, valor, data]
    );

    // Retornar os dados da entrada cadastrada
    return {
        id_entrada: Number(resultado.insertId),
        id_usuario: idUsuario,
        id_categoria: idCategoria,
        nome,
        valor,
        data
    };
}

// Consultar as entradas do usuario autenticado
async function listarEntradas(idUsuario) {

    // Verificar o usuario autenticado
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        const erro = new Error("Usuario autenticado invalido.");
        erro.status = 401;
        throw erro;
    }

    // Buscar somente as entradas pertencentes ao usuario
    const entradas = await pool.query(
        `SELECT
            id_entrada,
            id_categoria,
            nome,
            valor,
            DATE_FORMAT(data, '%Y-%m-%d') AS data
         FROM entradas
         WHERE id_usuario = ?
         ORDER BY data DESC, id_entrada DESC`,
        [idUsuario]
    );

    // Retornar os registros encontrados
    return entradas.map((entrada) => ({
        id_entrada: entrada.id_entrada,
        id_categoria: entrada.id_categoria,
        nome: entrada.nome,
        valor: Number(entrada.valor),
        data: entrada.data
    }));
}

// Atualizar uma entrada financeira do usuario autenticado
async function atualizarEntrada(idUsuario, idEntrada, dados) {

    // Verificar o usuario autenticado
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        const erro = new Error("Usuario autenticado invalido.");
        erro.status = 401;
        throw erro;
    }

    // Validar o identificador da entrada
    if (!Number.isSafeInteger(idEntrada) || idEntrada <= 0) {
        const erro = new Error("Identificador da entrada invalido.");
        erro.status = 400;
        throw erro;
    }

    // Verificar os dados recebidos
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        const erro = new Error("Envie os dados da entrada.");
        erro.status = 400;
        throw erro;
    }

    const nome = typeof dados.nome === "string"
        ? dados.nome.trim()
        : "";

    const valor = dados.valor;
    const data = dados.data;
    const idCategoria = dados.id_categoria;

    // Validar o nome da entrada
    if (!nome || nome.length > 100) {
        const erro = new Error("Informe um nome valido com ate 100 caracteres.");
        erro.status = 400;
        throw erro;
    }

    // Validar o valor financeiro
    const formatoValor = /^\d{1,10}(\.\d{1,2})?$/;

    if (
        typeof valor !== "number" ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !formatoValor.test(String(valor))
    ) {
        const erro = new Error("Informe um valor positivo com ate duas casas decimais.");
        erro.status = 400;
        throw erro;
    }

    // Validar a data
    const formatoData = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (typeof data !== "string" || !formatoData.test(data)) {
        const erro = new Error("Informe uma data valida no formato AAAA-MM-DD.");
        erro.status = 400;
        throw erro;
    }

    const dataVerificada = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(dataVerificada.getTime()) ||
        dataVerificada.toISOString().slice(0, 10) !== data
    ) {
        const erro = new Error("A data informada nao existe.");
        erro.status = 400;
        throw erro;
    }

    // Validar a categoria
    if (!Number.isSafeInteger(idCategoria) || idCategoria <= 0) {
        const erro = new Error("Informe uma categoria valida.");
        erro.status = 400;
        throw erro;
    }

    // Conferir se a categoria e permitida para o usuario
    const categorias = await pool.query(
        `SELECT id_categoria
         FROM categorias
         WHERE id_categoria = ?
           AND tipo = 'ENTRADA'
           AND (id_usuario IS NULL OR id_usuario = ?)
         LIMIT 1`,
        [idCategoria, idUsuario]
    );

    if (categorias.length === 0) {
        const erro = new Error("Categoria invalida para esta entrada.");
        erro.status = 400;
        throw erro;
    }

    // Atualizar somente a entrada pertencente ao usuario
    await pool.query(
        `UPDATE entradas
         SET id_categoria = ?,
             nome = ?,
             valor = ?,
             data = ?
         WHERE id_entrada = ?
           AND id_usuario = ?`,
        [idCategoria, nome, valor, data, idEntrada, idUsuario]
    );

    // Consultar a entrada atualizada
    const entradas = await pool.query(
        `SELECT
            id_entrada,
            id_usuario,
            id_categoria,
            nome,
            valor,
            DATE_FORMAT(data, '%Y-%m-%d') AS data
         FROM entradas
         WHERE id_entrada = ?
           AND id_usuario = ?
         LIMIT 1`,
        [idEntrada, idUsuario]
    );

    // Nao revelar se a entrada pertence a outro usuario
    if (entradas.length === 0) {
        const erro = new Error("Entrada nao encontrada.");
        erro.status = 404;
        throw erro;
    }

    const entrada = entradas[0];

    // Retornar os dados atualizados
    return {
        id_entrada: entrada.id_entrada,
        id_usuario: entrada.id_usuario,
        id_categoria: entrada.id_categoria,
        nome: entrada.nome,
        valor: Number(entrada.valor),
        data: entrada.data
    };
}

// Excluir uma entrada financeira do usuario autenticado
async function excluirEntrada(idUsuario, idEntrada) {

    // Verificar o usuario autenticado
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        const erro = new Error("Usuario autenticado invalido.");
        erro.status = 401;
        throw erro;
    }

    // Validar o identificador da entrada
    if (!Number.isSafeInteger(idEntrada) || idEntrada <= 0) {
        const erro = new Error("Identificador da entrada invalido.");
        erro.status = 400;
        throw erro;
    }

    // Excluir somente a entrada pertencente ao usuario
    const resultado = await pool.query(
        `DELETE FROM entradas
         WHERE id_entrada = ?
           AND id_usuario = ?`,
        [idEntrada, idUsuario]
    );

    // Verificar se algum registro foi excluido
    if (resultado.affectedRows === 0) {
        const erro = new Error("Entrada nao encontrada.");
        erro.status = 404;
        throw erro;
    }

    // Retornar o identificador da entrada excluida
    return {
        id_entrada: idEntrada
    };
}

// Exportar as funcoes do servico
module.exports = {
    cadastrarEntrada,
    listarEntradas,
    atualizarEntrada,
    excluirEntrada
};
