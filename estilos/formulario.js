//ORIGINAL

import { StyleSheet } from "react-native";
import { cores } from "./cores";
export const formulario = StyleSheet.create({
    // TELA PRINCIPAL
    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
        alignItems: "center",
        justifyContent: "center",
        
        paddingHorizontal: 20, // Garante que o formulário não encoste nas bordas do celular
    },
    // TÍTULO
    titulo: {
        fontSize: 26, // Ligeiramente maior para dar mais peso no mobile
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
        color: cores.textoBranco,
        letterSpacing: 0.5, // Reduzido o espaçamento para não quebrar a linha precocemente
    },
    // LOGO
    logo: {
        color: cores.destaque,
    },
    // SUBTÍTULO
    subtitulo: {
        fontSize: 14,
        color: cores.textoCinzaMedio,
        textAlign: "center",
        marginBottom: 28, // Um pouco mais de respiro antes do cartão do formulário
        paddingHorizontal: 10,
    },
    // FORMULÁRIO (Cartão)
    formulario: {
        width: "100%",
        maxWidth: 360, // Trava perfeitamente na sua resolução
        backgroundColor: cores.fundoCard,
        borderRadius: 16,
        padding: 20, // Reduzido de 24 para 20 para os inputs ganharem largura útil
        gap: 16,
    },
    // CONTAINER DOS INPUTS
    envolucroInput: {
        position: "relative",
        justifyContent: "center",
    },
    // CONTAINER DOS INPUTS DE SENHA
    containerInputSenha: {
        flexDirection: "row",
        alignItems: "center",
        height: 52, // Ajustado sutilmente para harmonia no mobile
        borderColor: cores.bordaInput,
        borderWidth: 1.5,
        borderRadius: 12,
        backgroundColor: cores.fundo,
        position: "relative",
    },
    // INPUT NORMAL
    input: {
        height: 52, // Mesma altura da senha
        borderColor: cores.bordaInput,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingLeft: 46, // Espaço exato para o ícone não encostar no texto
        paddingRight: 15,
        backgroundColor: cores.fundo,
        color: cores.textoBranco,
        fontSize: 15,
    },
    // INPUT DE SENHA
    inputSenha: {
        flex: 1,
        height: "100%",
        paddingLeft: 46,
        paddingRight: 46, // Espaço garantido para o ícone do olho
        color: cores.textoBranco,
        fontSize: 15,
        backgroundColor: "transparent",
    },
    // ÍCONE DO LADO ESQUERDO
    iconeInput: {
        position: "absolute",
        left: 14,
        zIndex: 2,
    },
    // ÍCONE DO OLHO
    containerIconeOlho: {
        position: "absolute",
        right: 0,
        height: "100%",
        justifyContent: "center",
        paddingHorizontal: 14,
        zIndex: 2,
    },
    // INPUT COM ERRO
    inputErro: {
        borderColor: cores.erro,
    },
    // TEXTO DE ERRO
    erroTexto: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 6,
        paddingHorizontal: 4,
        fontWeight: "500",
    },
    // LINK À DIREITA (Ex: "Esqueci a senha")
    linkDireita: {
        alignSelf: "flex-end",
        marginVertical: 4,
    },
    // TEXTO DOS LINKS
    textoLink: {
        color: cores.textoCinzaMedio,
        fontSize: 13, // Levemente ajustado para um visual mais limpo
        fontWeight: "500",
    },
    // BOTÃO
    botao: {
        backgroundColor: cores.destaque,
        height: 52, // Mantendo a proporção dos inputs
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12, // Um respiro extra separando dos inputs
    },
    // TEXTO DO BOTÃO
    textoBotao: {
        color: cores.textoBotao,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
}); 
