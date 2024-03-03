let ws_connected = false;
let db = null;
// 初始化SQL.js
initSqlJs().then(function(SQL){
    // 连接到数据库
    db = new SQL.Database();
    // 创建 gin 表
    db.run(`CREATE TABLE gin (
        time TEXT,
        id TEXT,
        statusCode TEXT,
        ip TEXT,
        methodAndPath TEXT
    );`);

    // 创建 gin 表的触发器
    db.run(`CREATE TRIGGER delete_row_gin AFTER INSERT ON gin
    BEGIN
        DELETE FROM gin WHERE id NOT IN (SELECT id FROM gin ORDER BY rowid DESC LIMIT 1000);
    END;`);

    // 创建 info 表
    db.run(`CREATE TABLE info (
        time TEXT,
        id TEXT,
        msg TEXT
    );`);

    // 创建 info 表的触发器
    db.run(`CREATE TRIGGER delete_row_info AFTER INSERT ON info
    BEGIN
        DELETE FROM info WHERE id NOT IN (SELECT id FROM info ORDER BY rowid DESC LIMIT 1000);
    END;`);

    // 创建 err 表
    db.run(`CREATE TABLE err (
        time TEXT,
        id TEXT,
        msg TEXT
    );`);

    // 创建 err 表的触发器
    db.run(`CREATE TRIGGER delete_row_err AFTER INSERT ON err
    BEGIN
        DELETE FROM err WHERE id NOT IN (SELECT id FROM err ORDER BY rowid DESC LIMIT 1000);
    END;`);
});

let socket = '';

async function getlogs(){
    if (ws_connected) {
        console.log('ws connected');
        add_log('已连接到服务器，如果没有日志，请检查容器是否运行，或者刷新页面');
        return;
    }
    ws_connected = true;
    // 连接到ws服务器
    socket = io(window.location.origin);
    // 监听服务器发送的消息
    socket.on('log', function (data) {
        add_log(data);
    });

    socket.on('info', function(data){
        add_log(data, 'info');
    });
    socket.on('error', function(data){
        add_log(data, 'error');
    });

    socket.on('warning', function(data){
        add_log(data, 'warning');
    });
    // 断开重连
    socket.on('disconnect', function () {
        ws_connected = false;
        console.log('disconnect');
    });

    // 添加日志行
    function add_log(log, type = 'info') {
        let log_line = `<span data-type="${type}">${log}</span>\n`;
        let scroll_to_bottom = false;
        let log_div = document.getElementById('logs');
        if (log_div.scrollHeight - log_div.scrollTop <= log_div.clientHeight + 10) {
            scroll_to_bottom = true;
        }
        log_div.innerHTML += log_line;
        let log_container = document.querySelector('[name="container"][id="one-logs"]');
        log_container.style.height = 'auto';
        // 如果已经滚动到底部，保持滚动到底部
        if (scroll_to_bottom) {
            log_div.scrollTop = log_div.scrollHeight;
        }
        // 如果日志太多，删除前面的日志
        // if (log_div.children.length > 100) {
        //     log_div.removeChild(log_div.children[0]);
        // }
    }
}

function clearlogs(){
    let log_div = document.getElementById('logs');
    log_div.innerHTML = '';
}

function stoplogs(){
    ws_connected = false;
    socket.disconnect();
}