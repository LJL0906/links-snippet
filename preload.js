const { contextBridge, ipcRenderer, shell } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 数据库操作
  queryDatabase: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  executeDatabase: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  
  // 系统操作
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleWindowVisibility: () => ipcRenderer.invoke('window:toggle-visibility'),
  
  // 文件操作 - 数据导入导出
  exportData: (data) => ipcRenderer.invoke('file:export-data', data),
  importData: () => ipcRenderer.invoke('file:import-data'),
  readJsonFile: () => ipcRenderer.invoke('file:read-json'),
  
  // 优化打开外部链接功能
  openExternal: (url) => {
    if (url === 'about:blank') {
      // 特殊处理空白页面
      return ipcRenderer.invoke('open-external-url', url);
    }
    
    console.log('正在打开链接:', url);
    try {
      return shell.openExternal(url);
    } catch (error) {
      console.error('打开链接错误:', error);
      return Promise.reject(error);
    }
  },
  
  // 关于和其他菜单项
  showAbout: () => ipcRenderer.send('menu:show-about'),
  
  // 设置菜单通信处理器
  onMenuExport: (callback) => ipcRenderer.on('menu:export-data', callback),
  onMenuImport: (callback) => ipcRenderer.on('menu:import-data', callback),
  onMenuAddLink: (callback) => ipcRenderer.on('menu:add-link', callback)
})
