# 四平 · 我的家乡

吉林四平文旅主题网站｜《人工智能导论》课程实践作品

纯静态站点（HTML + CSS + 原生 JS），零依赖、零构建，可直接部署到 GitHub Pages。

---

## 一、本地预览

项目根目录里已带一个不需要 Node / Python 的本地服务器：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\serve.ps1
```

然后浏览器打开 <http://localhost:8000>，按 `Ctrl + C` 停止服务。

> 直接双击 `index.html` 也能看，但用本地服务器打开效果完全一致、也最接近线上环境。

---

## 二、目录结构

```
├── index.html              页面结构（含 SVG 图标精灵）
├── css/
│   └── style.css           全部样式
├── js/
│   ├── data.js             内容数据层：景点 / 人文 / 美食 / 线路 / 时节 / 攻略 / 关于
│   └── main.js             交互逻辑：筛选、弹窗、灯箱、心愿单、行程规划、滚动动效
├── assets/
│   └── img/                图片素材目录（见该目录下的「图片素材清单.txt」）
├── tools/
│   └── serve.ps1           本地静态服务器
└── README.md
```

**改文字只需改 `js/data.js`**，页面会自动跟着变，不用碰 HTML。

---

## 三、页面栏目

| 序号 | 栏目 | 内容 |
| --- | --- | --- |
| — | 首页 | 城市定位、口号、关键数据 |
| 01 | 分类 | 英雄红 / 满韵 / 湖山 / 烟火，四条入口 |
| 02 | 好玩 | 12 处景点，6 个分类筛选 + 详情弹窗（门票、时间、贴士） |
| 03 | 人文 | 二人转、四战四平、满族萨满、黑土地玉米、2300 年建城史 |
| 04 | 好吃 | 6 道风味，含吃法与去处 |
| 05 | 线路 | 行程规划器：选天数 + 兴趣偏好，自动生成按天行程 |
| 06 | 时节 | 春夏秋冬四季玩法与注意事项 |
| 07 | 攻略 | 交通 / 住宿 / 行程节奏 / 实用贴士 |
| 08 | 关于 | 城市概况、关键数据、资料来源清单 |

交互功能：顶部导航滚动高亮、移动端菜单、分类筛选、卡片详情弹窗、图片灯箱、
心愿单（localStorage 本地保存）、行程规划器、滚动入场动画。

---

## 四、图片

`assets/img/` 里已经放好 32 张配图（来自 Wikimedia Commons 等公开图源），
命名与内容对照见 `assets/img/图片素材清单.txt`，逐张来源与许可记录见 `assets/img/_sources.txt`。

**换成自己的照片**：按 `图片素材清单.txt` 的文件名重命名后直接覆盖同名文件，刷新即可。
文件名不变就不会影响网站其它部分；某个文件缺失时会自动显示带地名的深色占位块，不报错、不破版。

> 说明：少数场景在公开图源中找不到四平实拍，使用了同类题材示意图，
> 页面「资料来源」里已如实注明，未把非本地照片标注成四平实景。

---

## 五、部署到 GitHub Pages（手机可访问）

本地 git 仓库已经建好、代码已提交到 `main` 分支，你只需要做两件事。

**最简单的方式**——运行一键脚本，它会提示你输入用户名和仓库名，然后自动推送：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\deploy.ps1
```

**手动方式**：

1. 在 GitHub 新建空仓库，例如 `my-hometown-siping`（**不要**勾选 Add a README file）。
2. 把本目录所有文件推到仓库的 `main` 分支（**不要**只推子文件夹）。
3. 仓库 → **Settings** → **Pages** → Source 选 `Deploy from a branch`，
   Branch 选 `main` / `/(root)`，点 Save。
4. 等 1–2 分钟，手机访问 `https://<你的用户名>.github.io/my-hometown-siping/`。
   把网址发到微信，手机点开就能看。

命令行版（已 `git init` 并 commit，可直接执行后两行）：

```bash
git init
git add .
git commit -m "feat: 四平文旅主题网站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/my-hometown-siping.git
git push -u origin main
```

---

## 六、MBTI 人格测试页（`mbti/`）

站点里附带一个独立页面：48 题四维度 MBTI 测试，纯静态、零依赖。

- 本地：<http://localhost:8000/mbti/>
- 线上：`https://<你的用户名>.github.io/<仓库名>/mbti/`
- 结构：`mbti/index.html` + `mbti/css/style.css` + `mbti/js/data.js`（题库与 16 型文案）+ `mbti/js/app.js`（计分与交互）
- 计分：E/I、S/N、T/F、J/P 各 12 题，按票数占比算百分比，多数决得出四字母类型
- 数据：结果存在浏览器 `localStorage`，可在「数据分析」页看分布、导出 CSV、一键清空
- 题库来源：公开流传的 MBTI 48 题基础版（jingyunce.com），仅作课程演示，非官方施测工具

---

## 七、资料来源

文字资料整理自四平市人民政府门户网站《四平市基本概况》《四平市红色旅游发展规划
（2021—2035 年）》、吉林日报、中国新闻网吉林频道等公开报道，
以及携程 / Trip.com 景区公开页面（票价、开放时间）。完整清单见页面底部
「资料来源与数据出处」。

票价、开放时间与活动安排以景区及官方最新公告为准。本作品仅用于课程实践展示，不作商业用途。
