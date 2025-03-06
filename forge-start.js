const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保依赖已安装
console.log('📦 检查依赖...');
try {
  if (!fs.existsSync('./node_modules')) {
    console.log('🔧 安装依赖...');
    execSync('npm install', { stdio: 'inherit' });
  }
  
  // 确保assets目录存在
  require('./create-assets');
  
  // 重建本地模块
  console.log('🔄 重建本地模块...');
  execSync('npm run rebuild', { stdio: 'inherit' });
  
  // 构建前端
  console.log('🔨 构建前端代码...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 使用Electron Forge打包
  console.log('📦 开始打包...');
  execSync('npm run make', { stdio: 'inherit' });
  
  console.log('✅ 打包完成！');
  console.log('🎁 输出位置:');
  console.log('   - Windows: ./out/make/squirrel.windows/x64/');
  console.log('   - macOS: ./out/make/');
  console.log('   - Linux: ./out/make/');
} catch (error) {
  console.error('❌ 打包失败:', error.message);
  process.exit(1);
}
