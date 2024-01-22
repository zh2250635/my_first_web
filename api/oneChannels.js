const express = require('express');
const router = express.Router();
require('dotenv').config();

module.exports = (dbManager) => {
    router.get('/', (req, res) => {
        const sql = `
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

        dbManager.run('oneapi', sql)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('数据库查询失败');
            });
    });

    router.delete('/', (req, res) => {
        let names = req.body.names;
        if (!names || names.length === 0) {
            res.status(400).send('没有选择要删除的通道');
            return;
        }

        let nameArray;
        if (Array.isArray(names)) {
            nameArray = names.map(name => `${name}%`);
        } else {
            nameArray = names.split(',').map(name => `${name}%`);
        }

        console.log(nameArray);

        for (let i = 0; i < nameArray.length; i++) {
            // 删除channels表中的记录
            let sql = `DELETE FROM channels WHERE name LIKE '${nameArray[i]}'`
            dbManager.run('oneapi', sql)
                .catch(err => {
                    console.log(err);
                    res.status(500).send('数据库删除失败');
                });
        }
        res.status(200).json({msg: '删除成功'})
    });

    router.delete('/useless', (req, res) => {
        let sql = `
            DELETE FROM channels
            WHERE (name LIKE '${process.env.SOURCE}%' OR name LIKE 'az-%')
                AND status <> 1
        `;

        dbManager.run('oneapi', sql)
        .then(result => {
            // 读取删除的记录数
            let affectedRows = result.affectedRows;
            // 返回删除的记录数
            res.status(200).json({msg: `成功删除${affectedRows}条记录`, code: 1});
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('数据库删除失败');
        });
    });

    return router;
}