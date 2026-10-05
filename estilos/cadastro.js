import { StyleSheet } from "react-native";
import { cores } from "./cores";
export const cadastro = StyleSheet.create({
    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
        alignItems: "center",
        justifyContent: "center",

        paddingHorizontal: 20
    },
    titulo: {
        fontSize: 26,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
        color: cores.textoBranco,
        letterSpacing: 0.5
    },
    logo: {
        color: cores.destaque,
    },
    subtitulo: {
        fontSize: 14,
        color: cores.textoCinzaMedio,
        textAlign: "center",
        marginBottom: 28,
        paddingHorizontal: 10
    },
    formulario: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: cores.fundoCard,
        borderRadius: 16,
        padding: 20,
        gap: 16,
    },
    envolucroInput: {
        position: "relative",
        justifyContent: "center"
    },
    iconeInput: {
        position: "absolute",
        left: 14,
        zIndex: 2
    },
    input: {
        height: 52,
        borderColor: cores.bordaInput,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingLeft: 46,
        paddingRight: 15,
        backgroundColor: cores.fundo,
        color: cores.textoBranco,
        fontSize: 15
    },
    inputErro: {
        borderColor: cores.erro
    },
    containerInputSenha: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        borderColor: cores.bordaInput,
        borderWidth: 1.5,
        borderRadius: 12,
        backgroundColor: cores.fundo,
        position: "relative"
    },
    inputSenha: {
        flex: 1,
        height: "100%",
        paddingLeft: 46,
        paddingRight: 46,
        color: cores.textoBranco,
        fontSize: 15,
        backgroundColor: "transparent"
    },
    containerIconeOlho: {
        position: "absolute",
        right: 0,
        height: "100%",
        justifyContent: "center",
        paddingHorizontal: 14,
        zIndex: 2
    },
    erroTexto: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 6,
        paddingHorizontal: 4,
        fontWeight: "500"
    },
    linkDireita: {
        alignSelf: "flex-end",
        marginVertical: 4
    },
    textoLink: {
        color: cores.textoCinzaMedio,
        fontSize: 13,
        fontWeight: "500"
    },
    botao: {
        backgroundColor: cores.destaque,
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12
    },
    textoBotao: {
        color: cores.textoBotao,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3
    }
})