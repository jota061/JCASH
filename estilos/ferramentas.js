import { StyleSheet } from "react-native";
import { cores } from "./cores";

export const ferramentas = StyleSheet.create({
    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
    },
    conteudoRolavel: {
        marginTop: 60,
        paddingHorizontal: 20, // Adicionado para dar respiro lateral no celular
        alignItems: "center",
    },
    titulo: {
        color: cores.textoBranco,
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: 0.5,
    },
    logo: {
        color: cores.destaque,
    },
    cardTexto: {
        width: "100%", // Alterado de 60% para 100%
        marginVertical: 15,
    },
    subTitulo: {
        color: cores.textoCinzaClaro,
        fontSize: 18, // Reduzido de 28
        fontWeight: "400",
        textAlign: "center", // Centralizado pro mobile
        marginBottom: 10,
    },
    containerItem: {
        flexDirection: "column",
        marginBottom: 15,
    },
    linhaItem: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    linhaDescricao: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginLeft: 20,
        marginTop: 4,
        width: "95%",
    },
    marcadorBolinha: {
        fontSize: 30,
        marginRight: 8,
        color: cores.textoCinzaClaro,
        lineHeight: 24,
    },
    marcadorSeta: {
        fontSize: 14,
        marginRight: 8,
        color: cores.textoCinzaClaro,
        lineHeight: 22,
        paddingTop: 1,
    },
    textFuncao: {
        color: cores.textoBranco,
        fontSize: 18,
        flex: 1,
        lineHeight: 24,
    },
    textDescricao: {
        color: cores.textoCinzaEscuro,
        fontSize: 16,
        flex: 1,
        lineHeight: 22,
        textAlign: "justify"
    },
})