const path = require('path');
const fs = require('fs');

/**
 * 获取应用图标路径
 * @param {Object} app - Electron app 对象
 * @returns {string} 图标路径
 */
exports.getIconPath = (app) => {
  // 根据平台选择合适的图标文件名
  const iconFileName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  
  // 尝试多个可能的位置
  const possiblePaths = [
    // 开发环境
    path.join(app.getAppPath(), 'assets', iconFileName),
    // 打包环境 - resources文件夹
    path.join(process.resourcesPath || app.getAppPath(), 'assets', iconFileName),
    // 打包环境 - extraResources文件夹
    path.join(app.getAppPath(), '..', 'assets', iconFileName)
  ];
  
  // 尝试查找图标文件
  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      console.log('找到图标文件:', iconPath);
      return iconPath;
    }
  }
  
  // 如果找不到，使用内置的默认图标
  console.warn('找不到图标文件，使用内置默认图标');
  return exports.getDefaultIconPath(app);
};

/**
 * 提供一个内置的默认图标
 * @param {Object} app - Electron app 对象
 * @returns {string} 默认图标的路径
 */
exports.getDefaultIconPath = (app) => {
  // 创建临时文件
  const tempDir = app.getPath('temp');
  const defaultIconPath = path.join(tempDir, process.platform === 'win32' ? 'default-icon.ico' : 'default-icon.png');
  
  // 基本的1x1像素图标数据
  const iconData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC',
    'base64'
  );
  
  // 写入临时文件
  try {
    fs.writeFileSync(defaultIconPath, iconData);
  } catch (err) {
    console.error('创建默认图标失败:', err);
  }
  
  return defaultIconPath;
};
