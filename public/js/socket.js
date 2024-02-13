let ws_connected = false;
let db = null;
// 初始化SQL.js
initSqlJs().then(function(SQL){
    // 连接到数据库
    db = new SQL.Database();
    // 创建gin表和info表以及err表
    db.run(`CREATE TABLE gin (
        time TEXT,
        id TEXT,
        statusCode TEXT,
        ip TEXT,
        methodAndPath TEXT
    )`, createGinTrigger);

    db.run(`CREATE TABLE info (
        time TEXT,
        id TEXT,
        msg TEXT
    )`, createInfoTrigger);

    db.run(`CREATE TABLE err (
        time TEXT,
        id TEXT,
        msg TEXT
    )`, createErrTrigger);
    
    // 创建触发器，用于删除多余的日志
    function createGinTrigger() {
        db.run(`CREATE TRIGGER delete_row_gin AFTER INSERT ON gin
        BEGIN
            DELETE FROM gin WHERE id NOT IN (SELECT id FROM gin ORDER BY rowid DESC LIMIT 1000);
        END;`);
    }

    function createInfoTrigger() {
        db.run(`CREATE TRIGGER delete_row_info AFTER INSERT ON info
        BEGIN
            DELETE FROM info WHERE id NOT IN (SELECT id FROM info ORDER BY rowid DESC LIMIT 1000);
        END;`);
    }

    function createErrTrigger() {
        db.run(`CREATE TRIGGER delete_row_err AFTER INSERT ON err
        BEGIN
            DELETE FROM err WHERE id NOT IN (SELECT id FROM err ORDER BY rowid DESC LIMIT 1000);
        END;`);
    }
});
async function getlogs(){
    if (ws_connected) {
        console.log('ws connected');
        add_log('已连接到服务器，如果没有日志，请检查容器是否运行，或者刷新页面');
        return;
    }
    ws_connected = true;
    // 连接到ws服务器
    let socket = io(window.location.origin);
    // 监听服务器发送的消息
    socket.on('log', function (data) {
        let log = data.toString();
        if (log && log.startsWith('[GIN]')) {
            handelGin(log);
        }else if (log && log.startsWith('[INFO]')) {
            handelInfo(log);
        }else if (log && log.startsWith('[ERR]')) {
            handelErr(log);
        }
    });

    socket.on('info', function(data){
        add_log(data, 'info');
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
        log_container.style.width = 'auto';
        log_container.style.height = 'auto';
        // 如果已经滚动到底部，保持滚动到底部
        if (scroll_to_bottom) {
            log_div.scrollTop = log_div.scrollHeight;
        }
        // 如果日志太多，删除前面的日志
        if (log_div.children.length > 100) {
            log_div.removeChild(log_div.children[0]);
        }
    }

    // 处理gin日志
    function handelGin(log){
        // 去除日志前缀
        log = log.replace('[GIN] ', '');
        // 用|分割日志
        const logArr = log.split('|');
        // 优雅地提取信息，确保不会因为数组索引不存在而出错
        const time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
        const id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
        const statusCode = logArr.length > 2 ? logArr[2].trim() : '未知状态码';
        const timeCost = logArr.length > 3 ? logArr[3].trim() : '未知耗时';
        const ip = logArr.length > 4 ? logArr[4].trim() : '未知IP';
        const methodAndPath = logArr.length > 5 ? logArr[5].trim() : '未知方法和路径';

        // 将日志写入数据库的gin表中
        db.run(`INSERT INTO gin VALUES (?,?,?,?,?)`, [time, id, statusCode, ip, methodAndPath]);

        // 如果状态码不为200，则根据id在info和err表中查找对应的日志信息
        if (statusCode !== '200') {
            // 根据id在info表中查找对应的日志信息
            db.get(`SELECT * FROM info WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.error(err);
                }else {
                    // 如果找到了对应的日志信息，则打印出来
                    if (row) {
                        add_log(`${row.time} ${row.msg}`, 'error')
                    }
                }
            });

            // 根据id在err表中查找对应的日志信息
            db.get(`SELECT * FROM err WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.error(err);
                }else {
                    // 如果找到了对应的日志信息，则打印出来
                    if (row) {
                        add_log(`${row.time} ${row.msg}`, 'error')
                    }
                }
            });
            // 打印美化后的日志，不打印id和ip，耗时放到最后，方便查看, 并且将状态码标红
            add_log(`${time} ${statusCode} ${methodAndPath} ${timeCost}`, 'error')
        }else {
            // 打印美化后的日志，不打印id和ip，耗时放到最后，方便查看
            add_log(`${time} ${statusCode} ${methodAndPath} ${timeCost}`, 'info')
        }
    }

    // 处理info日志
    const handelInfo = (log) => {
        log = log.replace('[INFO] ', '');
        let logArr = log.split('|');
        let time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
        let id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
        let msg = logArr.length > 2 ? logArr[2].trim() : '未知信息';
    
        // 将日志写入数据库的info表中
        db.run(`INSERT INTO info VALUES (?,?,?)`, [time, id, msg]);
    }

    // 处理err日志
    const handelErr = (log) => {
        log = log.replace('[ERR] ', '');
        let logArr = log.split('|');
        let time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
        let id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
        let msg = logArr.length > 2 ? logArr[2].trim() : '未知错误';
    
        // 将日志写入数据库的err表中
        db.run(`INSERT INTO err VALUES (?,?,?)`, [time, id, msg]);
    }
}