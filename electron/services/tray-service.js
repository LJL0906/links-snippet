const { Tray, Menu } = require('electron');

/**
 * 创建系统托盘
 * @param {string} iconPath - 托盘图标路径
 * @param {Object} mainWindow - 主窗口对象
 * @param {Object} app - Electron app 对象
 * @param {boolean} isQuitting - 是否正在退出应用的引用
 * @returns {Object} 托盘对象
 */
exports.createTray = (iconPath, mainWindow, app, isQuitting) => {
  try {
    const tray = new Tray(iconPath);
    tray.setToolTip('infinite-Links');
    
    const updateContextMenu = () => {
      const isWindowVisible = mainWindow && mainWindow.isVisible();
      
      const contextMenu = Menu.buildFromTemplate([
        {
          label: isWindowVisible ? '隐藏窗口' : '显示窗口',
          click: () => {
            if (isWindowVisible) {
              mainWindow.hide();
            } else {
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        {
          label: '添加链接',
          click: () => {
            if (!isWindowVisible) {
              mainWindow.show();
            }
            mainWindow.focus();
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
            isQuitting.value = true;
            app.quit();
          },
        },
      ]);
  
      tray.setContextMenu(contextMenu);
    };
  
    // 初始设置菜单
    updateContextMenu();
    
    // 当窗口显示状态改变时更新菜单
    if (mainWindow) {
      mainWindow.on('show', updateContextMenu);
      mainWindow.on('hide', updateContextMenu);
    }
  
    // 托盘图标点击事件 - 切换窗口显示状态
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
      updateContextMenu(); // 更新菜单状态
    });
    
    return tray;
  } catch (error) {
    console.error('创建托盘图标失败:', error);
    return null;
  }
};
