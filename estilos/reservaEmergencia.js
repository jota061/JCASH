import { StyleSheet } from "react-native";
import { cores } from "../estilos/cores";

export const reservaEmergencia = StyleSheet.create({
    containerTela: {
        flex: 1,
        backgroundColor: cores.fundo,
        alignItems: "center",
        width: "100%",
        paddingBottom: 20
    },
    conteudoCentral: {
        width: "100%",
        paddingHorizontal: "10%",
        alignItems: "stretch"
    },
    cabecalho: {
        marginTop: 20
    },
    titulo: {
        color: cores.textoBranco,
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: 0.5
    },
    tituloDestaque: {
        color: cores.destaque
    },
    cartaoSaldo: {
        width: "100%",
        backgroundColor: cores.fundoCard,
        borderRadius: 16,
        padding: 20,
        marginTop: 20
    },
    tituloCartao: {
        color: cores.textoBranco,
        fontSize: 18,
        fontWeight: "500",
        marginBottom: 6
    },
    valorTotal: {
        color: cores.destaque,
        fontSize: 25,
        fontWeight: "bold"
    },
    detalheSaldo: {
        color: cores.textoCinzaMedio,
        fontSize: 12,
        marginTop: 8,
    },
    linhaAcoes: {
        flexDirection: "row",
        gap: 15,
        marginTop: 20
    },
    botaoAcaoGuardar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 55,
        borderRadius: 10,
        gap: 10,
        borderWidth: 2,
        backgroundColor: "#00E67610",
        borderColor: "#00E67640"
    },
    botaoAcaoResgatar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
        borderRadius: 10,
        gap: 10,
        borderWidth: 2,
        backgroundColor: "#FF525210",
        borderColor: "#FF525240"
    },
    textoBotaoGuardar: {
        fontWeight: "700",
        fontSize: 15,
        color: cores.destaque,
        letterSpacing: 0.5
    },
    textoBotaoResgatar: {
        fontWeight: "600",
        fontSize: 15,
        color: cores.erro,
        letterSpacing: 0.5
    },
    fundoModal: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.42)",
        justifyContent: "flex-end",
    },
    containerModal: {
        backgroundColor: "#18181B",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: "#27272A"
    },
    tituloModal: {
        color: cores.textoBranco,
        fontSize: 20,
        fontWeight: "bold"
    },
    subtituloModal: {
        color: "#A1A1AA",
        fontSize: 14,
        marginBottom: 16
    },
    conteinerInput: {
        position: "relative",
        justifyContent: "center",
        marginBottom: 10,
    },
    label: {
        color: cores.textoBranco,
        fontSize: 14,
        marginBottom: 6,
        fontWeight: "500",
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
    rotuloCampo: {
        color: "#D4D4D8",
        fontSize: 14,
        marginTop: 12,
        marginBottom: 8
    },
    containerCategorias: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20
    },
    pilulaCategoria: {
        backgroundColor: "#27272A",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20
    },
    pilulaCategoriaSelecionada: {
        backgroundColor: cores.erro
    },
    textoCategoria: {
        color: "#A1A1AA",
        fontSize: 13
    },
    textoCategoriaSelecionado: {
        color: cores.textoBranco,
        fontWeight: "bold"
    },
    acoesModal: {
        flexDirection: "row",
        gap: 12
    },
    botaoCancelar: {
        flex: 1,
        padding: 14,
        alignItems: "center"
    },
    textoCancelar: {
        color: cores.erro,
        fontWeight: "600"
    },
    botaoConfirmar: {
        flex: 2,
        backgroundColor: cores.destaque,
        borderRadius: 10,
        padding: 14,
        alignItems: "center"
    },
    textoConfirmar: {
        color: cores.textoBotao,
        fontWeight: "bold"
    }
});