import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { cadastro } from "../estilos/cadastro";
import { cores } from "../estilos/cores";

export default function Cadastro() {
    const router = useRouter();

    // REFS PARA NAVEGAÇÃO ENTRE CAMPOS VIA TECLADO
    const nomeSocialRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const senhaRef = useRef<TextInput>(null);
    const confirmarSenhaRef = useRef<TextInput>(null);

    // CONTROLE PARA MOSTRAR E OCULTAR AS SENHAS
    const [ocultarSenha, setOcultarSenha] = useState(true);
    const [ocultarConfirmarSenha, setOcultarConfirmarSenha] = useState(true);

    // CAMPOS DO FORMULÁRIO
    const [nome, setNome] = useState("");
    const [nomeSocial, setNomeSocial] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    // CONTROLE DE ERROS
    const [erros, setErros] = useState({
        nome: false,
        nomeSocial: false,
        email: false,
        senha: false,
        confirmarSenha: false,
    });

    const [senhaFraca, setSenhaFraca] = useState(false);
    const [senhasDiferentes, setSenhasDiferentes] = useState(false);
    const [emailInvalido, setEmailInvalido] = useState(false);

    // FUNÇÃO DE CADASTRO
    const handleCadastro = () => {
        const nomeLimpo = nome.trim();
        const nomeSocialLimpo = nomeSocial.trim();
        const emailLimpo = email.trim();

        setNome(nomeLimpo);
        setNomeSocial(nomeSocialLimpo);
        setEmail(emailLimpo);

        const campoNomeVazio = nomeLimpo === "";
        const campoNomeSocialVazio = nomeSocialLimpo === "";
        const campoEmailVazio = emailLimpo === "";
        const campoSenhaVazio = senha.trim() === "";
        const campoConfirmarVazio = confirmarSenha.trim() === "";

        // Regex de e-mail padronizado (verifica usuario@dominio.extensao)
        const regexEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailFormatInvalido = !campoEmailVazio && !regexEmailValido.test(emailLimpo);

        // Senha com pelo menos: 1 letra maiúscula, 1 número e 1 caractere especial
        const regexSenhaForte = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!\%*?&#._+=-]).+$/;
        const senhaInvalida = !campoSenhaVazio && !regexSenhaForte.test(senha);
        const naoCoincide = !campoConfirmarVazio && senha !== confirmarSenha;

        // Atualiza estados visuais de erro
        setErros({
            nome: campoNomeVazio,
            nomeSocial: campoNomeSocialVazio,
            email: campoEmailVazio || emailFormatInvalido,
            senha: campoSenhaVazio || senhaInvalida,
            confirmarSenha: campoConfirmarVazio || naoCoincide,
        });

        setEmailInvalido(emailFormatInvalido);
        setSenhaFraca(senhaInvalida);
        setSenhasDiferentes(naoCoincide);

        // Validação: Campos obrigatórios
        if (campoNomeVazio || campoNomeSocialVazio || campoEmailVazio || campoSenhaVazio || campoConfirmarVazio) {
            const camposFaltando: string[] = [];
            if (campoNomeVazio) camposFaltando.push("Nome completo");
            if (campoNomeSocialVazio) camposFaltando.push("Nome social");
            if (campoEmailVazio) camposFaltando.push("E-mail");
            if (campoSenhaVazio) camposFaltando.push("Senha");
            if (campoConfirmarVazio) camposFaltando.push("Confirmar senha");

            Alert.alert(
                "Campos obrigatórios",
                `Por favor, preencha: ${camposFaltando.join(", ")}`
            );
            return;
        }

        // Validação: Formato do e-mail
        if (emailFormatInvalido) {
            Alert.alert(
                "E-mail incorreto",
                "Por favor, insira um e-mail válido (exemplo: usuario@dominio.com)."
            );
            return;
        }

        // Validação: Requisitos da senha
        if (senhaInvalida) {
            Alert.alert(
                "Senha fraca",
                "Sua senha precisa ter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial."
            );
            return;
        }

        // Validação: Coincidência de senhas
        if (naoCoincide) {
            Alert.alert("Erro na confirmação", "As senhas digitadas não são iguais.");
            return;
        }

        // Sucesso
        Alert.alert("Sucesso", "Cadastro simulado com sucesso!", [
            {
                text: "OK",
                onPress: () => router.replace("/login"),
            },
        ]);
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={cadastro.containerTela}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="dark" />

                {/* TÍTULO */}
                <Text style={cadastro.titulo}>Crie sua conta no <Text style={cadastro.logo}>JCASH</Text></Text>

                {/* SUBTÍTULO */}
                <Text style={cadastro.subtitulo}>Preencha os campos a seguir para ter acesso a todas as ferramentas!</Text>

                <View style={cadastro.formulario}>

                    {/* NOME COMPLETO */}
                    <View style={cadastro.envolucroInput}>
                        <Ionicons name="person-outline" size={20} color={erros.nome ? cores.erro : cores.textoCinzaMedio} style={cadastro.iconeInput} />
                        <TextInput
                            style={[cadastro.input, erros.nome && cadastro.inputErro]}
                            placeholder={erros.nome ? "Nome é obrigatório *" : "Nome completo"}
                            placeholderTextColor={erros.nome ? cores.erro : cores.textoPlaceholder}
                            value={nome}
                            onChangeText={(text) => {
                                setNome(text);
                                if (text.trim() !== "") setErros((e) => ({ ...e, nome: false }));
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => nomeSocialRef.current?.focus()}
                        />
                    </View>

                    {/* NOME SOCIAL */}
                    <View style={cadastro.envolucroInput}>
                        <Ionicons name="happy-outline" size={20} color={erros.nomeSocial ? cores.erro : cores.textoCinzaMedio} style={cadastro.iconeInput} />
                        <TextInput
                            ref={nomeSocialRef}
                            style={[cadastro.input, erros.nomeSocial && cadastro.inputErro]}
                            placeholder={erros.nomeSocial ? "Nome social é obrigatório *" : "Nome social"}
                            placeholderTextColor={erros.nomeSocial ? cores.erro : cores.textoPlaceholder}
                            value={nomeSocial}
                            onChangeText={(text) => {
                                setNomeSocial(text);
                                if (text.trim() !== "") setErros((e) => ({ ...e, nomeSocial: false }));
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                        />
                    </View>

                    {/* E-MAIL */}
                    <View style={cadastro.envolucroInput}>
                        <Ionicons name="mail-outline" size={20} color={erros.email ? cores.erro : cores.textoCinzaMedio} style={cadastro.iconeInput} />
                        <TextInput
                            ref={emailRef}
                            style={[cadastro.input, erros.email && cadastro.inputErro]}
                            placeholder={erros.email && !emailInvalido ? "E-mail é obrigatório *" : "E-mail"}
                            placeholderTextColor={erros.email ? cores.erro : cores.textoPlaceholder}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (text.trim() !== "") {
                                    setErros((e) => ({ ...e, email: false }));
                                    setEmailInvalido(false);
                                }
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => senhaRef.current?.focus()}
                        />
                    </View>

                    {/* SENHA */}
                    <View>
                        <View style={[cadastro.containerInputSenha, erros.senha && cadastro.inputErro]}>
                            <Ionicons name="lock-closed-outline" size={20} color={erros.senha ? cores.erro : cores.textoCinzaMedio} style={cadastro.iconeInput} />
                            <TextInput
                                ref={senhaRef}
                                style={cadastro.inputSenha}
                                placeholder={erros.senha && !senhaFraca ? "Senha é obrigatória *" : "Senha"}
                                placeholderTextColor={erros.senha ? cores.erro : cores.textoPlaceholder}
                                secureTextEntry={ocultarSenha}
                                value={senha}
                                onChangeText={(text) => {
                                    setSenha(text);
                                    setErros((e) => ({ ...e, senha: false }));
                                    setSenhaFraca(false);
                                }}
                                returnKeyType="next"
                                onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                            />
                            <TouchableOpacity style={cadastro.containerIconeOlho} onPress={() => setOcultarSenha(!ocultarSenha)}>
                                <Ionicons name={ocultarSenha ? "eye-off-outline" : "eye-outline"} size={22} color={erros.senha ? cores.erro : cores.textoCinzaMedio} />
                            </TouchableOpacity>
                        </View>
                        {senhaFraca && (<Text style={cadastro.erroTexto}>Use pelo menos uma letra maiúscula, um número e um caractere especial.</Text>)}
                    </View>

                    {/* CONFIRMAR SENHA */}
                    <View>
                        <View style={[cadastro.containerInputSenha, erros.confirmarSenha && cadastro.inputErro]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={erros.confirmarSenha ? cores.erro : cores.textoCinzaMedio} style={cadastro.iconeInput} />
                            <TextInput
                                ref={confirmarSenhaRef}
                                style={cadastro.inputSenha}
                                placeholder={erros.confirmarSenha && !senhasDiferentes ? "Confirmação é obrigatória *" : "Confirme a senha"}
                                placeholderTextColor={erros.confirmarSenha ? cores.erro : cores.textoPlaceholder}
                                secureTextEntry={ocultarConfirmarSenha}
                                value={confirmarSenha}
                                onChangeText={(text) => {
                                    setConfirmarSenha(text);
                                    setErros((e) => ({ ...e, confirmarSenha: false }));
                                    setSenhasDiferentes(false);
                                }}
                                returnKeyType="done"
                                onSubmitEditing={handleCadastro}
                            />
                            <TouchableOpacity style={cadastro.containerIconeOlho} onPress={() => setOcultarConfirmarSenha(!ocultarConfirmarSenha)}>
                                <Ionicons name={ocultarConfirmarSenha ? "eye-off-outline" : "eye-outline"} size={22} color={erros.confirmarSenha ? cores.erro : cores.textoCinzaMedio} />
                            </TouchableOpacity>
                        </View>
                        {senhasDiferentes && (<Text style={cadastro.erroTexto}>As senhas não coincidem.</Text>)}
                    </View>

                    {/* VOLTAR */}
                    <TouchableOpacity style={cadastro.linkDireita} onPress={() => router.back()}>
                        <Text style={cadastro.textoLink}>Voltar</Text>
                    </TouchableOpacity>

                    {/* BOTÃO CADASTRAR */}
                    <TouchableOpacity activeOpacity={0.8} style={cadastro.botao} onPress={handleCadastro}>
                        <Text style={cadastro.textoBotao}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}