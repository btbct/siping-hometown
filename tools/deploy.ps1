# 一键上传到 GitHub（用于 GitHub Pages 手机访问）
# 用法： powershell -ExecutionPolicy Bypass -File .\tools\deploy.ps1
#      也可以直接带参数：.\tools\deploy.ps1 -User 你的用户名 -Repo 仓库名

param(
  [string]$User,
  [string]$Repo
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $root

if (-not $User) { $User = Read-Host '你的 GitHub 用户名' }
if (-not $Repo) { $Repo = Read-Host '仓库名（英文小写，例如 siping-hometown）' }

# 去掉粘贴时可能带上的空白、BOM、网址前缀
function Clean-Input([string]$s) {
  if (-not $s) { return '' }
  $s = $s.Replace([string][char]0xFEFF, '').Trim()
  $s = $s -replace '^https?://github\.com/', ''
  $s = $s -replace '\.git$', ''
  return $s.Trim('/').Trim()
}
$User = Clean-Input $User
$Repo = Clean-Input $Repo

Write-Host ''
Write-Host '== 第 1 步：请先在 https://github.com/new 创建空仓库 =='
Write-Host ('   仓库名填：' + $Repo)
Write-Host '   不要勾选 Add a README file / .gitignore / license（保持空仓库）'
Write-Host ''
Read-Host '创建好后按回车继续'

git branch -M main
$url = "https://github.com/$User/$Repo.git"
git remote remove origin 2>$null | Out-Null
git remote add origin $url

Write-Host ''
Write-Host ('== 第 2 步：推送到 ' + $url + ' ==')
Write-Host '   弹出登录窗口时用 GitHub 账号登录（或用 Token 作为密码）'
Write-Host ''
git push -u origin main

if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host '推送没成功，检查：用户名/仓库名是否写对、是否登录成功。改好再运行一次本脚本即可。'
  exit 1
}

Write-Host ''
Write-Host '== 第 3 步：开启 GitHub Pages =='
Write-Host ('   打开 https://github.com/' + $User + '/' + $Repo + '/settings/pages')
Write-Host '   Build and deployment → Source 选 Deploy from a branch'
Write-Host '   Branch 选 main，文件夹选 /(root)，点 Save'
Write-Host ''
Write-Host ('== 完成！1~2 分钟后手机访问：https://' + $User + '.github.io/' + $Repo + '/ ==')
Write-Host '   把这个网址发到微信里，手机点开就能看。'
