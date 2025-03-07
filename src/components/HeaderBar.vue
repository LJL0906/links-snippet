<template>
  <div class="title-bar">
    <div class="title-left">
      <span class="app-icon">∞</span>
      <span class="title-text">infinite-Links</span>
    </div>
    <div class="window-controls">
      <button class="window-control minimize-btn" @click="minimizeWindow">
        <span>─</span>
      </button>
      <button class="window-control close-btn" @click="closeWindow">
        <span>×</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HeaderBar',
  methods: {
    async minimizeWindow() {
      try {
        console.log("正在最小化窗口...");
        await window.electronAPI.minimizeWindow();
      } catch (error) {
        console.error('最小化窗口失败:', error);
      }
    },
    async closeWindow() {
      try {
        console.log("正在关闭窗口...");
        await window.electronAPI.closeWindow();
      } catch (error) {
        console.error('关闭窗口失败:', error);
        // 备用计划：如果直接方法失败，尝试切换可见性
        try {
          await window.electronAPI.hideWindow();
        } catch (innerError) {
          console.error('隐藏窗口也失败:', innerError);
        }
      }
    }
  }
}
</script>

<style scoped>
.title-bar {
  height: 36px;
  background-color: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  -webkit-app-region: drag; /* 允许拖拽窗口 */
}

.title-left {
  display: flex;
  align-items: center;
}

.app-icon {
  font-size: 18px;
  color: white;
  margin-right: 8px;
  font-weight: bold;
}

.title-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag; /* 控制按钮不能用于拖拽 */
}

.window-control {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}

.window-control:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.close-btn:hover {
  background-color: #f44336;
}
</style>
