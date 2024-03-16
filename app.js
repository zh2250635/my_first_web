const express = require('express');
const app = express();
const { Server } = require('socket.io');
const server = require('http').createServer(app);
const io = new Server(server);
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env['APP_PORT']

const dbManager = require('./api/db_manager.js');

const loginRouter = require('./api/login.js');
const logoutRouter = require('./api/logout.js');
const getAccountRouter = require('./api/az_account.js')(dbManager);
const oneapiRouter = require('./api/oneapi.js')(dbManager);
const oneapiRouter2 = require('./api/oneChannels.js')(dbManager);
const tpsRouter = require('./api/channel_tps_count.js')(dbManager);
const configRouter = require('./api/config.js');
const az_portalRouter = require('./api/az_portal.js')(dbManager);

function auth(req, res, next) {
    const token = req.cookies.jwt;

    if (!token) {
        // 如果没有 token，重定向到 /login
        return res.redirect('/login');
    }

    try {
        // 验证 token
        jwt.verify(token, process.env.JWT_KEY);
        console.log('验证通过');
        // 如果验证通过，调用 next() 函数，将控制权传递给下一个中间件或路由处理器
        next();
    } catch (err) {
        // 如果验证不通过，重定向到 /login
        return res.redirect('/login');
    }
}

// 使用中间件
getAccountRouter.use(auth);
oneapiRouter.use(auth);
oneapiRouter2.use(auth);

app.use(cookieParser());
app.use(express.json()); // 用于解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 用于解析表单数据
app.use('/api/login', loginRouter); // 使用登录路由
app.use('/logout', logoutRouter); // 使用登出路由
app.use('/api/az_account', getAccountRouter); // 使用获取账号信息路由
app.use('/api/oneapi', oneapiRouter); // 使用获取oneapi信息路由
app.use('/api/oneChannels', oneapiRouter2); // 使用获取oneapi信息路由
app.use('/api/tps', tpsRouter); // 使用获取oneapi信息路由
app.use('/api/config', configRouter); // 使用配置信息信息路由
app.use('/api/az_portal', az_portalRouter); // 使用Azure Portal api路由

// 为静态文件（如HTML、CSS、JavaScript文件）设置一个目录
app.use(express.static('public'));

// 设置一个路由，当访问根URL时，发送一个简单的响应
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/az_portal', (req, res) => {
  res.sendFile(__dirname + '/public/az_portal.html');
});

// 导入 WebSocket 模块并传递 io 实例
require('./api/websocket')(io);

// 启动服务器
server.listen(port, () => {
  console.log(`服务器已启动，正在监听端口 ${port}`);
});

// 程序退出时关闭数据库连接和服务器
process.on('SIGINT', () => {
    dbManager.close();
    console.log('数据库连接已关闭');
    server.close();
    console.log('服务器已关闭');
    process.exit();
});

// 程序遇到未捕获的异常时关闭数据库连接和服务器
process.on('uncaughtException', (err) => {
    console.error(err);
    dbManager.close();
    console.log('数据库连接已关闭');
    server.close();
    console.log('服务器已关闭');
    process.exit();
});