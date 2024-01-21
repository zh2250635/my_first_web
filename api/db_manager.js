const mysql = require('mysql');
require('dotenv').config();

class DatabaseConnectionManager {
  constructor() {
    this.connections = {
      oneapi: { connection: this.createConnection('oneapi'), queue: [] },
      az_accounts: { connection: this.createConnection('az_accounts'), queue: [] },
    };
  }

  createConnection(dbName) {
    if (dbName === 'oneapi') {
        return mysql.createConnection({
            host: process.env.ONE_DB_HOST,
            user: process.env.ONE_DB_USER,
            password: process.env.ONE_DB_PASSWD,
            database: process.env.ONE_DB_NAME,
            port: process.env.ONE_DB_PORT || 3306,
        });
    } else if (dbName === 'az_accounts') {
        return mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
        });
    }
  }

  run(dbName, sql) {
    return new Promise((resolve, reject) => {
      const db = this.connections[dbName];
      if (!db) {
        reject(new Error(`Unknown database: ${dbName}`));
        return;
      }

      db.queue.push({ sql, resolve, reject });

      this.processQueue(db);
    });
  }

  processQueue(db) {
    if (db.processing || db.queue.length === 0) {
      return;
    }

    db.processing = true;

    const task = db.queue.shift();
    db.connection.query(task.sql, (error, results) => {
      db.processing = false;

      if (error) {
        task.reject(error);
      } else {
        task.resolve(results);
      }

      this.processQueue(db);
    });
  }

  close() {
    Object.values(this.connections).forEach(db => {
      db.connection.end();
    });
  }
}

module.exports = new DatabaseConnectionManager();