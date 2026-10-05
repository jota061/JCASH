import { StyleSheet } from "react-native";
import { cores } from "./cores";

export const entradas = StyleSheet.create({
    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
        alignItems: "center",
        width: "100%",
        paddingBottom: 20,
    },
    conteudoCentral: {
        width: "100%",
        paddingHorizontal: "10%",
        alignItems: "stretch",
    },
    cabecalho: {
        marginTop: 20,
    },
    titulo: {
        color: cores.textoBranco,
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: 0.5,
        marginBottom: 20
    },
    tituloDestaque: {
        color: cores.destaque,
    },
    formulario: {
        width: "100%",
        backgroundColor: cores.fundoCard,
        borderRadius: 16,
        padding: 20,
        gap: 16,
    },
    conteinerInput: {
        position: "relative",
        justifyContent: "center",
    },
    label: {
        color: cores.textoBranco,
        fontSize: 14,
        marginBottom: 6,
        fontWeight: "500",
    },
    inputData: {
        height: 52,
        borderColor: cores.bordaInput,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 15,
        backgroundColor: cores.fundo,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    envolucroInput: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        borderColor: cores.bordaInput,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 15,
        backgroundColor: cores.fundo,
    },
    inputComIcone: {
        flex: 1,
        color: cores.textoBranco,
        fontSize: 15,
        height: "100%",
    },
    prefixoCifrao: {
        color: cores.textoCinzaClaro,
        fontSize: 15,
        fontWeight: "600",
        marginRight: 8,
    },
    iconeInput: {
        marginRight: 10,
    },
    inputErro: {
        borderColor: cores.erro,
    },
    erroTexto: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 6,
        paddingHorizontal: 4,
        fontWeight: "500",
    },
    botao: {
        backgroundColor: cores.destaque,
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    textoBotao: {
        color: cores.textoBotao,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
    },

    /* Estilos da Seção de Categorias */
    gridCategorias: {
        flexDirection: "row",
        gap: 8,
        paddingVertical: 4,
    },
    cardCategoria: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: cores.bordaInput,
        backgroundColor: cores.fundo,
    },
    cardCategoriaSelecionado: {
        backgroundColor: cores.destaque,
        borderColor: cores.destaque,
    },
    textoCategoria: {
        color: cores.textoCinzaClaro,
        fontSize: 13,
        fontWeight: "500",
    },
    textoCategoriaSelecionado: {
        color: cores.textoBotao,
        fontWeight: "700",
    },
    
});