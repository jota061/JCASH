
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { formulario } from "../estilos/formulario";
import { cores } from "../estilos/cores";

import {
    alterarSenhaPerfil
} from "../servicos/servicoPerfil";

export default function TrocarSenha() {
    const router = useRouter();

    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
    const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

    // Impedir varias solicitacoes ao mesmo tempo
    const [salvando, setSalvando] = useState(false);

    const [erros, setErros] = useState({
        senhaAtual: false,
        novaSenha: false,
        confirmarSenha: false,
        senhaFraca: false,
        senhasDiferentes: false,
    });

    // Validar os dados e solicitar a alteracao real da senha
    const handleAlterarSenha = async () => {
        if (salvando) {
            return;
        }

        const atualVazia = senhaAtual.trim() === "";
        const novaVazia = novaSenha.trim() === "";
        const confirmacaoVazia = confirmarSenha.trim() === "";

        // Manter os requisitos da tela e do backend
        const tamanhoValido = Array.from(novaSenha).length >= 10;

        const requisitosSenha =
            /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._+=-]).+$/.test(novaSenha);

        const senhaForte = tamanhoValido && requisitosSenha;

        const senhasDiferentes =
            !confirmacaoVazia && novaSenha !== confirmarSenha;

        setErros({
            senhaAtual: atualVazia,
            novaSenha: novaVazia || !senhaForte,
            confirmarSenha: confirmacaoVazia || senhasDiferentes,
            senhaFraca: !senhaForte && !novaVazia,
            senhasDiferentes,
        });

        if (atualVazia || novaVazia || confirmacaoVazia) {
            Alert.alert(
                "Campos obrigatórios",
                "Preencha a senha atual, a nova senha e a confirmação."
            );
            return;
        }

        if (!senhaForte) {
            Alert.alert(
                "Senha fraca",
                "A nova senha precisa ter pelo menos 10 caracteres, uma letra maiúscula, um número e um caractere especial."
            );
            return;
        }

        if (senhasDiferentes) {
            Alert.alert(
                "Confirmação incorreta",
                "A nova senha e a confirmação precisam ser iguais."
            );
            return;
        }

        if (senhaAtual === novaSenha) {
            Alert.alert(
                "Senha inválida",
                "A nova senha deve ser diferente da senha atual."
            );
            return;
        }

        setSalvando(true);

        try {
            // Enviar as senhas para a API autenticada
            await alterarSenhaPerfil(senhaAtual, novaSenha);

            // Limpar os campos depois da confirmacao da API
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");

            // Informar sucesso somente apos a atualizacao
            Alert.alert(
                "Sucesso",
                "Senha alterada com sucesso!",
                [
                    {
                        text: "OK",
                        onPress: () => router.back()
                    }
                ]
            );

        } catch (erro) {
            const mensagem =
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível alterar a senha.";

            Alert.alert(
                "Erro ao alterar senha",
                mensagem
            );

        } finally {
            setSalvando(false);
        }
    };

    return (
        <View style={formulario.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <Text style={formulario.titulo}>
                Alterar <Text style={formulario.logo}>Senha</Text>
            </Text>

            <Text style={formulario.subtitulo}>
                Informe sua senha atual e defina uma nova senha para a sua conta.
            </Text>

            <View style={formulario.formulario}>

                {/* SENHA ATUAL */}
                <View
                    style={[
                        formulario.containerInputSenha,
                        erros.senhaAtual && formulario.inputErro
                    ]}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={
                            erros.senhaAtual
                                ? cores.erro
                                : cores.textoCinzaMedio
                        }
                        style={formulario.iconeInput}
                    />

                    <TextInput
                        style={formulario.inputSenha}
                        placeholder={
                            erros.senhaAtual
                                ? "Senha atual é obrigatória *"
                                : "Senha atual"
                        }
                        placeholderTextColor={
                            erros.senhaAtual
                                ? cores.erro
                                : cores.textoPlaceholder
                        }
                        secureTextEntry={!mostrarSenhaAtual}
                        value={senhaAtual}
                        editable={!salvando}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={(texto) => {
                            setSenhaAtual(texto);

                            if (texto.trim()) {
                                setErros((atual) => ({
                                    ...atual,
                                    senhaAtual: false
                                }));
                            }
                        }}
                    />

                    <TouchableOpacity
                        style={formulario.containerIconeOlho}
                        disabled={salvando}
                        onPress={() =>
                            setMostrarSenhaAtual((atual) => !atual)
                        }
                    >
                        <Ionicons
                            name={
                                mostrarSenhaAtual
                                    ? "eye-outline"
                                    : "eye-off-outline"
                            }
                            size={22}
                            color={cores.textoCinzaMedio}
                        />
                    </TouchableOpacity>
                </View>

                {/* NOVA SENHA */}
                <View>
                    <View
                        style={[
                            formulario.containerInputSenha,
                            erros.novaSenha && formulario.inputErro
                        ]}
                    >
                        <Ionicons
                            name="lock-open-outline"
                            size={20}
                            color={
                                erros.novaSenha
                                    ? cores.erro
                                    : cores.textoCinzaMedio
                            }
                            style={formulario.iconeInput}
                        />

                        <TextInput
                            style={formulario.inputSenha}
                            placeholder={
                                erros.novaSenha
                                    ? "Nova senha inválida *"
                                    : "Nova senha"
                            }
                            placeholderTextColor={
                                erros.novaSenha
                                    ? cores.erro
                                    : cores.textoPlaceholder
                            }
                            secureTextEntry={!mostrarNovaSenha}
                            value={novaSenha}
                            editable={!salvando}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={(texto) => {
                                setNovaSenha(texto);

                                setErros((atual) => ({
                                    ...atual,
                                    novaSenha: false,
                                    senhaFraca: false
                                }));
                            }}
                        />

                        <TouchableOpacity
                            style={formulario.containerIconeOlho}
                            disabled={salvando}
                            onPress={() =>
                                setMostrarNovaSenha((atual) => !atual)
                            }
                        >
                            <Ionicons
                                name={
                                    mostrarNovaSenha
                                        ? "eye-outline"
                                        : "eye-off-outline"
                                }
                                size={22}
                                color={cores.textoCinzaMedio}
                            />
                        </TouchableOpacity>
                    </View>

                    {erros.senhaFraca && (
                        <Text style={formulario.erroTexto}>
                            Use pelo menos 10 caracteres, uma letra maiúscula,
                            um número e um caractere especial.
                        </Text>
                    )}
                </View>

                {/* CONFIRMAR NOVA SENHA */}
                <View>
                    <View
                        style={[
                            formulario.containerInputSenha,
                            erros.confirmarSenha && formulario.inputErro
                        ]}
                    >
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color={
                                erros.confirmarSenha
                                    ? cores.erro
                                    : cores.textoCinzaMedio
                            }
                            style={formulario.iconeInput}
                        />

                        <TextInput
                            style={formulario.inputSenha}
                            placeholder={
                                erros.confirmarSenha
                                    ? "Confirmação inválida *"
                                    : "Confirme a nova senha"
                            }
                            placeholderTextColor={
                                erros.confirmarSenha
                                    ? cores.erro
                                    : cores.textoPlaceholder
                            }
                            secureTextEntry={!mostrarConfirmacao}
                            value={confirmarSenha}
                            editable={!salvando}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={(texto) => {
                                setConfirmarSenha(texto);

                                setErros((atual) => ({
                                    ...atual,
                                    confirmarSenha: false,
                                    senhasDiferentes: false
                                }));
                            }}
                        />

                        <TouchableOpacity
                            style={formulario.containerIconeOlho}
                            disabled={salvando}
                            onPress={() =>
                                setMostrarConfirmacao((atual) => !atual)
                            }
                        >
                            <Ionicons
                                name={
                                    mostrarConfirmacao
                                        ? "eye-outline"
                                        : "eye-off-outline"
                                }
                                size={22}
                                color={cores.textoCinzaMedio}
                            />
                        </TouchableOpacity>
                    </View>

                    {erros.senhasDiferentes && (
                        <Text style={formulario.erroTexto}>
                            As senhas não coincidem.
                        </Text>
                    )}
                </View>

                {/* ALTERAR SENHA */}
                <TouchableOpacity
                    style={[
                        formulario.botao,
                        salvando && { opacity: 0.6 }
                    ]}
                    activeOpacity={0.8}
                    onPress={handleAlterarSenha}
                    disabled={salvando}
                >
                    {salvando ? (
                        <ActivityIndicator
                            color={cores.textoBotao}
                        />
                    ) : (
                        <Text style={formulario.textoBotao}>
                            ALTERAR SENHA
                        </Text>
                    )}
                </TouchableOpacity>

            </View>
        </View>
    );
}
