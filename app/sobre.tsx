import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Footer } from "./../meuscomponentes/footer";
import { sobre } from "./../estilos/sobre";
export default function Sobre() {
  return (
      <View style={sobre.containerTela}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sobre.conteudoRolavel}>
          <Text style={sobre.titulo}>Sobre o <Text style={sobre.logo}>JCASH</Text></Text>
          <View style={sobre.cardTexto}>
          <Text style={sobre.subTitulo}>Desenvolvedor</Text>
          <Text style={sobre.text}>
            Olá! Eu sou o João Paulo Goldschmidt Bezerra, natural de Brasília - DF, mas atualmente moro em Caxias do Sul - RS.
            Tenho 17 anos e estou cursando o terceiro ano do Ensino Médio no Senac Caxias do Sul.
            Descobri que gostava de programar logo quando entrei no ensino médio.
            Com o passar do tempo, esse interesse só aumentou especialmente no último ano escolar, quando comecei a aprender React Native, Node.js e Banco de Dados.
            A inspiração do meu professor de técnico foi um dos principais motivos para eu desenvolver esse gosto pela programação.
            Desde então, comecei a me dedicar e me aprofundar cada vez mais. Com isso, fui adquirindo mais confiança no que faço e a
            certeza de que é nessa área que quero construir minha carreira profissional.
          </Text>
        </View>
        <View style={sobre.cardTexto}>
          <Text style={sobre.subTitulo}>Apresentação do Projeto</Text>
          <Text style={sobre.text}>
            O projeto JCASH é uma aplicação desenvolvida com as tecnologias citadas acima e com o objetivo de auxiliar os usuários
            no gerenciamento de suas finanças pessoais. Através de interfaces intuitivas e fáceis de serem usadas,
            contendo recursos de acessibilidade, o aplicativo permite que os usuários registrem suas receitas, despesas,
            metas financeiras, visualizem graficamente suas finanças e recebam alertas em forma
            de notificação de quando um prazo de pagamento de uma conta estiver próximo de vencer, ajudando assim a evitar atrasos e multas.
          </Text>
        </View>
        <View style={sobre.cardTexto}>
          <Text style={sobre.subTitulo}>Motivação do Projeto</Text>
          <Text style={sobre.text}>
            Como sou jovem e ainda não tenho muita experiência de como lidar com o meu próprio dinheiro, percebi que esse tipo de
            ferramenta seria muito útil para mim. Outra motivação para esse projeto foi que muitas pessoas enfrentam o mesmo tipo de
            problema ou algo parecido, e por isso decidi desenvolver esse aplicativo web.
          </Text>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
