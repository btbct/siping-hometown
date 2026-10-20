# 一键上传到 GitHub（用于 GitHub Pages 手机访问）
# 用法： powershell -ExecutionPolicy Bypass -File .\tools\deploy.ps1
#      也可以直接带参数：.\tools\deploy.ps1 -User BTBCT -Repo siping-hometown

param(
  [string]$User,
  [string]$Repo
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $root

# 去掉粘贴时可能带上的空白、BOM、网址前缀
function Resolve-Input([string]$s) {
  if (-not $s) { return '' }
  $s = $s.Replace([string][char]0xFEFF, '').Trim()
  $s = $s -replace '^https?://github\.com/', ''
  $s = $s -replace '\.git$', ''
  return $s.Trim('/').Trim()
}

# 只允许字母数字连字符，中文昵称（如「BTBCT（初次发售）」）自动截出英文部分
function Resolve-UserName([string]$seed) {
  $v = Resolve-Input $seed
  while ($true) {
    $m = [regex]::Match($v, '^[A-Za-z0-9][A-Za-z0-9-]*')
    if ($m.Success -and $m.Value -eq $v) { return $v }
    if ($m.Success) {
      Write-Host ('   已自动取英文部分：' + $m.Value) -ForegroundColor Green
      return $m.Value
    }
    Write-Host '   用户名只能填英文、数字和连字符，不能带中文括号或昵称。' -ForegroundColor Yellow
    Write-Host '   正确示例：BTBCT        错误示例：BTBCT（初次发售）'
    Write-Host '   不确定的话，登录 GitHub 后在 https://github.com/settings/profile 看 Username 一栏'
    $v = Resolve-Input (Read-Host '   GitHub 用户名（英文）')
  }
}

function Resolve-RepoName([string]$seed) {
  $v = Resolve-Input $seed
  while ($true) {
    $m = [regex]::Match($v, '^[A-Za-z0-9._-]{1,100}$')
    if ($m.Success) { return $v }
    if ($v) { Write-Host '   仓库名只能用英文、数字、连字符、下划线和点。' -ForegroundColor Yellow }
    $v = Resolve-Input (Read-Host '   仓库名（例如 siping-hometown）')
  }
}

Write-Host ''
Write-Host '== 输入账号信息 ==' -ForegroundColor Cyan
if (-not $User) { $User = Read-Host '   你的 GitHub 用户名（英文）' }
$User = Resolve-UserName $User
if (-not $Repo) { $Repo = Read-Host '   仓库名（例如 siping-hometown）' }
$Repo = Resolve-RepoName $Repo

$url = "https://github.com/$User/$Repo.git"

Write-Host ''
Write-Host '== 第 1 步：确认仓库已创建 ==' -ForegroundColor Cyan
Write-Host ('   仓库地址应为：https://github.com/' + $User + '/' + $Repo)
Write-Host '   如果还没建：打开 https://github.com/new ，仓库名填上面这个，选 Public，'
Write-Host '   不要勾选 Add a README file / .gitignore / license（保持空仓库）。'
$check = $null
try {
  $check = (Invoke-WebRequest -Uri ('https://github.com/' + $User + '/' + $Repo) -UseBasicParsing -TimeoutSec 15).StatusCode
} catch {
  if ($_.Exception.Response) { $check = [int]$_.Exception.Response.StatusCode } else { $check = 0 }
}
if ($check -eq 200) { Write-Host '   仓库已存在，继续。' -ForegroundColor Green }
elseif ($check -eq 404) { Write-Host '   提示：这个地址现在打不开（仓库还没建，或用户名/仓库名不对）。建好后再回车。' -ForegroundColor Yellow }
else { Write-Host '   提示：没连上 GitHub 网页，先不管，继续试推送。' -ForegroundColor Yellow }
Write-Host ''
Read-Host '   准备好后按回车开始推送'

git branch -M main
git remote remove origin 2>$null | Out-Null
git remote add origin $url

Write-Host ''
Write-Host ('== 第 2 步：推送到 ' + $url + ' ==') -ForegroundColor Cyan
Write-Host '   弹出登录窗口时用 GitHub 账号登录（或用 Personal Access Token 当密码）'
Write-Host ''

$attempt = 0
$pushed = $false
while ($attempt -lt 3 -and -not $pushed) {
  $attempt++
  if ($attempt -gt 1) { Write-Host ('   第 ' + $attempt + ' 次尝试推送...') -ForegroundColor Yellow }
  git push -u origin main
  if ($LASTEXITCODE -eq 0) { $pushed = $true }
  elseif ($attempt -lt 3) { Start-Sleep -Seconds 5 }
}

if (-not $pushed) {
  Write-Host ''
  Write-Host '推送没成功。常见原因：' -ForegroundColor Yellow
  Write-Host '   1) 报 RemoteException / could not read Username：登录窗口没弹出来或被关掉了，'
  Write-Host '      改用 Token：GitHub → Settings → Developer settings → Personal access tokens，'
  Write-Host '      生成一个有 repo 权限的 Token，弹出密码框时粘贴 Token。'
  Write-Host '   2) 报 Failed to connect / Connection was reset / port 443 超时：网络到 GitHub 不稳，'
  Write-Host '      开代理（全局模式）或换手机热点后重跑本脚本。'
  Write-Host '   3) 报 Repository not found：用户名或仓库名写错了，或仓库建成了私有（免费版 Pages 需要 Public）。'
  exit 1
}

Write-Host ''
Write-Host '== 第 3 步：开启 GitHub Pages ==' -ForegroundColor Cyan
Write-Host ('   打开 https://github.com/' + $User + '/' + $Repo + '/settings/pages')
Write-Host '   Build and deployment → Source 选 Deploy from a branch'
Write-Host '   Branch 选 main，文件夹选 /(root)，点 Save'
Write-Host ''
Write-Host ('== 完成！1~2 分钟后手机访问：https://' + $User + '.github.io/' + $Repo + '/ ==') -ForegroundColor Green
Write-Host '   把这个网址发到微信里，手机点开就能看。'
