<template>
  <div class="search-bar">
    <el-input
      v-model="searchQuery"
      placeholder="搜索链接..."
      prefix-icon="Search"
      clearable
      class="search-input"
      @input="emitSearch"
    />
    <el-select
      v-model="filterCategory"
      placeholder="筛选分类"
      clearable
      class="filter-select"
      @change="emitFilter"
    >
      <el-option
        v-for="item in categories"
        :key="item"
        :label="item"
        :value="item"
      />
    </el-select>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  props: {
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['search', 'filter'],
  data() {
    return {
      searchQuery: '',
      filterCategory: ''
    }
  },
  methods: {
    emitSearch() {
      this.$emit('search', this.searchQuery);
    },
    emitFilter() {
      this.$emit('filter', this.filterCategory);
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  margin-bottom: 20px;
  gap: 16px;
  align-items: stretch;
  width: calc(100% - 48px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.search-input {
  flex: 3;
}

.filter-select {
  flex: 2;
  min-width: 200px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    width: calc(100% - 24px);
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>
