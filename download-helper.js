const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// ����Ŀ¼���������
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// �ֶ������ļ�
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    console.log(`����: ${url} �� ${dest}`);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(`��ȡʧ�ܣ�${response.statusCode}`);
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`�������: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // ɾ�����������ļ�
      reject(err.message);
    });

    // ���ó�ʱ
    request.setTimeout(30000, function() {
      request.abort();
      reject('����ʱ');
    });
  });
}

// ��ȡElectron�汾
function getElectronVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.devDependencies.electron.replace(/^\^|~/, '');
  } catch (e) {
    console.error('�޷���ȡpackage.json', e);
    return '27.3.11'; // Ĭ�ϰ汾
  }
}

async function main() {
  try {
    const electronVersion = getElectronVersion();
    console.log(`��ǰElectron�汾: ${electronVersion}`);

    // �û�Ŀ¼
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const electronGypDir = path.join(homeDir, '.electron-gyp');
    const versionDir = path.join(electronGypDir, electronVersion);
    
    // ������Ҫ��Ŀ¼
    ensureDir(electronGypDir);
    ensureDir(versionDir);
    ensureDir(path.join(versionDir, 'include'));
    ensureDir(path.join(versionDir, 'win-x64'));

    // ����node.lib��ͷ�ļ�
    await Promise.all([
      // �Ӿ���վ����
      downloadFile(
        `https://npmmirror.com/mirrors/electron/${electronVersion}/win-x64/node.lib`,
        path.join(versionDir, 'win-x64', 'node.lib')
      ),
      downloadFile(
        `https://npmmirror.com/mirrors/electron/${electronVersion}/node-${electronVersion}-headers.tar.gz`,
        path.join(versionDir, `node-v${electronVersion}-headers.tar.gz`)
      )
    ]);

    console.log('��ѹͷ�ļ�...');
    try {
      execSync(`tar -xzf "${path.join(versionDir, `node-v${electronVersion}-headers.tar.gz`)}" -C "${versionDir}"`);
      console.log('��ѹ���');
    } catch (e) {
      console.error('��ѹʧ�ܣ�������Ҫ�ֶ���ѹ', e);
    }

    console.log('�ļ����غ�׼�����!');
  } catch (error) {
    console.error('���ع����г���:', error);
    process.exit(1);
  }
}

main();
