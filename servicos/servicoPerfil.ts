
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

interface RespostaAlteracaoSenha {
    status?: string;
    mensagem?: string;
}

interface RespostaExclusaoConta {
    status?: string;
    mensagem?: string;
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

// Solicitar a alteracao da senha do usuario autenticado
export async function alterarSenhaPerfil(
    senhaAtual: string,
    novaSenha: string
): Promise<void> {
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
            `${ENDERECO_API}/autenticacao/perfil/senha`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    senha_atual: senhaAtual,
                    nova_senha: novaSenha
                }),
                signal: controlador.signal
            }
        );

        let resultado: RespostaAlteracaoSenha;

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
                "Não foi possível alterar a senha."
            );
        }

        if (resultado.status !== "sucesso") {
            throw new Error(
                "A API não confirmou a alteração da senha."
            );
        }

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

// Solicitar a exclusao definitiva da conta autenticada
export async function excluirContaPerfil(
    senhaAtual: string
): Promise<void> {
    // A exclusao exige a confirmacao da senha atual
    if (
        typeof senhaAtual !== "string" ||
        senhaAtual.length === 0
    ) {
        throw new Error(
            "Informe sua senha atual para excluir a conta."
        );
    }

    // Recuperar o JWT da sessao atual
    const token = await SecureStore.getItemAsync(CHAVE_TOKEN);

    if (!token) {
        throw new Error(
            "Sessão não encontrada. Entre novamente no JCASH."
        );
    }

    const controlador = new AbortController();

    // A exclusao pode envolver varios registros no banco
    const temporizador = setTimeout(() => {
        controlador.abort();
    }, 30000);

    try {
        const resposta = await fetch(
            `${ENDERECO_API}/autenticacao/perfil`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    senha_atual: senhaAtual
                }),
                signal: controlador.signal
            }
        );

        let resultado: RespostaExclusaoConta;

        try {
            resultado = await resposta.json();
        } catch {
            throw new Error(
                "Não foi possível confirmar o resultado da exclusão. " +
                "Verifique o estado da conta antes de tentar novamente."
            );
        }

        // Apresentar os erros devolvidos pela API
        if (!resposta.ok) {
            if (resposta.status === 401) {
                throw new Error(
                    "Sua sessão expirou. Entre novamente no JCASH."
                );
            }

            throw new Error(
                resultado.mensagem ||
                "Não foi possível excluir a conta."
            );
        }

        // Confirmar que o servidor informou sucesso
        if (resultado.status !== "sucesso") {
            throw new Error(
                "A API não confirmou a exclusão da conta. " +
                "Verifique o estado da conta antes de tentar novamente."
            );
        }

        // A funcao termina somente apos a confirmacao da API

    } catch (erro) {
        if (controlador.signal.aborted) {
            throw new Error(
                "A solicitação demorou demais. A exclusão pode ter " +
                "sido concluída. Verifique o estado da conta " +
                "antes de tentar novamente."
            );
        }

        if (erro instanceof TypeError) {
            throw new Error(
                "Ocorreu uma falha de conexão. Não foi possível " +
                "confirmar se a conta foi excluída. " +
                "Verifique antes de tentar novamente."
            );
        }

        throw erro;

    } finally {
        clearTimeout(temporizador);
    }
}
