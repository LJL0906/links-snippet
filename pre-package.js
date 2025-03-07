const fs = require('fs');
const path = require('path');

/**
 * 在打包前执行检查
 */
function prePackageCheck() {
  console.log('执行打包前检查...');

  // 检查必要的目录和文件
  const requiredPaths = [
    { path: 'electron/main.js', type: 'file', message: '主进程文件缺失' },
    { path: 'electron/preload.js', type: 'file', message: '预加载脚本缺失' },
    { path: 'index.html', type: 'file', message: '主HTML文件缺失' },
    { path: 'assets', type: 'dir', message: '资源目录缺失' }
  ];

  let hasErrors = false;

  for (const item of requiredPaths) {
    const fullPath = path.join(__dirname, item.path);
    const exists = fs.existsSync(fullPath);
    const isCorrectType = exists && 
      ((item.type === 'file' && fs.statSync(fullPath).isFile()) ||
       (item.type === 'dir' && fs.statSync(fullPath).isDirectory()));
    
    if (!exists || !isCorrectType) {
      console.error(`错误: ${item.message} (${fullPath})`);
      hasErrors = true;
    }
  }

  // 检查package.json版本格式
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const version = packageJson.version;
      
      // 验证SemVer格式
      const semverRegex = /^\d+\.\d+\.\d+$/;
      if (!semverRegex.test(version)) {
        console.error(`错误: package.json中的版本 '${version}' 不符合SemVer格式，请使用 x.y.z 格式`);
        hasErrors = true;
      }
    } catch (error) {
      console.error('读取package.json失败:', error);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log('打包前检查发现问题，请在解决后重试');
    process.exit(1);
  } else {
    console.log('打包前检查通过！');
  }
}

// 执行检查
prePackageCheck();
