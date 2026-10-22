import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";

import React, {
    useCallback,
    useRef,
    useState
} from "react";

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { cores } from "../estilos/cores";
import { reservaEmergencia } from "../estilos/reservaEmergencia";
import { formatarMoedaBR } from "../utils/moeda";

import {
    consultarResumoReserva,
    listarCategoriasReserva,
    registrarAporteReserva,
    registrarResgateReserva
} from "../servicos/servicoReserva";

import type {
    CategoriaReserva,
    ResumoReserva
} from "../servicos/servicoReserva";

function valorEhValido(texto: string): boolean {
    const valor = Number(texto);

    return (
        texto !== "" &&
        Number.isFinite(valor) &&
        valor > 0 &&
        valor <= 9999999999.99 &&
        /^\d{1,10}(\.\d{1,2})?$/.test(String(valor))
    );
}

export default function ReservaEmergenciaScreen() {
    const [resumo, setResumo] = useState<ResumoReserva | null>(null);
    const [categorias, setCategorias] = useState<CategoriaReserva[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [erroConsulta, setErroConsulta] = useState("");

    const consultaAtual = useRef(0);
    const operacaoEmAndamento = useRef(false);

    const [isDepositVisible, setIsDepositVisible] = useState(false);
    const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);

    const [amountInput, setAmountInput] = useState("");
    const [selectedCategory, setSelectedCategory] =
        useState<number | null>(null);

    const [motivo, setMotivo] = useState("");

    const [erroInput, setErroInput] = useState(false);
    const [erroCategoria, setErroCategoria] = useState(false);
    const [erroMotivo, setErroMotivo] = useState(false);

    const saldoReserva = resumo?.saldo ?? 0;

    // Consultar saldo e categorias reais da API.
    const atualizarTela = useCallback(async () => {
        const consulta = ++consultaAtual.current;

        setCarregando(true);
        setErroConsulta("");

        // Impedir exibicao de dados antigos ao trocar de usuario.
        setResumo(null);
        setCategorias([]);

        try {
            const [
                novoResumo,
                novasCategorias
            ] = await Promise.all([
                consultarResumoReserva(),
                listarCategoriasReserva()
            ]);

            if (consulta !== consultaAtual.current) {
                return;
            }

            setResumo(novoResumo);
            setCategorias(novasCategorias);

            setSelectedCategory((atual) => {
                const categoriaExiste = novasCategorias.some(
                    (item) => item.id_categoria === atual
                );

                return categoriaExiste
                    ? atual
                    : novasCategorias[0]?.id_categoria ?? null;
            });

        } catch (erro) {
            if (consulta !== consultaAtual.current) {
                return;
            }

            setErroConsulta(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível consultar a reserva."
            );

        } finally {
            if (consulta === consultaAtual.current) {
                setCarregando(false);
            }
        }
    }, []);

    // Recarregar os dados quando a tela receber foco.
    useFocusEffect(
        useCallback(() => {
            void atualizarTela();

            return () => {
                consultaAtual.current += 1;
            };
        }, [atualizarTela])
    );

    const resetForm = () => {
        setAmountInput("");
        setMotivo("");

        setErroInput(false);
        setErroCategoria(false);
        setErroMotivo(false);

        setSelectedCategory(
            categorias[0]?.id_categoria ?? null
        );
    };

    // Formatar os valores digitados em reais e centavos.
    const handleValorChange = (texto: string) => {
        const digitos = texto
            .replace(/\D/g, "")
            .slice(0, 12);

        if (!digitos) {
            setAmountInput("");
            setErroInput(false);
            return;
        }

        const valor = Number(digitos) / 100;

        if (!Number.isFinite(valor)) {
            return;
        }

        setAmountInput(valor.toFixed(2));
        setErroInput(false);
    };

    const abrirDeposito = () => {
        if (carregando || processando || erroConsulta || !resumo) {
            return;
        }

        resetForm();
        setIsDepositVisible(true);
    };

    const abrirResgate = () => {
        if (carregando || processando || erroConsulta || !resumo) {
            return;
        }

        resetForm();
        setIsWithdrawVisible(true);
    };

    const cancelarDeposito = () => {
        if (processando) {
            return;
        }

        setIsDepositVisible(false);
        resetForm();
    };

    const cancelarResgate = () => {
        if (processando) {
            return;
        }

        setIsWithdrawVisible(false);
        resetForm();
    };

    // Bloquear gravacoes simultaneas no MariaDB.
    const executarAcao = async (
        operacao: () => Promise<void>,
        mensagemSucesso: string
    ) => {
        if (operacaoEmAndamento.current) {
            return;
        }

        operacaoEmAndamento.current = true;
        setProcessando(true);

        try {
            await operacao();

            Alert.alert(
                "Operação confirmada",
                mensagemSucesso
            );

        } catch (erro) {
            // Conferir o banco antes de uma nova tentativa.
            // Uma falha de conexao pode acontecer apos o INSERT.
            await atualizarTela();

            Alert.alert(
                "Não foi possível confirmar",
                erro instanceof Error
                    ? erro.message
                    : "Confira o saldo antes de tentar novamente."
            );

        } finally {
            operacaoEmAndamento.current = false;
            setProcessando(false);
        }
    };

    // Registrar aporte sem categoria.
    const handleDeposit = () => {
        if (processando || !resumo) {
            return;
        }

        if (!valorEhValido(amountInput)) {
            setErroInput(true);

            Alert.alert(
                "Atenção",
                "Informe um valor maior que zero."
            );

            return;
        }

        const valor = Number(amountInput);

        void executarAcao(async () => {
            const resultado = await registrarAporteReserva(valor);

            setResumo(resultado.resumo);
            setIsDepositVisible(false);
            resetForm();

        }, `Aporte de ${formatarMoedaBR(valor)} registrado.`);
    };

    // Registrar resgate com categoria e motivo.
    const handleWithdraw = () => {
        if (processando || !resumo) {
            return;
        }

        if (!valorEhValido(amountInput)) {
            setErroInput(true);

            Alert.alert(
                "Atenção",
                "Informe um valor maior que zero."
            );

            return;
        }

        const valor = Number(amountInput);

        if (
            Math.round(valor * 100) >
            Math.round(saldoReserva * 100)
        ) {
            setErroInput(true);

            Alert.alert(
                "Saldo insuficiente",
                `O maior valor disponível para resgate é ${formatarMoedaBR(saldoReserva)}.`
            );

            return;
        }

        if (selectedCategory === null) {
            setErroCategoria(true);

            Alert.alert(
                "Categoria obrigatória",
                "Selecione uma categoria para o resgate."
            );

            return;
        }

        const motivoTratado = motivo.trim();

        if (
            !motivoTratado ||
            motivoTratado.length > 255
        ) {
            setErroMotivo(true);

            Alert.alert(
                "Motivo obrigatório",
                "Informe o motivo do resgate."
            );

            return;
        }

        const idCategoria = selectedCategory;

        const nomeCategoria =
            categorias.find(
                (item) => item.id_categoria === idCategoria
            )?.nome ?? "Categoria";

        void executarAcao(async () => {
            const resultado = await registrarResgateReserva(
                valor,
                idCategoria,
                motivoTratado
            );

            setResumo(resultado.resumo);
            setIsWithdrawVisible(false);
            resetForm();

        }, `Resgate de ${formatarMoedaBR(valor)} registrado na categoria ${nomeCategoria}.`);
    };

    const acoesDesabilitadas =
        carregando ||
        processando ||
        erroConsulta !== "" ||
        resumo === null;

    return (
        <SafeAreaView style={reservaEmergencia.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={reservaEmergencia.conteudoCentral}>
                {/* CABECALHO */}
                <View style={reservaEmergencia.cabecalho}>
                    <Text style={reservaEmergencia.titulo}>
                        Reserva de{" "}
                        <Text style={reservaEmergencia.tituloDestaque}>
                            Emergência
                        </Text>
                    </Text>
                </View>

                {/* RESUMO FINANCEIRO */}
                <View style={reservaEmergencia.cartaoSaldo}>
                    <Text style={reservaEmergencia.tituloCartao}>
                        Saldo da Reserva
                    </Text>

                    {carregando ? (
                        <ActivityIndicator
                            size="large"
                            color={cores.destaque}
                        />
                    ) : (
                        <Text style={reservaEmergencia.valorTotal}>
                            {resumo
                                ? formatarMoedaBR(resumo.saldo)
                                : "—"}
                        </Text>
                    )}

                    <Text style={reservaEmergencia.detalheSaldo}>
                        {resumo
                            ? (
                                `Aportes ${formatarMoedaBR(resumo.total_aportes)} • ` +
                                `Resgates ${formatarMoedaBR(resumo.total_resgates)}`
                            )
                            : "Aguardando informações da reserva"}
                    </Text>
                </View>

                {/* ERRO DE CONSULTA */}
                {erroConsulta !== "" && (
                    <View style={reservaEmergencia.containerModal}>
                        <Text style={reservaEmergencia.erroTexto}>
                            {erroConsulta}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                void atualizarTela();
                            }}
                        >
                            <Text style={{ color: cores.destaque }}>
                                Tentar novamente
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ACOES */}
                <View style={reservaEmergencia.linhaAcoes}>
                    <TouchableOpacity
                        style={[
                            reservaEmergencia.botaoAcaoGuardar,
                            acoesDesabilitadas && { opacity: 0.5 }
                        ]}
                        onPress={abrirDeposito}
                        disabled={acoesDesabilitadas}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-down-circle-outline"
                            size={22}
                            color={cores.destaque}
                        />

                        <Text style={reservaEmergencia.textoBotaoGuardar}>
                            Aportar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            reservaEmergencia.botaoAcaoResgatar,
                            acoesDesabilitadas && { opacity: 0.5 }
                        ]}
                        onPress={abrirResgate}
                        disabled={acoesDesabilitadas}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-up-circle-outline"
                            size={22}
                            color={cores.erro}
                        />

                        <Text style={reservaEmergencia.textoBotaoResgatar}>
                            Resgatar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* MODAL DE APORTE */}
                <Modal
                    visible={isDepositVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={cancelarDeposito}
                >
                    <View style={reservaEmergencia.fundoModal}>
                        <View style={reservaEmergencia.containerModal}>
                            <Text style={reservaEmergencia.tituloModal}>
                                Adicionar aporte
                            </Text>

                            <Text style={reservaEmergencia.subtituloModal}>
                                Esse valor será somado ao total de aportes.
                            </Text>

                            <View style={reservaEmergencia.conteinerInput}>
                                <Text style={reservaEmergencia.label}>
                                    Valor
                                </Text>

                                <View style={[
                                    reservaEmergencia.envolucroInput,
                                    erroInput && reservaEmergencia.inputErro
                                ]}>
                                    <Text style={reservaEmergencia.prefixoCifrao}>
                                        R$
                                    </Text>

                                    <TextInput
                                        style={reservaEmergencia.inputComIcone}
                                        placeholder="0,00"
                                        placeholderTextColor={
                                            cores.textoPlaceholder
                                        }
                                        keyboardType="numeric"
                                        maxLength={13}
                                        editable={!processando}
                                        value={
                                            amountInput
                                                ? amountInput.replace(".", ",")
                                                : ""
                                        }
                                        onChangeText={handleValorChange}
                                    />
                                </View>

                                {erroInput && (
                                    <Text style={reservaEmergencia.erroTexto}>
                                        Informe um valor positivo válido.
                                    </Text>
                                )}
                            </View>

                            <View style={reservaEmergencia.acoesModal}>
                                <TouchableOpacity
                                    style={reservaEmergencia.botaoCancelar}
                                    onPress={cancelarDeposito}
                                    disabled={processando}
                                >
                                    <Text style={reservaEmergencia.textoCancelar}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={reservaEmergencia.botaoConfirmar}
                                    onPress={handleDeposit}
                                    disabled={processando}
                                >
                                    {processando ? (
                                        <ActivityIndicator
                                            color={cores.textoBotao}
                                        />
                                    ) : (
                                        <Text style={reservaEmergencia.textoConfirmar}>
                                            Confirmar Aporte
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* MODAL DE RESGATE */}
                <Modal
                    visible={isWithdrawVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={cancelarResgate}
                >
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[
                            reservaEmergencia.fundoModal,
                            { flexGrow: 1 }
                        ]}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={reservaEmergencia.containerModal}>
                            <Text style={reservaEmergencia.tituloModal}>
                                Resgatar da reserva
                            </Text>

                            <Text style={reservaEmergencia.subtituloModal}>
                                Saldo disponível:{" "}
                                {formatarMoedaBR(saldoReserva)}
                            </Text>

                            {/* VALOR DO RESGATE */}
                            <View style={reservaEmergencia.conteinerInput}>
                                <Text style={reservaEmergencia.label}>
                                    Valor
                                </Text>

                                <View style={[
                                    reservaEmergencia.envolucroInput,
                                    erroInput && reservaEmergencia.inputErro
                                ]}>
                                    <Text style={reservaEmergencia.prefixoCifrao}>
                                        R$
                                    </Text>

                                    <TextInput
                                        style={reservaEmergencia.inputComIcone}
                                        placeholder="0,00"
                                        placeholderTextColor={
                                            cores.textoPlaceholder
                                        }
                                        keyboardType="numeric"
                                        maxLength={13}
                                        editable={!processando}
                                        value={
                                            amountInput
                                                ? amountInput.replace(".", ",")
                                                : ""
                                        }
                                        onChangeText={handleValorChange}
                                    />
                                </View>

                                {erroInput && (
                                    <Text style={reservaEmergencia.erroTexto}>
                                        Informe um valor válido dentro do saldo.
                                    </Text>
                                )}
                            </View>

                            {/* CATEGORIAS REAIS DO MARIADB */}
                            <Text style={reservaEmergencia.rotuloCampo}>
                                Qual foi a emergência?
                            </Text>

                            <View style={reservaEmergencia.containerCategorias}>
                                {categorias.map((categoria) => {
                                    const selecionada =
                                        selectedCategory ===
                                        categoria.id_categoria;

                                    return (
                                        <TouchableOpacity
                                            key={categoria.id_categoria}
                                            style={[
                                                reservaEmergencia.pilulaCategoria,
                                                selecionada &&
                                                reservaEmergencia.pilulaCategoriaSelecionada
                                            ]}
                                            disabled={processando}
                                            onPress={() => {
                                                setSelectedCategory(
                                                    categoria.id_categoria
                                                );
                                                setErroCategoria(false);
                                            }}
                                        >
                                            <Text style={[
                                                reservaEmergencia.textoCategoria,
                                                selecionada &&
                                                reservaEmergencia.textoCategoriaSelecionado
                                            ]}>
                                                {categoria.nome}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {erroCategoria && (
                                <Text style={reservaEmergencia.erroTexto}>
                                    Selecione uma categoria válida.
                                </Text>
                            )}

                            {categorias.length === 0 && (
                                <Text style={reservaEmergencia.erroTexto}>
                                    Nenhuma categoria disponível.
                                </Text>
                            )}

                            {/* MOTIVO OBRIGATORIO DO RESGATE */}
                            <View style={reservaEmergencia.conteinerInput}>
                                <Text style={reservaEmergencia.label}>
                                    Motivo do resgate
                                </Text>

                                <View style={[
                                    reservaEmergencia.envolucroInput,
                                    erroMotivo && reservaEmergencia.inputErro
                                ]}>
                                    <TextInput
                                        style={reservaEmergencia.inputComIcone}
                                        placeholder="Ex: Consulta médica"
                                        placeholderTextColor={
                                            cores.textoPlaceholder
                                        }
                                        value={motivo}
                                        maxLength={255}
                                        editable={!processando}
                                        onChangeText={(texto) => {
                                            setMotivo(texto);
                                            setErroMotivo(false);
                                        }}
                                    />
                                </View>

                                {erroMotivo && (
                                    <Text style={reservaEmergencia.erroTexto}>
                                        Informe o motivo do resgate.
                                    </Text>
                                )}
                            </View>

                            {/* CONFIRMAR OU CANCELAR */}
                            <View style={reservaEmergencia.acoesModal}>
                                <TouchableOpacity
                                    style={reservaEmergencia.botaoCancelar}
                                    onPress={cancelarResgate}
                                    disabled={processando}
                                >
                                    <Text style={reservaEmergencia.textoCancelar}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={reservaEmergencia.botaoConfirmar}
                                    onPress={handleWithdraw}
                                    disabled={
                                        processando ||
                                        categorias.length === 0
                                    }
                                >
                                    {processando ? (
                                        <ActivityIndicator
                                            color={cores.textoBotao}
                                        />
                                    ) : (
                                        <Text style={reservaEmergencia.textoConfirmar}>
                                            Confirmar Resgate
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>
            </View>
        </SafeAreaView>
    );
}