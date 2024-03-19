let params = {};
window.addEventListener('load', async () => {
    await Swal.fire({
        title: '警告',
        text: '功能开发中，请谨慎使用',
        icon: 'warning',
        confirmButtonText: '确定'
    });
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
            <button class="account_action_button" onclick="delete_account(this)">删除</button>
            <button class="account_action_button">添加新的部署</button>
            <button class="account_action_button" onclick="show_existed_deployments(this)">显示已存在的部署</button>
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

function show_existed_deployments(element) {
    console.log('show_existed_deployments');
    // 在这里 'element' 将是按钮自身，因此我们使用它来找到父元素，然后找到label
    const label = element.parentElement.parentElement.querySelector('label');
    if (label) {
        label.click(); // 触发label的点击事件
    } else {
        console.log('label not found');
    }
}

function delete_account(button) {
    let account_name =
        button.parentElement.parentElement.querySelector(
            ".account_name"
        ).innerText;

    let sub_id =
        button.parentElement.parentElement.parentElement.querySelector(
            ".az_portal_sub_id"
        ).innerText;

    let resourse_group =
        button.parentElement.parentElement.parentElement.querySelector(
            ".az_portal_resourse_group"
        ).innerText;

    let location =
        button.parentElement.parentElement.parentElement.querySelector(
            ".az_portal_location"
        ).innerText;
    
    console.log(`sub_id: ${sub_id}`);
    console.log(`account_name: ${account_name}`);
    console.log(`resourse_group: ${resourse_group}`);
    console.log(`location: ${location}`);
    Swal.fire({
        title: '删除账号',
        text: `你确定要删除账号 ${account_name} 吗？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            delete_account_request(sub_id, account_name, resourse_group, location)
                .then((response) => {
                    if (response.status === 200) {
                        Swal.fire({
                            title: '账号删除成功',
                            text: '账号删除成功',
                            icon: 'success',
                            confirmButtonText: '确定',
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: '错误',
                            text: '删除账号失败',
                            icon: 'error',
                            confirmButtonText: '确定',
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        });
                    }
                })
                .catch((error) => {
                    console.error(error);
                    Swal.fire({
                        title: '错误',
                        text: '删除账号失败',
                        icon: 'error',
                        confirmButtonText: '确定',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                });
        }
    });
}

async function delete_account_request(sub_id, account_name, resourse_group, location) {
    let response = await fetch(`/api/az_portal/cognitive_services_account?tag=${params.tag}&sub_id=${sub_id}&name=${account_name}&resource_group=${resourse_group}&location=${location}`, {
        method: 'DELETE'
    });
    return response;
}

async function add_account(){
    Swal.fire({
        title: '正在加载信息',
        text: '请稍等...',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
    });
    let sub_ids = await get_sub_ids();
    Swal.fire({
        title: '填写信息',
        html: `
        <input type="text" id="account_name" placeholder="账号名称" />
        <select id="sub_id">
            <option value="">选择订阅</option>
            ${sub_ids.map(sub_id => `<option value="${sub_id}">${sub_id}</option>`)}
        </select>
        <input type="text" id="resourse_group" placeholder="资源组" />
        <input type="text" id="location" placeholder="位置" />
        </form>
        `,
        showConfirmButton: true,
        confirmButtonText: '确定',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        console.log(result);
        
        // 打印填写的表单
        console.log(document.getElementById('account_name').value);
        console.log(document.getElementById('sub_id').value);
        console.log(document.getElementById('resourse_group').value);
        console.log(document.getElementById('location').value);

        let account_name = document.getElementById('account_name').value;
        let sub_id = document.getElementById('sub_id').value;
        let resourse_group = document.getElementById('resourse_group').value;
        let location = document.getElementById('location').value;

        if (!account_name || !sub_id || !resourse_group || !location) {
            Swal.fire({
                title: '错误',
                text: '请填写所有信息',
                icon: 'error',
                confirmButtonText: '确定',
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        add_account_request(sub_id, account_name, resourse_group, location)
    });
}

async function get_sub_ids() {
    let sub_ids = await fetch(`/api/az_portal/subscriptions?tag=${params.tag}`)
        .then(response => {
            if (!response.ok) {
                console.log(response);
                throw new Error(`Failed to fetch subscriptions: ${response.status}`);
            }
            return response.json()
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error(error);
        });
    return sub_ids;
}

async function add_account_request(sub_id, account_name, resourse_group, location) {
    let body = {
        tag: params.tag,
        sub_id: sub_id,
        name: account_name,
        resource_group_name: resourse_group,
        location: location
    };
    let response = await fetch(`/api/az_portal/cognitive_services_account`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    console.log(response.json());
    return response;
}

// Path: public/js/az_portal.js