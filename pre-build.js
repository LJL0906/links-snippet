const fs = require('fs');
const path = require('path');
const { createDefaultIcon } = require('./create-icon');
const { execSync } = require('child_process');

/**
 * 打包前的准备工作
 */
async function preBuild() {
  console.log('? 开始打包前准备...');

  // 1. 确保package.json中的版本号正确
  checkPackageVersion();
  
  // 2. 确保图标文件存在
  await createDefaultIcon();
  
  // 3. 确保assets文件夹存在
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('? 创建assets目录成功');
  }

  // 4. 确保删除可能会导致问题的wix-template.xml
  const wixTemplatePath = path.join(__dirname, 'wix-template.xml');
  if (fs.existsSync(wixTemplatePath)) {
    try {
      fs.unlinkSync(wixTemplatePath);
      console.log('? 已删除不需要的wix-template.xml文件');
    } catch (error) {
      console.log('?? 无法删除wix-template.xml文件:', error.message);
    }
  }

  console.log('? 打包前准备完成！');
}

/**
 * 检查package.json中的版本号是否符合SemVer格式
 */
function checkPackageVersion() {
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const version = packageData.version;

    console.log(`? 当前版本号: ${version}`);

    // SemVer格式验证: x.y.z
    const semVerRegex = /^\d+\.\d+\.\d+$/;
    if (!semVerRegex.test(version)) {
      console.log('?? 警告: 版本号不符合SemVer格式 (x.y.z)');
      
      // 提示修正版本号
      const correctedVersion = fixVersion(version);
      console.log(`? 建议修改为: ${correctedVersion}`);
      
      // 询问是否自动修正
      console.log(`? 正在自动更新版本号为 ${correctedVersion}...`);
      
      packageData.version = correctedVersion;
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
      console.log('? 版本号已更新');
    } else {
      console.log('? 版本号格式正确');
    }
  } catch (error) {
    console.error('? 检查版本号失败:', error);
  }
}

/**
 * 修正不符合SemVer格式的版本号
 */
function fixVersion(version) {
  // 提取数字部分
  const numbers = version.split(/[^\d]/).filter(n => n !== '');
  
  // 确保至少有三个数字
  while (numbers.length < 3) {
    numbers.push('0');
  }
  
  // 只取前三个数字
  return numbers.slice(0, 3).join('.');
}

// 执行准备脚本
preBuild()
  .then(() => {
    console.log('? 准备完成，可以开始打包了!');
    console.log('? 运行 npm run make 开始打包');
  })
  .catch(err => {
    console.error('? 准备失败:', err);
    process.exit(1);
  });
