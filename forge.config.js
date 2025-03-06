const path = require('path');
const fs = require('fs');

// 检查图标文件是否存在
function iconExists(iconPath) {
  return fs.existsSync(iconPath) ? iconPath : null;
}

// 获取有效的图标路径或返回null
function getValidIconPath(platform) {
  const iconName = platform === 'win32' ? 'icon.ico' : 'icon.png';
  const iconPath = path.resolve(__dirname, 'assets', iconName);
  return iconExists(iconPath);
}

/**
 * Electron Forge 配置
 * 详情参考：https://www.electronforge.io/config/configuration
 */
module.exports = {
  // 打包配置 - 控制Electron应用如何打包
  packagerConfig: {
    // 仅当图标存在时才设置图标路径
    ...(getValidIconPath(process.platform) ? { icon: getValidIconPath(process.platform) } : {}),
    
    // ASAR配置 - 确保sqlite3等原生模块正常工作
    asar: {
      unpack: '**/*.node'
    },
    
    // 额外资源 - 将被复制到资源目录
    extraResource: ['./assets'],
    
    // 输出目录
    out: './out',
    
    // 应用名称
    name: '无限访问',
    
    // 忽略不必要文件以减小包体积
    ignore: [
      /node_modules\/sqlite3\/deps\//,
      /node_modules\/sqlite3\/src\//,
      /\.git/,
      /\.vscode/,
      /\.github/
    ]
  },
  
  // 原生模块重建配置
  rebuildConfig: {
    forceRebuild: true,
    // 指定需要重建的模块
    onlyModules: ['sqlite3']
  },
  
  // 构建配置 - 控制如何构建分发版本
  makers: [
    // Windows - Squirrel.Windows安装程序
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: '无限访问',
        // 仅当图标存在时才设置图标路径
        ...(iconExists(path.resolve(__dirname, 'assets', 'icon.ico')) 
            ? { setupIcon: path.resolve(__dirname, 'assets', 'icon.ico') } 
            : {}),
        language: 2052, // 简体中文
        setupExe: '无限访问安装程序.exe',
        noMsi: false,
        // 设置注册表相关项
        registry: [
          // 开机自启动
          {
            name: 'startup',
            path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            value: {
              name: '无限访问',
              value: '"$EXEPATH"'
            }
          }
        ],
        // 安装程序名称和图标
        iconUrl: 'file:///' + path.resolve(__dirname, 'assets', 'icon.ico').replace(/\\/g, '/'),
        setupMutex: '无限访问_SingletonMutex'
      }
    },
    
    // macOS - DMG安装镜像
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        format: 'ULFO',
        background: path.resolve(__dirname, 'assets', 'dmg-background.png'),
        contents: [
          { x: 130, y: 220 },
          { x: 410, y: 220, type: 'link', path: '/Applications' }
        ],
        window: {
          size: { width: 540, height: 380 }
        }
      }
    },
    
    // macOS - ZIP格式
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    
    // Linux - DEB包
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          icon: path.resolve(__dirname, 'assets', 'icon.png'),
          categories: ['Utility', 'Network'],
          homepage: 'https://github.com/yourusername/无限访问'
        }
      }
    },
    
    // Linux - RPM包
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          icon: path.resolve(__dirname, 'assets', 'icon.png'),
          categories: ['Utility', 'Network']
        }
      }
    }
  ],
  
  // 插件配置
  plugins: [
    // 自动解包原生模块
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  
  // 构建生命周期钩子
  hooks: {
    // 生成资源前 - 确保图标文件存在
    generateAssets: async () => {
      // 导入图标生成工具
      const { generateBasicIcon } = require('./generate-icon');
      generateBasicIcon();
    },
    
    // 包修剪后
    packageAfterPrune: async (forgeConfig, buildPath) => {
      console.log(`正在准备打包 ${buildPath}...`);
    },
    
    // 打包完成后
    packageAfterCopy: async (forgeConfig, buildPath) => {
      console.log(`复制文件完成，正在处理: ${buildPath}`);
    },
    
    // 制作开始前
    preMake: async () => {
      console.log('开始构建分发版本...');
    },
    
    // 制作完成后
    postMake: async (forgeConfig, artifacts) => {
      console.log('构建完成，输出:');
      artifacts.forEach(artifact => {
        console.log(`- ${artifact.platform}/${artifact.arch}: ${artifact.path}`);
      });
    }
  }
};