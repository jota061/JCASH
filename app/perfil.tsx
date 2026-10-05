import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cores } from "../estilos/cores";
import { perfil } from "../estilos/perfil";

interface Usuario {
    id: string;
    nome: string;
    nomeSocial: string;
    email: string;
}

const MOCK_DATA_USUARIO: Usuario = {
    id: "usr_12345",
    nome: "João Paulo Goldschmidt Bezerra",
    nomeSocial: "Jota",
    email: "jpgoldschmidt1602@gmail.com",
};

export default function PerfilUsuarioScreen() {
    const router = useRouter();

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [modalNomeSocial, setModalNomeSocial] = useState(false);
    const [novoNomeSocial, setNovoNomeSocial] = useState("");
    const [erroNomeSocial, setErroNomeSocial] = useState(false);

    useEffect(() => {
        buscarDadosUsuario();
    }, []);

    const buscarDadosUsuario = () => {
        try {
            setUsuario(MOCK_DATA_USUARIO);
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível carregar os dados do usuário.");
        }
    };

    const abrirEdicaoNomeSocial = () => {
        setNovoNomeSocial(usuario?.nomeSocial ?? "");
        setErroNomeSocial(false);
        setModalNomeSocial(true);
    };

    const salvarNomeSocial = () => {
        const nomeSocialLimpo = novoNomeSocial.trim();

        if (!nomeSocialLimpo) {
            setErroNomeSocial(true);
            Alert.alert("Campo obrigatório", "Informe um nome social.");
            return;
        }

        setUsuario((atual) => (atual ? { ...atual, nomeSocial: nomeSocialLimpo } : atual));
        setModalNomeSocial(false);
        Alert.alert("Sucesso", "Nome social atualizado com sucesso.");
    };

    const handleExcluirConta = () => {
        Alert.alert(
            "Excluir Conta",
            "Tem certeza que deseja excluir sua conta? Esta ação é irreversível e também apagará os dados financeiros associados.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                        console.log("Conta excluída ID:", usuario?.id);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={perfil.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={perfil.conteudoRolavel}>
                <View style={perfil.containerFoto}>
                    <View style={perfil.wrapperIcone}>
                        <Ionicons name="person-circle-outline" size={120} color={cores.destaque} />
                        <View style={perfil.badgeCamera}>
                            <Ionicons name="camera" size={16} color={cores.textoBotao} />
                        </View>
                    </View>
                </View>

                <View style={perfil.formulario}>
                    <Text style={perfil.tituloSecao}>Dados Pessoais</Text>

                    <View style={perfil.cardInfo}>
                        <Ionicons name="person-outline" size={20} color={cores.textoCinzaMedio} />
                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>Nome Completo</Text>
                            <Text style={perfil.valorInfo}>{usuario?.nome}</Text>
                        </View>
                    </View>

                    <View style={perfil.cardInfo}>
                        <Ionicons name="person-outline" size={20} color={cores.textoCinzaMedio} />
                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>Nome Social</Text>
                            <Text style={perfil.valorInfo}>{usuario?.nomeSocial}</Text>
                        </View>
                        <TouchableOpacity onPress={abrirEdicaoNomeSocial} style={perfil.btnAcao}>
                            <Ionicons name="pencil-outline" size={18} color={cores.textoCinzaClaro} />
                        </TouchableOpacity>
                    </View>

                    <View style={perfil.cardInfo}>
                        <Ionicons name="mail-outline" size={20} color={cores.textoCinzaMedio} />
                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>E-mail</Text>
                            <Text style={perfil.valorInfo}>{usuario?.email}</Text>
                        </View>
                    </View>

                    <View style={perfil.cardInfo}>
                        <Ionicons name="lock-closed-outline" size={20} color={cores.textoCinzaMedio} />
                        <View style={perfil.textosInfo}>
                            <Text style={perfil.rotuloInfo}>Senha</Text>
                            <Text style={perfil.valorInfo}>••••••••</Text>
                            <Text style={perfil.observacaoSenha}>A senha não pode ser visualizada.</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={perfil.botaoEditar} activeOpacity={0.8} onPress={() => router.push("/trocar_senha")}>
                    <Ionicons name="pencil-outline" size={20} color={cores.destaque} />
                    <Text style={perfil.textoBotaoEditar}>Alterar Senha</Text>
                </TouchableOpacity>

                <TouchableOpacity style={perfil.botaoExcluir} activeOpacity={0.8} onPress={handleExcluirConta}>
                    <Ionicons name="trash-outline" size={20} color={cores.erro} />
                    <Text style={perfil.textoBotaoExcluir}>Excluir Conta</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={modalNomeSocial} transparent animationType="fade" onRequestClose={() => setModalNomeSocial(false)}>
                <View style={perfil.fundoModal}>
                    <View style={perfil.containerModal}>
                        <Text style={perfil.tituloModal}>Editar Nome Social</Text>
                        <Text style={perfil.subtituloModal}>Esse nome será exibido na tela inicial.</Text>

                        <TextInput
                            style={[perfil.inputModal, erroNomeSocial && perfil.inputModalErro]}
                            value={novoNomeSocial}
                            onChangeText={(texto) => {
                                setNovoNomeSocial(texto);
                                if (texto.trim()) setErroNomeSocial(false);
                            }}
                            placeholder="Nome social"
                            placeholderTextColor={cores.textoPlaceholder}
                            autoCapitalize="words"
                            autoCorrect={false}
                        />

                        {erroNomeSocial && <Text style={perfil.erroModal}>Informe o nome social.</Text>}

                        <View style={perfil.acoesModal}>
                            <TouchableOpacity style={perfil.botaoCancelarModal} onPress={() => setModalNomeSocial(false)}>
                                <Text style={perfil.textoCancelarModal}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={perfil.botaoSalvarModal} onPress={salvarNomeSocial}>
                                <Text style={perfil.textoSalvarModal}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
