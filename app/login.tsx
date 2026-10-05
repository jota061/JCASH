import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { login } from "../estilos/login";
import { cores } from "../estilos/cores";
export default function Login() {
    const router = useRouter();
    // CONTROLE PARA MOSTRAR E OCULTAR A SENHA
    const [ocultarSenha, setOcultarSenha] = useState(true);
    // CAMPOS DO FORMULÁRIO
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    // CONTROLE DE ERROS
    const [erros, setErros] = useState({ email: false, senha: false });
    // FUNÇÃO DE LOGIN
    const handleLogin = () => {
        const campoEmailVazio = email.trim() === "";
        const campoSenhaVazio = senha.trim() === "";
        // ATUALIZA OS ERROS DOS CAMPOS
        setErros(
            {
                email: campoEmailVazio,
                senha: campoSenhaVazio
            }
        );
        // VERIFICA SE EXISTEM CAMPOS VAZIOS
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
        // LOGIN REALIZADO
        Alert.alert(
            "Sucesso",
            "Login realizado com sucesso!",
            [
                {
                    text: "OK",
                    onPress: () =>
                        router.replace("/(tabs)/home"),
                },
            ]
        );
    };
    return (
        <View style={login.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* TÍTULO */}
            <Text style={login.titulo}>Entre na sua conta do <Text style={login.logo}>JCASH</Text></Text>

            {/* SUBTÍTULO */}
            <Text style={login.subtitulo}>Informe seus dados para acessar todas as suas ferramentas!</Text>

            {/* FORMULÁRIO */}
            <View style={login.formulario}>

                {/* E-MAIL */}
                <View style={login.envolucroInput}>
                    <Ionicons name="mail-outline" size={20} color={erros.email ? cores.erro : cores.textoCinzaMedio} style={login.iconeInput} />
                    <TextInput
                        style={[login.input, erros.email && login.inputErro]}
                        placeholder={erros.email ? "E-mail é obrigatório *" : "E-mail"}
                        placeholderTextColor={erros.email ? cores.erro : cores.textoPlaceholder}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (text.trim() !== "") {
                                setErros((e) => ({ ...e, email: false }));
                            }
                        }}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                    />
                </View>

                {/* SENHA */}
                <View style={[login.containerInputSenha, erros.senha && login.inputErro]}>
                    <Ionicons name="lock-closed-outline" size={20} color={erros.senha ? cores.erro : cores.textoCinzaMedio} style={login.iconeInput} />
                    <TextInput
                        style={login.inputSenha} placeholder={erros.senha ? "Senha é obrigatória *" : "Senha"}
                        placeholderTextColor={erros.senha ? cores.erro : cores.textoPlaceholder}
                        secureTextEntry={ocultarSenha} value={senha}
                        onChangeText={(text) => {
                            setSenha(text);
                            if (text.trim() !== "") {
                                setErros((e) => ({ ...e, senha: false }));
                            }
                        }}
                    />
                    {/* BOTÃO PARA MOSTRAR E OCULTAR A SENHA */}
                    <TouchableOpacity style={login.containerIconeOlho} onPress={() => setOcultarSenha(!ocultarSenha)}>
                        <Ionicons name={ocultarSenha ? "eye-off-outline" : "eye-outline"} size={22} color={erros.senha ? cores.erro : cores.textoCinzaMedio} />
                    </TouchableOpacity>
                </View>

                {/* ESQUECEU A SENHA */}
                <TouchableOpacity style={login.linkSenha} onPress={() => router.push("/recuperar_senha")}>
                    <Text style={login.textoLink}>Esqueceu a senha?</Text>
                </TouchableOpacity>

                {/* BOTÃO DE LOGIN */}
                <TouchableOpacity activeOpacity={0.8} style={login.botao} onPress={handleLogin}>
                    <Text style={login.textoBotao}>Entrar</Text>
                </TouchableOpacity>

                {/* LINK PARA CADASTRO */}
                <TouchableOpacity style={login.linkCadastro} onPress={() => router.push("/cadastroUsuario")}>
                    <Text style={login.textoLink}>Ainda não possui uma conta? <Text style={{ color: cores.destaque }}>Cadastre-se</Text></Text>
                </TouchableOpacity>
            </View>
        </View>
    );
} 
