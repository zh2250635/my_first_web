require('dotenv').config();
const { Client } = require('ssh2');
const sqlite3 = require('sqlite3').verbose();

// 初始化一个内存数据库 
/**
 * Initializes the database and creates necessary tables and triggers.
 * @returns {sqlite3.Database} The initialized database object.
 */
const initDB = () => {
    const db = new sqlite3.Database(':memory:');

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

    return db;
}

// 初始化数据库
const db = initDB();

const host = process.env.DOCKER_HOST;
const username = process.env.DOCKER_USER;
const password = process.env.DOCKER_PASSWD;
const image = process.env.DOCKER_IMAGE_NAME;
const command = `docker ps --filter "ancestor=${image}" --format "{{.ID}}" | xargs -I {} docker logs --tail 1 -f {}`;

// 如果任意一个环境变量为空，则不使用该服务
if (!host || !username || !password || !image) {
    console.log(`目前的环境变量为：host=${host}, username=${username}, password=${password}, image=${image}，缺少环境变量，不使用日志服务`);
    module.exports = (io) => {
        io.on('connection', (socket) => {
            socket.emit('info', '缺少环境变量，服务不可用');
        });
    }
}else{
    module.exports = (io) => {
        let ready = false;
        io.on('connection', (socket) => {
            console.log('a user connected');
            const conn = new Client();
            socket.emit('info', '欢迎使用日志服务，正在连接到服务器...');
            socket.on('disconnect', () => {
                console.log('user disconnected');
                // 断开连接
                conn.end();
                console.log('ssh end');
                ready = false;
            });

            // 运行命令
            function runCommand(conn, command, socket, readys = true) {
                if (!readys) {
                    console.log('ssh not ready');
                    return;
                }
                socket.emit('info', '已连接到服务器，正在获取日志...');
                // 如果已经连接到服务器，运行命令
                conn.exec(command, (err, stream) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    stream.on('data', (data) => {
                        let log = data.toString();
                        // 如果日志不为空且以[GIN]开头，则为我们需要的日志
                        if (log && log.startsWith('[GIN]')) {
                            handelGin(log);
                        }else if (log && log.startsWith('[INFO]')) {
                            handelInfo(log);
                        }else if (log && log.startsWith('[ERR]')) {
                            handelErr(log);
                        }
                    });
                    stream.on('close', () => {
                        console.log('stream close');
                        runCommand(conn, command, socket, ready);
                    });

                    function handelGin(log) {
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
                                        socket.emit('error',`${row.time} ${row.msg}`);
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
                                        socket.emit('error',(`${row.time} ${row.msg}`));
                                    }
                                }
                            });
                            // 打印美化后的日志，不打印id和ip，耗时放到最后，方便查看, 并且将状态码标红
                            socket.emit('error',(`${time} ${statusCode} ${methodAndPath} ${timeCost}`));
                        }else {
                            // 打印美化后的日志，不打印id和ip，耗时放到最后，方便查看
                            socket.emit('info',(`${time} ${statusCode} ${methodAndPath} ${timeCost}`));
                        }
                    }

                    function handelErr(log) {
                        log = log.replace('[ERR] ', '');
                        let logArr = log.split('|');
                        let time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
                        let id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
                        let msg = logArr.length > 2 ? logArr[2].trim() : '未知信息';
                    
                        // 将日志写入数据库的err表中
                        db.run(`INSERT INTO err VALUES (?,?,?)`, [time, id, msg]);
                    }

                    function handelInfo(log) {
                        log = log.replace('[INFO] ', '');
                        let logArr = log.split('|');
                        let time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
                        let id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
                        let msg = logArr.length > 2 ? logArr[2].trim() : '未知信息';
                    
                        // 将日志写入数据库的info表中
                        db.run(`INSERT INTO info VALUES (?,?,?)`, [time, id, msg]);
                    }
                });
            }
            
            // 连接到ssh服务器
            conn.connect({
                host: host,
                username: username,
                password: password
            }).on('ready', () => {
                console.log('ssh ready');
                ready = true;
                runCommand(conn, command, socket, ready);
            });

            conn.on('error', (err) => {
                console.log(err);
            });
        });
    }
}