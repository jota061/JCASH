import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cores } from "../estilos/cores";
import { reservaEmergencia } from "../estilos/reservaEmergencia";
import { formatarMoedaBR } from "../utils/moeda";

export type EmergencyCategory = "HEALTH" | "VEHICLE_REPAIR" | "INCOME_LOSS" | "HOME_REPAIR" | "OTHER";

const CATEGORIAS_EMERGENCIA: { id: EmergencyCategory; label: string }[] = [
    { id: "HEALTH", label: "Saúde" },
    { id: "VEHICLE_REPAIR", label: "Veículo" },
    { id: "INCOME_LOSS", label: "Renda" },
    { id: "HOME_REPAIR", label: "Casa" },
    { id: "OTHER", label: "Outro" },
];

export default function ReservaEmergenciaScreen() {
    const [totalAportes, setTotalAportes] = useState(8000);
    const [totalResgates, setTotalResgates] = useState(0);

    const [isDepositVisible, setIsDepositVisible] = useState(false);
    const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
    const [amountInput, setAmountInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>("HEALTH");
    const [erroInput, setErroInput] = useState(false);

    const saldoReserva = totalAportes - totalResgates;

    const resetForm = () => {
        setAmountInput("");
        setErroInput(false);
        setSelectedCategory("HEALTH");
    };

    const handleValorChange = (text: string) => {
        const limpo = text.replace(/\D/g, "");
        if (!limpo) {
            setAmountInput("");
            return;
        }
        setAmountInput((Number(limpo) / 100).toFixed(2));
        setErroInput(false);
    };

    const valorAtual = Number(amountInput || 0);

    const handleDeposit = () => {
        if (!amountInput || valorAtual <= 0) {
            setErroInput(true);
            Alert.alert("Atenção", "Informe um valor maior que zero.");
            return;
        }

        setTotalAportes((prev) => prev + valorAtual);
        Alert.alert("Aporte confirmado", `Aporte de ${formatarMoedaBR(valorAtual)} registrado.`, [
            { text: "OK", onPress: () => { setIsDepositVisible(false); resetForm(); } },
        ]);
    };

    const handleWithdraw = () => {
        if (!amountInput || valorAtual <= 0) {
            setErroInput(true);
            Alert.alert("Atenção", "Informe um valor maior que zero.");
            return;
        }

        if (valorAtual > saldoReserva) {
            setErroInput(true);
            Alert.alert("Saldo insuficiente", `O maior valor disponível para resgate é ${formatarMoedaBR(saldoReserva)}.`);
            return;
        }

        setTotalResgates((prev) => prev + valorAtual);
        const motivo = CATEGORIAS_EMERGENCIA.find((categoria) => categoria.id === selectedCategory)?.label ?? "Outro";

        Alert.alert("Resgate confirmado", `Resgate de ${formatarMoedaBR(valorAtual)} registrado para o motivo: ${motivo}.`, [
            { text: "OK", onPress: () => { setIsWithdrawVisible(false); resetForm(); } },
        ]);
    };

    return (
        <SafeAreaView style={reservaEmergencia.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={reservaEmergencia.conteudoCentral}>
                <View style={reservaEmergencia.cabecalho}>
                    <Text style={reservaEmergencia.titulo}>Reserva de <Text style={reservaEmergencia.tituloDestaque}>Emergência</Text></Text>
                </View>

                <View style={reservaEmergencia.cartaoSaldo}>
                    <Text style={reservaEmergencia.tituloCartao}>Saldo da Reserva</Text>
                    <Text style={reservaEmergencia.valorTotal}>{formatarMoedaBR(saldoReserva)}</Text>
                    <Text style={reservaEmergencia.detalheSaldo}>
                        Aportes {formatarMoedaBR(totalAportes)} • Resgates {formatarMoedaBR(totalResgates)}
                    </Text>
                </View>

                <View style={reservaEmergencia.linhaAcoes}>
                    <TouchableOpacity style={reservaEmergencia.botaoAcaoGuardar} onPress={() => { resetForm(); setIsDepositVisible(true); }} activeOpacity={0.7}>
                        <Ionicons name="arrow-down-circle-outline" size={22} color={cores.destaque} />
                        <Text style={reservaEmergencia.textoBotaoGuardar}>Aportar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={reservaEmergencia.botaoAcaoResgatar} onPress={() => { resetForm(); setIsWithdrawVisible(true); }} activeOpacity={0.7}>
                        <Ionicons name="arrow-up-circle-outline" size={22} color={cores.erro} />
                        <Text style={reservaEmergencia.textoBotaoResgatar}>Resgatar</Text>
                    </TouchableOpacity>
                </View>

                <Modal visible={isDepositVisible} transparent animationType="slide" onRequestClose={() => setIsDepositVisible(false)}>
                    <View style={reservaEmergencia.fundoModal}>
                        <View style={reservaEmergencia.containerModal}>
                            <Text style={reservaEmergencia.tituloModal}>Adicionar aporte</Text>
                            <Text style={reservaEmergencia.subtituloModal}>Esse valor será somado ao total de aportes.</Text>

                            <View style={reservaEmergencia.conteinerInput}>
                                <Text style={reservaEmergencia.label}>Valor</Text>
                                <View style={[reservaEmergencia.envolucroInput, erroInput && reservaEmergencia.inputErro]}>
                                    <Text style={reservaEmergencia.prefixoCifrao}>R$</Text>
                                    <TextInput style={reservaEmergencia.inputComIcone} placeholder="0,00" placeholderTextColor={cores.textoPlaceholder} keyboardType="numeric" value={amountInput ? amountInput.replace(".", ",") : ""} onChangeText={handleValorChange} />
                                </View>
                                {erroInput && <Text style={reservaEmergencia.erroTexto}>Informe um valor maior que zero.</Text>}
                            </View>

                            <View style={reservaEmergencia.acoesModal}>
                                <TouchableOpacity style={reservaEmergencia.botaoCancelar} onPress={() => setIsDepositVisible(false)}>
                                    <Text style={reservaEmergencia.textoCancelar}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={reservaEmergencia.botaoConfirmar} onPress={handleDeposit}>
                                    <Text style={reservaEmergencia.textoConfirmar}>Confirmar Aporte</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal visible={isWithdrawVisible} transparent animationType="slide" onRequestClose={() => setIsWithdrawVisible(false)}>
                    <View style={reservaEmergencia.fundoModal}>
                        <View style={reservaEmergencia.containerModal}>
                            <Text style={reservaEmergencia.tituloModal}>Resgatar da reserva</Text>
                            <Text style={reservaEmergencia.subtituloModal}>Saldo disponível: {formatarMoedaBR(saldoReserva)}</Text>

                            <View style={reservaEmergencia.conteinerInput}>
                                <Text style={reservaEmergencia.label}>Valor</Text>
                                <View style={[reservaEmergencia.envolucroInput, erroInput && reservaEmergencia.inputErro]}>
                                    <Text style={reservaEmergencia.prefixoCifrao}>R$</Text>
                                    <TextInput style={reservaEmergencia.inputComIcone} placeholder="0,00" placeholderTextColor={cores.textoPlaceholder} keyboardType="numeric" value={amountInput ? amountInput.replace(".", ",") : ""} onChangeText={handleValorChange} />
                                </View>
                                {erroInput && <Text style={reservaEmergencia.erroTexto}>Informe um valor válido e dentro do saldo disponível.</Text>}
                            </View>

                            <Text style={reservaEmergencia.rotuloCampo}>Qual foi a emergência?</Text>
                            <View style={reservaEmergencia.containerCategorias}>
                                {CATEGORIAS_EMERGENCIA.map((cat) => (
                                    <TouchableOpacity key={cat.id} style={[reservaEmergencia.pilulaCategoria, selectedCategory === cat.id && reservaEmergencia.pilulaCategoriaSelecionada]} onPress={() => setSelectedCategory(cat.id)}>
                                        <Text style={[reservaEmergencia.textoCategoria, selectedCategory === cat.id && reservaEmergencia.textoCategoriaSelecionado]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={reservaEmergencia.acoesModal}>
                                <TouchableOpacity style={reservaEmergencia.botaoCancelar} onPress={() => setIsWithdrawVisible(false)}>
                                    <Text style={reservaEmergencia.textoCancelar}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={reservaEmergencia.botaoConfirmar} onPress={handleWithdraw}>
                                    <Text style={reservaEmergencia.textoConfirmar}>Confirmar Resgate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}
