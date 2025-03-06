const { app } = require('electron');
const path = require('path');
const childProcess = require('child_process');

function handleSquirrelEvent() {
  if (process.platform !== 'win32') {
    return false;
  }

  const appFolder = path.resolve(process.execPath, '..');
  const rootFolder = path.resolve(appFolder, '..');
  const updateExe = path.resolve(path.join(rootFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    try {
      return childProcess.spawn(command, args, { detached: true });
    } catch (error) {
      console.error('Squirrel启动错误:', error);
    }
  };

  const squirrelCommand = process.argv[1];
  
  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // 创建桌面和开始菜单快捷方式
      spawn(updateExe, ['--createShortcut', exeName]);
      
      // 设置开机自启动
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath
      });
      
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // 删除桌面和开始菜单快捷方式
      spawn(updateExe, ['--removeShortcut', exeName]);
      
      // 禁用开机自启动
      app.setLoginItemSettings({
        openAtLogin: false
      });
      
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      app.quit();
      return true;
      
    case '--squirrel-firstrun':
      // 首次运行时的操作
      return false;
  }
  
  return false;
}

module.exports = { handleSquirrelEvent };
