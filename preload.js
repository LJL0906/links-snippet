const { contextBridge, ipcRenderer, shell } = require('electron')

// 确保 ipcRenderer 支持这些方法
const safeIpcRenderer = {
  invoke: (channel, ...args) => {
    const validChannels = [
      'db:query', 'db:execute',
      'app:version',
      'window:minimize', 'window:close', 'window:hide', 'window:show', 'window:toggle-visibility',
      'file:export-data', 'file:import-data', 'file:read-json',
      'open-external-url', 'fetch:html'
    ];
    
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    
    return Promise.reject(new Error(`无效的 IPC 通道: ${channel}`));
  },
  on: (channel, listener) => {
    const validChannels = ['menu:export-data', 'menu:import-data', 'menu:add-link'];
    if (validChannels.includes(channel)) {
      // 由于无法直接移除特定监听器，这里使用一个包装器
      const wrappedListener = (_, ...args) => listener(...args);
      ipcRenderer.on(channel, wrappedListener);
      // 返回一个函数用于移除监听器
      return () => {
        ipcRenderer.removeListener(channel, wrappedListener);
      };
    }
  },
  // 添加一个调试方法
  send: (channel, ...args) => {
    console.log('尝试发送IPC消息:', channel);
    return ipcRenderer.send(channel, ...args);
  },
  // 这个方法用于确认IPC可用性
  ping: () => {
    console.log('IPC Ping...检查IPC连接');
    return 'pong';
  }
};

// 记录API调用以便调试
const logApiCall = (name, ...args) => {
  const argStr = args.length > 0 ? JSON.stringify(args).slice(0, 100) : '无参数';
  console.log(`调用API: ${name}, 参数: ${argStr}`);
  return ipcRenderer.invoke(name, ...args)
    .then(result => {
      console.log(`API ${name} 调用成功`);
      return result;
    })
    .catch(err => {
      console.error(`API ${name} 调用失败:`, err);
      throw err;
    });
};

// 添加一个调试函数，用来检测IPC处理程序是否存在
const checkHandler = async (name) => {
  try {
    await ipcRenderer.invoke(name);
    return true;
  } catch (error) {
    console.error(`处理程序 '${name}' 检查失败:`, error);
    return false;
  }
};

// 添加系统诊断功能
async function runSystemCheck() {
  try {
    console.log('运行系统检查...');
    
    // 检查IPC功能
    const features = await ipcRenderer.invoke('app:check-features').catch(e => {
      console.error('功能检查失败:', e);
      return { database: false, backupAPI: false, fileSystem: false };
    });
    
    console.log('系统功能状态:', features);
    
    // 尝试简单的数据库查询
    try {
      console.log('测试数据库连接...');
      const dbTest = await ipcRenderer.invoke('db:query', 'SELECT 1 as test', []);
      console.log('数据库连接测试结果:', dbTest);
    } catch (dbError) {
      console.error('数据库测试失败:', dbError);
    }
    
    return features;
  } catch (error) {
    console.error('系统检查失败:', error);
    return { error: error.message };
  }
}

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 系统诊断功能
  checkSystem: () => runSystemCheck(),
  
  // 数据库操作
  queryDatabase: (sql, params) => logApiCall('db:query', sql, params),
  executeDatabase: (sql, params) => logApiCall('db:execute', sql, params),
  
  // 系统操作
  getAppVersion: () => logApiCall('app:version'),
  
  // 窗口控制
  minimizeWindow: () => logApiCall('window:minimize'),
  closeWindow: () => logApiCall('window:close'),
  hideWindow: () => logApiCall('window:hide'),
  showWindow: () => logApiCall('window:show'),
  toggleWindowVisibility: () => logApiCall('window:toggle-visibility'),
  
  // 文件操作 - 数据导入导出
  exportData: (data) => logApiCall('file:export-data', data),
  importData: () => logApiCall('file:import-data'),
  readJsonFile: () => logApiCall('file:read-json'),
  
  // 链接打开处理
  openExternal: (url) => {
    try {
      console.log('正在打开链接:', url);
      // 直接使用 shell 模块
      return shell.openExternal(url);
    } catch (error) {
      console.error('直接打开链接错误:', error);
      // 如果直接调用失败，尝试通过 IPC
      return logApiCall('open-external-url', url);
    }
  },
  
  // 添加HTML获取功能
  fetchHtml: (url) => logApiCall('fetch:html', url),
  
  // 菜单事件监听
  onMenuExport: (callback) => safeIpcRenderer.on('menu:export-data', callback),
  onMenuImport: (callback) => safeIpcRenderer.on('menu:import-data', callback),
  onMenuAddLink: (callback) => safeIpcRenderer.on('menu:add-link', callback),
  
  // 备份相关API
  getDefaultBackupPath: () => logApiCall('get-default-backup-path'),
  selectBackupDirectory: () => logApiCall('select-backup-directory'),
  createBackup: (links, backupPath, includeSortInfo, compressBackup) => 
    logApiCall('create-backup', links, backupPath, includeSortInfo, compressBackup),
  getBackupHistory: (backupPath) => logApiCall('get-backup-history', backupPath),
  deleteBackup: (backupPath) => logApiCall('delete-backup', backupPath),
  restoreBackup: (backupPath) => logApiCall('restore-backup', backupPath),
  showItemInFolder: (itemPath) => logApiCall('show-item-in-folder', itemPath),
  
  // 调试方法
  debug: {
    ping: safeIpcRenderer.ping,
    send: safeIpcRenderer.send
  },
  checkIpcHandler: checkHandler
});

// 应用启动时运行诊断
setTimeout(async () => {
  console.log('应用启动诊断开始...');
  await runSystemCheck();
}, 2000);

// 直接暴露 electron shell 对象（安全版本）
contextBridge.exposeInMainWorld('electronShell', {
  openExternal: (url) => {
    try {
      console.log('尝试通过 electronShell 打开链接:', url);
      return shell.openExternal(url).catch(error => {
        console.error('electronShell 打开链接失败:', error);
        return Promise.reject(error);
      });
    } catch (error) {
      console.error('electronShell 调用错误:', error);
      return Promise.reject(error);
    }
  }
});

// 添加一个全局调试对象
contextBridge.exposeInMainWorld('electronDebug', {
  info: {
    versions: process.versions,
    platform: process.platform
  }
});

// 添加一个用于处理IPC错误的函数
process.on('uncaughtException', (error) => {
  console.error('Preload脚本未捕获的异常:', error);
});

// 在页面完全加载后检查所有处理程序
window.addEventListener('DOMContentLoaded', () => {
  console.log('正在检查IPC处理程序...');
  setTimeout(async () => {
    const handlers = [
      'get-default-backup-path',
      'select-backup-directory', 
      'create-backup',
      'get-backup-history',
      'delete-backup',
      'restore-backup',
      'show-item-in-folder'
    ];
    
    for (const handler of handlers) {
      try {
        console.log(`检查处理程序: ${handler} - ${await checkHandler(handler) ? '可用' : '不可用'}`);
      } catch (error) {
        console.error(`处理程序 ${handler} 不可用:`, error);
      }
    }
  }, 1000);
});

// 通知主进程preload已加载
ipcRenderer.send('preload-loaded');
console.log('preload.js 已加载');

// 添加诊断功能
const runDiagnostics = async () => {
  console.log('======= 开始应用程序诊断 =======');
  
  // 检查API是否可用
  console.log('1. 检查electronAPI可用性');
  if (window.electronAPI) {
    console.log('✓ electronAPI已定义');
    
    // 列出所有可用函数
    const functions = Object.keys(window.electronAPI);
    console.log(`✓ 共有${functions.length}个API函数可用:`, functions);
    
    // 尝试数据库连接
    console.log('2. 检查数据库连接');
    try {
      const result = await window.electronAPI.queryDatabase('SELECT 1 as test', []);
      console.log('✓ 数据库连接成功:', result);
    } catch (error) {
      console.error('✗ 数据库连接失败:', error);
    }
    
    // 检查备份API
    console.log('3. 检查备份API');
    try {
      const backupPath = await window.electronAPI.getDefaultBackupPath();
      console.log('✓ 备份API可用，默认路径:', backupPath);
    } catch (error) {
      console.error('✗ 备份API不可用:', error);
    }
  } else {
    console.error('✗ electronAPI未定义');
  }
  
  console.log('======= 诊断完成 =======');
};

// 延迟执行诊断
setTimeout(runDiagnostics, 3000);
