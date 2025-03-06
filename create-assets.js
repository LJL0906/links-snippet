const fs = require('fs');
const path = require('path');

// 确保资源目录存在
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✅ 已创建assets目录');
}

// 生成一个简单的图标占位符，如果icon.ico不存在
const iconPath = path.join(assetsDir, 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.log('⚠️ 警告: 没有找到icon.ico，请放置一个适当的图标文件在assets目录中');
  console.log('   你可以从 https://iconarchive.com/ 或其他资源下载合适的图标');
}

console.log('✅ 资源准备完毕');
console.log('📝 请确保以下文件存在于assets目录:');
console.log('   - icon.ico (Windows图标)');
console.log('   - icon.png (Linux图标)');
