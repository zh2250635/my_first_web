const exoress = require('express');
const router = exoress.Router();
const mysql = require('mysql');
const fs = require('fs');
const { Worker } = require('worker_threads');
const { check_preview, is_account_alive, list_sub_ids } = require('../auto_core/requirements/account.js');
const { apply_preview } = require('../auto_core/requirements/allpy_preview.js')
const { ClientSecretCredential } = require('@azure/identity');
require('dotenv').config();

function connect_db() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWD,
        database: process.env.DB_NAME,
    });
}

router.get('/', (req, res) => {
    function connect_db() {
        return mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWD,
            database: process.env.DB_NAME,
        });
    }
    let connection = connect_db();
    connection.connect();

    let sql = `
        SELECT tag,used,
            LENGTH(sub_ids) - LENGTH(REPLACE(sub_ids, ' ', '')) AS sub_id_count,
            preview_available,is_alive,retained
        FROM rbac
        WHERE tag LIKE '${process.env.SOURCE}-%' AND is_deleted = 0
        ORDER BY tag;
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('数据库查询失败');
        }else {
            res.json(result);
        }
    });

    connection.end();
});

router.delete('/', (req, res) => {
    function connect_db() {
        return mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWD,
            database: process.env.DB_NAME,
        });
    }
    let connection = connect_db();
    connection.connect();

    let delete_accounts = req.body.delete_accounts.split(',');
    let sql = `UPDATE rbac SET is_deleted = 1 WHERE tag IN ('${delete_accounts.join("','")}');`;

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('数据库查询失败');
        }else {
            res.json(result);
        }
    });

    connection.end();
});

router.put('/', (req, res) => {
    function connect_db() {
        return mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWD,
            database: process.env.DB_NAME,
        });
    }
    let connection = connect_db();
    connection.connect();

    let retain_accounts = req.body.retain_accounts.split(',');
    // 如果已经保留，则取消保留
    let sql = `
        UPDATE rbac 
            SET retained = CASE 
                WHEN retained = 0 THEN 1
                ELSE 0
            END
        WHERE tag IN ('${retain_accounts.join("','")}');
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('数据库查询失败');
        }else {
            res.json(result);
        }
    });
});

router.post('/preview', async(req, res) => {
    function connect_db() {
        return mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWD,
            database: process.env.DB_NAME,
        });
    }
    let connection = connect_db();
    connection.connect();

    let preview_tag = req.body.preview_tag;
    let sql = `
        SELECT tag, info
        FROM rbac
        WHERE tag = '${preview_tag}' AND is_deleted = 0;
    `;
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('数据库查询失败');
        }else {
            if (result.length == 0) {
                res.status(200).json({msg: '没有找到该账号', code: 0});
            }else {
                // 读取info
                let info = JSON.parse(result[0].info);
                // 获取凭据
                credential = new ClientSecretCredential(info.tenant, info.appId, info.password);
                // 检查预览功能
                check_preview(credential, info.subscriptionIds).then((result) => {
                    if (result.status == 'success') {
                        res.status(200).json({msg: `检查成功，Azure OpenAI 可用数量：${result.num}/${result.total} (可用/总数)`, code: 1});
                        // 更新数据库
                        let sql = `
                            UPDATE rbac
                            SET preview_available = 1, is_alive = 1
                            WHERE tag = '${preview_tag}';
                        `;
                        connection.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                            connection.end();
                        });

                    }else {
                        res.status(200).json({msg: '检查失败，请检查账号信息', code: 0});
                    }
                });
            }
        }
    });
    credential = '';
});

router.post('/alive', async(req, res) => {
    // 链接数据库
    let connection = connect_db();
    connection.connect();

    let alive_tag = req.body.alive_tag;
    let sql = `
        SELECT tag, info
        FROM rbac
        WHERE tag = '${alive_tag}' AND is_deleted = 0;
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('数据库查询失败');
        }else {
            if (result.length == 0) {
                res.status(200).json({msg: '没有找到该账号', code: 0});
            }else {
                // 读取info
                let info = JSON.parse(result[0].info);
                // 获取凭据
                credential = new ClientSecretCredential(info.tenant, info.appId, info.password);
                // 检查预览功能
                is_account_alive(credential, info.subscriptionIds).then((result) => {
                    if (result){
                        res.status(200).json({msg: '账号可用', code: 1});
                        // 更新数据库
                        let sql = `
                            UPDATE rbac
                            SET is_alive = 1
                            WHERE tag = '${alive_tag}';
                        `;
                        connection.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                            connection.end();
                        });
                    }else{
                        res.status(200).json({msg: '账号不可用', code: 0});
                        // 更新数据库
                        let sql = `
                            UPDATE rbac
                            SET is_alive = 0
                            WHERE tag = '${alive_tag}';
                        `;

                        connection.query(sql, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                            connection.end();
                        });
                    }
                });
            }
        }
    });
});

router.post('/apply', async(req,res) =>{
    // 链接数据库
    let connection = connect_db();
    connection.connect();

    let apply_tag = req.body.apply_tag;
    let mail = req.body?.mail || '1314@zhtec.xyz';
    let sql = `
        SELECT tag, info
        FROM rbac
        WHERE tag = '${apply_tag}' AND is_deleted = 0;
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('数据库查询失败');
        }else {
            if (result.length == 0) {
                res.status(200).json({msg: '没有找到该账号', code: 0});
            }else {
                // 读取info
                let info = JSON.parse(result[0].info);
                // 获取凭据
                credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                // 列出订阅ID
                list_sub_ids(credential).then((result) => {
                    apply_preview(result).then((result) => {
                        if (result) {
                            res.status(200).json({msg: '申请成功, 请检查邮箱', code: 1});
                        }else {
                            res.status(200).json({msg: '申请失败', code: 0});
                        }
                        connection.end();
                    });
                });
            }
        }
    });
});

router.post('/add/auto', async (req, res) => {
    let lock_path = './lock';
    let auto_worker_path;
    if (process.os === 'win32') {
        auto_worker_path = '.\\auto_core\\auto_worker.js';
    }else {
        auto_worker_path = './auto_core/auto_worker.js';
    }
    // 检查锁文件
    if (fs.existsSync(lock_path)) {
        // 检查锁文件是否超时，10分钟超时
        let lock_time = fs.statSync('./lock').mtimeMs;
        let now_time = new Date().getTime();
        if (now_time - lock_time > 600000) {
            // 超时，删除锁文件
            fs.unlinkSync(lock_path);
        }
        res.status(200).json({msg: '任务正在执行中，请稍后再试', code: 1});
        return
    }

    function connect_db() {
        return mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWD,
            database: process.env.DB_NAME,
        });
    }
    let connection = connect_db();
    connection.connect();

    // 查找自动化账号
    let reqjson = req.body;
    const sign = reqjson.sign;

    let sql = `
        SELECT tag, info
        FROM rbac
        WHERE tag like '${sign}-%' 
            AND is_deleted = 0
            AND retained = 0
            AND used = 0
        ORDER BY tag
        Limit 1;
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({msg: '数据库查询失败', code: 0});
        }else {
            if (result.length == 0) {
                res.status(200).json({msg: '没有可用账号', code: 0});
            }else {
                // 创建锁文件
                fs.writeFileSync('./lock', result[0].info);

                // 创建worker
                const worker = new Worker(auto_worker_path, { workerData: {lock_path: lock_path, result: {tag: result[0].tag, info: JSON.parse(result[0].info)}} });
                worker.on('message', (msg) => {
                    if (msg.code == 0) {
                        res.status(200).json({msg: msg.msg, code: 0});
                    }else {
                        res.status(200).json({msg: msg.msg, code: 1});
                    }
                });
            }
        }
    });
});

module.exports = router;