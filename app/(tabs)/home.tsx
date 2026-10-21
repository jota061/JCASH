import React, {
    useCallback,
    useRef,
    useState
} from "react";

import {
    useFocusEffect,
    useRouter
} from "expo-router";

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { cores } from "../../estilos/cores";
import { home } from "../../estilos/home";
import { Header } from "../../meuscomponentes/header";
import { formatarMoedaBR } from "../../utils/moeda";

import {
    carregarDadosHome
} from "../../servicos/servicoHome";

import type {
    DadosHome,
    MovimentacaoHome
} from "../../servicos/servicoHome";

// Conteudo educativo fixo
const EDUCACAO_FINANCEIRA = {
    titulo: "Regra dos 50 / 30 / 20",
    descricao:
        "A regra 50/30/20 é um método prático para organizar seu orçamento mensal:\n\n" +
        "• 50% para Necessidades: gastos essenciais como moradia, transporte e alimentação.\n" +
        "• 30% para Desejos: lazer, restaurantes, assinaturas e compras pessoais.\n" +
        "• 20% para o Futuro: reserva de emergência e outros objetivos financeiros."
};

// Formatar a data sem alterar o fuso horario
function formatarDataMovimentacao(data: string) {
    const agora = new Date();

    const hoje = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0")
    ].join("-");

    if (data === hoje) {
        return "Hoje";
    }

    return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

export default function Home() {
    const router = useRouter();

    // Controlar a visibilidade dos valores
    const [saldoVisivel, setSaldoVisivel] = useState(false);

    const [
        movimentacoesVisiveis,
        setMovimentacoesVisiveis
    ] = useState(false);

    // Dados financeiros reais
    const [dados, setDados] = useState<DadosHome | null>(null);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    // Identificar cada consulta e descartar respostas antigas
    const requisicaoAtual = useRef(0);

    // Consultar novamente os dados financeiros
    const atualizarHome = useCallback(async () => {
        const identificador = ++requisicaoAtual.current;

        setCarregando(true);
        setErro("");
        setDados(null);

        try {
            const novosDados = await carregarDadosHome();

            // Aplicar somente a resposta da consulta mais recente
            if (identificador === requisicaoAtual.current) {
                setDados(novosDados);
            }

        } catch (falha) {
            if (identificador === requisicaoAtual.current) {
                const mensagem =
                    falha instanceof Error
                        ? falha.message
                        : "Não foi possível carregar a Home.";

                setErro(mensagem);
            }

        } finally {
            if (identificador === requisicaoAtual.current) {
                setCarregando(false);
            }
        }
    }, []);

    // Atualizar a Home quando ela receber foco
    useFocusEffect(
        useCallback(() => {
            void atualizarHome();

            return () => {
                // Invalidar respostas caso a tela perca o foco
                requisicaoAtual.current += 1;
            };
        }, [atualizarHome])
    );

    // Permitir que o usuario tente consultar a API novamente
    const tentarNovamente = () => {
        void atualizarHome();
    };

    // Ocultar ou revelar os valores financeiros
    const alternarVisibilidadeSaldo = () => {
        void Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Light
        ).catch(() => { });

        setSaldoVisivel((atual) => !atual);
    };

    // Ocultar ou revelar as movimentacoes
    const alternarVisibilidadeMovimentacoes = () => {
        void Haptics.impactAsync(
            Haptics.ImpactFeedbackStyle.Light
        ).catch(() => { });

        setMovimentacoesVisiveis((atual) => !atual);
    };

    // Funcionalidades ainda nao integradas
    const mostrarEmConstrucao = (funcionalidade: string) => {
        Alert.alert(
            "Em construção",
            `${funcionalidade} será implementado em uma próxima versão do JCASH.`
        );
    };

    // Apresentar valores somente quando estiverem disponiveis
    const mostrarValor = (valor: number | undefined) => {
        if (carregando) {
            return "Carregando...";
        }

        if (valor === undefined) {
            return "Indisponível";
        }

        return saldoVisivel
            ? formatarMoedaBR(valor)
            : "R$ •••";
    };

    const nomeExibido =
        dados?.nomeSocial ||
        (carregando ? "..." : "usuário");

    const movimentacoes = dados?.movimentacoes ?? [];

    // Renderizar uma movimentacao da API
    const renderizarMovimentacao = (
        item: MovimentacaoHome
    ) => {
        const entrada = item.tipo === "ENTRADA";

        return (
            <View
                style={home.itemTransacao}
                key={item.id}
            >
                <View style={home.iconeTransacaoContainer}>
                    <Ionicons
                        name={
                            entrada
                                ? "cash-outline"
                                : "cart-outline"
                        }
                        size={20}
                        color={cores.textoBranco}
                    />
                </View>

                <View style={home.infoTransacao}>
                    <Text style={home.tituloTransacao}>
                        {item.titulo}
                    </Text>

                    <Text style={home.subtituloTransacao}>
                        {item.categoria} •{" "}
                        {formatarDataMovimentacao(item.data)}
                    </Text>
                </View>

                <Text
                    style={[
                        home.valorTransacao,
                        {
                            color: entrada
                                ? cores.destaque
                                : cores.erro
                        }
                    ]}
                >
                    {movimentacoesVisiveis
                        ? `${entrada ? "+" : "-"} ${formatarMoedaBR(Math.abs(item.valor))}`
                        : "R$ •••"}
                </Text>
            </View>
        );
    };

    return (
        <View style={home.safeArea}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={cores.fundoCard}
            />

            <Header />

            <ScrollView
                style={home.container}
                contentContainerStyle={home.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* BOAS-VINDAS */}
                <View style={home.header}>
                    <View style={home.usuarioInfo}>
                        <TouchableOpacity
                            onPress={() => router.push("/perfil")}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="person-circle-outline"
                                size={40}
                                color={cores.destaque}
                            />
                        </TouchableOpacity>

                        <View style={home.boasVindasContainer}>
                            <Text style={home.textoBoasVindas}>
                                Olá,{" "}
                                <Text style={home.nomeUsuario}>
                                    {nomeExibido}!
                                </Text>
                            </Text>
                        </View>
                    </View>

                    <View style={home.headerAcoes}>
                        <TouchableOpacity
                            onPress={alternarVisibilidadeSaldo}
                            style={home.botaoIconeHeader}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={
                                    saldoVisivel
                                        ? "eye-outline"
                                        : "eye-off-outline"
                                }
                                size={22}
                                color={cores.textoCinzaClaro}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CARREGAMENTO */}
                {carregando && (
                    <View style={home.cardPadrao}>
                        <ActivityIndicator
                            size="small"
                            color={cores.destaque}
                        />

                        <Text
                            style={[
                                home.descricaoDica,
                                {
                                    textAlign: "center",
                                    marginTop: 8
                                }
                            ]}
                        >
                            Consultando seus dados financeiros...
                        </Text>
                    </View>
                )}

                {/* ERRO NA CONSULTA */}
                {!carregando && erro !== "" && (
                    <View style={home.cardPadrao}>
                        <Text style={home.tituloSubCard}>
                            Não foi possível atualizar a Home
                        </Text>

                        <Text
                            style={[
                                home.descricaoDica,
                                { marginTop: 8 }
                            ]}
                        >
                            {erro}
                        </Text>

                        <TouchableOpacity
                            onPress={tentarNovamente}
                            style={{ marginTop: 12 }}
                        >
                            <Text
                                style={{
                                    color: cores.destaque,
                                    fontWeight: "700"
                                }}
                            >
                                Tentar novamente
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* SALDO E FLUXO FINANCEIRO */}
                <View style={home.cardSaldoPrincipal}>
                    <Text style={home.labelSaldo}>
                        Saldo registrado
                    </Text>

                    <Text style={home.valorSaldoPrincipal}>
                        {mostrarValor(dados?.saldo)}
                    </Text>

                    <View style={home.divisorCard} />

                    <View style={home.gridFluxoCaixa}>
                        {/* ENTRADAS */}
                        <View style={home.itemFluxo}>
                            <View style={home.circuloIconeEntradas}>
                                <Ionicons
                                    name="arrow-down-circle"
                                    size={22}
                                    color={cores.destaque}
                                />
                            </View>

                            <View>
                                <Text style={home.labelFluxo}>
                                    Entradas
                                </Text>

                                <Text style={home.valorEntrada}>
                                    {saldoVisivel && dados
                                        ? `+ ${formatarMoedaBR(dados.entradas)}`
                                        : mostrarValor(dados?.entradas)}
                                </Text>
                            </View>
                        </View>

                        {/* DESPESAS */}
                        <View style={home.itemFluxo}>
                            <View style={home.circuloIconeSaidas}>
                                <Ionicons
                                    name="arrow-up-circle"
                                    size={22}
                                    color={cores.erro}
                                />
                            </View>

                            <View>
                                <Text style={home.labelFluxo}>
                                    Despesas
                                </Text>

                                <Text style={home.valorSaida}>
                                    {saldoVisivel && dados
                                        ? `- ${formatarMoedaBR(dados.despesas)}`
                                        : mostrarValor(dados?.despesas)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ACOES RAPIDAS */}
                <Text style={home.tituloSessao}>
                    Ações Rápidas
                </Text>

                <View style={home.cardAcoes}>
                    <View style={home.acoes}>
                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/entrada")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="add-outline"
                                    size={30}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Adicionar Entrada
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/despesas")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="remove-outline"
                                    size={30}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Adicionar Despesa
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/contas")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Contas Mensais
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/metas")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="flag-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Metas
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/reservaEmergencia")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="shield-checkmark-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Reserva de Emergência
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/ferramentas")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="build-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Ferramentas
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => router.push("/sobre")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Sobre o App
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => mostrarEmConstrucao("Relatórios")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="pie-chart-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Relatórios
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => mostrarEmConstrucao("Gráficos")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="analytics-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Gráficos
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={home.botaoAcaoRapida}
                            onPress={() => mostrarEmConstrucao("Contato com o suporte")}
                        >
                            <View style={home.iconeAcao}>
                                <Ionicons
                                    name="mail-outline"
                                    size={22}
                                    color={cores.textoBranco}
                                />
                            </View>

                            <Text style={home.textoAcaoRapida}>
                                Suporte
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* EDUCACAO FINANCEIRA */}
                <View style={home.cardDica}>
                    <View style={home.headerDica}>
                        <Ionicons
                            name="book-outline"
                            size={20}
                            color={cores.destaque}
                        />

                        <Text style={home.tituloDica}>
                            Educação Financeira
                        </Text>
                    </View>

                    <Text style={home.subtituloDica}>
                        {EDUCACAO_FINANCEIRA.titulo}
                    </Text>

                    <Text style={home.descricaoDica}>
                        {EDUCACAO_FINANCEIRA.descricao}
                    </Text>
                </View>

                {/* RESERVA DE EMERGENCIA */}
                <View style={home.cardPadrao}>
                    <View style={home.headerDica}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={22}
                            color={cores.destaque}
                        />

                        <Text style={home.tituloDica}>
                            Reserva de Emergência
                        </Text>
                    </View>

                    <Text style={home.detalheMeta}>
                        {mostrarValor(dados?.reserva)}
                    </Text>
                </View>

                {/* ULTIMAS MOVIMENTACOES */}
                <View style={home.headerSessaoComLink}>
                    <View style={home.tituloComVisibilidade}>
                        <Text style={home.tituloSessaoComMargem}>
                            Últimas Movimentações
                        </Text>

                        <TouchableOpacity
                            onPress={alternarVisibilidadeMovimentacoes}
                            style={home.botaoOcultarMovimentacoes}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={
                                    movimentacoesVisiveis
                                        ? "eye-outline"
                                        : "eye-off-outline"
                                }
                                size={18}
                                color={cores.textoCinzaClaro}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={home.cardListaTransacoes}>
                    {!carregando && dados && movimentacoes.length === 0 && (
                        <Text
                            style={[
                                home.descricaoDica,
                                {
                                    textAlign: "center",
                                    paddingVertical: 18
                                }
                            ]}
                        >
                            Nenhuma movimentação registrada.
                        </Text>
                    )}

                    {movimentacoes.map((item, indice) => (
                        <React.Fragment key={item.id}>
                            {indice > 0 && (
                                <View style={home.separadorItem} />
                            )}

                            {renderizarMovimentacao(item)}
                        </React.Fragment>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}