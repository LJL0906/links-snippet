const fs = require('fs');
const path = require('path');
const { generateBasicIcon } = require('./generate-icon');

// 在打包前进行环境检查
function prePackageCheck() {
  console.log('📦 打包前检查...');
  
  // 1. 检查资源目录
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('⚠️ 资源目录不存在，创建中...');
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // 2. 检查图标文件
  const icoPath = path.join(assetsDir, 'icon.ico');
  const pngPath = path.join(assetsDir, 'icon.png');
  
  if (!fs.existsSync(icoPath) || !fs.existsSync(pngPath)) {
    console.log('⚠️ 找不到图标文件，生成默认图标...');
    generateBasicIcon();
  }
  
  console.log('✅ 预检查完成，准备打包');
}

// 执行检查
prePackageCheck();
