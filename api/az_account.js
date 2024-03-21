const exoress = require('express');
const router = exoress.Router();
const fs = require('fs');
const { Worker } = require('worker_threads');
const { check_preview, is_account_alive, list_sub_ids } = require('../auto_core/requirements/account.js');
const { apply_preview } = require('../auto_core/requirements/allpy_preview.js')
const { ClientSecretCredential } = require('@azure/identity');
require('dotenv').config();

module.exports = (dbManager) => {
    router.get('/', (req, res) => {
        const sql = `
            SELECT tag,used,
                LENGTH(sub_ids) - LENGTH(REPLACE(sub_ids, ' ', '')) AS sub_id_count,
                preview_available,is_alive,retained,mail
            FROM rbac
            WHERE tag LIKE '${process.env.SOURCE}-%' AND is_deleted = 0
            ORDER BY id ASC;
        `;

        dbManager.run('az_accounts', sql)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
            });
    });

    router.delete('/', (req, res) => {
        let delete_accounts = req.body.delete_accounts.split(',');
        let sql = `UPDATE rbac SET is_deleted = 1 WHERE tag IN ('${delete_accounts.join("','")}');`;

        dbManager.run('az_accounts', sql)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
            });
    });

    router.put('/', (req, res) => {
        let retain_accounts = req.body.retain_accounts.split(',');
        // 如果已经保留，则取消保留
        let sql = `UPDATE rbac SET retained = CASE WHEN retained = 0 THEN 1 ELSE 0 END WHERE tag IN ('${retain_accounts.join("','")}');`;

        dbManager.run('az_accounts', sql)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
            });
    });

    router.post('/preview', async(req, res) => {
        let preview_tag = req.body.preview_tag;
        let sql = `SELECT tag, info FROM rbac WHERE tag = '${preview_tag}' AND is_deleted = 0;`;

        dbManager.run('az_accounts', sql)
            .then(result => {
                if (result.length == 0) {
                    res.status(200).json({msg: `没有找到账号${preview_tag}`, code: 0});
                }else {
                    // 读取info
                    let info = JSON.parse(result[0].info);
                    // 获取凭据
                    credential = new ClientSecretCredential(info.tenant, info.appId, info.password);
                    // 检查预览功能
                    check_preview(credential, info.subscriptionIds).then((result) => {
                        if (result.status == 'success') {
                            res.status(200).json({msg: `检查成功，账号${preview_tag}Azure OpenAI 可用数量：${result.num}/${result.total} (可用/总数)`, code: 1});
                            // 更新数据库

                            let sql;
                            if (result.num === result.total){
                                sql = `UPDATE rbac SET preview_available = 1 WHERE tag = '${preview_tag}';`;
                            }else{
                                sql = `UPDATE rbac SET preview_available = 0 WHERE tag = '${preview_tag}';`;
                            }
                            dbManager.run('az_accounts', sql)
                                .then(result => {})
                                .catch(err => {
                                    console.log(err);
                                });
                        }else {
                            res.status(200).json({msg: `检查失败，账号${preview_tag}，请检查账号信息`, code: 0});
                        }
                    });
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
            });
        credential = '';
    });

    router.post('/alive', async(req, res) => {
        let alive_tag = req.body.alive_tag;
        let sql = `SELECT tag, info FROM rbac WHERE tag = '${alive_tag}' AND is_deleted = 0;`;

        dbManager.run('az_accounts', sql)
            .then(result => {
                if (result.length == 0) {
                    res.status(200).json({msg: `没有找到账号${alive_tag}`, code: 0});
                }else {
                    // 读取info
                    let info = JSON.parse(result[0].info);
                    // 获取凭据
                    credential = new ClientSecretCredential(info.tenant, info.appId, info.password);
                    // 检查预览功能
                    is_account_alive(credential, info.subscriptionIds).then((result) => {
                        if (result){
                            res.status(200).json({msg: `账号${alive_tag}可用`, code: 1});
                            // 更新数据库
                            let sql = `UPDATE rbac SET is_alive = 1 WHERE tag = '${alive_tag}';`;

                            dbManager.run('az_accounts', sql)
                                .then(result => {})
                                .catch(err => {
                                    console.log(err);
                                });
                        }else{
                            res.status(200).json({msg: `账号${alive_tag}不可用`, code: 0});

                            // 更新数据库
                            let sql = `UPDATE rbac SET is_alive = 0 WHERE tag = '${alive_tag}';`;

                            dbManager.run('az_accounts', sql)
                                .then(result => {})
                                .catch(err => {
                                    console.log(err);
                                });
                        }
                    });
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
            });
    });

    router.post('/apply', async(req,res) =>{
        let apply_tag = req.body.apply_tag;
        let mail = req.body?.mail || '1314520@zhtec.xyz';
        let sql = `SELECT tag, info FROM rbac WHERE tag = '${apply_tag}' AND is_deleted = 0;`;

        dbManager.run('az_accounts', sql)
            .then(result => {
                if (result.length == 0) {
                    res.status(200).json({msg: `没有找到账号${apply_tag}`, code: 0});
                }else {
                    // 读取info
                    let info = JSON.parse(result[0].info);
                    // 获取凭据
                    credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                    // 列出订阅ID
                    list_sub_ids(credential).then((result) => {
                        apply_preview(result,mail).then((result) => {
                            if (result) {
                                res.status(200).json({msg: '申请成功, 请检查邮箱', code: 1});
                            }else {
                                res.status(200).json({msg: '申请失败', code: 0});
                            }
                        });
                    });
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
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
            // 检查锁文件是否超时，1分钟
            let lock_time = fs.statSync('./lock').mtimeMs;
            let now_time = new Date().getTime();
            if (now_time - lock_time > 60000){
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
                AND preview_available = 1
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
                        }
                        else {
                            res.status(200).json({msg: msg.msg, code: 1});
                        }
                    });
                }
            }
        });
    });

    router.post('/deploy', async (req, res) => {
        let tag = req.body?.tag || null
        if (!tag){
            res.status(200).json({msg: '缺少tag', code: 0});
            return
        }

        let fetchUrl = 'http://167.172.5.62:5000/add'

        let data = {
            'source': process.env.SOURCE,
            tag,
            'onetoken': process.env.ONEAPI_TOKEN,
            'oneapi_url_2': process.env.ONEAPI_URL_2 || 'null',
            'oneapi_token_2': process.env.ONEAPI_TOKEN_2 || 'null',
            'script_name': process.env.SCRIPT_NAME || 'all-alpha.zh',
            'input_forward_url_2': process.env.INPUT_FORWARD_URL_2 || 'null',
            'froward_url': process.env.FORWARD_URL || 'null',
        }

        let response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        let result = await response.json()
        res.status(200).json(result)
    });

    return router;
};