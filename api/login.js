const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { username, password } = req.body;

    // 在这里添加验证逻辑
    // 例如: 检查用户名和密码是否匹配
    if (username === 'user' && password === 'passwd') {
        res.cookie('user', username);
        res.redirect('/');
    } else {
        res.send('登录失败');
    }
});

module.exports = router;
