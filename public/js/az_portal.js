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
    load_accounts().then(({accounts, is_new}) => {
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
}