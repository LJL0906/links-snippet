const { globalShortcut } = require('electron');

/**
 * 注册全局快捷键
 * @param {Object} mainWindow - 主窗口对象
 * @returns {boolean} - 是否成功注册快捷键
 */
exports.registerGlobalShortcuts = (mainWindow) => {
  try {
    // 修改快捷键为 Alt+~
    globalShortcut.register('Alt+`', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    return true;
  } catch (error) {
    console.error('注册全局快捷键失败:', error);
    return false;
  }
};

/**
 * 注销所有全局快捷键
 */
exports.unregisterAllShortcuts = () => {
  globalShortcut.unregisterAll();
};
