const fs = require('fs');
const path = require('path');

/**
 * 创建默认图标
 */
async function createDefaultIcon() {
  // 确保assets目录存在
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('? 创建assets目录成功');
  }

  // 检查图标是否已存在
  const iconPath = path.join(assetsDir, 'icon.ico');
  if (fs.existsSync(iconPath)) {
    console.log('? 图标文件已存在，无需创建');
    return;
  }

  try {
    // 这里我们创建一个非常简单的1x1像素的图标文件
    // 在实际应用中，应该替换为一个有意义的图标
    const iconData = Buffer.from(
      'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACZmZkKmZmZGpmZmRqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZkFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJmZmRqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmRqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJmZmQWZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmSOZmZkFAAAAAAAAAAAAAAAAAAAAAAAAAACZmZkamZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOgAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmToAAAAAAAAAAAAAAAAAAAAAAAAAAJmZmRqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6AAAAAAAAAAAAAAAAAAAAAAAAAACZmZkamZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOgAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmToAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZOpmZmTqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'base64'
    );
    
    fs.writeFileSync(iconPath, iconData);
    console.log('? 创建默认图标成功');
    
    // 复制同样的图标为PNG格式，用于macOS和Linux
    const pngPath = path.join(assetsDir, 'icon.png');
    fs.writeFileSync(pngPath, iconData);
    console.log('? 创建默认PNG图标成功');
    
  } catch (error) {
    console.error('? 创建默认图标失败:', error);
  }
}

// 执行创建图标
createDefaultIcon()
  .then(() => console.log('? 图标准备完成'))
  .catch(err => console.error('? 图标准备失败:', err));

// 如果这是直接运行的脚本，退出进程
if (require.main === module) {
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

module.exports = { createDefaultIcon };
