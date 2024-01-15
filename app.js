const express = require('express');
const app = express();
const port = 3000;
const loginRouter = require('./api/login.js');
const logoutRouter = require('./api/logout.js');

app.use(express.json()); // 用于解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 用于解析表单数据
app.use('/api/login', loginRouter); // 使用登录路由
app.use('/logout', logoutRouter); // 使用登出路由

// 为静态文件（如HTML、CSS、JavaScript文件）设置一个目录
app.use(express.static('public'));

// 设置一个路由，当访问根URL时，发送一个简单的响应
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// 监听指定端口，启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
