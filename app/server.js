'use strict';

// 简单留言板：只用 Node.js 自带模块，留言保存在 JSON 文件里
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const pkg = require(path.join(__dirname, 'package.json'));
const VERSION = pkg.version;
const PORT = Number(process.env.PORT) || 3000;

// 数据目录：Docker 里挂载数据卷到 /app/data，本地运行就是 app/data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');
const MAX_MESSAGES = 200;

fs.mkdirSync(DATA_DIR, { recursive: true });

function loadMessages() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return []; // 文件不存在或损坏时从空列表开始
  }
}

// 先写临时文件再改名，避免写到一半断电导致文件损坏
function saveMessages(list) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

let messages = loadMessages();

function toBeijingTime(date) {
  return new Date(date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

// 转义用户输入，防止有人在留言里写 <script> 搞破坏（XSS）
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

// 读取请求体，限制 10KB 防止恶意大请求
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024) {
        reject(new Error('请求体太大'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function renderHome() {
  const items = messages
    .map(
      (m) => `
      <li>
        <div class="meta"><b>${escapeHtml(m.name)}</b> · ${toBeijingTime(m.time)}</div>
        <div class="text">${escapeHtml(m.text)}</div>
      </li>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>最新留言板 v${VERSION}</title>
  <style>
    body { font-family: -apple-system, "Microsoft YaHei", sans-serif; background: #f3f5f9; margin: 0; }
    .wrap { max-width: 600px; margin: 40px auto; padding: 0 16px; }
    .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,.06); margin-bottom: 20px; }
    h1 { margin: 0 0 4px; color: #0f9d58; }
    .sub { color: #888; font-size: 13px; margin-bottom: 16px; }
    input, textarea { width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #ddd;
                      border-radius: 8px; font: inherit; margin-bottom: 10px; }
    textarea { height: 80px; resize: vertical; }
    button { background: #0f9d58; color: #fff; border: 0; padding: 10px 22px; border-radius: 8px;
             font-size: 15px; cursor: pointer; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { border-bottom: 1px solid #eee; padding: 12px 0; }
    li:last-child { border-bottom: 0; }
    .meta { color: #666; font-size: 13px; margin-bottom: 4px; }
    .text { white-space: pre-wrap; word-break: break-word; }
    .empty { color: #aaa; text-align: center; padding: 20px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>📝 最新的留言板</h1>
      <div class="sub">版本 v${VERSION} · 主机 ${escapeHtml(os.hostname())} · 共 ${messages.length} 条留言</div>
      <form method="POST" action="/messages">
        <input name="name" maxlength="20" placeholder="你的昵称" required>
        <textarea name="text" maxlength="500" placeholder="说点什么吧...最多 500 字..我后面添加的" required></textarea>
        <button type="submit">提交留言</button>
      </form>
    </div>
    <div class="card">
      <ul>${items || '<li class="empty">还没有留言，来抢沙发吧～</li>'}</ul>
    </div>
  </div>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { status: 'ok', version: VERSION, messages: messages.length });
    }

    if (req.method === 'GET' && url.pathname === '/api/messages') {
      return sendJson(res, 200, messages);
    }

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderHome());
    }

    // 网页表单提交（application/x-www-form-urlencoded）
    if (req.method === 'POST' && url.pathname === '/messages') {
      const form = new URLSearchParams(await readBody(req));
      const name = (form.get('name') || '').trim().slice(0, 20);
      const text = (form.get('text') || '').trim().slice(0, 500);

      if (name && text) {
        messages.unshift({ name, text, time: new Date().toISOString() }); // 新留言放最前面
        messages = messages.slice(0, MAX_MESSAGES);
        saveMessages(messages);
      }
      // 提交后跳回首页，刷新页面不会重复提交
      res.writeHead(303, { Location: '/' });
      return res.end();
    }

    sendJson(res, 404, { error: 'Not Found', path: url.pathname });
  } catch (err) {
    console.error('[guestbook] 请求出错：', err.message);
    sendJson(res, 400, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[guestbook] v${VERSION} 已启动：http://localhost:${PORT}  数据文件=${DATA_FILE}`);
});

// 优雅退出：docker stop 发送 SIGTERM
function shutdown(signal) {
  console.log(`[guestbook] 收到 ${signal}，正在退出...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
