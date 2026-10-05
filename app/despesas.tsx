import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { despesas } from "../estilos/despesas";
import { cores } from "../estilos/cores";
import { dataEhPosteriorAHoje, formatarDataISO } from "../utils/datas";
import { formatarMoedaBR } from "../utils/moeda";

interface ErrosDespesas {
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
    { id: "Alimentação", nome: "Alimentação", icone: "restaurant-outline" },
    { id: "Transporte", nome: "Transporte", icone: "car-outline" },
    { id: "Moradia", nome: "Moradia", icone: "home-outline" },
    { id: "Saúde", nome: "Saúde", icone: "medkit-outline" },
    { id: "Lazer", nome: "Lazer", icone: "game-controller-outline" },
    { id: "Outros", nome: "Outros", icone: "grid-outline" },
];

export default function RegistrarDespesa() {
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");
    const [categoria, setCategoria] = useState("Alimentação");
    const [erros, setErros] = useState<ErrosDespesas>({});
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
        const errosAtuais: ErrosDespesas = {};
        if (!nome.trim()) errosAtuais.nome = "Informe um nome para a despesa";
        if (!valor || Number(valor) <= 0) errosAtuais.valor = "Informe um valor maior que zero";
        if (dataEhPosteriorAHoje(dataObj)) errosAtuais.data = "A data não pode estar no futuro";

        if (Object.keys(errosAtuais).length > 0) {
            setErros(errosAtuais);
            return;
        }

        Alert.alert("Sucesso!", `A despesa de ${formatarMoedaBR(Number(valor))} foi registrada para ${dataObj.toLocaleDateString("pt-BR")}.`, [
            {
                text: "OK",
                onPress: () => {
                    setNome("");
                    setValor("");
                    setCategoria("Alimentação");
                },
            },
        ]);
        console.log("Despesa mock:", { nome: nome.trim(), valor: Number(valor), data: formatarDataISO(dataObj), categoria });
    };

    return (
        <SafeAreaView style={despesas.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={despesas.conteudoCentral}>
                <View style={despesas.topo}>
                    <Text style={despesas.titulo}>Nova <Text style={despesas.logo}>Despesa</Text></Text>
                </View>

                <View style={despesas.formulario}>
                    <View style={despesas.conteinerInput}>
                        <Text style={despesas.label}>Nome da Despesa</Text>
                        <View style={[despesas.envolucroInput, Boolean(erros.nome) && despesas.inputErro]}>
                            <Feather name="edit-2" size={20} color={cores.textoCinzaClaro} style={despesas.iconeInput} />
                            <TextInput style={despesas.inputComIcone} placeholder="Ex: Mercado" placeholderTextColor={cores.textoPlaceholder} value={nome} onChangeText={(text) => { setNome(text); setErros((prev) => ({ ...prev, nome: undefined })); }} />
                        </View>
                        {erros.nome && <Text style={despesas.erroTexto}>{erros.nome}</Text>}
                    </View>

                    <View style={despesas.conteinerInput}>
                        <Text style={despesas.label}>Valor da Despesa</Text>
                        <View style={[despesas.envolucroInput, Boolean(erros.valor) && despesas.inputErro]}>
                            <Text style={despesas.prefixoCifrao}>R$</Text>
                            <TextInput style={despesas.inputComIcone} placeholder="0,00" placeholderTextColor={cores.textoPlaceholder} keyboardType="numeric" value={valor ? valor.replace(".", ",") : ""} onChangeText={handleValorChange} />
                        </View>
                        {erros.valor && <Text style={despesas.erroTexto}>{erros.valor}</Text>}
                    </View>

                    <View style={despesas.conteinerInput}>
                        <Text style={despesas.label}>Data da Despesa</Text>
                        <TouchableOpacity style={[despesas.inputData, Boolean(erros.data) && despesas.inputErro]} onPress={() => setMostrarCalendario(true)} activeOpacity={0.8}>
                            <Text style={{ color: cores.textoCinzaClaro, fontSize: 16 }}>{dataObj.toLocaleDateString("pt-BR")}</Text>
                            <Ionicons name="calendar-outline" size={20} color={cores.textoCinzaMedio} />
                        </TouchableOpacity>
                        {erros.data && <Text style={despesas.erroTexto}>{erros.data}</Text>}
                        {mostrarCalendario && (
                            <DateTimePicker value={dataObj} mode="date" display="default" maximumDate={new Date()} onChange={onChangeData} />
                        )}
                    </View>

                    <View>
                        <Text style={despesas.label}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={despesas.gridCategorias}>
                            {CATEGORIAS.map((cat) => {
                                const selecionado = categoria === cat.id;
                                return (
                                    <TouchableOpacity key={cat.id} activeOpacity={0.7} style={[despesas.cardCategoria, selecionado && despesas.cardCategoriaSelecionado]} onPress={() => setCategoria(cat.id)}>
                                        <Ionicons name={cat.icone} size={18} color={selecionado ? cores.textoBotao : cores.textoCinzaClaro} />
                                        <Text style={[despesas.textoCategoria, selecionado && despesas.textoCategoriaSelecionado]}>{cat.nome}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <TouchableOpacity style={despesas.botao} activeOpacity={0.8} onPress={validarEGravar}>
                        <Text style={despesas.textoBotao}>CONFIRMAR DESPESA</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
