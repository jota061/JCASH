
# JCASH - Teste completo do modulo de despesas
# Executar na pasta backend, depois de configurar a permissao DELETE no MariaDB.
# Utiliza apenas contas de teste e despesas criadas durante esta execucao.

$ErrorActionPreference = "Stop"
$servidor = "http://localhost:3001"
$idDespesa18 = $null
$idDespesa20 = $null
$cabecalho18 = $null
$cabecalho20 = $null
$testesAprovados = 0

function ConfirmarTeste($mensagem) {
    $script:testesAprovados++
    Write-Host "PASSOU - $mensagem"
}

# Exigir que uma requisicao falhe com o codigo HTTP esperado
function EsperarErroHttp($codigoEsperado, [scriptblock]$requisicao) {
    try {
        & $requisicao | Out-Null
    }
    catch {
        $resposta = $_.Exception.Response

        if (
            $null -ne $resposta -and
            [int]$resposta.StatusCode -eq $codigoEsperado
        ) {
            return
        }

        throw
    }

    throw "Era esperado HTTP $codigoEsperado, mas a requisicao foi aceita."
}

# Ler uma senha sem mostra-la no terminal
function LerSenha($mensagem) {
    $senhaSegura = Read-Host $mensagem -AsSecureString

    return (
        New-Object System.Net.NetworkCredential("", $senhaSegura)
    ).Password
}

# Autenticar sem exibir JWT nem senha
function FazerLogin($email, $senha) {
    $corpo = @{
        email = $email
        senha = $senha
    } | ConvertTo-Json

    return Invoke-RestMethod `
        -Uri "$servidor/autenticacao/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $corpo `
        -ErrorAction Stop
}

# Retornar as despesas visiveis ao usuario autenticado
function ConsultarDespesas($cabecalho) {
    $resultado = Invoke-RestMethod `
        -Uri "$servidor/despesas" `
        -Method Get `
        -Headers $cabecalho `
        -ErrorAction Stop

    return @($resultado.despesas)
}

# Remover somente os registros ficticios criados pelo teste
function LimparDespesaDeTeste($idDespesa, $cabecalho) {
    if ($null -eq $idDespesa -or $null -eq $cabecalho) {
        return
    }

    try {
        $despesas = @(ConsultarDespesas $cabecalho)

        $registro = @(
            $despesas |
            Where-Object { $_.id_despesa -eq $idDespesa }
        )

        if (
            $registro.Count -eq 1 -and
            $registro[0].nome -like "Teste Despesa JCASH *"
        ) {
            Invoke-RestMethod `
                -Uri "$servidor/despesas/$idDespesa" `
                -Method Delete `
                -Headers $cabecalho `
                -ErrorAction Stop | Out-Null

            Write-Host "LIMPEZA - Despesa ficticia $idDespesa removida."
        }
    }
    catch {
        Write-Host "ATENCAO - Nao foi possivel limpar a despesa $idDespesa."
    }
}

try {
    Write-Host "=== TESTES DO MODULO DE DESPESAS ==="
    Write-Host "Use apenas as contas ficticias de teste 18 e 20."
    Write-Host ""

    $textoCategoria = Read-Host "ID de uma categoria DESPESA global"
    $idCategoria = 0

    if (
        -not [int]::TryParse(
            $textoCategoria,
            [ref]$idCategoria
        ) -or $idCategoria -le 0
    ) {
        throw "Informe um ID de categoria valido."
    }

    $senha18 = LerSenha "Senha da conta de teste do usuario 18"
    $senha20 = LerSenha "Senha da conta de teste do usuario 20"

    # Autenticacao das contas ficticias
    $login18 = FazerLogin "teste.jcash.20261014@example.com" $senha18
    $login20 = FazerLogin "teste.isolamento.20261016@example.com" $senha20

    $senha18 = $null
    $senha20 = $null

    if (
        $login18.usuario.id_usuario -ne 18 -or
        $login20.usuario.id_usuario -ne 20
    ) {
        throw "As contas autenticadas nao sao as esperadas."
    }

    $cabecalho18 = @{
        Authorization = "Bearer $($login18.token)"
    }

    $cabecalho20 = @{
        Authorization = "Bearer $($login20.token)"
    }

    ConfirmarTeste "Autenticacao das contas 18 e 20"

    # Conferir protecao da consulta sem JWT
    EsperarErroHttp 401 {
        Invoke-RestMethod `
            -Uri "$servidor/despesas" `
            -Method Get `
            -ErrorAction Stop
    }

    ConfirmarTeste "Consulta sem JWT bloqueada (401)"

    # Gerar nomes exclusivos para os registros ficticios
    $identificadorTeste = [guid]::NewGuid().ToString("N").Substring(0, 8)

    $nome18 = "Teste Despesa JCASH A $identificadorTeste"
    $nome20 = "Teste Despesa JCASH B $identificadorTeste"
    $nome18Editado = "Teste Despesa JCASH A Editada $identificadorTeste"

    $dados18 = @{
        id_categoria = $idCategoria
        nome = $nome18
        valor = 12.34
        data = "2026-10-18"
    }

    $dados20 = @{
        id_categoria = $idCategoria
        nome = $nome20
        valor = 23.45
        data = "2026-10-18"
    }

    # Testar valor negativo
    $valorInvalido = $dados18.Clone()
    $valorInvalido.valor = -1

    EsperarErroHttp 400 {
        Invoke-RestMethod `
            -Uri "$servidor/despesas" `
            -Method Post `
            -Headers $cabecalho18 `
            -ContentType "application/json" `
            -Body ($valorInvalido | ConvertTo-Json) `
            -ErrorAction Stop
    }

    ConfirmarTeste "Valor negativo rejeitado (400)"

    # Testar data inexistente
    $dataInvalida = $dados18.Clone()
    $dataInvalida.data = "2026-02-30"

    EsperarErroHttp 400 {
        Invoke-RestMethod `
            -Uri "$servidor/despesas" `
            -Method Post `
            -Headers $cabecalho18 `
            -ContentType "application/json" `
            -Body ($dataInvalida | ConvertTo-Json) `
            -ErrorAction Stop
    }

    ConfirmarTeste "Data inexistente rejeitada (400)"

    # No JCASH, categoria 1 e do tipo ENTRADA
    $categoriaErrada = $dados18.Clone()
    $categoriaErrada.id_categoria = 1

    EsperarErroHttp 400 {
        Invoke-RestMethod `
            -Uri "$servidor/despesas" `
            -Method Post `
            -Headers $cabecalho18 `
            -ContentType "application/json" `
            -Body ($categoriaErrada | ConvertTo-Json) `
            -ErrorAction Stop
    }

    ConfirmarTeste "Categoria ENTRADA rejeitada (400)"

    # Cadastrar despesa ficticia do usuario 18
    $resposta18 = Invoke-RestMethod `
        -Uri "$servidor/despesas" `
        -Method Post `
        -Headers $cabecalho18 `
        -ContentType "application/json" `
        -Body ($dados18 | ConvertTo-Json) `
        -ErrorAction Stop

    $idDespesa18 = $resposta18.despesa.id_despesa

    if (
        $resposta18.status -ne "sucesso" -or
        $resposta18.despesa.id_usuario -ne 18 -or
        -not $idDespesa18 -or
        $resposta18.despesa.nome -ne $nome18
    ) {
        throw "Cadastro da despesa 18 retornou dados inesperados."
    }

    ConfirmarTeste "Cadastro da despesa do usuario 18 (201)"

    # Cadastrar despesa ficticia do usuario 20
    $resposta20 = Invoke-RestMethod `
        -Uri "$servidor/despesas" `
        -Method Post `
        -Headers $cabecalho20 `
        -ContentType "application/json" `
        -Body ($dados20 | ConvertTo-Json) `
        -ErrorAction Stop

    $idDespesa20 = $resposta20.despesa.id_despesa

    if (
        $resposta20.status -ne "sucesso" -or
        $resposta20.despesa.id_usuario -ne 20 -or
        -not $idDespesa20 -or
        $resposta20.despesa.nome -ne $nome20
    ) {
        throw "Cadastro da despesa 20 retornou dados inesperados."
    }

    ConfirmarTeste "Cadastro da despesa do usuario 20 (201)"

    # Testar isolamento das consultas
    $lista18 = @(ConsultarDespesas $cabecalho18)
    $lista20 = @(ConsultarDespesas $cabecalho20)

    if (
        @($lista18 | Where-Object { $_.id_despesa -eq $idDespesa18 }).Count -ne 1 -or
        @($lista18 | Where-Object { $_.id_despesa -eq $idDespesa20 }).Count -ne 0 -or
        @($lista20 | Where-Object { $_.id_despesa -eq $idDespesa20 }).Count -ne 1 -or
        @($lista20 | Where-Object { $_.id_despesa -eq $idDespesa18 }).Count -ne 0
    ) {
        throw "Falha no isolamento das consultas."
    }

    ConfirmarTeste "GET mostra somente as despesas do usuario"

    # Preparar os dados para edicao
    $dadosEditados = @{
        id_categoria = $idCategoria
        nome = $nome18Editado
        valor = 19.99
        data = "2026-10-17"
    }

    # Usuario 20 nao pode editar a despesa do usuario 18
    EsperarErroHttp 404 {
        Invoke-RestMethod `
            -Uri "$servidor/despesas/$idDespesa18" `
            -Method Put `
            -Headers $cabecalho20 `
            -ContentType "application/json" `
            -Body ($dadosEditados | ConvertTo-Json) `
            -ErrorAction Stop
    }

    ConfirmarTeste "Edicao por outro usuario bloqueada (404)"

    # Usuario 20 nao pode excluir a despesa do usuario 18
    EsperarErroHttp 404 {
        Invoke-RestMethod `
            -Uri "$servidor/despesas/$idDespesa18" `
            -Method Delete `
            -Headers $cabecalho20 `
            -ErrorAction Stop
    }

    ConfirmarTeste "Exclusao por outro usuario bloqueada (404)"

    # Garantir que o registro nao foi modificado indevidamente
    $lista18 = @(ConsultarDespesas $cabecalho18)

    $registro18 = @(
        $lista18 |
        Where-Object { $_.id_despesa -eq $idDespesa18 }
    )

    if (
        $registro18.Count -ne 1 -or
        $registro18[0].nome -ne $nome18
    ) {
        throw "A despesa foi alterada ou excluida indevidamente."
    }

    ConfirmarTeste "Despesa protegida continua intacta"

    # Editar a propria despesa
    $atualizacao = Invoke-RestMethod `
        -Uri "$servidor/despesas/$idDespesa18" `
        -Method Put `
        -Headers $cabecalho18 `
        -ContentType "application/json" `
        -Body ($dadosEditados | ConvertTo-Json) `
        -ErrorAction Stop

    if (
        $atualizacao.despesa.id_despesa -ne $idDespesa18 -or
        $atualizacao.despesa.nome -ne $nome18Editado -or
        [decimal]$atualizacao.despesa.valor -ne 19.99 -or
        $atualizacao.despesa.data -ne "2026-10-17"
    ) {
        throw "A atualizacao retornou dados inesperados."
    }

    ConfirmarTeste "Edicao autorizada atualiza os dados (200)"

    # Excluir a despesa do usuario 18
    $exclusao18 = Invoke-RestMethod `
        -Uri "$servidor/despesas/$idDespesa18" `
        -Method Delete `
        -Headers $cabecalho18 `
        -ErrorAction Stop

    if ($exclusao18.despesa.id_despesa -ne $idDespesa18) {
        throw "Exclusao do usuario 18 retornou outro ID."
    }

    ConfirmarTeste "Exclusao autorizada do usuario 18 (200)"

    # Excluir a despesa do usuario 20
    $exclusao20 = Invoke-RestMethod `
        -Uri "$servidor/despesas/$idDespesa20" `
        -Method Delete `
        -Headers $cabecalho20 `
        -ErrorAction Stop

    if ($exclusao20.despesa.id_despesa -ne $idDespesa20) {
        throw "Exclusao do usuario 20 retornou outro ID."
    }

    ConfirmarTeste "Exclusao autorizada do usuario 20 (200)"

    # Confirmar que ambas foram removidas
    $lista18 = @(ConsultarDespesas $cabecalho18)
    $lista20 = @(ConsultarDespesas $cabecalho20)

    if (
        @($lista18 | Where-Object { $_.id_despesa -eq $idDespesa18 }).Count -ne 0 -or
        @($lista20 | Where-Object { $_.id_despesa -eq $idDespesa20 }).Count -ne 0
    ) {
        throw "Uma despesa ficticia ainda aparece apos a exclusao."
    }

    ConfirmarTeste "Despesas ficticias removidas das consultas"

    Write-Host ""
    Write-Host "SUCESSO - $testesAprovados testes de despesas aprovados!"
}
catch {
    Write-Host ""
    Write-Host "TESTE INTERROMPIDO: $($_.Exception.Message)"
}
finally {
    # Tentar limpar registros de teste em caso de interrupcao
    LimparDespesaDeTeste $idDespesa18 $cabecalho18
    LimparDespesaDeTeste $idDespesa20 $cabecalho20

    Write-Host ""
    Write-Host "Fim dos testes do modulo de despesas."
}
