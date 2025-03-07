<template>
  <el-dialog
    v-model="visible"
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
          <b>有效数据:</b> {{ validBulkCount }} 条
          <template v-if="bulkData.length > validBulkCount">
            | <b>重复数据:</b> {{ bulkData.length - validBulkCount }} 条
          </template>
        </p>
      </div>

      <div class="file-select-block">
        <el-button round type="primary" @click="onSelectFile">
          <el-icon><folder-opened /></el-icon> 选择JSON文件
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onCancel" round>取消</el-button>
        <el-button
          type="primary"
          @click="onConfirm"
          round
          :loading="isLoading"
          :disabled="validBulkCount === 0"
        >
          导入 {{ validBulkCount }} 条链接
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { InfoFilled, FolderOpened } from '@element-plus/icons-vue';

export default {
  name: 'BulkImportDialog',
  components: {
    InfoFilled,
    FolderOpened
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    bulkData: {
      type: Array,
      default: () => []
    },
    validBulkCount: {
      type: Number,
      default: 0
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'select-file', 'confirm', 'cancel'],
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  methods: {
    onSelectFile() {
      this.$emit('select-file');
    },
    onCancel() {
      this.$emit('cancel');
      this.visible = false;
    },
    onConfirm() {
      this.$emit('confirm');
    }
  }
}
</script>

<style scoped>
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

.dialog-footer {
  padding: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
