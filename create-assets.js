const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 创建资源目录和默认资源文件
 */
function createAssets() {
  console.log('创建必要的资产文件...');
  
  const assetsDir = path.join(__dirname, 'assets');
  
  // 确保assets目录存在
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('创建assets目录');
  }

  // 检查是否存在图标文件，如果不存在则创建默认图标
  const iconFiles = {
    'icon.ico': '构建Windows应用程序需要的图标文件',
    'icon.icns': '构建macOS应用程序需要的图标文件',
    'icon.png': '构建Linux应用程序需要的图标文件'
  };

  for (const [filename, description] of Object.entries(iconFiles)) {
    const filePath = path.join(assetsDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`注意: 缺少${filename} - ${description}`);
      console.log(`请在构建前提供 ${filePath}`);
      
      // 为了方便，可以自动生成简单的图标（如果需要）
      // 这里可以调用另一个脚本生成简单图标
    }
  }

  console.log('资产检查完成');
}

// 执行创建资产
createAssets();
