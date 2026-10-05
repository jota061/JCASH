import { StyleSheet } from "react-native";
import { cores } from "./cores";

export const contas = StyleSheet.create({
    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
    },
    scrollContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingBottom: 80,
        marginTop: 50
    },
    conteudoCentral: {
        width: "100%",
        paddingHorizontal: "5%",
        alignItems: "stretch",
    },
    topo: {
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
    logo: {
        color: cores.destaque,
    },
    /* Formulário */
    formulario: {
        width: "100%",
        backgroundColor: cores.fundoCard,
        borderRadius: 16,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: cores.bordaInput,
        marginBottom: 20,
    },
    tituloFormulario: {
        color: cores.textoBranco,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
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
    /* Categorias */
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
    /* Toggle Mensal vs Data Única */
    toggleContainer: {
        flexDirection: "row",
        gap: 10,
    },
    btnToggle: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 46,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: cores.bordaInput,
        backgroundColor: cores.fundo,
    },
    btnToggleAtivo: {
        backgroundColor: cores.destaque,
        borderColor: cores.destaque,
    },
    textoToggle: {
        color: cores.textoCinzaClaro,
        fontSize: 13,
        fontWeight: "500",
    },
    textoToggleAtivo: {
        color: cores.textoBotao,
        fontWeight: "700",
    },
    /* Botão Submit */
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
    /* Lista de contas */
    secaoLista: {
        width: "100%",
        marginTop: 10,
    },
    tituloSecao: {
        color: cores.textoBranco,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        marginLeft: 4,
    },
    cardContaItem: {
        backgroundColor: cores.fundoCard,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: cores.bordaInput,
        width: "100%",
    },
    infoContaItem: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 8,
    },
    textosConta: {
        marginLeft: 10,
        flex: 1,
    },
    nomeContaItem: {
        color: cores.textoBranco,
        fontSize: 14,
        fontWeight: "600",
    },
    detalheContaItem: {
        color: cores.textoCinzaMedio,
        fontSize: 11,
        marginTop: 2,
    },
    acoesContainer: {
        alignItems: "flex-end",
        justifyContent: "center",
        minWidth: 65,
    },
    valorContaItem: {
        fontSize: 14,
        fontWeight: "700",
        color: cores.textoBranco
    },
    iconesAcoes: {
        flexDirection: "row",
        marginTop: 6,
        gap: 4,
    },
    btnAcao: {
        padding: 4,
    },
    statusConta: {
        fontSize: 11,
        fontWeight: "700",
        marginTop: 5,
    },
    statusPendente: {
        color: cores.textoCinzaClaro,
    },
    statusAtrasada: {
        color: cores.erro,
    },
    statusPaga: {
        color: cores.destaque,
    }
});