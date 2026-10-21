import React, {
    useCallback,
    useEffect,
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
    View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

import DateTimePicker, {
    DateTimePickerEvent
} from "@react-native-community/datetimepicker";

import { despesas } from "../estilos/despesas";
import { cores } from "../estilos/cores";

import {
    dataEhPosteriorAHoje,
    formatarDataISO
} from "../utils/datas";

import { formatarMoedaBR } from "../utils/moeda";

import {
    cadastrarMovimentacao,
    listarCategorias
} from "../servicos/servicoMovimentacoes";

import type {
    CategoriaMovimentacao
} from "../servicos/servicoMovimentacoes";

interface ErrosDespesas {
    nome?: string;
    valor?: string;
    data?: string;
    categoria?: string;
}

// Icones das categorias conhecidas
const ICONES_CATEGORIAS: Record<
    string,
    keyof typeof Ionicons.glyphMap
> = {
    "Alimentação": "restaurant-outline",
    "Transporte": "car-outline",
    "Moradia": "home-outline",
    "Saúde": "medkit-outline",
    "Lazer": "game-controller-outline",
    "Outros": "grid-outline"
};

export default function RegistrarDespesa() {
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");

    const [dataObj, setDataObj] = useState(new Date());
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const [erros, setErros] = useState<ErrosDespesas>({});

    // Categorias reais de despesa
    const [categorias, setCategorias] =
        useState<CategoriaMovimentacao[]>([]);

    const [categoriaSelecionada, setCategoriaSelecionada] =
        useState<number | null>(null);

    const [carregandoCategorias, setCarregandoCategorias] =
        useState(true);

    const [erroCategorias, setErroCategorias] = useState("");

    // Controle dos cadastros enviados para a API
    const [salvando, setSalvando] = useState(false);
    const envioEmAndamento = useRef(false);

    // Consultar as categorias no MariaDB
    const carregarCategorias = useCallback(async () => {
        setCarregandoCategorias(true);
        setErroCategorias("");

        try {
            const lista = await listarCategorias("DESPESA");

            setCategorias(lista);

            setCategoriaSelecionada((atual) => {
                if (
                    atual !== null &&
                    lista.some(
                        (item) => item.id_categoria === atual
                    )
                ) {
                    return atual;
                }

                return lista[0]?.id_categoria ?? null;
            });

            if (lista.length === 0) {
                setErroCategorias(
                    "Nenhuma categoria de despesa foi encontrada."
                );
            }

        } catch (erro) {
            setCategorias([]);
            setCategoriaSelecionada(null);

            setErroCategorias(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível carregar as categorias."
            );

        } finally {
            setCarregandoCategorias(false);
        }
    }, []);

    useEffect(() => {
        void carregarCategorias();
    }, [carregarCategorias]);

    // Atualizar a data da despesa
    const onChangeData = (
        evento: DateTimePickerEvent,
        dataSelecionada?: Date
    ) => {
        setMostrarCalendario(false);

        if (evento.type === "set" && dataSelecionada) {
            setDataObj(dataSelecionada);

            setErros((atual) => ({
                ...atual,
                data: undefined
            }));
        }
    };

    // Converter a digitacao em valor monetario
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

    // Validar e cadastrar a despesa na API
    const validarEGravar = async () => {
        if (envioEmAndamento.current) {
            return;
        }

        const errosAtuais: ErrosDespesas = {};
        const nomeLimpo = nome.trim();
        const valorNumerico = Number(valor);

        if (!nomeLimpo || nomeLimpo.length > 100) {
            errosAtuais.nome =
                "Informe um nome com até 100 caracteres.";
        }

        if (
            !valor ||
            !Number.isFinite(valorNumerico) ||
            valorNumerico <= 0 ||
            valorNumerico > 9999999999.99
        ) {
            errosAtuais.valor =
                "Informe um valor positivo válido.";
        }

        if (dataEhPosteriorAHoje(dataObj)) {
            errosAtuais.data =
                "A data não pode estar no futuro.";
        }

        if (categoriaSelecionada === null) {
            errosAtuais.categoria =
                "Selecione uma categoria válida.";
        }

        setErros(errosAtuais);

        if (Object.keys(errosAtuais).length > 0) {
            return;
        }

        if (categoriaSelecionada === null) {
            return;
        }

        envioEmAndamento.current = true;
        setSalvando(true);

        try {
            await cadastrarMovimentacao("DESPESA", {
                nome: nomeLimpo,
                valor: valorNumerico,
                data: formatarDataISO(dataObj),
                id_categoria: categoriaSelecionada
            });

            // Limpar o formulario apos o cadastro real
            setNome("");
            setValor("");
            setDataObj(new Date());
            setErros({});

            Alert.alert(
                "Despesa registrada!",
                `A despesa de ${formatarMoedaBR(valorNumerico)} foi cadastrada no JCASH.`,
                [
                    {
                        text: "Registrar outra",
                        style: "cancel"
                    },
                    {
                        text: "Ver na Home",
                        onPress: () => {
                            router.replace("/(tabs)/home");
                        }
                    }
                ]
            );

        } catch (erro) {
            Alert.alert(
                "Erro ao cadastrar despesa",
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível registrar a despesa."
            );

        } finally {
            envioEmAndamento.current = false;
            setSalvando(false);
        }
    };

    return (
        <SafeAreaView style={despesas.containerTela}>
            <Stack.Screen
                options={{ headerShown: false }}
            />

            <ScrollView
                style={{ width: "100%" }}
                contentContainerStyle={{
                    paddingBottom: 24,
                    alignItems: "center"
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={despesas.conteudoCentral}>
                    <View style={despesas.topo}>
                        <Text style={despesas.titulo}>
                            Nova{" "}
                            <Text style={despesas.logo}>
                                Despesa
                            </Text>
                        </Text>
                    </View>

                    <View style={despesas.formulario}>
                        {/* NOME DA DESPESA */}
                        <View style={despesas.conteinerInput}>
                            <Text style={despesas.label}>
                                Nome da Despesa
                            </Text>

                            <View
                                style={[
                                    despesas.envolucroInput,
                                    Boolean(erros.nome) &&
                                    despesas.inputErro
                                ]}
                            >
                                <Feather
                                    name="edit-2"
                                    size={20}
                                    color={cores.textoCinzaClaro}
                                    style={despesas.iconeInput}
                                />

                                <TextInput
                                    style={despesas.inputComIcone}
                                    placeholder="Ex: Mercado"
                                    placeholderTextColor={
                                        cores.textoPlaceholder
                                    }
                                    value={nome}
                                    maxLength={100}
                                    editable={!salvando}
                                    onChangeText={(texto) => {
                                        setNome(texto);

                                        setErros((atual) => ({
                                            ...atual,
                                            nome: undefined
                                        }));
                                    }}
                                />
                            </View>

                            {erros.nome && (
                                <Text style={despesas.erroTexto}>
                                    {erros.nome}
                                </Text>
                            )}
                        </View>

                        {/* VALOR DA DESPESA */}
                        <View style={despesas.conteinerInput}>
                            <Text style={despesas.label}>
                                Valor da Despesa
                            </Text>

                            <View
                                style={[
                                    despesas.envolucroInput,
                                    Boolean(erros.valor) &&
                                    despesas.inputErro
                                ]}
                            >
                                <Text style={despesas.prefixoCifrao}>
                                    R$
                                </Text>

                                <TextInput
                                    style={despesas.inputComIcone}
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
                                    onChangeText={handleValorChange}
                                    editable={!salvando}
                                    maxLength={13}
                                />
                            </View>

                            {erros.valor && (
                                <Text style={despesas.erroTexto}>
                                    {erros.valor}
                                </Text>
                            )}
                        </View>

                        {/* DATA DA DESPESA */}
                        <View style={despesas.conteinerInput}>
                            <Text style={despesas.label}>
                                Data da Despesa
                            </Text>

                            <TouchableOpacity
                                style={[
                                    despesas.inputData,
                                    Boolean(erros.data) &&
                                    despesas.inputErro
                                ]}
                                onPress={() => {
                                    setMostrarCalendario(true);
                                }}
                                disabled={salvando}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={{
                                        color: cores.textoCinzaClaro,
                                        fontSize: 16
                                    }}
                                >
                                    {dataObj.toLocaleDateString("pt-BR")}
                                </Text>

                                <Ionicons
                                    name="calendar-outline"
                                    size={20}
                                    color={cores.textoCinzaMedio}
                                />
                            </TouchableOpacity>

                            {erros.data && (
                                <Text style={despesas.erroTexto}>
                                    {erros.data}
                                </Text>
                            )}

                            {mostrarCalendario && (
                                <DateTimePicker
                                    value={dataObj}
                                    mode="date"
                                    display="default"
                                    maximumDate={new Date()}
                                    onChange={onChangeData}
                                />
                            )}
                        </View>

                        {/* CATEGORIAS DA API */}
                        <View>
                            <Text style={despesas.label}>
                                Categoria
                            </Text>

                            {carregandoCategorias && (
                                <ActivityIndicator
                                    color={cores.destaque}
                                />
                            )}

                            {!carregandoCategorias &&
                                erroCategorias !== "" && (
                                    <View>
                                        <Text style={despesas.erroTexto}>
                                            {erroCategorias}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => {
                                                void carregarCategorias();
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: cores.destaque,
                                                    marginTop: 8
                                                }}
                                            >
                                                Tentar novamente
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={
                                    despesas.gridCategorias
                                }
                            >
                                {categorias.map((item) => {
                                    const selecionado =
                                        categoriaSelecionada ===
                                        item.id_categoria;

                                    const icone =
                                        ICONES_CATEGORIAS[item.nome] ||
                                        "grid-outline";

                                    return (
                                        <TouchableOpacity
                                            key={item.id_categoria}
                                            activeOpacity={0.7}
                                            disabled={salvando}
                                            style={[
                                                despesas.cardCategoria,
                                                selecionado &&
                                                despesas.cardCategoriaSelecionado
                                            ]}
                                            onPress={() => {
                                                setCategoriaSelecionada(
                                                    item.id_categoria
                                                );

                                                setErros((atual) => ({
                                                    ...atual,
                                                    categoria: undefined
                                                }));
                                            }}
                                        >
                                            <Ionicons
                                                name={icone}
                                                size={18}
                                                color={
                                                    selecionado
                                                        ? cores.textoBotao
                                                        : cores.textoCinzaClaro
                                                }
                                            />

                                            <Text
                                                style={[
                                                    despesas.textoCategoria,
                                                    selecionado &&
                                                    despesas.textoCategoriaSelecionado
                                                ]}
                                            >
                                                {item.nome}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {erros.categoria && (
                                <Text style={despesas.erroTexto}>
                                    {erros.categoria}
                                </Text>
                            )}
                        </View>

                        {/* CADASTRAR DESPESA */}
                        <TouchableOpacity
                            style={[
                                despesas.botao,
                                salvando && { opacity: 0.7 }
                            ]}
                            activeOpacity={0.8}
                            onPress={() => {
                                void validarEGravar();
                            }}
                            disabled={
                                salvando ||
                                carregandoCategorias ||
                                categorias.length === 0
                            }
                        >
                            {salvando ? (
                                <ActivityIndicator
                                    color={cores.textoBotao}
                                />
                            ) : (
                                <Text style={despesas.textoBotao}>
                                    CONFIRMAR DESPESA
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}