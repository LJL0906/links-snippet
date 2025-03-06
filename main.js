const { app, BrowserWindow, ipcMain, shell, dialog, Menu, Tray, globalShortcut } = require('electron/main');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
// 添加 Squirrel 启动检查
const { handleSquirrelEvent } = require('./squirrel-startup');

// 在应用启动早期处理 Squirrel 事件
if (handleSquirrelEvent()) {
  app.quit();
}

// 全局变量
let mainWindow = null;
let tray = null;
let isQuitting = false;
// 添加标志判断是否是自启动
let isAutoLaunch = false;

// 确保数据目录存在
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');

// 创建数据库连接
let db = null;

function initDatabase() {
  const dbExists = fs.existsSync(dbPath);

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('数据库连接失败:', err.message);
    else console.log('已连接到SQLite数据库');
  });

  // 如果是新数据库，创建表
  if (!dbExists) {
    db.serialize(() => {
      // 创建示例表
      db.run(`CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }
}

// 设置IPC通信
function setupIPC() {
  // 数据库查询
  ipcMain.handle('db:query', async (event, sql, params) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // 数据库执行
  ipcMain.handle('db:execute', async (event, sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  });

  // 获取应用版本
  ipcMain.handle('app:version', () => app.getVersion());

  // 导出数据功能
  ipcMain.handle('file:export-data', async (event, data) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '导出数据',
        defaultPath: path.join(app.getPath('downloads'), 'links-backup.json'),
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (canceled || !filePath) {
        return { success: false, message: '已取消导出' };
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, message: '数据已成功导出', path: filePath };
    } catch (error) {
      console.error('导出数据失败:', error);
      return { success: false, message: '导出失败: ' + error.message };
    }
  });

  // 导入数据功能
  ipcMain.handle('file:import-data', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '导入数据',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, message: '已取消导入' };
      }

      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const jsonData = JSON.parse(data);
      return { success: true, data: jsonData };
    } catch (error) {
      console.error('导入数据失败:', error);
      return { success: false, message: '导入失败: ' + error.message };
    }
  });

  // 读取JSON文件功能
  ipcMain.handle('file:read-json', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择JSON文件',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, message: '已取消选择' };
      }

      const data = fs.readFileSync(filePaths[0], 'utf-8');
      const jsonData = JSON.parse(data);
      return { success: true, data: jsonData };
    } catch (error) {
      console.error('读取JSON文件失败:', error);
      return { success: false, message: '读取失败: ' + error.message };
    }
  });

  // 添加窗口显示/隐藏切换功能
  ipcMain.handle('window:toggle-visibility', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // 改进处理打开外部链接的IPC处理
  ipcMain.handle('open-external-url', async (event, url) => {
    try {
      // 处理特殊的 about:blank 情况
      if (url === 'about:blank') {
        // 根据不同平台打开默认浏览器
        if (process.platform === 'win32') {
          await shell.openExternal('https://www.google.com/');
          return true;
        } else if (process.platform === 'darwin') {
          await shell.openExternal('https://www.google.com/');
          return true;
        } else {
          // Linux等其他平台
          await shell.openExternal('https://www.google.com/');
          return true;
        }
      }
      
      // 正常打开URL
      await shell.openExternal(url);
      return true;
    } catch (err) {
      console.error('打开外部链接失败:', err);
      return false;
    }
  });
}

// 创建应用菜单
function createAppMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导出备份',
          click: async (_, window) => {
            window.webContents.send('menu:export-data');
          },
        },
        {
          label: '导入恢复',
          click: async (_, window) => {
            window.webContents.send('menu:import-data');
          },
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: async (_, window) => {
            await dialog.showMessageBox(window, {
              title: '关于',
              message: '无限访问',
              detail: `版本: ${app.getVersion()}\n轻松管理您的链接收藏`,
              buttons: ['确定'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 改进图标获取函数，增加内置默认图标
function getIconPath() {
  // 根据平台选择合适的图标文件名
  const iconFileName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  
  // 尝试多个可能的位置
  const possiblePaths = [
    // 开发环境
    path.join(__dirname, 'assets', iconFileName),
    // 打包环境 - resources文件夹
    path.join(process.resourcesPath || __dirname, 'assets', iconFileName),
    // 打包环境 - extraResources文件夹
    path.join(app.getAppPath(), '..', 'assets', iconFileName)
  ];
  
  // 尝试查找图标文件
  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      console.log('找到图标文件:', iconPath);
      return iconPath;
    }
  }
  
  // 如果找不到，使用内置的默认图标
  console.warn('找不到图标文件，使用内置默认图标');
  return getDefaultIconPath();
}

// 提供一个内置的默认图标
function getDefaultIconPath() {
  // 创建临时文件
  const tempDir = app.getPath('temp');
  const defaultIconPath = path.join(tempDir, process.platform === 'win32' ? 'default-icon.ico' : 'default-icon.png');
  
  // 基本的1x1像素图标数据
  const iconData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC',
    'base64'
  );
  
  // 写入临时文件
  try {
    fs.writeFileSync(defaultIconPath, iconData);
  } catch (err) {
    console.error('创建默认图标失败:', err);
  }
  
  return defaultIconPath;
}

// 创建托盘图标
function createTray() {
  try {
    const iconPath = getIconPath();
    tray = new Tray(iconPath);
    tray.setToolTip('无限访问');
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: '添加链接',
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('menu:add-link');
        },
      },
      { type: 'separator' },
      {
        label: '开机自启动',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked,
            path: process.execPath,
          });
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
  
    tray.setContextMenu(contextMenu);
  
    // 托盘图标点击事件
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (error) {
    console.error('创建托盘图标失败:', error);
  }
}

// 注册全局快捷键
function registerShortcuts() {
  // 注册Ctrl+`快捷键
  globalShortcut.register('CommandOrControl+`', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 检查应用是否是通过自启动方式启动的
function checkAutoLaunch() {
  // Windows平台下检查启动参数
  if (process.platform === 'win32') {
    // 检查命令行参数
    const args = process.argv || [];
    isAutoLaunch = args.some(arg => 
      arg.includes('--autostart') ||   // 一些自启动管理器使用此参数
      arg.includes('Windows\\Start Menu') || // 开始菜单启动
      arg.includes('StartupApproved') ||  // Windows自启动相关
      arg.includes('startup') ||    // 通用自启动文件夹
      arg.includes('\\Microsoft\\Windows\\Start Menu\\Programs\\Startup')  // 精确的启动路径匹配
    );
  }
  
  // macOS平台
  if (process.platform === 'darwin') {
    // macOS LaunchAgent 启动
    isAutoLaunch = app.getLoginItemSettings().wasOpenedAsHidden;
  }
  
  console.log('应用自启动检查:', isAutoLaunch ? '是自启动' : '非自启动');
  return isAutoLaunch;
}

const createWindow = () => {
  try {
    mainWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      // 去掉标题栏和边框
      frame: false,
      transparent: false,
      icon: getIconPath(),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
      // 添加初始显示状态设置
      show: !isAutoLaunch, // 如果是自启动，则初始不显示窗口
    });
    
    mainWindow.loadFile('index.html');
  
    // 处理所有新窗口请求 - 确保链接在系统默认浏览器打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      console.log('请求在新窗口打开:', url);
      // 在默认浏览器中打开URL
      shell.openExternal(url).catch((err) => {
        console.error('打开外部链接失败:', err);
      });
      // 阻止Electron创建新窗口
      return { action: 'deny' };
    });
  
    // 窗口关闭事件 - 最小化到托盘
    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
      return true;
    });
  
    // 添加窗口控制事件处理
    ipcMain.handle('window:minimize', () => {
      mainWindow.minimize();
    });
  
    ipcMain.handle('window:close', () => {
      mainWindow.hide();
    });
  
    // 添加菜单通信事件处理
    ipcMain.on('menu:show-about', () => {
      dialog.showMessageBox(mainWindow, {
        title: '关于',
        message: '无限访问',
        detail: `版本: ${app.getVersion()}\n轻松管理您的链接收藏`,
        buttons: ['确定'],
      });
    });
  } catch (error) {
    console.error('创建窗口失败:', error);
    // 确保即使图标加载失败，窗口仍能创建成功
    mainWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
  }
};

app.whenReady().then(() => {
  // 在应用准备好时检查是否是自启动
  checkAutoLaunch();
  
  initDatabase();
  setupIPC();
  createAppMenu();
  createWindow();
  createTray();
  registerShortcuts();

  // 设置开机自启动
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    // 下面这个设置仅对macOS有效，用于标记应用以隐藏方式启动
    openAsHidden: true
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 应用准备退出时清理
app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭数据库连接
    if (db) {
      db.close((err) => {
        if (err) console.error('关闭数据库时出错:', err.message);
        else console.log('数据库连接已关闭');
      });
    }
    app.quit();
  }
});