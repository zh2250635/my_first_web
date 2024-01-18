const { SubscriptionClient } = require('@azure/arm-subscriptions');
const { FeatureClient } = require("@azure/arm-features");
const { ClientSecretCredential } = require('@azure/identity');

/**
 * 获取订阅列表中的订阅ID数组。
 * @param {Credential} credential - 凭据对象。
 * @returns {Promise<string[]>} 包含订阅ID的数组。
 * @example
 * // 返回结果示例
 * ["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"]
 */
async function list_sub_ids(credential) {
    const client = new SubscriptionClient(credential);
    // 获取订阅列表
    const subscriptionList = await client.subscriptions.list();

    const subscriptionIds = [];
    for await (const subscription of subscriptionList) {
        subscriptionIds.push(subscription.subscriptionId);
    }

    return subscriptionIds;
}

/**
 * 判断账户是否可用
 * @param {Credential} credential - 凭据对象
 * @returns {Promise<boolean>} - 返回一个Promise，表示账户是否可用
 * - true: 账户可用
 * - false: 账户不可用
 */
async function is_account_alive(credential) {
    const client = new SubscriptionClient(credential);
    // 获取订阅列表
    const subscriptionList = await client.subscriptions.list();

    for await (const subscription of subscriptionList) {
        if (subscription.state !== 'Enabled') {
            return false;
        }
    }
    return true;
}

/**
 * 检查预览功能是否可用
 * @param {object} credential - 凭据对象
 * @param {string[]} subscriptionIds - 订阅ID列表
 * @returns {Promise<object>} - 包含检查结果的对象, 包含以下属性：
 * - status: 检查状态，'success'为成功，'error'为失败
 * - num: 可用的订阅ID数量
 * - avaliable_ids: 可用的订阅ID列表
 * @example
 * // 返回结果示例
 * {
 *    status: 'success',
 *   num: 1,
 *  avaliable_ids: [ 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' ]
 * }
 */
async function check_preview(credential, subscriptionIds = []) {
    let result = {}
    const resourceProviderNamespace = "Microsoft.CognitiveServices";
    const featureName = "openAIPreview";
    const client = new SubscriptionClient(credential);
    // 获取订阅列表
    if (subscriptionIds.length === 0) {
        subscriptionIds = await list_sub_ids(credential);
    }

    num = 0;
    avaliable_ids = [];
    for (const subscriptionId of subscriptionIds) {
        const featureClient = new FeatureClient(credential, subscriptionId);
        try {
            const result = await featureClient.features.get(resourceProviderNamespace, featureName);
            if (result.properties.state !== 'NotRegistered') {
                num += 1;
                avaliable_ids.push(subscriptionId);
            }
        } catch (err) {
            console.error(err);
            result['status'] = 'error';
            result['error'] = err;
            return result;
        }
    }
    result['status'] = 'success'
    result['num'] = num;
    result['total'] = subscriptionIds.length
    result['avaliable_ids'] = avaliable_ids;
    return result;
}

async function get_credential(appId = '01438b42-7198-4043-a663-cd305abfbc24', password = 'wZ_8Q~XPJhw5pWrh5dojfVhNOkTgWESjyrSU7ceb', tenantId = 'dc5fceee-1ddb-40db-a438-f01e5748ba2a') {
    const credential = new ClientSecretCredential(tenantId, appId, password);
    // console.log(appId, password, tenantId, credential);
    return credential;
}

if (require.main === module) {
    const { ClientSecretCredential } = require('@azure/identity');

    const appId = "a36f7a91-8c09-4db6-bdaa-a050a0609b51";
    const tenantId = "20af3c2e-54b0-4b91-b4e9-165e122f36b5";
    const clientSecret = "KCF8Q~MBOeHQlBlHzdNc5sAXWyb5o2SOW3o5Dbth";

    const credential = new ClientSecretCredential(tenantId, appId, clientSecret);

    // 在这里，你可以调用 list_sub_ids 函数，并打印返回的结果
    list_sub_ids(credential)
        .then(subscriptionIds => console.log(subscriptionIds))
        .catch(err => console.error(err));

    // 在这里，你可以调用 is_account_alive 函数，并打印返回的结果
    is_account_alive(credential)
        .then(result => console.log(result))
        .catch(err => console.error(err));

    // 在这里，你可以调用 check_preview 函数，并打印返回的结果
    check_preview(credential)
        .then(result => console.log(result))
        .catch(err => console.error(err));
}

module.exports = {
    list_sub_ids,
    is_account_alive,
    check_preview,
    get_credential
}

