
# JCASH - Testes de contas e recorrencias
# Executar na pasta backend, com o servidor e MariaDB ativos.
# ATENCAO: preserva historico ficticio pago e cancelado conforme a Regra B.

$ErrorActionPreference = "Stop"

$api = "http://localhost:3001"
$aprovados = 0
$idUnica = $null
$idRecorrencia = $null
$cab18 = $null
$cab20 = $null

function Passou($mensagem) {
    $script:aprovados++
    Write-Host "PASSOU - $mensagem"
}

# Conferir se uma requisicao retorna o erro HTTP esperado
function ErroEsperado($codigo, [scriptblock]$acao) {
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

    throw "Era esperado HTTP $codigo, mas a operacao foi aceita."
}

function Login($email, $senha) {
    $corpo = @{
        email = $email
        senha = $senha
    } | ConvertTo-Json

    Invoke-RestMethod `
        -Method Post `
        -Uri "$api/autenticacao/login" `
        -ContentType "application/json" `
        -Body $corpo `
        -ErrorAction Stop
}

# Enviar requisicoes autenticadas para a API
function Chamar($metodo, $caminho, $cabecalho, $dados = $null) {
    $parametros = @{
        Uri = "$api$caminho"
        Method = $metodo
        Headers = $cabecalho
        ErrorAction = "Stop"
    }

    if ($null -ne $dados) {
        $parametros.ContentType = "application/json"
        $parametros.Body = ($dados | ConvertTo-Json -Depth 6)
    }

    Invoke-RestMethod @parametros
}

try {
    Write-Host "=== JCASH: CONTAS E RECORRENCIAS ==="

    # Solicitar uma categoria global do tipo CONTA
    $categoriaTexto = Read-Host "ID de uma categoria global do tipo CONTA"
    $categoria = 0

    if (
        -not [int]::TryParse($categoriaTexto, [ref]$categoria) -or
        $categoria -le 0
    ) {
        throw "Categoria invalida."
    }

    # Solicitar as senhas ficticias sem exibi-las
    $s18 = Read-Host "Senha da conta ficticia 18" -AsSecureString
    $s20 = Read-Host "Senha da conta ficticia 20" -AsSecureString

    $senha18 = (New-Object System.Net.NetworkCredential("", $s18)).Password
    $senha20 = (New-Object System.Net.NetworkCredential("", $s20)).Password

    $login18 = Login "teste.jcash.20261014@example.com" $senha18
    $login20 = Login "teste.isolamento.20261016@example.com" $senha20

    $senha18 = $null
    $senha20 = $null

    if (
        $login18.usuario.id_usuario -ne 18 -or
        $login20.usuario.id_usuario -ne 20
    ) {
        throw "Os IDs autenticados nao sao 18 e 20."
    }

    $cab18 = @{
        Authorization = "Bearer $($login18.token)"
    }

    $cab20 = @{
        Authorization = "Bearer $($login20.token)"
    }

    Passou "Autenticacao dos usuarios 18 e 20"

    # Testar protecao sem JWT
    ErroEsperado 401 {
        Invoke-RestMethod -Uri "$api/contas" -ErrorAction Stop
    }

    Passou "Rota de contas protegida sem JWT"

    # Criar dados ficticios exclusivos
    $hoje = (Get-Date).ToString("yyyy-MM-dd")
    $marca = [guid]::NewGuid().ToString("N").Substring(0, 8)

    $unica = @{
        id_categoria = $categoria
        tipo_cobranca = "PAGAMENTO_UNICO"
        nome = "Teste Conta JCASH $marca"
        valor = 18.50
        data_vencimento = $hoje
    }

    # Testar valor negativo
    $invalida = $unica.Clone()
    $invalida.valor = -5

    ErroEsperado 400 {
        Chamar "Post" "/contas" $cab18 $invalida
    }

    Passou "Valor negativo bloqueado"

    # Categoria 1 pertence ao tipo ENTRADA
    $invalida = $unica.Clone()
    $invalida.id_categoria = 1

    ErroEsperado 400 {
        Chamar "Post" "/contas" $cab18 $invalida
    }

    Passou "Categoria de entrada bloqueada"

    # Testar data inexistente
    $invalida = $unica.Clone()
    $invalida.data_vencimento = "2026-02-30"

    ErroEsperado 400 {
        Chamar "Post" "/contas" $cab18 $invalida
    }

    Passou "Data inexistente bloqueada"

    # Cadastrar pagamento unico
    $criada = Chamar "Post" "/contas" $cab18 $unica
    $idUnica = $criada.conta.id_conta

    if (
        -not $idUnica -or
        $criada.conta.id_usuario -ne 18 -or
        $criada.conta.tipo_cobranca -ne "PAGAMENTO_UNICO"
    ) {
        throw "Cadastro da conta unica retornou dados inesperados."
    }

    Passou "Cadastro de pagamento unico"

    # Conferir isolamento entre usuarios
    $lista20 = Chamar "Get" "/contas" $cab20

    if (
        @(
            $lista20.contas |
            Where-Object { $_.id_conta -eq $idUnica }
        ).Count -ne 0
    ) {
        throw "Usuario 20 visualizou conta do usuario 18."
    }

    Passou "Isolamento na consulta"

    # Preparar uma edicao
    $editada = $unica.Clone()
    $editada.nome = "Teste Conta JCASH Editada $marca"
    $editada.valor = 21.75

    # Usuario 20 nao pode editar
    ErroEsperado 404 {
        Chamar "Put" "/contas/$idUnica" $cab20 $editada
    }

    Passou "Edicao por outro usuario bloqueada"

    # Usuario 20 nao pode excluir
    ErroEsperado 404 {
        Chamar "Delete" "/contas/$idUnica" $cab20
    }

    Passou "Exclusao por outro usuario bloqueada"

    # Usuario 18 edita a propria conta
    $resposta = Chamar "Put" "/contas/$idUnica" $cab18 $editada

    if (
        $resposta.conta.nome -ne $editada.nome -or
        [decimal]$resposta.conta.valor -ne 21.75
    ) {
        throw "Falha ao editar pagamento unico."
    }

    Passou "Edicao de pagamento unico"

    # Excluir a conta unica ficticia
    $remocao = Chamar "Delete" "/contas/$idUnica" $cab18

    if ($remocao.conta.id_conta -ne $idUnica) {
        throw "Exclusao retornou ID inesperado."
    }

    $idUnica = $null

    Passou "Exclusao de pagamento unico pendente"

    # Preparar uma recorrencia com vencimentos mensais
    $inicio = (Get-Date).AddMonths(-1).ToString("yyyy-MM-01")
    $fim = (Get-Date).AddMonths(2).ToString("yyyy-MM-28")

    $mesPassado = (Get-Date).AddMonths(-1).ToString("yyyy-MM")
    $mesAtual = (Get-Date).ToString("yyyy-MM")
    $mesFuturo = (Get-Date).AddMonths(1).ToString("yyyy-MM")

    $recorrencia = @{
        id_categoria = $categoria
        nome = "Teste Recorrencia JCASH $marca"
        valor = 29.90
        data_inicio = $inicio
        data_fim = $fim
    }

    # Cadastrar recorrencia
    $cadastroRec = Chamar "Post" "/recorrencias" $cab18 $recorrencia

    $idRecorrencia = $cadastroRec.recorrencia.id_recorrencia

    if (
        -not $idRecorrencia -or
        -not $cadastroRec.recorrencia.ativa
    ) {
        throw "Recorrencia nao foi cadastrada corretamente."
    }

    Passou "Cadastro de recorrencia"

    # Editar a recorrencia
    $recEditada = $recorrencia.Clone()
    $recEditada.valor = 31.25

    $alterada = Chamar "Put" "/recorrencias/$idRecorrencia" `
        $cab18 $recEditada

    if ([decimal]$alterada.recorrencia.valor -ne 31.25) {
        throw "Falha na edicao da recorrencia."
    }

    Passou "Edicao da recorrencia"

    # Outro usuario nao pode gerar mensalidades
    ErroEsperado 404 {
        Chamar "Post" "/recorrencias/$idRecorrencia/gerar" `
            $cab20 @{ mes = $mesPassado }
    }

    Passou "Geracao mensal de outro usuario bloqueada"

    # Gerar a conta do mes anterior
    $anterior = Chamar "Post" "/recorrencias/$idRecorrencia/gerar" `
        $cab18 @{ mes = $mesPassado }

    if (-not $anterior.conta.criada) {
        throw "Conta do mes anterior nao criada."
    }

    $idAnterior = $anterior.conta.id_conta

    Passou "Geracao do mes anterior"

    # Repetir a geracao nao pode duplicar a conta
    $duplicada = Chamar "Post" "/recorrencias/$idRecorrencia/gerar" `
        $cab18 @{ mes = $mesPassado }

    if (
        $duplicada.conta.criada -or
        $duplicada.conta.id_conta -ne $idAnterior
    ) {
        throw "Duplicacao da mensalidade nao foi bloqueada."
    }

    Passou "Geracao repetida nao duplica a conta"

    # Gerar o mes atual e o futuro
    $corrente = Chamar "Post" "/recorrencias/$idRecorrencia/gerar" `
        $cab18 @{ mes = $mesAtual }

    $idAtual = $corrente.conta.id_conta

    $futura = Chamar "Post" "/recorrencias/$idRecorrencia/gerar" `
        $cab18 @{ mes = $mesFuturo }

    $idFuturo = $futura.conta.id_conta

    if (
        -not $corrente.conta.criada -or
        -not $futura.conta.criada
    ) {
        throw "Nao foi possivel gerar mensalidades adicionais."
    }

    Passou "Geracao dos outros dois meses"

    # Pagar a conta do mes anterior
    $paga = Chamar "Patch" "/contas/$idAnterior/pagar" `
        $cab18 @{ data_pagamento = $hoje }

    if (
        $paga.conta.status -ne "PAGA" -or
        $paga.conta.data_pagamento -ne $hoje
    ) {
        throw "Conta anterior nao foi paga corretamente."
    }

    Passou "Pagamento de conta mensal"

    # Nao permitir exclusao fisica da conta paga
    ErroEsperado 409 {
        Chamar "Delete" "/contas/$idAnterior" $cab18
    }

    Passou "Exclusao fisica de conta paga bloqueada"

    # Cancelar a conta do mes atual
    $cancelada = Chamar "Patch" "/contas/$idAtual/cancelar" $cab18

    if ($cancelada.conta.status -ne "CANCELADA") {
        throw "Conta mensal nao foi cancelada."
    }

    Passou "Cancelamento preserva o historico"

    # Outro usuario nao pode excluir a recorrencia
    ErroEsperado 404 {
        Chamar "Delete" "/recorrencias/$idRecorrencia" $cab20
    }

    Passou "Exclusao da recorrencia por outro usuario bloqueada"

    # Aplicar a Regra B
    $encerrada = Chamar "Delete" "/recorrencias/$idRecorrencia" $cab18

    if (
        $encerrada.recorrencia.id_recorrencia -ne $idRecorrencia -or
        $encerrada.recorrencia.contas_futuras_removidas -ne 1
    ) {
        throw "Regra B nao removeu exatamente a conta futura pendente."
    }

    Passou "Regra B remove conta futura pendente"

    # Conferir o historico das contas
    $contas = Chamar "Get" "/contas" $cab18

    $ids = @(
        $contas.contas |
        ForEach-Object { $_.id_conta }
    )

    if (
        -not ($ids -contains $idAnterior) -or
        -not ($ids -contains $idAtual) -or
        ($ids -contains $idFuturo)
    ) {
        throw "Regra B nao preservou corretamente o historico."
    }

    Passou "Regra B preserva contas pagas e canceladas"

    # Confirmar a exclusao logica da recorrencia
    $recorrencias = Chamar "Get" "/recorrencias" $cab18

    $historico = @(
        $recorrencias.recorrencias |
        Where-Object {
            $_.id_recorrencia -eq $idRecorrencia
        }
    )

    if (
        $historico.Count -ne 1 -or
        $historico[0].ativa -ne $false
    ) {
        throw "A recorrencia nao foi marcada como excluida."
    }

    Passou "Recorrencia excluida logicamente no historico"

    # Uma recorrencia excluida nao gera novas contas
    ErroEsperado 404 {
        Chamar "Post" "/recorrencias/$idRecorrencia/gerar" `
            $cab18 @{ mes = $mesFuturo }
    }

    Passou "Geracao bloqueada apos encerramento"

    Write-Host ""
    Write-Host "SUCESSO - $aprovados testes aprovados."
    Write-Host "Historico ficticio preservado: contas $idAnterior e $idAtual."
    Write-Host "Recorrencia ficticia $idRecorrencia marcada como excluida."
}
catch {
    Write-Host ""
    Write-Host "TESTE INTERROMPIDO: $($_.Exception.Message)"

    if ($idUnica) {
        Write-Host "Conta unica possivelmente criada: $idUnica"
    }

    if ($idRecorrencia) {
        Write-Host "Recorrencia ficticia possivelmente criada: $idRecorrencia"
    }

    Write-Host "Nao repita o script automaticamente: confira os registros primeiro."
}
