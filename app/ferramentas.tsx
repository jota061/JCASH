import { View, Text, ScrollView, FlatList } from "react-native";
import { Stack } from "expo-router";
import { Footer } from "./../meuscomponentes/footer";
import { ferramentas } from "./../estilos/ferramentas"
const principal = [
    { id: "1", funcao: "Cadastrar Entrada", descricao: "Registrar todas as entradas ao longo do mês." },
    { id: "2", funcao: "Cadastrar Saída", descricao: "Registrar todas as saídas ao longo do mês." },
    { id: "3", funcao: "Consultar Saldo Atual", descricao: "Opção de visualizar o seu saldo atual." },
    { id: "4", funcao: "Cadastrar Despesas", descricao: "Cadastrar alguma conta que tenha um prazo à pagar (água, luz, internet, etc)." },
    { id: "5", funcao: "Editar Depesa", descricao: "Possibilita a edição de algum topíco da despesa (nome, valor ou data)." },
    { id: "6", funcao: "Excluir Depesa", descricao: "Possibilita a exclusão de alguma despesa, independente do motivo." },
    { id: "7", funcao: "Relatório Mensal", descricao: "Vizualização de todas as entradas, saídas, despesas, metas e etc..." },
];
const secundaria = [
    { id: "1", funcao: "Agenda", descricao: "Acompanhar as datas de vencimento das contas/despesas." },
    { id: "2", funcao: "Notificação", descricao: "Receber alertas/notificações de quando o prazo de vencimento de uma conta/despesa está chegando ou já chegou." },
    { id: "3", funcao: "Cadastrar Metas", descricao: "Crie uma meta financeira estipulando o valor total e a data limite. Acompanhe a evolução do seu saldo conforme for guardando e fique cada vez mais perto do seu objetivo." },
    { id: "4", funcao: "Pesquisar despesas", descricao: "Possibilidade de pesquisar despesar por valor ou nome." },
    { id: "5", funcao: "Gráficos", descricao: "Visualizar em forma de gráficos " },
];
export default function Ferramentas() {
    return (
        <View style={ferramentas.containerTela}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ferramentas.conteudoRolavel}>
                <Text style={ferramentas.titulo}>Ferramentas do <Text style={ferramentas.logo}>JCASH</Text></Text>
                <View style={ferramentas.cardTexto}>
                    <Text style={ferramentas.subTitulo}>Ferramentas Principais</Text>
                    <FlatList
                        data={principal}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={ferramentas.containerItem}>
                                <View style={ferramentas.linhaItem}>
                                    <Text style={ferramentas.marcadorBolinha}>•</Text>
                                    <Text style={ferramentas.textFuncao}>{item.funcao}</Text>
                                </View>
                                <View style={ferramentas.linhaDescricao}>
                                    <Text style={ferramentas.marcadorSeta}>➢</Text>
                                    <Text style={ferramentas.textDescricao}>{item.descricao}</Text>
                                </View>
                            </View>
                        )} />
                </View>
                <View style={ferramentas.cardTexto}>
                    <Text style={ferramentas.subTitulo}>Ferramentas Secundárias</Text>
                    <FlatList
                        data={secundaria}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={ferramentas.containerItem}>
                                <View style={ferramentas.linhaItem}>
                                    <Text style={ferramentas.marcadorBolinha}>•</Text>
                                    <Text style={ferramentas.textFuncao}>{item.funcao}</Text>
                                </View>
                                <View style={ferramentas.linhaDescricao}>
                                    <Text style={ferramentas.marcadorSeta}>➢</Text>
                                    <Text style={ferramentas.textDescricao}>{item.descricao}</Text>
                                </View>
                            </View>
                        )} />
                </View>
                <Footer />
            </ScrollView>
        </View>
    );
}
