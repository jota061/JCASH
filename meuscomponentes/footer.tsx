import { MaterialIcons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
// Pega a largura exata da tela do celular
const { width } = Dimensions.get("window");
export function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.conteudoPrincipal}>
        <Text style={styles.logo}>JCASH</Text>
        <View style={styles.gridColunas}>
          <View style={styles.coluna}>
            <Text style={styles.tituloColuna}>Sobre</Text>
            <Text style={styles.textoSobre}>
              O JCASH é uma plataforma inovadora focada em soluções financeiras ágeis, seguras e transparentes para simplificar a gestão do seu capital.
            </Text>
          </View>
          <View style={styles.coluna}>
            <Text style={styles.tituloColuna}>Contatos</Text>
            <TouchableOpacity style={styles.itemContato} onPress={() => Linking.openURL("tel:51997661864")}>
              <MaterialIcons name="phone" size={16} color="#00E676" />
              <Text style={styles.textoLink}>
                <Text style={styles.textoLinkBold}>Telefone: </Text>
                (51) 99766-1864
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.itemContato} onPress={() => Linking.openURL("https://instagram.com/_jota.061")}>
              <MaterialIcons name="camera-alt" size={16} color="#00E676" />
              <Text style={styles.textoLink}>
                <Text style={styles.textoLinkBold}>Instagram: </Text>
                _jota.061
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.itemContato} onPress={() => Linking.openURL("mailto:jpgoldschmidt1602@gmail.com")}>
              <MaterialIcons name="email" size={16} color="#00E676" />
              <Text style={styles.textoLink}>
                <Text style={styles.textoLinkBold}>Email: </Text>
                jpgoldschmidt1602@gmail.com
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.colunaVersao}>
            <Text style={styles.tituloColuna}>Versão</Text>
            <View style={styles.badgeVersao}>
              <Text style={styles.textoVersao}>1.0</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.textCopy}>&copy; Desenvolvido Por - João Paulo Goldschmidt Bezerra</Text>
        <Text style={styles.textCopy}>Senac Caxias do Sul - 2026</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  footer: {
    width: width, // Agora ocupa forçadamente a largura total da tela física
    backgroundColor: "#1A2026",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 30,
    marginTop: 40,
  },
  conteudoPrincipal: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 24, // Garante que o texto dentro do footer não cole na borda
    paddingBottom: 30,
  },
  logo: {
    fontSize: 28,
    color: "#00E676",
    fontWeight: "700",
    letterSpacing: 4,
    marginBottom: 24,
  },
  gridColunas: {
    flexDirection: "column",
    gap: 32,
    width: "100%",
  },
  coluna: {
    width: "100%",
  },
  colunaVersao: {
    marginTop: 10,
  },
  tituloColuna: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  textoSobre: {
    color: "#8A8D91",
    fontSize: 14,
    lineHeight: 22,
  },
  itemContato: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  textoLink: {
    color: "#8A8D91",
    fontSize: 14,
  },
  textoLinkBold: {
    fontWeight: "600",
    color: "#D0D3D6",
  },
  badgeVersao: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 230, 118, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 230, 118, 0.3)",
  },
  textoVersao: {
    color: "#00E676",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  copy: {
    width: "100%",
    backgroundColor: "#12161A",
    paddingVertical: 16,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  textCopy: {
    color: "#63676B",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
}); 
