# Re-download site images from web image search (quality filtered).
# Reads tools/image-queries.txt (slot<TAB>query), overwrites assets/img/<slot>.jpg
# Filters: skips first candidates, prefers travel/photo domains, requires min size.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$imgDir = Join-Path $root 'assets/img'
$logPath = Join-Path $imgDir '_sources.txt'
$ProgressPreference = 'SilentlyContinue'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
$enc = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing

$lines = [System.IO.File]::ReadAllLines((Join-Path $root 'tools/image-queries.txt'), $enc)
$prefer = 'c-ctrip|qunar|mafengwo|maoyouhe|dianping|zhimg|sinaimg|qhimg|pixabay|unsplash|sohu|toutiao|hiphotos|bdimg|dpfile|meituan|58cdn'
$block = 'logo|icon|sprite|avatar|qrcode|watermark'

function Get-Candidates($query) {
  $q = [System.Uri]::EscapeDataString($query)
  $u = "https://www.bing.com/images/search?q=$q&form=HDRSC2&qft=+filterui:imagesize-large"
  try {
    $h = Invoke-WebRequest -Uri $u -Headers @{'User-Agent' = $ua; 'Accept-Language' = 'zh-CN,zh;q=0.9'} -UseBasicParsing -TimeoutSec 30
    $m = [regex]::Matches($h.Content, 'murl&quot;:&quot;(.*?)&quot;')
    $all = @()
    foreach ($x in $m) { $all += $x.Groups[1].Value }
    $good = @($all | Where-Object { $_ -notmatch $block -and $_ -match '\.(jpg|jpeg|png)(\?|$)' })
    $first = @($good | Where-Object { $_ -match $prefer })
    $rest = @($good | Where-Object { $_ -notmatch $prefer })
    return ($first + $rest)
  } catch {
    Write-Host ("  search failed: " + $_.Exception.Message)
    return @()
  }
}

foreach ($line in $lines) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line -split "`t"
  if ($p.Length -lt 2) { continue }
  $slot = $p[0].Trim()
  $query = $p[1].Trim()
  $dest = Join-Path $imgDir ($slot + '.jpg')
  Write-Host ("[" + $slot + "] " + $query)

  $cands = Get-Candidates $query
  $done = $false
  $tries = 0
  $skipped = 0
  foreach ($url in $cands) {
    if ($done) { break }
    if ($tries -ge 8) { break }
    # skip the very first result: usually a related/trending thumbnail
    if ($skipped -lt 1) { $skipped++; continue }
    $tries++
    $tmp = Join-Path $env:TEMP ('spi_' + $slot + '_' + $tries + '.tmp')
    try {
      Invoke-WebRequest -Uri $url -Headers @{'User-Agent' = $ua; 'Referer' = 'https://www.bing.com/'} -UseBasicParsing -TimeoutSec 20 -OutFile $tmp
      if (Test-Path $tmp) {
        $len = (Get-Item $tmp).Length
        if ($len -gt 45000) {
          $b = [System.IO.File]::ReadAllBytes($tmp)
          $isJpg = ($b[0] -eq 0xFF -and $b[1] -eq 0xD8)
          $isPng = ($b[0] -eq 0x89 -and $b[1] -eq 0x50)
          if ($isJpg -or $isPng) {
            $im = $null
            try { $im = [System.Drawing.Image]::FromFile($tmp) } catch { }
            if ($im) {
              $w = $im.Width; $h = $im.Height; $im.Dispose()
              $ratio = $w / $h
              if ($w -ge 620 -and $h -ge 380 -and $ratio -ge 1.05 -and $ratio -le 2.4) {
                [System.IO.File]::Copy($tmp, $dest, $true)
                Write-Host ("  OK " + $slot + "  " + $w + "x" + $h + "  " + [Math]::Round($len / 1KB) + "KB")
                $rec = $slot + '.jpg' + [char]9 + $url + [char]9 + $query
                [System.IO.File]::AppendAllText($logPath, $rec + [char]13 + [char]10, $enc)
                $done = $true
              }
            }
          }
        }
      }
    } catch { }
    Remove-Item $tmp -ErrorAction SilentlyContinue
  }
  if (-not $done) { Write-Host ("  FAILED " + $slot) }
}
Write-Host 'done.'
