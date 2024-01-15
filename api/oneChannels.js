express = require('express');
router = express.Router();
mysql = require('mysql');
require('dotenv').config();

router.get('/', (req, res) => {
    function connect_db() {
        return mysql.createConnection({
            host: process.env.ONE_DB_HOST,
            user: process.env.ONE_DB_USER,
            password: process.env.ONE_DB_PASSWD,
            database: process.env.ONE_DB_NAME,
        });
    }

    let connection = connect_db();

    let sql = `
            SELECT 
            modified_name,
            count,
            total_used_quota,
            overall_status,
            max_priority,
            total_weight,
            FROM_UNIXTIME(min_created_time, '%Y-%m-%d %H:%i:%s') as created_time
        FROM (
            SELECT 
                modified_name,
                COUNT(*) AS count,
                SUM(used_quota) / 500000 AS total_used_quota,
                CASE 
                    WHEN SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) >= SUM(CASE WHEN status != 1 THEN 1 ELSE 0 END) 
                    THEN '启用' 
                    ELSE '已经禁用' 
                END AS overall_status,
                MAX(priority) AS max_priority,
                SUM(CASE WHEN name LIKE '%128k' THEN weight ELSE 0 END) AS total_weight,
                MIN(created_time) as min_created_time
            FROM (
                SELECT 
                    SUBSTRING_INDEX(name, '-', LENGTH(name) - LENGTH(REPLACE(name, '-', '')) - 1) AS modified_name,
                    name,
                    used_quota,
                    status,
                    priority,
                    weight,
                    created_time
                FROM channels
                WHERE name NOT LIKE '%dall%'
            ) AS subquery
            GROUP BY modified_name
        ) AS result_table
        UNION ALL
        SELECT 
            '总计：非禁用分组数量' AS modified_name,
            NULL AS count,
            NULL AS total_used_quota,
            CAST(COUNT(*) AS CHAR) AS overall_status,
            NULL AS max_priority,
            NULL AS total_weight,
            NULL AS min_created_time
        FROM (
            SELECT 
                modified_name
            FROM (
                SELECT 
                    SUBSTRING_INDEX(name, '-', LENGTH(name) - LENGTH(REPLACE(name, '-', '')) - 1) AS modified_name,
                    status
                FROM channels
                WHERE name NOT LIKE '%dall%'
            ) AS subquery
            GROUP BY modified_name
            HAVING SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) >= SUM(CASE WHEN status != 1 THEN 1 ELSE 0 END)
        ) AS non_disabled_groups_query;
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