const fs = require('fs');
const path = require('path');
const { createDefaultIcon } = require('./create-icon');
const { execSync } = require('child_process');

/**
 * ���ǰ��׼������
 */
async function preBuild() {
  console.log('? ��ʼ���ǰ׼��...');

  // 1. ȷ��package.json�еİ汾����ȷ
  checkPackageVersion();
  
  // 2. ȷ��ͼ���ļ�����
  await createDefaultIcon();
  
  // 3. ȷ��assets�ļ��д���
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('? ����assetsĿ¼�ɹ�');
  }

  // 4. ȷ��ɾ�����ܻᵼ�������wix-template.xml
  const wixTemplatePath = path.join(__dirname, 'wix-template.xml');
  if (fs.existsSync(wixTemplatePath)) {
    try {
      fs.unlinkSync(wixTemplatePath);
      console.log('? ��ɾ������Ҫ��wix-template.xml�ļ�');
    } catch (error) {
      console.log('?? �޷�ɾ��wix-template.xml�ļ�:', error.message);
    }
  }

  console.log('? ���ǰ׼����ɣ�');
}

/**
 * ���package.json�еİ汾���Ƿ����SemVer��ʽ
 */
function checkPackageVersion() {
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const version = packageData.version;

    console.log(`? ��ǰ�汾��: ${version}`);

    // SemVer��ʽ��֤: x.y.z
    const semVerRegex = /^\d+\.\d+\.\d+$/;
    if (!semVerRegex.test(version)) {
      console.log('?? ����: �汾�Ų�����SemVer��ʽ (x.y.z)');
      
      // ��ʾ�����汾��
      const correctedVersion = fixVersion(version);
      console.log(`? �����޸�Ϊ: ${correctedVersion}`);
      
      // ѯ���Ƿ��Զ�����
      console.log(`? �����Զ����°汾��Ϊ ${correctedVersion}...`);
      
      packageData.version = correctedVersion;
      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
      console.log('? �汾���Ѹ���');
    } else {
      console.log('? �汾�Ÿ�ʽ��ȷ');
    }
  } catch (error) {
    console.error('? ���汾��ʧ��:', error);
  }
}

/**
 * ����������SemVer��ʽ�İ汾��
 */
function fixVersion(version) {
  // ��ȡ���ֲ���
  const numbers = version.split(/[^\d]/).filter(n => n !== '');
  
  // ȷ����������������
  while (numbers.length < 3) {
    numbers.push('0');
  }
  
  // ֻȡǰ��������
  return numbers.slice(0, 3).join('.');
}

// ִ��׼���ű�
preBuild()
  .then(() => {
    console.log('? ׼����ɣ����Կ�ʼ�����!');
    console.log('? ���� npm run make ��ʼ���');
  })
  .catch(err => {
    console.error('? ׼��ʧ��:', err);
    process.exit(1);
  });
