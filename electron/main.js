// 减少Chromium错误日志输出
process.env.ELECTRON_ENABLE_LOGGING = false;
process.env.ELECTRON_ENABLE_STACK_DUMPING = false;

// 核心模块
const { app, BrowserWindow, Menu, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 导入自定义模块
const { handleSquirrelEvent } = require('./squirrel-startup');
// 修复路径错误 - 正确引用配置和工具
const { getMainWindowConfig, getFallbackWindowConfig, getAppCommandLineSwitches } = require('./config/window-config');
const { getMenuTemplate } = require('./config/menu-config');
const { getIconPath } = require('./utils/icon-utils');
const { checkAutoLaunch, configureAutoLaunch } = require('./utils/startup-utils');
// 修复路径错误 - 正确引用服务模块
const { initDatabase, closeDatabase } = require('./services/database-service');
const { createTray } = require('./services/tray-service');
const { setupIPC } = require('./services/ipc-service');
const { registerGlobalShortcuts, unregisterAllShortcuts } = require('./services/shortcut-service');

// 在应用启动早期处理 Squirrel 事件
if (handleSquirrelEvent()) {
  app.quit();
}

// 全局变量
let mainWindow = null;
let tray = null;
const isQuitting = { value: false }; // 使用对象以便引用传递
let isAutoLaunch = false;
let shouldAutoHide = true; // 控制是否自动隐藏窗口

// 确保数据目录存在
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');

// 数据库连接
let db = null;

/**
 * 创建应用菜单
 */
function createAppMenu() {
  const template = getMenuTemplate(() => app.getVersion());
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * 处理SSL和控制台错误
 */
function setupErrorHandlers() {
  // 自定义日志输出级别，只显示重要信息
  console.originalError = console.error;
  console.error = function(...args) {
    // 过滤SSL错误
    const errorStr = args.join(' ');
    if (errorStr.includes('ssl_client_socket_impl.cc') || 
        errorStr.includes('handshake failed')) {
      return; // 不输出这些错误
    }
    console.originalError(...args);
  };
  
  // 添加全局错误处理
  process.on('uncaughtException', (error) => {
    console.log('捕获到未处理的异常:', error.message);
    // 不要终止进程，继续运行
  });
  
  // 禁用控制台警告
  process.on('warning', (warning) => {
    // 忽略警告，不打印
  });
}

/**
 * 创建主窗口
 */
function createWindow() {
  try {
    // 检查是否为自启动模式
    const isAutoLaunch = checkAutoLaunch(app); // 使用正确的变量名
    
    // 设置允许不安全证书（仅开发环境使用）
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      callback(0); // 0表示接受证书，-2表示拒绝
    });
    
    // 获取窗口配置
    const iconPath = getIconPath(app);
    // 确保使用绝对路径找到preload.js
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('使用预加载脚本路径:', preloadPath);
    
    const windowConfig = {
      width: 1024,
      height: 768,
      frame: false,
      transparent: false,
      icon: iconPath,
      webPreferences: {
        preload: preloadPath, // 使用确定的路径
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false, // 禁用沙箱以解决某些 IPC 问题
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        // 修改CSP添加unsafe-eval
        additionalArguments: [`--csp=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;`]
      },
      show: !isAutoLaunch // 使用正确的变量名，而不是 autoLaunch
    };
    
    // 创建窗口
    mainWindow = new BrowserWindow(windowConfig);
    
    // 添加webRequest拦截器，处理网络错误
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      callback({cancel: false});
    });
    
    // 拦截证书错误
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      event.preventDefault();
      callback(true);
    });

    mainWindow.loadFile('index.html');
  
    // 处理所有新窗口请求 - 确保链接在系统默认浏览器打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url).catch((err) => {
        console.error('打开外部链接失败:', err);
      });
      return { action: 'deny' };
    });
    
    // 添加窗口失焦事件监听，当点击应用外部时自动隐藏到托盘
    mainWindow.on('blur', () => {
      // 只有在shouldAutoHide为true时才自动隐藏窗口
      if (shouldAutoHide && mainWindow.isVisible() && !mainWindow.isMinimized()) {
        mainWindow.hide();
      }
    });
    
    // 监听窗口位置变化，如果移出屏幕区域则隐藏
    let hideWindowTimeout = null;
    mainWindow.on('move', () => {
      if (hideWindowTimeout) {
        clearTimeout(hideWindowTimeout);
      }
      
      hideWindowTimeout = setTimeout(() => {
        if (!mainWindow) return;
        
        // 获取窗口位置和尺寸
        const bounds = mainWindow.getBounds();
        
        // 获取所有显示器信息
        const displays = require('electron').screen.getAllDisplays();
        
        // 检查窗口是否在任何显示器的可视区域内
        const isVisible = displays.some(display => {
          const { x, y, width, height } = display.workArea;
          // 检查窗口是否至少部分在显示区域内
          return (
            bounds.x < x + width &&
            bounds.x + bounds.width > x &&
            bounds.y < y + height &&
            bounds.y + bounds.height > y
          );
        });
        
        // 如果窗口不在任何显示器的可视区域内，则隐藏
        if (!isVisible && mainWindow.isVisible()) {
          mainWindow.hide();
        }
      }, 300);
    });
  
    // 窗口关闭事件 - 最小化到托盘
    mainWindow.on('close', (event) => {
      if (!isQuitting.value) {
        event.preventDefault();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.hide();
        }
        return false;
      }
      return true;
    });

    // 处理窗口实际被销毁的事件
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // 设置IPC通信 - 确保所有模块正确加载
    try {
      setupIPC(db, app, mainWindow);
      console.log('主IPC服务设置成功');
    } catch (error) {
      console.error('设置IPC服务失败:', error);
    }
  } catch (error) {
    console.error('创建窗口失败:', error);
    // 确保即使图标加载失败，窗口仍能创建成功
    const fallbackConfig = {
      width: 1024,
      height: 768,
      frame: false,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'preload.js'), // 指向项目根目录
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    };
    mainWindow = new BrowserWindow(fallbackConfig);
    mainWindow.loadFile('index.html');

    // 同样处理备用窗口的关闭事件
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
}

// 公开控制自动隐藏的方法
global.disableAutoHide = () => { shouldAutoHide = false; };
global.enableAutoHide = () => { shouldAutoHide = true; };

/**
 * 应用初始化和启动
 */
app.whenReady().then(() => {
  // 设置Chromium命令行参数，减少SSL错误日志
  const cmdSwitches = getAppCommandLineSwitches();
  cmdSwitches.forEach(({ switch: name, value }) => {
    if (value === null) {
      app.commandLine.appendSwitch(name);
    } else {
      app.commandLine.appendSwitch(name, value);
    }
  });
  
  // 设置错误处理
  setupErrorHandlers();
  
  // 在应用准备好时检查是否是自启动
  isAutoLaunch = checkAutoLaunch(app);
  
  // 初始化数据库
  db = initDatabase(dbPath);
  
  // 创建应用菜单、窗口和托盘
  createAppMenu();
  createWindow();
  
  tray = createTray(getIconPath(app), mainWindow, app, isQuitting);
  
  // 注册全局快捷键
  registerGlobalShortcuts(mainWindow);

  // 设置开机自启动
  configureAutoLaunch(app, true);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // 重要：监听mainWindow变化以更新IPC服务
  app.on('browser-window-created', (_, window) => {
    // 如果主窗口被重新创建，更新IPC引用
    if (!mainWindow) {
      mainWindow = window;
      setupIPC(db, app, mainWindow);
    }
  });
  
  // 修复：确保在窗口创建时更新IPC引用
  app.on('browser-window-created', (_, window) => {
    console.log('检测到窗口创建，更新IPC引用');
    // 如果主窗口被重新创建，更新IPC引用
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = window;
      setupIPC(db, app, mainWindow);
    }
  });

  // 删除延迟注册，改为打印日志以便确认IPC是否已注册
  setTimeout(() => {
    const ipcMain = require('electron').ipcMain;
    console.log('检查IPC处理程序是否已注册:');
    if (ipcMain && ipcMain.eventNames) {
      console.log('已注册的IPC处理程序:', ipcMain.eventNames());
    } else {
      console.log('无法获取已注册的IPC处理程序');
    }
  }, 2000);

  // 移除备份相关的IPC处理程序注册
});

/**
 * 应用退出和清理
 */
// 应用准备退出时清理
app.on('before-quit', () => {
  isQuitting.value = true;
});

app.on('will-quit', () => {
  // 注销所有快捷键
  unregisterAllShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭数据库连接
    closeDatabase(db);
    app.quit();
  }
});