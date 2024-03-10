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
      console.log('正在连接oneapi数据库');
        return mysql.createConnection({
            host: process.env.ONE_DB_HOST,
            user: process.env.ONE_DB_USER,
            password: process.env.ONE_DB_PASSWD,
            database: process.env.ONE_DB_NAME,
            port: process.env.ONE_DB_PORT || 3306,
        });
    } else if (dbName === 'az_accounts') {
      console.log('正在连接az_accounts数据库');
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

      this.processQueue(db, dbName);
    });
  }

  processQueue(db, dbName) {
    if (db.processing || db.queue.length === 0) {
      return;
    }

    db.processing = true;

    const task = db.queue.shift();
    
    // 尝试select 1，以确保连接可用
    db.connection.query('SELECT 1', (error, results, fields) => {
      if (error) {
        // 如果发生错误，重新连接
        db.connection.end();
        db.connection = this.createConnection(dbName);
        this.connections[dbName] = db;
        task.reject(error);
      } else {
        this.executeTask(db, task);
      }
    });
  }

  executeTask(db, task) {
    db.connection.query(task.sql, (error, results, fields) => {
      if (error) {
        task.reject(error);
      } else {
        task.resolve(results);
      }

      db.processing = false;
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