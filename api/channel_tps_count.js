const express = require("express");

const router = express.Router();

module.exports = (dbManager) => {
    router.get("/avg_tps", async (req, res) => {
        let params = req.query;
        let model = params.model || "gpt-4-32k-1106-preview";
        let timeLength = parseInt(params.timeLength, 10) || 10; // 明确地转换为数字，并提供默认值    

        let sql = `SELECT 
                        logs.channel_id, 
                        AVG(logs.prompt_tokens) AS avg_prompt_tokens, 
                        AVG(logs.completion_tokens) AS avg_completion_tokens, 
                        AVG(logs.use_time) AS avg_use_time,
                        AVG(logs.completion_tokens / NULLIF(logs.use_time, 0)) AS avg_tps,
                        channels.name AS channel_name
                    FROM 
                        logs
                    INNER JOIN 
                        channels ON logs.channel_id = channels.id
                    WHERE 
                        logs.model_name = '${model}'
                        AND logs.created_at >= UNIX_TIMESTAMP(NOW()) - ${timeLength * 60}
                        AND logs.use_time > 0  -- 排除耗时为0的记录
                        AND name not like 'az-%'  -- 排除az开头的记录
                    GROUP BY 
                        logs.channel_id;
        `

        dbManager.run('oneapi', sql).then((result) => {
            res.json(result);
        }).catch((error) => {
            res.status(500).json({ error: error.message });
        });
    });

    return router;
}