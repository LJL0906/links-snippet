const path = require('path');
const fs = require('fs');

/**
 * 检查图标文件是否存在
 * @param {string} iconPath - 图标路径
 * @returns {boolean} - 图标是否存在
 */
function iconExists(iconPath) {
  try {
    return fs.existsSync(iconPath);
  } catch (error) {
    console.error('检查图标文件失败:', error);
    return false;
  }
}

// 确保assets目录存在
const assetsDir = path.resolve(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Electron-forge 配置
module.exports = {
  // 打包器配置
  packagerConfig: {
    name: 'infinite-Links',
    executableName: 'infinite-Links',
    asar: true,
    icon: path.resolve(__dirname, 'assets', 'icon'),
    appCopyright: `Copyright © ${new Date().getFullYear()}`,
    // 确保extraResource路径存在
    extraResource: iconExists(path.resolve(__dirname, 'assets')) 
      ? [path.resolve(__dirname, 'assets')]
      : [],
    // 打包忽略项
    ignore: [
      "/\\.git($|/)",
      "/\\.vscode($|/)",
      "/\\.idea($|/)",
      "/node_modules\\/.*\\/test($|/)",
      "/node_modules\\/.*\\/tests($|/)",
      "/node_modules\\/.*\\/\\.github($|/)"
    ]
  },
  
  // 重建配置
  rebuildConfig: {},
  
  // 构建器配置
  makers: [
    // Squirrel.Windows 构建器 - 简化配置
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // 基本配置
        name: 'infinite-Links',
        // 设置图标路径
        setupIcon: iconExists(path.resolve(__dirname, 'assets', 'icon.ico'))
          ? path.resolve(__dirname, 'assets', 'icon.ico')
          : undefined,
        // 简体中文
        language: 2052,
        // 应用程序安装程序名称
        setupExe: 'infinite-Links安装程序.exe',
        // 禁用MSI生成以避免WiX错误
        noMsi: true,
        // 版本号 - 使用标准SemVer格式
        version: '1.0.0',
        // 应用程序互斥名称
        setupMutex: 'infinite-Links_SingletonMutex',
        // 注册表配置
        registry: [
          // 开机自启动 - 修改为以静默方式启动
          {
            name: 'startup',
            path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            value: {
              name: 'infinite-Links',
              value: '"$EXEPATH" --autostart'  // 添加自启动参数
            }
          }
        ]
      }
    },
    
    // macOS打包器
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  
  // 插件配置
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  
  // 发布相关配置
  publishers: [],
  
  // 钩子函数
  hooks: {
    // 打包前钩子
    prePackage: async () => {
      console.log('执行打包前处理...');
      // 尝试执行打包前准备
      try {
        // 确保webpack构建已完成
        const webpackPath = path.join(__dirname, 'node_modules', '.bin', 'webpack');
        const isWin = process.platform === 'win32';
        const webpack = isWin ? webpackPath + '.cmd' : webpackPath;

        if (fs.existsSync(webpack)) {
          const { execSync } = require('child_process');
          console.log('构建前端资源...');
          execSync(`"${webpack}" --mode production`, { stdio: 'inherit' });
        }
        
        // 执行预构建检查
        require('./pre-build');
      } catch (error) {
        console.error('打包前准备失败:', error);
      }
    },
  }
};