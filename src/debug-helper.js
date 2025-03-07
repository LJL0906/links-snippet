/**
 * 调试辅助函数，用于诊断应用加载问题
 */

// 记录应用启动时间
const startTime = Date.now();

// 记录应用加载阶段
export function logStage(stageName) {
  const elapsed = Date.now() - startTime;
  console.log(`[${elapsed}ms] 应用阶段: ${stageName}`);
}

// 检查关键API可用性
export function checkAPIs() {
  console.log('检查关键API可用性:');
  console.log('- electronAPI:', typeof window.electronAPI !== 'undefined' ? '可用' : '不可用');
  
  if (window.electronAPI) {
    console.log('  - queryDatabase:', typeof window.electronAPI.queryDatabase === 'function' ? '可用' : '不可用');
    console.log('  - executeDatabase:', typeof window.electronAPI.executeDatabase === 'function' ? '可用' : '不可用');
    console.log('  - minimizeWindow:', typeof window.electronAPI.minimizeWindow === 'function' ? '可用' : '不可用');
    console.log('  - openExternal:', typeof window.electronAPI.openExternal === 'function' ? '可用' : '不可用');
  }
}

// 添加到全局对象以便控制台访问
window.debugHelper = {
  logStage,
  checkAPIs,
  forceShowApp: () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    console.log('已强制移除加载界面');
  }
};
