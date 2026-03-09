# get-bearer-from-browser.ps1
# Obtem JWT do usuario logado no player (goldeouro.lol) via CDP.
# Nao altera codigo, Fly, DB. Apenas leitura do storage do navegador e definicao de $env:BEARER.
# Requer: Edge ou Chrome aberto com --remote-debugging-port=9222 e aba em https://www.goldeouro.lol

$ErrorActionPreference = "Stop"
$script:MethodUsed = $null
$script:TokenValue = $null

function Write-Instructions {
    Write-Host ""
    Write-Host "CDP nao acessivel. Reabra o navegador com depuracao remota:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Edge:" -ForegroundColor Cyan
    Write-Host '    msedge.exe --remote-debugging-port=9222 --user-data-dir="%TEMP%\edge-cdp"' -ForegroundColor White
    Write-Host ""
    Write-Host "  Chrome:" -ForegroundColor Cyan
    Write-Host '    chrome.exe --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-cdp"' -ForegroundColor White
    Write-Host ""
    Write-Host "Depois abra https://www.goldeouro.lol e faca login. Em seguida execute este script novamente." -ForegroundColor Yellow
    Write-Host "Nota: o perfil sera separado (user-data-dir); pode ser necessario logar de novo nessa janela." -ForegroundColor Gray
}

function Get-CDPTargets {
    param([string]$Port = "9222")
    try {
        $r = Invoke-RestMethod -Uri "http://127.0.0.1:${Port}/json/list" -Method Get -TimeoutSec 3
        return $r
    } catch {
        return $null
    }
}

function Find-GoldeouroTab {
    param($Targets)
    foreach ($t in $Targets) {
        $url = $t.url -as [string]
        if ($url -and $url -match "goldeouro\.lol") { return $t }
    }
    return $null
}

function Invoke-CDPEvaluate {
    param([string]$WebSocketUrl, [string]$Expression)
    # PowerShell 5.1: use .NET WebSocket
    Add-Type -AssemblyName System.Net.WebSockets -ErrorAction SilentlyContinue
    $uri = [Uri]$WebSocketUrl
    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $cts.CancelAfter(10000)
    try {
        $ws.ConnectAsync($uri, $cts.Token).Wait()
    } catch {
        return $null
    }
    $sendMsg = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $Expression } } | ConvertTo-Json -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($sendMsg)
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
    $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
    $buf = New-Object byte[] 65536
    $seg = New-Object System.ArraySegment[byte] -ArgumentList $buf
    $recv = $ws.ReceiveAsync($seg, $cts.Token).Result
    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "", $cts.Token).Wait()
    $json = [System.Text.Encoding]::UTF8.GetString($buf, 0, $recv.Count)
    return $json
}

function Get-StorageViaCDP {
    param([string]$WebSocketUrl)
    # Coletar localStorage e sessionStorage; chaves conhecidas: authToken (player usa isso)
    $expr = @"
(function(){
  var out = {};
  try {
    if (typeof localStorage !== 'undefined') {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        out['local.' + k] = localStorage.getItem(k);
      }
    }
  } catch(e) {}
  try {
    if (typeof sessionStorage !== 'undefined') {
      for (var j = 0; j < sessionStorage.length; j++) {
        var k2 = sessionStorage.key(j);
        out['session.' + k2] = sessionStorage.getItem(k2);
      }
    }
  } catch(e) {}
  return JSON.stringify(out);
})()
"@
    $json = Invoke-CDPEvaluate -WebSocketUrl $WebSocketUrl -Expression $expr
    if (-not $json) { return $null }
    $obj = $json | ConvertFrom-Json -ErrorAction SilentlyContinue
    if (-not $obj) { return $null }
    $inner = $obj.result.result
    if (-not $inner -or -not $inner.value) { return $null }
    $storeJson = $inner.value
    $store = $storeJson | ConvertFrom-Json -ErrorAction SilentlyContinue
    return $store
}

function Get-BestJWTFromStore {
    param($Store)
    if (-not $Store) { return $null }
    $candidates = @()
    $psObj = $Store
    $psObj.PSObject.Properties | ForEach-Object {
        $key = $_.Name
        $val = $_.Value -as [string]
        if (-not $val) { return }
        # JWT: 3 partes separadas por ponto, base64
        if ($val -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' -and $val.Length -gt 50) {
            $candidates += @{ store = $key; key = $key; value = $val; len = $val.Length }
        }
        # Heuristica: chave contem token/jwt
        if ($key -match 'token|jwt|idToken|accessToken|authToken') {
            $v = $val.Trim()
            if ($v -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' -and $v.Length -gt 50) {
                $candidates += @{ store = $key; key = $key; value = $v; len = $v.Length }
            }
        }
    }
    if ($candidates.Count -eq 0) { return $null }
    $best = $candidates | Sort-Object -Property { $_.len } -Descending | Select-Object -First 1
    return $best.value
}

# --- main ---
param([string]$Browser = "")
Write-Host "[BEARER-PREP] Obtendo JWT do navegador (CDP)..." -ForegroundColor Cyan
if ([string]::IsNullOrWhiteSpace($Browser)) {
    $browser = Read-Host "Navegador com aba goldeouro.lol aberta: (edge/chrome) [edge]"
} else {
    $browser = $Browser.Trim().ToLowerInvariant()
}
if ([string]::IsNullOrWhiteSpace($browser)) { $browser = "edge" }
$browser = $browser.Trim().ToLowerInvariant()
$port = "9222"
if ($browser -eq "chrome") { $port = "9222" }

$targets = Get-CDPTargets -Port $port
if (-not $targets) {
    Write-Host "CDP nao acessivel em localhost:$port" -ForegroundColor Red
    Write-Instructions
    exit 1
}

$tab = Find-GoldeouroTab -Targets $targets
if (-not $tab) {
    Write-Host "Nenhuma aba com URL contendo 'goldeouro.lol' encontrada." -ForegroundColor Red
    Write-Host "Abra https://www.goldeouro.lol e faca login, depois execute este script novamente." -ForegroundColor Yellow
    exit 1
}

$wsUrl = $tab.webSocketDebuggerUrl
if (-not $wsUrl) {
    Write-Host "Target sem webSocketDebuggerUrl." -ForegroundColor Red
    exit 1
}

$script:MethodUsed = "CDP"
$store = Get-StorageViaCDP -WebSocketUrl $wsUrl
$token = Get-BestJWTFromStore -Store $store
if (-not $token) {
    Write-Host "Nenhum JWT encontrado em localStorage/sessionStorage." -ForegroundColor Red
    Write-Host "Certifique-se de estar logado em https://www.goldeouro.lol (chave: authToken)." -ForegroundColor Yellow
    exit 1
}

$script:TokenValue = $token
$env:BEARER = "Bearer " + $token

# Validacao e saida segura (sem imprimir token completo)
$full = $env:BEARER
$ok = $full.StartsWith("Bearer ") -and $full.Length -gt 50 -and $token -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'
if ($ok) {
    Write-Host "TOKEN_OK" -ForegroundColor Green
} else {
    Write-Host "TOKEN_BAD" -ForegroundColor Red
}
Write-Host "TOKEN_LEN $($full.Length)"
$head = if ($full.Length -ge 12) { $full.Substring(0, 12) } else { $full }
$tail = if ($full.Length -ge 8) { $full.Substring($full.Length - 8, 8) } else { $full }
Write-Host "TOKEN_HEAD $head"
Write-Host "TOKEN_TAIL $tail"
Write-Host "[BEARER-PREP] `$env:BEARER definido. Metodo: $script:MethodUsed" -ForegroundColor Cyan
