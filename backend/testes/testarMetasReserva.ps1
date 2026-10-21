
# Testes dos modulos de metas e reserva do JCASH
# Os testes criam um historico ficticio.
# Nao execute duas vezes sem verificar.

$ErrorActionPreference = "Stop"
$api = "http://localhost:3001"
$aprovados = 0

$idMetaTeste = $null
$idMovimentoAporte = $null
$idMovimentoResgate = $null

function Passou($descricao) {
    $script:aprovados++
    Write-Host "PASSOU - $descricao"
}

function EsperarErro($codigo, [scriptblock]$acao) {
    try {
        & $acao | Out-Null
    }
    catch {
        if (
            $_.Exception.Response -and
            [int]$_.Exception.Response.StatusCode -eq $codigo
        ) {
            return
        }

        throw
    }

    throw "Era esperado HTTP $codigo, mas a API aceitou a requisicao."
}

function LerSenha($mensagem) {
    $segura = Read-Host $mensagem -AsSecureString

    return (
        New-Object System.Net.NetworkCredential("", $segura)
    ).Password
}

function Chamar($metodo, $caminho, $cabecalho = @{}, $dados = $null) {
    $argumentos = @{
        Method = $metodo
        Uri = "$api$caminho"
        Headers = $cabecalho
        ErrorAction = "Stop"
    }

    if ($null -ne $dados) {
        $argumentos.ContentType = "application/json"
        $argumentos.Body = ($dados | ConvertTo-Json -Depth 5)
    }

    return Invoke-RestMethod @argumentos
}

function Login($email, $senha) {
    return Chamar "Post" "/autenticacao/login" @{} @{
        email = $email
        senha = $senha
    }
}

try {
    Write-Host "=== JCASH: METAS E RESERVA ==="

    $idCategoriaMeta = [int](
        Read-Host "ID de categoria global META"
    )

    $idCategoriaReserva = [int](
        Read-Host "ID de categoria global RESERVA"
    )

    if ($idCategoriaMeta -le 0 -or $idCategoriaReserva -le 0) {
        throw "Os IDs das categorias devem ser positivos."
    }

    $senha18 = LerSenha "Senha da conta ficticia 18"
    $senha20 = LerSenha "Senha da conta ficticia 20"

    $login18 = Login "teste.jcash.20261014@example.com" $senha18
    $login20 = Login "teste.isolamento.20261016@example.com" $senha20

    $senha18 = $null
    $senha20 = $null

    if (
        $login18.usuario.id_usuario -ne 18 -or
        $login20.usuario.id_usuario -ne 20
    ) {
        throw "As contas autenticadas nao possuem os IDs esperados."
    }

    $cab18 = @{
        Authorization = "Bearer $($login18.token)"
    }

    $cab20 = @{
        Authorization = "Bearer $($login20.token)"
    }

    Passou "Autenticacao dos usuarios 18 e 20"

    # Verificar protecao das rotas
    EsperarErro 401 {
        Chamar "Get" "/metas" | Out-Null
    }

    Passou "Metas protegidas sem JWT"

    EsperarErro 401 {
        Chamar "Get" "/reserva" | Out-Null
    }

    Passou "Reserva protegida sem JWT"

    # Preparar meta ficticia
    $marca = [guid]::NewGuid().ToString("N").Substring(0, 8)

    $dadosMeta = @{
        nome = "Teste Meta JCASH $marca"
        id_categoria = $idCategoriaMeta
        valor_meta = 100.00
        data_limite = (Get-Date).AddMonths(4).ToString("yyyy-MM-dd")
    }

    # Valor negativo
    $metaInvalida = $dadosMeta.Clone()
    $metaInvalida.valor_meta = -5

    EsperarErro 400 {
        Chamar "Post" "/metas" $cab18 $metaInvalida
    }

    Passou "Valor negativo de meta bloqueado"

    # Categoria incorreta
    $metaInvalida = $dadosMeta.Clone()
    $metaInvalida.id_categoria = 1

    EsperarErro 400 {
        Chamar "Post" "/metas" $cab18 $metaInvalida
    }

    Passou "Categoria de entrada bloqueada para meta"

    # Cadastrar meta
    $cadastro = Chamar "Post" "/metas" $cab18 $dadosMeta
    $idMetaTeste = $cadastro.meta.id_meta

    if (
        -not $idMetaTeste -or
        $cadastro.meta.id_usuario -ne 18 -or
        $cadastro.meta.percentual -ne 0
    ) {
        throw "Cadastro de meta retornou dados inesperados."
    }

    Passou "Cadastro de meta com progresso zero"

    # Outro usuario nao pode consultar a meta
    $metas20 = Chamar "Get" "/metas" $cab20

    if (
        @(
            $metas20.metas |
            Where-Object { $_.id_meta -eq $idMetaTeste }
        ).Count -ne 0
    ) {
        throw "Meta do usuario 18 apareceu para o usuario 20."
    }

    Passou "Isolamento das metas entre usuarios"

    # Outro usuario nao pode adicionar aportes
    EsperarErro 404 {
        Chamar "Post" "/metas/$idMetaTeste/aportes" `
            $cab20 @{ valor = 20 }
    }

    Passou "Aporte por outro usuario bloqueado"

    # Nao permitir aporte negativo
    EsperarErro 400 {
        Chamar "Post" "/metas/$idMetaTeste/aportes" `
            $cab18 @{ valor = -1 }
    }

    Passou "Aporte negativo bloqueado"

    # Registrar dois aportes
    $aporte1 = Chamar "Post" "/metas/$idMetaTeste/aportes" `
        $cab18 @{ valor = 50 }

    $aporte2 = Chamar "Post" "/metas/$idMetaTeste/aportes" `
        $cab18 @{ valor = 80 }

    if (
        -not $aporte1.aporte.id_aporte -or
        -not $aporte2.aporte.id_aporte
    ) {
        throw "Aportes nao foram registrados."
    }

    Passou "Dois aportes positivos registrados"

    # Confirmar progresso superior a 100%
    $resultadoMeta = Chamar "Get" "/metas/$idMetaTeste" $cab18

    if (
        [decimal]$resultadoMeta.meta.total_aportado -ne 130 -or
        [decimal]$resultadoMeta.meta.percentual -ne 130 -or
        [decimal]$resultadoMeta.meta.percentual_visual -ne 100
    ) {
        throw "Progresso de 130 por cento incorreto."
    }

    Passou "Meta permite 130 por cento e limita barra a 100"

    # Consultar historico de aportes
    $aportes = Chamar "Get" "/metas/$idMetaTeste/aportes" $cab18

    if (@($aportes.aportes).Count -ne 2) {
        throw "Historico de aportes incorreto."
    }

    Passou "Historico dos dois aportes consultado"

    # Editar a meta
    $metaEditada = $dadosMeta.Clone()
    $metaEditada.nome = "Teste Meta JCASH Editada $marca"

    $edicao = Chamar "Put" "/metas/$idMetaTeste" `
        $cab18 $metaEditada

    if ($edicao.meta.nome -ne $metaEditada.nome) {
        throw "Edicao da meta nao foi salva."
    }

    Passou "Edicao da meta"

    # Exclusao logica
    $exclusao = Chamar "Delete" "/metas/$idMetaTeste" $cab18

    if ($exclusao.meta.id_meta -ne $idMetaTeste) {
        throw "Exclusao logica da meta falhou."
    }

    EsperarErro 404 {
        Chamar "Get" "/metas/$idMetaTeste" $cab18
    }

    Passou "Exclusao logica preserva registros sem exibir meta ativa"

    # Consultar o saldo inicial da reserva
    $inicial = Chamar "Get" "/reserva" $cab18
    $saldoInicial = [decimal]$inicial.resumo.saldo

    $dataHoje = (Get-Date).ToString("yyyy-MM-dd")

    # Aporte nao pode possuir categoria
    EsperarErro 400 {
        Chamar "Post" "/reserva/movimentos" $cab18 @{
            tipo = "APORTE"
            valor = 20
            data_movimento = $dataHoje
            id_categoria = $idCategoriaReserva
        }
    }

    Passou "Aporte na reserva nao aceita categoria"

    # Resgate precisa de motivo
    EsperarErro 400 {
        Chamar "Post" "/reserva/movimentos" $cab18 @{
            tipo = "RESGATE"
            valor = 10
            data_movimento = $dataHoje
            id_categoria = $idCategoriaReserva
        }
    }

    Passou "Resgate sem motivo bloqueado"

    # Fazer um aporte ficticio de R$ 45,25
    $novoAporte = Chamar "Post" "/reserva/movimentos" $cab18 @{
        tipo = "APORTE"
        valor = 45.25
        data_movimento = $dataHoje
    }

    $idMovimentoAporte = $novoAporte.movimento.id_movimento

    if (
        -not $idMovimentoAporte -or
        [decimal]$novoAporte.resumo.saldo -ne ($saldoInicial + 45.25)
    ) {
        throw "Aporte na reserva retornou saldo inesperado."
    }

    Passou "Aporte na reserva atualiza saldo calculado"

    # Conferir isolamento dos movimentos
    $movimentos20 = Chamar "Get" "/reserva/movimentos" $cab20

    if (
        @(
            $movimentos20.movimentos |
            Where-Object {
                $_.id_movimento -eq $idMovimentoAporte
            }
        ).Count -ne 0
    ) {
        throw "Movimento do usuario 18 apareceu para o usuario 20."
    }

    Passou "Movimentos da reserva isolados entre usuarios"

    # Categoria 1 e de ENTRADA e nao de RESERVA
    EsperarErro 400 {
        Chamar "Post" "/reserva/movimentos" $cab18 @{
            tipo = "RESGATE"
            valor = 1
            data_movimento = $dataHoje
            id_categoria = 1
            motivo = "Teste de categoria"
        }
    }

    Passou "Categoria nao RESERVA bloqueada no resgate"

    # Tentar resgatar mais do que existe
    $maiorQueSaldo = [decimal]$novoAporte.resumo.saldo + [decimal]0.01

    EsperarErro 409 {
        Chamar "Post" "/reserva/movimentos" $cab18 @{
            tipo = "RESGATE"
            valor = [double]$maiorQueSaldo
            data_movimento = $dataHoje
            id_categoria = $idCategoriaReserva
            motivo = "Teste de saldo insuficiente"
        }
    }

    Passou "Resgate maior que o saldo bloqueado"

    # Resgatar o valor ficticio aportado
    $resgate = Chamar "Post" "/reserva/movimentos" $cab18 @{
        tipo = "RESGATE"
        valor = 45.25
        data_movimento = $dataHoje
        id_categoria = $idCategoriaReserva
        motivo = "Resgate ficticio para teste JCASH"
    }

    $idMovimentoResgate = $resgate.movimento.id_movimento

    if (
        -not $idMovimentoResgate -or
        [decimal]$resgate.resumo.saldo -ne $saldoInicial
    ) {
        throw "Resgate de teste nao restaurou o saldo inicial."
    }

    Passou "Resgate autorizado restaura o saldo anterior"

    # Consultar o resumo depois dos testes
    $final = Chamar "Get" "/reserva" $cab18

    if ([decimal]$final.resumo.saldo -ne $saldoInicial) {
        throw "Saldo final da reserva nao corresponde ao saldo inicial."
    }

    Passou "Resumo calcula aporte menos resgate sem coluna saldo"

    Write-Host ""
    Write-Host "SUCESSO - $aprovados testes aprovados!"
    Write-Host "Meta ficticia $idMetaTeste arquivada."
    Write-Host "Movimentos ficticios $idMovimentoAporte e $idMovimentoResgate preservados."
    Write-Host "Saldo da reserva retornou ao valor inicial."
}
catch {
    Write-Host ""
    Write-Host "TESTE INTERROMPIDO: $($_.Exception.Message)"
    Write-Host "ID da meta ficticia: $idMetaTeste"
    Write-Host "IDs dos movimentos criados: $idMovimentoAporte, $idMovimentoResgate"
    Write-Host "Nao execute novamente antes de conferir o estado do banco."
}
