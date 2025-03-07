const { contextBridge, ipcRenderer } = require('electron');

// ���Ը������������IPC��������Ƿ����
const checkHandler = async (name) => {
  try {
    // ֻ��鴦�������ڣ���ʵ�ʵ���
    // ������˲���Ҫ�Ĵ�����־
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`������� '${name}' �ȴ���ʱ`);
        resolve(false);
      }, 100);
      
      ipcRenderer.invoke(name).then(() => {
        clearTimeout(timeout);
        resolve(true);
      }).catch(err => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    return true;
  } catch (error) {
    return false;
  }
};

// ��¶API����Ⱦ����
contextBridge.exposeInMainWorld('electronAPI', {
  // ϵͳ��Ϲ���
  checkSystem: async () => {
    try {
      // ������ݿ�����
      let dbStatus = false;
      try {
        const testResult = await ipcRenderer.invoke('db:query', 'SELECT 1 as test', []);
        dbStatus = Array.isArray(testResult) && testResult.length > 0;
      } catch (e) {
        console.error('���ݿ����Ӳ���ʧ��:', e);
      }
      
      return {
        database: dbStatus,
        fileSystem: true  // �ٶ��ļ�ϵͳʼ�տ���
      };
    } catch (err) {
      console.error('ϵͳ���ʧ��:', err);
      return { database: false, fileSystem: false };
    }
  },
  
  // ���ݿ����
  queryDatabase: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  executeDatabase: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  
  // ���ڿ���
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  showWindow: () => ipcRenderer.invoke('window:show'),
  toggleWindowVisibility: () => ipcRenderer.invoke('window:toggle-visibility'),
  
  // Ӧ����Ϣ
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // �ⲿ����
  openExternal: (url) => ipcRenderer.invoke('open-external-url', url),
  
  // �ļ�����
  exportData: (data) => ipcRenderer.invoke('file:export-data', data),
  importData: () => ipcRenderer.invoke('file:import-data'),
  readJsonFile: () => ipcRenderer.invoke('file:read-json'),
});

// Ԥ�������֪ͨ
console.log('electron/preload.js �Ѽ������');
