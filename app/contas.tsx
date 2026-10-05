import React, { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View, TextInput, Alert, Platform } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { cores } from "../estilos/cores";
import { contas } from "../estilos/contas";
import { adicionarDias, adicionarMeses, dataEhAnteriorAHoje, formatarDataBR, formatarDataISO, gerarDatasMensais, inicioDoDia } from "../utils/datas";
import { formatarMoedaBR } from "../utils/moeda";

interface Conta {
    id: string;
    recorrenciaId?: string;
    nome: string;
    valor: number;
    dataVencimento: string;
    categoria: string;
    tipoCobranca: "MENSAL" | "UNICO";
    status: "PENDENTE" | "PAGA";
    dataInicio: string;
    dataFim?: string;
    dataPagamento?: string;
}

interface ErrosContas {
    nome?: string;
    valor?: string;
    dataInicio?: string;
    dataFim?: string;
}

interface Categoria {
    id: string;
    nome: string;
    icone: keyof typeof Ionicons.glyphMap;
}

const CATEGORIAS: Categoria[] = [
    { id: "Moradia", nome: "Moradia", icone: "home-outline" },
    { id: "Alimentação", nome: "Alimentação", icone: "cart-outline" },
    { id: "Educação", nome: "Educação", icone: "book-outline" },
    { id: "Transporte", nome: "Transporte", icone: "car-outline" },
    { id: "Saúde", nome: "Saúde", icone: "medkit-outline" },
    { id: "Outros", nome: "Outros", icone: "grid-outline" },
];

const criarContaMock = (
    id: string,
    nome: string,
    valor: number,
    dias: number,
    categoria: string,
    tipoCobranca: Conta["tipoCobranca"],
): Conta => {
    const data = formatarDataISO(adicionarDias(new Date(), dias));
    return {
        id,
        recorrenciaId: tipoCobranca === "MENSAL" ? `rec-${id}` : undefined,
        nome,
        valor,
        dataVencimento: data,
        categoria,
        tipoCobranca,
        status: "PENDENTE",
        dataInicio: data,
        dataFim: tipoCobranca === "MENSAL" ? formatarDataISO(adicionarMeses(adicionarDias(new Date(), dias), 5)) : undefined,
    };
};

const CONTAS_MOCK: Conta[] = [
    criarContaMock("1", "Aluguel", 1200, 5, "Moradia", "MENSAL"),
    criarContaMock("2", "Internet Fibra", 99.90, 10, "Moradia", "MENSAL"),
    criarContaMock("3", "Faculdade", 450, 15, "Educação", "UNICO"),
];

const gerarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function Contas() {
    const [listaContas, setListaContas] = useState<Conta[]>(CONTAS_MOCK);
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");
    const [categoria, setCategoria] = useState("Moradia");
    const [isMensal, setIsMensal] = useState(true);
    const [erros, setErros] = useState<ErrosContas>({});

    const [dataInicioObj, setDataInicioObj] = useState<Date>(adicionarDias(new Date(), 1));
    const [dataFimObj, setDataFimObj] = useState<Date>(adicionarMeses(adicionarDias(new Date(), 1), 5));
    const [mostrarCalendario, setMostrarCalendario] = useState<"inicio" | "fim" | null>(null);

    const onChangeData = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setMostrarCalendario(null);
        if (!selectedDate) return;

        if (mostrarCalendario === "inicio") {
            setDataInicioObj(selectedDate);
            if (inicioDoDia(dataFimObj).getTime() < inicioDoDia(selectedDate).getTime()) {
                setDataFimObj(adicionarMeses(selectedDate, 1));
            }
            setErros((prev) => ({ ...prev, dataInicio: undefined, dataFim: undefined }));
        } else {
            setDataFimObj(selectedDate);
            setErros((prev) => ({ ...prev, dataFim: undefined }));
        }

        if (Platform.OS === "ios") {
            // O DateTimePicker do iOS permanece controlado pelo estado do modal.
        }
    };

    const handleValorChange = (text: string) => {
        const limpo = text.replace(/\D/g, "");
        if (!limpo) {
            setValor("");
            return;
        }
        const numero = (Number(limpo) / 100).toFixed(2);
        setValor(numero);
        setErros((prev) => ({ ...prev, valor: undefined }));
    };

    const resetFormulario = () => {
        const amanha = adicionarDias(new Date(), 1);
        setNome("");
        setValor("");
        setCategoria("Moradia");
        setIsMensal(true);
        setDataInicioObj(amanha);
        setDataFimObj(adicionarMeses(amanha, 5));
        setErros({});
    };

    const validarEGravar = () => {
        const errosAtuais: ErrosContas = {};

        if (!nome.trim()) errosAtuais.nome = "Informe o nome da conta";
        if (!valor || Number(valor) <= 0) errosAtuais.valor = "Informe um valor maior que zero";
        if (!dataInicioObj) errosAtuais.dataInicio = "Informe a data de vencimento";
        else if (dataEhAnteriorAHoje(dataInicioObj)) errosAtuais.dataInicio = "A data não pode estar no passado";

        if (isMensal) {
            if (!dataFimObj) errosAtuais.dataFim = "Informe a data de término";
            else if (dataEhAnteriorAHoje(dataFimObj)) errosAtuais.dataFim = "A data não pode estar no passado";
            else if (inicioDoDia(dataFimObj).getTime() < inicioDoDia(dataInicioObj).getTime()) {
                errosAtuais.dataFim = "A data final deve ser igual ou posterior ao início";
            }
        }

        if (Object.keys(errosAtuais).length > 0) {
            setErros(errosAtuais);
            return;
        }

        const valorNumerico = Number(valor);
        const idBase = gerarId();
        const datas = isMensal ? gerarDatasMensais(dataInicioObj, dataFimObj) : [formatarDataISO(dataInicioObj)];
        const recorrenciaId = isMensal ? `rec-${idBase}` : undefined;

        const novasContas: Conta[] = datas.map((dataVencimento, indice) => ({
            id: `${idBase}-${indice}`,
            recorrenciaId,
            nome: nome.trim(),
            valor: valorNumerico,
            dataVencimento,
            categoria,
            tipoCobranca: isMensal ? "MENSAL" : "UNICO",
            status: "PENDENTE",
            dataInicio: formatarDataISO(dataInicioObj),
            dataFim: isMensal ? formatarDataISO(dataFimObj) : undefined,
        }));

        setListaContas((prev) => [...novasContas, ...prev]);
        Alert.alert(
            "Sucesso!",
            isMensal
                ? `A conta foi cadastrada com ${novasContas.length} vencimento(s) recorrente(s).`
                : `A conta "${nome.trim()}" foi cadastrada com sucesso.`,
            [{ text: "OK", onPress: resetFormulario }],
        );
    };

    const contaEstaAtrasada = (conta: Conta): boolean => {
        return conta.status === "PENDENTE" && dataEhAnteriorAHoje(new Date(`${conta.dataVencimento}T00:00:00`));
    };

    const marcarComoPaga = (conta: Conta) => {
        if (conta.status === "PAGA") return;

        setListaContas((prev) => prev.map((item) => item.id === conta.id ? {
            ...item,
            status: "PAGA",
            dataPagamento: formatarDataISO(new Date()),
        } : item));

        Alert.alert(
            "Conta marcada como paga",
            "No back-end, esta ação também criará a despesa correspondente para o cálculo do saldo.",
        );
    };

    const excluirConta = (conta: Conta) => {
        if (conta.status === "PAGA") {
            Alert.alert("Conta já paga", "Contas pagas não podem ser excluídas porque representam um histórico financeiro.");
            return;
        }

        if (conta.recorrenciaId) {
            setListaContas((prev) => prev.filter((item) => item.recorrenciaId !== conta.recorrenciaId || item.status === "PAGA"));
            return;
        }

        setListaContas((prev) => prev.filter((item) => item.id !== conta.id));
    };

    const dataInicioLabel = isMensal ? "Primeiro vencimento / início" : "Data de vencimento";
    const dataInicioExibicao = dataInicioObj.toLocaleDateString("pt-BR");
    const dataFimExibicao = dataFimObj.toLocaleDateString("pt-BR");

    return (
        <ScrollView style={contas.containerTela} contentContainerStyle={contas.scrollContainer} showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={contas.conteudoCentral}>
                <View style={contas.topo}>
                    <Text style={contas.titulo}>Contas <Text style={contas.logo}>Mensais</Text></Text>
                </View>

                <View style={contas.formulario}>
                    <Text style={contas.tituloFormulario}>Cadastrar Nova Conta</Text>

                    <View style={contas.conteinerInput}>
                        <Text style={contas.label}>Nome da Conta</Text>
                        <View style={[contas.envolucroInput, Boolean(erros.nome) && contas.inputErro]}>
                            <Feather name="edit-2" size={20} color={cores.textoCinzaClaro} style={contas.iconeInput} />
                            <TextInput
                                style={contas.inputComIcone}
                                placeholder="Ex: Conta de Luz"
                                placeholderTextColor={cores.textoPlaceholder}
                                value={nome}
                                onChangeText={(text) => {
                                    setNome(text);
                                    setErros((prev) => ({ ...prev, nome: undefined }));
                                }}
                            />
                        </View>
                        {erros.nome && <Text style={contas.erroTexto}>{erros.nome}</Text>}
                    </View>

                    <View style={contas.conteinerInput}>
                        <Text style={contas.label}>Valor da Conta</Text>
                        <View style={[contas.envolucroInput, Boolean(erros.valor) && contas.inputErro]}>
                            <Text style={contas.prefixoCifrao}>R$</Text>
                            <TextInput
                                style={contas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={cores.textoPlaceholder}
                                keyboardType="numeric"
                                value={valor ? valor.replace(".", ",") : ""}
                                onChangeText={handleValorChange}
                            />
                        </View>
                        {erros.valor && <Text style={contas.erroTexto}>{erros.valor}</Text>}
                    </View>

                    <View>
                        <Text style={contas.label}>Tipo de Cobrança</Text>
                        <View style={contas.toggleContainer}>
                            <TouchableOpacity style={[contas.btnToggle, isMensal && contas.btnToggleAtivo]} onPress={() => setIsMensal(true)} activeOpacity={0.8}>
                                <Ionicons name="repeat-outline" size={18} color={isMensal ? cores.textoBotao : cores.textoCinzaClaro} />
                                <Text style={[contas.textoToggle, isMensal && contas.textoToggleAtivo]}>Mensal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[contas.btnToggle, !isMensal && contas.btnToggleAtivo]} onPress={() => setIsMensal(false)} activeOpacity={0.8}>
                                <Ionicons name="cash-outline" size={18} color={!isMensal ? cores.textoBotao : cores.textoCinzaClaro} />
                                <Text style={[contas.textoToggle, !isMensal && contas.textoToggleAtivo]}>Pagamento Único</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={contas.conteinerInput}>
                        <Text style={contas.label}>{dataInicioLabel}</Text>
                        <TouchableOpacity style={[contas.inputData, Boolean(erros.dataInicio) && contas.inputErro]} onPress={() => setMostrarCalendario("inicio")} activeOpacity={0.8}>
                            <Text style={{ color: cores.textoCinzaClaro, fontSize: 16 }}>{dataInicioExibicao}</Text>
                            <Ionicons name="calendar-outline" size={20} color={cores.textoCinzaMedio} />
                        </TouchableOpacity>
                        {erros.dataInicio && <Text style={contas.erroTexto}>{erros.dataInicio}</Text>}
                    </View>

                    {isMensal && (
                        <View style={contas.conteinerInput}>
                            <Text style={contas.label}>Data de término da recorrência</Text>
                            <TouchableOpacity style={[contas.inputData, Boolean(erros.dataFim) && contas.inputErro]} onPress={() => setMostrarCalendario("fim")} activeOpacity={0.8}>
                                <Text style={{ color: cores.textoCinzaClaro, fontSize: 16 }}>{dataFimExibicao}</Text>
                                <Ionicons name="calendar-outline" size={20} color={cores.textoCinzaMedio} />
                            </TouchableOpacity>
                            {erros.dataFim && <Text style={contas.erroTexto}>{erros.dataFim}</Text>}
                        </View>
                    )}

                    {mostrarCalendario === "inicio" && (
                        <DateTimePicker
                            value={dataInicioObj}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={onChangeData}
                        />
                    )}
                    {mostrarCalendario === "fim" && (
                        <DateTimePicker
                            value={dataFimObj}
                            mode="date"
                            display="default"
                            minimumDate={dataInicioObj}
                            onChange={onChangeData}
                        />
                    )}

                    <View>
                        <Text style={contas.label}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={contas.gridCategorias}>
                            {CATEGORIAS.map((cat) => {
                                const selecionado = categoria === cat.id;
                                return (
                                    <TouchableOpacity key={cat.id} activeOpacity={0.7} style={[contas.cardCategoria, selecionado && contas.cardCategoriaSelecionado]} onPress={() => setCategoria(cat.id)}>
                                        <Ionicons name={cat.icone} size={18} color={selecionado ? cores.textoBotao : cores.textoCinzaClaro} />
                                        <Text style={[contas.textoCategoria, selecionado && contas.textoCategoriaSelecionado]}>{cat.nome}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={contas.botao} activeOpacity={0.8} onPress={validarEGravar}>
                        <Text style={contas.textoBotao}>CADASTRAR CONTA</Text>
                    </TouchableOpacity>
                </View>

                <View style={contas.secaoLista}>
                    <Text style={contas.tituloSecao}>Suas Contas ({listaContas.length})</Text>
                    {listaContas.map((item) => {
                        const atrasada = contaEstaAtrasada(item);
                        return (
                            <View key={item.id} style={contas.cardContaItem}>
                                <View style={contas.infoContaItem}>
                                    <Ionicons name={item.tipoCobranca === "MENSAL" ? "repeat-outline" : "cash-outline"} size={22} color={cores.destaque} />
                                    <View style={contas.textosConta}>
                                        <Text style={contas.nomeContaItem} numberOfLines={1}>{item.nome}</Text>
                                        <Text style={contas.detalheContaItem} numberOfLines={2}>
                                            Vencimento: {formatarDataBR(item.dataVencimento)} • {item.categoria} • {item.tipoCobranca === "MENSAL" ? "Mensal" : "Pagamento Único"}
                                        </Text>
                                        <Text style={[contas.statusConta, item.status === "PAGA" ? contas.statusPaga : atrasada ? contas.statusAtrasada : contas.statusPendente]}>
                                            {item.status === "PAGA" ? `Paga${item.dataPagamento ? ` em ${formatarDataBR(item.dataPagamento)}` : ""}` : atrasada ? "Atrasada" : "Pendente"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={contas.acoesContainer}>
                                    <Text style={contas.valorContaItem}>{formatarMoedaBR(item.valor)}</Text>
                                    <View style={contas.iconesAcoes}>
                                        {item.status === "PENDENTE" && (
                                            <TouchableOpacity onPress={() => marcarComoPaga(item)} style={contas.btnAcao}>
                                                <Ionicons name="checkmark-circle-outline" size={20} color={cores.destaque} />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => excluirConta(item)} style={contas.btnAcao}>
                                            <Ionicons name="trash-outline" size={18} color={cores.erro} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
}
