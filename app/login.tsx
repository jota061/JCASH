
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

import { useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { login } from "../estilos/login";
import { cores } from "../estilos/cores";

import {
    useAutenticacao
} from "../contextos/ContextoAutenticacao";

export default function Login() {
    const router = useRouter();
    const { entrar } = useAutenticacao();

    // Mostrar ou ocultar a senha
    const [ocultarSenha, setOcultarSenha] = useState(true);

    // Dados do formulario
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    // Destacar campos obrigatorios
    const [erros, setErros] = useState({
        email: false,
        senha: false
    });

    // Evitar varios logins simultaneos
    const [enviando, setEnviando] = useState(false);

    // Autenticar o usuario usando a API JCASH
    const handleLogin = async () => {
        if (enviando) {
            return;
        }

        const emailLimpo = email.trim();

        const campoEmailVazio = emailLimpo === "";
        const campoSenhaVazio = senha.trim() === "";

        setErros({
            email: campoEmailVazio,
            senha: campoSenhaVazio
        });

        if (campoEmailVazio || campoSenhaVazio) {
            const camposFaltando: string[] = [];

            if (campoEmailVazio) {
                camposFaltando.push("E-mail");
            }

            if (campoSenhaVazio) {
                camposFaltando.push("Senha");
            }

            Alert.alert(
                "Campos obrigatórios",
                `Por favor, preencha: ${camposFaltando.join(", ")}`
            );

            return;
        }

        setEnviando(true);

        try {
            console.log("[JCASH] Iniciando login...");

            // A API verifica as credenciais e devolve um JWT
            await entrar(emailLimpo, senha);

            console.log("[JCASH] Login realizado com sucesso.");

            // Limpar a senha do formulario
            setSenha("");

            // Abrir a Home depois da autenticacao
            router.replace("/(tabs)/home");

        } catch (erro) {
            const mensagem =
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível realizar o login.";

            console.warn("[JCASH] Falha no login.");

            Alert.alert("Erro no login", mensagem);

        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={login.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* TITULO */}
            <Text style={login.titulo}>
                Entre na sua conta do{" "}
                <Text style={login.logo}>JCASH</Text>
            </Text>

            {/* SUBTITULO */}
            <Text style={login.subtitulo}>
                Informe seus dados para acessar todas as suas ferramentas!
            </Text>

            {/* FORMULARIO */}
            <View style={login.formulario}>

                {/* E-MAIL */}
                <View style={login.envolucroInput}>
                    <Ionicons
                        name="mail-outline"
                        size={20}
                        color={
                            erros.email
                                ? cores.erro
                                : cores.textoCinzaMedio
                        }
                        style={login.iconeInput}
                    />

                    <TextInput
                        style={[
                            login.input,
                            erros.email && login.inputErro
                        ]}
                        placeholder={
                            erros.email
                                ? "E-mail é obrigatório *"
                                : "E-mail"
                        }
                        placeholderTextColor={
                            erros.email
                                ? cores.erro
                                : cores.textoPlaceholder
                        }
                        value={email}
                        onChangeText={(texto) => {
                            setEmail(texto);

                            if (texto.trim() !== "") {
                                setErros((atual) => ({
                                    ...atual,
                                    email: false
                                }));
                            }
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!enviando}
                    />
                </View>

                {/* SENHA */}
                <View
                    style={[
                        login.containerInputSenha,
                        erros.senha && login.inputErro
                    ]}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={
                            erros.senha
                                ? cores.erro
                                : cores.textoCinzaMedio
                        }
                        style={login.iconeInput}
                    />

                    <TextInput
                        style={login.inputSenha}
                        placeholder={
                            erros.senha
                                ? "Senha é obrigatória *"
                                : "Senha"
                        }
                        placeholderTextColor={
                            erros.senha
                                ? cores.erro
                                : cores.textoPlaceholder
                        }
                        secureTextEntry={ocultarSenha}
                        value={senha}
                        onChangeText={(texto) => {
                            setSenha(texto);

                            if (texto.trim() !== "") {
                                setErros((atual) => ({
                                    ...atual,
                                    senha: false
                                }));
                            }
                        }}
                        editable={!enviando}
                        onSubmitEditing={handleLogin}
                    />

                    {/* MOSTRAR OU OCULTAR SENHA */}
                    <TouchableOpacity
                        style={login.containerIconeOlho}
                        onPress={() => {
                            setOcultarSenha(!ocultarSenha);
                        }}
                        disabled={enviando}
                    >
                        <Ionicons
                            name={
                                ocultarSenha
                                    ? "eye-off-outline"
                                    : "eye-outline"
                            }
                            size={22}
                            color={
                                erros.senha
                                    ? cores.erro
                                    : cores.textoCinzaMedio
                            }
                        />
                    </TouchableOpacity>
                </View>

                {/* BOTAO DE LOGIN */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        login.botao,
                        enviando && { opacity: 0.7 }
                    ]}
                    onPress={handleLogin}
                    disabled={enviando}
                >
                    {enviando ? (
                        <ActivityIndicator
                            color={cores.textoBotao}
                        />
                    ) : (
                        <Text style={login.textoBotao}>
                            Entrar
                        </Text>
                    )}
                </TouchableOpacity>

                {/* LINK PARA CADASTRO */}
                <TouchableOpacity
                    style={login.linkCadastro}
                    onPress={() => router.push("/cadastroUsuario")}
                    disabled={enviando}
                >
                    <Text style={login.textoLink}>
                        Ainda não possui uma conta?{" "}
                        <Text style={{ color: cores.destaque }}>
                            Cadastre-se
                        </Text>
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}
