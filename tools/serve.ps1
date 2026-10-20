# Local static server for the site (no Node / Python / admin rights needed).
# Usage:  powershell -ExecutionPolicy Bypass -File .\tools\serve.ps1
# Then open  http://localhost:8000  and press Ctrl+C to stop.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$port = 8000
$nl = [string][char]13 + [string][char]10
$lf = [string][char]10

$map = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.webp' = 'image/webp'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
}

function Send-Response($client, $code, $type, [byte[]]$body) {
  $status = 'OK'
  if ($code -ne 200) { $status = 'Not Found' }
  $head = "HTTP/1.1 $code $status" + $nl +
          "Content-Type: $type" + $nl +
          "Content-Length: " + $body.Length + $nl +
          "Cache-Control: no-store" + $nl +
          "Connection: close" + $nl + $nl
  $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
  $stream = $client.GetStream()
  $stream.Write($headBytes, 0, $headBytes.Length)
  if ($body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

$addr = [System.Net.IPAddress]::Loopback
$listener = New-Object System.Net.Sockets.TcpListener($addr, $port)
$listener.Start()
Write-Host "Server started: http://localhost:$port/"
Write-Host "Root: $root"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $buf = New-Object byte[] 8192
      $read = $stream.Read($buf, 0, 8192)
      $text = [System.Text.Encoding]::ASCII.GetString($buf, 0, $read)
      $parts = (($text -split $lf)[0]) -split ' '
      $rel = ''
      if ($parts.Length -gt 1) { $rel = $parts[1] }
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
      $rel = [System.Uri]::UnescapeDataString($rel).Split('?')[0].TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }

      $path = Join-Path $root $rel
      if (Test-Path $path -PathType Container) { $path = Join-Path $path 'index.html' }

      if (Test-Path $path -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $ext = [System.IO.Path]::GetExtension($path).ToLower()
        $type = 'application/octet-stream'
        if ($map.ContainsKey($ext)) { $type = $map[$ext] }
        Send-Response $client 200 $type $bytes
      } else {
        $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        Send-Response $client 404 'text/plain; charset=utf-8' $msg
      }
    } catch {
      Write-Host ("request error: " + $_.Exception.Message)
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
