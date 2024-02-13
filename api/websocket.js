require('dotenv').config();
const { Client } = require('ssh2');

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
                        socket.emit('log', data.toString());
                    });
                    stream.on('close', () => {
                        console.log('stream close');
                        runCommand(conn, command, socket, ready);
                    });
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