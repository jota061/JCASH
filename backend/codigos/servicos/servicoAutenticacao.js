const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../conexaoBanco");
const { Buffer } = require("node:buffer");

// Cadastrar um novo usuario
async function cadastrarUsuario(dados) {
    const nome = typeof dados.nome === "string"
        ? dados.nome.trim()
        : "";

    const nome_social = typeof dados.nome_social === "string"
        ? dados.nome_social.trim()
        : "";

    const email = typeof dados.email === "string"
        ? dados.email.trim().toLowerCase()
        : "";

    const senha = dados.senha;

    // Validar os campos obrigatorios
    if (!nome || !nome_social || !email || typeof senha !== "string") {
        const erro = new Error("Preencha todos os campos obrigatorios.");
        erro.status = 400;
        throw erro;
    }

    // Validar os tamanhos dos campos
    if (nome.length > 100 || nome_social.length > 100 || email.length > 255) {
        const erro = new Error("Um ou mais campos excedem o tamanho permitido.");
        erro.status = 400;
        throw erro;
    }

    // Validar o formato do e-mail
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoEmail.test(email)) {
        const erro = new Error("Informe um e-mail valido.");
        erro.status = 400;
        throw erro;
    }

    // Verificar a quantidade de caracteres da senha
    const quantidadeCaracteres = Array.from(senha).length;

    // Exigir pelo menos 10 caracteres
    if (quantidadeCaracteres < 10) {
        const erro = new Error(
            "A senha deve ter pelo menos 10 caracteres."
        );
        erro.status = 400;
        throw erro;
    }

    // Respeitar o limite tecnico do bcrypt
    // sem apresentar o termo bytes ao usuario
    if (Buffer.byteLength(senha, "utf8") > 72) {
        const erro = new Error(
            "Sua senha e muito longa. Tente utilizar uma senha mais curta."
        );
        erro.status = 400;
        throw erro;
    }

    // Gerar o hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    try {
        // Salvar o usuario no MariaDB
        const resultado = await pool.query(
            `INSERT INTO usuarios
             (nome, nome_social, email, senha_hash)
             VALUES (?, ?, ?, ?)`,
            [nome, nome_social, email, senhaHash]
        );

        // Retornar apenas os dados publicos do usuario
        return {
            id_usuario: Number(resultado.insertId),
            nome,
            nome_social,
            email
        };

    } catch (erro) {
        // Tratar e-mail duplicado
        if (erro.code === "ER_DUP_ENTRY" || erro.errno === 1062) {
            const erroDuplicado = new Error("E-mail ja cadastrado.");
            erroDuplicado.status = 409;
            throw erroDuplicado;
        }

        throw erro;
    }
}

// Autenticar um usuario cadastrado
async function loginUsuario(dados) {
    const email = typeof dados?.email === "string"
        ? dados.email.trim().toLowerCase()
        : "";

    const senha = dados?.senha;

    // Validar os campos obrigatorios
    if (!email || typeof senha !== "string" || !senha) {
        const erro = new Error("Informe o e-mail e a senha.");
        erro.status = 400;
        throw erro;
    }

    // Buscar o usuario pelo e-mail
    const usuarios = await pool.query(
        `SELECT id_usuario, nome, nome_social, email, senha_hash
         FROM usuarios
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    const usuario = usuarios[0];

    // Verificar se o usuario existe e se a senha esta correta
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
        const erro = new Error("E-mail ou senha incorretos.");
        erro.status = 401;
        throw erro;
    }

    // Verificar se a chave JWT foi configurada
    if (!process.env.JWT_SEGREDO) {
        throw new Error("Chave JWT nao configurada.");
    }

    // Gerar o token de autenticacao
    const token = jwt.sign(
        { id_usuario: usuario.id_usuario },
        process.env.JWT_SEGREDO,
        { expiresIn: "1h" }
    );

    // Retornar o token e os dados publicos do usuario
    return {
        token,
        usuario: {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            nome_social: usuario.nome_social,
            email: usuario.email
        }
    };
}

// Exportar as funcoes de autenticacao
module.exports = { cadastrarUsuario, loginUsuario };