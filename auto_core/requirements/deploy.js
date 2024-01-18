const { create_resource_group, delete_resource_group, create_cognitive_service, delete_cognitive_service, get_cognitive_service_keys, create_content_filter, create_deployment} = require('./operations');
const { list_sub_ids, is_account_alive, check_preview } = require('./account');
const logger = require('./logger');
const fs = require('fs');
let path = require('path');
const { ClientSecretCredential } = require('@azure/identity');
const axios = require('axios');
require('dotenv').config();

const config = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json'), 'utf8'));

const model_mapping = "{ \"gpt-3.5-turbo\": \"gpt-3.5-turbo\", \"gpt-3.5-turbo-0613\": \"gpt-3.5-turbo\", \"gpt-3.5-turbo-0301\": \"gpt-3.5-turbo\", \"gpt-3.5-turbo-16k\": \"gpt-3.5-turbo-16k\", \"gpt-3.5-turbo-16k-0613\": \"gpt-3.5-turbo-16k\", \"gpt-3.5-turbo-1106\": \"gpt-3.5-turbo-1106\", \"gpt-4\": \"gpt-4\", \"gpt-4-0613\": \"gpt-4\", \"gpt-4-0314\": \"gpt-4\", \"gpt-4-32k\": \"gpt-4-32k\", \"gpt-4-32k-0613\": \"gpt-4-32k\", \"gpt-4-32k-0314\": \"gpt-4-32k\", \"text-embedding-ada-002\": \"text-embedding-ada-002\", \"gpt-4-1106-preview\": \"gpt-4-32k-1106-preview\", \"gpt-4-32k-1106-preview\": \"gpt-4-32k-1106-preview\", \"gpt-4-vision-preview\": \"gpt-4-1106-vision-preview\", \"gpt-4-1106-vision-preview\": \"gpt-4-1106-vision-preview\" }"

/**
 * 主函数，用于处理账户创建和模型部署的流程。
 * @param {string} info - 包含租户、应用程序ID和密码的信息对象。
 * @param {string} tag - 标签字符串。
 * @returns {Promise<void>} - 一个Promise，表示函数执行的异步操作。
 */
async function main(info,tag){
    const mylogger = new logger(`${tag}.log`);
    info = JSON.parse(info)
    mylogger.info(`type ${typeof info}`)
    const credential = new ClientSecretCredential(info.tenant, info.appId, info.password);
    
    mylogger.info(`正在检查账号的状态`);
    if(!await is_account_alive(credential)){
        mylogger.error(`账号状态异常，进程将终止`);
        return;
    }
    mylogger.info(`账号状态正常`);

    const preview_info = await check_preview(credential);
    if(!preview_info?.status === 'success'){
        mylogger.error(`账号预览功能状态异常，进程将终止`);
        return;
    }
    mylogger.info(`账号预览功能状态正常, 可用预览的账号数目为 ${preview_info.num}`);

    const subIds = preview_info.avaliable_ids;

    mylogger.info(`可用订阅的列表: ${JSON.stringify(subIds)}`);

    let promises = [];
    for (let i = 0; i < subIds.length; i++) {
        const subscriptionId = subIds[i];
        mylogger.info(`开始处理 ${subscriptionId}`);
        // 添加到 Promise 数组中
        promises.push(create_accounts_for_subid(credential,subscriptionId,tag,i,mylogger).then(async (res) => {mylogger.info(`处理 ${subscriptionId} 成功`);}).catch(async (error) => {mylogger.error(`处理 ${subscriptionId} 失败: ${error.message}`);}));
    }
    await Promise.all(promises);
    mylogger.info(`资源( accounts )创建完毕`);


    promises = [];
    for (let i = 0; i < subIds.length; i++) {
        const subscriptionId = subIds[i];
        mylogger.info(`开始处理 ${subscriptionId}`);
        // 添加到 Promise 数组中
        promises.push(create_deployments_for_subid(credential,subscriptionId,tag,i,mylogger)
        .then(res => {
            mylogger.info(`${subscriptionId} 模型部署成功完成, 返回消息${res}`);
        })
        .catch(error => {
            mylogger.error(`${subscriptionId} 模型部署失败: ${error.message}`);
        }));
    }
    
    Promise.all(promises)
    .then(() => {
        mylogger.info("所有的模型部署都已完成");
    })
    .catch((error) => {
        mylogger.error("一些模型部署失败: ", error);
    });    

    // 原地等待 10 秒
    mylogger.info(`等待 10 秒`);
    await new Promise(resolve => setTimeout(resolve, 10000));

    mylogger.info(`创建完毕`);
}

async function create_accounts_for_subid(credential,subscriptionId,tag,index,logger){
    //创建资源组
    logger.info(`开始创建 ${subscriptionId} 的资源组`);
    try {
        await create_resource_group(credential, subscriptionId);
        logger.info(`创建资源组成功`);
    } catch (error) {
        logger.error(`创建资源组失败: ${error.message}, 进程将继续执行`);
        // 如果你希望在创建资源组失败时继续创建 cognitive services，可以删除这个 return
        return;
    }

    let promises = [];
    for (let i = 0; i < config.length; i++) {
        const accountInfo = config[i];
        const region = accountInfo.name;
        const displayName = `${tag}-s${index}-${accountInfo.display}`;
        logger.info(`开始创建 ${displayName} 的资源`);

        // 添加到 Promise 数组中
        promises.push(create_cognitive_service(credential, `${tag}-s${index}-${region}`, region, subscriptionId)
            .then(res => {
                logger.info(`创建 ${displayName} 的资源成功`);
            })
            .catch(error => {
                logger.error(`创建 ${displayName} 的资源失败: ${error.message}, 进程将继续执行`);
            }));
    }

    // 等待所有 Promise 完成
    await Promise.all(promises);
}

async function create_deployments_for_subid(credential,subscriptionId,tag,index,logger){
    const promises = config.map(async (accountInfo) => {
        const region = accountInfo.name;
        const displayName = `${tag}-s${index}-${accountInfo.display}`;
        const models = accountInfo.models;

        logger.info(`正在获取 ${displayName} 的密钥`);
        const token_info = await credential.getToken("https://management.azure.com/.default");
        const token = token_info.token;

        logger.info(`开始创建 ${displayName} 的内容过滤器`);
        return create_content_filter(token,subscriptionId,`${tag}-s${index}-${region}`)
        .then(async res => {
            logger.info(`创建 ${displayName} 的内容过滤器成功`);
            const policy_name = res.policy_name;

            logger.info(`开始获取 ${displayName} 的密钥`);
            const keys = await get_cognitive_service_keys(credential, `${tag}-s${index}-${region}`, subscriptionId);

            logger.info(`开始创建 ${displayName} 的部署`);
            for (const model of models) {
                try {
                    const res = await create_deployment(token,model["name"],model['capacity'],subscriptionId,`${tag}-s${index}-${region}`,model['version'],model['deployName'],policy_name);

                    
                    if(res.status != 'success'){
                        throw new Error(message = res.data);
                    }
                    
                    logger.info(`创建 ${displayName} 的部署成功`);
                    logger.info(`开始推送 ${displayName} 的部署`);
                    try {
                        const res = await push_to_oneapi(region,keys,`${tag}-s${index}-${region}-${model['oneApiTag']}`,model['oneApiModels'],model['oneApiGroup'],model['capacity'],logger);
                        logger.info(`推送 ${tag}-s${index}-${region}-${model['oneApiTag']} 成功, status code: ${res.status}, data: ${JSON.stringify(res.data)}`);
                    } catch (error) {
                        if (error.response) {
                            // The request was made and the server responded with a status code
                            // that falls out of the range of 2xx
                            logger.error(`推送失败: ${error.message}, 
                                        response status: ${error.response.status}, 
                                        response headers: ${JSON.stringify(error.response.headers)}, 
                                        response data: ${JSON.stringify(error.response.data)}`);
                        } else if (error.request) {
                            // The request was made but no response was received
                            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                            // http.ClientRequest in node.js
                            logger.error(`推送失败: ${error.message}, 
                                        no response received, 
                                        request: ${JSON.stringify(error.request)}`);
                        } else {
                            // Something happened in setting up the request that triggered an Error
                            logger.error(`推送失败: ${error.message}`);
                        }
                    }
                } catch (error) {
                    logger.error(`创建 ${displayName} 的部署失败: ${error.message}`);
                }
            }
        })
        .catch(error => {
            logger.error(`创建 ${displayName} 的内容过滤器失败: ${error.message}`);
        });
    });

    return Promise.all(promises);
}

/**
 * 将数据推送到 OneAPI。
 * @param {string} region - OneAPI 的区域。
 * @param {object} keys - 包含 key1 的键值对对象。
 * @param {string} name - 推送的名称。
 * @param {array} models - 模型列表。
 * @param {string} group - 推送的分组。
 * @param {number} capacity - 推送的容量。
 * @param {object} logger - 日志记录器对象。
 * @returns {Promise<void>} - 表示推送操作的 Promise。
 */
async function push_to_oneapi(region,keys,name,models,group,capacity,logger){
    const oneapi_base = process.env['ONEAPI_BASE'];
    const oneapi_token = process.env['ONEAPI_TOKEN'];

    let channel_url = oneapi_base.endsWith('/') ? oneapi_base+'api/channel/' : oneapi_base+'/api/channel/'

    let headers = {
        'Content-Type':'application/json',
        'Authorization':oneapi_token
    }

    let payload = {
        name,
        type: 3,
        key: keys.key1,
        openai_organization: "",
        base_url: `https://${region}.api.cognitive.microsoft.com/`,
        order: 0,
        sort: 0,
        weight: parseInt(capacity),
        retryInterval: 10,
        testRequestBody: "",
        overFrequencyAutoDisable: true,
        other: "2023-12-01-preview",
        model_mapping: model_mapping,
        excluded_fields: "",
        models: models,
        groups: `["${group}"]`,
        group: group
    }

    let config = {
        url: channel_url,
        method: 'post',
        headers,
        data: payload
    }

    return axios.request(config);
}

if (require.main === module) {
    const info = {
        "appId": "01438b42-7198-4043-a663-cd305abfbc24",
        "displayName": "test-1",
        "password": "wZ_8Q~XPJhw5pWrh5dojfVhNOkTgWESjyrSU7ceb",
        "tenant": "dc5fceee-1ddb-40db-a438-f01e5748ba2a"
    }

    main(info,"test-5");
}

module.exports = {
    main
}