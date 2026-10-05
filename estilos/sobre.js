import { StyleSheet } from "react-native";
import { cores } from "./cores";

export const sobre = StyleSheet.create({

    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
    },
    conteudoRolavel: {
        paddingHorizontal: 20, // Adicionado para dar respiro lateral no celular
        alignItems: "center",
        marginTop: 60,
    },
    titulo: {
        color: cores.textoBranco,
        fontSize: 28, // Reduzido de 40 para caber bem na tela
        fontWeight: "700", // Títulos mais fortes no mobile ficam melhores
        textAlign: "center",
        letterSpacing: 0.5,
    },
    logo: {
        color: cores.destaque,
    },
    cardTexto: {
        width: "100%",
        marginTop: 15,
    },
    subTitulo: {
        color: cores.textoCinzaClaro,
        fontSize: 18, // Reduzido de 28
        fontWeight: "400",
        textAlign: "center", // Centralizado pro mobile
        marginBottom: 10,
    },
    text: {
        color: cores.textoCinzaEscuro,
        width: "100%",
        textAlign: "justify",
        fontSize: 18,
        lineHeight: 30,
    },
})
