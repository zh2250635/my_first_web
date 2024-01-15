const fs = require('fs');
const path = require('path');

const loadRoutes = (app, dirname) => {
    fs.readdirSync(dirname).forEach((file) => {
        // 获取文件的绝对路径
        const filepath = path.join(dirname, file);
        const fileStat = fs.statSync(filepath);

        if (fileStat.isDirectory()) {
            // 如果是目录，则递归加载
            loadRoutes(app, filepath);
        } else if (fileStat.isFile() && path.extname(file) === '.js') {
            // 如果是JavaScript文件，则导入路由
            const route = require(filepath);
            app.use(route);
        }
    });
};

module.exports = loadRoutes;
