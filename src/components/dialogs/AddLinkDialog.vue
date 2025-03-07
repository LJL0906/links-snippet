<template>
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑链接' : '添加链接'"
    width="480px"
    class="custom-dialog"
    :close-on-click-modal="false"
    @closed="$emit('closed')"
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
        :model="linkForm"
        label-position="top"
        class="custom-form compact-form"
      >
        <el-form-item label="链接标题">
          <el-input
            v-model="linkForm.title"
            placeholder="输入链接标题"
            class="rounded-input"
          />
        </el-form-item>

        <el-form-item label="链接地址">
          <el-input
            v-model="linkForm.url"
            placeholder="https://example.com"
            class="rounded-input"
          />
          <div class="form-tip">将自动添加 https:// 前缀</div>
        </el-form-item>

        <el-form-item label="分类">
          <el-select
            v-model="linkForm.category"
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

        <el-form-item label="图标预览" v-if="linkForm.url || linkForm.title">
          <div class="icon-preview">
            <img
              :src="faviconUrl"
              @error="onImageError"
              alt="图标预览"
              class="preview-favicon"
            />
            <span class="preview-domain">{{ previewText }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel" round class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="onSave" round class="save-btn">
          {{ isEditing ? "保存更改" : "添加" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { Link } from '@element-plus/icons-vue';
import { getFaviconUrl, handleImageError, getDomainFromUrl } from '../../utils/faviconUtils';

export default {
  name: 'AddLinkDialog',
  components: {
    Link
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    link: {
      type: Object,
      default: () => ({ id: null, title: '', url: '', category: '' })
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'save', 'closed'],
  data() {
    return {
      linkForm: { ...this.link },
      faviconCache: {}
    };
  },
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    faviconUrl() {
      return getFaviconUrl(this.linkForm.url, this.linkForm.title);
    },
    domain() {
      return getDomainFromUrl(this.linkForm.url) || '未知域名';
    },
    previewText() {
      return this.linkForm.title || this.domain;
    }
  },
  watch: {
    link: {
      handler(newLink) {
        this.linkForm = { ...newLink };
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    onImageError(event) {
      handleImageError(event);
    },
    onCancel() {
      this.visible = false;
    },
    onSave() {
      if (!this.linkForm.title || !this.linkForm.url) {
        this.$message.warning("标题和链接地址不能为空");
        return;
      }

      // 自动添加协议头
      if (!this.linkForm.url.match(/^https?:\/\//i)) {
        this.linkForm.url = "https://" + this.linkForm.url;
      }

      this.$emit('save', { ...this.linkForm });
      this.visible = false;
    }
  }
}
</script>

<style scoped>
.dialog-content {
  padding: 0;
}

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

.form-icon-compact .header-icon {
  color: white;
  font-size: 20px;
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

.form-tip {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.full-width {
  width: 100%;
}

.rounded-input {
  border-radius: 10px;
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

.dialog-footer {
  padding: 0;
  margin-top: -10px;
}

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
</style>
