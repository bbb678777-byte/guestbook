# 📝 guestbook 留言板

一个零依赖的简单留言板，用来练习**第二个项目**的「本地开发 → GitHub → 宝塔 Docker」流程。

> 详细的基础教程见第一个项目 `C:\CODE\1020_xuexi_Docker\教程.md`。本文只写**和第一个项目不一样的地方**。

## 和 hello-docker 的区别

| | hello-docker | guestbook（本项目） |
|---|---|---|
| GitHub 仓库名 | `hello-docker` | `guestbook` |
| 服务器目录 | `/www/wwwroot/hello-docker` | `/www/wwwroot/guestbook` |
| 容器名 | `hello-docker` | `guestbook` |
| 对外端口 | `3000` | **`3001`**（同一台服务器端口不能重复） |
| 数据 | 存内存，重启就没了 | 存在 **Docker 数据卷**，重建容器也不丢 |

**新知识点：数据卷（volume）**

```
容器 guestbook ──写入 /app/data/messages.json──▶ 数据卷 guestbook-data（Docker 管理，存在宿主机上）
```

容器是“一次性”的：每次部署都会删掉旧容器、创建新容器，容器里的文件会全部丢失。
把需要保存的数据放进数据卷，数据就和容器分开了，换多少次容器数据都还在。

## 功能

| 地址 | 作用 |
|---|---|
| `/` | 留言板首页：填昵称和内容提交，新留言显示在最上面 |
| `/health` | 健康检查，返回 status、version 和留言条数 |
| `/api/messages` | 所有留言的 JSON |

## 1. 本地运行

```bash
node app/server.js
```

打开 <http://localhost:3000> 发几条留言。本地数据保存在 `app/data/messages.json`（已在 .gitignore 里，不会提交）。

## 2. 推送到 GitHub

在 GitHub 新建仓库 `guestbook`（**不要**勾选 README），然后在本目录执行：

```bash
git remote add origin git@github.com:你的用户名/guestbook.git
```

```bash
git push -u origin main
```

## 3. 服务器准备（只需做一次）

**① 放行 3001 端口**：宝塔「安全」和云厂商「安全组」**两边**都要加 3001。

**② 私有仓库才需要：配置新的 Deploy Key**

⚠️ GitHub 规定**一把 Deploy Key 只能用在一个仓库**，hello-docker 用过的那把不能再加到 guestbook，需要再生成一把：

```bash
ssh-keygen -t ed25519 -C "deploy-key-guestbook" -f ~/.ssh/github_deploy_guestbook -N ""
```

```bash
cat ~/.ssh/github_deploy_guestbook.pub
```

把公钥加到 guestbook 仓库 → Settings → Deploy keys。然后给它起个别名 `github-guestbook`：

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-guestbook
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy_guestbook
    IdentitiesOnly yes
EOF
```

克隆时把地址里的 `github.com` 换成别名 `github-guestbook`（见下一步）。

## 4. 第一次手动部署

公开仓库：

```bash
git clone https://github.com/你的用户名/guestbook.git /www/wwwroot/guestbook
```

私有仓库（用上面的别名）：

```bash
git clone git@github-guestbook:你的用户名/guestbook.git /www/wwwroot/guestbook
```

部署：

```bash
cd /www/wwwroot/guestbook && bash deploy.sh
```

浏览器打开 `http://你的服务器IP:3001`，发一条留言试试。

## 5. 配置 GitHub Actions 自动部署

Secrets 是**按仓库**保存的，guestbook 仓库要重新填一遍：
仓库 → Settings → Secrets and variables → Actions，添加 `SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY`（`SERVER_PORT` 是 22 可不填）。

> 登录服务器用的那把 Actions 密钥（`~/.ssh/github_actions`）**可以复用**，值和 hello-docker 填的一样即可：
> `cat ~/.ssh/github_actions`

然后 Actions → Deploy → Run workflow 手动跑一次测试。

## 6. 验证数据卷：更新版本后留言还在

1. 先在网页上发几条留言。
2. 本地改点东西，比如把 `app/server.js` 里的标题 `📝 留言板` 改成 `📝 我的留言板`，`app/package.json` 版本改成 `1.1.0`。
3. 提交、打标签、推送：

```bash
git add .
```

```bash
git commit -m "feat: 修改标题，发布 v1.1.0"
```

```bash
git tag -a v1.1.0 -m "v1.1.0"
```

```bash
git push
```

```bash
git push --tags
```

4. Actions 跑完后刷新网页：版本变成 v1.1.0、主机名变了（新容器），**但之前的留言都还在** ✅

## 数据卷管理

查看数据卷（宝塔 Docker →「存储卷」也能看到）：

```bash
docker volume ls
```

查看数据卷在宿主机上的实际位置：

```bash
docker volume inspect guestbook_guestbook-data
```

备份留言数据到当前目录：

```bash
docker cp guestbook:/app/data/messages.json ./messages-backup.json
```

> ⚠️ **千万不要执行 `docker compose down -v`**，`-v` 会把数据卷一起删掉，留言全部丢失。
> 普通的 `docker compose down` 和 `deploy.sh` 都不会删数据卷。
> 在宝塔面板删除容器时，也不要勾选“同时删除存储卷”。
