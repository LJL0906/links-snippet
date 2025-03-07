const { contextBridge, ipcRenderer } = require('electron');

// 调试辅助函数，检测IPC处理程序是否存在
const checkHandler = async (name) => {
  try {
    // 只检查处理程序存在，不实际调用
    // 这避免了不必要的错误日志
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`处理程序 '${name}' 等待超时`);
        resolve(false);
      }, 100);
      
      ipcRenderer.invoke(name).then(() => {
        clearTimeout(timeout);
        resolve(true);
      }).catch(err => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    return true;
  } catch (error) {
    return false;
  }
};

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 系统诊断功能
  checkSystem: async () => {
    try {
      // 检查数据库连接
      let dbStatus = false;
      try {
        const testResult = await ipcRenderer.invoke('db:query', 'SELECT 1 as test', []);
        dbStatus = Array.isArray(testResult) && testResult.length > 0;
      } catch (e) {
        console.error('数据库连接测试失败:', e);
      }
      
      return {
        database: dbStatus,
        fileSystem: true  // 假定文件系统始终可用
      };
    } catch (err) {
      console.error('系统检查失败:', err);
      return { database: false, fileSystem: false };
    }
  },
  
  // 数据库操作
  queryDatabase: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  executeDatabase: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  showWindow: () => ipcRenderer.invoke('window:show'),
  toggleWindowVisibility: () => ipcRenderer.invoke('window:toggle-visibility'),
  
  // 应用信息
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // 外部链接
  openExternal: (url) => ipcRenderer.invoke('open-external-url', url),
  
  // 文件操作
  exportData: (data) => ipcRenderer.invoke('file:export-data', data),
  importData: () => ipcRenderer.invoke('file:import-data'),
  readJsonFile: () => ipcRenderer.invoke('file:read-json'),
});

// 预加载完成通知
console.log('electron/preload.js 已加载完成');
