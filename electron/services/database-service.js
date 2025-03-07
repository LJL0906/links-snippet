const path = require('path');
const fs = require('fs');

// 尝试导入better-sqlite3
let Database;
let useFallback = false;
let fallbackDatabase;

try {
  Database = require('better-sqlite3');
} catch (error) {
  console.error('better-sqlite3加载失败，将尝试备用方案:', error.message);
  useFallback = true;
  try {
    fallbackDatabase = require('./database-fallback');
  } catch (fallbackError) {
    console.error('备用数据库模块未找到:', fallbackError.message);
  }
}

/**
 * 初始化数据库
 * @param {string} dbPath - 数据库文件路径
 * @returns {Object} 数据库连接对象
 */
exports.initDatabase = async (dbPath) => {
  try {
    console.log('初始化数据库，路径:', dbPath);
    
    // 确保数据库目录存在
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      console.log('创建数据库目录:', dbDir);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbExists = fs.existsSync(dbPath);
    console.log('数据库文件是否存在:', dbExists);

    let db;
    
    if (useFallback && fallbackDatabase) {
      // 使用SQL.js备用方案
      db = await fallbackDatabase.initFallbackDatabase(dbPath);
      console.log('使用SQL.js备用数据库初始化成功');
    } else {
      // 创建数据库连接，better-sqlite3 使用同步 API
      db = new Database(dbPath, { 
        verbose: console.log,
        fileMustExist: false
      });
      
      // 如果是新数据库，创建表
      if (!dbExists) {
        // 创建示例表，包含sort_order字段
        db.exec(`CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          category TEXT,
          sort_order INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
      } else {
        // 检查并添加sort_order列
        const columns = db.prepare("PRAGMA table_info(links)").all();
        const hasColumn = columns.some(col => col.name === 'sort_order');
        
        if (!hasColumn) {
          console.log("添加sort_order列");
          db.exec("ALTER TABLE links ADD COLUMN sort_order INTEGER");
          console.log("成功添加sort_order列");
        }
      }
      
      console.log('已成功连接到SQLite数据库');
    }

    return db;
  } catch (error) {
    console.error('初始化数据库时发生错误:', error);
    // 出错时创建内存数据库作为备选
    return createMockDatabase();
  }
};

/**
 * 在应用关闭时安全关闭数据库连接
 * @param {Object} db - 数据库连接对象
 */
exports.closeDatabase = (db) => {
  if (db && typeof db.close === 'function') {
    try {
      db.close();
      console.log('数据库连接已关闭');
    } catch (err) {
      console.error('关闭数据库时出错:', err.message);
    }
  }
};

/**
 * 创建模拟数据库对象，防止应用崩溃
 */
function createMockDatabase() {
  return {
    exec: () => {},
    prepare: () => ({
      all: () => [],
      get: () => null,
      run: () => ({ lastInsertRowid: -1, changes: 0 })
    }),
    close: () => {},
    transaction: (fn) => () => []
  };
}
