const path = require('path');

/**
 * 主窗口配置
 * @param {string} preloadPath - preload.js 的路径
 * @param {string} iconPath - 应用图标路径
 * @param {boolean} autoLaunch - 是否为自启动模式
 * @returns {Object} - 窗口配置对象
 */
exports.getMainWindowConfig = (preloadPath, iconPath, autoLaunch) => ({
  width: 1024,
  height: 768,
  frame: false,
  transparent: false,
  icon: iconPath,
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    webSecurity: true,
    allowRunningInsecureContent: false
  },
  show: !autoLaunch // 如果是自启动，则初始不显示窗口
});

/**
 * 当主窗口配置创建失败时的备用配置
 * @param {string} preloadPath - preload.js 的路径
 * @returns {Object} - 简化的窗口配置对象
 */
exports.getFallbackWindowConfig = (preloadPath) => ({
  width: 1024,
  height: 768,
  frame: false,
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
  }
});

/**
 * 应用命令行启动参数
 * @returns {Array} - Chromium 命令行参数数组
 */
exports.getAppCommandLineSwitches = () => [
  { switch: 'ignore-certificate-errors', value: null },
  { switch: 'ignore-ssl-errors', value: 'true' },
  { switch: 'disable-features', value: 'OutOfBlinkCors' },
  { switch: 'log-level', value: '3' } // 仅显示致命错误
];
