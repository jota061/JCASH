import { Redirect } from "expo-router";

import {
    ActivityIndicator,
    View
} from "react-native";

import {
    useAutenticacao
} from "../contextos/ContextoAutenticacao";

// Decidir a primeira tela do aplicativo
export default function Inicio() {
    const { usuario, carregando } = useAutenticacao();

    // Aguardar a verificacao da sessao salva
    if (carregando) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#101714"
                }}
            >
                <ActivityIndicator
                    size="large"
                    color="#00A86B"
                />
            </View>
        );
    }

    // Usuario autenticado: abrir a Home
    if (usuario) {
        return <Redirect href="/(tabs)/home" />;
    }

    // Sem sessao valida: abrir o login
    return <Redirect href="/login" />;
}