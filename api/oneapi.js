const { route } = require('./login');

express = require('express');
router = express.Router();
mysql = require('mysql');
require('dotenv').config();

router.post('/', (req, res) => {
    function connect_db() {
        return mysql.createConnection({
            host: process.env.ONE_DB_HOST,
            user: process.env.ONE_DB_USER,
            password: process.env.ONE_DB_PASSWD,
            database: process.env.ONE_DB_NAME,
        });
    }
    let connection = connect_db();

    let model = req.body.model;
    const timestamp = Math.floor(Date.now() / 1000);
    let sql = `
        SELECT SUM(quota)/500000 AS dpm, SUM(prompt_tokens + completion_tokens) AS tpm, COUNT(*) AS rpm
        FROM (
            SELECT quota, prompt_tokens, completion_tokens
            FROM logs
            WHERE model_name LIKE '${model}' AND created_at > ${timestamp} - 60
            ORDER BY created_at DESC
            LIMIT 1000
        ) AS recent_logs;
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

module.exports = router;