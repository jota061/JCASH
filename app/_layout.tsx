import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider
} from "@react-navigation/native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import {
  ProvedorAutenticacao,
  useAutenticacao
} from "../contextos/ContextoAutenticacao";

// A rota inicial agora e o arquivo app/index.tsx
export const unstable_settings = {
  anchor: "index"
};

// Configurar as telas de acordo com a autenticacao
function Navegacao() {
  const { usuario, carregando } = useAutenticacao();

  const autenticado = usuario !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>

      {/* Rota inicial sempre disponivel */}
      <Stack.Screen name="index" />

      {/* Telas para usuarios nao autenticados */}
      <Stack.Protected
        guard={!carregando && !autenticado}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastroUsuario" />
        <Stack.Screen name="recuperar_senha" />
      </Stack.Protected>

      {/* Telas privadas do JCASH */}
      <Stack.Protected
        guard={!carregando && autenticado}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entrada" />
        <Stack.Screen name="despesas" />
        <Stack.Screen name="contas" />
        <Stack.Screen name="metas" />
        <Stack.Screen name="reservaEmergencia" />
        <Stack.Screen name="ferramentas" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="trocar_senha" />
      </Stack.Protected>

      {/* Tela publica */}
      <Stack.Screen name="sobre" />

    </Stack>
  );
}

// Layout principal do aplicativo
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <ProvedorAutenticacao>
        <Navegacao />
      </ProvedorAutenticacao>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}