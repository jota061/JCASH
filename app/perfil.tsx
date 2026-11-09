import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter, useFocusEffect } from "expo-router";

import React, { useCallback, useRef, useState } from "react";

import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { cores } from "../estilos/cores";
import { perfil } from "../estilos/perfil";

import {
    useAutenticacao
} from "../contextos/ContextoAutenticacao";

import {
    consultarPerfil,
    salvarNomeSocial,
    excluirContaPerfil
} from "../servicos/servicoPerfil";

import type {
    UsuarioPerfil
} from "../servicos/servicoPerfil";

export default function PerfilUsuarioScreen() {
    const router = useRouter();
    const { sair } = useAutenticacao();

    // Dados reais recebidos da API
    const [usuario, setUsuario] =
        useState<UsuarioPerfil | null>(null);

    const [carregando, setCarregando] = useState(true);

    // Edicao do nome social
    const [modalNomeSocial, setModalNomeSocial] = useState(false);
    const [novoNomeSocial, setNovoNomeSocial] = useState("");
    const [erroNomeSocial, setErroNomeSocial] = useState(false);
    const [salvando, setSalvando] = useState(false);

    // Controle do logout
    const [saindo, setSaindo] = useState(false);

    // Confirmacao da exclusao definitiva
    const [modalExcluirConta, setModalExcluirConta] = useState(false);
    const [senhaExclusao, setSenhaExclusao] = useState("");
    const [mostrarSenhaExclusao, setMostrarSenhaExclusao] = useState(false);
    const [erroSenhaExclusao, setErroSenhaExclusao] = useState(false);
    const [excluindo, setExcluindo] = useState(false);
    const exclusaoEmAndamento = useRef(false);

    // Atualizar os dados sempre que a tela receber foco
    useFocusEffect(
        useCallback(() => {
            let ativo = true;

            async function carregarPerfil() {
                setCarregando(true);

                try {
                    const dados = await consultarPerfil();

                    if (ativo) {
                        setUsuario(dados);
                    }

                } catch (erro) {
                    if (ativo) {
                        const mensagem =
                            erro instanceof Error
                                ? erro.message
                                : "Não foi possível carregar o perfil.";

                        Alert.alert("Erro ao carregar perfil", mensagem);
                    }

                } finally {
                    if (ativo) {
                        setCarregando(false);
                    }
                }
            }

            carregarPerfil();

            return () => {
                ativo = false;
            };
        }, [])
    );

    // Abrir o formulario do nome social
    const abrirEdicaoNomeSocial = () => {
        if (!usuario) {
            return;
        }

        setNovoNomeSocial(usuario.nome_social);
        setErroNomeSocial(false);
        setModalNomeSocial(true);
    };

    // Atualizar o nome social no MariaDB
    const handleSalvarNomeSocial = async () => {
        if (salvando) {
            return;
        }

        const nomeLimpo = novoNomeSocial.trim();

        if (!nomeLimpo || Array.from(nomeLimpo).length > 100) {
            setErroNomeSocial(true);

            Alert.alert(
                "Nome social inválido",
                "Informe um nome social com até 100 caracteres."
            );

            return;
        }

        setSalvando(true);

        try {
            const usuarioAtualizado =
                await salvarNomeSocial(nomeLimpo);

            setUsuario(usuarioAtualizado);
            setModalNomeSocial(false);

            Alert.alert(
                "Sucesso",
                "Nome social atualizado com sucesso."
            );

        } catch (erro) {
            const mensagem =
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível atualizar o nome social.";

            Alert.alert("Erro", mensagem);

        } finally {
            setSalvando(false);
        }
    };

    // Pedir confirmacao antes de sair da conta
    const handleSairConta = () => {
        if (saindo || excluindo) {
            return;
        }

        Alert.alert(
            "Sair da conta",
            "Deseja encerrar sua sessão no JCASH?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Sair",
                    onPress: async () => {
                        setSaindo(true);

                        try {
                            await sair();

                            // As rotas protegidas voltam ao login
                            // quando a sessao e encerrada.

                        } catch (erro) {
                            console.error(
                                "Erro ao encerrar sessao:",
                                erro
                            );

                            setSaindo(false);

                            Alert.alert(
                                "Erro",
                                "Não foi possível sair da conta."
                            );
                        }
                    }
                }
            ]
        );
    };

    // Fechar o formulario de exclusao sem guardar a senha
    const fecharModalExclusao = () => {
        if (exclusaoEmAndamento.current) {
            return;
        }

        setSenhaExclusao("");
        setMostrarSenhaExclusao(false);
        setErroSenhaExclusao(false);
        setModalExcluirConta(false);
    };

    // Informar as consequencias antes de pedir a senha
    const handleExcluirConta = () => {
        if (saindo || excluindo || carregando || !usuario) {
            return;
        }

        Alert.alert(
            "Excluir conta definitivamente?",
            "Seu cadastro e todos os dados financeiros serão " +
            "apagados permanentemente. Essa ação não pode " +
            "ser desfeita. Deseja continuar?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Continuar",
                    style: "destructive",
                    onPress: () => {
                        setSenhaExclusao("");
                        setMostrarSenhaExclusao(false);
                        setErroSenhaExclusao(false);
                        setModalExcluirConta(true);
                    }
                }
            ]
        );
    };

    // Confirmar a senha e solicitar a exclusao a API
    const handleConfirmarExclusao = async () => {
        if (exclusaoEmAndamento.current || saindo) {
            return;
        }

        if (senhaExclusao.length === 0) {
            setErroSenhaExclusao(true);
            Alert.alert(
                "Senha obrigatória",
                "Informe sua senha atual para confirmar a exclusão."
            );
            return;
        }

        // Bloquear toques repetidos ate finalizar a operacao
        exclusaoEmAndamento.current = true;
        setExcluindo(true);

        try {
            // Somente a API pode confirmar a exclusao definitiva
            await excluirContaPerfil(senhaExclusao);

        } catch (erro) {
            const mensagem =
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível confirmar a exclusão.";

            // Falhas de rede podem ter resultado incerto
            Alert.alert("Exclusão não confirmada", mensagem);
            exclusaoEmAndamento.current = false;
            setExcluindo(false);
            return;
        }

        // A exclusao foi confirmada: limpar o campo e encerrar a sessao
        setSenhaExclusao("");
        setModalExcluirConta(false);

        try {
            // O contexto remove o JWT e as rotas protegidas voltam ao Login
            await sair();

            Alert.alert(
                "Conta excluída",
                "Seu cadastro e seus dados financeiros foram " +
                "excluídos definitivamente."
            );

        } catch (erro) {
            console.error(
                "[JCASH] Falha ao encerrar a sessão após a exclusão:",
                erro
            );

            // A exclusao ja foi concluida: nao pedir para repetir
            Alert.alert(
                "Conta excluída",
                "A exclusão foi confirmada, mas não foi possível " +
                "encerrar a sessão automaticamente. Reinicie " +
                "o aplicativo antes de tentar acessar novamente."
            );

        } finally {
            exclusaoEmAndamento.current = false;
            setExcluindo(false);
        }
    };

    return (
        <SafeAreaView style={perfil.containerTela}>
            <Stack.Screen
                options={{ headerShown: false }}
            />

            <ScrollView
                contentContainerStyle={perfil.conteudoRolavel}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* FOTO DE PERFIL */}
                <View style={perfil.containerFoto}>
                    <View style={perfil.wrapperIcone}>
                        <Ionicons
                            name="person-circle-outline"
                            size={120}
                            color={cores.destaque}
                        />

                        <View style={perfil.badgeCamera}>
                            <Ionicons
                                name="camera"
                                size={16}
                                color={cores.textoBotao}
                            />
                        </View>
                    </View>
                </View>

                {/* DADOS REAIS DO USUARIO */}
                <View style={perfil.formulario}>
                    <Text style={perfil.tituloSecao}>
                        Dados Pessoais
                    </Text>

                    {carregando && (
                        <ActivityIndicator
                            size="large"
                            color={cores.destaque}
                        />
                    )}

                    {!carregando && !usuario && (
                        <Text style={perfil.valorInfo}>
                            Não foi possível carregar seus dados.
                        </Text>
                    )}

                    {/* NOME COMPLETO */}
                    <View style={perfil.cardInfo}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color={cores.textoCinzaMedio}
                        />

                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>
                                Nome Completo
                            </Text>

                            <Text style={perfil.valorInfo}>
                                {usuario?.nome ?? "—"}
                            </Text>
                        </View>
                    </View>

                    {/* NOME SOCIAL */}
                    <View style={perfil.cardInfo}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color={cores.textoCinzaMedio}
                        />

                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>
                                Nome Social
                            </Text>

                            <Text style={perfil.valorInfo}>
                                {usuario?.nome_social ?? "—"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={abrirEdicaoNomeSocial}
                            style={perfil.btnAcao}
                            disabled={!usuario || carregando}
                        >
                            <Ionicons
                                name="pencil-outline"
                                size={18}
                                color={cores.textoCinzaClaro}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* E-MAIL */}
                    <View style={perfil.cardInfo}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color={cores.textoCinzaMedio}
                        />

                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>
                                E-mail
                            </Text>

                            <Text style={perfil.valorInfo}>
                                {usuario?.email ?? "—"}
                            </Text>
                        </View>
                    </View>

                    {/* SENHA */}
                    <View style={perfil.cardInfo}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color={cores.textoCinzaMedio}
                        />

                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>
                                Senha
                            </Text>

                            <Text style={perfil.valorInfo}>
                                ••••••••
                            </Text>

                            <Text style={perfil.observacaoSenha}>
                                A senha não pode ser visualizada.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ALTERAR SENHA */}
                <TouchableOpacity
                    style={perfil.botaoEditar}
                    activeOpacity={0.8}
                    onPress={() => router.push("/trocar_senha")}
                    disabled={saindo || excluindo}
                >
                    <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={cores.destaque}
                    />

                    <Text style={perfil.textoBotaoEditar}>
                        Alterar Senha
                    </Text>
                </TouchableOpacity>

                {/* SAIR DA CONTA */}
                <TouchableOpacity
                    style={[
                        perfil.botaoEditar,
                        (saindo || excluindo) && { opacity: 0.6 }
                    ]}
                    activeOpacity={0.8}
                    onPress={handleSairConta}
                    disabled={saindo || excluindo}
                    accessibilityRole="button"
                    accessibilityLabel="Sair da conta"
                >
                    {saindo ? (
                        <ActivityIndicator
                            size="small"
                            color={cores.destaque}
                        />
                    ) : (
                        <Ionicons
                            name="log-out-outline"
                            size={20}
                            color={cores.destaque}
                        />
                    )}

                    <Text style={perfil.textoBotaoEditar}>
                        {saindo ? "Saindo..." : "Sair da Conta"}
                    </Text>
                </TouchableOpacity>

                {/* EXCLUIR CONTA */}
                <TouchableOpacity
                    style={[
                        perfil.botaoExcluir,
                        (saindo || excluindo || carregando || !usuario) &&
                        { opacity: 0.6 }
                    ]}
                    activeOpacity={0.8}
                    onPress={handleExcluirConta}
                    disabled={saindo || excluindo || carregando || !usuario}
                >
                    <Ionicons
                        name="trash-outline"
                        size={20}
                        color={cores.erro}
                    />

                    <Text style={perfil.textoBotaoExcluir}>
                        Excluir Conta
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* MODAL DE EDICAO DO NOME SOCIAL */}
            <Modal
                visible={modalNomeSocial}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!salvando) {
                        setModalNomeSocial(false);
                    }
                }}
            >
                <View style={perfil.fundoModal}>
                    <View style={perfil.containerModal}>
                        <Text style={perfil.tituloModal}>
                            Editar Nome Social
                        </Text>

                        <Text style={perfil.subtituloModal}>
                            Esse nome será exibido na tela inicial.
                        </Text>

                        <TextInput
                            style={[
                                perfil.inputModal,
                                erroNomeSocial && perfil.inputModalErro
                            ]}
                            value={novoNomeSocial}
                            onChangeText={(texto) => {
                                setNovoNomeSocial(texto);

                                if (texto.trim()) {
                                    setErroNomeSocial(false);
                                }
                            }}
                            placeholder="Nome social"
                            placeholderTextColor={cores.textoPlaceholder}
                            autoCapitalize="words"
                            autoCorrect={false}
                            editable={!salvando}
                        />

                        {erroNomeSocial && (
                            <Text style={perfil.erroModal}>
                                Informe um nome social válido.
                            </Text>
                        )}

                        <View style={perfil.acoesModal}>
                            <TouchableOpacity
                                style={perfil.botaoCancelarModal}
                                onPress={() => {
                                    setModalNomeSocial(false);
                                }}
                                disabled={salvando}
                            >
                                <Text style={perfil.textoCancelarModal}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={perfil.botaoSalvarModal}
                                onPress={handleSalvarNomeSocial}
                                disabled={salvando}
                            >
                                {salvando ? (<ActivityIndicator color={cores.textoBotao} />) : (<Text style={perfil.textoSalvarModal}>Salvar</Text>)}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL DE CONFIRMACAO DA EXCLUSAO DEFINITIVA */}
            <Modal
                visible={modalExcluirConta}
                transparent
                animationType="fade"
                onRequestClose={fecharModalExclusao}
            >
                <View style={perfil.fundoModal}>
                    <View style={perfil.containerModal}>
                        <Text style={perfil.tituloModal}>
                            Excluir Conta
                        </Text>

                        <Text
                            style={[
                                perfil.subtituloModal,
                                { color: cores.erro }
                            ]}
                        >
                            Essa ação é permanente. Seu cadastro, suas
                            entradas, despesas, contas, metas e reserva
                            de emergência serão excluídos.
                        </Text>

                        {/* Senha com opcao de mostrar ou ocultar */}
                        <View style={{ position: "relative", justifyContent: "center" }}>
                            <TextInput
                                style={[
                                    perfil.inputModal,
                                    erroSenhaExclusao && perfil.inputModalErro,
                                    { paddingRight: 52 }
                                ]}
                                placeholder="Confirme sua senha atual"
                                placeholderTextColor={cores.textoPlaceholder}
                                value={senhaExclusao}
                                onChangeText={(texto) => {
                                    setSenhaExclusao(texto);
                                    if (texto.length > 0) {
                                        setErroSenhaExclusao(false);
                                    }
                                }}
                                secureTextEntry={!mostrarSenhaExclusao}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!excluindo}
                            />

                            <TouchableOpacity
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: 0,
                                    bottom: 0,
                                    justifyContent: "center",
                                    paddingHorizontal: 4
                                }}
                                onPress={() => setMostrarSenhaExclusao((atual) => !atual)}
                                disabled={excluindo}
                                accessibilityRole="button"
                                accessibilityLabel={
                                    mostrarSenhaExclusao ? "Ocultar senha" : "Mostrar senha"
                                }
                            >
                                <Ionicons
                                    name={
                                        mostrarSenhaExclusao
                                            ? "eye-outline"
                                            : "eye-off-outline"
                                    }
                                    size={22}
                                    color={cores.textoCinzaMedio}
                                />
                            </TouchableOpacity>
                        </View>

                        {erroSenhaExclusao && (
                            <Text style={perfil.erroModal}>
                                Informe sua senha atual.
                            </Text>
                        )}

                        <View style={perfil.acoesModal}>
                            <TouchableOpacity
                                style={perfil.botaoCancelarModal}
                                onPress={fecharModalExclusao}
                                disabled={excluindo}
                                accessibilityRole="button"
                            >
                                <Text style={perfil.textoCancelarModal}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    perfil.botaoSalvarModal,
                                    { backgroundColor: cores.erro },
                                    excluindo && { opacity: 0.6 }
                                ]}
                                onPress={handleConfirmarExclusao}
                                disabled={excluindo}
                                accessibilityRole="button"
                                accessibilityLabel="Excluir conta definitivamente"
                            >
                                {excluindo ? (
                                    <ActivityIndicator
                                        color={cores.textoBotao}
                                    />
                                ) : (
                                    <Text style={perfil.textoSalvarModal}>
                                        Excluir
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}