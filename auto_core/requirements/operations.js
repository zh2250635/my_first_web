const { ResourceManagementClient } = require("@azure/arm-resources");
const { CognitiveServicesManagementClient } = require("@azure/arm-cognitiveservices");
const axios = require('axios');

/**
 * 创建资源组
 * @param {object} credential - 凭据对象
 * @param {string} subscriptionId - 订阅ID
 * @param {string} [resourceGroupName='openai'] - 资源组名称，默认为'openai'
 * @param {string} [location='eastus'] - 资源组所在位置，默认为'eastus'
 * @returns {Promise<object>} - 创建的资源组对象
 */
async function create_resource_group(credential, subscriptionId, resourceGroupName = 'openai', location = 'eastus') {
    const client = new ResourceManagementClient(credential, subscriptionId);
    const groupParameters = {
        location: location,
        tags: {
            sampletag: 'openai'
        }
    };
    const result = await client.resourceGroups.createOrUpdate(resourceGroupName, groupParameters);
    return result;
}

/**
 * 删除资源组
 * @param {object} credential - 凭据对象
 * @param {string} subscriptionId - 订阅ID
 * @param {string} [resourceGroupName='openai'] - 资源组名称，默认为'openai'
 * @returns {Promise<object>} - 删除的资源组对象
 */
async function delete_resource_group(credential, subscriptionId, resourceGroupName = 'openai') {
    const client = new ResourceManagementClient(credential, subscriptionId);
    const result = await client.resourceGroups.beginDeleteAndWait(resourceGroupName)
    return result;
}


/**
 * 创建认知服务
 * @param {any} credential - 凭据
 * @param {string} name - 服务名称
 * @param {string} location - 位置
 * @param {string} subscriptionId - 订阅ID
 * @param {string} [resourceGroupName='openai'] - 资源组名称
 * @returns {Promise<any>} - 创建结果
 */
async function create_cognitive_service(credential, name, location, subscriptionId, resourceGroupName = 'openai') {
    const client = new CognitiveServicesManagementClient(credential, subscriptionId);
    
    // 设置账户参数
    const parameters = {
        kind: "OpenAI", // 账户种类
        sku: {
        name: "S0" // 定价层级
        },
        location: location
    };

    // console.log(Object.getOwnPropertyNames(client.accounts.__proto__));

    const result = await client.accounts.beginCreateAndWait(resourceGroupName,name,parameters)

    return result
}

/**
 * 删除认知服务
 * @param {any} credential - 凭据
 * @param {string} name - 服务名称
 * @param {string} subscriptionId - 订阅ID
 * @param {string} [resourceGroupName='openai'] - 资源组名称
 * @returns {Promise<any>} - 删除结果
 */
async function delete_cognitive_service(credential, name, subscriptionId, location, resourceGroupName = 'openai') {
    const client = new CognitiveServicesManagementClient(credential, subscriptionId);
    const deleted = await client.accounts.beginDeleteAndWait(resourceGroupName, name);
    const pure = await client.deletedAccounts.beginPurge(location, resourceGroupName, name);
    return pure;
}

/**
 * 获取认知服务密钥
 * @param {any} credential - 凭据
 * @param {string} name - 服务名称
 * @param {string} subscriptionId - 订阅ID
 * @param {string} [resourceGroupName='openai'] - 资源组名称
 * @returns {Promise<any>} - 获取结果
 */
async function get_cognitive_service_keys(credential, name, subscriptionId, resourceGroupName = 'openai') {
    const client = new CognitiveServicesManagementClient(credential, subscriptionId);
    const result = await client.accounts.listKeys(resourceGroupName, name);
    return result;
}

/**
 * 创建内容过滤器
 * @param {string} token - 访问令牌
 * @param {string} subscriptionId - 订阅ID
 * @param {string} accountName - 账户名称
 * @param {string} [resourceGroupName='openai'] - 资源组名称
 * @returns {Promise<Object>} - 包含状态、数据和策略名称的对象
 * @returns {string} status - 状态，'success'为成功，'error'为失败
 * @returns {object} data - 返回的数据
 * @returns {string} policy_name - 策略名称
 * @example
 * // 返回结果示例
 * {
 *  status: 'success',
 * data: {
 *  id: '/subscriptions/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/resourceGroups/openai/providers/Microsoft.CognitiveServices/accounts/openai/raiPolicies/CustomContentFilter0',
 * name: 'CustomContentFilter0',
 * type: 'Microsoft.CognitiveServices/accounts/raiPolicies',
 * properties: {
 *  basePolicyName: 'Microsoft.Default',
 * type: 'UserManaged',
 * contentFilters: [Array],
 * mode: 'default'
 * }
 * },
 * policy_name: 'CustomContentFilter0'
 * }
 */
async function create_content_filter(token, subscriptionId, accountName, resourceGroupName = 'openai') {
    // 生成一个0-500之间的随机数
    const random_num = Math.floor(Math.random() * 500);
    const policy_name = `CustomContentFilter${random_num}`;

    // 请求地址
    const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/raiPolicies/${policy_name}?api-version=2023-10-01-preview`;

    // 请求头
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 请求体
    const payload = {
        "name": policy_name,
        "displayName": "",
        "properties": {
            "basePolicyName": "Microsoft.Default",
            "type": "UserManaged",
            "contentFilters": [
                {
                    "name": "hate",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "prompt"
                },
                {
                    "name": "sexual",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "prompt"
                },
                {
                    "name": "selfharm",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "prompt"
                },
                {
                    "name": "violence",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "prompt"
                },
                {
                    "name": "hate",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "completion"
                },
                {
                    "name": "sexual",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "completion"
                },
                {
                    "name": "selfharm",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "completion"
                },
                {
                    "name": "violence",
                    "blocking": false,
                    "enabled": false,
                    "allowedContentLevel": "medium",
                    "source": "completion"
                }
            ],
            "mode": "default"
        }
    };

    // 发送请求
    try{
        const res = await axios.put(url, payload, { headers });
        return {status: 'success', data: res.data, policy_name};
    }catch(err) {
        if (err.response) {
            // console.log(err.response.data);
            // console.log(err.response.status);
            // console.log(err.response.headers);
            return {
                status: 'error',
                errorType: 'Response Error',
                message: err.message,
                responseData: err.response.data,
                responseStatus: err.response.status,
                responseHeaders: err.response.headers
            };
        } else if (err.request) {
            // console.log(err.request);
            return {
                status: 'error',
                errorType: 'Request Error',
                message: err.message
            };
        } else {
            // console.log('Error', err.message);
            return {
                status: 'error',
                errorType: 'Unknown Error',
                message: err.message
            };
        }
    }
}

/**
 * 创建部署
 * @param {string} token - 访问令牌
 * @param {string} modelName - 模型名称
 * @param {number} capcity - 部署容量
 * @param {string} subscriptionId - 订阅ID
 * @param {string} accountName - 账户名称
 * @param {string} modelVersion - 模型版本
 * @param {string} deployName - 部署名称
 * @param {string} policyName - 内容过滤器名称
 * @param {string} [resourceGroupName='openai'] - 资源组名称（可选，默认为'openai'）
 * @returns {Promise<Object>} - 返回一个Promise对象，包含部署状态和数据
 */
async function create_deployment(token, modelName, capcity, subscriptionId, accountName, modelVersion, deployName, policyName, resourceGroupName = 'openai') {
    const url = `https://management.azure.com//subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/deployments/${deployName}?api-version=2023-10-01-preview`;

    // 请求头
    headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 请求体
    const payload = {
        "displayName": deployName,
        "properties": {
            "model": {
                "format": "OpenAI",
                "name": modelName,
                "version": modelVersion
            },
            "dynamicThrottlingEnabled": true,
            "raiPolicyName": policyName,
        },
        "sku": {
            "name": "Standard",
            "capacity": capcity
        }
    }

    // 发送请求
    try{
        const res = await axios.put(url, payload, { headers });
        return {status: 'success', data: res.data};
    }catch(err) {
        if (err.response) {
            // console.log(err.response.data);
            // console.log(err.response.status);
            // console.log(err.response.headers);
            return {
                status: 'error',
                errorType: 'Response Error',
                message: err.message,
                responseData: err.response.data,
                responseStatus: err.response.status,
                responseHeaders: err.response.headers
            };
        } else if (err.request) {
            // console.log(err.request);
            return {
                status: 'error',
                errorType: 'Request Error',
                message: err.message
            };
        } else {
            // console.log('Error', err.message);
            return {
                status: 'error',
                errorType: 'Unknown Error',
                message: err.message
            };
        }
    }
}

if (module === require.main) {
    const { get_credential, list_sub_ids } = require('./account');

    // 测试代码
    async function test() {
        // 获取凭据
        let credential = await get_credential();

        console.log(`凭据：${JSON.stringify(credential, null, 2)}`);

        const subscriptionId = (await list_sub_ids(credential))[0];
        console.log(`订阅ID：${subscriptionId}`);

        // 创建资源组
        console.log('创建资源组');
        // await create_resource_group(credential, subscriptionId);
        console.log('创建资源组成功');

        // 创建认知服务
        await create_cognitive_service(credential, 'openai', 'eastus', subscriptionId);

        console.log('创建认知服务成功')

        // 获取认知服务密钥
        const keys = await get_cognitive_service_keys(credential, 'openai', subscriptionId);

        console.log(`密钥：${JSON.stringify(keys, null, 2)}`);

        // 创建内容过滤器
        const token = (await credential.getToken("https://management.azure.com/.default")).token;
        const result = await create_content_filter(token, subscriptionId, 'openai');

        console.log(`内容过滤器：${JSON.stringify(result, null, 2)}`);

        let policy_name = result.policy_name;

        // 创建部署
        console.log(await create_deployment(token, 'gpt-35-turbo', 1, subscriptionId, 'openai', '0613', 'gpt-35-turbo-0613', policy_name));
        // 删除认知服务
        console.log(await delete_cognitive_service(credential, 'openai', subscriptionId, 'eastus'));

        // 删除资源组
        // await delete_resource_group(credential, subscriptionId);

        console.log('测试完成');
    }

    test();
}

module.exports = {
    create_resource_group,
    delete_resource_group,
    create_cognitive_service,
    delete_cognitive_service,
    get_cognitive_service_keys,
    create_content_filter,
    create_deployment
}