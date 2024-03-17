const express = require('express');
const router = express.Router();
const { list_cognitive_services, delete_cognitive_service, delete_deployment, create_cognitive_service, create_deployment } = require("../auto_core/requirements/operations");
const { ClientSecretCredential } = require('@azure/identity');

module.exports = (dbManager) => {
    router.get('/cognitive_services', async (req, res) => {
        // 获取请求传入的查询
        let query = req.query;
        // 获取请求的账号tag
        let tag = query?.tag;
        if (!tag) {
            res.status(400).send("Bad Request: tag is required");
            return;
        }

        // 获取账号信息
        sql = `SELECT * FROM rbac WHERE tag = '${tag}'`;
        dbManager.run('az_accounts', sql)
            .then(async (results) => {
                if (results.length === 0) {
                    res.status(404).send("Not Found: account not found");
                    return;
                }

                let account = results[0];
                // 获取账号的cognitive services
                let subscription_ids = account.sub_ids.trim().split(' ');

                let info = JSON.parse(account.info);
                let credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                let cognitive_services = await list_cognitive_services(credential, subscription_ids);

                res.status(200).send(cognitive_services);
                res.end();
                return;
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    router.get('/deployments', async (req, res) => {
        // 获取请求传入的查询
        let query = req.query;
        // 获取请求的账号tag
        let tag = query?.tag;
        let sub_id = query?.sub_id;
        let account_name = query?.account_name;
        let resource_group = query?.resource_group || "openai";

        if (!tag || !sub_id || !account_name) {
            res.status(400).send("Bad Request: tag, sub_id, account_name are required");
            return;
        }

        // 获取账号信息
        sql = `SELECT * FROM rbac WHERE tag = '${tag}'`;
        dbManager.run('az_accounts', sql)
            .then(async (results) => {
                if (results.length === 0) {
                    res.status(404).send("Not Found: account not found");
                    return;
                }

                let account = results[0];

                // 获取账号的登录信息
                let info = JSON.parse(account.info);
                let credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                // 获取token
                const token = (await credential.getToken("https://management.azure.com/.default")).token;

                // 获取deployments
                let fetchUrl = `https://management.azure.com/subscriptions/${sub_id}/resourceGroups/${resource_group}/providers/Microsoft.CognitiveServices/accounts/${account_name}/deployments?api-version=2023-10-01-preview`;

                fetch(fetchUrl, {
                    method: 'GET',
                    headers: {
                        'authorization': `Bearer ${token}`
                    }
                }).then(async (response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        console.log(await response.text());
                        throw new Error(`Failed to fetch deployments: ${response.status}`);
                    }
                }).then(data => {
                    res.status(200).send(data);
                    res.end();
                }).catch(error => {
                    console.error(error);
                    res.status(500).json({ error: error, fetchUrl: fetchUrl });
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    router.delete('/cognitive_services_account', async (req, res) => {
        // 获取请求传入的查询
        let query = req.query;
        // 获取请求的账号tag
        let tag = query?.tag;
        let name = query?.name;
        let sub_id = query?.sub_id;
        let location = query?.location;
        let resource_group = query?.resource_group || "openai";
        if (!tag || !name || !sub_id || !location) {
            res.status(400).send("Bad Request: 你必须提供账号的tag和cognitive service的name, 以及subscription id和location");
            return;
        }

        // 获取账号信息
        sql = `SELECT * FROM rbac WHERE tag = '${tag}'`;
        dbManager.run('az_accounts', sql)
            .then(async (results) => {
                if (results.length === 0) {
                    res.status(404).send("Not Found: account not found");
                    return;
                }

                let account = results[0];

                // 获取账号的登录信息
                let info = JSON.parse(account.info);
                let credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                // 删除cognitive service
                let result = await delete_cognitive_service(credential, name, sub_id, location, resource_group);
                res.status(200).send(result);
                res.end();
                return;
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    router.delete('/deployments', async (req, res) => {
        // 获取请求传入的查询
        let query = req.query;
        // 获取请求的账号tag
        let tag = query?.tag;
        let sub_id = query?.sub_id;
        let account_name = query?.account_name;
        let deployment_name = query?.deployment_name;
        let resource_group = query?.resource_group || "openai";

        // 获取账号信息
        sql = `SELECT * FROM rbac WHERE tag = '${tag}'`;

        dbManager.run('az_accounts', sql)
            .then(async (results) => {
                if (results.length === 0) {
                    res.status(404).send("Not Found: account not found");
                    return;
                }

                let account = results[0];

                // 获取账号的登录信息
                let info = JSON.parse(account.info);
                let credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                // 获取token
                const token = (await credential.getToken("https://management.azure.com/.default")).token;

                // 删除deployment
                let result = await delete_deployment(token, sub_id, account_name, deployment_name, resource_group);

                res.status(200).send(result);
                res.end();
                return;
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    router.put('/cognitive_services_account', async (req, res) => {
        let body = req.body;

        if (!body.tag || !body.name || !body.location || !body.sub_id) {
            res.status(400).send("Bad Request: 你必须提供账号的tag和cognitive service的name, 以及subscription id和location");
            return;
        }

        // 获取账号信息
        sql = `SELECT * FROM rbac WHERE tag = '${body.tag}'`;
        dbManager.run('az_accounts', sql)
            .then(async (results) => {
                if (results.length === 0) {
                    res.status(404).send("Not Found: account not found");
                    return;
                }

                let account = results[0];

                // 获取账号的登录信息
                let info = JSON.parse(account.info);
                let credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                // 创建cognitive service
                let result = await create_cognitive_service(credential, body.name, body.location, body.sub_id, body?.resource_group_name || "openai");

                res.status(200).send(result);
                res.end();
                return;
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    router.put('/deployments', async (req, res) => {
        let body = req.body;

        if (!body.tag || !body.model_name || !body.capcity || !body.sub_id || !body.account_name || !body.model_version || !body.deploy_name || !body.policy_name) {
            res.status(400).send("Bad Request: 你必须提供 tag, model_name, capacity, sub_id, account_name, model_version, deploy_name, policy_name");
            return;
        }

        let resource_group = body.resource_group || "openai";

        // 获取账号信息
        sql = `SELECT * FROM rbac WHERE tag = '${body.tag}'`;

        dbManager.run('az_accounts', sql)
            .then(async (results) => {
                if (results.length === 0) {
                    res.status(404).send("Not Found: account not found");
                    return;
                }

                let account = results[0];

                // 获取账号的登录信息
                let info = JSON.parse(account.info);
                let credential = new ClientSecretCredential(info.tenant, info.appId, info.password);

                // 获取token
                const token = (await credential.getToken("https://management.azure.com/.default")).token;

                // 创建deployment
                let result = await create_deployment(token, body.model_name, body.capcity, body.sub_id, body.account_name, body.model_version, body.deploy_name, body.policy_name, resource_group);

                res.status(200).send(result);
                res.end();
                return;
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(error);
            });
    });

    return router;
}