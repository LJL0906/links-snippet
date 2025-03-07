const { app } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

/**
 * 处理Squirrel.Windows安装事件
 * @returns {boolean} 是否处理了Squirrel事件
 */
exports.handleSquirrelEvent = () => {
  if (process.platform !== 'win32') {
    return false;
  }

  // 命令行参数
  const cmd = process.argv[1];

  // 处理Squirrel事件
  const handleSquirrelArg = (args) => {
    const appFolder = path.resolve(process.execPath, '..');
    const rootAppDir = path.resolve(appFolder, '..');
    const updateExe = path.resolve(path.join(rootAppDir, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawnUpdate = function(args) {
      let spawnedProcess;
      try {
        spawnedProcess = spawn(updateExe, args, { detached: true });
      } catch (error) {
        console.error('Failed to spawn update process:', error);
        return;
      }
      spawnedProcess.on('close', function(code) {
        if (code !== 0) {
          console.error('Update process exited with code:', code);
        }
      });
    };

    console.log('Processing Squirrel command:', cmd);

    // 处理不同的Squirrel事件
    if (cmd.includes('--squirrel-install') || cmd.includes('--squirrel-updated')) {
      // 创建桌面快捷方式
      spawnUpdate(['--createShortcut', exeName]);
      return true;
    }

    if (cmd.includes('--squirrel-uninstall')) {
      // 移除快捷方式
      spawnUpdate(['--removeShortcut', exeName]);
      return true;
    }

    if (cmd.includes('--squirrel-obsolete')) {
      // 这个版本已过时，即将被另一个更新取代
      return true;
    }

    return false;
  };

  // 检查是否有Squirrel参数
  const squirrelCommand = process.argv.find(arg => 
    arg.includes('--squirrel-install') ||
    arg.includes('--squirrel-updated') ||
    arg.includes('--squirrel-uninstall') ||
    arg.includes('--squirrel-obsolete')
  );

  if (squirrelCommand) {
    return handleSquirrelArg(squirrelCommand);
  }

  return false;
};
