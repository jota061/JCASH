import React, { useCallback, useRef, useState } from "react";
import { Stack, useFocusEffect } from "expo-router";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent
} from "@react-native-community/datetimepicker";

import { cores } from "../estilos/cores";
import { metas } from "../estilos/metas";
import {
    adicionarDias,
    dataEhAnteriorAHoje,
    formatarDataBR,
    formatarDataISO,
    inicioDoDia
} from "../utils/datas";
import { formatarMoedaBR } from "../utils/moeda";
import {
    arquivarMeta,
    cadastrarMeta,
    listarCategoriasMetas,
    listarMetas,
    registrarAporteMeta
} from "../servicos/servicoMetas";
import type {
    CategoriaMeta,
    MetaFinanceira
} from "../servicos/servicoMetas";

interface ErrosMetas {
    nome?: string;
    valor?: string;
    data?: string;
    categoria?: string;
}

const ICONES_CATEGORIAS: Record<
    string,
    keyof typeof Ionicons.glyphMap
> = {
    Viagem: "airplane-outline",
    Investimento: "trending-up-outline",
    Investimentos: "trending-up-outline",
    "Eletrônicos": "laptop-outline",
    "Veículos": "car-outline",
    Casa: "home-outline",
    Outros: "grid-outline"
};

// O estado monetario guarda valores decimais, e o input mostra virgula.
function interpretarValorDigitado(texto: string): string {
    const digitos = texto.replace(/\D/g, "").slice(0, 12);
    return digitos ? (Number(digitos) / 100).toFixed(2) : "";
}

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

export default function Metas() {
    const [lista, setLista] = useState<MetaFinanceira[]>([]);
    const [categorias, setCategorias] = useState<CategoriaMeta[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [erroConsulta, setErroConsulta] = useState("");
    const consultaAtual = useRef(0);
    const operacaoEmAndamento = useRef(false);

    const [nome, setNome] = useState("");
    const [valorAlvo, setValorAlvo] = useState("");
    const [categoriaId, setCategoriaId] = useState<number | null>(null);
    const [dataLimite, setDataLimite] = useState(
        () => adicionarDias(new Date(), 1)
    );
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [erros, setErros] = useState<ErrosMetas>({});

    const [metaAporte, setMetaAporte] = useState<MetaFinanceira | null>(null);
    const [valorAporte, setValorAporte] = useState("");
    const [erroAporte, setErroAporte] = useState(false);

    // Atualizar metas sempre que a tela receber foco.
    const atualizarTela = useCallback(async () => {
        const consulta = ++consultaAtual.current;
        setCarregando(true);
        setErroConsulta("");

        try {
            const [novasCategorias, novasMetas] = await Promise.all([
                listarCategoriasMetas(),
                listarMetas()
            ]);

            if (consulta !== consultaAtual.current) return;

            setCategorias(novasCategorias);
            setLista(novasMetas);
            setCategoriaId((atual) =>
                novasCategorias.some((item) => item.id_categoria === atual)
                    ? atual
                    : novasCategorias[0]?.id_categoria ?? null
            );
        } catch (erro) {
            if (consulta === consultaAtual.current) {
                // Evitar mostrar dados antigos ao trocar de usuario.
                setLista([]);
                setCategorias([]);
                setCategoriaId(null);
                setErroConsulta(
                    erro instanceof Error
                        ? erro.message
                        : "Não foi possível consultar suas metas."
                );
            }
        } finally {
            if (consulta === consultaAtual.current) {
                setCarregando(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void atualizarTela();
            return () => {
                consultaAtual.current += 1;
            };
        }, [atualizarTela])
    );

    const onChangeData = (
        evento: DateTimePickerEvent,
        selecionada?: Date
    ) => {
        setMostrarCalendario(false);
        if (evento.type === "set" && selecionada) {
            setDataLimite(selecionada);
            setErros((atual) => ({ ...atual, data: undefined }));
        }
    };

    const limparFormulario = () => {
        setNome("");
        setValorAlvo("");
        setDataLimite(adicionarDias(new Date(), 1));
        setErros({});
    };

    // Bloquear toques duplicados em operacoes que gravam no MariaDB.
    const executarAcao = async (
        acao: () => Promise<void>,
        mensagem: string
    ) => {
        if (operacaoEmAndamento.current) return;

        operacaoEmAndamento.current = true;
        setProcessando(true);

        try {
            await acao();
            await atualizarTela();
            Alert.alert("Sucesso!", mensagem);
        } catch (erro) {
            // Uma resposta perdida nao significa que a gravacao falhou.
            await atualizarTela();
            Alert.alert(
                "Não foi possível concluir",
                erro instanceof Error
                    ? erro.message
                    : "Consulte suas metas antes de tentar novamente."
            );
        } finally {
            operacaoEmAndamento.current = false;
            setProcessando(false);
        }
    };

    const validarEGravar = () => {
        if (carregando || processando || erroConsulta) return;

        const novosErros: ErrosMetas = {};

        if (!nome.trim() || nome.trim().length > 100) {
            novosErros.nome = "Informe um nome com até 100 caracteres.";
        }
        if (!valorEhValido(valorAlvo)) {
            novosErros.valor = "Informe um valor positivo válido.";
        }
        if (dataEhAnteriorAHoje(dataLimite)) {
            novosErros.data = "O prazo não pode estar no passado.";
        }
        if (categoriaId === null) {
            novosErros.categoria = "Selecione uma categoria.";
        }

        setErros(novosErros);
        if (Object.keys(novosErros).length > 0 || categoriaId === null) {
            return;
        }

        void executarAcao(async () => {
            await cadastrarMeta({
                nome: nome.trim(),
                valor_meta: Number(valorAlvo),
                data_limite: formatarDataISO(dataLimite),
                id_categoria: categoriaId
            });
            limparFormulario();
        }, "Meta cadastrada.");
    };

    const abrirModalAporte = (meta: MetaFinanceira) => {
        if (processando) return;
        setMetaAporte(meta);
        setValorAporte("");
        setErroAporte(false);
    };

    const confirmarAporte = () => {
        if (!metaAporte || processando) return;

        if (!valorEhValido(valorAporte)) {
            setErroAporte(true);
            Alert.alert("Valor inválido", "Informe um aporte maior que zero.");
            return;
        }

        const idMeta = metaAporte.id_meta;
        const valor = Number(valorAporte);

        void executarAcao(async () => {
            // Aportes acima do objetivo sao permitidos pela regra do JCASH.
            await registrarAporteMeta(idMeta, valor);
            setMetaAporte(null);
            setValorAporte("");
        }, "Aporte registrado.");
    };

    const confirmarArquivamento = (meta: MetaFinanceira) => {
        if (processando) return;

        Alert.alert(
            "Arquivar meta",
            `Deseja arquivar a meta "${meta.nome}"? Os aportes permanecerão guardados no banco.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Arquivar",
                    style: "destructive",
                    onPress: () => {
                        void executarAcao(async () => {
                            await arquivarMeta(meta.id_meta);
                        }, "Meta arquivada com sucesso.");
                    }
                }
            ]
        );
    };

    const nomeCategoria = (idCategoria: number) =>
        categorias.find((item) => item.id_categoria === idCategoria)
            ?.nome ?? "Categoria";

    return (
        <ScrollView
            style={metas.containerTela}
            contentContainerStyle={metas.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <Stack.Screen options={{ headerShown: false }} />

            <View style={metas.conteudoCentral}>
                <View style={metas.topo}>
                    <Text style={metas.titulo}>
                        Metas <Text style={metas.logo}>Financeiras</Text>
                    </Text>
                </View>

                {carregando && (
                    <ActivityIndicator size="large" color={cores.destaque} />
                )}

                {erroConsulta !== "" && (
                    <View style={metas.formulario}>
                        <Text style={metas.erroTexto}>{erroConsulta}</Text>
                        <TouchableOpacity onPress={() => void atualizarTela()}>
                            <Text style={{ color: cores.destaque }}>
                                Tentar novamente
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={metas.formulario}>
                    <Text style={metas.tituloFormulario}>
                        Cadastrar Nova Meta
                    </Text>

                    {/* NOME */}
                    <View style={metas.conteinerInput}>
                        <Text style={metas.label}>Nome da Meta</Text>
                        <View style={[
                            metas.envolucroInput,
                            Boolean(erros.nome) && metas.inputErro
                        ]}>
                            <Feather
                                name="edit-2"
                                size={20}
                                color={cores.textoCinzaClaro}
                                style={metas.iconeInput}
                            />
                            <TextInput
                                style={metas.inputComIcone}
                                placeholder="Ex: Viagem para a Praia"
                                placeholderTextColor={cores.textoPlaceholder}
                                value={nome}
                                maxLength={100}
                                editable={!processando}
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
                            <Text style={metas.erroTexto}>{erros.nome}</Text>
                        )}
                    </View>

                    {/* VALOR OBJETIVO */}
                    <View style={metas.conteinerInput}>
                        <Text style={metas.label}>Valor da Meta</Text>
                        <View style={[
                            metas.envolucroInput,
                            Boolean(erros.valor) && metas.inputErro
                        ]}>
                            <Text style={metas.prefixoCifrao}>R$</Text>
                            <TextInput
                                style={metas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={cores.textoPlaceholder}
                                keyboardType="numeric"
                                value={valorAlvo.replace(".", ",")}
                                editable={!processando}
                                maxLength={13}
                                onChangeText={(texto) => {
                                    setValorAlvo(interpretarValorDigitado(texto));
                                    setErros((atual) => ({
                                        ...atual,
                                        valor: undefined
                                    }));
                                }}
                            />
                        </View>
                        {erros.valor && (
                            <Text style={metas.erroTexto}>{erros.valor}</Text>
                        )}
                    </View>

                    {/* PRAZO */}
                    <View style={metas.conteinerInput}>
                        <Text style={metas.label}>Até quando é essa meta?</Text>
                        <TouchableOpacity
                            style={[
                                metas.inputData,
                                Boolean(erros.data) && metas.inputErro
                            ]}
                            onPress={() => setMostrarCalendario(true)}
                            disabled={processando}
                        >
                            <Text style={{
                                color: cores.textoCinzaClaro,
                                fontSize: 16
                            }}>
                                {dataLimite.toLocaleDateString("pt-BR")}
                            </Text>
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={cores.textoCinzaMedio}
                            />
                        </TouchableOpacity>
                        {erros.data && (
                            <Text style={metas.erroTexto}>{erros.data}</Text>
                        )}
                    </View>

                    {mostrarCalendario && (
                        <DateTimePicker
                            value={dataLimite}
                            mode="date"
                            display="default"
                            minimumDate={inicioDoDia()}
                            onChange={onChangeData}
                        />
                    )}

                    {/* CATEGORIAS REAIS */}
                    <View>
                        <Text style={metas.label}>Categoria</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={metas.gridCategorias}
                        >
                            {categorias.map((item) => {
                                const selecionada =
                                    categoriaId === item.id_categoria;
                                const icone =
                                    ICONES_CATEGORIAS[item.nome] || "grid-outline";

                                return (
                                    <TouchableOpacity
                                        key={item.id_categoria}
                                        activeOpacity={0.7}
                                        disabled={processando}
                                        style={[
                                            metas.cardCategoria,
                                            selecionada && metas.cardCategoriaSelecionado
                                        ]}
                                        onPress={() => {
                                            setCategoriaId(item.id_categoria);
                                            setErros((atual) => ({
                                                ...atual,
                                                categoria: undefined
                                            }));
                                        }}
                                    >
                                        <Ionicons
                                            name={icone}
                                            size={18}
                                            color={selecionada
                                                ? cores.textoBotao
                                                : cores.textoCinzaClaro}
                                        />
                                        <Text style={[
                                            metas.textoCategoria,
                                            selecionada &&
                                            metas.textoCategoriaSelecionado
                                        ]}>
                                            {item.nome}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        {erros.categoria && (
                            <Text style={metas.erroTexto}>{erros.categoria}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            metas.botao,
                            processando && { opacity: 0.7 }
                        ]}
                        disabled={
                            processando ||
                            carregando ||
                            erroConsulta !== "" ||
                            categorias.length === 0
                        }
                        onPress={validarEGravar}
                    >
                        {processando ? (
                            <ActivityIndicator color={cores.textoBotao} />
                        ) : (
                            <Text style={metas.textoBotao}>
                                CADASTRAR META
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* METAS CADASTRADAS */}
                <View style={metas.secaoLista}>
                    <Text style={metas.tituloSecao}>
                        Suas Metas Atuais ({lista.length})
                    </Text>

                    {!carregando && !erroConsulta && lista.length === 0 && (
                        <Text style={{
                            color: cores.textoCinzaClaro,
                            marginBottom: 16
                        }}>
                            Nenhuma meta cadastrada.
                        </Text>
                    )}

                    {lista.map((meta) => {
                        const concluida = meta.percentual >= 100;
                        const percentualBarra = Math.max(
                            0,
                            Math.min(100, meta.percentual_visual)
                        );

                        return (
                            <View key={meta.id_meta} style={metas.cardMetaItem}>
                                <View style={metas.topoCardMeta}>
                                    <View style={metas.infoMetaItem}>
                                        <Ionicons
                                            name="flag-outline"
                                            size={22}
                                            color={concluida
                                                ? cores.destaque
                                                : cores.textoCinzaClaro}
                                        />
                                        <View style={metas.textosMeta}>
                                            <Text
                                                style={metas.nomeMetaItem}
                                                numberOfLines={2}
                                            >
                                                {meta.nome}
                                            </Text>
                                            <Text style={metas.detalheMetaItem}>
                                                Prazo: {formatarDataBR(meta.data_limite)}
                                                {" • "}{nomeCategoria(meta.id_categoria)}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={metas.btnAcao}
                                        disabled={processando}
                                        onPress={() => confirmarArquivamento(meta)}
                                        accessibilityLabel="Arquivar meta"
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color={cores.erro}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={metas.resumoValores}>
                                    <Text style={metas.valorAtual}>
                                        Atual: {formatarMoedaBR(meta.total_aportado)}
                                    </Text>
                                    <Text style={metas.valorMetaItem}>
                                        Meta: {formatarMoedaBR(meta.valor_meta)}
                                    </Text>
                                </View>

                                <View style={metas.barraProgressoFundo}>
                                    <View style={[
                                        metas.barraProgresso,
                                        { width: `${percentualBarra}%` }
                                    ]} />
                                </View>

                                <View style={metas.rodapeMeta}>
                                    <Text style={metas.textoProgresso}>
                                        {meta.percentual.toFixed(0)}%
                                    </Text>
                                    <TouchableOpacity
                                        style={metas.botaoAdicionarValor}
                                        disabled={processando}
                                        onPress={() => abrirModalAporte(meta)}
                                    >
                                        <Ionicons
                                            name="add-circle-outline"
                                            size={18}
                                            color={cores.destaque}
                                        />
                                        <Text style={metas.textoAdicionarValor}>
                                            Adicionar valor
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* MODAL DE APORTE */}
            <Modal
                visible={metaAporte !== null}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    if (!processando) setMetaAporte(null);
                }}
            >
                <View style={metas.fundoModal}>
                    <View style={metas.containerModal}>
                        <Text style={metas.tituloModal}>Adicionar valor</Text>
                        <Text style={metas.subtituloModal}>
                            {metaAporte?.nome}
                        </Text>
                        <Text style={metas.label}>Valor a adicionar</Text>
                        <View style={[
                            metas.envolucroInput,
                            erroAporte && metas.inputErro
                        ]}>
                            <Text style={metas.prefixoCifrao}>R$</Text>
                            <TextInput
                                style={metas.inputComIcone}
                                placeholder="0,00"
                                placeholderTextColor={cores.textoPlaceholder}
                                keyboardType="numeric"
                                editable={!processando}
                                value={valorAporte.replace(".", ",")}
                                maxLength={13}
                                onChangeText={(texto) => {
                                    setValorAporte(interpretarValorDigitado(texto));
                                    setErroAporte(false);
                                }}
                            />
                        </View>
                        {erroAporte && (
                            <Text style={metas.erroTexto}>
                                Informe um valor positivo válido.
                            </Text>
                        )}
                        <View style={metas.acoesModal}>
                            <TouchableOpacity
                                style={metas.botaoCancelarModal}
                                disabled={processando}
                                onPress={() => setMetaAporte(null)}
                            >
                                <Text style={metas.textoCancelarModal}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={metas.botaoConfirmarModal}
                                disabled={processando}
                                onPress={confirmarAporte}
                            >
                                {processando ? (
                                    <ActivityIndicator color={cores.textoBotao} />
                                ) : (
                                    <Text style={metas.textoConfirmarModal}>
                                        Adicionar
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
