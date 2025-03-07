const { app } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

/**
 * ����Squirrel.Windows��װ�¼�
 * @returns {boolean} �Ƿ�����Squirrel�¼�
 */
exports.handleSquirrelEvent = () => {
  if (process.platform !== 'win32') {
    return false;
  }

  // �����в���
  const cmd = process.argv[1];

  // ����Squirrel�¼�
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

    // ����ͬ��Squirrel�¼�
    if (cmd.includes('--squirrel-install') || cmd.includes('--squirrel-updated')) {
      // ���������ݷ�ʽ
      spawnUpdate(['--createShortcut', exeName]);
      return true;
    }

    if (cmd.includes('--squirrel-uninstall')) {
      // �Ƴ���ݷ�ʽ
      spawnUpdate(['--removeShortcut', exeName]);
      return true;
    }

    if (cmd.includes('--squirrel-obsolete')) {
      // ����汾�ѹ�ʱ����������һ������ȡ��
      return true;
    }

    return false;
  };

  // ����Ƿ���Squirrel����
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
