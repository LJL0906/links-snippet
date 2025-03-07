// ����Chromium������־���
process.env.ELECTRON_ENABLE_LOGGING = false;
process.env.ELECTRON_ENABLE_STACK_DUMPING = false;

// ����ģ��
const { app, BrowserWindow, Menu, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// �����Զ���ģ��
const { handleSquirrelEvent } = require('./squirrel-startup');
// �޸�·������ - ��ȷ�������ú͹���
const { getMainWindowConfig, getFallbackWindowConfig, getAppCommandLineSwitches } = require('./config/window-config');
const { getMenuTemplate } = require('./config/menu-config');
const { getIconPath } = require('./utils/icon-utils');
const { checkAutoLaunch, configureAutoLaunch } = require('./utils/startup-utils');
// �޸�·������ - ��ȷ���÷���ģ��
const { initDatabase, closeDatabase } = require('./services/database-service');
const { createTray } = require('./services/tray-service');
const { setupIPC } = require('./services/ipc-service');
const { registerGlobalShortcuts, unregisterAllShortcuts } = require('./services/shortcut-service');

// ��Ӧ���������ڴ��� Squirrel �¼�
if (handleSquirrelEvent()) {
  app.quit();
}

// ȫ�ֱ���
let mainWindow = null;
let tray = null;
const isQuitting = { value: false }; // ʹ�ö����Ա����ô���
let isAutoLaunch = false;
let shouldAutoHide = true; // �����Ƿ��Զ����ش���

// ȷ������Ŀ¼����
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');

// ���ݿ�����
let db = null;

/**
 * ����Ӧ�ò˵�
 */
function createAppMenu() {
  const template = getMenuTemplate(() => app.getVersion());
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * ����SSL�Ϳ���̨����
 */
function setupErrorHandlers() {
  // �Զ�����־�������ֻ��ʾ��Ҫ��Ϣ
  console.originalError = console.error;
  console.error = function(...args) {
    // ����SSL����
    const errorStr = args.join(' ');
    if (errorStr.includes('ssl_client_socket_impl.cc') || 
        errorStr.includes('handshake failed')) {
      return; // �������Щ����
    }
    console.originalError(...args);
  };
  
  // ���ȫ�ִ�����
  process.on('uncaughtException', (error) => {
    console.log('����δ������쳣:', error.message);
    // ��Ҫ��ֹ���̣���������
  });
  
  // ���ÿ���̨����
  process.on('warning', (warning) => {
    // ���Ծ��棬����ӡ
  });
}

/**
 * ����������
 */
function createWindow() {
  try {
    // ����Ƿ�Ϊ������ģʽ
    const isAutoLaunch = checkAutoLaunch(app); // ʹ����ȷ�ı�����
    
    // ����������ȫ֤�飨����������ʹ�ã�
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      callback(0); // 0��ʾ����֤�飬-2��ʾ�ܾ�
    });
    
    // ��ȡ��������
    const iconPath = getIconPath(app);
    // ȷ��ʹ�þ���·���ҵ�preload.js
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('ʹ��Ԥ���ؽű�·��:', preloadPath);
    
    const windowConfig = {
      width: 1024,
      height: 768,
      frame: false,
      transparent: false,
      icon: iconPath,
      webPreferences: {
        preload: preloadPath, // ʹ��ȷ����·��
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false, // ����ɳ���Խ��ĳЩ IPC ����
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        // �޸�CSP���unsafe-eval
        additionalArguments: [`--csp=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;`]
      },
      show: !isAutoLaunch // ʹ����ȷ�ı������������� autoLaunch
    };
    
    // ��������
    mainWindow = new BrowserWindow(windowConfig);
    
    // ���webRequest�������������������
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      callback({cancel: false});
    });
    
    // ����֤�����
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      event.preventDefault();
      callback(true);
    });

    mainWindow.loadFile('index.html');
  
    // ���������´������� - ȷ��������ϵͳĬ���������
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url).catch((err) => {
        console.error('���ⲿ����ʧ��:', err);
      });
      return { action: 'deny' };
    });
    
    // ��Ӵ���ʧ���¼������������Ӧ���ⲿʱ�Զ����ص�����
    mainWindow.on('blur', () => {
      // ֻ����shouldAutoHideΪtrueʱ���Զ����ش���
      if (shouldAutoHide && mainWindow.isVisible() && !mainWindow.isMinimized()) {
        mainWindow.hide();
      }
    });
    
    // ��������λ�ñ仯������Ƴ���Ļ����������
    let hideWindowTimeout = null;
    mainWindow.on('move', () => {
      if (hideWindowTimeout) {
        clearTimeout(hideWindowTimeout);
      }
      
      hideWindowTimeout = setTimeout(() => {
        if (!mainWindow) return;
        
        // ��ȡ����λ�úͳߴ�
        const bounds = mainWindow.getBounds();
        
        // ��ȡ������ʾ����Ϣ
        const displays = require('electron').screen.getAllDisplays();
        
        // ��鴰���Ƿ����κ���ʾ���Ŀ���������
        const isVisible = displays.some(display => {
          const { x, y, width, height } = display.workArea;
          // ��鴰���Ƿ����ٲ�������ʾ������
          return (
            bounds.x < x + width &&
            bounds.x + bounds.width > x &&
            bounds.y < y + height &&
            bounds.y + bounds.height > y
          );
        });
        
        // ������ڲ����κ���ʾ���Ŀ��������ڣ�������
        if (!isVisible && mainWindow.isVisible()) {
          mainWindow.hide();
        }
      }, 300);
    });
  
    // ���ڹر��¼� - ��С��������
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

    // ������ʵ�ʱ����ٵ��¼�
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // ����IPCͨ�� - ȷ������ģ����ȷ����
    try {
      setupIPC(db, app, mainWindow);
      console.log('��IPC�������óɹ�');
    } catch (error) {
      console.error('����IPC����ʧ��:', error);
    }
  } catch (error) {
    console.error('��������ʧ��:', error);
    // ȷ����ʹͼ�����ʧ�ܣ��������ܴ����ɹ�
    const fallbackConfig = {
      width: 1024,
      height: 768,
      frame: false,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'preload.js'), // ָ����Ŀ��Ŀ¼
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    };
    mainWindow = new BrowserWindow(fallbackConfig);
    mainWindow.loadFile('index.html');

    // ͬ�������ô��ڵĹر��¼�
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
}

// ���������Զ����صķ���
global.disableAutoHide = () => { shouldAutoHide = false; };
global.enableAutoHide = () => { shouldAutoHide = true; };

/**
 * Ӧ�ó�ʼ��������
 */
app.whenReady().then(() => {
  // ����Chromium�����в���������SSL������־
  const cmdSwitches = getAppCommandLineSwitches();
  cmdSwitches.forEach(({ switch: name, value }) => {
    if (value === null) {
      app.commandLine.appendSwitch(name);
    } else {
      app.commandLine.appendSwitch(name, value);
    }
  });
  
  // ���ô�����
  setupErrorHandlers();
  
  // ��Ӧ��׼����ʱ����Ƿ���������
  isAutoLaunch = checkAutoLaunch(app);
  
  // ��ʼ�����ݿ�
  db = initDatabase(dbPath);
  
  // ����Ӧ�ò˵������ں�����
  createAppMenu();
  createWindow();
  
  tray = createTray(getIconPath(app), mainWindow, app, isQuitting);
  
  // ע��ȫ�ֿ�ݼ�
  registerGlobalShortcuts(mainWindow);

  // ���ÿ���������
  configureAutoLaunch(app, true);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // ��Ҫ������mainWindow�仯�Ը���IPC����
  app.on('browser-window-created', (_, window) => {
    // ��������ڱ����´���������IPC����
    if (!mainWindow) {
      mainWindow = window;
      setupIPC(db, app, mainWindow);
    }
  });
  
  // �޸���ȷ���ڴ��ڴ���ʱ����IPC����
  app.on('browser-window-created', (_, window) => {
    console.log('��⵽���ڴ���������IPC����');
    // ��������ڱ����´���������IPC����
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = window;
      setupIPC(db, app, mainWindow);
    }
  });

  // ɾ���ӳ�ע�ᣬ��Ϊ��ӡ��־�Ա�ȷ��IPC�Ƿ���ע��
  setTimeout(() => {
    const ipcMain = require('electron').ipcMain;
    console.log('���IPC��������Ƿ���ע��:');
    if (ipcMain && ipcMain.eventNames) {
      console.log('��ע���IPC�������:', ipcMain.eventNames());
    } else {
      console.log('�޷���ȡ��ע���IPC�������');
    }
  }, 2000);

  // �Ƴ�������ص�IPC�������ע��
});

/**
 * Ӧ���˳�������
 */
// Ӧ��׼���˳�ʱ����
app.on('before-quit', () => {
  isQuitting.value = true;
});

app.on('will-quit', () => {
  // ע�����п�ݼ�
  unregisterAllShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // �ر����ݿ�����
    closeDatabase(db);
    app.quit();
  }
});