function deleteAccounts(){
    let delete_accounts = get_select_tags();
    // 如果delete_accounts为空，则发出提示
    if (delete_accounts == '') {
        show_message('请选择要删除的账号');
        return;
    }else{
        if (confirm(`确定要删除账号${delete_accounts}吗？`)) {
            console.log('delete_accounts: ' + delete_accounts);
            // 发送请求
            fetch('/api/az_account', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({delete_accounts: delete_accounts}),
            }).then((response) => {
                // 如果返回状态码为200，表示请求成功
                if (response.status === 200) {
                    var json = response.json();
                    return json;
                }else {
                    // 否则，返回错误信息
                    return response.text();
                }
            }).then((data) => {
                // 如果返回的是JSON数据，表示请求成功
                if (typeof(data) === 'object') {
                    // 清除表格中的数据(除了表头)
                    table = document.getElementById('account_info');
                    while (table.rows.length > 1) {
                        table.deleteRow(1);
                    }
                    // 重新加载数据
                    get_account_info();
                }else{
                    show_message(data);
                }
            }).catch((err) => {
                console.log(err);
            });
        }else{
            console.log('取消删除');
            show_message('取消删除');
            return;
        }
    }
}

function retain(){
    let retain_accounts = get_select_tags();
    // 如果retain_accounts为空，则发出提示
    if (retain_accounts == '') {
        show_message('请选择要保留的账号');
        return;
    }else{
        fetch('/api/az_account', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({retain_accounts: retain_accounts}),
        }).then((response) => {
            // 如果返回状态码为200，表示请求成功
            if (response.status === 200) {
                var json = response.json();
                return json;
            }else {
                // 否则，返回错误信息
                return response.text();
            }
        }).then((data) => {
            // 如果返回的是JSON数据，表示请求成功
            if (typeof(data) === 'object') {
                // 清除表格中的数据(除了表头)
                table = document.getElementById('account_info');
                while (table.rows.length > 1) {
                    table.deleteRow(1);
                }
                // 重新加载数据
                get_account_info();
                show_message('保留成功');
            }else{
                show_message(data);
            }
        }).catch((err) => {
            console.log(err);
        });
    }
}

function refreshAccount(){
    // 找到表
    table = document.getElementById('account_info');
    // 清除表格中的数据(除了表头)
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    get_account_info()
}

function get_select_tags(){
    let container = document.getElementById('az_account');
    // 找到container下所有的input元素
    var inputs = container.getElementsByTagName('input');
    var tags = [];
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'checkbox' && inputs[i].checked == true) {
            tags.push(inputs[i].value);
        }
    }
    return tags.join(',');
}

function checkPreview(){
    let preview_tags = get_select_tags();
    // 如果preview_tags为空, 则发出提示
    if (preview_tags == '') {
        alert('请选择要检查权限的账号');
        return;
    }
    // 如果大于1个账号，则发出提示
    if (preview_tags.split(',').length > 1) {
        alert('放过我吧，一次只能检查一个账号');
        return;
    }
    show_message('检查中，不要刷新。。。')
    // 发送请求
    fetch('/api/az_account/preview', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({preview_tag: preview_tags}),
    }).then((response) => {
        // 如果返回状态码为200，表示请求成功
        if (response.status === 200) {
            var json = response.json();
            return json;
        }else {
            // 否则，返回错误信息
            return response.text();
        }
    }).then((data) => {
        // 如果返回的是JSON数据，表示请求成功
        if (typeof(data) === 'object') {
            // 如果检查成功
            if (data.code == 1) {
                // 显示检查结果
                alert(data.msg);
            }else{
                // 显示检查结果
                alert(data.msg);
            }
        }else{
            alert(data);
            // 刷新数据
            refreshAccount();

        }
    }).catch((err) => {
        console.log(err);
    });
}

function checkAlive(){
    let alive_tags = get_select_tags();
    // 如果alive_tags为空, 则发出提示
    if (alive_tags == '') {
        alert('请选择要检查权限的账号');
        return;
    }
    // 如果大于1个账号，则发出提示
    if (alive_tags.split(',').length > 1) {
        alert('放过我吧，一次只能检查一个账号');
        return;
    }
    show_message('检查中，不要刷新。。。')
    // 发送请求

    fetch('/api/az_account/alive', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({alive_tag: alive_tags}),
    }).then((response) => {
        // 如果返回状态码为200，表示请求成功
        if (response.status === 200) {
            var json = response.json();
            return json;
        }else {
            // 否则，返回错误信息
            return response.text();
        }
    }).then((data) => {
        // 如果返回的是JSON数据，表示请求成功
        if (typeof(data) === 'object') {
            // 如果检查成功
            if (data.code == 1) {
                // 显示检查结果
                alert(data.msg);
            }else{
                // 显示检查结果
                alert(data.msg);
            }
        }else{
            alert(data);
            // 刷新数据
            refreshAccount();
        }
    }).catch((err) => {
        console.log(err);
    });
}

function apply(){
    let apply_tags = get_select_tags();
    // 如果apply_tags为空, 则发出提示
    if (apply_tags == '') {
        alert('请选择要申请权限的账号');
        return;
    }
    // 如果大于1个账号，则发出提示
    if (apply_tags.split(',').length > 1) {
        alert('放过我吧，一次只能申请一个账号');
        return;
    }
    show_message('申请中，不要刷新。。。')

    // 要求输入邮箱，默认为1314@zhtec.xyz
    let email = prompt('请输入邮箱', '1314520@zhtec.xyz');
    if (email == null) {
        return;
    }
    // 发送请求
    fetch('/api/az_account/apply', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({apply_tag: apply_tags, mail: email}),
    }).then((response) => {
        // 如果返回状态码为200，表示请求成功
        if (response.status === 200) {
            var json = response.json();
            return json;
        }else {
            // 否则，返回错误信息
            return response.text();
        }
    }).then((data) => {
        // 如果返回的是JSON数据，表示请求成功
        if (typeof(data) === 'object') {
            // 如果检查成功
            if (data.code == 1) {
                // 显示检查结果
                alert(data.msg);
            }else{
                // 显示检查结果
                alert(data.msg);
            }
        }else{
            alert(data);
        }
    }).catch((err) => {
        console.log(err);
    });
}

async function show_message(content) {
    var message = document.getElementById('message');
    message.textContent = content;
    // 获取页面的宽度（不含滚动条）
    var width = document.documentElement.clientWidth;
    // 获取页面的高度（不含滚动条）
    var height = document.documentElement.clientHeight;
    // 获取message的宽度
    var message_width = message.offsetWidth;
    // 获取message的高度
    var message_height = message.offsetHeight;
    // 设置message的位置
    message.style.left = (width - message_width) / 2 + 'px';
    message.style.top = (height - message_height) / 10 + 'px';
    // 显示message
    message.classList.add('show');
    // 让message处于最上层
    message.zIndex = 2000
    setTimeout(() => message.classList.remove('show'), 2000);
}