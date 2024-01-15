const exoress = require('express');
const router = exoress.Router();
const mysql = require('mysql');
require('dotenv').config();

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


module.exports = router;