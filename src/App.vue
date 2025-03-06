<template>
  <div class="container">
    <!-- 自定义标题栏 -->
    <div class="title-bar">
      <div class="title-left">
        <span class="app-icon">∞</span>
        <span class="title-text">无限访问</span>
        <!-- 添加空白浏览器按钮 -->
        <el-button
          class="blank-browser-btn"
          type="text"
          size="small"
          @click="openBlankBrowser"
        >
          <el-tooltip
            content="打开空白浏览器"
            placement="bottom"
            effect="light"
          >
            <el-icon><Monitor /></el-icon>
          </el-tooltip>
        </el-button>
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

    <el-config-provider>
      <div class="app-header">
        <h1 class="app-title">无限访问</h1>
        <div class="header-actions">
          <!-- 优化美化数据管理按钮 -->
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

      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索链接..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select
          v-model="filterCategory"
          placeholder="筛选分类"
          clearable
          class="filter-select"
        >
          <el-option
            v-for="item in categories"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>

      <!-- 分类导航 - 添加全部选项和百度链接 -->
      <div class="category-nav" v-if="!filterCategory && !searchQuery">
        <div class="category-tabs">
          <!-- 全部选项 -->
          <button
            class="category-tab all-tab"
            :class="{ active: activeCategory === 'all' }"
            @click="activeCategory = 'all'"
          >
            全部
            <span class="category-count">{{ links.length }}</span>
          </button>

          <!-- 添加固定的百度链接 -->
          <button class="category-tab baidu-tab" @click="openBaiduSearch">
            百度
            <el-icon class="baidu-icon"><Search /></el-icon>
          </button>

          <button
            v-for="(group, category) in groupedLinks"
            :key="category"
            :class="['category-tab', { active: activeCategory === category }]"
            @click="activeCategory = category"
          >
            {{ category || "未分类" }}
            <span class="category-count">{{ group.length }}</span>
          </button>
        </div>
      </div>

      <!-- 分组显示卡片 -->
      <template v-if="!filterCategory && !searchQuery">
        <!-- 全部链接视图 -->
        <div v-if="activeCategory === 'all'" class="category-group">
          <h2 class="category-title">
            全部链接 <span class="category-count">{{ links.length }}</span>
          </h2>

          <div class="card-container">
            <el-tooltip
              v-for="link in links"
              :key="link.id"
              :content="link.url"
              placement="bottom"
              :show-after="300"
              effect="light"
              :offset="12"
            >
              <div class="capsule-card" @click="handleOpenLink(link.url)">
                <div class="site-icon">
                  <img
                    :src="getFaviconUrl(link.url)"
                    alt="图标"
                    class="favicon"
                    @error="handleImageError($event, link.url)"
                  />
                </div>

                <div class="card-content">
                  <div class="card-title">{{ link.title }}</div>
                </div>

                <div class="card-actions" @click.stop>
                  <el-tooltip
                    content="复制链接"
                    placement="bottom"
                    effect="light"
                  >
                    <el-button
                      circle
                      size="small"
                      @click="copyToClipboard(link.url)"
                      class="action-btn copy-btn"
                    >
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    content="编辑链接"
                    placement="bottom"
                    effect="light"
                  >
                    <el-button
                      circle
                      size="small"
                      @click.stop="editLink(link)"
                      class="action-btn edit-btn"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    content="删除链接"
                    placement="bottom"
                    effect="light"
                  >
                    <el-button
                      circle
                      size="small"
                      @click.stop="deleteLink(link.id)"
                      class="action-btn delete-btn"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </el-tooltip>
          </div>
        </div>

        <!-- 分类链接视图 -->
        <div
          v-for="(group, category) in groupedLinks"
          :key="category"
          v-show="activeCategory === category"
          class="category-group"
        >
          <h2 class="category-title">
            {{ category || "未分类" }}
            <span class="category-count">{{ group.length }}</span>
          </h2>

          <div class="card-container">
            <el-tooltip
              v-for="link in group"
              :key="link.id"
              :content="link.url"
              placement="bottom"
              :show-after="300"
              effect="light"
              :offset="12"
            >
              <!-- 修改：将点击事件移动到整个卡片 -->
              <div class="capsule-card" @click="handleOpenLink(link.url)">
                <div class="site-icon">
                  <img
                    :src="getFaviconUrl(link.url)"
                    alt="图标"
                    class="favicon"
                    @error="handleImageError($event, link.url)"
                  />
                </div>

                <div class="card-content">
                  <div class="card-title">{{ link.title }}</div>
                </div>

                <div class="card-actions" @click.stop>
                  <el-tooltip
                    content="复制链接"
                    placement="bottom"
                    effect="light"
                  >
                    <el-button
                      circle
                      size="small"
                      @click="copyToClipboard(link.url)"
                      class="action-btn copy-btn"
                    >
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    content="编辑链接"
                    placement="bottom"
                    effect="light"
                  >
                    <el-button
                      circle
                      size="small"
                      @click.stop="editLink(link)"
                      class="action-btn edit-btn"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    content="删除链接"
                    placement="bottom"
                    effect="light"
                  >
                    <el-button
                      circle
                      size="small"
                      @click.stop="deleteLink(link.id)"
                      class="action-btn delete-btn"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </el-tooltip>
          </div>
        </div>
      </template>

      <!-- 搜索/筛选结果 -->
      <div v-else class="card-container">
        <el-tooltip
          v-for="link in filteredLinks"
          :key="link.id"
          :content="link.url"
          placement="bottom"
          :show-after="300"
          effect="light"
          :offset="12"
        >
          <!-- 修改：将点击事件移动到整个卡片 -->
          <div class="capsule-card" @click="handleOpenLink(link.url)">
            <div class="site-icon">
              <img
                :src="getFaviconUrl(link.url)"
                alt="图标"
                class="favicon"
                @error="handleImageError($event, link.url)"
              />
            </div>

            <div class="card-content">
              <div class="card-title">{{ link.title }}</div>
              <div class="card-category">{{ link.category || "未分类" }}</div>
            </div>

            <div class="card-actions" @click.stop>
              <el-tooltip content="复制链接" placement="bottom" effect="light">
                <el-button
                  circle
                  size="small"
                  @click="copyToClipboard(link.url)"
                  class="action-btn copy-btn"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑链接" placement="bottom" effect="light">
                <el-button
                  circle
                  size="small"
                  @click.stop="editLink(link)"
                  class="action-btn edit-btn"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除链接" placement="bottom" effect="light">
                <el-button
                  circle
                  size="small"
                  @click.stop="deleteLink(link.id)"
                  class="action-btn delete-btn"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </el-tooltip>

        <div v-if="filteredLinks.length === 0" class="empty-state">
          <el-empty description="没有找到链接" />
        </div>
      </div>

      <!-- 优化添加链接对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="isEditing ? '编辑链接' : '添加链接'"
        width="480px"
        class="custom-dialog"
        :close-icon="Close"
      >
        <div class="dialog-content">
          <!-- 简化表单头部 -->
          <div class="form-header-compact" v-if="!isEditing">
            <div class="form-icon-compact">
              <el-icon class="header-icon"><Link /></el-icon>
            </div>
            <div class="header-text">
              <h3 class="form-title">快速添加链接</h3>
              <p class="form-description">保存您常用的网址，一键访问</p>
            </div>
          </div>

          <el-form
            :model="newLink"
            label-position="top"
            class="custom-form compact-form"
          >
            <el-form-item label="链接标题">
              <el-input
                v-model="newLink.title"
                placeholder="输入链接标题"
                class="rounded-input"
              />
            </el-form-item>

            <el-form-item label="链接地址">
              <el-input
                v-model="newLink.url"
                placeholder="https://example.com"
                class="rounded-input"
              />
              <div class="form-tip">将自动添加 https:// 前缀</div>
            </el-form-item>

            <!-- 将分类和图标预览分成两行 - 移除form-row -->
            <el-form-item label="分类">
              <el-select
                v-model="newLink.category"
                placeholder="选择或创建分类"
                filterable
                allow-create
                default-first-option
                class="full-width rounded-input"
              >
                <el-option
                  v-for="item in categories"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>

            <!-- 图标预览独立成行 -->
            <el-form-item label="图标预览" v-if="newLink.url">
              <div class="icon-preview">
                <img
                  :src="getFaviconUrl(newLink.url)"
                  @error="handleImageError($event, newLink.url)"
                  alt="图标预览"
                  class="preview-favicon"
                />
                <span class="preview-domain">{{
                  getDomainFromUrl(newLink.url)
                }}</span>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false" round class="cancel-btn"
              >取消</el-button
            >
            <el-button type="primary" @click="saveLink" round class="save-btn">
              {{ isEditing ? "保存更改" : "添加" }}
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 导入确认对话框 -->
      <el-dialog
        v-model="importDialogVisible"
        title="导入数据"
        width="480px"
        class="custom-dialog"
      >
        <div class="import-content">
          <div class="alert-box">
            <el-alert type="warning" :closable="false" show-icon>
              <p>注意: 导入操作将替换当前所有数据，请确认！</p>
            </el-alert>
          </div>

          <div class="import-summary">
            <p><strong>链接数量:</strong> {{ importData.length || 0 }}</p>
            <p><strong>分类数量:</strong> {{ importCategories.length || 0 }}</p>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="importDialogVisible = false" round
              >取消</el-button
            >
            <el-button
              type="primary"
              @click="confirmImport"
              round
              :loading="importing"
            >
              确认导入
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 批量导入对话框 -->
      <el-dialog
        v-model="bulkImportDialogVisible"
        title="批量导入链接"
        width="520px"
        class="custom-dialog"
      >
        <div class="bulk-import-content">
          <div class="format-example">
            <p class="format-title">
              <el-icon style="margin-right: 6px"><info-filled /></el-icon>
              请使用正确的JSON格式
            </p>
            <div class="code-block">
              <pre><code>[
  {
    "title": "链接标题1",
    "url": "https://example.com",
    "category": "分类名称"
  },
  {
    "title": "链接标题2",
    "url": "https://example2.com",
    "category": "另一个分类"
  }
]</code></pre>
            </div>
          </div>

          <div class="info-block" v-if="bulkData.length > 0">
            <p><b>已选择:</b> {{ bulkData.length }} 条链接</p>
            <p>
              <b>有效数据:</b> {{ validBulkData.length }} 条 | <b>重复数据:</b>
              {{ bulkData.length - validBulkData.length }} 条
            </p>
          </div>

          <div class="file-select-block">
            <el-button round type="primary" @click="selectBulkJsonFile">
              <el-icon><folder-opened /></el-icon> 选择JSON文件
            </el-button>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="bulkImportDialogVisible = false" round
              >取消</el-button
            >
            <el-button
              type="primary"
              @click="confirmBulkImport"
              round
              :loading="bulkImporting"
              :disabled="validBulkData.length === 0"
            >
              导入 {{ validBulkData.length }} 条链接
            </el-button>
          </div>
        </template>
      </el-dialog>
    </el-config-provider>
  </div>
</template>

<script>
import {
  Plus,
  Edit,
  Delete,
  Search,
  CopyDocument,
  Success,
  Document,
  Link,
  Close,
  Download,
  Upload,
  Files,
  ArrowDown,
  QuestionFilled,
  InfoFilled,
  FolderOpened,
  Monitor,
} from "@element-plus/icons-vue";
import { ElMessageBox, ElMessage } from "element-plus";

export default {
  components: {
    Plus,
    Edit,
    Delete,
    Search,
    CopyDocument,
    Success,
    Document,
    Link,
    Close,
    Download,
    Upload,
    Files,
    ArrowDown,
    QuestionFilled,
    InfoFilled,
    FolderOpened,
    Monitor, // 添加新的图标组件
  },
  data() {
    return {
      links: [],
      dialogVisible: false,
      newLink: {
        id: null,
        title: "",
        url: "",
        category: "",
      },
      isEditing: false,
      searchQuery: "",
      filterCategory: "",
      categories: [],
      faviconCache: {},
      activeCategory: "all", // 默认选中"全部"
      // 导入导出相关
      importDialogVisible: false,
      importData: [],
      importing: false,

      // 批量导入相关
      bulkImportDialogVisible: false,
      bulkData: [],
      bulkImporting: false,
      previousActiveCategory: "all", // 存储上一次选中的分类
    };
  },
  computed: {
    filteredLinks() {
      let result = this.links;

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(
          (link) =>
            link.title.toLowerCase().includes(query) ||
            link.url.toLowerCase().includes(query) ||
            (link.category && link.category.toLowerCase().includes(query))
        );
      }

      // 分类过滤
      if (this.filterCategory) {
        result = result.filter((link) => link.category === this.filterCategory);
      }

      return result;
    },
    // 按分类分组链接
    groupedLinks() {
      const groups = {};

      this.links.forEach((link) => {
        const category = link.category || "未分类";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(link);
      });

      return groups;
    },
    // 导入分类
    importCategories() {
      if (!this.importData || this.importData.length === 0) {
        return [];
      }

      const categories = new Set();
      this.importData.forEach((link) => {
        if (link.category) {
          categories.add(link.category);
        }
      });

      return Array.from(categories);
    },

    // 有效的批量导入数据（去重后）
    validBulkData() {
      if (!this.bulkData || this.bulkData.length === 0) {
        return [];
      }

      // 首先过滤出有效数据（有title和url的数据）
      const validData = this.bulkData.filter(
        (item) =>
          item &&
          item.title &&
          item.url &&
          typeof item.title === "string" &&
          typeof item.url === "string"
      );

      // 合并现有链接检查重复
      const existingUrls = new Set(
        this.links.map((link) => this.normalizeUrl(link.url))
      );
      const existingTitlesWithCategories = new Set(
        this.links.map(
          (link) =>
            `${link.title.toLowerCase()}|${(link.category || "").toLowerCase()}`
        )
      );

      // 去重
      return validData.filter((item) => {
        const normalizedUrl = this.normalizeUrl(item.url);
        const titleCategoryKey = `${item.title.toLowerCase()}|${(
          item.category || ""
        ).toLowerCase()}`;

        // 如果URL或者标题+分类组合已存在，则认为是重复的
        return (
          !existingUrls.has(normalizedUrl) &&
          !existingTitlesWithCategories.has(titleCategoryKey)
        );
      });
    },
  },
  watch: {
    // 监听分组数据变化，设置活动分类
    groupedLinks: {
      immediate: true,
      handler(newGroups) {
        // 只有在初始化或当前激活分类不在新分组中时才改变激活分类
        if (
          !this.activeCategory ||
          (this.activeCategory !== "all" && !newGroups[this.activeCategory])
        ) {
          // 尝试恢复之前的分类，如果不存在则使用第一个或默认为'all'
          if (
            this.previousActiveCategory &&
            (this.previousActiveCategory === "all" ||
              newGroups[this.previousActiveCategory])
          ) {
            this.activeCategory = this.previousActiveCategory;
          } else {
            const categories = Object.keys(newGroups);
            this.activeCategory = categories.length > 0 ? "all" : "all";
          }
        }
      },
    },
  },
  mounted() {
    this.loadLinks();
    // 修改页面标题
    document.title = "无限访问";

    // 添加菜单处理器
    window.electronAPI.onMenuExport(() => {
      this.exportData();
    });

    window.electronAPI.onMenuImport(() => {
      this.importDataAction();
    });

    // 添加来自托盘菜单的"添加链接"处理
    window.electronAPI.onMenuAddLink(() => {
      this.showAddLinkDialog();
    });
  },
  methods: {
    async loadLinks() {
      try {
        this.links = await window.electronAPI.queryDatabase(
          "SELECT * FROM links ORDER BY created_at DESC",
          []
        );
        // 提取所有不同的分类
        this.extractCategories();
      } catch (error) {
        console.error("加载链接失败:", error);
        ElMessage.error("加载链接失败");
      }
    },
    extractCategories() {
      const categoriesSet = new Set();
      this.links.forEach((link) => {
        if (link.category) categoriesSet.add(link.category);
      });
      this.categories = Array.from(categoriesSet);
    },
    showAddLinkDialog() {
      this.isEditing = false;
      this.newLink = { id: null, title: "", url: "", category: "" };
      this.dialogVisible = true;
    },
    editLink(link) {
      this.isEditing = true;
      this.newLink = { ...link };
      this.dialogVisible = true;
    },
    async saveLink() {
      if (!this.newLink.title || !this.newLink.url) {
        ElMessage.warning("标题和链接地址不能为空");
        return;
      }

      // 保存当前选中的分类
      this.previousActiveCategory = this.activeCategory;

      // 自动添加协议头
      if (!this.newLink.url.match(/^https?:\/\//i)) {
        this.newLink.url = "https://" + this.newLink.url;
      }

      try {
        if (this.isEditing) {
          // 更新现有链接
          await window.electronAPI.executeDatabase(
            "UPDATE links SET title = ?, url = ?, category = ? WHERE id = ?",
            [
              this.newLink.title,
              this.newLink.url,
              this.newLink.category,
              this.newLink.id,
            ]
          );
          ElMessage.success("更新成功");
        } else {
          // 添加新链接
          await window.electronAPI.executeDatabase(
            "INSERT INTO links (title, url, category) VALUES (?, ?, ?)",
            [this.newLink.title, this.newLink.url, this.newLink.category]
          );
          ElMessage.success("添加成功");
        }
        this.dialogVisible = false;
        this.loadLinks();
      } catch (error) {
        console.error("保存链接失败:", error);
        ElMessage.error("保存链接失败");
      }
    },
    async deleteLink(id) {
      try {
        await ElMessageBox.confirm("确定删除此链接?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        await window.electronAPI.executeDatabase(
          "DELETE FROM links WHERE id = ?",
          [id]
        );
        ElMessage.success("删除成功");
        this.loadLinks();
      } catch (error) {
        if (error !== "cancel") {
          console.error("删除链接失败:", error);
          ElMessage.error("删除链接失败");
        }
      }
    },
    openLink(url) {
      if (!url) {
        ElMessage.error("链接地址无效");
        return;
      }

      // 确保有协议头
      const formattedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;

      console.log("尝试打开链接:", formattedUrl);

      // 使用Electron的shell.openExternal API
      window.electronAPI
        .openExternal(formattedUrl)
        .then(() => {
          console.log("链接已在系统默认浏览器中打开");
        })
        .catch((error) => {
          console.error("打开链接失败:", error);
          ElMessage.error("无法打开链接，请检查URL是否有效");
        });
    },
    copyLinkToClipboard(url) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          ElMessage({
            message: "链接已复制到剪贴板",
            type: "success",
            icon: markRaw(Success),
            duration: 1500,
          });
        })
        .catch((err) => {
          console.error("复制失败:", err);
          ElMessage.error("复制链接失败");
        });
    },
    getFaviconUrl(url) {
      if (!url) return this.getDefaultIcon();

      try {
        // 从URL提取域名
        const domain = this.getDomainFromUrl(url);
        if (!domain) return this.getDefaultIcon();

        // 检查缓存
        if (this.faviconCache[domain]) {
          return this.faviconCache[domain];
        }

        // 优先使用国内更快的网站图标服务
        // 直接从站点获取favicon - 速度通常最快
        return `https://${domain}/favicon.ico`;
      } catch (error) {
        return this.getDefaultIcon();
      }
    },

    handleImageError(event, url) {
      const domain = this.getDomainFromUrl(url);
      if (!domain) {
        event.target.src = this.getDefaultIcon();
        return;
      }

      const imgSrc = event.target.src;

      // 优化图标获取顺序，优先使用速度更快的服务
      if (imgSrc.includes("/favicon.ico")) {
        // 备选方案1: 尝试获取站点根目录下不同格式的图标
        const rootIconUrl = `https://${domain}/apple-touch-icon.png`;
        event.target.src = rootIconUrl;
        this.faviconCache[domain] = rootIconUrl;
      } else if (imgSrc.includes("apple-touch-icon.png")) {
        // 备选方案2: 尝试另一种常见的图标路径
        const altIconUrl = `https://${domain}/touch-icon.png`;
        event.target.src = altIconUrl;
        this.faviconCache[domain] = altIconUrl;
      } else if (imgSrc.includes("touch-icon.png")) {
        // 备选方案3: 使用国内CDN的服务 (此处为示例，可能需要替换为实际可用的服务)
        // 使用 bytedance 的静态资源加速服务 - 可选
        const iconCdnUrl = `https://lf-cdn-tos.bytescm.com/obj/static/webinfra/favicon-radar/${domain}.png`;
        event.target.src = iconCdnUrl;
        this.faviconCache[domain] = iconCdnUrl;
      } else if (imgSrc.includes("bytescm.com")) {
        // 备选方案4: 尝试Google服务
        const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        event.target.src = googleFaviconUrl;
        this.faviconCache[domain] = googleFaviconUrl;
      } else if (imgSrc.includes("google.com/s2")) {
        // 备选方案5: 使用基于HTML5的内联SVG图标 (域名首字母)
        event.target.src = this.generateTextBasedIcon(domain);
        this.faviconCache[domain] = this.generateTextBasedIcon(domain);
      } else {
        // 所有方法都失败，使用默认图标
        event.target.src = this.getDefaultIcon();
        this.faviconCache[domain] = this.getDefaultIcon();
      }
    },

    // 新增：根据域名生成文字图标
    generateTextBasedIcon(domain) {
      try {
        // 获取域名的首字母，转为大写
        let initial = domain.charAt(0).toUpperCase();

        // 如果不是字母，则使用'#'符号
        if (!/[A-Za-z]/.test(initial)) {
          initial = "#";
        }

        // 根据域名生成一个固定的颜色
        const colors = [
          "#8b5cf6",
          "#ec4899",
          "#ef4444",
          "#f59e0b",
          "#10b981",
          "#06b6d4",
          "#3b82f6",
          "#6366f1",
        ];

        // 使用域名的字符编码和来计算一个一致的颜色索引
        let sum = 0;
        for (let i = 0; i < domain.length; i++) {
          sum += domain.charCodeAt(i);
        }
        const colorIndex = sum % colors.length;
        const bgColor = colors[colorIndex];

        // 创建SVG图标
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
            <rect width="40" height="40" rx="20" fill="${bgColor}"/>
            <text x="50%" y="53%" text-anchor="middle" dy=".1em" fill="white" font-family="Arial" font-weight="bold" font-size="20">
              ${initial}
            </text>
          </svg>
        `;

        // 转换为Base64编码的Data URL
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      } catch (error) {
        console.error("生成文字图标失败:", error);
        return this.getDefaultIcon();
      }
    },

    getDefaultIcon() {
      return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzhiNWNmNiI+PHBhdGggZD0iTTExLjk5IDJDNi40NyAyIDIgNi40OCAyIDEyczcuNDYgMTAgMTAgMTBjNS41MiAwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMS45OSAyek0xMiAyMGMtNC40MiAwLTgtMy41OC04LThzMy41OC04IDgtOCA4IDMuNTggOCA4LTMuNTggOC04IDh6bS42NS0xMC43NWMuMTEtLjU1LS4xNS0xLjEtLjY5LTEuMy0uNTMtLjE5LTEuMTIuMDgtMS4zMi42MS0uMTkuNTMuMDkgMS4xMS42MiAxLjMuNTMuMTkgMS4xMS0uMDkgMS4zLS42MS4wMy0uMDYuMDQtLjEyLjA1LS4xOHY5LjRjMCAuMzguMzEuNjkuNjkuNjlzLjY5LS4zMS42OS0uNjlWOS4yNXpNMTIgNmMtLjU1IDAtMS0uNDUtMS0xcy40NS0xIDEtMSAxIC40NSAxIDEtLjQ1IDEtMS0uNDUgMS0xIDF6Ii8+PC9zdmc+";
    },
    getDomainFromUrl(url) {
      try {
        // 确保URL有协议头
        if (!url.match(/^https?:\/\//i)) {
          url = "https://" + url;
        }
        // 提取域名
        return new URL(url).hostname;
      } catch (error) {
        return "";
      }
    },
    // 修正：复制链接方法
    copyToClipboard(text) {
      // 使用传统的document.execCommand方法复制
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed"; // 避免滚动
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          ElMessage({
            message: "链接已复制到剪贴板",
            type: "success",
            duration: 1500,
          });
        } else {
          throw new Error("复制操作被拒绝");
        }
      } catch (err) {
        console.error("复制失败:", err);
        ElMessage.error("复制链接失败");
      }

      document.body.removeChild(textarea);
    },
    handleOpenLink(url) {
      if (!url) {
        ElMessage.error("链接地址无效");
        return;
      }

      // 确保URL格式正确
      const formattedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;

      console.log("打开链接:", formattedUrl);

      // 不再立即显示成功提示，而是等待Promise完成后再显示
      window.electronAPI.openExternal(formattedUrl).catch((error) => {
        console.error("打开链接失败:", error);

        // 尝试备用方法
        try {
          window.open(formattedUrl, "_blank", "noopener");
        } catch (backupError) {
          ElMessage.error("无法打开链接，请检查URL是否有效");
        }
      });
    },
    // 窗口控制方法
    minimizeWindow() {
      window.electronAPI.minimizeWindow();
    },

    closeWindow() {
      window.electronAPI.closeWindow();
    },
    // 处理数据管理下拉菜单操作
    async handleDataAction(command) {
      switch (command) {
        case "export":
          this.exportData();
          break;
        case "import":
          this.importDataAction();
          break;
        case "bulk":
          this.showBulkImport();
          break;
      }
    },

    // 导出数据
    async exportData() {
      try {
        // 获取所有链接数据
        const links = await window.electronAPI.queryDatabase(
          "SELECT * FROM links",
          []
        );

        if (links.length === 0) {
          ElMessage.warning("没有数据可导出");
          return;
        }

        const result = await window.electronAPI.exportData(links);

        if (result.success) {
          ElMessage.success(`数据已导出到: ${result.path}`);
        } else {
          ElMessage.info(result.message);
        }
      } catch (error) {
        console.error("导出数据失败:", error);
        ElMessage.error("导出数据失败");
      }
    },

    // 导入数据
    async importDataAction() {
      try {
        const result = await window.electronAPI.importData();

        if (!result.success) {
          if (result.message !== "已取消导入") {
            ElMessage.error(result.message);
          }
          return;
        }

        this.importData = result.data;
        this.importDialogVisible = true;
      } catch (error) {
        console.error("导入数据失败:", error);
        ElMessage.error("导入数据失败");
      }
    },

    // 确认导入数据
    async confirmImport() {
      if (!this.importData || this.importData.length === 0) {
        ElMessage.warning("没有有效的导入数据");
        return;
      }

      try {
        this.importing = true;

        // 清空当前数据
        await window.electronAPI.executeDatabase("DELETE FROM links", []);

        // 批量插入数据
        for (const link of this.importData) {
          await window.electronAPI.executeDatabase(
            "INSERT INTO links (id, title, url, category, created_at) VALUES (?, ?, ?, ?, ?)",
            [
              link.id,
              link.title,
              link.url,
              link.category || null,
              link.created_at || new Date().toISOString(),
            ]
          );
        }

        ElMessage.success(`成功导入 ${this.importData.length} 条链接`);
        this.importDialogVisible = false;
        this.importData = [];

        // 重新加载数据
        await this.loadLinks();
      } catch (error) {
        console.error("导入数据失败:", error);
        ElMessage.error("导入数据失败");
      } finally {
        this.importing = false;
      }
    },

    // 显示批量导入对话框
    showBulkImport() {
      this.bulkData = [];
      this.bulkImportDialogVisible = true;
    },

    // 选择批量导入的JSON文件
    async selectBulkJsonFile() {
      try {
        const result = await window.electronAPI.readJsonFile();

        if (!result.success) {
          if (result.message !== "已取消选择") {
            ElMessage.error(result.message);
          }
          return;
        }

        // 验证数据格式
        if (!Array.isArray(result.data)) {
          ElMessage.error("无效的JSON格式，应为链接对象数组");
          return;
        }

        this.bulkData = result.data;

        if (this.validBulkData.length === 0) {
          ElMessage.warning("未找到有效的链接数据或所有链接已存在");
        } else {
          ElMessage.success(`找到 ${this.validBulkData.length} 条可导入的链接`);
        }
      } catch (error) {
        console.error("读取JSON文件失败:", error);
        ElMessage.error("读取JSON文件失败");
      }
    },

    // 确认批量导入
    async confirmBulkImport() {
      if (this.validBulkData.length === 0) {
        ElMessage.warning("没有有效的链接数据可导入");
        return;
      }

      try {
        this.bulkImporting = true;

        // 批量插入数据
        for (const link of this.validBulkData) {
          await window.electronAPI.executeDatabase(
            "INSERT INTO links (title, url, category) VALUES (?, ?, ?)",
            [link.title, link.url, link.category || null]
          );
        }

        ElMessage.success(`成功导入 ${this.validBulkData.length} 条链接`);
        this.bulkImportDialogVisible = false;
        this.bulkData = [];

        // 重新加载数据
        await this.loadLinks();
      } catch (error) {
        console.error("批量导入失败:", error);
        ElMessage.error("批量导入失败");
      } finally {
        this.bulkImporting = false;
      }
    },

    // 标准化URL以用于比较
    normalizeUrl(url) {
      if (!url) return "";

      // 确保有协议
      let normalizedUrl = url;
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      try {
        // 解析URL
        const parsed = new URL(normalizedUrl);
        // 移除尾部斜杠，简化为小写进行比较
        return (
          (parsed.origin + parsed.pathname).replace(/\/$/, "").toLowerCase() +
          parsed.search
        );
      } catch (e) {
        return normalizedUrl.toLowerCase();
      }
    },

    // 添加一个关于菜单项的方法
    showAbout() {
      window.electronAPI.showAbout();
    },

    // 新增：打开空白浏览器
    openBlankBrowser() {
      window.electronAPI
        .openExternal("about:blank")
        .then(() => {
          console.log("已打开空白浏览器");
        })
        .catch((error) => {
          console.error("打开浏览器失败:", error);
          // 备用URL
          window.electronAPI
            .openExternal("https://www.google.com")
            .catch((err) => {
              ElMessage.error("无法打开浏览器，请检查您的系统设置");
            });
        });
    },

    // 新增：打开百度搜索
    openBaiduSearch() {
      this.handleOpenLink("https://www.baidu.com");
    },
  },
};
</script>

<style>
/* 无边框窗口的标题栏样式 */
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

/* 调整容器以适应新标题栏和添加边距 */
.container {
  padding: 0;
  max-width: none;
  margin: 0;
  background-color: #f9f7fd;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; /* 防止右侧出现白色边框 */
}

/* 内容区域容器 - 确保两侧有边距 */
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  box-sizing: border-box;
}

/* 调整应用头部位置和样式 */
.app-header {
  margin: 20px auto;
  width: calc(100% - 48px); /* 确保两侧边距 */
  max-width: 1200px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  padding: 16px 24px;
  border-radius: 24px; /* 更大的圆角 */
  box-shadow: 0 8px 20px rgba(138, 92, 246, 0.15); /* 更柔和的阴影 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 搜索栏和内容区域布局 */
.search-bar,
.category-nav,
.category-title,
.empty-state {
  width: calc(100% - 48px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

/* 卡片容器更紧凑的布局 */
.card-container {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(250px, 1fr)
  ); /* 更小的卡片宽度 */
  gap: 16px;
  width: calc(100% - 48px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

/* 药丸形状的卡片样式 - 更可爱的风格 */
.capsule-card {
  background: white;
  border-radius: 20px; /* 更大的圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  padding: 8px 10px 8px 8px; /* 减小水平内边距 */
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid #e9e5f8;
  display: flex;
  align-items: center;
  height: 44px; /* 稍微小一点的高度 */
  overflow: hidden;
  cursor: pointer;
}

.capsule-card:hover {
  transform: translateY(-3px) scale(1.02); /* 轻微放大效果 */
  box-shadow: 0 8px 20px rgba(138, 92, 246, 0.12);
  border-color: #d8b4fe;
}

/* 图标容器更可爱的样式 */
.site-icon {
  width: 30px; /* 减小宽度 */
  height: 30px; /* 减小高度 */
  border-radius: 50%;
  margin-right: 8px; /* 减小右边距 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #d8b4fe; /* 更浅的紫色背景 */
  flex-shrink: 0;
  border: 1px solid #e9e5f8;
}

.favicon {
  width: 20px; /* 减小图标大小 */
  height: 20px;
  object-fit: contain;
}

/* 更好看的卡片标题 */
.card-title {
  font-weight: 600;
  font-size: 0.9rem; /* 稍微小一点的字体 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
  background-image: linear-gradient(45deg, #4b5563, #8b5cf6); /* 更紫色的渐变 */
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 更可爱的分类标签 */
.card-category {
  display: inline-block;
  background: #f3e8ff;
  color: #8b5cf6;
  padding: 1px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  margin-top: 4px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 按钮样式更可爱化 */
.action-btn {
  width: 20px !important; /* 更小的按钮 */
  height: 20px !important;
  padding: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  font-size: 10px !important;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.15); /* 悬浮时轻微放大 */
}

/* 美化分类导航 */
.category-nav {
  margin-bottom: 24px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 5px 0;
}

.category-tabs {
  display: flex;
  gap: 12px;
  padding: 5px 0;
}

.category-tab {
  background: white;
  border: 2px solid #e9e5f8;
  border-radius: 20px;
  padding: 7px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.category-tab:hover {
  border-color: #d8b4fe;
  color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(138, 92, 246, 0.1);
}

.category-tab.active {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 6px 14px rgba(138, 92, 246, 0.18);
}

.all-tab {
  background: #f3e8ff;
  border-color: #d8b4fe;
  color: #8b5cf6;
}

.all-tab.active {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
}

/* 美化数据管理按钮 */
.data-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  color: #8b5cf6;
  border-color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  padding: 8px 16px;
}

.data-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  color: #7c3aed; /* 更深的紫色，悬浮时更清晰 */
}

/* 优化添加按钮样式 */
.add-btn {
  background: white;
  color: #8b5cf6;
  border: none;
  font-weight: bold;
  transition: all 0.3s ease;
  padding: 8px 16px;
  margin-left: 10px;
}

.add-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  color: #7c3aed;
}

/* 修复对话框样式 */
.custom-dialog .el-dialog {
  margin: auto !important;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-container {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  }

  .search-bar {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .app-header {
    width: calc(100% - 24px);
    padding: 14px 18px;
  }

  .search-bar,
  .category-nav,
  .card-container,
  .category-title,
  .empty-state {
    width: calc(100% - 24px);
  }
}

/* 其余保持不变，确保主题风格一致性 */
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

/* 调整容器以适应新标题栏 */
.container {
  padding: 0;
  max-width: none;
  margin: 0;
  background-color: #f9f7fd;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; /* 防止右侧出现白色边框 */
}

/* 调整应用头部位置 */
.app-header {
  margin-left: 20px;
  margin-right: 20px;
  margin-top: 20px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  padding: 16px 24px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(138, 92, 246, 0.15);
}

.app-title {
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.add-btn {
  background: white;
  color: #8b5cf6;
  border: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  color: #7c3aed;
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
  gap: 16px; /* 增加间距 */
  align-items: stretch;
}

.search-input {
  flex: 3; /* 调整搜索框宽度比例 */
}

.filter-select {
  flex: 2; /* 增加分类筛选框的宽度比例 */
  min-width: 200px; /* 设置最小宽度 */
}

.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

/* 药丸形状的卡片样式 */
.capsule-card {
  background: white;
  border-radius: 9999px; /* 药丸形状 */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 8px 12px 8px 8px;
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid #e9e5f8;
  display: flex;
  align-items: center;
  height: 50px; /* 固定高度更像胶囊 */
  overflow: hidden;
  cursor: pointer; /* 确保整个卡片显示为可点击状态 */
}

.capsule-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(138, 92, 246, 0.15);
  border-color: #d8b4fe;
}

.site-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  flex-shrink: 0;
}

.favicon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.card-content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
}

.card-title {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
  background: linear-gradient(45deg, #4b5563, #6366f1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent; /* 修复透明文本 */
}

.card-category {
  display: inline-block;
  background: #f3e8ff;
  color: #8b5cf6;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  margin-top: 4px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  gap: 5px;
  transition: opacity 0.2s ease;
  margin-left: 8px;
}

.action-btn {
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  font-size: 12px !important;
}

.action-btn .el-icon {
  font-size: 12px !important;
}

.copy-btn {
  color: #10b981;
  border-color: #10b981;
}

.edit-btn {
  color: #3b82f6;
  border-color: #3b82f6;
}

.delete-btn {
  color: #ef4444;
  border-color: #ef4444;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 40px 0;
}

.full-width {
  width: 100%;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  width: 100%;
}

.preview-favicon {
  width: 24px;
  height: 24px;
}

.preview-domain {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.copy-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.copy-icon {
  font-size: 32px;
  color: #10b981;
  margin-bottom: 10px;
}

.el-dialog {
  border-radius: 20px;
  overflow: hidden;
}

.el-input__wrapper,
.el-button {
  border-radius: 10px;
}

@media (max-width: 768px) {
  .card-container {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}

/* 分类导航样式 */
.category-nav {
  margin-bottom: 20px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.category-tabs {
  display: flex;
  gap: 10px;
  padding: 5px 0;
}

.category-tab {
  background: white;
  border: 2px solid #e9e5f8;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.category-tab:hover {
  border-color: #d8b4fe;
  color: #8b5cf6;
}

.category-tab.active {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 12px rgba(138, 92, 246, 0.15);
}

.category-count {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.7rem;
  margin-left: 8px;
}

.category-tab.active .category-count {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.category-title {
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: #4b5563;
  padding-bottom: 8px;
  border-bottom: 2px dashed #e9e5f8;
  display: flex;
  align-items: center;
}

.category-title .category-count {
  background-color: #f3e8ff;
  color: #8b5cf6;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.8rem;
  margin-left: 10px;
}

.category-group {
  margin-bottom: 30px;
}

/* 修复颜色透明问题 */
.card-title {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
  background-image: linear-gradient(45deg, #4b5563, #6366f1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 确保在Safari中也能正常显示 */
@media not all and (min-resolution: 0.001dpcm) {
  @supports (-webkit-appearance: none) {
    .card-title {
      color: #4b5563;
      background: none;
    }
  }
}

/* 美化表单和对话框样式 */
.custom-dialog .el-dialog__header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.custom-dialog .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
}

.custom-dialog .el-dialog__headerbtn {
  top: 14px;
  right: 16px;
}

.custom-dialog .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.custom-dialog .el-dialog__body {
  padding: 20px;
}

.dialog-content {
  padding: 0;
}

/* 紧凑型表单头部 */
.form-header-compact {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background-color: rgba(139, 92, 246, 0.05);
  padding: 12px;
  border-radius: 10px;
  border-left: 4px solid #8b5cf6;
}

.form-icon-compact {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #bfa7fa 0%, #9f75fb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.form-title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
  color: #4b5563;
}

.form-description {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.compact-form .el-form-item {
  margin-bottom: 15px;
}

/* 表单两列布局 */
.form-row {
  gap: 15px;
  align-items: flex-start;
}

.category-item,
.preview-item {
  width: 100%;
}

.icon-preview-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 10px;
}

.preview-domain {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 确保操作按钮区在卡片悬浮时显示 */
.capsule-card .card-actions {
  opacity: 0.2;
  transition: opacity 0.2s ease;
}

.capsule-card:hover .card-actions {
  opacity: 1;
}

.dialog-footer {
  padding: 0;
  margin-top: -10px;
}

/* 确保操作按钮的tooltip正常显示 */
.card-actions .el-tooltip {
  display: inline-block;
}

/* 应用头部修改 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 8px; /* 添加右边距 */
}

/* 导入对话框样式 */
.import-content {
  padding: 10px 0;
}

.alert-box {
  margin-bottom: 20px;
}

.import-summary {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  font-size: 14px;
}

.import-summary p {
  margin: 6px 0;
}

/* 批量导入对话框样式 */
.bulk-import-content {
  padding: 10px 0;
}

.format-example {
  margin-bottom: 20px;
}

.format-title {
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.code-block {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  overflow: auto;
  max-height: 200px;
}

.code-block pre {
  margin: 0;
  font-family: monospace;
  font-size: 0.9em;
}

.info-block {
  background-color: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 12px;
  margin: 20px 0;
  border-radius: 4px;
}

.info-block p {
  margin: 5px 0;
}

.file-select-block {
  display: flex;
  justify-content: center;
  padding: 15px 0;
}

/* 美化数据管理按钮和下拉菜单 */
.data-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.85);
  color: #8b5cf6;
  border-color: rgba(255, 255, 255, 0.3);
}

.data-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.custom-dropdown .dropdown-item {
  padding: 10px 15px;
}

.dropdown-item-with-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.info-icon {
  color: #8b5cf6;
  font-size: 14px;
  margin-left: 2px;
}

/* 保持现有主题风格 */
.custom-dropdown .el-dropdown-menu__item:hover:not(.is-disabled) {
  background-color: #f3e8ff;
}

.custom-dropdown .el-dropdown-menu__item i {
  margin-right: 8px;
  color: #8b5cf6;
}

/* 修复添加链接对话框引起的容器闪烁问题 */
.el-overlay {
  overflow: hidden;
}

.el-dialog__wrapper {
  overflow: hidden;
}

.custom-dialog .el-dialog {
  margin: auto !important; /* 防止对话框偏移导致的闪烁 */
}

/* 优化对话框保存按钮样式 */
.save-btn {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: 500 !important;
  padding: 10px 24px !important;
  transition: all 0.3s ease !important;
}

.save-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(138, 92, 246, 0.25) !important;
  opacity: 0.95 !important;
}

.cancel-btn {
  border-color: #d1d5db !important;
  color: #6b7280 !important;
  margin-right: 12px !important;
}

/* 空白浏览器按钮样式 */
.blank-browser-btn {
  margin-left: 12px;
  color: white !important;
  opacity: 0.8;
  transition: all 0.2s ease;
  padding: 4px 8px !important;
  height: auto !important;
  border-radius: 4px !important;
}

.blank-browser-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.15) !important;
  transform: translateY(-1px);
}

.blank-browser-btn .el-icon {
  margin-right: 0;
  font-size: 16px;
}

/* 百度导航样式 */
.baidu-tab {
  background: linear-gradient(135deg, #4285f4, #2962ff);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 5px;
}

.baidu-tab:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.25);
  border: none;
  color: white;
}

.baidu-icon {
  margin-left: 2px;
  font-size: 14px;
}
</style>
