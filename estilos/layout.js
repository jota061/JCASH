//ORIGINAL
import { StyleSheet } from "react-native";
import { cores } from "./cores";
export const estilosLayout = StyleSheet.create({
  containerTela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudoRolavel: {
    paddingTop: 20,
    paddingHorizontal: 20, // Adicionado para dar respiro lateral no celular
    alignItems: "center",
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
});
