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
                // table = document.getElementById('account_info');
                // while (table.rows.length > 1) {
                //     table.deleteRow(1);
                // }
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

function get_select_tags(select_all = false){
    let container = document.getElementById('az_account');
    // 找到container下所有的input元素
    var inputs = container.getElementsByTagName('input');
    var tags = [];
    for (var i = 0; i < inputs.length; i++) {
        if (select_all) {
            if (inputs[i].type == 'checkbox') {
                tags.push(inputs[i].value);
            }
        }else{
            if (inputs[i].type == 'checkbox' && inputs[i].checked) {
                tags.push(inputs[i].value);
            }
        }
    }
    return tags.join(',');
}

async function checkPreview(){
    let preview_tags = get_select_tags();
    // 如果preview_tags为空, 则发出提示
    if (preview_tags == '') {
        if(!confirm('你没有选择任何账号，将检查所有账号，确定要继续吗？')) {
            return;
        }
        let all_tags = get_select_tags(true);
        preview_tags = all_tags;
    }

    // 如果大于1个账号，则发出提示
    if (preview_tags) {
        for (let tag of preview_tags.split(',')) {
            if(tag == '') continue;
            await checkPreviewSingle(tag);
        }
    }

    async function checkPreviewSingle(tag) {
        show_message(`检查${tag}中，不要刷新。。。`)
        // 发送请求
        await fetch('/api/az_account/preview', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({preview_tag: tag}),
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
        })
    }
    // 刷新数据
    refreshAccount();
}

async function checkAlive(){
    let alive_tags = get_select_tags();
    // 如果alive_tags为空, 则发出提示
    if (alive_tags == '') {
        let all_tags = get_select_tags(true);
        if (!confirm('你没有选择任何账号，将检查所有账号，确定要继续吗？')) {
            return;
        }
        alive_tags = all_tags;
    }

    if (alive_tags) {
        for (let tag of alive_tags.split(',')) {
            if(tag == '') continue;
            await checkAliveSingle(tag);
        }
    }

    // 单个账号检查函数
    async function checkAliveSingle(tag) {
        show_message(`检查${tag}中，不要刷新。。。`)
        // 发送请求
        await fetch('/api/az_account/alive', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({alive_tag: tag}),
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
        })
    }

    // 刷新数据
    refreshAccount();
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

function deploy(tags = null){
    tags = tags || get_select_tags();
    // 如果tags为空, 则发出提示
    if (tags == '') {
        // 让用户选择要不要继续
        if(!confirm('你没有选择任何账号，将采用自动部署模式，确定要继续吗？')) {
            return;
        }
    }

    // 如果大于1个账号，则发出提示
    if (tags.split(',').length > 1) {
        alert('一次只能部署一个账号');
        return;
    }

    show_message('部署中，不要刷新。。。')
    // 发送请求
    fetch('/api/az_account/deploy', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({tag: tags}),
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
    // 创建一个新的消息元素
    var message = document.createElement('div');
    message.textContent = content;
    message.className = 'message'; // 设置CSS类
    message.id = 'message'; // 设置id
    document.body.appendChild(message); // 将消息添加到页面中

    // 等待页面的其他元素加载完毕，确保获取正确的尺寸和位置
    await new Promise(resolve => setTimeout(resolve, 0));

    // 计算和设置消息的位置
    var width = document.documentElement.clientWidth;
    var height = document.documentElement.clientHeight;
    var message_width = message.offsetWidth;
    var message_height = message.offsetHeight;
    message.style.left = (width - message_width) / 2 + 'px';
    // 这里使用的是消息高度的累加来避免消息重叠
    message.style.top = (height - message_height) / 10 + 'px';

    // 显示消息，并在2秒后消失
    message.classList.add('show');
    setTimeout(() => {
        message.classList.remove('show');
        // 消息消失后从页面中移除元素
        document.body.removeChild(message);
    }, 2000);
}

function get_account_info() {
    // 携带cookie发送请求
    fetch('/api/az_account', {
        method: 'GET',
        credentials: 'same-origin',
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
            // 将数据缓存到localstorage中
            localStorage.setItem('account_info_cache', JSON.stringify(data));

            // 清除表格中的数据(除了表头)
            table = document.getElementById('account_info');
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }

            // 将返回的数据显示在页面上
            for (let item of data){
                // 创建新行
                let newRow = table.insertRow(-1);

                // 创建新单元格并添加数据
                let cell1 = newRow.insertCell(0);
                cell1.innerHTML = item.tag;

                let cell2 = newRow.insertCell(1);
                cell2.innerHTML = item.used == '1' ? "已使用" : "未使用";

                let cell3 = newRow.insertCell(2);
                cell3.innerHTML = item.sub_id_count;

                let cell4 = newRow.insertCell(3);
                cell4.innerHTML = item.preview_available == '1' ? "有权限" : "无权限";

                let cell5 = newRow.insertCell(4);
                cell5.innerHTML = item.retained == '1' ? "已保留" : "不保留";

                let cell6 = newRow.insertCell(5);
                cell6.innerHTML = item.is_alive == '1' ? "存活" : "挂了";

                let cell7 = newRow.insertCell(6);
                if(item.mail){
                    cell7.innerHTML = item.mail.replace(/"/g, '');
                }else{
                    cell7.innerHTML = '未知'
                }

                let cell8 = newRow.insertCell(7);
                cell8.innerHTML = '<input type="checkbox" value="' + item.tag + '">';

                if (item.used == '0' && item.is_alive == '1' && item.preview_available == '1') {
                    // 将背景设置为绿色
                    newRow.style.backgroundColor = '#ccffcc';
                }else{
                    // 将背景设置为蓝色
                    newRow.style.backgroundColor = '#cce5ff';
                }

                if (item.used == '1' || item.is_alive == '0') {
                    // 将背景设置为红色
                    newRow.style.backgroundColor = '#ffcccc';
                }

                if (item.is_alive == '0') {
                    // 将背景设置为深红色
                    newRow.style.backgroundColor = '#ff6666';
                }
            }
            
            // 更新统计数据
            count_color(table);
        }
    }).catch((err) => {
        console.log(err);
    }).finally(() => {
        document.getElementById('az_account').style.width = 'auto';
        document.getElementById('az_account').style.height = 'auto';
    });
}

function count_color(table){
    // 更新统计数据
    let count_table = document.getElementById('account_type_count');

    // 遍历表格的每一行（除了表头），检查背景颜色，填充统计数据

    // 统计总数
    let total_count = table.rows.length - 1;

    // 统计深红色
    let red_count = 0;
    for (let i = 1; i < table.rows.length; i++) {
        if (table.rows[i].style.backgroundColor == 'rgb(255, 102, 102)') {
            red_count++;
        }
    }

    // 统计红色
    let light_red_count = 0;
    for (let i = 1; i < table.rows.length; i++) {
        if (table.rows[i].style.backgroundColor == 'rgb(255, 204, 204)') {
            light_red_count++;
        }
    }

    // 统计蓝色
    let blue_count = 0;
    for (let i = 1; i < table.rows.length; i++) {
        if (table.rows[i].style.backgroundColor == 'rgb(204, 229, 255)') {
            blue_count++;
        }
    }

    // 统计绿色
    let green_count = 0;
    for (let i = 1; i < table.rows.length; i++) {
        if (table.rows[i].style.backgroundColor == 'rgb(204, 255, 204)') {
            green_count++;
        }
    }

    // 更新统计数据

    // 清除表格中的数据(除了表头)
    while (count_table.rows.length > 1) {
        count_table.deleteRow(1);
    }

    // 重新加载数据
    let newRow = count_table.insertRow(-1);
    let cell1 = newRow.insertCell(0);
    cell1.innerHTML = total_count;
    let cell2 = newRow.insertCell(1);
    cell2.innerHTML = red_count;
    let cell3 = newRow.insertCell(2);
    cell3.innerHTML = light_red_count;
    let cell4 = newRow.insertCell(3);
    cell4.innerHTML = blue_count;
    let cell5 = newRow.insertCell(4);
    cell5.innerHTML = green_count;

    // 修改对应列的背景颜色

    // 总数灰色
    cell1.style.backgroundColor = '#f2f2f2';

    cell2.style.backgroundColor = '#ff6666';
    cell3.style.backgroundColor = '#ffcccc';
    cell4.style.backgroundColor = '#cce5ff';
    cell5.style.backgroundColor = '#ccffcc';

    let newRow2 = count_table.insertRow(-1);
    
    function buttomTemplate(buttomText, colourName) {
        return `<button class="btn btn-${colourName} btn-sm" type="button" onclick="filterTable('${colourName}')" style="margin: 5px;" background-color="${colourName}">${buttomText}</button>`;
    }

    let cell6 = newRow2.insertCell(0);
    cell6.innerHTML = buttomTemplate('选择深全部', 'all');

    let cell7 = newRow2.insertCell(1);
    cell7.innerHTML = buttomTemplate('选择深红色', 'rgb(255, 102, 102)');

    let cell8 = newRow2.insertCell(2);
    cell8.innerHTML = buttomTemplate('选择红色', 'rgb(255, 204, 204)');

    let cell9 = newRow2.insertCell(3);
    cell9.innerHTML = buttomTemplate('选择蓝色', 'rgb(204, 229, 255)');

    let cell10 = newRow2.insertCell(4);
    cell10.innerHTML = buttomTemplate('选择绿色', 'rgb(204, 255, 204)');
}

function filterTable(colour) {
    let table = document.getElementById('account_info');
    if (colour === 'all') {
        for (let i = 1; i < table.rows.length; i++) {
            if (table.rows[i]['cells'][7].children[0].checked) {
                // 取消选中所有行
                table.rows[i]['cells'][7].children[0].checked = false;
            }else{
                // 选中所有行
                table.rows[i]['cells'][7].children[0].checked = true;
            }
        }
    }
    for (let i = 1; i < table.rows.length; i++) {
        if (table.rows[i].style.backgroundColor === colour) {
            if (table.rows[i]['cells'][7].children[0].checked) {
                // 取消选中对应颜色的行
                table.rows[i]['cells'][7].children[0].checked = false;
            }else{
                // 选中对应颜色的行
                table.rows[i]['cells'][7].children[0].checked = true;
            }
        }
    }
}

function deleteAndDeploy(){
    let tags = get_select_tags();
    // 如果tags为空, 则发出提示
    if (tags == '') {
        alert('请选择要删除并部署的账号');
        return;
    }
    // 如果大于1个账号，则发出提示
    if (tags.split(',').length > 1) {
        alert('一次只能删除并部署一个账号');
        return;
    }
    show_message('删除并部署中，不要刷新。。。')
    // 调用删除函数
    deleteChannels(tags);

    // 调用部署函数
    deploy(tags);
}