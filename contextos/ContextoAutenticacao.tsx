import * as SecureStore from "expo-secure-store";

import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    fazerLogin,
    verificarToken
} from "../servicos/servicoAutenticacao";

import type {
    UsuarioAutenticado
} from "../servicos/servicoAutenticacao";

// Chave utilizada para guardar o JWT no celular
const CHAVE_TOKEN = "jcash_token";

// Tempo maximo de espera para recuperar uma sessao
const TEMPO_LIMITE = 10000;

interface DadosContexto {
    usuario: UsuarioAutenticado | null;
    carregando: boolean;
    entrar: (email: string, senha: string) => Promise<void>;
    sair: () => Promise<void>;
}

const ContextoAutenticacao =
    createContext<DadosContexto | null>(null);

// Impedir que a recuperacao da sessao fique aguardando para sempre
function executarComPrazo<T>(
    tarefa: Promise<T>,
    tempoLimite: number
): Promise<T> {
    return new Promise((resolver, rejeitar) => {
        const temporizador = setTimeout(() => {
            rejeitar(
                new Error(
                    "Tempo limite para recuperar a sessao excedido."
                )
            );
        }, tempoLimite);

        tarefa.then((resultado) => {
            clearTimeout(temporizador);
            resolver(resultado);
        }).catch((erro) => {
            clearTimeout(temporizador);
            rejeitar(erro);
        });
    });
}

// Disponibilizar a autenticacao para todas as telas
export function ProvedorAutenticacao({
    children
}: {
    children: React.ReactNode;
}) {
    const [usuario, setUsuario] =
        useState<UsuarioAutenticado | null>(null);

    const [carregando, setCarregando] = useState(true);

    // Recuperar a sessao quando o aplicativo iniciar
    useEffect(() => {
        let ativo = true;

        async function verificarSessaoSalva():
            Promise<UsuarioAutenticado | null> {

            console.log("[JCASH] Consultando sessao salva...");

            const token = await SecureStore.getItemAsync(
                CHAVE_TOKEN
            );

            // Nenhum usuario possui sessao salva
            if (!token) {
                console.log("[JCASH] Nenhum token salvo.");
                return null;
            }

            console.log("[JCASH] Verificando token com a API...");

            const usuarioVerificado =
                await verificarToken(token);

            if (!usuarioVerificado) {
                console.log(
                    "[JCASH] Token invalido ou expirado."
                );

                await SecureStore.deleteItemAsync(
                    CHAVE_TOKEN
                );

                return null;
            }

            console.log("[JCASH] Sessao autenticada.");

            return usuarioVerificado;
        }

        async function recuperarSessao() {
            console.log(
                "[JCASH] Iniciando recuperacao da sessao."
            );

            try {
                const usuarioRecuperado =
                    await executarComPrazo(
                        verificarSessaoSalva(),
                        TEMPO_LIMITE
                    );

                if (ativo) {
                    setUsuario(usuarioRecuperado);
                }

            } catch (erro) {
                // Falhas de rede nao apagam o token salvo
                console.warn(
                    "[JCASH] Falha na recuperacao:",
                    erro instanceof Error
                        ? erro.message
                        : "Erro desconhecido"
                );

                if (ativo) {
                    setUsuario(null);
                }

            } finally {
                // Liberar a navegacao mesmo se a verificacao falhar
                if (ativo) {
                    setCarregando(false);

                    console.log(
                        "[JCASH] Inicializacao da sessao finalizada."
                    );
                }
            }
        }

        recuperarSessao();

        return () => {
            ativo = false;
        };
    }, []);

    // Fazer login e guardar o JWT de maneira protegida
    async function entrar(email: string, senha: string) {
        const resultado = await fazerLogin(email, senha);

        await SecureStore.setItemAsync(
            CHAVE_TOKEN,
            resultado.token
        );

        setUsuario(resultado.usuario);
    }

    // Encerrar a sessao do usuario
    async function sair() {
        await SecureStore.deleteItemAsync(CHAVE_TOKEN);
        setUsuario(null);
    }

    return (
        <ContextoAutenticacao.Provider
            value={{
                usuario,
                carregando,
                entrar,
                sair
            }}
        >
            {children}
        </ContextoAutenticacao.Provider>
    );
}

// Hook personalizado para consultar a autenticacao
export function useAutenticacao() {
    const contexto = useContext(ContextoAutenticacao);

    if (!contexto) {
        throw new Error(
            "A autenticacao deve estar dentro do provedor."
        );
    }

    return contexto;
}

// Manter compatibilidade com os arquivos que usam o nome anterior
export const usarAutenticacao = useAutenticacao;