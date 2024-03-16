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
 * @param {string} location - 位置
 * @param {string} [resourceGroupName='openai'] - 资源组名称，默认为'openai'
 * @returns {Promise<any>} - 删除结果
 */
async function delete_cognitive_service(credential, name, subscriptionId, location, resourceGroupName = 'openai') {
    const client = new CognitiveServicesManagementClient(credential, subscriptionId);
    const deleted = await client.accounts.beginDeleteAndWait(resourceGroupName, name);
    const pure = await client.deletedAccounts.beginPurge(location, resourceGroupName, name);
    return pure;
}

/**
 * Lists the cognitive services accounts in the specified resource group.
 *
 * @param {any} credential - The credentials object for authentication.
 * @param {string} subscriptionId - The subscription ID.
 * @param {string} [resourceGroupName='openai'] - The resource group name. Default value is 'openai'.
 * @returns {Promise<any>} - A promise that resolves to the list of cognitive services accounts.
 */
async function list_cognitive_services(credential, subscriptionIds, resourceGroupName = 'openai') {
    const token = (await credential.getToken("https://management.azure.com/.default")).token;

    let headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    let payload = {
        "requests": [
            {
                "content": {
                    "query": "resources|where type in~ ('microsoft.cognitiveservices/accounts','microsoft.botservice/botservices','microsoft.search/searchservices','microsoft.media/videoanalyzers')\r\n|extend status = tostring(properties.provisioningState), customDomainName = tostring(properties.customSubDomainName), createdDate = todatetime(properties.dateCreated), internalId = tostring(properties.internalId), sku = tostring(sku.name)\r\n|project name,customDomainName, kind, sku,status, location,resourceGroup,createdDate,subscriptionId,internalId, id,type,tags\r\n|extend locationDisplayName=case(location =~ 'eastus','East US',location =~ 'eastus2','East US 2',location =~ 'southcentralus','South Central US',location =~ 'westus2','West US 2',location =~ 'westus3','West US 3',location =~ 'australiaeast','Australia East',location =~ 'southeastasia','Southeast Asia',location =~ 'northeurope','North Europe',location =~ 'swedencentral','Sweden Central',location =~ 'uksouth','UK South',location =~ 'westeurope','West Europe',location =~ 'centralus','Central US',location =~ 'southafricanorth','South Africa North',location =~ 'centralindia','Central India',location =~ 'eastasia','East Asia',location =~ 'japaneast','Japan East',location =~ 'koreacentral','Korea Central',location =~ 'canadacentral','Canada Central',location =~ 'francecentral','France Central',location =~ 'germanywestcentral','Germany West Central',location =~ 'italynorth','Italy North',location =~ 'norwayeast','Norway East',location =~ 'polandcentral','Poland Central',location =~ 'switzerlandnorth','Switzerland North',location =~ 'uaenorth','UAE North',location =~ 'brazilsouth','Brazil South',location =~ 'israelcentral','Israel Central',location =~ 'qatarcentral','Qatar Central',location =~ 'eastus2stage','美国东部 2 (阶段)',location =~ 'eastusstage','美国东部(阶段)',location =~ 'westus2stage','美国西部 2 (阶段)',location =~ 'westusstage','美国西部(阶段)',location =~ 'northcentralusstage','美国中北部(阶段)',location =~ 'centralusstage','美国中部(阶段)',location =~ 'southcentralusstage','美国中南部(阶段)',location =~ 'israel','Israel',location =~ 'italy','Italy',location =~ 'newzealand','New Zealand',location =~ 'poland','Poland',location =~ 'qatar','Qatar',location =~ 'sweden','Sweden',location =~ 'uae','阿拉伯联合酋长国',location =~ 'australia','澳大利亚',location =~ 'brazil','巴西',location =~ 'germany','德国',location =~ 'france','法国',location =~ 'korea','韩国',location =~ 'canada','加拿大',location =~ 'unitedstates','美国',location =~ 'unitedstateseuap','美国 EUAP',location =~ 'southafrica','南非',location =~ 'norway','挪威',location =~ 'europe','欧洲',location =~ 'global','全球',location =~ 'japan','日本',location =~ 'switzerland','瑞士',location =~ 'singapore','新加坡',location =~ 'asiapacific','亚太',location =~ 'asia','亚洲',location =~ 'india','印度',location =~ 'uk','英国',location =~ 'southeastasiastage','东南亚(阶段)',location =~ 'eastasiastage','东亚(阶段)',location =~ 'brazilus','Brazil US',location =~ 'northcentralus','North Central US',location =~ 'westus','West US',location =~ 'japanwest','Japan West',location =~ 'jioindiawest','Jio India West',location =~ 'westcentralus','West Central US',location =~ 'southafricawest','South Africa West',location =~ 'australiacentral','Australia Central',location =~ 'australiacentral2','Australia Central 2',location =~ 'australiasoutheast','Australia Southeast',location =~ 'jioindiacentral','Jio India Central',location =~ 'koreasouth','Korea South',location =~ 'southindia','South India',location =~ 'westindia','West India',location =~ 'canadaeast','Canada East',location =~ 'francesouth','France South',location =~ 'germanynorth','Germany North',location =~ 'norwaywest','Norway West',location =~ 'switzerlandwest','Switzerland West',location =~ 'ukwest','UK West',location =~ 'uaecentral','UAE Central',location =~ 'brazilsoutheast','Brazil Southeast',location)|where (type !~ ('dell.storage/filesystems'))|where (type !~ ('informatica.datamanagement/organizations'))|where (type !~ ('paloaltonetworks.cloudngfw/globalrulestacks'))|where (type !~ ('purestorage.block/storagepools/avsstoragecontainers'))|where (type !~ ('purestorage.block/reservations'))|where (type !~ ('purestorage.block/storagepools'))|where (type !~ ('solarwinds.observability/organizations'))|where (type !~ ('splitio.experimentation/experimentationworkspaces'))|where (type !~ ('microsoft.azureactivedirectory/ciamdirectories'))|where (type !~ ('microsoft.agfoodplatform/farmbeats'))|where (type !~ ('microsoft.network/networkmanagers/verifierworkspaces'))|where (type !~ ('microsoft.anybuild/clusters'))|where (type !~ ('microsoft.mobilepacketcore/networkfunctions'))|where (type !~ ('microsoft.cdn/profiles/customdomains'))|where (type !~ ('microsoft.cdn/profiles/afdendpoints'))|where (type !~ ('microsoft.cdn/profiles/origingroups/origins'))|where (type !~ ('microsoft.cdn/profiles/origingroups'))|where (type !~ ('microsoft.cdn/profiles/afdendpoints/routes'))|where (type !~ ('microsoft.cdn/profiles/rulesets/rules'))|where (type !~ ('microsoft.cdn/profiles/rulesets'))|where (type !~ ('microsoft.cdn/profiles/secrets'))|where (type !~ ('microsoft.cdn/profiles/securitypolicies'))|where (type !~ ('microsoft.sovereign/landingzoneconfigurations'))|where (type !~ ('microsoft.cloudtest/accounts'))|where (type !~ ('microsoft.cloudtest/hostedpools'))|where (type !~ ('microsoft.cloudtest/images'))|where (type !~ ('microsoft.cloudtest/pools'))|where (type !~ ('microsoft.codesigning/codesigningaccounts'))|where (type !~ ('microsoft.compute/standbypoolinstance'))|where (type !~ ('microsoft.compute/virtualmachineflexinstances'))|where (type !~ ('microsoft.kubernetesconfiguration/extensions'))|where (type !~ ('microsoft.containerservice/managedclusters/microsoft.kubernetesconfiguration/extensions'))|where (type !~ ('microsoft.kubernetes/connectedclusters/microsoft.kubernetesconfiguration/namespaces'))|where (type !~ ('microsoft.containerservice/managedclusters/microsoft.kubernetesconfiguration/namespaces'))|where (type !~ ('microsoft.kubernetes/connectedclusters/microsoft.kubernetesconfiguration/fluxconfigurations'))|where (type !~ ('microsoft.containerservice/managedclusters/microsoft.kubernetesconfiguration/fluxconfigurations'))|where (type !~ ('microsoft.portalservices/extensions/deployments'))|where (type !~ ('microsoft.portalservices/extensions'))|where (type !~ ('microsoft.portalservices/extensions/slots'))|where (type !~ ('microsoft.portalservices/extensions/versions'))|where (type !~ ('microsoft.azuredatatransfer/connections'))|where (type !~ ('microsoft.azuredatatransfer/connections/flows'))|where (type !~ ('microsoft.azuredatatransfer/pipelines'))|where (type !~ ('microsoft.databasewatcher/watchers'))|where (type !~ ('microsoft.datacollaboration/workspaces'))|where (type !~ ('microsoft.deviceregistry/devices'))|where (type !~ ('microsoft.deviceupdate/updateaccounts/activedeployments'))|where (type !~ ('microsoft.deviceupdate/updateaccounts/agents'))|where (type !~ ('microsoft.deviceupdate/updateaccounts/deployments'))|where (type !~ ('microsoft.deviceupdate/updateaccounts/deviceclasses'))|where (type !~ ('microsoft.deviceupdate/updateaccounts/updates'))|where (type !~ ('microsoft.deviceupdate/updateaccounts'))|where (type !~ ('microsoft.devopsinfrastructure/pools'))|where (type !~ ('microsoft.network/dnsresolverdomainlists'))|where (type !~ ('microsoft.network/dnsresolverpolicies'))|where (type !~ ('microsoft.workloads/epicvirtualinstances'))|where (type !~ ('microsoft.fairfieldgardens/provisioningresources'))|where (type !~ ('microsoft.healthmodel/healthmodels'))|where (type !~ ('microsoft.hybridcompute/arcserverwithwac'))|where (type !~ ('microsoft.hybridcompute/machinessovereign'))|where (type !~ ('microsoft.hybridcompute/machinesesu'))|where (type !~ ('microsoft.network/virtualhubs')) or ((kind =~ ('routeserver')))|where (type !~ ('microsoft.network/networkvirtualappliances'))|where (type !~ ('microsoft.metaverse/metaverses'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/connectors'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/files'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/filerequests'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/licenses'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/storages'))|where (type !~ ('microsoft.modsimworkbench/workbenches/chambers/workloads'))|where (type !~ ('microsoft.modsimworkbench/workbenches/sharedstorages'))|where (type !~ ('microsoft.insights/diagnosticsettings'))|where not((type =~ ('microsoft.network/serviceendpointpolicies')) and ((kind =~ ('internal'))))|where (type !~ ('microsoft.resources/resourcechange'))|where (type !~ ('microsoft.resources/resourcegraphvisualizer'))|where (type !~ ('microsoft.openlogisticsplatform/workspaces'))|where (type !~ ('microsoft.iotoperationsmq/mq'))|where (type !~ ('microsoft.orbital/cloudaccessrouters'))|where (type !~ ('microsoft.orbital/terminals'))|where (type !~ ('microsoft.orbital/sdwancontrollers'))|where (type !~ ('microsoft.recommendationsservice/accounts/modeling'))|where (type !~ ('microsoft.recommendationsservice/accounts/serviceendpoints'))|where (type !~ ('microsoft.recoveryservicesbvtd/vaults'))|where (type !~ ('microsoft.recoveryservicesbvtd2/vaults'))|where (type !~ ('microsoft.recoveryservicesintd/vaults'))|where (type !~ ('microsoft.recoveryservicesintd2/vaults'))|where (type !~ ('microsoft.features/featureprovidernamespaces/featureconfigurations'))|where (type !~ ('microsoft.deploymentmanager/rollouts'))|where (type !~ ('microsoft.providerhub/providerregistrations'))|where (type !~ ('microsoft.providerhub/providerregistrations/customrollouts'))|where (type !~ ('microsoft.providerhub/providerregistrations/defaultrollouts'))|where (type !~ ('microsoft.datareplication/replicationvaults'))|where not((type =~ ('microsoft.synapse/workspaces/sqlpools')) and ((kind =~ ('v3'))))|where (type !~ ('microsoft.mission/catalogs'))|where (type !~ ('microsoft.mission/communities'))|where (type !~ ('microsoft.mission/communities/communityendpoints'))|where (type !~ ('microsoft.mission/enclaveconnections'))|where (type !~ ('microsoft.mission/virtualenclaves/enclaveendpoints'))|where (type !~ ('microsoft.mission/virtualenclaves/endpoints'))|where (type !~ ('microsoft.mission/externalconnections'))|where (type !~ ('microsoft.mission/internalconnections'))|where (type !~ ('microsoft.mission/communities/transithubs'))|where (type !~ ('microsoft.mission/virtualenclaves'))|where (type !~ ('microsoft.mission/virtualenclaves/workloads'))|where (type !~ ('microsoft.windowspushnotificationservices/registrations'))|where (type !~ ('microsoft.workloads/insights'))|where (type !~ ('microsoft.hanaonazure/sapmonitors'))|where (type !~ ('microsoft.cloudhealth/healthmodels'))|where (type !~ ('microsoft.manufacturingplatform/manufacturingdataservices'))|where (type !~ ('microsoft.securitycopilot/capacities'))|where not((type =~ ('microsoft.sql/servers/databases')) and ((kind in~ ('system','v2.0,system','v12.0,system','v12.0,system,serverless','v12.0,user,datawarehouse,gen2,analytics'))))|where not((type =~ ('microsoft.sql/servers')) and ((kind =~ ('v12.0,analytics'))))|where ((type =~ ('Microsoft.CognitiveServices/BrowseOpenAI'))) or ((type =~ ('Microsoft.CognitiveServices/Accounts')) and ((kind =~ ('OpenAI'))))|project name,kind,locationDisplayName,customDomainName,sku,status,createdDate,id,type,location,subscriptionId,resourceGroup,tags|sort by (tolower(tostring(name))) asc",
                    "options": {
                        "$top": 100,
                        "$skip": 0,
                        "$skipToken": "",
                        "resultFormat": ""
                    },
                    "subscriptions": subscriptionIds
                },
                "httpMethod": "POST",
                // "name": "62a36ece-c394-4dc5-8c88-b8500f7a1009",
                "requestHeaderDetails": {
                    "commandName": "HubsExtension.ARGBrowseResourcesInMenu.Microsoft.CognitiveServices/BrowseOpenAI.Refresh"
                },
                "url": "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01"
            }
        ]
    }

    let fetchUrl = 'https://management.azure.com/batch?api-version=2020-06-01'

    try {
        const res = await axios.post(fetchUrl, payload, { headers });
        return res.data;
    } catch (err) {
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

    console.log(payload);

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

async function delete_deployment(token, subscriptionId, accountName, deployName, resourceGroupName = 'openai') {
    let url = `https://management.azure.com//subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/deployments/${deployName}?api-version=2023-10-01-preview`;

    // 请求头
    headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const res = await axios.delete(url, { headers });
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
    create_deployment,
    list_cognitive_services,
    delete_deployment
}