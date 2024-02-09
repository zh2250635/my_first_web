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
            // 将返回的数据显示在页面上
            table = document.getElementById('account_info');
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
                cell7.innerHTML = '<input type="checkbox" value="' + item.tag + '">';

                if (item.used == '0' && item.is_alive == '1') {
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
            }
        }
    }).catch((err) => {
        console.log(err);
    });
}

function load_oneapi_channels() {
    // 从localstorage中读取数据
    var data = JSON.parse(localStorage.getItem('oneapi_channels_imformation_cache'));
    // 清除表格中的数据(除了表头)
    table = document.getElementById('oneapi_channels_info');
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    // 重新加载数据
    for (let i = 0; i < data.length; i++) {
        if (data[i].modified_name.startsWith('az-')) {
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
function test() {
    get_account_info();
    load_oneapi_channels();
}

window.addEventListener('load', () => {
    test();
});