import { StyleSheet } from "react-native";
import { cores } from "./cores";
export const home = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  usuarioInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  boasVindasContainer: {
    justifyContent: "center",
  },
  textoBoasVindas: {
    color: cores.textoCinzaEscuro,
    fontSize: 18,
  },
  nomeUsuario: {
    color: cores.textoBranco,
    fontSize: 18,
    fontWeight: "700",
  },
  headerAcoes: {
    flexDirection: "row",
    gap: 10,
  },
  botaoIconeHeader: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: cores.fundoCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.bordaInput,
  },
  badgeNotificacao: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: cores.destaque,
  },
  // Card Saldo Principal
  cardSaldoPrincipal: {
    backgroundColor: cores.fundoCard,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: cores.bordaInput,
    elevation: 4,
  },
  labelSaldo: {
    color: cores.textoCinzaMedio,
    fontSize: 13,
    fontWeight: "500",
  },
  valorSaldoPrincipal: {
    color: cores.textoBranco,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  divisorCard: {
    height: 2,
    backgroundColor: cores.bordaInput,
    marginVertical: 16,
  },
  gridFluxoCaixa: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemFluxo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circuloIconeEntradas: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 230, 118, 0.15)"
  },
  circuloIconeSaidas: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 82, 82, 0.15)"
  },
  labelFluxo: {
    color: cores.textoCinzaEscuro,
    fontSize: 11,
  },
  valorEntrada: {
    color: cores.destaque,
    fontSize: 14,
    fontWeight: "600",
  },
  valorSaida: {
    color: cores.erro,
    fontSize: 14,
    fontWeight: "600",
  },
  // Saldo Livre
  cardLinhaInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 230, 118, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 230, 118, 0.2)",
  },
  textoLinhaInfo: {
    color: cores.textoCinzaClaro,
    fontSize: 12,
  },
  destaqueValorLivre: {
    color: cores.destaque,
    fontWeight: "700",
  },
  textoSubInfo: {
    color: cores.textoCinzaEscuro,
    fontSize: 11,
  },
  // Ações Rápidas
  tituloSessao: {
    color: cores.textoBranco,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 4
  },
  cardAcoes: {
    backgroundColor: cores.fundoCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.bordaInput,
  },
  acoes: {
    flexDirection: "row",
    flexWrap: "wrap", // Permite que os itens pulem para a linha de baixo
    justifyContent: "space-between",
    rowGap: 16, // Adiciona o espaçamento vertical entre as duas linhas de botões
  },
  botaoAcaoRapida: {
    alignItems: "center",
    width: "18%", // Garante que caibam exatos 5 itens (5 * 18 = 90%), o space-between cuida do restante
  },
  iconeAcao: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: cores.fundo, // Mudei para 'fundo' normal para dar um leve contraste de profundidade dentro do card
    borderWidth: 1,
    borderColor: cores.bordaInput,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  textoAcaoRapida: {
    color: cores.textoCinzaMedio,
    fontSize: 11, // Fonte ligeiramente menor para evitar que os nomes quebrem linha e desalinhem
    fontWeight: "500",
    textAlign: "center",
  },
  // Cards Padrão
  cardPadrao: {
    backgroundColor: cores.fundoCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.bordaInput,
    marginTop: 12,
  },
  headerCardPadrao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tituloSubCard: {
    color: cores.textoBranco,
    fontSize: 14,
    fontWeight: "600",
  },
  porcentagemTexto: {
    color: cores.destaque,
    fontSize: 13,
    fontWeight: "700",
  },
  trilhaoBarra: {
    height: 8,
    backgroundColor: cores.fundo,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 8,
  },
  // Dica Financeira / Educação Financeira
  cardDica: {
    backgroundColor: cores.fundoCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.bordaInput,
    marginTop: 14,
  },
  headerDica: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  tituloDica: {
    color: cores.destaque,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  subtituloDica: {
    color: cores.textoBranco,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  descricaoDica: {
    color: cores.textoCinzaMedio,
    fontSize: 12,
    lineHeight: 18,
  },
  // Grid Metas e Gamificação
  gridDoisCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tituloMetaCard: {
    color: cores.textoBranco,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  detalheMeta: {
    color: cores.textoBranco,
    fontSize: 16,
    marginTop: 4,
  },
  subDesafio: {
    color: cores.textoCinzaClaro,
    fontSize: 11,
    marginTop: 2,
  },
  statusDesafio: {
    color: cores.destaque,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
  // Lista de Transações
  headerSessaoComLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  tituloComVisibilidade: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tituloSessaoComMargem: {
    color: cores.textoBranco,
    fontSize: 17,
    fontWeight: "700",
    paddingLeft: 4,
  },
  botaoOcultarMovimentacoes: {
    padding: 4,
  },
  cardListaTransacoes: {
    backgroundColor: cores.fundoCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: cores.bordaInput,
    marginTop: 2,
  },
  itemTransacao: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconeTransacaoContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: cores.fundo,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.bordaInput,
  },
  infoTransacao: {
    flex: 1,
    marginLeft: 12,
  },
  tituloTransacao: {
    color: cores.textoBranco,
    fontSize: 14,
    fontWeight: "600",
  },
  subtituloTransacao: {
    color: cores.textoCinzaEscuro,
    fontSize: 11,
    marginTop: 2,
  },
  valorTransacao: {
    fontSize: 14,
    fontWeight: "700",
  },
  separadorItem: {
    height: 1,
    backgroundColor: cores.bordaInput,
  }
}); 
