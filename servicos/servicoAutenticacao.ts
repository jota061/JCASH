
import { ENDERECO_API } from "../configuracoes/configuracaoApi";

// Dados publicos devolvidos pela API
export interface UsuarioAutenticado {
    id_usuario: number;
    nome?: string;
    nome_social?: string;
    email?: string;
}

interface RespostaLogin {
    status: string;
    mensagem?: string;
    token?: string;
    usuario?: UsuarioAutenticado;
}

// Realizar o login utilizando o banco MariaDB pela API
export async function fazerLogin(
    email: string,
    senha: string
): Promise<{
    token: string;
    usuario: UsuarioAutenticado;
}> {
    let resposta: Response;

    try {
        resposta = await fetch(
            `${ENDERECO_API}/autenticacao/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    senha
                })
            }
        );
    } catch {
        throw new Error(
            "Não foi possível conectar à API. Verifique a rede e o servidor."
        );
    }

    const dados: RespostaLogin = await resposta.json();

    // Mostrar o erro devolvido pela API
    if (!resposta.ok) {
        throw new Error(
            dados.mensagem || "Não foi possível realizar o login."
        );
    }

    // Conferir se o servidor enviou os dados necessários
    if (
        dados.status !== "sucesso" ||
        !dados.token ||
        !dados.usuario ||
        !Number.isSafeInteger(dados.usuario.id_usuario)
    ) {
        throw new Error("A API retornou uma resposta de login inválida.");
    }

    return {
        token: dados.token,
        usuario: dados.usuario
    };
}

// Conferir se um JWT salvo continua valido
export async function verificarToken(
    token: string
): Promise<UsuarioAutenticado | null> {
    const resposta = await fetch(
        `${ENDERECO_API}/autenticacao/verificar`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (resposta.status === 401) {
        return null;
    }

    if (!resposta.ok) {
        throw new Error("Não foi possível verificar a sessão.");
    }

    const dados = await resposta.json();
    const idUsuario = dados?.usuario?.id_usuario;

    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        throw new Error("Dados da sessão inválidos.");
    }

    return {
        id_usuario: idUsuario
    };
}