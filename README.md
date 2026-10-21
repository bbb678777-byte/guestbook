# 📝 guestbook 留言板 · 完整学习教程

> **写给新手**：这份教程从头到尾一步一步带你走完「本地写代码 → 推送到 GitHub → 自动更新到宝塔服务器的 Docker」的全部流程。
> 每一步都写了**在哪里执行**、**输入什么**、**应该看到什么**、**看到别的怎么办**。照着做就行。

---

## 目录

- [第 0 章 阅读说明](#第-0-章-阅读说明)
- [第 1 章 先看懂整体](#第-1-章-先看懂整体)
- [第 2 章 进度检查清单](#第-2-章-进度检查清单)
- [第 3 章 准备本地工具：VS Code](#第-3-章-准备本地工具vs-code)
- [第 4 章 在本地运行程序](#第-4-章-在本地运行程序)
- [第 5 章 第一次推送到 GitHub](#第-5-章-第一次推送到-github)
- [第 6 章 服务器准备](#第-6-章-服务器准备)
- [第 7 章 第一次手动部署](#第-7-章-第一次手动部署)
- [第 8 章 配置 GitHub Actions 自动部署](#第-8-章-配置-github-actions-自动部署)
- [**第 9 章 ★ 更新版本：本地修改，自动更新到服务器**](#第-9-章--更新版本本地修改自动更新到服务器) ← 日常最常用
- [第 10 章 只改文档、不发新版本](#第-10-章-只改文档不发新版本)
- [第 11 章 回滚：新版本出问题了怎么办](#第-11-章-回滚新版本出问题了怎么办)
- [第 12 章 数据卷：留言为什么不会丢](#第-12-章-数据卷留言为什么不会丢)
- [第 13 章 常见问题](#第-13-章-常见问题)
- [第 14 章 命令速查表](#第-14-章-命令速查表)

---

## 第 0 章 阅读说明

### 0.1 标记的含义

| 标记 | 意思 |
|---|---|
| 💻 **本地** | 在你自己的 Windows 电脑上执行（VS Code 终端或 PowerShell） |
| 🖥️ **服务器** | 在服务器上执行（宝塔面板 → 终端） |
| 🌐 **浏览器** | 在浏览器里操作（GitHub 网站、宝塔面板） |
| ✅ | 看到这个结果说明成功 |
| ❌ | 出错了，按提示处理 |
| ⚠️ | 重要提醒，一定要看 |

> **命令执行地点搞错是新手最常见的问题。** 每条命令前都标了在哪执行，请注意看。

### 0.2 需要替换成你自己的内容

| 教程里写的 | 替换成 |
|---|---|
| `bbb678777-byte` | 你的 GitHub 用户名（已经帮你填好了） |
| `你的服务器IP` | 服务器的公网 IP，例如 `1.2.3.4` |

### 0.3 怎么复制命令

- 每个灰色代码块就是**一条命令**，点代码块右上角的复制按钮（或选中后 `Ctrl + C`）复制，粘贴到终端后按 `回车` 执行。
- **一次只执行一条**，看到结果后再执行下一条。
- 在宝塔终端里粘贴：右键 → 粘贴，或 `Ctrl + Shift + V`。

---

## 第 1 章 先看懂整体

### 1.1 整个流程一张图

```
 ┌───────────────────────┐         ┌───────────────────────┐         ┌──────────────────────────────┐
 │  💻 你的 Windows 电脑   │         │      🌐 GitHub         │         │     🖥️ 宝塔服务器（Linux）       │
 │                       │         │                       │         │                              │
 │ ① 用 VS Code 改代码    │         │ ③ 保存你的代码          │         │ ⑤ 拉取最新代码                 │
 │ ② git commit 保存版本  │──push──▶│ ④ Actions 自动启动      │──SSH───▶│ ⑥ 用 Docker 重新构建并运行      │
 │                       │         │    登录你的服务器       │         │ ⑦ 检查是否运行正常              │
 └───────────────────────┘         └───────────────────────┘         └──────────────────────────────┘
                                                                                    │
                                                         🌐 浏览器访问 http://你的服务器IP:3001
```

**你只需要做 ① ② 和 push，③ 到 ⑦ 全部自动完成。**

### 1.2 一次性准备 vs 日常更新

整个教程分成两部分：

| | 内容 | 做几次 |
|---|---|---|
| **一次性准备** | 第 3～8 章：装工具、推送代码、准备服务器、第一次部署、配置自动部署 | 只做**一次** |
| **日常更新** | 第 9 章：改代码 → 提交 → 推送 → 自动更新 | 以后**每次**改程序都这样做 |

### 1.3 项目里每个文件是干什么的

```
1021_xx/
├── app/
│   ├── server.js            ← 留言板程序本身（你以后主要改这个）
│   └── package.json         ← 程序信息，里面的 "version" 就是版本号
├── .github/
│   └── workflows/
│       └── deploy.yml       ← 告诉 GitHub：有新代码推送到 main 时，自动登录服务器部署
├── Dockerfile               ← 告诉 Docker：怎么把程序打包成镜像
├── docker-compose.yml       ← 告诉 Docker：怎么运行（端口 3001、数据卷、自动重启）
├── deploy.sh                ← 在服务器上执行的部署脚本
├── .dockerignore            ← 打包镜像时忽略哪些文件
├── .gitignore               ← Git 不管哪些文件（比如本地的留言数据）
├── .gitattributes           ← 统一换行符，防止 Windows 换行符让脚本在 Linux 上出错
└── README.md                ← 本教程
```

日常更新时，**你通常只改 `app/server.js` 和 `app/package.json` 这两个文件**，其他文件不用动。

### 1.4 程序提供的地址

| 地址 | 作用 |
|---|---|
| `/` | 留言板首页：填昵称和内容提交，新留言显示在最上面 |
| `/health` | 健康检查：返回运行状态、版本号、留言条数 |
| `/api/messages` | 所有留言的 JSON 数据 |

### 1.5 名词小词典

看不懂某个词时回来查：

| 名词 | 通俗解释 |
|---|---|
| **Git** | 版本管理工具。像游戏存档：每次 `commit` 就是存一次档，随时可以读档回去 |
| **仓库（repository）** | 一个项目的所有代码和历史记录。本地有一份，GitHub 上有一份 |
| **提交（commit）** | 存一次档，记录“这次改了什么” |
| **推送（push）** | 把本地的存档上传到 GitHub |
| **拉取（pull）** | 把 GitHub 上的新存档下载到本地 |
| **标签（tag）** | 给某次存档贴个名字，比如 `v1.1.0`，方便以后找到它 |
| **main 分支** | 主线代码。本项目约定：main 上的代码 = 服务器上运行的代码 |
| **GitHub** | 存放代码的网站 |
| **GitHub Actions** | GitHub 提供的“自动化机器人”，push 后自动帮你部署 |
| **Secrets** | GitHub 仓库里的“保险箱”，存服务器 IP、登录密钥等敏感信息 |
| **Docker 镜像** | 打包好的程序安装包（包含系统 + Node.js + 你的代码） |
| **Docker 容器** | 镜像运行起来的实例，就是正在跑的程序 |
| **数据卷（volume）** | 容器外面的一块存储空间，留言存在这里，换容器也不丢 |
| **部署** | 把新代码放到服务器上运行起来 |

---

## 第 2 章 进度检查清单

对照看看你做到哪一步了，从没打勾的地方继续：

- [x] 本地已安装 Node.js 和 Git
- [x] 项目代码已写好，本地第一次提交完成
- [x] 代码已推送到 GitHub（`bbb678777-byte/guestbook`）
- [x] 服务器上已手动部署成功
- [x] GitHub Actions 手动运行成功（Deploy #3 绿色对勾）
- [ ] 安装 VS Code（第 3 章）
- [ ] 本教程的改动提交并推送，测试一次自动部署（第 10 章）
- [ ] 给当前版本打上 `v1.0.0` 标签（第 9.3 节）
- [ ] **完成一次版本更新 v1.0.0 → v1.1.0（第 9 章）**
- [ ] 练习一次回滚（第 11 章）

---

## 第 3 章 准备本地工具：VS Code

改代码需要一个编辑器。用 Windows 记事本也能改，但很容易出问题（比如编码、换行符），**强烈推荐用 VS Code**，它是免费的，也是专业开发者最常用的编辑器。

### 3.1 安装 VS Code

**方法一（推荐）**：💻 本地，打开 PowerShell（开始菜单搜索 “PowerShell”），执行：

```bash
winget install --id Microsoft.VisualStudioCode -e
```

**方法二**：🌐 浏览器打开 <https://code.visualstudio.com/>，点 **Download for Windows** 下载安装。安装时建议勾选：
- ☑ 添加到 PATH
- ☑ 将“通过 Code 打开”操作添加到 Windows 资源管理器目录上下文菜单

安装完成后**关闭所有 PowerShell 窗口**再重新打开（让新安装的程序生效）。

### 3.2 安装中文语言包（可选）

1. 打开 VS Code。
2. 按 `Ctrl + Shift + X` 打开扩展面板。
3. 搜索 `Chinese`，安装 **Chinese (Simplified) Language Pack**。
4. 右下角提示重启，点 **Restart**。

### 3.3 用 VS Code 打开项目

1. VS Code 菜单：**文件** → **打开文件夹**。
2. 选择 `C:\CODE\1021_xx`，点 **选择文件夹**。
3. 如果弹出“是否信任此文件夹的作者”，点 **是，我信任此作者**。
4. 左侧会显示项目的文件列表。

### 3.4 打开 VS Code 里的终端

本教程所有 💻 本地命令，都推荐在 VS Code 自带的终端里执行：

1. 菜单：**终端** → **新建终端**（快捷键 `` Ctrl + ` ``，就是数字 1 左边那个键）。
2. 窗口下方会出现一个终端面板，显示类似：

```
PS C:\CODE\1021_xx>
```

✅ **一定要确认路径是 `C:\CODE\1021_xx`**。如果不是，执行：

```bash
cd C:\CODE\1021_xx
```

> ⚠️ 新手最常见的错误：在错误的文件夹里执行 git 命令。执行任何 git 命令前，先看一眼终端左边的路径。

---

## 第 4 章 在本地运行程序

💻 本地（VS Code 终端），在项目根目录执行：

```bash
node app/server.js
```

✅ 看到下面这行说明启动成功：

```
[guestbook] v1.0.0 已启动：http://localhost:3000  数据文件=C:\CODE\1021_xx\app\data\messages.json
```

🌐 浏览器打开 <http://localhost:3000>，试着发几条留言。

再打开 <http://localhost:3000/health>，能看到：

```json
{
  "status": "ok",
  "version": "1.0.0",
  "messages": 2
}
```

**停止程序**：回到终端，按 `Ctrl + C`。

> 💡 本地运行时，端口是 **3000**；服务器上对外的端口是 **3001**（在 docker-compose.yml 里配置的），别搞混。
> 💡 本地的留言保存在 `app/data/messages.json`，这个文件已经被 `.gitignore` 忽略，不会上传到 GitHub，也不会影响服务器上的留言。

---

## 第 5 章 第一次推送到 GitHub

> ✅ 你已经完成了这一章，这里记录下来供以后参考（比如创建新项目时）。

### 5.1 在 GitHub 建仓库

1. 🌐 打开 <https://github.com>，右上角 **+** → **New repository**。
2. Repository name 填 `guestbook`。
3. 选 **Public**（公开）或 **Private**（私有）。
4. ⚠️ **不要勾选** “Add a README file”，也不要选 .gitignore 和 license（本地已经有了，勾了会冲突）。
5. 点 **Create repository**。

### 5.2 关联并推送

💻 本地：

```bash
git remote add origin git@github.com:bbb678777-byte/guestbook.git
```

```bash
git push -u origin main
```

✅ 成功的输出：

```
To github.com:bbb678777-byte/guestbook.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

- `* [new branch] main -> main`：GitHub 上创建了 main 分支，代码上传成功。
- `set up to track`：本地 main 和远程 main 关联好了，**以后直接 `git push` 就行**，不用再写 `-u origin main`。

❌ 如果看到 `error: remote origin already exists.`：说明之前已经关联过了，不影响，直接执行 `git push -u origin main` 即可。地址填错了可以这样改：

```bash
git remote set-url origin git@github.com:bbb678777-byte/guestbook.git
```

---

## 第 6 章 服务器准备

> ⚠️ **本章所有命令都在 🖥️ 服务器上执行**，不是在你的 Windows 电脑上！
> 打开方式：🌐 浏览器登录宝塔面板 → 左侧菜单 **终端**。

### 6.1 确认 Git 和 Docker 都装好了

🖥️ 服务器：

```bash
git --version
```

```bash
docker compose version
```

✅ 两条都显示版本号就可以了。如果 `git` 提示 `command not found`，根据系统安装：

CentOS / Rocky / Alibaba Cloud Linux / OpenCloudOS：

```bash
yum install -y git
```

Ubuntu / Debian：

```bash
apt update && apt install -y git
```

> 如果 `docker compose version` 报错，试试 `docker-compose version`（旧版），有一个能用就行，部署脚本会自动识别。

### 6.2 放行 3001 端口（两个地方都要开！）

外网访问服务器要经过**两道门**，任何一道没开都打不开网页：

```
浏览器 ──▶ 第 1 道门：云厂商安全组 ──▶ 第 2 道门：宝塔防火墙 ──▶ Docker 容器
```

**第 1 道门：宝塔防火墙**

1. 🌐 宝塔面板左侧 → **安全**。
2. 点 **添加端口规则**（或“放行端口”）。
3. 端口填 `3001`，协议选 `TCP`，备注填 `guestbook`。
4. 点 **确定**。

**第 2 道门：云厂商安全组**

1. 🌐 登录你买服务器的平台（阿里云 / 腾讯云 / 华为云等）控制台。
2. 找到这台服务器（ECS 云服务器 或 轻量应用服务器）。
3. 进入 **安全组**（轻量服务器叫 **防火墙**）。
4. 添加**入方向**规则：协议 `TCP`，端口 `3001`，来源 `0.0.0.0/0`。
5. 保存。

### 6.3 私有仓库才需要：配置 Deploy Key

先确认你的仓库是公开还是私有：🌐 打开 `https://github.com/bbb678777-byte/guestbook`，看仓库名旁边的标签。

- **Public**（公开）→ **跳过本节**，直接看第 7 章。
- **Private**（私有）→ 服务器默认没有权限下载私有仓库的代码，需要配一把 **Deploy Key**（只能读取这一个仓库的专用钥匙）。

> ⚠️ GitHub 规定**一把 Deploy Key 只能用在一个仓库**。如果你给 hello-docker 配过，那把不能再给 guestbook 用，要再生成一把新的。

**第 1 步**：🖥️ 服务器生成钥匙：

```bash
ssh-keygen -t ed25519 -C "deploy-key-guestbook" -f ~/.ssh/github_deploy_guestbook -N ""
```

**第 2 步**：🖥️ 服务器显示公钥：

```bash
cat ~/.ssh/github_deploy_guestbook.pub
```

输出一行以 `ssh-ed25519` 开头的内容，**整行复制**。

**第 3 步**：🌐 打开 guestbook 仓库 → **Settings** → 左侧 **Deploy keys** → **Add deploy key**：
- Title：`server`
- Key：粘贴刚才复制的那一行
- **不要**勾选 “Allow write access”
- 点 **Add key**

**第 4 步**：🖥️ 服务器，给这把钥匙起个别名 `github-guestbook`（整段一起复制执行）：

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-guestbook
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy_guestbook
    IdentitiesOnly yes
EOF
```

```bash
chmod 600 ~/.ssh/config
```

**第 5 步**：🖥️ 服务器测试：

```bash
ssh -T git@github-guestbook
```

第一次会问 `Are you sure you want to continue connecting (yes/no)?`，输入 `yes` 回车。

✅ 看到 `Hi bbb678777-byte/guestbook! You've successfully authenticated...` 就成功了。

---

## 第 7 章 第一次手动部署

> ✅ 你已经完成了这一章。

### 7.1 下载代码到服务器

🖥️ 服务器，**公开仓库**用这条：

```bash
git clone https://github.com/bbb678777-byte/guestbook.git /www/wwwroot/guestbook
```

**私有仓库**用这条（用 6.3 配置的别名）：

```bash
git clone git@github-guestbook:bbb678777-byte/guestbook.git /www/wwwroot/guestbook
```

### 7.2 执行部署脚本

🖥️ 服务器：

```bash
cd /www/wwwroot/guestbook && bash deploy.sh
```

✅ 最后几行看到这样的输出就成功了：

```
[deploy ...] ✓ 第 2 次检查通过：{"status":"ok","version":"1.0.0","messages":0}
[deploy ...] ✓ 部署成功！
```

### 7.3 deploy.sh 做了什么

| 步骤 | 做的事 | 说明 |
|---|---|---|
| 1 | `git fetch --all --tags` | 从 GitHub 下载最新代码和版本标签 |
| 2 | `git reset --hard origin/main` | 让服务器代码和 GitHub 的 main 完全一样 |
| 3 | `docker compose up -d --build` | 用新代码重新打包镜像，替换旧容器 |
| 4 | `curl /health`（最多试 15 次） | 确认新版本真的跑起来了 |
| 5 | `docker image prune -f` | 删除旧镜像，释放磁盘空间 |

### 7.4 验证

🌐 浏览器打开 `http://你的服务器IP:3001`，能看到留言板就成功了。

❌ 打不开？99% 是端口没放行，回去检查 6.2 的**两道门**。

---

## 第 8 章 配置 GitHub Actions 自动部署

> ✅ 你已经完成了这一章（Deploy #3 绿色对勾）。

### 8.1 原理

```
你 git push ──▶ GitHub 启动一台临时电脑 ──SSH 登录──▶ 你的服务器 ──▶ 执行 bash deploy.sh
```

也就是说，自动部署 = **GitHub 替你登录服务器，执行第 7 章的 `bash deploy.sh`**。

GitHub 要登录你的服务器，需要知道 4 样东西，存在仓库的 Secrets（保险箱）里：

| Secret 名字 | 填什么 |
|---|---|
| `SERVER_HOST` | 服务器公网 IP |
| `SERVER_USER` | 登录用户，一般是 `root` |
| `SERVER_SSH_KEY` | 服务器上 `~/.ssh/github_actions` 私钥文件的全部内容 |
| `SERVER_PORT` | SSH 端口，是 22 可以不填 |

> Secrets 是**每个仓库各一份**的。如果你配过 hello-docker，guestbook 仓库要再填一遍，**值完全一样**即可。

### 8.2 在服务器上拿到私钥

🖥️ 服务器，先检查钥匙是否已存在：

```bash
ls ~/.ssh/github_actions
```

**情况 A**：显示 `/root/.ssh/github_actions` → 已经有了，跳到下面“显示私钥”。

**情况 B**：显示 `No such file or directory` → 依次执行这 3 条：

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
```

```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

```bash
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
```

（第 1 条生成一对钥匙；第 2 条把公钥加入“允许登录本机”的名单；第 3 条设置正确的权限。）

**显示私钥**：

```bash
cat ~/.ssh/github_actions
```

输出类似：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
......（中间若干行）......
-----END OPENSSH PRIVATE KEY-----
```

选中**从 `-----BEGIN` 那一行到 `-----END ... KEY-----` 那一行**的全部内容复制。**头尾两行都要复制。**

> ⚠️ 私钥等于服务器的登录密码，只填进 GitHub Secrets，不要发给任何人。

另外确认：🌐 宝塔 → **安全** → **SSH 管理** → “SSH 密钥登录”是**开启**的。

### 8.3 在 GitHub 里添加 Secrets

1. 🌐 打开 `https://github.com/bbb678777-byte/guestbook`。
2. 点仓库页面顶部那一排（Code、Issues、Pull requests、Actions……）最右边的 **Settings**。
   ⚠️ 不是右上角头像菜单里的 Settings。
3. 左侧菜单找到 **Secrets and variables** → 点 **Actions**。
4. 确认在 **Secrets** 标签下，点绿色按钮 **New repository secret**。
5. 填第一个：Name 填 `SERVER_HOST`，Secret 填服务器 IP（只填 IP，不加 `http://`、不加端口），点 **Add secret**。
6. 再点 **New repository secret**：Name 填 `SERVER_USER`，Secret 填 `root`，点 **Add secret**。
7. 再点 **New repository secret**：Name 填 `SERVER_SSH_KEY`，Secret 粘贴完整私钥，点 **Add secret**。
8. **SSH 端口不是 22 才需要**：Name 填 `SERVER_PORT`，Secret 填端口号。

注意：
- **名字必须一字不差**（全大写、下划线）。
- 保存后**谁都看不到内容**，只能点铅笔图标 ✏️ 覆盖。填错了就覆盖一次。

### 8.4 手动运行一次测试

1. 🌐 仓库页面顶部点 **Actions**。
2. 左侧点 **Deploy**。
3. 右边点 **Run workflow** → Branch 保持 `main` → 点绿色 **Run workflow**。
4. 列表出现新记录（🟡 黄色 = 正在运行），点进去。
5. 点左侧 **deploy** → 展开 **SSH 到服务器执行部署**，能看到服务器上的部署输出。
6. ✅ 绿色对勾 + 日志最后有 `✓ 部署成功！` → 配置完成。

### 8.5 失败了怎么办

| 日志里的报错 | 原因 | 解决 |
|---|---|---|
| `missing server host` | `SERVER_HOST` 没填或名字写错 | 检查 Secret 名字 |
| `ssh: handshake failed: ssh: unable to authenticate` | 私钥不对 / 公钥没加入 authorized_keys / 宝塔关了密钥登录 | 重新完整复制私钥覆盖；确认执行过 8.2 情况 B 的第 2、3 条；开启宝塔 SSH 密钥登录 |
| `ssh: no key found` | 私钥复制不完整 | 重新复制，头尾两行都要有 |
| `dial tcp ...: i/o timeout` | 端口不对或被防火墙挡了 | SSH 端口不是 22 要填 `SERVER_PORT`；安全组放行 SSH 端口给 `0.0.0.0/0` |
| `cd: /www/wwwroot/guestbook: No such file or directory` | 服务器上还没下载代码 | 先完成第 7 章 |
| `健康检查失败` | 程序启动失败 | 看日志里打印的容器日志，或 🖥️ 执行 `docker logs guestbook` |

---

## 第 9 章 ★ 更新版本：本地修改，自动更新到服务器

> **这是你以后每天都会用到的流程。** 前面第 3～8 章都是一次性准备，从这里开始才是真正的“日常开发”。
> 本章用一个真实例子带你完整走一遍：把留言板从 **v1.0.0** 更新到 **v1.1.0**。

### 9.1 一张图看懂更新流程

```
  💻 本地                                              🌐 GitHub                 🖥️ 服务器
 ─────────────────────────────────────────────────    ──────────────            ─────────────
  第1步  记录更新前的状态（截图）
  第2步  git pull          先同步最新代码
  第3步  改代码            app/server.js
  第4步  改版本号          app/package.json
  第5步  本地测试          node app/server.js
  第6步  git status        看改了哪些文件
  第7步  git diff          看具体改了什么
  第8步  git add .         挑选要提交的改动
  第9步  git commit        存档
  第10步 git tag           贴版本标签
  第11步 git push ─────────────────────────────────▶ 收到新代码
         git push --tags ──────────────────────────▶ 收到标签
                                                      Actions 自动启动 ──SSH──▶ 执行 deploy.sh
  第12步 🌐 在 Actions 页面看部署进度                                            拉代码、重建容器
  第13步 🌐 刷新网页，确认新版本上线 ◀──────────────────────────────────────── 新版本运行中
```

看起来步骤很多，熟练之后整个过程只要 2～3 分钟。

### 9.2 先了解：版本号怎么定

版本号格式是 **`主版本.次版本.修订号`**，比如 `1.0.0`。这套规则叫“语义化版本”（SemVer），是全世界通用的写法：

| 改了什么 | 哪一位 +1 | 例子 |
|---|---|---|
| 修了个 bug、改了错别字 | 最后一位（修订号） | `1.0.0` → `1.0.1` |
| 加了新功能、改了界面 | 中间一位（次版本） | `1.0.1` → `1.1.0` |
| 大改版，和以前不兼容了 | 第一位（主版本） | `1.1.0` → `2.0.0` |

规则：**左边的数字加 1 时，右边的全部归零**。比如 `1.2.5` 加新功能 → `1.3.0`（不是 `1.3.5`）。

Git 标签习惯在前面加一个 `v`：版本 `1.1.0` 对应标签 `v1.1.0`。

本次例子是“改界面标题 + 新增一个功能”，属于次版本更新：**1.0.0 → 1.1.0**。

### 9.3 第 0 步（只做一次）：给当前版本打上 v1.0.0 标签

现在服务器上运行的是 1.0.0，但还没有给它打标签。先补上，**以后如果新版本出问题，就能一键回到这里**。

💻 本地（VS Code 终端，确认路径是 `C:\CODE\1021_xx`）。

先确认当前没有未提交的改动：

```bash
git status
```

✅ 期望看到：

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

❌ 如果看到 `modified: README.md`：说明本教程的改动还没提交，先按 [第 10 章](#第-10-章-只改文档不发新版本) 提交推送，再回来继续。

打标签（`-a` 表示附注标签，`-m` 后面是说明）：

```bash
git tag -a v1.0.0 -m "首个版本：留言板基础功能"
```

推送标签到 GitHub：

```bash
git push origin v1.0.0
```

✅ 期望看到：

```
To github.com:bbb678777-byte/guestbook.git
 * [new tag]         v1.0.0 -> v1.0.0
```

> 💡 只推送标签**不会**触发自动部署（Actions 只监听 main 分支的新提交），所以这一步服务器没有任何变化，放心。

---

### 9.4 第 1 步：记录更新前的状态

🌐 浏览器打开 `http://你的服务器IP:3001`：

1. **先发 2～3 条留言**（用来验证更新后留言还在）。
2. 记下标题下面那行灰色小字，比如：

```
版本 v1.0.0 · 主机 a1b2c3d4e5f6 · 共 3 条留言
```

建议直接截个图，更新后对比。

---

### 9.5 第 2 步：先同步最新代码

💻 本地：

```bash
git pull
```

✅ 期望看到：

```
Already up to date.
```

> 💡 **为什么每次改代码前要先 pull？** 如果你在 GitHub 网页上改过文件，或者在另一台电脑上推送过代码，本地就不是最新的了。先 pull 可以避免后面 push 时被拒绝。养成习惯：**开始干活前先 `git pull`**。

---

### 9.6 第 3 步：修改代码

本次要做两处修改：

- **修改 ①**：把页面标题从「📝 留言板」改成「📝 我的留言板」
- **修改 ②**：新增一个小功能——在留言输入框下面显示“最多 500 字”的提示

#### 修改 ①：改标题

1. 在 VS Code 左侧文件列表点开 `app` → `server.js`。
2. 按 `Ctrl + F` 打开搜索框，输入 `留言板</h1>`，按回车，会跳到这一行（大约第 111 行）：

```html
      <h1>📝 留言板</h1>
```

3. 把它改成：

```html
      <h1>📝 我的留言板</h1>
```

#### 修改 ②：加字数提示

1. 继续在 `server.js` 里，按 `Ctrl + F` 搜索 `说点什么吧`，会跳到这一行（大约第 115 行）：

```html
        <textarea name="text" maxlength="500" placeholder="说点什么吧..." required></textarea>
```

2. 把光标放到这一行的**最末尾**，按 `回车` 新起一行，输入（注意前面的空格要和上一行对齐）：

```html
        <div style="color:#999;font-size:12px;margin:-6px 0 10px;">最多 500 字，请文明留言 🙂</div>
```

改完后这一段应该是这样的：

```html
      <form method="POST" action="/messages">
        <input name="name" maxlength="20" placeholder="你的昵称" required>
        <textarea name="text" maxlength="500" placeholder="说点什么吧..." required></textarea>
        <div style="color:#999;font-size:12px;margin:-6px 0 10px;">最多 500 字，请文明留言 🙂</div>
        <button type="submit">提交留言</button>
      </form>
```

3. **按 `Ctrl + S` 保存。**

> 💡 怎么知道保存了没有？VS Code 顶部的文件标签上，文件名右边如果有一个**白色圆点 ●**，说明还没保存；保存后圆点变成 **×**。
> ⚠️ 不要动 `${...}` 这样的内容，那是程序里的变量。

---

### 9.7 第 4 步：修改版本号

1. 在 VS Code 左侧点开 `app` → `package.json`。
2. 找到第 3 行：

```json
  "version": "1.0.0",
```

3. 改成：

```json
  "version": "1.1.0",
```

4. **按 `Ctrl + S` 保存。**

> ⚠️ 只改数字，**引号和最后的逗号都要保留**。少了引号或逗号，程序会启动失败（JSON 格式错误）。

> 💡 网页上显示的版本号、`/health` 返回的版本号，都是程序从这里读取的。**发版时只需要改这一个地方。**

---

### 9.8 第 5 步：本地测试

**改完代码一定要先在本地测试，确认没问题再推送。** 如果直接推送有 bug 的代码，服务器上的网站就坏了。

💻 本地：

```bash
node app/server.js
```

✅ 启动日志里的版本号应该变成 v1.1.0：

```
[guestbook] v1.1.0 已启动：http://localhost:3000  数据文件=C:\CODE\1021_xx\app\data\messages.json
```

🌐 浏览器打开 <http://localhost:3000>，检查：

- [ ] 标题变成了「📝 我的留言板」
- [ ] 标题下面显示 `版本 v1.1.0`
- [ ] 输入框下面出现了“最多 500 字，请文明留言 🙂”
- [ ] 发一条留言，能正常显示

全部正常后，回到终端按 `Ctrl + C` 停止程序。

❌ **如果启动报错**：

| 报错 | 原因 | 解决 |
|---|---|---|
| `SyntaxError: Unexpected token ... in JSON` | package.json 格式写坏了 | 检查版本号那一行的引号和逗号 |
| `SyntaxError: ...` 并指向 server.js 某一行 | server.js 改坏了 | 看报错提示的行号，检查是不是误删了符号 |
| `EADDRINUSE: address already in use :::3000` | 之前启动的程序还没关 | 找到之前的终端按 `Ctrl + C`，或关掉 VS Code 重新打开 |

改坏了不知道怎么修？可以把文件恢复成修改前的样子，重新改一遍：

```bash
git restore app/server.js
```

---

### 9.9 第 6 步：git status —— 看看改了哪些文件

💻 本地：

```bash
git status
```

✅ 期望看到：

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   app/package.json
        modified:   app/server.js

no changes added to commit (use "git add" and/or "git commit -a")
```

**怎么看懂这段输出：**

| 输出 | 意思 |
|---|---|
| `On branch main` | 你现在在 main 分支 |
| `Changes not staged for commit` | 下面这些文件**改过了，但还没有 `git add`** |
| `modified: app/package.json` | 这个文件被修改了（红色） |

✅ 应该**正好是这两个文件**。如果多出了别的文件，想一想是不是不小心改到了。

> 💡 VS Code 左侧文件列表里，改过的文件名会变成**黄色**并带一个 **M**（Modified，已修改）。

---

### 9.10 第 7 步：git diff —— 看看具体改了什么

💻 本地：

```bash
git diff
```

✅ 期望看到类似这样的输出：

```diff
diff --git a/app/package.json b/app/package.json
--- a/app/package.json
+++ b/app/package.json
@@ -1,6 +1,6 @@
 {
   "name": "guestbook",
-  "version": "1.0.0",
+  "version": "1.1.0",
   "description": "零依赖的简单留言板，练习 Git + Docker 数据卷 + 自动部署",
diff --git a/app/server.js b/app/server.js
--- a/app/server.js
+++ b/app/server.js
@@ -108,11 +108,12 @@ function renderHome() {
 <body>
   <div class="wrap">
     <div class="card">
-      <h1>📝 留言板</h1>
+      <h1>📝 我的留言板</h1>
       <div class="sub">版本 v${VERSION} · 主机 ${escapeHtml(os.hostname())} · 共 ${messages.length} 条留言</div>
       <form method="POST" action="/messages">
         <input name="name" maxlength="20" placeholder="你的昵称" required>
         <textarea name="text" maxlength="500" placeholder="说点什么吧..." required></textarea>
+        <div style="color:#999;font-size:12px;margin:-6px 0 10px;">最多 500 字，请文明留言 🙂</div>
```

**怎么看懂：**

| 行开头 | 颜色 | 意思 |
|---|---|---|
| `-` | 🔴 红色 | 删掉的内容（修改前） |
| `+` | 🟢 绿色 | 新增的内容（修改后） |
| 空格 | 白色 | 没变的上下文，帮你定位 |

如果输出很长，一屏显示不下，会在左下角显示 `:`。这时：
- 按 `空格` 往下翻页
- 按 `q` **退出**（⚠️ 新手常卡在这里，记住按 `q`）

> 💡 **为什么提交前要看 diff？** 这是专业开发者的习惯：确认改的都是自己想改的，没有误删代码、没有留下调试用的东西、没有把密码写进代码。
> 💡 更直观的方法：VS Code 左侧点 **源代码管理** 图标（三个圆点连线的图标，快捷键 `Ctrl + Shift + G`），点任意一个文件，会左右对比显示修改前后。

---

### 9.11 第 8 步：git add —— 把改动放进“待提交区”

💻 本地：

```bash
git add .
```

（注意 `add` 后面有个空格，然后是一个英文句号 `.`，表示“当前目录下所有改动”。）

这条命令执行后**没有任何输出**，这是正常的。

再看一下状态：

```bash
git status
```

✅ 期望看到文件变成了绿色，标题变成了 `Changes to be committed`（准备好提交的改动）：

```
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   app/package.json
        modified:   app/server.js
```

> 💡 **为什么要先 add 再 commit，不能一步到位？** add 是“挑选”，commit 是“存档”。比如你同时改了 3 个文件，但只想先提交其中 2 个，就可以只 add 那 2 个：`git add app/server.js app/package.json`。
> 💡 add 错了想撤回？执行 `git restore --staged 文件名`，文件会回到“改过但没 add”的状态，修改内容不会丢。

---

### 9.12 第 9 步：git commit —— 存档

💻 本地：

```bash
git commit -m "feat: 标题改为我的留言板，新增字数提示，发布 v1.1.0"
```

✅ 期望看到：

```
[main 3f2a1b9] feat: 标题改为我的留言板，新增字数提示，发布 v1.1.0
 2 files changed, 3 insertions(+), 2 deletions(-)
```

| 输出 | 意思 |
|---|---|
| `main` | 提交到了 main 分支 |
| `3f2a1b9` | 这次提交的编号（每次都不一样，你的会不同） |
| `2 files changed` | 改了 2 个文件 |
| `3 insertions(+), 2 deletions(-)` | 新增 3 行，删除 2 行 |

**提交说明怎么写？** 格式是 `类型: 做了什么`，冒号后面有一个空格：

| 类型 | 什么时候用 | 例子 |
|---|---|---|
| `feat` | 新功能 / 界面改动 | `feat: 新增字数提示` |
| `fix` | 修 bug | `fix: 修复留言时间显示错误` |
| `docs` | 只改文档 | `docs: 补充更新版本的教程` |
| `style` | 只改样式、格式 | `style: 调整按钮颜色` |
| `chore` | 杂事（配置、版本号等） | `chore: 发布 v1.1.1` |

> ⚠️ 如果忘了写 `-m "..."`，Git 会打开一个编辑器（可能是一个黑乎乎的 Vim 界面）让你写说明。不会用的话：按 `Esc`，输入 `:q!`，按回车退出，然后重新执行带 `-m` 的命令。

此时**只是在本地存档了，服务器还没有任何变化**。

---

### 9.13 第 10 步：git tag —— 贴上版本标签

💻 本地：

```bash
git tag -a v1.1.0 -m "v1.1.0：标题改为我的留言板，新增字数提示"
```

没有输出是正常的。查看所有标签：

```bash
git tag
```

✅ 期望看到：

```
v1.0.0
v1.1.0
```

> ⚠️ 标签名要和 package.json 里的版本号**对应**：版本 `1.1.0` → 标签 `v1.1.0`。

---

### 9.14 第 11 步：git push —— 推送到 GitHub（触发自动部署）

**先推送代码**（这一步会触发自动部署）：

💻 本地：

```bash
git push
```

✅ 期望看到：

```
Enumerating objects: 9, done.
Counting objects: 100% (9/9), done.
Delta compression using up to 4 threads
Compressing objects: 100% (5/5), done.
Writing objects: 100% (5/5), 712 bytes | 712.00 KiB/s, done.
Total 5 (delta 3), reused 0 (delta 0), pack-reused 0 (from 0)
To github.com:bbb678777-byte/guestbook.git
   78e29cd..3f2a1b9  main -> main
```

最后一行 `78e29cd..3f2a1b9  main -> main` 的意思是：GitHub 上的 main 从旧提交 `78e29cd` 更新到了新提交 `3f2a1b9`。

**再推送标签**（`git push` 默认不推送标签，要单独推）：

```bash
git push --tags
```

✅ 期望看到：

```
To github.com:bbb678777-byte/guestbook.git
 * [new tag]         v1.1.0 -> v1.1.0
```

> 💡 你可能会好奇 v1.0.0 为什么没出现在这里？因为 9.3 节已经推送过了，Git 只推送 GitHub 上还没有的标签。

---

### 9.15 第 12 步：在 Actions 页面看部署进度

**push 完马上去看**：

1. 🌐 打开 `https://github.com/bbb678777-byte/guestbook/actions`
2. 列表最上面会出现一条新记录，标题就是你的提交说明「feat: 标题改为我的留言板，新增字数提示，发布 v1.1.0」。
3. 左边的图标表示状态：

| 图标 | 意思 |
|---|---|
| 🟡 黄色圆圈（转动） | 正在部署，等一等 |
| ✅ 绿色对勾 | 部署成功 |
| ❌ 红色叉号 | 部署失败，点进去看日志 |

4. 点进这条记录 → 点左侧 **deploy** → 展开 **SSH 到服务器执行部署**，可以实时看到服务器上的部署过程。
5. ✅ 日志最后应该是：

```
[deploy ...] 当前提交：3f2a1b9 feat: 标题改为我的留言板，新增字数提示，发布 v1.1.0 (...)
...
[deploy ...] ✓ 第 1 次检查通过：{"status":"ok","version":"1.1.0","messages":3}
[deploy ...] ✓ 部署成功！
```

注意这里的 `"version":"1.1.0"`——服务器上已经是新版本了！`"messages":3` 说明留言都还在。

一般 10 秒～1 分钟就能完成。

> 💡 这次的触发方式会显示 **push**（之前手动运行时显示的是 workflow_dispatch / Manually triggered），说明是 push 自动触发的。

---

### 9.16 第 13 步：确认新版本上线

可以在下面 5 个地方确认版本已经更新：

**① 网页首页（最直观）**

🌐 打开 `http://你的服务器IP:3001`，按 `Ctrl + F5` 强制刷新（避免浏览器缓存），对比第 1 步的截图：

```
更新前：📝 留言板       版本 v1.0.0 · 主机 a1b2c3d4e5f6 · 共 3 条留言
更新后：📝 我的留言板   版本 v1.1.0 · 主机 9f8e7d6c5b4a · 共 3 条留言
```

| 对比项 | 变化 | 说明 |
|---|---|---|
| 标题 | 变成「我的留言板」 | 新代码生效了 |
| 字数提示 | 新出现 | 新功能上线了 |
| 版本号 | v1.0.0 → **v1.1.0** | 版本更新成功 |
| 主机名 | **变了** | 旧容器被删除，换成了新容器 |
| 留言条数 | **没变** | 数据卷起作用了，留言没有丢（见第 12 章） |

**② 健康检查接口**

🌐 打开 `http://你的服务器IP:3001/health`：

```json
{
  "status": "ok",
  "version": "1.1.0",
  "messages": 3
}
```

**③ GitHub Actions 页面**

见上一步，日志里有 `"version":"1.1.0"`。

**④ GitHub 标签页面**

🌐 打开 `https://github.com/bbb678777-byte/guestbook/tags`，能看到 `v1.0.0` 和 `v1.1.0` 两个标签。这里就是你的**版本发布记录**，以后回滚就是回到这里的某个版本。

**⑤ 服务器上**

🖥️ 服务器：

```bash
curl http://127.0.0.1:3001/health
```

```bash
cd /www/wwwroot/guestbook && git log -1 --oneline
```

🎉 **恭喜！你完成了第一次完整的版本更新！**

---

### 9.17 更新流程命令汇总（以后照着这个做）

熟悉之后，每次更新只需要照着这个清单：

```
□ 1. git pull                                       先同步
□ 2. 改代码（app/server.js 等），Ctrl+S 保存
□ 3. 改版本号（app/package.json），Ctrl+S 保存
□ 4. node app/server.js → 浏览器测试 → Ctrl+C 停止
□ 5. git status                                     看改了哪些文件
□ 6. git diff                                       看改了什么（按 q 退出）
□ 7. git add .
□ 8. git commit -m "feat: 做了什么，发布 vX.Y.Z"
□ 9. git tag -a vX.Y.Z -m "vX.Y.Z：做了什么"
□ 10. git push
□ 11. git push --tags
□ 12. 打开 GitHub Actions 看到绿色对勾 ✅
□ 13. 刷新网页确认版本号
```

### 9.18 课后练习：自己再发一个版本

不看教程，自己试着发布 **v1.1.1**：

- 修改内容：把提交按钮的文字从“提交留言”改成“发布留言”（在 server.js 里搜索 `提交留言</button>`）。
- 这算 bug 修复还是新功能？→ 只是改个文字，算小修改，**修订号 +1**：`1.1.0` → `1.1.1`。
- 提交说明可以写：`fix: 按钮文字改为发布留言，发布 v1.1.1`
- 标签：`v1.1.1`

做完后刷新网页，确认显示 `v1.1.1`，按钮文字变了，留言都还在。

---

## 第 10 章 只改文档、不发新版本

有时候你只改了 README.md 这样的文档，没有改程序，**不需要改版本号、也不需要打标签**，只需要提交推送：

💻 本地：

```bash
git status
```

```bash
git add README.md
```

```bash
git commit -m "docs: 完善学习教程"
```

```bash
git push
```

> 💡 push 到 main 依然会触发一次自动部署。程序没变，Docker 会用缓存，十几秒就完成，网页上的版本号也不会变。这是正常的，正好可以用来测试自动部署是否正常。

---

## 第 11 章 回滚：新版本出问题了怎么办

假设你发布了 v1.1.0 后发现有问题，想恢复到 v1.0.0。有两种方法：

### 方法 A：git revert（推荐 ✅，正规做法）

`git revert` 会生成一个**新的提交**，内容正好是“撤销某次提交的改动”。历史记录完整保留，能清楚看到“什么时候、为什么撤销了”。

**第 1 步**：💻 本地，查看提交历史，找到出问题的那次提交：

```bash
git log --oneline
```

输出类似：

```
3f2a1b9 (HEAD -> main, tag: v1.1.0, origin/main) feat: 标题改为我的留言板，新增字数提示，发布 v1.1.0
78e29cd (tag: v1.0.0) feat: 初始化 guestbook 留言板项目
```

出问题的是 `3f2a1b9`（你的编号会不一样，用你自己看到的）。如果列表很长，按 `q` 退出。

**第 2 步**：撤销这次提交（`--no-edit` 表示直接使用默认的提交说明，不打开编辑器）：

```bash
git revert --no-edit 3f2a1b9
```

✅ 期望看到：

```
[main 8c7d6e5] Revert "feat: 标题改为我的留言板，新增字数提示，发布 v1.1.0"
 2 files changed, 2 insertions(+), 3 deletions(-)
```

此时 server.js 和 package.json 都恢复成了 1.0.0 时的内容。

**第 3 步**：本地测试一下：

```bash
node app/server.js
```

确认没问题后 `Ctrl + C` 停止。

**第 4 步**：推送，自动部署：

```bash
git push
```

在 Actions 页面看到绿色对勾后，刷新网页，版本恢复为 v1.0.0。

> 💡 **回滚后网页上显示的版本号是 1.0.0**，这没问题。等你修好了 bug，再发布一个新版本，比如 `v1.1.1`。**版本号只往前走**，修好后不要再用 `v1.1.0` 这个号。

### 方法 B：服务器紧急回滚（临时措施 ⚠️）

网站挂了，需要**几十秒内恢复**时使用。

🖥️ 服务器：

```bash
cd /www/wwwroot/guestbook && bash deploy.sh v1.0.0
```

服务器会立刻切换到 v1.0.0 标签对应的代码并重新部署。

> ⚠️ **这只是临时止血！** GitHub 上的 main 分支仍然是有问题的代码。**下次任何人 push，自动部署就会把有问题的版本又发上去。** 所以紧急回滚后，一定要尽快按方法 A 在本地 revert 并 push。

### 两种方法对比

| | 方法 A：git revert | 方法 B：deploy.sh v1.0.0 |
|---|---|---|
| 在哪执行 | 💻 本地 | 🖥️ 服务器 |
| 速度 | 1～2 分钟 | 几十秒 |
| GitHub 上的代码 | 同步恢复 ✅ | 没变 ❌ |
| 下次 push 后 | 正常 | 问题版本会重新上线 |
| 适合 | **日常回滚（首选）** | 紧急止血，之后必须补做方法 A |

---

## 第 12 章 数据卷：留言为什么不会丢

### 12.1 原理

每次部署，Docker 都会**删除旧容器、创建新容器**（所以主机名会变）。容器里的文件会跟着容器一起被删除。

如果留言存在容器里，每次更新版本留言就全没了。所以我们在 `docker-compose.yml` 里配置了一个**数据卷**：

```yaml
    volumes:
      - guestbook-data:/app/data   # 把数据卷挂载到容器的 /app/data 目录
```

```
旧容器 ──写入──┐
              ├──▶  数据卷 guestbook-data（存在服务器硬盘上，和容器无关）
新容器 ──读取──┘
```

程序把留言写到 `/app/data/messages.json`，这个目录实际上是数据卷，**容器删了，数据卷还在**，新容器启动后接着读取原来的数据。

> 对比：第一个项目 hello-docker 的“访问次数”存在内存里，所以每次更新都会归零。

### 12.2 查看数据卷

🌐 宝塔面板 → **Docker** → **存储卷**（有的版本叫“卷”），能看到 `guestbook_guestbook-data`。

或者 🖥️ 服务器：

```bash
docker volume ls
```

查看数据卷在服务器硬盘上的实际位置（看输出里的 `Mountpoint`）：

```bash
docker volume inspect guestbook_guestbook-data
```

> 💡 名字前面的 `guestbook_` 是 Docker 自动加的项目名前缀（取自目录名 `/www/wwwroot/guestbook`）。

### 12.3 备份留言

🖥️ 服务器，把留言文件复制出来：

```bash
docker cp guestbook:/app/data/messages.json /root/messages-backup-$(date +%Y%m%d).json
```

查看备份文件：

```bash
ls -l /root/messages-backup-*
```

### 12.4 ⚠️ 千万不要做的事

- ❌ **不要执行 `docker compose down -v`**：`-v` 会把数据卷一起删除，留言全部丢失。
  （普通的 `docker compose down` 和 `deploy.sh` 都不会删数据卷，放心用。）
- ❌ 在宝塔面板删除容器时，**不要勾选“同时删除存储卷”**之类的选项。
- ❌ 不要在宝塔“存储卷”页面删除 `guestbook_guestbook-data`。

---

## 第 13 章 常见问题

### 13.1 本地 Git 相关

**Q：执行 git 命令报错 `fatal: not a git repository`**

你不在项目目录里。看终端左边的路径，切换到项目目录：

```bash
cd C:\CODE\1021_xx
```

**Q：`git commit` 提示 `nothing to commit, working tree clean`**

没有任何改动可以提交。可能原因：
- 文件改了但**没保存**（VS Code 文件名旁边有白色圆点 ●），按 `Ctrl + S` 保存。
- 改错了文件夹里的文件。

**Q：`git commit` 提示 `no changes added to commit`**

改了文件但忘了 `git add`。先执行 `git add .` 再 commit。

**Q：`git push` 提示 `Everything up-to-date`**

没有新的提交需要推送。是不是忘了 `git commit`？用 `git status` 和 `git log --oneline -3` 检查一下。

**Q：`git push` 被拒绝 `! [rejected] main -> main (fetch first)`**

GitHub 上有你本地没有的提交（比如你在 GitHub 网页上改过文件）。先拉取再推送：

```bash
git pull --rebase
```

```bash
git push
```

> ⚠️ 不要用 `git push --force` 强推，它会覆盖 GitHub 上的提交。

**Q：`git tag` 报错 `fatal: tag 'v1.1.0' already exists`**

这个标签已经用过了。版本号只能往前走，换一个新版本号（比如 `v1.1.1`），同时记得 package.json 里也改成对应的版本。

**Q：忘了 `git push --tags`，怎么办？**

不影响部署（部署只看 main 分支）。补推一下就行：

```bash
git push --tags
```

**Q：commit 之后发现提交说明写错了 / 漏改了文件**

如果**还没有 push**，可以修改最后一次提交：

```bash
git add .
```

```bash
git commit --amend -m "新的提交说明"
```

如果已经 push 了，就不要改了，再提交一次修正就行。

**Q：提交时出现 `warning: in the working copy of 'xxx', LF will be replaced by CRLF`**

这是换行符的提示，**不是错误**，可以忽略。项目里的 `.gitattributes` 已经保证上传到 GitHub 的文件是正确的格式。

**Q：`git diff` 或 `git log` 里的中文显示成乱码或 `\346\210\221` 这样的编码**

💻 本地执行这两条：

```bash
git config --global core.quotepath false
```

```bash
git config --global i18n.logOutputEncoding utf-8
```

**Q：`git diff` / `git log` 之后终端卡住了，左下角显示 `:` 或 `(END)`**

这是分页显示模式，按 `q` 退出。

**Q：执行 `git commit` 后进入了一个看不懂的黑色编辑界面**

这是 Vim 编辑器（忘了写 `-m` 时会打开）。按 `Esc`，输入 `:q!`，按回车退出，然后重新执行带 `-m "说明"` 的 commit 命令。

### 13.2 部署相关

**Q：Actions 显示绿色对勾，但网页没变化**

1. 按 `Ctrl + F5` 强制刷新浏览器（清除缓存）。
2. 打开 `/health` 看版本号——如果是新的，说明是浏览器缓存问题。
3. 如果 `/health` 的版本号也是旧的，检查 package.json 的版本号是不是忘了改，或者忘了保存。

**Q：Actions 显示红色叉号**

点进去看日志最后几行的报错，对照 [8.5 节](#85-失败了怎么办) 的表格排查。如果是 `健康检查失败`，说明新代码有 bug 启动不了：
- 服务器上旧容器已经被替换，网站可能打不开，可以先按 [方法 B](#方法-b服务器紧急回滚临时措施-️) 紧急回滚。
- 然后在本地运行 `node app/server.js` 找出问题，修好后发布新版本。

**Q：Actions 根本没有运行**

- 检查是不是推送到了 main 分支（`git push` 输出的最后一行应该是 `main -> main`）。
- 只推送标签（`git push --tags`）不会触发部署，这是正常的。

**Q：网页打不开**

按顺序排查：

1. 🖥️ 服务器，容器在运行吗？

```bash
docker ps -a
```

`guestbook` 的 STATUS 应该是 `Up ... (healthy)`。

2. 🖥️ 服务器本机能访问吗？

```bash
curl http://127.0.0.1:3001/health
```

3. 本机能访问、外网打不开 → **端口没放行**，检查 6.2 的**两道门**。
4. 本机也访问不了 → 看容器日志：

```bash
docker logs --tail 50 guestbook
```

**Q：服务器执行 deploy.sh 报 `$'\r': command not found`**

文件的换行符变成了 Windows 格式。🖥️ 服务器临时修复：

```bash
sed -i 's/\r$//' /www/wwwroot/guestbook/deploy.sh
```

**Q：拉取镜像超时（`pulling node:20-alpine` 卡住、`i/o timeout`）**

国内服务器访问 Docker Hub 慢，需要配置镜像加速：🌐 宝塔 → **Docker** → **设置** → **加速 URL**，填入可用的加速地址。详见第一个项目教程 `C:\CODE\1020_xuexi_Docker\教程.md` 第 6.4 节。

---

## 第 14 章 命令速查表

### 14.1 日常更新（💻 本地）

| 命令 | 作用 |
|---|---|
| `git pull` | 开始干活前，同步最新代码 |
| `node app/server.js` | 本地运行测试（`Ctrl + C` 停止） |
| `git status` | 查看哪些文件改了 |
| `git diff` | 查看具体改了什么（`q` 退出） |
| `git add .` | 把所有改动加入待提交区 |
| `git commit -m "feat: 说明"` | 提交（存档） |
| `git tag -a v1.1.0 -m "说明"` | 打版本标签 |
| `git push` | 推送代码（**触发自动部署**） |
| `git push --tags` | 推送标签 |

### 14.2 查看和撤销（💻 本地）

| 命令 | 作用 |
|---|---|
| `git log --oneline` | 查看提交历史（`q` 退出） |
| `git tag` | 查看所有标签 |
| `git restore 文件名` | 放弃某个文件的修改（⚠️ 修改会丢失） |
| `git restore --staged 文件名` | 撤销 add，修改保留 |
| `git commit --amend -m "新说明"` | 修改最后一次提交（只能在 push 之前） |
| `git revert --no-edit 提交编号` | 撤销某次提交（生成新提交，推荐的回滚方法） |
| `git remote -v` | 查看关联的 GitHub 地址 |

### 14.3 服务器（🖥️ 宝塔终端）

| 命令 | 作用 |
|---|---|
| `cd /www/wwwroot/guestbook && bash deploy.sh` | 手动部署最新代码 |
| `cd /www/wwwroot/guestbook && bash deploy.sh v1.0.0` | 紧急回滚到指定版本 |
| `curl http://127.0.0.1:3001/health` | 健康检查 |
| `docker ps` | 查看运行中的容器 |
| `docker logs --tail 50 guestbook` | 查看最近 50 行日志 |
| `docker logs -f guestbook` | 实时查看日志（`Ctrl + C` 退出） |
| `docker restart guestbook` | 重启容器 |
| `docker volume ls` | 查看数据卷 |
| `docker cp guestbook:/app/data/messages.json /root/backup.json` | 备份留言 |

### 14.4 网页地址（🌐 浏览器）

| 地址 | 作用 |
|---|---|
| `http://你的服务器IP:3001` | 留言板首页 |
| `http://你的服务器IP:3001/health` | 健康检查（看版本号） |
| `https://github.com/bbb678777-byte/guestbook` | GitHub 仓库 |
| `https://github.com/bbb678777-byte/guestbook/actions` | 部署记录 |
| `https://github.com/bbb678777-byte/guestbook/tags` | 版本标签 |
| `https://github.com/bbb678777-byte/guestbook/settings/secrets/actions` | Secrets 设置 |
