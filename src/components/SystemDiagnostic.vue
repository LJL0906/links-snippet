<template>
  <div class="diagnostic-panel" v-if="showDiagnostics">
    <div class="diagnostic-header">
      <h3>系统诊断</h3>
      <el-button type="danger" size="small" @click="closeDiagnostics">关闭</el-button>
    </div>
    
    <div class="diagnostic-content">
      <p><strong>数据库状态:</strong> 
        <el-tag :type="features.database ? 'success' : 'danger'">
          {{ features.database ? '正常' : '连接失败' }}
        </el-tag>
      </p>
      
      <p><strong>文件系统:</strong> 
        <el-tag :type="features.fileSystem ? 'success' : 'danger'">
          {{ features.fileSystem ? '正常' : '异常' }}
        </el-tag>
      </p>
      
      <div class="diagnostic-actions">
        <el-button type="primary" size="small" @click="runDiagnostics">
          重新检查
        </el-button>
        <el-button size="small" @click="resetDatabase">
          重置数据库
        </el-button>
      </div>
      
      <div v-if="diagnosticLog.length > 0" class="diagnostic-log">
        <p v-for="(log, index) in diagnosticLog" :key="index" 
           :class="{'error-log': log.includes('失败') || log.includes('错误')}">
          {{ log }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemDiagnostic',
  data() {
    return {
      showDiagnostics: false,
      features: {
        database: false,
        fileSystem: false
      },
      diagnosticLog: []
    };
  },
  methods: {
    showPanel() {
      this.showDiagnostics = true;
      this.runDiagnostics();
    },
    closeDiagnostics() {
      this.showDiagnostics = false;
    },
    async runDiagnostics() {
      this.addLog('开始系统诊断...');
      try {
        if (!window.electronAPI || !window.electronAPI.checkSystem) {
          this.addLog('错误: electronAPI不可用');
          return;
        }
        
        const features = await window.electronAPI.checkSystem();
        this.features = features;
        
        this.addLog(`数据库状态: ${features.database ? '正常' : '连接失败'}`);
        this.addLog(`文件系统: ${features.fileSystem ? '正常' : '异常'}`);
      } catch (error) {
        this.addLog(`诊断失败: ${error.message}`);
      }
    },
    addLog(message) {
      const timestamp = new Date().toLocaleTimeString();
      this.diagnosticLog.unshift(`[${timestamp}] ${message}`);
      // 限制日志数量
      if (this.diagnosticLog.length > 20) {
        this.diagnosticLog.pop();
      }
    },
    async resetDatabase() {
      try {
        const confirmed = await this.$confirm(
          '这将清空所有数据并重建数据库。确定继续吗？', 
          '警告', 
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).catch(() => 'cancel');
        
        if (confirmed === 'cancel') return;
        
        this.addLog('开始重置数据库...');
        
        // 创建新的链接表
        await window.electronAPI.executeDatabase(`
          DROP TABLE IF EXISTS links;
          CREATE TABLE links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            category TEXT,
            sort_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `, []);
        
        this.addLog('数据库重置成功');
        
        // 刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        this.addLog(`重置数据库失败: ${error.message}`);
      }
    }
  }
}
</script>

<style scoped>
.diagnostic-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 12px;
  border: 1px solid #e0e0e0;
}

.diagnostic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.diagnostic-header h3 {
  margin: 0;
  font-size: 1rem;
}

.diagnostic-content p {
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diagnostic-actions {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
}

.diagnostic-log {
  margin-top: 15px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.8rem;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.error-log {
  color: #f56c6c;
}
</style>
