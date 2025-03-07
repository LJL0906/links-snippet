<template>
  <!-- 确保链接对象有效 -->
  <template v-if="isValidLink">
    <el-tooltip
      :content="link.url"
      placement="bottom"
      :show-after="300"
      effect="light"
      :offset="12"
    >
      <div class="capsule-card" @click="onCardClick(link.url)">
        <!-- 增强拖拽把手 - 使整个左侧可拖拽 -->
        <!-- <div class="drag-handle-area" v-if="!showCategory">
          <div class="drag-handle-indicator">
            <span class="drag-dots">⋮⋮</span>
          </div>
        </div> -->

        <div class="site-icon">
          <img
            :src="safeIconUrl"
            alt="图标"
            class="favicon"
            ref="faviconImg"
            @error="onImageError"
          />
        </div>

        <div class="card-content">
          <div class="card-title">{{ link.title }}</div>
          <!-- <div v-if="showCategory" class="card-category">{{ link.category || "未分类" }}</div> -->
          <div class="card-actions">
            <el-tooltip content="复制链接" placement="bottom" effect="light">
              <el-button
                circle
                size="small"
                @click.stop="onCopy(link.url)"
                class="action-btn copy-btn"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="编辑链接" placement="bottom" effect="light">
              <el-button
                circle
                size="small"
                @click.stop="onEdit(link)"
                class="action-btn edit-btn"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除链接" placement="bottom" effect="light">
              <el-button
                circle
                size="small"
                @click.stop="onDelete(link.id)"
                class="action-btn delete-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </el-tooltip>
  </template>
</template>

<script>
import { CopyDocument, Edit, Delete } from "@element-plus/icons-vue";
import { copyToClipboard, handleOpenLink } from "../utils/linkUtils";
import {
  getFaviconUrl,
  handleImageError,
  getDomainFromUrl,
} from "../utils/faviconUtils";

export default {
  name: "LinkCard",
  components: {
    CopyDocument,
    Edit,
    Delete,
  },
  props: {
    link: {
      type: Object,
      required: true,
    },
    showCategory: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["edit", "delete"],
  data() {
    return {
      faviconCache: {},
    };
  },
  computed: {
    // 添加安全检查，确保链接对象有效
    isValidLink() {
      return (
        this.link &&
        typeof this.link === "object" &&
        typeof this.link.id !== "undefined" &&
        this.link.title &&
        this.link.url
      );
    },

    // 安全地获取图标URL
    safeIconUrl() {
      if (!this.isValidLink) return getDefaultIcon();
      return getFaviconUrl(this.link.url, this.link.title);
    },
  },
  mounted() {
    // 添加图标更新事件监听
    this.faviconUpdateListener = (event) => {
      // 检查是否与当前链接相关
      const domain = getDomainFromUrl(this.link.url);
      if (event.detail && event.detail.domain === domain) {
        // 使用refs而不是querySelector来获取图标元素
        if (this.$refs.faviconImg) {
          this.$refs.faviconImg.src = event.detail.iconUrl;
        }
      }
    };

    document.addEventListener("favicon-updated", this.faviconUpdateListener);
  },

  beforeUnmount() {
    // 清理事件监听
    document.removeEventListener("favicon-updated", this.faviconUpdateListener);
  },
  methods: {
    getFaviconUrl(url, title) {
      return getFaviconUrl(url, title);
    },
    onImageError(event) {
      handleImageError(event);
    },
    onCardClick(url) {
      handleOpenLink(url);
    },
    onCopy(url) {
      copyToClipboard(url);
    },
    onEdit(link) {
      this.$emit("edit", link);
    },
    onDelete(id) {
      this.$emit("delete", id);
    },
  },
};
</script>

<style scoped>
.capsule-card {
  background: white;
  border-radius: 9999px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 8px 12px 8px 8px;
  position: relative;
  transition: all 0.3s ease, cursor 0.1s;
  border: 2px solid #e9e5f8;
  display: flex;
  align-items: center;
  height: fit-content;
  max-height: 50px;
  overflow: hidden;
  cursor: pointer;
}

.capsule-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(138, 92, 246, 0.15);
  border-color: #d8b4fe;
}

.capsule-card:active {
  cursor: grabbing !important; /* 当卡片被拖动时改变鼠标样式 */
  transform: scale(1.02) !important;
  box-shadow: 0 8px 20px rgba(138, 92, 246, 0.25) !important;
}

.site-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6; /* 更浅的紫色背景 */
  flex-shrink: 0;
  border: 1px solid #e9e5f8;
}

.favicon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.card-content {
  width: fit-content;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
}

.card-title {
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
  background: linear-gradient(45deg, #4b5563, #6366f1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* .card-category {
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
} */

.card-actions {
  display: flex;
  transition: opacity 0.2s ease;
  margin-left: -3px;
  margin-right: 8px;
  opacity: 0.2;
}

.capsule-card:hover .card-actions {
  opacity: 1;
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

.action-btn:hover {
  transform: scale(1.15);
}

/* 添加拖拽区域 */
.drag-handle-area {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 36px; /* 更宽的拖拽区域 */
  cursor: grab;
  background: linear-gradient(90deg, rgba(243, 232, 255, 0.5), transparent);
  border-radius: 9999px 0 0 9999px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.capsule-card:hover .drag-handle-area {
  background: linear-gradient(90deg, rgba(216, 180, 254, 0.3), transparent);
}

.capsule-card .drag-handle-area:hover,
.capsule-card .drag-handle-area:active {
  background: linear-gradient(90deg, rgba(216, 180, 254, 0.6), transparent);
}

.drag-handle-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.drag-dots {
  color: #8b5cf6;
  font-weight: bold;
  font-size: 16px;
  transform: rotate(90deg);
}
</style>
