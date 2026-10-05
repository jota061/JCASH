import React, { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, TextInput, Alert, Modal } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { cores } from "../estilos/cores";
import { metas } from "../estilos/metas";
import { adicionarDias, dataEhAnteriorAHoje, formatarDataBR, formatarDataISO } from "../utils/datas";
import { formatarMoedaBR } from "../utils/moeda";

interface Meta {
    id: string;
    nome: string;
    valorAlvo: number;
    valorAtual: number;
    dataLimite: string;
    categoria: string;
}

interface ErrosMetas {
    nome?: string;
    valorAlvo?: string;
    data?: string;
}

interface Categoria {
    id: string;
    nome: string;
    icone: keyof typeof Ionicons.glyphMap;
}

const CATEGORIAS: Categoria[] = [
    { id: "Viagem", nome: "Viagem", icone: "airplane-outline" },
    { id: "Investimento", nome: "Investimento", icone: "trending-up-outline" },
    { id: "Eletrônicos", nome: "Eletrônicos", icone: "laptop-outline" },
    { id: "Veículos", nome: "Veículos", icone: "car-outline" },
    { id: "Casa", nome: "Casa", icone: "home-outline" },
    { id: "Outros", nome: "Outros", icone: "grid-outline" },
];

const METAS_MOCK: Meta[] = [
    { id: "1", nome: "Viagem de Fim de Ano", valorAlvo: 3000, valorAtual: 1200, dataLimite: formatarDataISO(adicionarDias(new Date(), 45)), categoria: "Viagem" },
    { id: "2", nome: "Trocar de Notebook", valorAlvo: 5000, valorAtual: 500, dataLimite: formatarDataISO(adicionarDias(new Date(), 80)), categoria: "Eletrônicos" },
    { id: "3", nome: "Carro", valorAlvo: 15000, valorAtual: 3500, dataLimite: formatarDataISO(adicionarDias(new Date(), 180)), categoria: "Veículos" },
];

export default function Metas() {
    const [listaMetas, setListaMetas] = useState<Meta[]>(METAS_MOCK);
    const [nome, setNome] = useState("");
    const [valorAlvo, setValorAlvo] = useState("");
    const [categoria, setCategoria] = useState("Viagem");
    const [erros, setErros] = useState<ErrosMetas>({});
    const [dataLimiteObj, setDataLimiteObj] = useState<Date>(adicionarDias(new Date(), 1));
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const [metaParaAdicionar, setMetaParaAdicionar] = useState<Meta | null>(null);
    const [valorAdicionar, setValorAdicionar] = useState("");
    const [erroAdicionar, setErroAdicionar] = useState(false);

    const onChangeData = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setMostrarCalendario(false);
        if (selectedDate) {
            setDataLimiteObj(selectedDate);
            setErros((prev) => ({ ...prev, data: undefined }));
        }
    };

    const handleValorChange = (text: string) => {
        const limpo = text.replace(/\D/g, "");
        if (!limpo) {
            setValorAlvo("");
            return;
        }
        setValorAlvo((Number(limpo) / 100).toFixed(2));
        setErros((prev) => ({ ...prev, valorAlvo: undefined }));
    };

    const handleValorAdicionarChange = (text: string) => {
        const limpo = text.replace(/\D/g, "");
        if (!limpo) {
            setValorAdicionar("");
            setErroAdicionar(false);
            return;
        }
        setValorAdicionar((Number(limpo) / 100).toFixed(2));
        setErroAdicionar(false);
    };

    const resetFormulario = () => {
        setNome("");
        setValorAlvo("");
        setCategoria("Viagem");
        setDataLimiteObj(adicionarDias(new Date(), 1));
        setErros({});
    };

    const validarEGravar = () => {
        const errosAtuais: ErrosMetas = {};
        if (!nome.trim()) errosAtuais.nome = "Informe o nome da meta";
        if (!valorAlvo || Number(valorAlvo) <= 0) errosAtuais.valorAlvo = "Informe um valor maior que zero";
        if (dataEhAnteriorAHoje(dataLimiteObj)) errosAtuais.data = "A data limite não pode estar no passado";

        if (Object.keys(errosAtuais).length > 0) {
            setErros(errosAtuais);
            return;
        }

        const novaMeta: Meta = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nome: nome.trim(),
            valorAlvo: Number(valorAlvo),
            valorAtual: 0,
            dataLimite: formatarDataISO(dataLimiteObj),
            categoria,
        };

        setListaMetas((prev) => [novaMeta, ...prev]);
        Alert.alert("Sucesso!", `A meta "${novaMeta.nome}" foi cadastrada com sucesso.`, [{ text: "OK", onPress: resetFormulario }]);
    };

    const abrirModalAdicionar = (meta: Meta) => {
        setMetaParaAdicionar(meta);
        setValorAdicionar("");
        setErroAdicionar(false);
    };

    const confirmarAdicao = () => {
        if (!metaParaAdicionar) return;
        const valor = Number(valorAdicionar);
        const restante = metaParaAdicionar.valorAlvo - metaParaAdicionar.valorAtual;

        if (!valor || valor <= 0) {
            setErroAdicionar(true);
            Alert.alert("Valor inválido", "Informe um valor maior que zero.");
            return;
        }
        if (valor > restante) {
            setErroAdicionar(true);
            Alert.alert("Valor acima do necessário", `Você ainda precisa de ${formatarMoedaBR(restante)} para atingir essa meta.`);
            return;
        }

        setListaMetas((prev) => prev.map((meta) => meta.id === metaParaAdicionar.id ? { ...meta, valorAtual: meta.valorAtual + valor } : meta));
        setMetaParaAdicionar(null);
        setValorAdicionar("");
    };

    const excluirMeta = (meta: Meta) => {
        Alert.alert("Excluir meta", `Deseja excluir a meta "${meta.nome}"?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: () => setListaMetas((prev) => prev.filter((item) => item.id !== meta.id)) },
        ]);
    };

    return (
        <ScrollView style={metas.containerTela} contentContainerStyle={metas.scrollContainer} showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={metas.conteudoCentral}>
                <View style={metas.topo}>
                    <Text style={metas.titulo}>Metas <Text style={metas.logo}>Financeiras</Text></Text>
                </View>

                <View style={metas.formulario}>
                    <Text style={metas.tituloFormulario}>Cadastrar Nova Meta</Text>

                    <View style={metas.conteinerInput}>
                        <Text style={metas.label}>Nome da Meta</Text>
                        <View style={[metas.envolucroInput, Boolean(erros.nome) && metas.inputErro]}>
                            <Feather name="edit-2" size={20} color={cores.textoCinzaClaro} style={metas.iconeInput} />
                            <TextInput
                                style={metas.inputComIcone}
                                placeholder="Ex: Viagem para a Praia"
                                placeholderTextColor={cores.textoPlaceholder}
                                value={nome}
                                onChangeText={(texto) => {
                                    setNome(texto);
                                    setErros((prev) => ({ ...prev, nome: undefined }));
                                }}
                            />
                        </View>
                        {erros.nome && <Text style={metas.erroTexto}>{erros.nome}</Text>}
                    </View>

                    <View style={metas.conteinerInput}>
                        <Text style={metas.label}>Valor da Meta</Text>
                        <View style={[metas.envolucroInput, Boolean(erros.valorAlvo) && metas.inputErro]}>
                            <Text style={metas.prefixoCifrao}>R$</Text>
                            <TextInput
                                style={metas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={cores.textoPlaceholder}
                                keyboardType="numeric"
                                value={valorAlvo ? valorAlvo.replace(".", ",") : ""}
                                onChangeText={handleValorChange}
                            />
                        </View>
                        {erros.valorAlvo && <Text style={metas.erroTexto}>{erros.valorAlvo}</Text>}
                    </View>

                    <View style={metas.conteinerInput}>
                        <Text style={metas.label}>Até quando é essa meta?</Text>
                        <TouchableOpacity style={[metas.inputData, Boolean(erros.data) && metas.inputErro]} onPress={() => setMostrarCalendario(true)} activeOpacity={0.8}>
                            <Text style={{ color: cores.textoCinzaClaro, fontSize: 16 }}>{dataLimiteObj.toLocaleDateString("pt-BR")}</Text>
                            <Ionicons name="calendar-outline" size={20} color={cores.textoCinzaMedio} />
                        </TouchableOpacity>
                        {erros.data && <Text style={metas.erroTexto}>{erros.data}</Text>}
                    </View>

                    {mostrarCalendario && (
                        <DateTimePicker
                            value={dataLimiteObj}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={onChangeData}
                        />
                    )}

                    <View>
                        <Text style={metas.label}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={metas.gridCategorias}>
                            {CATEGORIAS.map((cat) => {
                                const selecionado = categoria === cat.id;
                                return (
                                    <TouchableOpacity key={cat.id} activeOpacity={0.7} style={[metas.cardCategoria, selecionado && metas.cardCategoriaSelecionado]} onPress={() => setCategoria(cat.id)}>
                                        <Ionicons name={cat.icone} size={18} color={selecionado ? cores.textoBotao : cores.textoCinzaClaro} />
                                        <Text style={[metas.textoCategoria, selecionado && metas.textoCategoriaSelecionado]}>{cat.nome}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={metas.botao} activeOpacity={0.8} onPress={validarEGravar}>
                        <Text style={metas.textoBotao}>CADASTRAR META</Text>
                    </TouchableOpacity>
                </View>

                <View style={metas.secaoLista}>
                    <Text style={metas.tituloSecao}>Suas Metas Atuais ({listaMetas.length})</Text>
                    {listaMetas.map((item) => {
                        const progresso = Math.min(100, (item.valorAtual / item.valorAlvo) * 100);
                        const concluida = item.valorAtual >= item.valorAlvo;
                        return (
                            <View key={item.id} style={metas.cardMetaItem}>
                                <View style={metas.topoCardMeta}>
                                    <View style={metas.infoMetaItem}>
                                        <Ionicons name="flag-outline" size={22} color={concluida ? cores.destaque : cores.textoCinzaClaro} />
                                        <View style={metas.textosMeta}>
                                            <Text style={metas.nomeMetaItem} numberOfLines={1}>{item.nome}</Text>
                                            <Text style={metas.detalheMetaItem}>Prazo: {formatarDataBR(item.dataLimite)} • {item.categoria}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => excluirMeta(item)} style={metas.btnAcao}>
                                        <Ionicons name="trash-outline" size={18} color={cores.erro} />
                                    </TouchableOpacity>
                                </View>

                                <View style={metas.resumoValores}>
                                    <Text style={metas.valorAtual}>Atual: {formatarMoedaBR(item.valorAtual)}</Text>
                                    <Text style={metas.valorMetaItem}>Meta: {formatarMoedaBR(item.valorAlvo)}</Text>
                                </View>

                                <View style={metas.barraProgressoFundo}>
                                    <View style={[metas.barraProgresso, { width: `${progresso}%` }]} />
                                </View>

                                <View style={metas.rodapeMeta}>
                                    <Text style={metas.textoProgresso}>{progresso.toFixed(0)}%</Text>
                                    <TouchableOpacity style={metas.botaoAdicionarValor} onPress={() => abrirModalAdicionar(item)} disabled={concluida}>
                                        <Ionicons name="add-circle-outline" size={18} color={concluida ? cores.textoCinzaMedio : cores.destaque} />
                                        <Text style={[metas.textoAdicionarValor, concluida && metas.textoAdicionarValorDesabilitado]}>{concluida ? "Meta concluída" : "Adicionar valor"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            <Modal visible={Boolean(metaParaAdicionar)} transparent animationType="slide" onRequestClose={() => setMetaParaAdicionar(null)}>
                <View style={metas.fundoModal}>
                    <View style={metas.containerModal}>
                        <Text style={metas.tituloModal}>Adicionar valor</Text>
                        <Text style={metas.subtituloModal}>{metaParaAdicionar?.nome}</Text>

                        <Text style={metas.label}>Valor a adicionar</Text>
                        <View style={[metas.envolucroInput, erroAdicionar && metas.inputErro]}>
                            <Text style={metas.prefixoCifrao}>R$</Text>
                            <TextInput
                                style={metas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={cores.textoPlaceholder}
                                keyboardType="numeric"
                                value={valorAdicionar ? valorAdicionar.replace(".", ",") : ""}
                                onChangeText={handleValorAdicionarChange}
                            />
                        </View>

                        <View style={metas.acoesModal}>
                            <TouchableOpacity style={metas.botaoCancelarModal} onPress={() => setMetaParaAdicionar(null)}>
                                <Text style={metas.textoCancelarModal}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={metas.botaoConfirmarModal} onPress={confirmarAdicao}>
                                <Text style={metas.textoConfirmarModal}>Adicionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
