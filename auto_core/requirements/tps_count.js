const mysql = require('mysql');
const { connections } = require('../../api/db_manager');
require('dotenv').config();

function connect_one_db() {
    return mysql.createConnection({
        host: process.env.ONE_DB_HOST,
        user: process.env.ONE_DB_USER,
        password: process.env.ONE_DB_PASSWD,
        database: process.env.ONE_DB_NAME,
        port: process.env.ONE_DB_PORT || 3306,
    });
}

async function get_tps() {
    const connection = connect_one_db();

        connection.connect((err) => {
            if (err) {
                console.log('连接失败');
                console.log(err);
                return;
            }
            console.log('连接成功');
        });

        // 找到logs表的前10行
        let sql = `SELECT * FROM logs ORDER BY id DESC LIMIT 10`;

        let results = [];

        function query(sql) {
            return new Promise((resolve, reject) => {
                connection.query(sql, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        results = await query(sql);

        for (let i = 0; i < results.length; i++) {
            let model = results[i].model_name;
            let channel_id = results[i].channel_id;
            let completion_tokens = results[i].completion_tokens;
            let use_time = results[i].use_time;

            // console.log(`model: ${model}, channel_id: ${channel_id}, completion_tokens: ${completion_tokens}, use_time: ${use_time}`);

            if (model === 'gpt-4-32k-1106-preview' && use_time > 0) {
                // sql = `SELECT name FROM channels WHERE id = ${channel_id}`;
                // let channel_name = '';
                // connection.query(sql, (err, result) => {
                //     if (err) {
                //         console.log('查询失败');
                //         console.log(err);
                //         return;
                //     }
                //     console.log('查询成功');
                //     channel_name = result[0].name;
                // });

                let channel_name = await query(`SELECT name FROM channels WHERE id = ${channel_id}`);

                // console.log(`channel_name: ${JSON.stringify(channel_name)}`);

                channel_name = JSON.parse(JSON.stringify(channel_name))[0].name;

                // console.log(`channel_name: ${channel_name}`);
                let channel_arr = channel_name.split('-');
                let region = channel_arr[3];

                let tps = completion_tokens / use_time;

                console.log(`region: ${region}, tps: ${tps}`);
            }

        }

    // 关闭连接
    connection.end((err) => {
        if (err) {
            console.log('关闭失败');
            console.log(err);
            return;
        }
        console.log('关闭成功');
    });
}

(async () => {
    while (true) {
        await get_tps();
        // 休眠2秒
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }
})();