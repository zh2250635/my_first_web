require('dotenv').config();
const { Client } = require('ssh2');
const sqlite3 = require('sqlite3').verbose();
const Docker = require('dockerode');
const { PassThrough } = require('stream');

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
            let docker = '';
            console.log('a user connected');
            socket.emit('info', '欢迎使用日志服务，正在连接到服务器...');
            socket.on('disconnect', () => {
                // 回收资源
                docker = '';
                console.log('user disconnected');
                ready = false;
            });
            // 创建一个新的docker连接
            docker = new Docker({
                protocol: 'ssh', // 使用ssh协议连接docker服务器
                host: host,
                port: 22,
                username: username,
                password: password
            });
            try {
                // 连接到docker服务器
                docker.ping((err, data) => {
                    if (err) {
                        console.error(err);
                        socket.emit('error', '连接到服务器失败');
                    }else {
                        ready = true;
                        socket.emit('info', '连接到服务器成功');
                        try {
                            listenLog();
                        }catch (error) {
                            console.error(error);
                        }
                    }
                });
            } catch (error) {
                console.error(error);
                socket.emit('error', `连接到服务器失败，错误信息：${error}`);
            }

            function listenLog() {
                // 监听日志
                if (ready && docker) {
                    const logStream = new PassThrough();

                    let container_id = ''
                    socket.emit('info', '正在查找容器id... ')

                    // 获取所有的容器，根据容器的信息，找到对应的容器获取日志
                    docker.listContainers((err, containers) => {
                        if (err) {
                            console.error(err);
                        }else {
                            containers.forEach(containerInfo => {
                                if (containerInfo.Image.indexOf(image) > -1) {
                                    container_id = containerInfo.id
                                    if (!docker){
                                        console.log('docker is not ready')
                                        return
                                    }
                                    const container = docker.getContainer(containerInfo.Id);
                                    container.logs({
                                        follow: true,
                                        stdout: true,
                                        stderr: true,
                                        tail: 0
                                    }, (err, stream) => {
                                        if (err) {
                                            console.error(err);
                                        }else {
                                            container.modem.demuxStream(stream, logStream, logStream);
                                        }
                                    });
                                    socket.emit('info','日志流开始传输')
                                }
                            });
                        }
                    });

                    let lastLog = '';

                    // 监听日志流
                    logStream.on('data', (chunk) => {
                        let logstr = lastLog + chunk.toString();
                        // 将日志划分为一行一行的
                        const logs = logstr.split('\n');
                        // 逐行处理日志
                        for (let i = 0; i < logs.length - 1; i++) {
                            let log = logs[i];
                            // 如果是gin日志
                            if (log.indexOf('[GIN]') > -1) {
                                handelGin(log);
                            }else if (log.indexOf('[ERR]') > -1) {
                                handelErr(log);
                            }else if (log.indexOf('[INFO]') > -1) {
                                handelInfo(log);
                            }
                        }
                        // 将最后一行的日志保存下来
                        lastLog = logs[logs.length - 1];
                    });
                }
            }

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
                    db.get(`SELECT * FROM info where id = ?`, [id], (err, row) => {
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
                                // console.log(`${row.time} ${row.msg}`);
                            }
                        }
                    });
                    // 打印美化后的日志，不打印id和ip，耗时放到最后，方便查看
                    socket.emit('error',(`${time} ${statusCode} ${methodAndPath} ${timeCost}`));
                    // console.log(`${time} ${statusCode} ${methodAndPath} ${timeCost}`);
                }else {
                    // 打印美化后的日志，不打印id和ip，耗时放到最后，方便查看
                    socket.emit('info',(`${time} ${statusCode} ${methodAndPath} ${timeCost}`));
                }
            }

            function handelErr(log) {
                log = log.replace('[ERR]', '');
                let logArr = log.split('|');
                let time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
                let id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
                let msg = logArr.length > 2 ? logArr[2].trim() : '未知信息';
            
                // 将日志写入数据库的err表中
                db.run(`INSERT INTO err VALUES (?,?,?)`, [time, id, msg]);
            }

            function handelInfo(log) {
                log = log.replace('[INFO]', '');
                let logArr = log.split('|');
                let time = logArr.length > 0 ? logArr[0].trim() : '未知时间';
                let id = logArr.length > 1 ? logArr[1].trim() : '未知ID';
                let msg = logArr.length > 2 ? logArr[2].trim() : '未知信息';
            
                // 将日志写入数据库的info表中
                db.run(`INSERT INTO info VALUES (?,?,?)`, [time, id, msg]);
            }
        });
    }
}