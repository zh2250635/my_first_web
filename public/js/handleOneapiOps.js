function add_listener_to_oneapi_form() {
        // 给表单添加监听事件
    document.querySelector('form[name="oneapi_form"]').addEventListener('submit', function(event) {
        // 阻止表单的默认提交行为，这样我们可以自由地处理数据
        event.preventDefault();

        // 获取用户选择的模型
        let model = document.querySelector('[name="oneapi"]').value;

        fetch('/api/oneapi', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({model: model}),
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
                tpm_element = document.getElementById('tpm');
                dpm_element = document.getElementById('dpm');
                rpm_element = document.getElementById('rpm');
                tpm_element.innerHTML = 'TPM: '+data[0].tpm;
                dpm_element.innerHTML = '上一分钟美金: '+data[0].dpm;
                rpm_element.innerHTML = 'RPM: '+data[0].rpm;
            }else{
                console.log(data);
            }
        }
        ).catch((err) => {
            console.log(err);
        });
    });
}

function get_select_names() {
    let container = document.getElementById('oneapi_channels');
    // 获取container下所有的input元素
    let inputs = container.getElementsByTagName('input');
    let names = [];
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].checked) {
            names.push(inputs[i].value);
        }
    }
    return names;
}

function refresh(){
    // 清除表格中的数据(除了表头和第一行)
    table = document.getElementById('oneapi_channels_info');
    while (table.rows.length > 3) {
        table.deleteRow(1);
    }
    fetch('/api/oneChannels', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
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
            // 清除表格中的数据(除了表头和第一行)
            table = document.getElementById('oneapi_channels_info');
            while (table.rows.length > 1) {
                table.deleteRow(1);
            }
            //将结果保存到localstorage
            localStorage.setItem('oneapi_channels_imformation_cache', JSON.stringify(data));
            // 重新加载数据
            for (let i = 0; i < data.length; i++) {
                // 判断是否为本地运行
                if (window.location.hostname != 'localhost' && data[i].modified_name.startsWith('az-')) {
                    continue;
                }
                let row = table.insertRow();
                let name_cell = row.insertCell();
                let count_cell = row.insertCell();
                let total_used_quota_cell = row.insertCell();
                let overall_status_cell = row.insertCell();
                let max_priority_cell = row.insertCell();
                let total_weight_cell = row.insertCell();
                let created_time_cell = row.insertCell();
                let checkbox_cell = row.insertCell();
                name_cell.innerHTML = data[i].modified_name;
                count_cell.innerHTML = data[i].count;
                total_used_quota_cell.innerHTML = data[i].total_used_quota;
                overall_status_cell.innerHTML = data[i].overall_status;
                max_priority_cell.innerHTML = data[i].max_priority;
                total_weight_cell.innerHTML = data[i].total_weight;
                created_time_cell.innerHTML = data[i].created_time;
                if (data[i].modified_name == '总计：非禁用分组数量') {
                    checkbox_cell.innerHTML = '';
                }else{
                    checkbox_cell.innerHTML = '<input type="checkbox" name="oneapi_channels" value="'+data[i].modified_name+'">';
                }
            }
        }
    }).catch((err) => {
        console.log(err);
    });
}

function deleteChannels(){
    // 获取选择的通道名称
    let names = get_select_names();
    if (names.length == 0) {
        alert('请选择要删除的通道');
        return;
    }
    if(!confirm(`确定要删除${names}吗？`)){
        return;
    }
    // 发送删除请求
    fetch('/api/oneChannels', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({names: names}),
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
            alert('删除成功');
            refresh();
        }else{
            alert(data);
        }
    }).catch((err) => {
        console.log(err);
    });
}

function deleteUseless(){
    // 发送删除请求
    fetch('/api/oneChannels/useless', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
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
            alert(data.msg);
            refresh();
        }else{
            alert(data);
        }
    }).catch((err) => {
        console.log(err);
    });
}

window.addEventListener('load', () => {
    add_listener_to_oneapi_form();
});