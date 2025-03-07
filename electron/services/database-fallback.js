/**
 * SQL.js�������ݿ�ʵ��
 * ��better-sqlite3�޷�����ʱʹ��
 */
const fs = require('fs');
const path = require('path');

// SQL.js������Ҫʱ��̬����
let initSqlJs;
try {
  initSqlJs = require('sql.js');
} catch (e) {
  console.error('SQL.jsδ��װ����Ҫ����npm install sql.js');
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
      
      // ����ļ����ڣ���ȡ����
      let buffer;
      if (fs.existsSync(this.dbPath)) {
        buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } else {
        // ���������ݿ�
        this.db = new SQL.Database();
        
        // ������
        this.db.run(`CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          category TEXT,
          sort_order INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // ���浽�ļ�
        this._saveDb();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('SQL.js��ʼ��ʧ��:', error);
      throw error;
    }
  }

  _saveDb() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      
      // ȷ��Ŀ¼����
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('�������ݿ�ʧ��:', error);
    }
  }

  prepare(sql) {
    if (!this.initialized) {
      throw new Error('���ݿ�δ��ʼ��');
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
          console.error('SQL��ѯ����:', error);
          return [];
        }
      },
      
      run: (params = []) => {
        try {
          const stmt = this.db.prepare(sql);
          stmt.bind(params);
          
          stmt.step();
          stmt.free();
          
          // ���޸����ݺ󱣴浽�ļ�
          this._saveDb();
          
          return { 
            lastInsertRowid: this.db.exec("SELECT last_insert_rowid()")[0].values[0][0],
            changes: this.db.exec("SELECT changes()")[0].values[0][0]
          };
        } catch (error) {
          console.error('SQLִ�д���:', error);
          return { lastInsertRowid: -1, changes: 0 };
        }
      }
    };
  }
  
  exec(sql) {
    if (!this.initialized) {
      throw new Error('���ݿ�δ��ʼ��');
    }
    
    try {
      this.db.exec(sql);
      this._saveDb();
    } catch (error) {
      console.error('ִ��SQLʧ��:', error);
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
  console.log('ʹ��SQL.js�������ݿ�...');
  const adapter = new SqlJsAdapter(dbPath);
  await adapter.initialize();
  return adapter;
};
