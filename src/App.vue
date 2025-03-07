<template>
  <div class="container">
    <!-- 自定义标题栏 -->
    <header-bar />

    <el-config-provider>
      <div class="app-header">
        <div>
          <h1 class="app-title">infinite-Links</h1>
          <div class="subTitle-text">快捷键：Alt + ~</div>
        </div>
        <div class="header-actions">
          <!-- 数据管理下拉菜单 -->
          <el-dropdown
            trigger="click"
            @command="handleDataAction"
            class="data-actions"
          >
            <el-button class="data-btn" type="primary" plain round>
              <el-icon><Files /></el-icon>
              <span class="btn-text">数据管理</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu class="custom-dropdown">
                <el-dropdown-item command="export" class="dropdown-item">
                  <el-icon><Download /></el-icon> 导出备份
                </el-dropdown-item>
                <el-dropdown-item command="import" class="dropdown-item">
                  <el-icon><Upload /></el-icon> 导入恢复
                </el-dropdown-item>
                <el-dropdown-item command="bulk" divided class="dropdown-item">
                  <div class="dropdown-item-with-tip">
                    <el-icon><Document /></el-icon>
                    <span>批量导入</span>
                    <el-tooltip
                      content="请使用正确的JSON格式: [{title:'标题',url:'链接',category:'分类'}, ...]"
                      placement="top"
                      effect="light"
                    >
                      <el-icon class="info-icon"><question-filled /></el-icon>
                    </el-tooltip>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button
            type="primary"
            round
            @click="showAddLinkDialog"
            class="add-btn"
          >
            <el-icon><Plus /></el-icon> 添加链接
          </el-button>
        </div>
      </div>

      <!-- 新增百度搜索框 - 修复引用方式 -->
      <div class="baidu-search-container">
        <el-input
          v-model="baiduQuery"
          placeholder="输入关键词，按回车百度搜索"
          clearable
          @keyup.enter="searchBaidu"
          ref="baiduSearchInput"
          class="baidu-search-input"
        >
          <template #prefix>
            <div class="baidu-icon-wrapper">
              <span class="baidu-logo">百</span>
            </div>
          </template>
        </el-input>
      </div>

      <!-- 搜索栏 -->
      <search-bar
        :categories="categories"
        @search="setSearchQuery"
        @filter="setFilterCategory"
      />

      <!-- 错误加载状态显示 -->
      <div v-if="loadError" class="error-message">
        <el-alert type="error" :closable="false" show-icon>
          <h3>加载数据失败</h3>
          <p>{{loadErrorMessage}}</p>
          <el-button size="small" type="primary" @click="retryLoading" class="retry-btn">
            重试
          </el-button>
        </el-alert>
      </div>

      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 内容区域 - 仅在数据加载完成且没有错误时显示 -->
      <template v-if="!loading && !loadError">
        <!-- 分类导航 - 修复引用方式 -->
        <category-nav
          v-if="!filterCategory && !searchQuery && hasValidLinks"
          :grouped-links="groupedLinks"
          :total-links="links.length"
          v-model="activeCategory"
          :category-order="categoryOrder"
          @category-order-changed="updateCategoryOrder"
        />

        <!-- 链接内容区 - 修复引用方式 -->
        <template v-if="!filterCategory && !searchQuery && hasValidLinks">
          <links-list
            :links="links"
            :grouped-links="groupedLinks"
            :active-category="activeCategory"
            @edit="editLink"
            @delete="deleteLink"
            @links-sorted="updateLinkOrder"
          />
        </template>

        <!-- 搜索/筛选结果 - 修复引用方式 -->
        <div v-else-if="hasValidLinks" class="card-container">
          <link-card
            v-for="link in filteredLinks"
            :key="link.id"
            :link="link"
            :show-category="true"
            @edit="editLink"
            @delete="deleteLink"
          />

          <div v-if="filteredLinks.length === 0" class="empty-state">
            <el-empty description="没有找到链接" />
          </div>
        </div>

        <!-- 没有链接时显示的引导状态 -->
        <div v-if="!hasValidLinks && !loading" class="empty-guide">
          <el-empty description="还没有链接">
            <el-button type="primary" @click="showAddLinkDialog">添加第一个链接</el-button>
          </el-empty>
        </div>
      </template>

      <!-- 对话框组件 -->
      <add-link-dialog
        v-model="dialogVisible"
        :link="newLink"
        :is-editing="isEditing"
        :categories="categories"
        @save="saveLink"
      />

      <import-dialog
        v-model="importDialogVisible"
        :import-data="importData"
        :is-loading="importing"
        @confirm="confirmImport"
        @cancel="cancelImport"
      />

      <bulk-import-dialog
        v-model="bulkImportDialogVisible"
        :bulk-data="bulkData"
        :valid-bulk-count="validBulkData.length"
        :is-loading="bulkImporting"
        @select-file="selectBulkJsonFile"
        @confirm="confirmBulkImport"
        @cancel="cancelBulkImport"
      />

    </el-config-provider>
  </div>
</template>

<script>
// 导入UI组件
import HeaderBar from "./components/HeaderBar.vue";
import SearchBar from "./components/SearchBar.vue";
import CategoryNav from "./components/CategoryNav.vue";
import LinkCard from "./components/LinkCard.vue";
import LinksList from "./components/LinksList.vue";
import AddLinkDialog from "./components/dialogs/AddLinkDialog.vue";
import ImportDialog from "./components/dialogs/ImportDialog.vue";
import BulkImportDialog from "./components/dialogs/BulkImportDialog.vue";

// 导入图标
import {
  Plus,
  Document,
  Files,
  ArrowDown,
  QuestionFilled,
  Download,
  Upload,
  Setting, // 新增
} from "@element-plus/icons-vue";

// 导入自定义服务和组合式API
import linkService from "./services/linkService";
import dataService from "./services/dataService";
import useLinkData from "./composables/useLinkData";
import useBaiduSearch from "./composables/useBaiduSearch";

// 导入Element Plus
import { ElMessage } from "element-plus";

export default {
  components: {
    HeaderBar,
    SearchBar,
    CategoryNav,
    LinkCard,
    LinksList,
    AddLinkDialog,
    ImportDialog,
    BulkImportDialog,
    Plus,
    Document,
    Files,
    ArrowDown,
    QuestionFilled,
    Download,
    Upload,
    Setting, // 新增
  },
  setup() {
    // 使用组合式API初始化，并解构返回值以便直接在模板中使用
    const linkDataObj = useLinkData();
    const baiduSearchObj = useBaiduSearch();
    
    // 添加初始化完成时的加载状态控制
    onMounted(async () => {
      try {
        await loadLinks();
        // 触发自定义事件通知加载完成
        window.dispatchEvent(new Event('app-loaded'));
        console.log('应用加载完成');
      } catch (error) {
        console.error('应用初始化失败:', error);
        ElMessage.error('应用初始化失败，请尝试重启应用');
      }
    });

    return {
      // 从linkData中解构所有属性和方法
      ...linkDataObj,
      
      // 从baiduSearch中解构所有属性和方法
      ...baiduSearchObj,
      
      // 同时保留原始对象引用，用于调试
      linkData: linkDataObj,
      baiduSearch: baiduSearchObj,
    };
  },
  data() {
    return {
      loading: true,       // 添加加载状态标志
      loadError: false,    // 添加加载错误标志
      loadErrorMessage: "", // 加载错误信息
      dialogVisible: false,
      newLink: {
        id: null,
        title: "",
        url: "",
        category: "",
      },
      isEditing: false,

      // 导入导出相关
      importDialogVisible: false,
      importData: [],
      importing: false,

      // 批量导入相关
      bulkImportDialogVisible: false,
      bulkData: [],
      bulkImporting: false,
    };
  },
  computed: {
    // 确保安全的链接数组（过滤无效项）
    safeLinks() {
      if (!this.linkData || !this.linkData.links || !Array.isArray(this.linkData.links)) {
        return [];
      }
      return this.linkData.links.filter(link => link && typeof link.id !== 'undefined');
    },
    
    // 确保安全的过滤后链接数组
    safeFilteredLinks() {
      if (!this.linkData || !this.linkData.filteredLinks || !Array.isArray(this.linkData.filteredLinks)) {
        return [];
      }
      return this.linkData.filteredLinks.filter(link => link && typeof link.id !== 'undefined');
    },
    
    // 安全的分组链接
    safeGroupedLinks() {
      const result = {};
      if (!this.linkData || !this.linkData.groupedLinks) {
        return result;
      }
      
      // 重新过滤每个分组，确保链接有效
      Object.entries(this.linkData.groupedLinks).forEach(([category, links]) => {
        if (Array.isArray(links)) {
          result[category] = links.filter(link => link && typeof link.id !== 'undefined');
        } else {
          result[category] = [];
        }
      });
      
      return result;
    },
    
    // 是否有有效链接 - 使用解构后的links
    hasValidLinks() {
      return Array.isArray(this.links) && this.links.length > 0 && 
        this.links.some(link => link && typeof link.id !== 'undefined');
    },
    
    // 有效的批量导入数据（去重后）
    validBulkData() {
      // 确保linkData.links是有效数组
      if (!Array.isArray(this.links)) {
        console.warn('links 无效，返回空数组');
        return [];
      }
      return dataService.validateBulkData(this.bulkData, this.links);
    },
  },
  async mounted() {
    try {
      console.log('App 组件加载中...');
      this.loading = true;
      
      // 先检查 electronAPI 是否可用
      if (!window.electronAPI) {
        throw new Error('electronAPI 不可用，可能是 preload 脚本未正确加载');
      }
      
      try {
        await this.checkDatabaseSchema();
      } catch (schemaError) {
        console.error('检查数据库模式失败:', schemaError);
      }
      
      await this.loadLinks();
      
      // 修改页面标题
      document.title = "infinite-Links";

      // 菜单处理器
      if (window.electronAPI.onMenuExport) {
        window.electronAPI.onMenuExport(() => this.exportData());
      }

      if (window.electronAPI.onMenuImport) {
        window.electronAPI.onMenuImport(() => this.importDataAction());
      }

      if (window.electronAPI.onMenuAddLink) {
        window.electronAPI.onMenuAddLink(() => this.showAddLinkDialog());
      }

      // 添加窗口显示时聚焦百度搜索框的功能
      window.addEventListener("focus", this.focusBaiduSearch);

      // 初始聚焦
      this.$nextTick(() => {
        this.focusBaiduSearch();
      });
      
      // 数据加载完成
      this.loading = false;
    } catch (error) {
      console.error('App 加载失败:', error);
      this.loadError = true;
      this.loadErrorMessage = error.message || "应用初始化失败";
      this.loading = false;
    }
  },
  methods: {
    // 重试加载数据
    async retryLoading() {
      this.loadError = false;
      this.loading = true;
      
      try {
        await this.loadLinks();
        this.loading = false;
      } catch (error) {
        console.error('重试加载失败:', error);
        this.loadError = true;
        this.loadErrorMessage = error.message || "重新加载失败";
        this.loading = false;
      }
    },
    
    // 链接数据操作方法
    async showAddLinkDialog() {
      this.isEditing = false;
      this.newLink = { id: null, title: "", url: "", category: "" };
      this.dialogVisible = true;
    },
    
    editLink(link) {
      this.isEditing = true;
      this.newLink = { ...link };
      this.dialogVisible = true;
    },
    
    async saveLink(linkData) {
      // 保存当前选中的分类
      this.linkData.saveCategorySelection();

      if (await linkService.saveLink(linkData, this.isEditing)) {
        await this.linkData.loadLinks();
      }
    },
    
    async deleteLink(id) {
      if (await linkService.deleteLink(id)) {
        await this.linkData.loadLinks();
      }
    },
    
    async updateLinkOrder(orderData) {
      console.log('App.vue - updateLinkOrder:', orderData);
      if (await linkService.updateLinkOrder(orderData)) {
        // 强制重新加载数据以反映新排序
        await this.linkData.loadLinks();
        
        // 触发视图更新
        this.$forceUpdate();
      }
    },
    
    // 数据管理相关方法
    async handleDataAction(command) {
      console.log('处理数据操作:', command);
      switch (command) {
        case "export":
          await this.exportData();
          break;
        case "import":
          await this.importDataAction();
          break;
        case "bulk":
          this.showBulkImport();
          break;
      }
    },
    
    async exportData() {
      await dataService.exportData();
    },
    
    async importDataAction() {
      const result = await dataService.importData();
      
      if (result.success) {
        this.importData = result.data;
        this.importDialogVisible = true;
      }
    },
    
    async confirmImport() {
      this.importing = true;
      try {
        if (await dataService.confirmImport(this.importData)) {
          this.importDialogVisible = false;
          this.importData = [];
          await this.linkData.loadLinks();
        }
      } finally {
        this.importing = false;
      }
    },
    
    cancelImport() {
      this.importDialogVisible = false;
      this.importData = [];
    },
    
    // 批量导入相关方法
    showBulkImport() {
      this.bulkData = [];
      this.bulkImportDialogVisible = true;
    },
    
    async selectBulkJsonFile() {
      const result = await dataService.selectBulkFile();
      
      if (result.success) {
        this.bulkData = result.data;
        
        if (this.validBulkData.length === 0) {
          ElMessage.warning("未找到有效的链接数据或所有链接已存在");
        } else {
          ElMessage.success(`找到 ${this.validBulkData.length} 条可导入的链接`);
        }
      }
    },
    
    async confirmBulkImport() {
      this.bulkImporting = true;
      try {
        if (await dataService.confirmBulkImport(this.validBulkData)) {
          this.bulkImportDialogVisible = false;
          this.bulkData = [];
          await this.linkData.loadLinks();
        }
      } finally {
        this.bulkImporting = false;
      }
    },
    
    cancelBulkImport() {
      this.bulkImportDialogVisible = false;
      this.bulkData = [];
    },
    // 单独提取数据库模式检查方法
    async checkDatabaseSchema() {
      try {
        const columns = await window.electronAPI.queryDatabase(
          "PRAGMA table_info(links)",
          []
        );
        
        // 检查columns是否是数组
        if (Array.isArray(columns)) {
          const hasSortOrder = columns.some(col => col.name === 'sort_order');
          if (!hasSortOrder) {
            console.log('添加sort_order字段到links表');
            try {
              await window.electronAPI.executeDatabase(
                "ALTER TABLE links ADD COLUMN sort_order INTEGER",
                []
              );
            } catch (alterError) {
              console.error('添加sort_order列失败:', alterError);
            }
          }
        } else {
          console.warn('表结构查询返回的不是数组:', columns);
        }
      } catch (e) {
        console.error('检查表结构失败:', e);
        throw e; // 重新抛出错误以便调用者处理
      }
    },
    // 加载链接数据
    async loadLinks() {
      try {
        console.log('正在加载链接数据...');
        
        // 初始化一个空数组，防止后续访问出错
        this.linkData.links = [];
        
        // 读取分类排序
        try {
          const savedOrder = localStorage.getItem('categoryOrder');
          if (savedOrder) {
            this.linkData.categoryOrder = JSON.parse(savedOrder);
          }
        } catch (e) {
          console.log('读取分类排序失败:', e);
        }
        
        // 测试查询
        try {
          const testQuery = await window.electronAPI.queryDatabase(
            "SELECT COUNT(*) as count FROM links", 
            []
          );
          console.log('链接计数:', testQuery);
        } catch (testError) {
          console.error('测试查询失败:', testError);
          // 如果测试查询失败，提前返回避免进一步错误
          return;
        }
        
        // 主查询
        try {
          // 先尝试使用sort_order
          const result = await window.electronAPI.queryDatabase(
            "SELECT *, COALESCE(sort_order, id*1000) AS effective_order FROM links ORDER BY category, effective_order, created_at DESC",
            []
          );
          
          // 检查查询结果是否有效
          if (!result) {
            console.error('查询返回空结果');
            this.linkData.links = []; 
            return;
          }
          
          if (!Array.isArray(result)) {
            console.error('查询返回非数组结果:', result);
            this.linkData.links = []; 
            return;
          }
          
          // 确保每个链接对象有id属性
          this.linkData.links = result.filter(link => link && typeof link.id !== 'undefined');
          console.log('过滤后的链接数量:', this.linkData.links.length);
        } catch (error) {
          console.warn('排序查询失败，使用基本查询:', error);
          
          try {
            // 回退到基本查询
            const result = await window.electronAPI.queryDatabase(
              "SELECT * FROM links ORDER BY category, created_at DESC", 
              []
            );
            
            // 安全检查
            if (Array.isArray(result)) {
              // 确保每个链接对象有id属性
              this.linkData.links = result.filter(link => link && typeof link.id !== 'undefined');
            } else {
              this.linkData.links = [];
            }
          } catch (fallbackError) {
            console.error('基本查询也失败:', fallbackError);
            this.linkData.links = []; // 设置为空数组
          }
        }
        
        // 确保是数组以防止渲染错误
        if (!Array.isArray(this.linkData.links)) {
          console.error('链接数据不是数组，重置为空数组');
          this.linkData.links = [];
        }
        
        console.log('加载了', this.linkData.links.length, '个链接');
        
        // 提取所有不同的分类
        if (this.linkData && typeof this.linkData.extractCategories === 'function') {
          this.linkData.categories = this.linkData.extractCategories(this.linkData.links);
        } else {
          // 手动提取分类
          const categoriesSet = new Set();
          this.linkData.links.forEach((link) => {
            if (link && link.category) categoriesSet.add(link.category);
          });
          this.linkData.categories = Array.from(categoriesSet);
        }
      } catch (error) {
        console.error("加载链接失败:", error);
        ElMessage.error("加载链接失败");
        
        // 确保设置了空数组
        this.linkData.links = [];
        this.linkData.categories = [];
      }
    },
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener("focus", this.focusBaiduSearch);
  }
};
</script>

<style>
@import "./App.css";

/* 仅保留 App.vue 特有的样式，其他样式已移至 App.css */
.app-header {
  margin: 20px 24px;
  width: calc(100% - 48px);
  max-width: 1200px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  padding: 16px 24px;
  box-sizing: border-box;
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(138, 92, 246, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 8px;
}

/* 百度搜索框样式 */
.baidu-search-container {
  width: calc(100% - 48px);
  max-width: 1200px;
  margin: 0 auto 16px;
  transition: transform 0.3s ease;
}

.baidu-search-container:focus-within {
  transform: scale(1.01);
}

.baidu-search-input .el-input__wrapper {
  border: 2px solid transparent;
  background-origin: border-box;
  background-clip: padding-box, border-box;
  background-image: linear-gradient(#fff, #fff),
    /* 内部填充 */ linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); /* 渐变边框 */
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(138, 92, 246, 0.12);
  padding-left: 5px;
  transition: all 0.3s ease;
}

.baidu-search-input .el-input__wrapper:hover {
  box-shadow: 0 6px 16px rgba(138, 92, 246, 0.18);
  background-image: linear-gradient(#fff, #fff),
    /* 内部填充 */ linear-gradient(135deg, #bfa7fa 0%, #9f75fb 100%); /* 更亮的渐变边框 */
}

.baidu-search-input .el-input__wrapper.is-focus {
  box-shadow: 0 8px 20px rgba(138, 92, 246, 0.25) !important;
  transform: translateY(-2px);
  background-image: linear-gradient(#fff, #fff),
    /* 内部填充 */ linear-gradient(135deg, #9f75fb 0%, #7c3aed 100%); /* 更深的渐变边框 */
}

.baidu-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.baidu-logo {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-radius: 50%;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(138, 92, 246, 0.25);
  transition: all 0.3s ease;
}

.baidu-search-input:hover .baidu-logo {
  box-shadow: 0 3px 8px rgba(138, 92, 246, 0.3);
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .baidu-search-container {
    width: calc(100% - 24px);
  }
}

/* 拖拽相关样式 */
.sortable-chosen {
  cursor: grabbing;
  /* 选中项样式 */
}

.sortable-drag {
  cursor: grabbing;
  opacity: 0.9;
}

.sortable-ghost {
  opacity: 0.5;
}

/* 加载和错误状态样式 */
.loading-container {
  width: calc(100% - 48px);
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.error-message {
  width: calc(100% - 48px);
  max-width: 1200px;
  margin: 40px auto;
}

.retry-btn {
  margin-top: 10px;
}

.empty-guide {
  width: calc(100% - 48px);
  max-width: 1200px;
  margin: 60px auto;
  text-align: center;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .loading-container,
  .error-message,
  .empty-guide {
    width: calc(100% - 24px);
  }
}
</style>
