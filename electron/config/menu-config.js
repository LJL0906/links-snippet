/**
 * 获取应用菜单模板
 * @param {Function} getAppVersion - 获取应用版本的函数
 * @returns {Array} - 菜单模板
 */
exports.getMenuTemplate = (getAppVersion) => [
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
          const { dialog } = require('electron');
          await dialog.showMessageBox(window, {
            title: '关于',
            message: 'infinite-Links',
            detail: `版本: ${getAppVersion()}\n轻松管理您的链接收藏`,
            buttons: ['确定'],
          });
        },
      },
    ],
  },
];
