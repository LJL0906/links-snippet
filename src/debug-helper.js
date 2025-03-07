/**
 * ���Ը����������������Ӧ�ü�������
 */

// ��¼Ӧ������ʱ��
const startTime = Date.now();

// ��¼Ӧ�ü��ؽ׶�
export function logStage(stageName) {
  const elapsed = Date.now() - startTime;
  console.log(`[${elapsed}ms] Ӧ�ý׶�: ${stageName}`);
}

// ���ؼ�API������
export function checkAPIs() {
  console.log('���ؼ�API������:');
  console.log('- electronAPI:', typeof window.electronAPI !== 'undefined' ? '����' : '������');
  
  if (window.electronAPI) {
    console.log('  - queryDatabase:', typeof window.electronAPI.queryDatabase === 'function' ? '����' : '������');
    console.log('  - executeDatabase:', typeof window.electronAPI.executeDatabase === 'function' ? '����' : '������');
    console.log('  - minimizeWindow:', typeof window.electronAPI.minimizeWindow === 'function' ? '����' : '������');
    console.log('  - openExternal:', typeof window.electronAPI.openExternal === 'function' ? '����' : '������');
  }
}

// ��ӵ�ȫ�ֶ����Ա����̨����
window.debugHelper = {
  logStage,
  checkAPIs,
  forceShowApp: () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    console.log('��ǿ���Ƴ����ؽ���');
  }
};
