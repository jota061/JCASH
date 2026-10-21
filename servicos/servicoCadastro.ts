import { ENDERECO_API } from "../configuracoes/configuracaoApi";

// Dados enviados para o cadastro
export interface DadosCadastro {
    nome: string;
    nome_social: string;
    email: string;
    senha: string;
}

// Dados publicos retornados pelo servidor
export interface UsuarioCadastrado {
    id_usuario: number;
    nome: string;
    nome_social: string;
    email: string;
}

interface RespostaCadastro {
    status: string;
    mensagem?: string;
    usuario?: UsuarioCadastrado;
}

// Cadastrar um novo usuario pela API JCASH
export async function cadastrarUsuario(
    dados: DadosCadastro
): Promise<UsuarioCadastrado> {
    // Evitar que uma requisicao fique aguardando indefinidamente
    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
        controlador.abort();
    }, 15000);

    try {
        const resposta = await fetch(
            `${ENDERECO_API}/autenticacao/cadastro`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: dados.nome.trim(),
                    nome_social: dados.nome_social.trim(),
                    email: dados.email.trim().toLowerCase(),
                    senha: dados.senha
                }),
                signal: controlador.signal
            }
        );

        let resultado: RespostaCadastro;

        try {
            resultado = await resposta.json();
        } catch {
            throw new Error(
                "A API retornou uma resposta inválida."
            );
        }

        // Apresentar mensagens de erro devolvidas pelo back-end
        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem ||
                "Não foi possível cadastrar o usuário."
            );
        }

        // Confirmar se o cadastro realmente foi realizado
        if (
            resposta.status !== 201 ||
            resultado.status !== "sucesso" ||
            !resultado.usuario ||
            !Number.isSafeInteger(resultado.usuario.id_usuario)
        ) {
            throw new Error(
                "O servidor retornou dados inesperados."
            );
        }

        return resultado.usuario;

    } catch (erro) {
        // A conexao demorou mais do que o limite permitido
        if (controlador.signal.aborted) {
            throw new Error(
                "A conexão demorou demais. Verifique se a conta foi criada antes de tentar novamente."
            );
        }

        // O celular nao conseguiu acessar a API
        if (erro instanceof TypeError) {
            throw new Error(
                "Não foi possível conectar à API. Verifique o Wi-Fi e o servidor JCASH."
            );
        }

        throw erro;

    } finally {
        clearTimeout(temporizador);
    }
}