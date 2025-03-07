const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// 创建目录如果不存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 手动下载文件
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    console.log(`下载: ${url} 到 ${dest}`);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(`获取失败：${response.statusCode}`);
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`下载完成: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // 删除不完整的文件
      reject(err.message);
    });

    // 设置超时
    request.setTimeout(30000, function() {
      request.abort();
      reject('请求超时');
    });
  });
}

// 获取Electron版本
function getElectronVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.devDependencies.electron.replace(/^\^|~/, '');
  } catch (e) {
    console.error('无法读取package.json', e);
    return '27.3.11'; // 默认版本
  }
}

async function main() {
  try {
    const electronVersion = getElectronVersion();
    console.log(`当前Electron版本: ${electronVersion}`);

    // 用户目录
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const electronGypDir = path.join(homeDir, '.electron-gyp');
    const versionDir = path.join(electronGypDir, electronVersion);
    
    // 创建必要的目录
    ensureDir(electronGypDir);
    ensureDir(versionDir);
    ensureDir(path.join(versionDir, 'include'));
    ensureDir(path.join(versionDir, 'win-x64'));

    // 下载node.lib和头文件
    await Promise.all([
      // 从镜像站下载
      downloadFile(
        `https://npmmirror.com/mirrors/electron/${electronVersion}/win-x64/node.lib`,
        path.join(versionDir, 'win-x64', 'node.lib')
      ),
      downloadFile(
        `https://npmmirror.com/mirrors/electron/${electronVersion}/node-${electronVersion}-headers.tar.gz`,
        path.join(versionDir, `node-v${electronVersion}-headers.tar.gz`)
      )
    ]);

    console.log('解压头文件...');
    try {
      execSync(`tar -xzf "${path.join(versionDir, `node-v${electronVersion}-headers.tar.gz`)}" -C "${versionDir}"`);
      console.log('解压完成');
    } catch (e) {
      console.error('解压失败，可能需要手动解压', e);
    }

    console.log('文件下载和准备完成!');
  } catch (error) {
    console.error('下载过程中出错:', error);
    process.exit(1);
  }
}

main();
