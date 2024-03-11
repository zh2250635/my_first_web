const express = require("express");
const router = express.Router();
require('dotenv').config();

const config_password = process.env.CONFIG_PASSWORD;
const url = process.env.CONFIG_URL;

router.get("/", (req, res) => {
    let headers_to_send = {
        "passwd": config_password
    };

    let options = {
        method: 'POST',
        headers: headers_to_send,
        body: JSON.stringify({})
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                console.error(`Error fetching config: ${response.statusText}`);
                throw new Error(`Network response was not ok but: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            res.json(data);
        })
        .catch(error => {
            console.error('Error fetching config:', error);
            res.status(500).json({error: true, message: error});
        });
});

router.post("/", (req, res) => {
    const allowed_keys_str = process.env.ALLOWED_KEYS;
    const allowed_keys = allowed_keys_str.split(',');

    for (let key in req.body) {
        if (!allowed_keys.includes(key)) {
            res.status(400).json({ error: true, message: `Key ${key} is not allowed` });
            return;
        }
    }

    // 检查enable_script，enable_auto_deploy是否存在，如果存在，要求值为0或1
    if (req.body.hasOwnProperty('enable_script') || req.body.hasOwnProperty('enable_auto_deploy')) {
        if (!req.body['enable_script'] === '1' || !req.body['enable_script'] === '0') {
            res.status(400).json({ error: true, message: 'enable_script must be 0 or 1' });
            return;
        }
        if (!req.body['enable_auto_deploy'] === '1' || !req.body['enable_auto_deploy'] === '0') {
            res.status(400).json({ error: true, message: 'enable_auto_deploy must be 0 or 1' });
            return;
        }
    }

    for (let key in req.body) {
        if (key === 'aim_number' || key === 'pre_deploy_count'){
            try {
                if (req.body[key] === ''){
                    req.body[key] = 0;
                }
                req.body[key] = parseInt(req.body[key]);
            } catch (e) {
                req.body[key] = 0;
            }
        }
    }

    let headers_to_send = {
        "passwd": config_password
    };

    let options = {
        method: 'POST',
        headers: headers_to_send,
        body: JSON.stringify(req.body)
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                console.error(`Error fetching config: ${response.statusText}`);
                throw new Error(`Network response was not ok but: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            res.json({error: false, message: 'Config updated', data: data});
        })
        .catch(error => {
            console.error('Error fetching config:', error);
            res.status(500).json({error: true, message: error});
        });

});

module.exports = router;