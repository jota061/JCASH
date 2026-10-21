const express = require("express");

const rotasVerificacao = require("./rotas/rotasVerificacao");
const rotasAutenticacao = require("./rotas/rotasAutenticacao");
const rotasCategorias = require("./rotas/rotasCategorias");
const rotasEntradas = require("./rotas/rotasEntradas");
const rotasDespesas = require("./rotas/rotasDespesas");
const rotasContas = require("./rotas/rotasContas");
const rotasRecorrencias = require("./rotas/rotasRecorrencias");
const rotasMetas = require("./rotas/rotasMetas");
const rotasReserva = require("./rotas/rotasReserva");
const rotasMovimentacoes = require("./rotas/rotasMovimentacoes");

const app = express();
const PORT = 3001;

// Receber os dados enviados em JSON.
app.use(express.json());

// Rotas publicas e protegidas da API JCASH.
app.use("/health", rotasVerificacao);
app.use("/autenticacao", rotasAutenticacao);
app.use("/categorias", rotasCategorias);
app.use("/entradas", rotasEntradas);
app.use("/despesas", rotasDespesas);
app.use("/contas", rotasContas);
app.use("/recorrencias", rotasRecorrencias);
app.use("/metas", rotasMetas);
app.use("/reserva", rotasReserva);
app.use("/movimentacoes", rotasMovimentacoes);

app.listen(PORT, () => {
    console.log(`API JCASH rodando em http://localhost:${PORT}`);
});