const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * 设置IPC通信处理器
 * @param {Object} db - 数据库连接对象
 * @param {Object} app - Electron app 对象
 * @param {Object} mainWindow - 主窗口对象
 */
exports.setupIPC = (db, app, mainWindow) => {
  console.log('设置IPC通信...');
  
  // 添加功能检测IPC处理程序 
  ipcMain.handle('app:check-features', async () => {
    const features = {
      database: Boolean(db),
      fileSystem: true
    };
    
    console.log('功能检测结果:', features);
    return features;
  });
  
  // 数据库查询 - 修改为适配 better-sqlite3
  ipcMain.handle('db:query', async (event, sql, params) => {
    try {
      if (!db) {
        console.error('数据库未连接');
        throw new Error('数据库未连接');
      }
      
      console.log('执行数据库查询:', sql, params);
      // better-sqlite3 使用 prepare 和 all
      const stmt = db.prepare(sql);
      const rows = stmt.all(params);
      return rows;
    } catch (err) {
      console.error('数据库查询错误:', err);
      throw err;
    }
  });

  // 数据库执行 - 修改为适配 better-sqlite3
  ipcMain.handle('db:execute', async (event, sql, params) => {
    try {
      if (!db) {
        throw new Error('数据库未连接');
      }
      
      const stmt = db.prepare(sql);
      const result = stmt.run(params);
      return { 
        lastID: result.lastInsertRowid, 
        changes: result.changes 
      };
    } catch (err) {
      console.error('数据库执行错误:', err);
      throw err;
    }
  });

  // 获取应用版本
  ipcMain.handle('app:version', () => app.getVersion());

  // 文件操作 - 数据导出
  ipcMain.handle('file:export-data', async (event, data) => {
    try {
      // 禁用自动隐藏
      global.disableAutoHide();
      
      // 获取当前日期并格式化为YYYYMMDD格式
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '导出数据',
        defaultPath: path.join(app.getPath('downloads'), `infinite-links-${dateStr}.json`),
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      // 恢复自动隐藏
      global.enableAutoHide();
      
      if (canceled || !filePath) {
        return { success: false, message: '已取消导出' };
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, message: '数据已成功导出', path: filePath };
    } catch (error) {
      // 确保出错时也恢复自动隐藏
      global.enableAutoHide();
      console.error('导出数据失败:', error);
      return { success: false, message: '导出失败: ' + error.message };
    }
  });

  // 导入数据功能
  ipcMain.handle('file:import-data', async () => {
    try {
      // 禁用自动隐藏
      global.disableAutoHide();
      
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '导入数据',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      // 恢复自动隐藏
      global.enableAutoHide();
      
      if (canceled || filePaths.length === 0) {
        return { success: false, message: '已取消导入' };
      }

      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const jsonData = JSON.parse(data);
      return { success: true, data: jsonData };
    } catch (error) {
      // 确保出错时也恢复自动隐藏
      global.enableAutoHide();
      console.error('导入数据失败:', error);
      return { success: false, message: '导入失败: ' + error.message };
    }
  });

  // 读取JSON文件功能
  ipcMain.handle('file:read-json', async () => {
    try {
      // 禁用自动隐藏
      global.disableAutoHide();
      
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择JSON文件',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      // 恢复自动隐藏
      global.enableAutoHide();
      
      if (canceled || filePaths.length === 0) {
        return { success: false, message: '已取消选择' };
      }

      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const jsonData = JSON.parse(data);
      return { success: true, data: jsonData };
    } catch (error) {
      // 确保出错时也恢复自动隐藏
      global.enableAutoHide();
      console.error('读取JSON文件失败:', error);
      return { success: false, message: '读取失败: ' + error.message };
    }
  });

  // 窗口控制相关功能
  exports.setupWindowControls(mainWindow);

  // 外部链接和HTML获取 - 注意这里需要传入app参数
  exports.setupExternalHandlers(mainWindow, app);
};

/**
 * 设置窗口控制相关IPC通信
 * @param {Object} mainWindow - 主窗口对象
 */
exports.setupWindowControls = (mainWindow) => {
  // 窗口最小化
  ipcMain.handle('window:minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
      return true;
    }
    return false;
  });

  // 窗口关闭(隐藏)
  ipcMain.handle('window:close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
      return true;
    }
    return false;
  });

  // 窗口隐藏
  ipcMain.handle('window:hide', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
      return true;
    }
    return false;
  });
  
  // 窗口显示
  ipcMain.handle('window:show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      return true;
    }
    return false;
  });

  // 窗口显示/隐藏切换
  ipcMain.handle('window:toggle-visibility', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return false;
    
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    return true;
  });
};

/**
 * 设置外部链接和HTML获取相关IPC通信
 * @param {Object} mainWindow - 主窗口对象
 * @param {Object} app - Electron app 对象
 */
exports.setupExternalHandlers = (mainWindow, app) => {
  // 处理外部链接
  ipcMain.handle('open-external-url', async (event, url) => {
    try {
      // 处理特殊的 about:blank 情况
      if (url === 'about:blank') {
        const defaultUrl = 'https://www.google.com/';
        await shell.openExternal(defaultUrl);
        return true;
      }
      
      // 正常打开URL
      await shell.openExternal(url);
      return true;
    } catch (err) {
      console.error('打开外部链接失败:', err);
      return false;
    }
  });

  // 获取HTML内容
  ipcMain.handle('fetch:html', async (event, url) => {
    try {
      // 设置超时，避免长时间等待
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        }
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      return html;
    } catch (error) {
      console.error('获取HTML失败:', error);
      return null;
    }
  });

  // 添加菜单通信事件处理
  ipcMain.on('menu:show-about', () => {
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      title: '关于',
      message: 'infinite-Links',
      detail: `版本: ${app.getVersion()}\n轻松管理您的链接收藏`,
      buttons: ['确定'],
    });
  });
};
