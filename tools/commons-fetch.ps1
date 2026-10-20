# Download verified files from Wikimedia Commons into assets/img.
# Reads tools/commons-list.txt  (slot<TAB>File:Name.jpg)
# Usage: powershell -ExecutionPolicy Bypass -File .\tools\commons-fetch.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$imgDir = Join-Path $root 'assets/img'
$logPath = Join-Path $imgDir '_sources.txt'
$ProgressPreference = 'SilentlyContinue'
$ua = 'SipingHometownSite/1.0 (course project; contact: local)'
$enc = [System.Text.Encoding]::UTF8

$lines = [System.IO.File]::ReadAllLines((Join-Path $root 'tools/commons-list.txt'), $enc)

foreach ($line in $lines) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $p = $line -split "`t"
  if ($p.Length -lt 2) { continue }
  $slot = $p[0].Trim()
  $title = $p[1].Trim()
  $dest = Join-Path $imgDir ($slot + '.jpg')

  $t = [System.Uri]::EscapeDataString($title)
  $api = "https://commons.wikimedia.org/w/api.php?action=query&titles=$t&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&format=json"

  try {
    $r = Invoke-RestMethod -Uri $api -Headers @{'User-Agent' = $ua} -TimeoutSec 30
    $page = $r.query.pages.PSObject.Properties | Select-Object -First 1
    $info = $page.Value.imageinfo
    if (-not $info) { Write-Host ("  no imageinfo for " + $slot); continue }
    $url = $info[0].thumburl
    if (-not $url) { $url = $info[0].url }
    $artist = ''
    $lic = ''
    try { $artist = $info[0].extmetadata.Artist.value } catch {}
    try { $lic = $info[0].extmetadata.LicenseShortName.value } catch {}
    $artist = [regex]::Replace($artist, '<[^>]+>', '')
    $artist = ($artist -replace "`r|`n", ' ').Trim()

    Invoke-WebRequest -Uri $url -Headers @{'User-Agent' = $ua} -UseBasicParsing -TimeoutSec 40 -OutFile $dest
    $kb = [Math]::Round((Get-Item $dest).Length / 1KB)
    Write-Host ("  ok " + $slot + "  " + $kb + " KB  <- " + $title)
    $rec = $slot + '.jpg' + [char]9 + $url + [char]9 + $title + ' / ' + $artist + ' / ' + $lic
    [System.IO.File]::AppendAllText($logPath, $rec + [char]13 + [char]10, $enc)
  } catch {
    Write-Host ("  FAILED " + $slot + " : " + $_.Exception.Message)
  }
  Start-Sleep -Milliseconds 400
}
Write-Host 'done.'
