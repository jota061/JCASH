import React, { useCallback, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { Stack, useFocusEffect } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

import DateTimePicker, {
    DateTimePickerEvent
} from "@react-native-community/datetimepicker";

import { cores } from "../estilos/cores";
import { contas } from "../estilos/contas";

import {
    adicionarDias,
    adicionarMeses,
    dataEhAnteriorAHoje,
    formatarDataBR,
    formatarDataISO,
    inicioDoDia
} from "../utils/datas";

import { formatarMoedaBR } from "../utils/moeda";

import {
    listarCategoriasContas,
    listarContas,
    listarRecorrencias,
    cadastrarContaUnica,
    cadastrarRecorrencia,
    gerarMensalidadesDaRecorrencia,
    marcarContaComoPaga,
    excluirContaUnica,
    encerrarRecorrencia
} from "../servicos/servicoContas";

import type {
    CategoriaConta,
    ContaRegistrada,
    RecorrenciaConta
} from "../servicos/servicoContas";

interface ErrosFormulario {
    nome?: string;
    valor?: string;
    categoria?: string;
    dataInicio?: string;
    dataFim?: string;
}

const ICONES_CATEGORIAS: Record<
    string,
    keyof typeof Ionicons.glyphMap
> = {
    Moradia: "home-outline",
    "Alimentação": "cart-outline",
    "Educação": "book-outline",
    Transporte: "car-outline",
    "Saúde": "medkit-outline",
    Outros: "grid-outline"
};

// O termino padrao fica um mes apos o primeiro vencimento.
function datasIniciais() {
    const inicio = adicionarDias(new Date(), 1);

    return {
        inicio,
        fim: adicionarMeses(inicio, 1)
    };
}

export default function Contas() {
    const [listaContas, setListaContas] =
        useState<ContaRegistrada[]>([]);

    const [recorrencias, setRecorrencias] =
        useState<RecorrenciaConta[]>([]);

    const [categorias, setCategorias] =
        useState<CategoriaConta[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [erroConsulta, setErroConsulta] = useState("");

    const identificadorConsulta = useRef(0);
    const operacaoEmAndamento = useRef(false);

    // Dados do formulario.
    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");
    const [categoriaId, setCategoriaId] =
        useState<number | null>(null);

    const [isMensal, setIsMensal] = useState(true);
    const [erros, setErros] = useState<ErrosFormulario>({});

    const [dataInicioObj, setDataInicioObj] = useState(
        () => datasIniciais().inicio
    );

    const [dataFimObj, setDataFimObj] = useState(
        () => datasIniciais().fim
    );

    const [mostrarCalendario, setMostrarCalendario] =
        useState<"inicio" | "fim" | null>(null);

    // Atualizar contas, recorrencias e categorias.
    const atualizarTela = useCallback(async () => {
        const numero = ++identificadorConsulta.current;

        setCarregando(true);
        setErroConsulta("");

        try {
            const [
                novasCategorias,
                novasContas,
                novasRecorrencias
            ] = await Promise.all([
                listarCategoriasContas(),
                listarContas(),
                listarRecorrencias()
            ]);

            if (numero !== identificadorConsulta.current) {
                return;
            }

            setCategorias(novasCategorias);
            setListaContas(novasContas);
            setRecorrencias(novasRecorrencias);

            setCategoriaId((atual) =>
                novasCategorias.some(
                    (item) => item.id_categoria === atual
                )
                    ? atual
                    : novasCategorias[0]?.id_categoria ?? null
            );

        } catch (erro) {
            if (numero === identificadorConsulta.current) {
                setErroConsulta(
                    erro instanceof Error
                        ? erro.message
                        : "Não foi possível consultar as contas."
                );
            }

        } finally {
            if (numero === identificadorConsulta.current) {
                setCarregando(false);
            }
        }
    }, []);

    // Consultar os dados quando a tela receber foco.
    useFocusEffect(
        useCallback(() => {
            void atualizarTela();

            return () => {
                identificadorConsulta.current += 1;
            };
        }, [atualizarTela])
    );

    // Contas permitem hoje ou datas futuras.
    const onChangeData = (
        evento: DateTimePickerEvent,
        selecionada?: Date
    ) => {
        const campo = mostrarCalendario;
        setMostrarCalendario(null);

        if (evento.type !== "set" || !selecionada) {
            return;
        }

        if (campo === "inicio") {
            setDataInicioObj(selecionada);

            // Recalcular o termino para o mes seguinte.
            setDataFimObj(
                adicionarMeses(selecionada, 1)
            );

            setErros((anterior) => ({
                ...anterior,
                dataInicio: undefined,
                dataFim: undefined
            }));

        } else if (campo === "fim") {
            setDataFimObj(selecionada);

            setErros((anterior) => ({
                ...anterior,
                dataFim: undefined
            }));
        }
    };

    // Converter os digitos digitados em reais e centavos.
    const handleValorChange = (texto: string) => {
        const digitos = texto.replace(/\D/g, "");

        if (!digitos) {
            setValor("");
            return;
        }

        const numero = Number(digitos) / 100;

        if (!Number.isFinite(numero)) {
            return;
        }

        setValor(numero.toFixed(2));

        setErros((atual) => ({
            ...atual,
            valor: undefined
        }));
    };

    const limparFormulario = () => {
        const { inicio, fim } = datasIniciais();

        setNome("");
        setValor("");
        setIsMensal(true);
        setDataInicioObj(inicio);
        setDataFimObj(fim);
        setErros({});
    };

    // Validar os campos antes de enviar para a API.
    const validarFormulario = () => {
        const novos: ErrosFormulario = {};
        const numero = Number(valor);

        if (!nome.trim() || nome.trim().length > 100) {
            novos.nome =
                "Informe um nome com até 100 caracteres.";
        }

        if (
            !valor ||
            !Number.isFinite(numero) ||
            numero <= 0 ||
            !/^\d{1,10}(\.\d{1,2})?$/.test(String(numero))
        ) {
            novos.valor =
                "Informe um valor positivo válido.";
        }

        if (categoriaId === null) {
            novos.categoria = "Selecione uma categoria.";
        }

        if (dataEhAnteriorAHoje(dataInicioObj)) {
            novos.dataInicio =
                "O vencimento não pode estar no passado.";
        }

        if (
            isMensal &&
            inicioDoDia(dataFimObj).getTime() <
            inicioDoDia(dataInicioObj).getTime()
        ) {
            novos.dataFim =
                "O término não pode ser anterior ao início.";
        }

        setErros(novos);

        return Object.keys(novos).length === 0;
    };

    // Impedir varias operacoes ao mesmo tempo.
    const executarAcao = async (
        operacao: () => Promise<void>,
        sucesso: string
    ) => {
        if (operacaoEmAndamento.current) {
            return;
        }

        operacaoEmAndamento.current = true;
        setProcessando(true);

        try {
            await operacao();
            await atualizarTela();

            Alert.alert("Sucesso!", sucesso);

        } catch (erro) {
            await atualizarTela();

            Alert.alert(
                "Não foi possível concluir",
                erro instanceof Error
                    ? erro.message
                    : "Ocorreu um erro na operação."
            );

        } finally {
            operacaoEmAndamento.current = false;
            setProcessando(false);
        }
    };

    const validarEGravar = () => {
        if (
            carregando ||
            processando ||
            !validarFormulario() ||
            categoriaId === null
        ) {
            return;
        }

        const dados = {
            nome: nome.trim(),
            valor: Number(valor),
            id_categoria: categoriaId
        };

        if (!isMensal) {
            void executarAcao(async () => {
                await cadastrarContaUnica({
                    ...dados,
                    data_vencimento: formatarDataISO(
                        dataInicioObj
                    )
                });

                limparFormulario();

            }, "Conta de pagamento único cadastrada.");

            return;
        }

        void executarAcao(async () => {
            const recorrencia = await cadastrarRecorrencia({
                ...dados,
                data_inicio: formatarDataISO(dataInicioObj),
                data_fim: formatarDataISO(dataFimObj)
            });

            limparFormulario();

            try {
                await gerarMensalidadesDaRecorrencia(
                    recorrencia
                );

            } catch {
                throw new Error(
                    `Recorrência ${recorrencia.id_recorrencia} cadastrada, ` +
                    "mas algumas mensalidades não foram confirmadas. " +
                    "Use 'Gerar mensalidades' na recorrência existente."
                );
            }

        }, "Recorrência e mensalidades cadastradas.");
    };

    // Registrar pagamento sem criar outra despesa.
    const confirmarPagamento = (conta: ContaRegistrada) => {
        Alert.alert(
            "Registrar pagamento",
            `Confirmar pagamento de ${conta.nome}, no valor de ${formatarMoedaBR(conta.valor)}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    onPress: () => {
                        void executarAcao(
                            async () => {
                                await marcarContaComoPaga(
                                    conta.id_conta,
                                    formatarDataISO(new Date())
                                );
                            },
                            "Pagamento registrado no MariaDB."
                        );
                    }
                }
            ]
        );
    };

    const confirmarExclusaoConta = (
        conta: ContaRegistrada
    ) => {
        Alert.alert(
            "Excluir conta",
            `Excluir definitivamente '${conta.nome}'?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                        void executarAcao(
                            async () => {
                                await excluirContaUnica(
                                    conta.id_conta
                                );
                            },
                            "Conta excluída com sucesso."
                        );
                    }
                }
            ]
        );
    };

    const confirmarGeracao = (
        recorrencia: RecorrenciaConta
    ) => {
        void executarAcao(
            async () => {
                await gerarMensalidadesDaRecorrencia(
                    recorrencia
                );
            },
            "Mensalidades verificadas e atualizadas."
        );
    };

    // Preservar a Regra B de encerramento.
    const confirmarEncerramento = (
        recorrencia: RecorrenciaConta
    ) => {
        Alert.alert(
            "Encerrar recorrência",
            "As contas futuras pendentes serão excluídas. " +
            "As pagas e as vencidas pendentes serão preservadas.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Encerrar",
                    style: "destructive",
                    onPress: () => {
                        void executarAcao(
                            async () => {
                                await encerrarRecorrencia(
                                    recorrencia.id_recorrencia
                                );
                            },
                            "Recorrência encerrada conforme a Regra B."
                        );
                    }
                }
            ]
        );
    };

    const atrasada = (conta: ContaRegistrada) =>
        conta.status === "PENDENTE" &&
        conta.data_vencimento < formatarDataISO(new Date());

    const nomeCategoria = (id: number) =>
        categorias.find(
            (item) => item.id_categoria === id
        )?.nome ?? "Categoria";

    const recorrenciasAtivas = recorrencias.filter(
        (item) => item.ativa
    );

    return (
        <ScrollView
            style={contas.containerTela}
            contentContainerStyle={contas.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <Stack.Screen
                options={{ headerShown: false }}
            />

            <View style={contas.conteudoCentral}>
                {/* TITULO */}
                <View style={contas.topo}>
                    <Text style={contas.titulo}>
                        Contas{" "}
                        <Text style={contas.logo}>
                            Mensais
                        </Text>
                    </Text>
                </View>

                {carregando && (
                    <ActivityIndicator
                        color={cores.destaque}
                    />
                )}

                {erroConsulta !== "" && (
                    <View style={contas.formulario}>
                        <Text style={contas.erroTexto}>
                            {erroConsulta}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                void atualizarTela();
                            }}
                        >
                            <Text
                                style={{
                                    color: cores.destaque
                                }}
                            >
                                Tentar novamente
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* FORMULARIO */}
                <View style={contas.formulario}>
                    <Text style={contas.tituloFormulario}>
                        Cadastrar Nova Conta
                    </Text>

                    {/* NOME */}
                    <View style={contas.conteinerInput}>
                        <Text style={contas.label}>
                            Nome da Conta
                        </Text>

                        <View
                            style={[
                                contas.envolucroInput,
                                Boolean(erros.nome) &&
                                contas.inputErro
                            ]}
                        >
                            <Feather
                                name="edit-2"
                                size={20}
                                color={cores.textoCinzaClaro}
                                style={contas.iconeInput}
                            />

                            <TextInput
                                style={contas.inputComIcone}
                                placeholder="Ex: Conta de Luz"
                                placeholderTextColor={
                                    cores.textoPlaceholder
                                }
                                value={nome}
                                maxLength={100}
                                editable={!processando}
                                onChangeText={(texto) => {
                                    setNome(texto);

                                    setErros((e) => ({
                                        ...e,
                                        nome: undefined
                                    }));
                                }}
                            />
                        </View>

                        {erros.nome && (
                            <Text style={contas.erroTexto}>
                                {erros.nome}
                            </Text>
                        )}
                    </View>

                    {/* VALOR */}
                    <View style={contas.conteinerInput}>
                        <Text style={contas.label}>
                            Valor da Conta
                        </Text>

                        <View
                            style={[
                                contas.envolucroInput,
                                Boolean(erros.valor) &&
                                contas.inputErro
                            ]}
                        >
                            <Text style={contas.prefixoCifrao}>
                                R$
                            </Text>

                            <TextInput
                                style={contas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={
                                    cores.textoPlaceholder
                                }
                                keyboardType="numeric"
                                value={
                                    valor
                                        ? valor.replace(".", ",")
                                        : ""
                                }
                                maxLength={13}
                                editable={!processando}
                                onChangeText={handleValorChange}
                            />
                        </View>

                        {erros.valor && (
                            <Text style={contas.erroTexto}>
                                {erros.valor}
                            </Text>
                        )}
                    </View>

                    {/* TIPO DE COBRANCA */}
                    <View>
                        <Text style={contas.label}>
                            Tipo de Cobrança
                        </Text>

                        <View style={contas.toggleContainer}>
                            <TouchableOpacity
                                style={[
                                    contas.btnToggle,
                                    isMensal &&
                                    contas.btnToggleAtivo
                                ]}
                                onPress={() => setIsMensal(true)}
                                disabled={processando}
                            >
                                <Ionicons
                                    name="repeat-outline"
                                    size={18}
                                    color={
                                        isMensal
                                            ? cores.textoBotao
                                            : cores.textoCinzaClaro
                                    }
                                />

                                <Text
                                    style={[
                                        contas.textoToggle,
                                        isMensal &&
                                        contas.textoToggleAtivo
                                    ]}
                                >
                                    Mensal
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    contas.btnToggle,
                                    !isMensal &&
                                    contas.btnToggleAtivo
                                ]}
                                onPress={() => setIsMensal(false)}
                                disabled={processando}
                            >
                                <Ionicons
                                    name="cash-outline"
                                    size={18}
                                    color={
                                        !isMensal
                                            ? cores.textoBotao
                                            : cores.textoCinzaClaro
                                    }
                                />

                                <Text
                                    style={[
                                        contas.textoToggle,
                                        !isMensal &&
                                        contas.textoToggleAtivo
                                    ]}
                                >
                                    Pagamento Único
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* PRIMEIRO VENCIMENTO */}
                    <View style={contas.conteinerInput}>
                        <Text style={contas.label}>
                            {isMensal
                                ? "Primeiro vencimento / início"
                                : "Data de vencimento"}
                        </Text>

                        <TouchableOpacity
                            style={[
                                contas.inputData,
                                Boolean(erros.dataInicio) &&
                                contas.inputErro
                            ]}
                            onPress={() => {
                                setMostrarCalendario("inicio");
                            }}
                            disabled={processando}
                        >
                            <Text
                                style={{
                                    color: cores.textoCinzaClaro,
                                    fontSize: 16
                                }}
                            >
                                {dataInicioObj.toLocaleDateString("pt-BR")}
                            </Text>

                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={cores.textoCinzaMedio}
                            />
                        </TouchableOpacity>

                        {erros.dataInicio && (
                            <Text style={contas.erroTexto}>
                                {erros.dataInicio}
                            </Text>
                        )}
                    </View>

                    {/* TERMINO DA RECORRENCIA */}
                    {isMensal && (
                        <View style={contas.conteinerInput}>
                            <Text style={contas.label}>
                                Data de término da recorrência
                            </Text>

                            <TouchableOpacity
                                style={[
                                    contas.inputData,
                                    Boolean(erros.dataFim) &&
                                    contas.inputErro
                                ]}
                                onPress={() => {
                                    setMostrarCalendario("fim");
                                }}
                                disabled={processando}
                            >
                                <Text
                                    style={{
                                        color: cores.textoCinzaClaro,
                                        fontSize: 16
                                    }}
                                >
                                    {dataFimObj.toLocaleDateString("pt-BR")}
                                </Text>

                                <Ionicons
                                    name="calendar-outline"
                                    size={20}
                                    color={cores.textoCinzaMedio}
                                />
                            </TouchableOpacity>

                            {erros.dataFim && (
                                <Text style={contas.erroTexto}>
                                    {erros.dataFim}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* CALENDARIOS */}
                    {mostrarCalendario === "inicio" && (
                        <DateTimePicker
                            value={dataInicioObj}
                            mode="date"
                            display="default"
                            minimumDate={inicioDoDia()}
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

                    {/* CATEGORIAS */}
                    <View>
                        <Text style={contas.label}>
                            Categoria
                        </Text>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={
                                contas.gridCategorias
                            }
                        >
                            {categorias.map((categoria) => {
                                const selecionada =
                                    categoriaId ===
                                    categoria.id_categoria;

                                const icone =
                                    ICONES_CATEGORIAS[categoria.nome] ||
                                    "grid-outline";

                                return (
                                    <TouchableOpacity
                                        key={categoria.id_categoria}
                                        style={[
                                            contas.cardCategoria,
                                            selecionada &&
                                            contas.cardCategoriaSelecionado
                                        ]}
                                        disabled={processando}
                                        onPress={() => {
                                            setCategoriaId(
                                                categoria.id_categoria
                                            );

                                            setErros((e) => ({
                                                ...e,
                                                categoria: undefined
                                            }));
                                        }}
                                    >
                                        <Ionicons
                                            name={icone}
                                            size={18}
                                            color={
                                                selecionada
                                                    ? cores.textoBotao
                                                    : cores.textoCinzaClaro
                                            }
                                        />

                                        <Text
                                            style={[
                                                contas.textoCategoria,
                                                selecionada &&
                                                contas.textoCategoriaSelecionado
                                            ]}
                                        >
                                            {categoria.nome}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {erros.categoria && (
                            <Text style={contas.erroTexto}>
                                {erros.categoria}
                            </Text>
                        )}
                    </View>

                    {/* CADASTRAR CONTA */}
                    <TouchableOpacity
                        style={[
                            contas.botao,
                            processando && { opacity: 0.7 }
                        ]}
                        onPress={validarEGravar}
                        disabled={
                            processando ||
                            carregando ||
                            erroConsulta !== "" ||
                            categorias.length === 0
                        }
                    >
                        {processando ? (
                            <ActivityIndicator
                                color={cores.textoBotao}
                            />
                        ) : (
                            <Text style={contas.textoBotao}>
                                CADASTRAR CONTA
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* LISTA DE CONTAS */}
                <View style={contas.secaoLista}>
                    <Text style={contas.tituloSecao}>
                        Suas Contas ({listaContas.length})
                    </Text>

                    {!carregando &&
                        !erroConsulta &&
                        listaContas.length === 0 && (
                            <Text
                                style={{
                                    color: cores.textoCinzaClaro,
                                    marginBottom: 16
                                }}
                            >
                                Nenhuma conta cadastrada.
                            </Text>
                        )}

                    {listaContas.map((item) => {
                        const estaAtrasada = atrasada(item);

                        const podePagar =
                            item.status === "PENDENTE";

                        const podeExcluir =
                            item.tipo_cobranca ===
                            "PAGAMENTO_UNICO" &&
                            item.status === "PENDENTE";

                        const status =
                            item.status === "PAGA"
                                ? "Paga"
                                : item.status === "CANCELADA"
                                    ? "Cancelada"
                                    : estaAtrasada
                                        ? "Atrasada"
                                        : "Pendente";

                        return (
                            <View
                                key={item.id_conta}
                                style={contas.cardContaItem}
                            >
                                <View style={contas.infoContaItem}>
                                    <Ionicons
                                        name={
                                            item.tipo_cobranca ===
                                                "MENSAL"
                                                ? "repeat-outline"
                                                : "cash-outline"
                                        }
                                        size={22}
                                        color={cores.destaque}
                                    />

                                    <View style={contas.textosConta}>
                                        <Text
                                            style={contas.nomeContaItem}
                                            numberOfLines={2}
                                        >
                                            {item.nome}
                                        </Text>

                                        <Text style={contas.detalheContaItem}>
                                            Vencimento:{" "}
                                            {formatarDataBR(
                                                item.data_vencimento
                                            )}
                                        </Text>

                                        <Text style={contas.detalheContaItem}>
                                            {nomeCategoria(
                                                item.id_categoria
                                            )}{" "}
                                            •{" "}
                                            {item.tipo_cobranca === "MENSAL"
                                                ? "Mensal"
                                                : "Pagamento Único"}
                                        </Text>

                                        <Text
                                            style={[
                                                contas.statusConta,
                                                item.status === "PAGA"
                                                    ? contas.statusPaga
                                                    : estaAtrasada
                                                        ? contas.statusAtrasada
                                                        : contas.statusPendente
                                            ]}
                                        >
                                            {status}
                                            {item.data_pagamento
                                                ? ` em ${formatarDataBR(
                                                    item.data_pagamento
                                                )}`
                                                : ""}
                                        </Text>
                                    </View>
                                </View>

                                <View style={contas.acoesContainer}>
                                    <Text style={contas.valorContaItem}>
                                        {formatarMoedaBR(item.valor)}
                                    </Text>

                                    <View style={contas.iconesAcoes}>
                                        {podePagar && (
                                            <TouchableOpacity
                                                style={contas.btnAcao}
                                                disabled={processando}
                                                onPress={() => {
                                                    confirmarPagamento(item);
                                                }}
                                                accessibilityLabel={
                                                    "Marcar conta como paga"
                                                }
                                            >
                                                <Ionicons
                                                    name="checkmark-circle-outline"
                                                    size={22}
                                                    color={cores.destaque}
                                                />
                                            </TouchableOpacity>
                                        )}

                                        {podeExcluir && (
                                            <TouchableOpacity
                                                style={contas.btnAcao}
                                                disabled={processando}
                                                onPress={() => {
                                                    confirmarExclusaoConta(
                                                        item
                                                    );
                                                }}
                                                accessibilityLabel={
                                                    "Excluir conta"
                                                }
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={20}
                                                    color={cores.erro}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* RECORRENCIAS ATIVAS */}
                <View style={contas.secaoLista}>
                    <Text style={contas.tituloSecao}>
                        Recorrências Ativas (
                        {recorrenciasAtivas.length})
                    </Text>

                    {!carregando &&
                        !erroConsulta &&
                        recorrenciasAtivas.length === 0 && (
                            <Text
                                style={{
                                    color: cores.textoCinzaClaro,
                                    marginBottom: 16
                                }}
                            >
                                Nenhuma recorrência ativa.
                            </Text>
                        )}

                    {recorrenciasAtivas.map((recorrencia) => (
                        <View
                            key={recorrencia.id_recorrencia}
                            style={[
                                contas.formulario,
                                { marginBottom: 12 }
                            ]}
                        >
                            <Text style={contas.tituloFormulario}>
                                {recorrencia.nome}
                            </Text>

                            <Text style={contas.label}>
                                {formatarMoedaBR(recorrencia.valor)}
                            </Text>

                            <Text
                                style={{
                                    color: cores.textoCinzaClaro,
                                    fontSize: 12
                                }}
                            >
                                {formatarDataBR(
                                    recorrencia.data_inicio
                                )}{" "}
                                até{" "}
                                {formatarDataBR(
                                    recorrencia.data_fim
                                )}
                            </Text>

                            <TouchableOpacity
                                style={contas.botao}
                                disabled={processando}
                                onPress={() => {
                                    confirmarGeracao(recorrencia);
                                }}
                            >
                                <Text style={contas.textoBotao}>
                                    GERAR MENSALIDADES
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    contas.btnToggle,
                                    {
                                        borderColor: cores.erro,
                                        marginTop: 4
                                    }
                                ]}
                                disabled={processando}
                                onPress={() => {
                                    confirmarEncerramento(
                                        recorrencia
                                    );
                                }}
                            >
                                <Ionicons
                                    name="close-circle-outline"
                                    size={18}
                                    color={cores.erro}
                                />

                                <Text
                                    style={{
                                        color: cores.erro,
                                        fontWeight: "700"
                                    }}
                                >
                                    Encerrar Recorrência
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}