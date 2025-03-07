import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import { logStage, checkAPIs } from './debug-helper';

// 记录应用启动
logStage('开始初始化应用');

// 设置全局错误处理
window.addEventListener('error', (event) => {
  console.error('捕获到未处理的错误:', event.error);
  const loadingStatus = document.getElementById('loading-status');
  if (loadingStatus) {
    loadingStatus.textContent = '应用加载出错: ' + (event.error?.message || '未知错误');
    loadingStatus.style.color = '#f56c6c';
  }
});

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  logStage('DOM已加载');
  
  try {
    // 创建Vue应用
    const app = createApp(App);
    
    // 使用ElementPlus
    app.use(ElementPlus);
    
    // 注册Element Plus图标
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
    
    // 检查APIs可用性
    setTimeout(() => {
      checkAPIs();
    }, 1000);
    
    // 挂载应用
    app.mount('#app');
    logStage('Vue应用已挂载');
  } catch (error) {
    console.error('Vue应用初始化失败:', error);
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) {
      loadingStatus.textContent = 'Vue应用初始化失败: ' + error.message;
      loadingStatus.style.color = '#f56c6c';
    }
  }
});
