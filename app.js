const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = 3000;
const loginRouter = require('./api/login.js');
const logoutRouter = require('./api/logout.js');

function auth(req, res, next) {
    const token = req.cookies.jwt;

    if (!token) {
        // 如果没有 token，重定向到 /login
        return res.redirect('/login');
    }

    try {
        // 验证 token
        jwt.verify(token, process.env.JWT_KEY);
        // 如果验证通过，调用 next() 函数，将控制权传递给下一个中间件或路由处理器
        next();
    } catch (err) {
        // 如果验证不通过，重定向到 /login
        return res.redirect('/login');
    }
}

// 使用中间件
// app.use(auth);

app.use(cookieParser());
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
