/**
 * SQL.js备用数据库实现
 * 当better-sqlite3无法编译时使用
 */
const fs = require('fs');
const path = require('path');

// SQL.js会在需要时动态加载
let initSqlJs;
try {
  initSqlJs = require('sql.js');
} catch (e) {
  console.error('SQL.js未安装，需要运行npm install sql.js');
}

class SqlJsAdapter {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const SQL = await initSqlJs();
      
      // 如果文件存在，读取数据
      let buffer;
      if (fs.existsSync(this.dbPath)) {
        buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } else {
        // 创建新数据库
        this.db = new SQL.Database();
        
        // 创建表
        this.db.run(`CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          category TEXT,
          sort_order INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // 保存到文件
        this._saveDb();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('SQL.js初始化失败:', error);
      throw error;
    }
  }

  _saveDb() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      
      // 确保目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('保存数据库失败:', error);
    }
  }

  prepare(sql) {
    if (!this.initialized) {
      throw new Error('数据库未初始化');
    }
    
    return {
      all: (params = []) => {
        try {
          const stmt = this.db.prepare(sql);
          stmt.bind(params);
          
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        } catch (error) {
          console.error('SQL查询错误:', error);
          return [];
        }
      },
      
      run: (params = []) => {
        try {
          const stmt = this.db.prepare(sql);
          stmt.bind(params);
          
          stmt.step();
          stmt.free();
          
          // 在修改数据后保存到文件
          this._saveDb();
          
          return { 
            lastInsertRowid: this.db.exec("SELECT last_insert_rowid()")[0].values[0][0],
            changes: this.db.exec("SELECT changes()")[0].values[0][0]
          };
        } catch (error) {
          console.error('SQL执行错误:', error);
          return { lastInsertRowid: -1, changes: 0 };
        }
      }
    };
  }
  
  exec(sql) {
    if (!this.initialized) {
      throw new Error('数据库未初始化');
    }
    
    try {
      this.db.exec(sql);
      this._saveDb();
    } catch (error) {
      console.error('执行SQL失败:', error);
      throw error;
    }
  }
  
  close() {
    if (this.db) {
      this._saveDb();
      this.db.close();
    }
  }
}

exports.initFallbackDatabase = async (dbPath) => {
  console.log('使用SQL.js备用数据库...');
  const adapter = new SqlJsAdapter(dbPath);
  await adapter.initialize();
  return adapter;
};
