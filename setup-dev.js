const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runBuildChecks } = require('./build-helper');

/**
 * 设置开发环境
 */
async function setupDev() {
  console.log('? 正在设置开发环境...');

  // 运行构建检查
  const checksOk = await runBuildChecks();
  if (!checksOk) {
    console.error('? 开发环境检查失败，请修复问题后重试。');
    process.exit(1);
  }

  // 创建简单的测试图标文件
  const { createDefaultIcon } = require('./create-icon');
  await createDefaultIcon();

  // 构建前端资源
  console.log('\n? 构建前端资源...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('? 前端资源构建成功!');
  } catch (error) {
    console.error('? 前端资源构建失败:', error.message);
    process.exit(1);
  }

  console.log('\n? 开发环境设置完成! 可以通过以下命令启动应用:');
  console.log('   npm start');
}

// 执行设置
setupDev().catch(err => {
  console.error('? 设置开发环境失败:', err);
  process.exit(1);
});
