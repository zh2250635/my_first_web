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
            table.innerHTML = '';
            for (var key in data) {
                
            }
        }
    }).catch((err) => {
        console.log(err);
    });
}

function test() {
    var table = document.getElementById('account_info');
    // 插入新行
    var row = table.insertRow(-1);  // 参数 -1 表示在表格末尾插入新行

    // 插入新单元格并设置单元格内容
    var cell1 = row.insertCell(0);
    cell1.textContent = 'New Tag';

    var cell2 = row.insertCell(1);
    cell2.textContent = 'New Status';

    var cell3 = row.insertCell(2);
    cell3.textContent = 'New Subscription Count';

    var cell4 = row.insertCell(3);
    cell4.innerHTML = '<button type="button" class="btn btn-primary" action="edit">Edit</button>';
    cell4.innerHTML += '<button type="button" class="btn btn-danger" action="delete">Delete</button>';
}

window.addEventListener('load', () => {
    test();
});