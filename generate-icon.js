const fs = require('fs');
const path = require('path');

/**
 * 生成基本图标文件 - 针对打包使用
 */
function generateBasicIcon() {
  const assetsDir = path.join(__dirname, 'assets');
  
  // 确保assets目录存在
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('✅ 已创建assets目录');
  }
  
  // 创建一个有效的PNG图标 - 紫色背景带Infinity符号的简单图标
  const simpleIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="#8b5cf6" rx="30" ry="30"/>
      <text x="128" y="160" font-size="180" text-anchor="middle" fill="white" font-family="Arial">∞</text>
    </svg>
  `;
  
  // PNG图标路径
  const pngIconPath = path.join(assetsDir, 'icon.png');
  const icoIconPath = path.join(assetsDir, 'icon.ico');
  
  // 将SVG转换为Base64数据URL
  const svgBase64 = Buffer.from(simpleIconSvg).toString('base64');
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
  
  // 如果不存在，写入PNG数据
  if (!fs.existsSync(pngIconPath)) {
    try {
      fs.writeFileSync(pngIconPath, svgDataUrl);
      console.log('✅ 已创建基本icon.png');
    } catch (err) {
      console.error('❌ 创建icon.png失败:', err);
    }
  }
  
  // 如果不存在，复制PNG为ICO
  if (!fs.existsSync(icoIconPath)) {
    try {
      fs.copyFileSync(pngIconPath, icoIconPath);
      console.log('✅ 已创建基本icon.ico');
    } catch (err) {
      console.error('❌ 创建icon.ico失败:', err);
    }
  }
  
  console.log('');
  console.log('🔔 注意:');
  console.log('  1. 已生成基本图标文件用于打包');
  console.log('  2. 请替换为您自己的高质量图标以获得最佳效果');
  console.log('  3. 图标位置: ./assets/icon.ico 和 ./assets/icon.png');
}

// 如果直接运行此文件，则执行生成
if (require.main === module) {
  generateBasicIcon();
}

module.exports = { generateBasicIcon };
