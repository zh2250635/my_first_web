const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

router.post('/', (req, res) => {
    const { username, password } = req.body;

    // 在这里添加验证逻辑
    // 例如: 检查用户名和密码是否匹配
    if (username === 'user' && password === 'passwd') {
        // 创建 JWT
        const token = jwt.sign({ username }, process.env.JWT_KEY, { expiresIn: '14d' });

        // 设置 JWT 为 cookie
        res.cookie('jwt', token, { maxAge: 14 * 24 * 60 * 60 * 1000 });

        res.redirect('/');
    } else {
        res.send('登录失败');
    }
});

module.exports = router;