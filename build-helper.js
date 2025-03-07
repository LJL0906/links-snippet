const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 检查并安装缺失的依赖
 */
function ensureDependencies() {
  console.log('? 检查依赖...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('? 找不到package.json文件!');
    return false;
  }
  
  try {
    // 安装依赖
    console.log('? 安装依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error('? 安装依赖失败:', error.message);
    return false;
  }
}

/**
 * 检查webpack是否正确配置
 */
function checkWebpackConfig() {
  console.log('? 检查webpack配置...');
  
  const webpackConfigPath = path.join(__dirname, 'webpack.config.js');
  
  if (!fs.existsSync(webpackConfigPath)) {
    console.error('? 找不到webpack.config.js文件!');
    return false;
  }
  
  try {
    // 检查webpack是否可用
    const webpackPath = path.join(__dirname, 'node_modules', '.bin', 'webpack');
    const isWin = process.platform === 'win32';
    const webpack = isWin ? webpackPath + '.cmd' : webpackPath;

    if (!fs.existsSync(webpack)) {
      console.error('? webpack未安装!');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('? 检查webpack失败:', error.message);
    return false;
  }
}

/**
 * 检查和创建electron目录结构
 */
function ensureElectronDirectory() {
  console.log('? 检查electron目录结构...');
  
  const electronDir = path.join(__dirname, 'electron');
  
  if (!fs.existsSync(electronDir)) {
    console.log('? 创建electron目录...');
    fs.mkdirSync(electronDir, { recursive: true });
  }
  
  // 检查必要的子目录
  const subDirs = ['config', 'services', 'utils'];
  for (const dir of subDirs) {
    const subDirPath = path.join(electronDir, dir);
    if (!fs.existsSync(subDirPath)) {
      console.log(`? 创建${dir}目录...`);
      fs.mkdirSync(subDirPath, { recursive: true });
    }
  }
  
  return true;
}

/**
 * 执行所有构建前检查
 */
async function runBuildChecks() {
  console.log('? 开始构建前检查...');
  
  const steps = [
    { name: '确保依赖安装', func: ensureDependencies },
    { name: '检查webpack配置', func: checkWebpackConfig },
    { name: '确保electron目录结构', func: ensureElectronDirectory }
  ];
  
  let success = true;
  
  for (const step of steps) {
    console.log(`\n? ${step.name}...`);
    const result = await step.func();
    if (!result) {
      console.error(`? ${step.name}失败!`);
      success = false;
    } else {
      console.log(`? ${step.name}成功!`);
    }
  }
  
  if (success) {
    console.log('\n? 所有检查通过! 可以继续构建了.');
  } else {
    console.error('\n? 部分检查未通过，请修复上述问题后重试。');
  }
  
  return success;
}

// 如果直接运行此脚本
if (require.main === module) {
  runBuildChecks()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('? 检查过程发生错误:', err);
      process.exit(1);
    });
}

module.exports = { runBuildChecks };
