import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { cadastro } from "../estilos/cadastro";
import { cores } from "../estilos/cores";

import {
    cadastrarUsuario
} from "../servicos/servicoCadastro";

export default function Cadastro() {
    const router = useRouter();

    // Navegacao entre campos utilizando o teclado
    const nomeSocialRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const senhaRef = useRef<TextInput>(null);
    const confirmarSenhaRef = useRef<TextInput>(null);

    // Mostrar ou ocultar as senhas
    const [ocultarSenha, setOcultarSenha] = useState(true);
    const [ocultarConfirmarSenha, setOcultarConfirmarSenha] =
        useState(true);

    // Dados do formulario
    const [nome, setNome] = useState("");
    const [nomeSocial, setNomeSocial] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    // Evitar varios cadastros simultaneos
    const [enviando, setEnviando] = useState(false);

    // Controle dos erros visuais
    const [erros, setErros] = useState({
        nome: false,
        nomeSocial: false,
        email: false,
        senha: false,
        confirmarSenha: false
    });

    const [senhaFraca, setSenhaFraca] = useState(false);
    const [senhasDiferentes, setSenhasDiferentes] = useState(false);
    const [emailInvalido, setEmailInvalido] = useState(false);

    // Cadastrar o usuario no MariaDB por meio da API
    const handleCadastro = async () => {
        if (enviando) {
            return;
        }

        const nomeLimpo = nome.trim();
        const nomeSocialLimpo = nomeSocial.trim();
        const emailLimpo = email.trim().toLowerCase();

        // Conferir os campos obrigatorios
        const campoNomeVazio = nomeLimpo === "";
        const campoNomeSocialVazio = nomeSocialLimpo === "";
        const campoEmailVazio = emailLimpo === "";
        const campoSenhaVazio = senha.trim() === "";
        const campoConfirmarVazio = confirmarSenha.trim() === "";

        // Validar o formato do e-mail
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const formatoEmailInvalido =
            !campoEmailVazio && !regexEmail.test(emailLimpo);

        // A senha deve ter pelo menos 10 caracteres
        const senhaMuitoCurta =
            !campoSenhaVazio &&
            Array.from(senha).length < 10;

        // Manter os requisitos visuais de seguranca
        const regexSenhaForte =
            /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._+=-]).+$/;

        const requisitosSenhaInvalidos =
            !campoSenhaVazio &&
            !regexSenhaForte.test(senha);

        const formatoSenhaInvalido =
            senhaMuitoCurta || requisitosSenhaInvalidos;

        const senhasNaoCoincidem =
            !campoConfirmarVazio &&
            senha !== confirmarSenha;

        const nomeMuitoLongo = nomeLimpo.length > 100;
        const nomeSocialMuitoLongo = nomeSocialLimpo.length > 100;
        const emailMuitoLongo = emailLimpo.length > 255;

        // Atualizar a interface dos campos
        setErros({
            nome: campoNomeVazio || nomeMuitoLongo,
            nomeSocial:
                campoNomeSocialVazio || nomeSocialMuitoLongo,
            email:
                campoEmailVazio ||
                formatoEmailInvalido ||
                emailMuitoLongo,
            senha: campoSenhaVazio || formatoSenhaInvalido,
            confirmarSenha:
                campoConfirmarVazio || senhasNaoCoincidem
        });

        setSenhaFraca(formatoSenhaInvalido);
        setSenhasDiferentes(senhasNaoCoincidem);
        setEmailInvalido(formatoEmailInvalido);

        // Verificar campos vazios
        if (
            campoNomeVazio ||
            campoNomeSocialVazio ||
            campoEmailVazio ||
            campoSenhaVazio ||
            campoConfirmarVazio
        ) {
            Alert.alert(
                "Campos obrigatórios",
                "Preencha todos os campos para criar sua conta."
            );

            return;
        }

        // Verificar tamanho dos demais campos
        if (
            nomeMuitoLongo ||
            nomeSocialMuitoLongo ||
            emailMuitoLongo
        ) {
            Alert.alert(
                "Dados inválidos",
                "Verifique o tamanho do nome, nome social e e-mail."
            );

            return;
        }

        // Verificar e-mail
        if (formatoEmailInvalido) {
            Alert.alert(
                "E-mail inválido",
                "Informe um endereço de e-mail válido."
            );

            return;
        }

        // Verificar o minimo de caracteres da senha
        if (senhaMuitoCurta) {
            Alert.alert(
                "Senha inválida",
                "A senha deve ter pelo menos 10 caracteres."
            );

            return;
        }

        // Verificar os demais requisitos de senha
        if (requisitosSenhaInvalidos) {
            Alert.alert(
                "Senha inválida",
                "Utilize pelo menos uma letra maiúscula, um número e um caractere especial."
            );

            return;
        }

        // Verificar confirmacao da senha
        if (senhasNaoCoincidem) {
            Alert.alert(
                "Senhas diferentes",
                "As senhas digitadas não são iguais."
            );

            return;
        }

        setEnviando(true);

        try {
            // Enviar o cadastro para a API JCASH
            await cadastrarUsuario({
                nome: nomeLimpo,
                nome_social: nomeSocialLimpo,
                email: emailLimpo,
                senha
            });

            // Limpar as senhas apos o cadastro
            setSenha("");
            setConfirmarSenha("");

            // O cadastro nao realiza login automaticamente
            Alert.alert(
                "Cadastro realizado!",
                "Sua conta foi criada com sucesso. Agora você pode entrar no JCASH.",
                [
                    {
                        text: "Ir para o login",
                        onPress: () => {
                            router.replace("/login");
                        }
                    }
                ]
            );

        } catch (erro) {
            const mensagem =
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível criar sua conta.";

            Alert.alert(
                "Erro no cadastro",
                mensagem
            );

        } finally {
            setEnviando(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <View style={cadastro.containerTela}>
                <Stack.Screen
                    options={{ headerShown: false }}
                />

                <StatusBar style="dark" />

                {/* TITULO */}
                <Text style={cadastro.titulo}>
                    Crie sua conta no{" "}
                    <Text style={cadastro.logo}>
                        JCASH
                    </Text>
                </Text>

                {/* SUBTITULO */}
                <Text style={cadastro.subtitulo}>
                    Preencha os campos a seguir para ter acesso
                    a todas as ferramentas!
                </Text>

                <View style={cadastro.formulario}>

                    {/* NOME COMPLETO */}
                    <View style={cadastro.envolucroInput}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color={
                                erros.nome
                                    ? cores.erro
                                    : cores.textoCinzaMedio
                            }
                            style={cadastro.iconeInput}
                        />

                        <TextInput
                            style={[
                                cadastro.input,
                                erros.nome && cadastro.inputErro
                            ]}
                            placeholder={
                                erros.nome
                                    ? "Verifique o nome completo *"
                                    : "Nome completo"
                            }
                            placeholderTextColor={
                                erros.nome
                                    ? cores.erro
                                    : cores.textoPlaceholder
                            }
                            value={nome}
                            onChangeText={(texto) => {
                                setNome(texto);

                                if (texto.trim()) {
                                    setErros((atual) => ({
                                        ...atual,
                                        nome: false
                                    }));
                                }
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                            editable={!enviando}
                            onSubmitEditing={() => {
                                nomeSocialRef.current?.focus();
                            }}
                        />
                    </View>

                    {/* NOME SOCIAL */}
                    <View style={cadastro.envolucroInput}>
                        <Ionicons
                            name="happy-outline"
                            size={20}
                            color={
                                erros.nomeSocial
                                    ? cores.erro
                                    : cores.textoCinzaMedio
                            }
                            style={cadastro.iconeInput}
                        />

                        <TextInput
                            ref={nomeSocialRef}
                            style={[
                                cadastro.input,
                                erros.nomeSocial && cadastro.inputErro
                            ]}
                            placeholder={
                                erros.nomeSocial
                                    ? "Verifique o nome social *"
                                    : "Nome social"
                            }
                            placeholderTextColor={
                                erros.nomeSocial
                                    ? cores.erro
                                    : cores.textoPlaceholder
                            }
                            value={nomeSocial}
                            onChangeText={(texto) => {
                                setNomeSocial(texto);

                                if (texto.trim()) {
                                    setErros((atual) => ({
                                        ...atual,
                                        nomeSocial: false
                                    }));
                                }
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            returnKeyType="next"
                            editable={!enviando}
                            onSubmitEditing={() => {
                                emailRef.current?.focus();
                            }}
                        />
                    </View>

                    {/* E-MAIL */}
                    <View style={cadastro.envolucroInput}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color={
                                erros.email
                                    ? cores.erro
                                    : cores.textoCinzaMedio
                            }
                            style={cadastro.iconeInput}
                        />

                        <TextInput
                            ref={emailRef}
                            style={[
                                cadastro.input,
                                erros.email && cadastro.inputErro
                            ]}
                            placeholder={
                                erros.email && !emailInvalido
                                    ? "E-mail obrigatório *"
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

                                if (texto.trim()) {
                                    setErros((atual) => ({
                                        ...atual,
                                        email: false
                                    }));

                                    setEmailInvalido(false);
                                }
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            editable={!enviando}
                            onSubmitEditing={() => {
                                senhaRef.current?.focus();
                            }}
                        />
                    </View>

                    {/* SENHA */}
                    <View>
                        <View
                            style={[
                                cadastro.containerInputSenha,
                                erros.senha && cadastro.inputErro
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
                                style={cadastro.iconeInput}
                            />

                            <TextInput
                                ref={senhaRef}
                                style={cadastro.inputSenha}
                                placeholder={
                                    erros.senha && !senhaFraca
                                        ? "Senha obrigatória *"
                                        : "Senha"
                                }
                                placeholderTextColor={
                                    erros.senha
                                        ? cores.erro
                                        : cores.textoPlaceholder
                                }
                                secureTextEntry={ocultarSenha}
                                value={senha}
                                editable={!enviando}
                                onChangeText={(texto) => {
                                    setSenha(texto);

                                    setErros((atual) => ({
                                        ...atual,
                                        senha: false
                                    }));

                                    setSenhaFraca(false);
                                }}
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    confirmarSenhaRef.current?.focus();
                                }}
                            />

                            <TouchableOpacity
                                style={cadastro.containerIconeOlho}
                                disabled={enviando}
                                onPress={() => {
                                    setOcultarSenha(!ocultarSenha);
                                }}
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

                        {senhaFraca && (
                            <Text style={cadastro.erroTexto}>
                                A senha deve ter pelo menos 10 caracteres,
                                uma letra maiúscula, um número e um símbolo.
                            </Text>
                        )}
                    </View>

                    {/* CONFIRMAR SENHA */}
                    <View>
                        <View
                            style={[
                                cadastro.containerInputSenha,
                                erros.confirmarSenha &&
                                cadastro.inputErro
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
                                style={cadastro.iconeInput}
                            />

                            <TextInput
                                ref={confirmarSenhaRef}
                                style={cadastro.inputSenha}
                                placeholder={
                                    erros.confirmarSenha &&
                                        !senhasDiferentes
                                        ? "Confirmação obrigatória *"
                                        : "Confirme a senha"
                                }
                                placeholderTextColor={
                                    erros.confirmarSenha
                                        ? cores.erro
                                        : cores.textoPlaceholder
                                }
                                secureTextEntry={
                                    ocultarConfirmarSenha
                                }
                                value={confirmarSenha}
                                editable={!enviando}
                                onChangeText={(texto) => {
                                    setConfirmarSenha(texto);

                                    setErros((atual) => ({
                                        ...atual,
                                        confirmarSenha: false
                                    }));

                                    setSenhasDiferentes(false);
                                }}
                                returnKeyType="done"
                                onSubmitEditing={() => {
                                    void handleCadastro();
                                }}
                            />

                            <TouchableOpacity
                                style={cadastro.containerIconeOlho}
                                disabled={enviando}
                                onPress={() => {
                                    setOcultarConfirmarSenha(
                                        !ocultarConfirmarSenha
                                    );
                                }}
                            >
                                <Ionicons
                                    name={
                                        ocultarConfirmarSenha
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={22}
                                    color={
                                        erros.confirmarSenha
                                            ? cores.erro
                                            : cores.textoCinzaMedio
                                    }
                                />
                            </TouchableOpacity>
                        </View>

                        {senhasDiferentes && (
                            <Text style={cadastro.erroTexto}>
                                As senhas não coincidem.
                            </Text>
                        )}
                    </View>

                    {/* VOLTAR AO LOGIN */}
                    <TouchableOpacity
                        style={cadastro.linkDireita}
                        onPress={() => router.replace("/login")}
                        disabled={enviando}
                    >
                        <Text style={cadastro.textoLink}>
                            Voltar
                        </Text>
                    </TouchableOpacity>

                    {/* BOTAO DE CADASTRO */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            cadastro.botao,
                            enviando && { opacity: 0.7 }
                        ]}
                        onPress={handleCadastro}
                        disabled={enviando}
                    >
                        {enviando ? (
                            <ActivityIndicator
                                color={cores.textoBotao}
                            />
                        ) : (
                            <Text style={cadastro.textoBotao}>
                                Cadastrar
                            </Text>
                        )}
                    </TouchableOpacity>

                </View>
            </View>
        </ScrollView>
    );
}