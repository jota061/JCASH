import { Feather, Ionicons } from "@expo/vector-icons";

import DateTimePicker, {
    DateTimePickerEvent
} from "@react-native-community/datetimepicker";

import { Stack, useRouter } from "expo-router";

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

import { cores } from "../estilos/cores";
import { entradas } from "../estilos/entradas";

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

interface ErrosEntradas {
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
    "Salário": "briefcase-outline",
    "Freelance": "flash-outline",
    "Rendimento": "trending-up-outline",
    "Presente": "gift-outline",
    "Outros": "grid-outline"
};

export default function RegistrarEntrada() {
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [valor, setValor] = useState("");

    const [dataObj, setDataObj] = useState(new Date());
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const [erros, setErros] = useState<ErrosEntradas>({});

    // Categorias consultadas diretamente no MariaDB
    const [categorias, setCategorias] =
        useState<CategoriaMovimentacao[]>([]);

    const [categoriaSelecionada, setCategoriaSelecionada] =
        useState<number | null>(null);

    const [carregandoCategorias, setCarregandoCategorias] =
        useState(true);

    const [erroCategorias, setErroCategorias] = useState("");

    // Impedir cadastros simultaneos
    const [salvando, setSalvando] = useState(false);
    const envioEmAndamento = useRef(false);

    // Carregar as categorias de entrada
    const carregarCategorias = useCallback(async () => {
        setCarregandoCategorias(true);
        setErroCategorias("");

        try {
            const lista = await listarCategorias("ENTRADA");

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
                    "Nenhuma categoria de entrada foi encontrada."
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

    // Atualizar a data escolhida
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

    // Converter o valor digitado em reais e centavos
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

    // Validar e cadastrar a entrada na API
    const validarEGravar = async () => {
        if (envioEmAndamento.current) {
            return;
        }

        const errosAtuais: ErrosEntradas = {};
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

        // A verificacao acima garante a selecao
        if (categoriaSelecionada === null) {
            return;
        }

        envioEmAndamento.current = true;
        setSalvando(true);

        try {
            await cadastrarMovimentacao("ENTRADA", {
                nome: nomeLimpo,
                valor: valorNumerico,
                data: formatarDataISO(dataObj),
                id_categoria: categoriaSelecionada
            });

            // Limpar os campos somente depois do sucesso
            setNome("");
            setValor("");
            setDataObj(new Date());
            setErros({});

            Alert.alert(
                "Entrada registrada!",
                `A entrada de ${formatarMoedaBR(valorNumerico)} foi cadastrada no JCASH.`,
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
                "Erro ao cadastrar entrada",
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível registrar a entrada."
            );

        } finally {
            envioEmAndamento.current = false;
            setSalvando(false);
        }
    };

    return (
        <SafeAreaView style={entradas.containerTela}>
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
                <View style={entradas.conteudoCentral}>
                    <View style={entradas.cabecalho}>
                        <Text style={entradas.titulo}>
                            Nova{" "}
                            <Text style={entradas.tituloDestaque}>
                                Entrada
                            </Text>
                        </Text>
                    </View>

                    <View style={entradas.formulario}>
                        {/* NOME DA ENTRADA */}
                        <View style={entradas.conteinerInput}>
                            <Text style={entradas.label}>
                                Nome da Entrada
                            </Text>

                            <View
                                style={[
                                    entradas.envolucroInput,
                                    Boolean(erros.nome) &&
                                    entradas.inputErro
                                ]}
                            >
                                <Feather
                                    name="edit-2"
                                    size={20}
                                    color={cores.textoCinzaClaro}
                                    style={entradas.iconeInput}
                                />

                                <TextInput
                                    style={entradas.inputComIcone}
                                    placeholder="Ex: Pagamento Cliente X"
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
                                <Text style={entradas.erroTexto}>
                                    {erros.nome}
                                </Text>
                            )}
                        </View>

                        {/* VALOR DA ENTRADA */}
                        <View style={entradas.conteinerInput}>
                            <Text style={entradas.label}>
                                Valor da Entrada
                            </Text>

                            <View
                                style={[
                                    entradas.envolucroInput,
                                    Boolean(erros.valor) &&
                                    entradas.inputErro
                                ]}
                            >
                                <Text style={entradas.prefixoCifrao}>
                                    R$
                                </Text>

                                <TextInput
                                    style={entradas.inputComIcone}
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
                                <Text style={entradas.erroTexto}>
                                    {erros.valor}
                                </Text>
                            )}
                        </View>

                        {/* DATA DA ENTRADA */}
                        <View style={entradas.conteinerInput}>
                            <Text style={entradas.label}>
                                Data da Entrada
                            </Text>

                            <TouchableOpacity
                                style={[
                                    entradas.inputData,
                                    Boolean(erros.data) &&
                                    entradas.inputErro
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
                                <Text style={entradas.erroTexto}>
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
                            <Text style={entradas.label}>
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
                                        <Text style={entradas.erroTexto}>
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
                                    entradas.gridCategorias
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
                                                entradas.cardCategoria,
                                                selecionado &&
                                                entradas.cardCategoriaSelecionado
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
                                                    entradas.textoCategoria,
                                                    selecionado &&
                                                    entradas.textoCategoriaSelecionado
                                                ]}
                                            >
                                                {item.nome}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {erros.categoria && (
                                <Text style={entradas.erroTexto}>
                                    {erros.categoria}
                                </Text>
                            )}
                        </View>

                        {/* CADASTRAR ENTRADA */}
                        <TouchableOpacity
                            style={[
                                entradas.botao,
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
                                <Text style={entradas.textoBotao}>
                                    CONFIRMAR ENTRADA
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}