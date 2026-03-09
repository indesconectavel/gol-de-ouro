# bearer_prep.ps1 - Obtem JWT do player via CDP e define $env:BEARER. Nunca exibe o token completo.
param([string]$Browser = "edge")
$ErrorActionPreference = "Stop"

function Get-CDPTargets {
    param([int]$TimeoutSec = 3)
    try {
        $req = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:9222/json/list")
        $req.Timeout = $TimeoutSec * 1000
        $req.ReadWriteTimeout = $TimeoutSec * 1000
        $req.Method = "GET"
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $json = $reader.ReadToEnd()
        $reader.Close()
        $resp.Close()
        return $json | ConvertFrom-Json
    } catch {
        return $null
    }
}

function Find-GoldeouroTab {
    param($Targets)
    $pages = @($Targets) | Where-Object { $_.type -eq "page" -and $_.url -match "goldeouro\.lol" }
    $dashboard = $pages | Where-Object { $_.url -match "/dashboard" } | Select-Object -First 1
    if ($dashboard) { return $dashboard }
    return $pages | Select-Object -First 1
}

function Invoke-CDPEvaluate {
    param([string]$WebSocketUrl, [string]$Expression, [int]$TimeoutMs = 5000)
    Add-Type -AssemblyName System.Net.WebSockets -ErrorAction SilentlyContinue
    $uri = [Uri]$WebSocketUrl
    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $cts.CancelAfter($TimeoutMs)
    try {
        $ws.ConnectAsync($uri, $cts.Token).Wait()
    } catch {
        return $null
    }
    $sendMsg = '{"id":1,"method":"Runtime.evaluate","params":{"expression":"' + ($Expression -replace '\\', '\\\\' -replace '"', '\"' -replace "`r", '' -replace "`n", ' ') + '"}}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($sendMsg)
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
    try {
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
    } catch { $ws.Dispose(); return $null }
    $buf = New-Object byte[] 65536
    $seg = New-Object System.ArraySegment[byte] -ArgumentList $buf
    try {
        $recv = $ws.ReceiveAsync($seg, $cts.Token).Result
    } catch { $ws.Dispose(); return $null }
    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "", $cts.Token).Wait()
    $ws.Dispose()
    return [System.Text.Encoding]::UTF8.GetString($buf, 0, $recv.Count)
}

function Get-TokenFromStore {
    param($StoreObject)
    if (-not $StoreObject) { return $null }
    $candidates = @()
    $StoreObject.PSObject.Properties | ForEach-Object {
        $key = $_.Name
        $val = $_.Value
        if ($null -eq $val) { return }
        $str = $val -as [string]
        if (-not $str) { return }
        $str = $str.Trim()
        if ($str -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' -and $str.Length -gt 50) {
            $score = 0
            if ($key -match 'authToken') { $score = 10 }
            elseif ($key -match 'token|jwt|idToken|accessToken') { $score = 5 }
            $candidates += @{ value = $str; len = $str.Length; score = $score }
        }
        if ($str.StartsWith('{')) {
            try {
                $obj = $str | ConvertFrom-Json
                $obj.PSObject.Properties | Where-Object { $_.Name -match 'authToken|token|jwt|idToken|accessToken' } | ForEach-Object {
                    $v = $_.Value -as [string]
                    if ($v -and $v -match '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' -and $v.Length -gt 50) {
                        $candidates += @{ value = $v; len = $v.Length; score = 8 }
                    }
                }
            } catch { }
        }
    }
    if ($candidates.Count -eq 0) { return $null }
    $best = $candidates | Sort-Object -Property { $_.score }, { $_.len } -Descending | Select-Object -First 1
    return $best.value
}

# --- main ---
$targets = Get-CDPTargets -TimeoutSec 3
if (-not $targets) {
    Write-Host "TOKEN_BAD"
    Write-Host "REASON CDP nao acessivel em 3s (localhost:9222)"
    Write-Host ""
    Write-Host "Abra o Edge com depuracao remota:"
    Write-Host '  msedge.exe --remote-debugging-port=9222 --user-data-dir="%TEMP%\edge-cdp"'
    Write-Host "Nessa janela abra https://www.goldeouro.lol e faca login. Depois execute este script novamente."
    exit 1
}

$tab = Find-GoldeouroTab -Targets $targets
if (-not $tab -or -not $tab.webSocketDebuggerUrl) {
    Write-Host "TOKEN_BAD"
    Write-Host "REASON Nenhuma aba com URL goldeouro.lol encontrada (ou sem webSocketDebuggerUrl)"
    Write-Host ""
    Write-Host "Abra https://www.goldeouro.lol (de preferencia /dashboard) no navegador com CDP e faca login."
    exit 1
}

$expr = '(function(){ var o={}; try{ for(var k in localStorage) o["l."+k]=localStorage[k]; }catch(e){} try{ for(var k in sessionStorage) o["s."+k]=sessionStorage[k]; }catch(e){} return JSON.stringify(o); })()'
$responseJson = Invoke-CDPEvaluate -WebSocketUrl $tab.webSocketDebuggerUrl -Expression $expr -TimeoutMs 5000
if (-not $responseJson) {
    Write-Host "TOKEN_BAD"
    Write-Host "REASON Falha ao executar JS na pagina (WebSocket timeout ou erro)"
    exit 1
}

$response = $responseJson | ConvertFrom-Json -ErrorAction SilentlyContinue
$inner = $response.result.result
if (-not $inner -or -not $inner.value) {
    Write-Host "TOKEN_BAD"
    Write-Host "REASON Resposta CDP sem valor (storage vazio ou erro)"
    exit 1
}

$storeJson = $inner.value
$store = $storeJson | ConvertFrom-Json -ErrorAction SilentlyContinue
$token = Get-TokenFromStore -StoreObject $store
if (-not $token) {
    Write-Host "TOKEN_BAD"
    Write-Host "REASON Nenhum JWT encontrado em localStorage/sessionStorage (chaves authToken/token/jwt)"
    Write-Host ""
    Write-Host "Faca login em https://www.goldeouro.lol na aba com CDP e execute novamente."
    exit 1
}

$env:BEARER = "Bearer " + $token
$full = $env:BEARER
$tokenOnly = $token
$head = if ($tokenOnly.Length -ge 12) { $tokenOnly.Substring(0, 12) } else { $tokenOnly }
$tail = if ($tokenOnly.Length -ge 8) { $tokenOnly.Substring($tokenOnly.Length - 8, 8) } else { $tokenOnly }
Write-Host "TOKEN_OK"
Write-Host "TOKEN_LEN $($full.Length)"
Write-Host "TOKEN_HEAD $head"
Write-Host "TOKEN_TAIL $tail"
Write-Host "METHOD CDP"
