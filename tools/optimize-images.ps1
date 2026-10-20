# 压缩图片：长边超过 1600px 或体积超过 800KB 的重新编码，手机上打开更快
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$dir = Join-Path $root 'assets/img'
$log = New-Object System.Collections.ArrayList

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 82L)

foreach ($f in (Get-ChildItem $dir -File -Filter *.jpg | Sort-Object Name)) {
  $before = $f.Length
  $need = ($before -gt 800KB)
  $img = $null
  try { $img = [System.Drawing.Image]::FromFile($f.FullName) } catch { [void]$log.Add($f.Name + ' DECODE-FAIL'); continue }
  $w = $img.Width; $h = $img.Height
  $need = $need -or ($w -gt 1600) -or ($h -gt 1600)
  $line = $f.Name.PadRight(15) + ' ' + ($w.ToString() + 'x' + $h).PadRight(11) + ' ' + ([Math]::Round($before / 1KB).ToString() + 'KB').PadRight(9)
  if ($need) {
    $scale = [Math]::Min(1.0, 1600.0 / [Math]::Max($w, $h))
    $nw = [int][Math]::Round($w * $scale); $nh = [int][Math]::Round($h * $scale)
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $nw, $nh)
    $g.Dispose(); $img.Dispose()
    $tmp = $f.FullName + '.tmp'
    $bmp.Save($tmp, $codec, $params)
    $bmp.Dispose()
    $img = $null
    [System.IO.File]::Delete($f.FullName)
    [System.IO.File]::Move($tmp, $f.FullName)
    $after = (Get-Item $f.FullName).Length
    $line += ' -> ' + ($nw.ToString() + 'x' + $nh).PadRight(11) + ' ' + [Math]::Round($after / 1KB) + 'KB'
  } else {
    $img.Dispose(); $img = $null
    $line += ' -> kept'
  }
  [void]$log.Add($line)
}

$total = (Get-ChildItem $dir -File -Filter *.jpg | Measure-Object Length -Sum).Sum
[void]$log.Add('TOTAL ' + [Math]::Round($total / 1MB, 2) + ' MB / ' + (Get-ChildItem $dir -File -Filter *.jpg).Count + ' files')
[System.IO.File]::WriteAllLines((Join-Path $root 'tools/_optimize-log.txt'), $log, [System.Text.Encoding]::UTF8)
