let params = {};
window.addEventListener('load', () => {
    // 把页面的url的查询参数转换为对象
    params = get_params();
    // 如果没有tag参数，表示没有选择通道
    if (!params.tag) {
        Swal.fire({
            title: '错误',
            text: '请选择一个通道',
            icon: 'error',
            confirmButtonText: '确定'
        });
        // 两秒后关闭窗口
        setTimeout(() => {
            window.close();
        }, 2000);
    }

    // console.log(params.tag);

    var newElement = document.createElement('p');
    newElement.textContent = '通道名称：' + params.tag;

    var currentDiv = document.getElementById('tag');
    document.body.insertBefore(newElement, currentDiv);

    Swal.fire({
        title: '正在加载资源',
        text: '请稍等...',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
    load_accounts().then(({ accounts, is_new }) => {
        // console.log(`is_new: ${is_new}`);
        if (is_new) {
            Swal.close();
        } else {
            Swal.fire({
                title: '资源加载成功',
                text: '本次资源加载来自本地缓存，你要使用这样的结果吗？',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: '使用',
                cancelButtonText: '重新加载',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.close();
                } else {
                    // 清除缓存
                    localStorage.removeItem(`az_portal_accounts_cache_${params.tag}`);
                    window.location.reload();
                }
            });
        }
        return accounts;
    }).then((accounts) => {
        add_accounts_to_dom(accounts);
    }).catch((error) => {
        console.error(error);
    });
});

function get_params() {
    let url = window.location.href;
    let params = url.split('?')[1];
    let obj = {};
    if (params) {
        let arr = params.split('&');
        for (let i = 0; i < arr.length; i++) {
            let item = arr[i].split('=');
            obj[item[0]] = item[1];
        }
    }
    // console.log(obj);
    return obj;
}

async function load_accounts() {
    // 尝试在本地存储中获取账号信息
    let accounts = localStorage.getItem(`az_portal_accounts_cache_${params.tag}`);
    if (accounts) {
        accounts = JSON.parse(accounts);
        // console.log(accounts);
        return {
            accounts: accounts,
            is_new: false
        }
    } else {
        // console.log('no cache');
        let accounts = await fetch(`api/az_portal/cognitive_services?tag=${params.tag}`)
            .then(response => response.json())
            .then(data => {
                // console.log(`data: ${data}`);
                if (data.responses[0].httpStatusCode === 200) {
                    localStorage.setItem(`az_portal_accounts_cache_${params.tag}`, JSON.stringify(data.responses[0].content.data));
                }
                return data.responses[0].content.data;
            })
            .catch(error => {
                console.error(error);
                Swal.fire({
                    title: '错误',
                    text: '加载资源失败，点击确定关闭窗口',
                    icon: 'error',
                    confirmButtonText: '确定'
                }).then(() => {
                    window.close();
                });
            });
        return {
            accounts: accounts,
            is_new: true
        }
    }
}

function add_accounts_to_dom(accounts) {
    let account_box = document.getElementById('azure_accounts');

    for (let i = 0; i < accounts.length; i++) {
        let account = accounts[i];
        let account_div = document.createElement('div');
        account_div.className = 'az_portal_account_box';
        account_div.id = `account_${i}`;
        account_div.innerHTML = account_template(account);
        account_box.appendChild(account_div);
    }
}

function account_template(account) {
    return `
        <div class="az_portal_account_info">
        <input type="checkbox" />
        <label class="az_portal_account_info_lable" id="${account.name}">
        <span class="account_name">${account.name}</span>
        <button onclick="clicked_account(this)" class="display_none_button">
            点击
        </button>

        </label>
        <span class="az_portal_sub_id display_none_span">${account.subscriptionId}</span>
        <span class="az_portal_resourse_group display_none_span">${account.resourceGroup}</span>
        <span class="az_portal_location display_none_span">${account.location}</span>
        <span class="az_portal_account_location_display display_none_span">${account.locationDisplayName}</span>
        <span class="account_action_box">
        <button class="account_action_button">删除</button>
        <button class="account_action_button">添加新的部署</button>
        <button class="account_action_button">显示已存在的部署</button>
        </span>
    </div>
    <div class="az_portal_account_deployments" id="deployments_${account.name}">

    </div>
    `;
}

function clicked_account(button) {
    let account_name =
        button.parentElement.parentElement.querySelector(
            "span"
        ).innerText;

    let sub_id =
        button.parentElement.parentElement.parentElement.querySelector(
            ".az_portal_sub_id"
        ).innerText;

    let resourse_group =
        button.parentElement.parentElement.parentElement.querySelector(
            ".az_portal_resourse_group"
        ).innerText;

    // console.log(account_name);
    // console.log(sub_id);
    // console.log(resourse_group);
    load_deployments(sub_id, resourse_group, account_name)
        .then((deployments) => {
            // console.log(deployments);
            add_deployments_to_dom(deployments, account_name);
        })
        .catch((error) => {
            console.error(error);
        });
}

async function load_deployments(sub_id, resource_group, account_name) {
    Swal.fire({
        title: '正在加载部署信息',
        text: '请稍等...',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
    let deployments = await fetch(`/api/az_portal/deployments?tag=${params.tag}&sub_id=${sub_id}&account_name=${account_name}&resource_group=${resource_group}`)
        .then(response => {
            if (!response.ok) {
                console.log(response);
                throw new Error(`Failed to fetch deployments: ${response.status}`);
            }
            return response.json()
        })
        .then(data => {
            Swal.close();
            return data.value;
        })
        .catch(error => {
            console.error(error);
            Swal.fire({
                title: '错误',
                text: '加载资源失败',
                icon: 'error',
                confirmButtonText: '确定'
            })
        });
        console.log(JSON.stringify(deployments));
    return deployments;
}

async function add_deployments_to_dom(deployments, account_name) {
    let deployments_box = document.getElementById(`deployments_${account_name}`);
    deployments_box.innerHTML = '';
    for (let i = 0; i < deployments.length; i++) {
        let deployment = deployments[i];
        let deployment_div = document.createElement('div');
        deployment_div.className = 'az_portal_deployment_box';
        deployment_div.innerHTML = deployment_template(deployment);
        deployments_box.appendChild(deployment_div);
    }
}

function deployment_template(deployment) {
    return `
    <div class="deployments_info">
        <span class="deployment_name">${deployment.name}</span>
        <span class="deployment_sku">${deployment.sku.capacity}</span>
        <span class="deployment_model_name">${deployment.properties.model.name}</span>\
        <span class="deployment_model_version">${deployment.properties.model.version}</span>
        <span class="deployment_button_box">
            <button class="deployment_action_button">删除</button>
            <button class="deployment_action_button">修改</button>
    </div>
    `;
}
// Path: public/js/az_portal.js