import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, FlatList, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { cores } from "../../estilos/cores";
import { home } from "../../estilos/home";
import { Header } from "../../meuscomponentes/header";
import { formatarMoedaBR } from "../../utils/moeda";

interface Movimentacao {
    id: string;
    titulo: string;
    categoria: string;
    valor: number;
    data: string;
    icone: keyof typeof Ionicons.glyphMap;
}

const MOCK_DATA = {
    usuario: { nomeSocial: "Jota" },
    financeiro: { entradas: 3200, despesas: 749.20, reserva: 1400 },
    educacaoFinanceira: {
        titulo: "Regra dos 50 / 30 / 20",
        descricao:
            "A regra 50/30/20 é um método prático para organizar seu orçamento mensal:\n\n" +
            "• 50% para Necessidades: gastos essenciais como moradia, transporte e alimentação.\n" +
            "• 30% para Desejos: lazer, restaurantes, assinaturas e compras pessoais.\n" +
            "• 20% para o Futuro: reserva de emergência e outros objetivos financeiros.",
    },
    transacoesRecentes: [
        { id: "1", titulo: "Supermercado", categoria: "Alimentação", valor: -145.90, data: "Hoje", icone: "cart-outline" },
        { id: "2", titulo: "Freelance UI", categoria: "Freelance", valor: 450, data: "Ontem", icone: "cash-outline" },
        { id: "3", titulo: "Assinatura", categoria: "Lazer", valor: -21.90, data: "26/09", icone: "musical-notes-outline" },
        { id: "4", titulo: "Academia", categoria: "Saúde", valor: -89.90, data: "24/09", icone: "fitness-outline" },
    ] as Movimentacao[],
};

export default function Home() {
    const router = useRouter();
    const [saldoVisivel, setSaldoVisivel] = useState(false);
    const [movimentacoesVisiveis, setMovimentacoesVisiveis] = useState(false);

    const saldoTotal = MOCK_DATA.financeiro.entradas - MOCK_DATA.financeiro.despesas;

    const alternarVisibilidadeSaldo = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSaldoVisivel((atual) => !atual);
    };

    const alternarVisibilidadeMovimentacoes = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setMovimentacoesVisiveis((atual) => !atual);
    };

    const mostrarEmConstrucao = (funcionalidade: string) => {
        Alert.alert("Em construção", `${funcionalidade} será implementado em uma próxima versão do JCASH.`);
    };

    return (
        <View style={home.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={cores.fundoCard} />
            <Header />

            <ScrollView style={home.container} contentContainerStyle={home.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={home.header}>
                    <View style={home.usuarioInfo}>
                        <TouchableOpacity onPress={() => router.push("/perfil")} activeOpacity={0.7}>
                            <Ionicons name="person-circle-outline" size={40} color={cores.destaque} />
                        </TouchableOpacity>
                        <View style={home.boasVindasContainer}>
                            <Text style={home.textoBoasVindas}>Olá, <Text style={home.nomeUsuario}>{MOCK_DATA.usuario.nomeSocial}!</Text></Text>
                        </View>
                    </View>

                    <View style={home.headerAcoes}>
                        <TouchableOpacity onPress={alternarVisibilidadeSaldo} style={home.botaoIconeHeader} activeOpacity={0.7}>
                            <Ionicons name={saldoVisivel ? "eye-outline" : "eye-off-outline"} size={22} color={cores.textoCinzaClaro} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={home.cardSaldoPrincipal}>
                    <Text style={home.labelSaldo}>Saldo Total na Conta</Text>
                    <Text style={home.valorSaldoPrincipal}>
                        {saldoVisivel ? formatarMoedaBR(saldoTotal) : "R$ ••••••"}
                    </Text>

                    <View style={home.divisorCard} />

                    <View style={home.gridFluxoCaixa}>
                        <View style={home.itemFluxo}>
                            <View style={home.circuloIconeEntradas}>
                                <Ionicons name="arrow-down-circle" size={22} color={cores.destaque} />
                            </View>
                            <View>
                                <Text style={home.labelFluxo}>Entradas</Text>
                                <Text style={home.valorEntrada}>
                                    {saldoVisivel ? `+ ${formatarMoedaBR(MOCK_DATA.financeiro.entradas)}` : "R$ •••"}
                                </Text>
                            </View>
                        </View>

                        <View style={home.itemFluxo}>
                            <View style={home.circuloIconeSaidas}>
                                <Ionicons name="arrow-up-circle" size={22} color={cores.erro} />
                            </View>
                            <View>
                                <Text style={home.labelFluxo}>Despesas</Text>
                                <Text style={home.valorSaida}>
                                    {saldoVisivel ? `- ${formatarMoedaBR(MOCK_DATA.financeiro.despesas)}` : "R$ •••"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <Text style={home.tituloSessao}>Ações Rápidas</Text>
                <View style={home.cardAcoes}>
                    <View style={home.acoes}>
                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/entrada")}>
                            <View style={home.iconeAcao}><Ionicons name="add-outline" size={30} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Adicionar Entrada</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/despesas")}>
                            <View style={home.iconeAcao}><Ionicons name="remove-outline" size={30} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Adicionar Despesa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/contas")}>
                            <View style={home.iconeAcao}><Ionicons name="calendar-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Contas Mensais</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/metas")}>
                            <View style={home.iconeAcao}><Ionicons name="flag-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Metas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/reservaEmergencia")}>
                            <View style={home.iconeAcao}><Ionicons name="shield-checkmark-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Reserva de Emergência</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/ferramentas")}>
                            <View style={home.iconeAcao}><Ionicons name="build-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Ferramentas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => router.push("/sobre")}>
                            <View style={home.iconeAcao}><Ionicons name="document-text-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Sobre o App</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => mostrarEmConstrucao("Relatórios")}>
                            <View style={home.iconeAcao}><Ionicons name="pie-chart-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Relatórios</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => mostrarEmConstrucao("Gráficos")}>
                            <View style={home.iconeAcao}><Ionicons name="analytics-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Gráficos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={home.botaoAcaoRapida} onPress={() => mostrarEmConstrucao("Contato com o suporte")}>
                            <View style={home.iconeAcao}><Ionicons name="mail-outline" size={22} color={cores.textoBranco} /></View>
                            <Text style={home.textoAcaoRapida}>Suporte</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={home.cardDica}>
                    <View style={home.headerDica}>
                        <Ionicons name="book-outline" size={20} color={cores.destaque} />
                        <Text style={home.tituloDica}>Educação Financeira</Text>
                    </View>
                    <Text style={home.subtituloDica}>{MOCK_DATA.educacaoFinanceira.titulo}</Text>
                    <Text style={home.descricaoDica}>{MOCK_DATA.educacaoFinanceira.descricao}</Text>
                </View>

                <View style={home.cardPadrao}>
                    <View style={home.headerDica}>
                        <Ionicons name="shield-checkmark-outline" size={22} color={cores.destaque} />
                        <Text style={home.tituloDica}>Reserva de Emergência</Text>
                    </View>
                    <Text style={home.detalheMeta}>{saldoVisivel ? formatarMoedaBR(MOCK_DATA.financeiro.reserva) : "R$ •••"}</Text>
                </View>

                <View style={home.headerSessaoComLink}>
                    <View style={home.tituloComVisibilidade}>
                        <Text style={home.tituloSessaoComMargem}>Últimas Movimentações</Text>
                        <TouchableOpacity onPress={alternarVisibilidadeMovimentacoes} style={home.botaoOcultarMovimentacoes} activeOpacity={0.7}>
                            <Ionicons name={movimentacoesVisiveis ? "eye-outline" : "eye-off-outline"} size={18} color={cores.textoCinzaClaro} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={home.cardListaTransacoes}>
                    <FlatList
                        data={MOCK_DATA.transacoesRecentes}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={home.separadorItem} />}
                        renderItem={({ item }) => (
                            <View style={home.itemTransacao}>
                                <View style={home.iconeTransacaoContainer}>
                                    <Ionicons name={item.icone} size={20} color={cores.textoBranco} />
                                </View>
                                <View style={home.infoTransacao}>
                                    <Text style={home.tituloTransacao}>{item.titulo}</Text>
                                    <Text style={home.subtituloTransacao}>{item.categoria} • {item.data}</Text>
                                </View>
                                <Text style={[home.valorTransacao, item.valor > 0 ? { color: cores.destaque } : { color: cores.erro }]}>
                                    {movimentacoesVisiveis ? `${item.valor > 0 ? "+" : "-"} ${formatarMoedaBR(Math.abs(item.valor))}` : "R$ •••"}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </ScrollView>
        </View>
    );
}
