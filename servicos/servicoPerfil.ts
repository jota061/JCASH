import * as SecureStore from "expo-secure-store";

import {
    ENDERECO_API
} from "../configuracoes/configuracaoApi";

// Dados publicos do usuario
export interface UsuarioPerfil {
    id_usuario: number;
    nome: string;
    nome_social: string;
    email: string;
}

interface RespostaPerfil {
    status?: string;
    mensagem?: string;
    usuario?: UsuarioPerfil;
}

const CHAVE_TOKEN = "jcash_token";

// Enviar requisicoes autenticadas para o perfil
async function requisitarPerfil(
    metodo: "GET" | "PATCH",
    dados?: { nome_social: string }
): Promise<UsuarioPerfil> {
    // Recuperar o JWT armazenado no Expo SecureStore
    const token = await SecureStore.getItemAsync(CHAVE_TOKEN);

    if (!token) {
        throw new Error(
            "Sessão não encontrada. Entre novamente no JCASH."
        );
    }

    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
        controlador.abort();
    }, 12000);

    try {
        const resposta = await fetch(
            `${ENDERECO_API}/autenticacao/perfil`,
            {
                method: metodo,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: dados
                    ? JSON.stringify(dados)
                    : undefined,
                signal: controlador.signal
            }
        );

        let resultado: RespostaPerfil;

        try {
            resultado = await resposta.json();
        } catch {
            throw new Error(
                "A API retornou uma resposta inválida."
            );
        }

        if (!resposta.ok) {
            if (resposta.status === 401) {
                throw new Error(
                    "Sua sessão expirou. Saia da conta e entre novamente."
                );
            }

            throw new Error(
                resultado.mensagem ||
                "Não foi possível consultar o perfil."
            );
        }

        if (
            resultado.status !== "sucesso" ||
            !resultado.usuario ||
            !Number.isSafeInteger(resultado.usuario.id_usuario) ||
            typeof resultado.usuario.nome !== "string" ||
            typeof resultado.usuario.nome_social !== "string" ||
            typeof resultado.usuario.email !== "string"
        ) {
            throw new Error(
                "A API retornou dados inválidos do usuário."
            );
        }

        return resultado.usuario;

    } catch (erro) {
        if (controlador.signal.aborted) {
            throw new Error(
                "A conexão demorou demais. Verifique a rede."
            );
        }

        if (erro instanceof TypeError) {
            throw new Error(
                "Não foi possível conectar à API JCASH."
            );
        }

        throw erro;

    } finally {
        clearTimeout(temporizador);
    }
}

// Buscar os dados reais da conta
export async function consultarPerfil(): Promise<UsuarioPerfil> {
    return requisitarPerfil("GET");
}

// Atualizar o nome social no MariaDB
export async function salvarNomeSocial(
    nomeSocial: string
): Promise<UsuarioPerfil> {
    return requisitarPerfil("PATCH", {
        nome_social: nomeSocial.trim()
    });
}