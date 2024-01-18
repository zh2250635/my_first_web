const {parentPort, workerData} = require('worker_threads');
const { main } = require('./requirements/deploy.js')
const fs = require('fs')
const mysql = require('mysql')
const logger = require('./requirements/logger.js')
const log = new logger('AutoWorker.log')
require('dotenv').config()

// 连接数据库
function connect_db() {
    let connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWD,
        database: process.env.DB_NAME
    })
    connection.connect()
    return connection
}

function set_used(tag){
    let connection = connect_db()
    let sql = `UPDATE rbac set used = 1 WHERE tag = '${tag}';`
    connection.query(sql, (err, result) => {
        if (err) {
            log.error(err)
        }
    })
    connection.end()
}

log.info('AutoWorker started')

log.info(typeof workerData)

let lock_path = workerData.lock_path
let tag = workerData.result.tag
let info = JSON.stringify(workerData.result.info)
console.log(info,typeof info)

// 发送消息给主线程
parentPort.postMessage({msg: 'AutoWorker started', code: 0});

main(info, tag).then((result) => {
    // 删除锁文件
    fs.unlinkSync(lock_path)
    log.info('AutoWorker finished')
    set_used(tag)
}).catch((err) => {
    // 删除锁文件
    fs.unlinkSync(lock_path)
    log.error(err)
    log.info('AutoWorker finished')
    set_used(tag)
})