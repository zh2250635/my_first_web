const express = require('express');
const router = express.Router();

module.exports = (dbManager) => {
    router.post('/', (req, res) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const model = req.body.model;
        const sql = `
            SELECT SUM(quota)/500000 AS dpm, SUM(prompt_tokens + completion_tokens) AS tpm, COUNT(*) AS rpm
            FROM (
                SELECT quota, prompt_tokens, completion_tokens
                FROM logs
                WHERE model_name LIKE '${model}' AND created_at > ${timestamp} - 60
                ORDER BY created_at DESC
                LIMIT 1000
            ) AS recent_logs;
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

    return router;
};