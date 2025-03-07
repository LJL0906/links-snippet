/**
 * 检查应用是否是通过自启动方式启动的
 * @param {Object} app - Electron app 对象
 * @returns {boolean} 是否为自启动
 */
exports.checkAutoLaunch = (app) => {
  let isAutoLaunch = false;
  
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
};

/**
 * 配置应用自启动设置
 * @param {Object} app - Electron app 对象
 * @param {boolean} enable - 是否启用自启动
 */
exports.configureAutoLaunch = (app, enable = true) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: process.execPath,
    // 下面这个设置仅对macOS有效，用于标记应用以隐藏方式启动
    openAsHidden: true
  });
};
