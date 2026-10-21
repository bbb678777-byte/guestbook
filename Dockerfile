# 基础镜像：官方 Node.js 20 的 alpine 精简版
FROM node:20-alpine

# 容器内的工作目录
WORKDIR /app

# 生产模式
ENV NODE_ENV=production
# 留言数据保存的目录（docker-compose.yml 会把数据卷挂载到这里）
ENV DATA_DIR=/app/data

# 先复制 package.json，利用分层缓存
COPY app/package.json ./

# 再复制程序代码
COPY app/ ./

# 创建数据目录并交给 node 用户，否则非 root 用户写不进去
RUN mkdir -p /app/data && chown -R node:node /app/data

# 声明容器监听的端口
EXPOSE 3000

# 健康检查：用 wget 访问 /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# 用非 root 用户运行，更安全
USER node

# 启动命令（exec 格式，node 能直接收到 SIGTERM）
CMD ["node", "server.js"]
