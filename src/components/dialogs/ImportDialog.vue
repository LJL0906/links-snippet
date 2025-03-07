<template>
  <el-dialog
    v-model="visible"
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
        <p><strong>分类数量:</strong> {{ categories.length || 0 }}</p>
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
        >
          确认导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'ImportDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    importData: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    categories() {
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
    }
  },
  methods: {
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

.dialog-footer {
  padding: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
