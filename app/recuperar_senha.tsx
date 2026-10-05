import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { formulario } from "../estilos/formulario";
import { cores } from "../estilos/cores";

export default function RecuperarSenha() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [erroEmail, setErroEmail] = useState(false);

    const handleEnviarInstrucoes = () => {
        const emailLimpo = email.trim();
        const regexEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailLimpo) {
            setErroEmail(true);
            Alert.alert("Campo obrigatório", "Digite o e-mail cadastrado.");
            return;
        }
        if (!regexEmailValido.test(emailLimpo)) {
            setErroEmail(true);
            Alert.alert("E-mail inválido", "Informe um e-mail válido.");
            return;
        }

        Alert.alert(
            "Solicitação enviada",
            "Em uma versão com API, o sistema enviará as instruções de recuperação para este e-mail.",
            [{ text: "Voltar ao Login", onPress: () => router.replace("/login") }]
        );
    };

    return (
        <View style={formulario.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />
            <Text style={formulario.titulo}>Recuperar <Text style={formulario.logo}>Senha</Text></Text>
            <Text style={formulario.subtitulo}>Digite o e-mail cadastrado para solicitar a recuperação da sua senha.</Text>

            <View style={formulario.formulario}>
                <View style={formulario.envolucroInput}>
                    <Ionicons name="mail-outline" size={20} color={erroEmail ? cores.erro : cores.textoCinzaMedio} style={formulario.iconeInput} />
                    <TextInput
                        style={[formulario.input, erroEmail && formulario.inputErro]}
                        placeholder={erroEmail ? "E-mail inválido *" : "Seu e-mail cadastrado"}
                        placeholderTextColor={erroEmail ? cores.erro : cores.textoPlaceholder}
                        value={email}
                        onChangeText={(texto) => {
                            setEmail(texto);
                            if (texto.trim()) setErroEmail(false);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity style={formulario.botao} activeOpacity={0.8} onPress={handleEnviarInstrucoes}>
                    <Text style={formulario.textoBotao}>ENVIAR INSTRUÇÕES</Text>
                </TouchableOpacity>

                <TouchableOpacity style={formulario.linkDireita} onPress={() => router.replace("/login")}>
                    <Text style={formulario.textoLink}>Voltar ao Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
