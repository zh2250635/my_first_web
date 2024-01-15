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

                if (item.used == '1') {
                    newRow.style.backgroundColor = '#ffcccc';
                }else{
                    newRow.style.backgroundColor = '#e4f6d4';
                }
            }
        }
    }).catch((err) => {
        console.log(err);
    });
}

function test() {
    get_account_info();
}

window.addEventListener('load', () => {
    test();
});