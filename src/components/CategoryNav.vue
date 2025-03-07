<template>
  <div class="category-nav">
    <div class="category-tabs">
      <!-- 全部选项 - 固定位置 -->
      <button
        class="category-tab all-tab"
        :class="{ active: activeCategory === 'all' }"
        @click="setActiveCategory('all')"
      >
        全部
        <span class="category-count">{{ totalLinks }}</span>
      </button>

      <!-- 分类列表 - 可拖拽排序 -->
      <draggable
        v-model="sortedCategories"
        item-key="category"
        :animation="200"
        ghost-class="ghost-category"
        handle=".drag-handle"
        @end="onCategorySorted"
        class="category-drag-container"
      >
        <template #item="{ element }">
          <button
            :class="[
              'category-tab',
              { active: activeCategory === element.category },
            ]"
            @click="setActiveCategory(element.category)"
          >
            <span class="drag-handle">⠿</span>
            <!-- 使用更明显的拖拽标识 -->
            {{ element.category || "未分类" }}
            <span class="category-count">{{ element.count }}</span>
          </button>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";

export default {
  name: "CategoryNav",
  components: {
    draggable,
  },
  props: {
    groupedLinks: {
      type: Object,
      required: true,
    },
    totalLinks: {
      type: Number,
      required: true,
    },
    modelValue: {
      type: String,
      default: "all",
    },
    categoryOrder: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue", "category-order-changed"],
  data() {
    return {
      sortedCategories: [],
    };
  },
  computed: {
    // 添加计算属性以支持v-model
    activeCategory: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  mounted() {
    // 初始化排序分类
    this.updateSortedCategories();
  },
  methods: {
    updateSortedCategories() {
      // 先按已有排序顺序创建映射
      const orderMap = new Map();
      this.categoryOrder.forEach((cat, index) => {
        orderMap.set(cat, index);
      });

      // 转换为可排序的数组
      const categoriesArray = Object.entries(this.groupedLinks).map(
        ([category, links]) => ({
          category,
          count: links.length,
          order: orderMap.has(category)
            ? orderMap.get(category)
            : Number.MAX_SAFE_INTEGER,
        })
      );

      // 排序：已有顺序优先，否则按字母排序
      categoriesArray.sort((a, b) => {
        // 如果都有预定义顺序，按顺序排
        if (orderMap.has(a.category) && orderMap.has(b.category)) {
          return a.order - b.order;
        }
        // 如果只有一个有预定义顺序，有顺序的排前面
        if (orderMap.has(a.category)) return -1;
        if (orderMap.has(b.category)) return 1;
        // 否则按字母顺序
        return a.category.localeCompare(b.category);
      });

      this.sortedCategories = categoriesArray;
    },
    setActiveCategory(category) {
      // 修改为使用activeCategory计算属性
      this.activeCategory = category;
    },
    onCategorySorted() {
      // 提取新的分类顺序
      const newOrder = this.sortedCategories.map((item) => item.category);
      console.log("新的分类顺序:", newOrder);
      this.$emit("category-order-changed", newOrder);
    },
  },
  watch: {
    // 监听分组数据变化，更新排序
    groupedLinks: {
      handler() {
        this.updateSortedCategories();
      },
      deep: true,
    },
    categoryOrder: {
      handler() {
        this.updateSortedCategories();
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.category-nav {
  margin-bottom: 10px;
  overflow: visible !important;
  padding: 5px 10px;
  box-sizing: border-box;
  width: calc(100% - 48px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.category-tabs {
  display: flex;
  gap: 12px;
  padding: 5px 0;
  box-sizing: border-box;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  position: relative;
  padding-left: 28px !important; /* 确保拖拽把手有足够空间 */
}

.category-tab:hover {
  border-color: #d8b4fe;
  color: #8b5cf6;
  box-shadow: 0 4px 8px rgba(138, 92, 246, 0.1);
}

.category-tab.active {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 6px 14px rgba(138, 92, 246, 0.18);
}

.all-tab {
  margin: 5px 0;
}

.all-tab.active {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
}

.category-count {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.7rem;
  margin-left: 8px;
  box-sizing: border-box;
}

.category-tab.active .category-count {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.baidu-tab,
.baidu-tab:hover,
.baidu-icon {
  display: none;
}

.drag-handle {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  color: #a1a1aa;
  font-size: 12px;
  opacity: 0.4;
  transition: opacity 0.2s ease;
  user-select: none;
  font-weight: bold;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-tab.active .drag-handle {
  color: #fff;
}

.category-tab:hover .drag-handle {
  opacity: 0.8;
}

.ghost-category {
  opacity: 0.5;
  background: #f3e8ff !important;
  border: 2px dashed #d8b4fe !important;
}

.category-drag-container {
  display: flex;
  gap: 12px;
  flex: 1;
  overflow-x: auto;
  padding: 5px 0;
  box-sizing: border-box;
  align-items: center;
}

@media (max-width: 768px) {
  .category-nav {
    width: calc(100% - 24px);
  }
}
</style>
