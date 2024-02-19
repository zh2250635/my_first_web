const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const logDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
    constructor(logFileName) {
        this.logFileName = logFileName;
        this.logStream = fs.createWriteStream(path.join(logDir, logFileName), { flags: 'a' });
    }

    log(level, content) {
        const time = moment().tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm:ss");
        this.logStream.write(`[${level}][${time}] ${content}\n\n`);
        console.log(`[${this.logFileName}][${level}][${time}] ${content}`);
    }

    info(content) {
        this.log('INFO', content);
    }

    error(content) {
        this.log('ERROR', content);
    }
}

module.exports = Logger;
