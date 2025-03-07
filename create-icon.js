const fs = require('fs');
const path = require('path');

/**
 * ����Ĭ��ͼ��
 */
async function createDefaultIcon() {
  // ȷ��assetsĿ¼����
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('? ����assetsĿ¼�ɹ�');
  }

  // ���ͼ���Ƿ��Ѵ���
  const iconPath = path.join(assetsDir, 'icon.ico');
  if (fs.existsSync(iconPath)) {
    console.log('? ͼ���ļ��Ѵ��ڣ����贴��');
    return;
  }

  try {
    // �������Ǵ���һ���ǳ��򵥵�1x1���ص�ͼ���ļ�
    // ��ʵ��Ӧ���У�Ӧ���滻Ϊһ���������ͼ��
    const iconData = Buffer.from(
      'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACZmZkKmZmZGpmZmRqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZkFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJmZmRqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmRqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJmZmQWZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmSOZmZkFAAAAAAAAAAAAAAAAAAAAAAAAAACZmZkamZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOgAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmToAAAAAAAAAAAAAAAAAAAAAAAAAAJmZmRqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6AAAAAAAAAAAAAAAAAAAAAAAAAACZmZkamZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOgAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmTqZmZk6mZmZOpmZmToAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZGpmZmTqZmZk6mZmZOpmZmTqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmZmZOpmZmTqZmZkaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'base64'
    );
    
    fs.writeFileSync(iconPath, iconData);
    console.log('? ����Ĭ��ͼ��ɹ�');
    
    // ����ͬ����ͼ��ΪPNG��ʽ������macOS��Linux
    const pngPath = path.join(assetsDir, 'icon.png');
    fs.writeFileSync(pngPath, iconData);
    console.log('? ����Ĭ��PNGͼ��ɹ�');
    
  } catch (error) {
    console.error('? ����Ĭ��ͼ��ʧ��:', error);
  }
}

// ִ�д���ͼ��
createDefaultIcon()
  .then(() => console.log('? ͼ��׼�����'))
  .catch(err => console.error('? ͼ��׼��ʧ��:', err));

// �������ֱ�����еĽű����˳�����
if (require.main === module) {
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

module.exports = { createDefaultIcon };
