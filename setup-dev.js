const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runBuildChecks } = require('./build-helper');

/**
 * ���ÿ�������
 */
async function setupDev() {
  console.log('? �������ÿ�������...');

  // ���й������
  const checksOk = await runBuildChecks();
  if (!checksOk) {
    console.error('? �����������ʧ�ܣ����޸���������ԡ�');
    process.exit(1);
  }

  // �����򵥵Ĳ���ͼ���ļ�
  const { createDefaultIcon } = require('./create-icon');
  await createDefaultIcon();

  // ����ǰ����Դ
  console.log('\n? ����ǰ����Դ...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('? ǰ����Դ�����ɹ�!');
  } catch (error) {
    console.error('? ǰ����Դ����ʧ��:', error.message);
    process.exit(1);
  }

  console.log('\n? ���������������! ����ͨ��������������Ӧ��:');
  console.log('   npm start');
}

// ִ������
setupDev().catch(err => {
  console.error('? ���ÿ�������ʧ��:', err);
  process.exit(1);
});
