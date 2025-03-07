const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * ��鲢��װȱʧ������
 */
function ensureDependencies() {
  console.log('? �������...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('? �Ҳ���package.json�ļ�!');
    return false;
  }
  
  try {
    // ��װ����
    console.log('? ��װ����...');
    execSync('npm install', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error('? ��װ����ʧ��:', error.message);
    return false;
  }
}

/**
 * ���webpack�Ƿ���ȷ����
 */
function checkWebpackConfig() {
  console.log('? ���webpack����...');
  
  const webpackConfigPath = path.join(__dirname, 'webpack.config.js');
  
  if (!fs.existsSync(webpackConfigPath)) {
    console.error('? �Ҳ���webpack.config.js�ļ�!');
    return false;
  }
  
  try {
    // ���webpack�Ƿ����
    const webpackPath = path.join(__dirname, 'node_modules', '.bin', 'webpack');
    const isWin = process.platform === 'win32';
    const webpack = isWin ? webpackPath + '.cmd' : webpackPath;

    if (!fs.existsSync(webpack)) {
      console.error('? webpackδ��װ!');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('? ���webpackʧ��:', error.message);
    return false;
  }
}

/**
 * ���ʹ���electronĿ¼�ṹ
 */
function ensureElectronDirectory() {
  console.log('? ���electronĿ¼�ṹ...');
  
  const electronDir = path.join(__dirname, 'electron');
  
  if (!fs.existsSync(electronDir)) {
    console.log('? ����electronĿ¼...');
    fs.mkdirSync(electronDir, { recursive: true });
  }
  
  // ����Ҫ����Ŀ¼
  const subDirs = ['config', 'services', 'utils'];
  for (const dir of subDirs) {
    const subDirPath = path.join(electronDir, dir);
    if (!fs.existsSync(subDirPath)) {
      console.log(`? ����${dir}Ŀ¼...`);
      fs.mkdirSync(subDirPath, { recursive: true });
    }
  }
  
  return true;
}

/**
 * ִ�����й���ǰ���
 */
async function runBuildChecks() {
  console.log('? ��ʼ����ǰ���...');
  
  const steps = [
    { name: 'ȷ��������װ', func: ensureDependencies },
    { name: '���webpack����', func: checkWebpackConfig },
    { name: 'ȷ��electronĿ¼�ṹ', func: ensureElectronDirectory }
  ];
  
  let success = true;
  
  for (const step of steps) {
    console.log(`\n? ${step.name}...`);
    const result = await step.func();
    if (!result) {
      console.error(`? ${step.name}ʧ��!`);
      success = false;
    } else {
      console.log(`? ${step.name}�ɹ�!`);
    }
  }
  
  if (success) {
    console.log('\n? ���м��ͨ��! ���Լ���������.');
  } else {
    console.error('\n? ���ּ��δͨ�������޸�������������ԡ�');
  }
  
  return success;
}

// ���ֱ�����д˽ű�
if (require.main === module) {
  runBuildChecks()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('? �����̷�������:', err);
      process.exit(1);
    });
}

module.exports = { runBuildChecks };
