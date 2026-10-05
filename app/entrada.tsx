import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cores } from "../estilos/cores";
import { entradas } from "../estilos/entradas";
import { dataEhPosteriorAHoje, formatarDataISO } from "../utils/datas";
import { formatarMoedaBR } from "../utils/moeda";

interface ErrosEntradas {
    nome?: string;
    valor?: string;
    data?: string;
}

interface Categoria {
    id: string;
    nome: string;
    icone: keyof typeof Ionicons.glyphMap;
}

const CATEGORIAS: Categoria[] = [
    { id: "Salário", nome: "Salário", icone: "briefcase-outline" },
    { id: "Freelance", nome: "Freelance", icone: "flash-outline" },
    { id: "Rendimento", nome: "Rendimento", icone: "trending-up-outline" },
    { id: "Presente", nome: "Presente", icone: "gift-outline" },
    { id: "Outros", nome: "Outros", icone: "grid-outline" },
];

export default function RegistrarEntrada() {
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");
    const [categoria, setCategoria] = useState("Salário");
    const [erros, setErros] = useState<ErrosEntradas>({});
    const [dataObj, setDataObj] = useState(new Date());
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const onChangeData = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setMostrarCalendario(false);
        if (selectedDate) {
            setDataObj(selectedDate);
            setErros((prev) => ({ ...prev, data: undefined }));
        }
    };

    const handleValorChange = (text: string) => {
        const limpo = text.replace(/\D/g, "");
        if (!limpo) {
            setValor("");
            return;
        }
        setValor((Number(limpo) / 100).toFixed(2));
        setErros((prev) => ({ ...prev, valor: undefined }));
    };

    const validarEGravar = () => {
        const errosAtuais: ErrosEntradas = {};
        if (!nome.trim()) errosAtuais.nome = "Informe um nome para a entrada";
        if (!valor || Number(valor) <= 0) errosAtuais.valor = "Informe um valor maior que zero";
        if (dataEhPosteriorAHoje(dataObj)) errosAtuais.data = "A data não pode estar no futuro";

        if (Object.keys(errosAtuais).length > 0) {
            setErros(errosAtuais);
            return;
        }

        Alert.alert("Sucesso!", `A entrada de ${formatarMoedaBR(Number(valor))} foi registrada para ${dataObj.toLocaleDateString("pt-BR")}.`, [
            {
                text: "OK",
                onPress: () => {
                    setNome("");
                    setValor("");
                    setCategoria("Salário");
                },
            },
        ]);
        console.log("Entrada mock:", { nome: nome.trim(), valor: Number(valor), data: formatarDataISO(dataObj), categoria });
    };

    return (
        <SafeAreaView style={entradas.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={entradas.conteudoCentral}>
                <View style={entradas.cabecalho}>
                    <Text style={entradas.titulo}>Nova <Text style={entradas.tituloDestaque}>Entrada</Text></Text>
                </View>

                <View style={entradas.formulario}>
                    <View style={entradas.conteinerInput}>
                        <Text style={entradas.label}>Nome da Entrada</Text>
                        <View style={[entradas.envolucroInput, Boolean(erros.nome) && entradas.inputErro]}>
                            <Feather name="edit-2" size={20} color={cores.textoCinzaClaro} style={entradas.iconeInput} />
                            <TextInput
                                style={entradas.inputComIcone}
                                placeholder="Ex: Pagamento Cliente X"
                                placeholderTextColor={cores.textoPlaceholder}
                                value={nome}
                                onChangeText={(text) => {
                                    setNome(text);
                                    setErros((prev) => ({ ...prev, nome: undefined }));
                                }}
                            />
                        </View>
                        {erros.nome && <Text style={entradas.erroTexto}>{erros.nome}</Text>}
                    </View>

                    <View style={entradas.conteinerInput}>
                        <Text style={entradas.label}>Valor da Entrada</Text>
                        <View style={[entradas.envolucroInput, Boolean(erros.valor) && entradas.inputErro]}>
                            <Text style={entradas.prefixoCifrao}>R$</Text>
                            <TextInput
                                style={entradas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={cores.textoPlaceholder}
                                keyboardType="numeric"
                                value={valor ? valor.replace(".", ",") : ""}
                                onChangeText={handleValorChange}
                            />
                        </View>
                        {erros.valor && <Text style={entradas.erroTexto}>{erros.valor}</Text>}
                    </View>

                    <View style={entradas.conteinerInput}>
                        <Text style={entradas.label}>Data da Entrada</Text>
                        <TouchableOpacity style={[entradas.inputData, Boolean(erros.data) && entradas.inputErro]} onPress={() => setMostrarCalendario(true)} activeOpacity={0.8}>
                            <Text style={{ color: cores.textoCinzaClaro, fontSize: 16 }}>{dataObj.toLocaleDateString("pt-BR")}</Text>
                            <Ionicons name="calendar-outline" size={20} color={cores.textoCinzaMedio} />
                        </TouchableOpacity>
                        {erros.data && <Text style={entradas.erroTexto}>{erros.data}</Text>}
                        {mostrarCalendario && (
                            <DateTimePicker value={dataObj} mode="date" display="default" maximumDate={new Date()} onChange={onChangeData} />
                        )}
                    </View>

                    <View>
                        <Text style={entradas.label}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={entradas.gridCategorias}>
                            {CATEGORIAS.map((cat) => {
                                const selecionado = categoria === cat.id;
                                return (
                                    <TouchableOpacity key={cat.id} activeOpacity={0.7} style={[entradas.cardCategoria, selecionado && entradas.cardCategoriaSelecionado]} onPress={() => setCategoria(cat.id)}>
                                        <Ionicons name={cat.icone} size={18} color={selecionado ? cores.textoBotao : cores.textoCinzaClaro} />
                                        <Text style={[entradas.textoCategoria, selecionado && entradas.textoCategoriaSelecionado]}>{cat.nome}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={entradas.botao} activeOpacity={0.8} onPress={validarEGravar}>
                        <Text style={entradas.textoBotao}>CONFIRMAR ENTRADA</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
