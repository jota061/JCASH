const mariadb = require("mariadb");
require("dotenv").config();

// Configurar o pool de conexoes com o banco
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Testar a conexao com o MariaDB
async function testarConexao() {
    let conexao;

    try {
        conexao = await pool.getConnection();

        const resultado = await conexao.query(
            "SELECT DATABASE() AS banco, COUNT(*) AS total_usuarios FROM usuarios"
        );

        console.log("Conexao com o MariaDB realizada com sucesso!");
        console.log("Banco conectado:", resultado[0].banco);
        console.log("Total de usuarios:", resultado[0].total_usuarios);

    } catch (erro) {
        console.error("Erro ao conectar ao MariaDB:", erro.message);
        process.exitCode = 1;

    } finally {
        if (conexao) {
            await conexao.release();
        }

        await pool.end();
    }
}

// Executar o teste somente quando este arquivo for iniciado diretamente
if (require.main === module) {
    testarConexao();
}

// Disponibilizar o pool para os demais arquivos da API
module.exports = pool;
