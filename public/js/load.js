function load_oneapi_channels() {
    // 从localstorage中读取数据
    var data = JSON.parse(localStorage.getItem('oneapi_channels_imformation_cache'));
    // 清除表格中的数据(除了表头)
    if (data == null) {
        return;
    }
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

function load_account_info() {
    // 从localstorage中读取数据
    var data = JSON.parse(localStorage.getItem('account_info_cache'));
    // 清除表格中的数据(除了表头)
    if (data == null) {
        return;
    }
    table = document.getElementById('account_info');
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    // 重新加载数据
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

        let cell9 = newRow.insertCell(8);
        cell9.innerHTML = '<button onclick="open_in_new_window(\'' + item.tag + '\')">查看</button>';

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

function draw_default_img() {
    var canvas = document.getElementById('tps-detail-chart');
    var img = document.getElementById('tests');

    var ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    console.log(img.src);
}

function test() {
    // 加载账号信息
    load_account_info();
    // 加载oneapi_channels信息
    load_oneapi_channels();
    // 绘制默认图像
    draw_default_img();
    // 加载配置信息
    loadConfigData();
}

window.addEventListener('load', () => {
    test();
});