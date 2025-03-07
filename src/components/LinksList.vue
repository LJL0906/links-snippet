<template>
  <div>
    <!-- 全部链接视图 -->
    <template v-if="activeCategory === 'all'">
      <div class="category-group">
        <h2 class="category-title">
          全部链接 <span class="category-count">{{ links.length }}</span>
        </h2>
        <div class="card-container">
          <!-- 使用更明确的调试信息 -->
          <div v-if="!links || links.length === 0" class="debug-info">
            没有链接或链接数据为空 ({{ typeof links }}, 数量: {{ links ? links.length : 'undefined' }})
          </div>
          
          <!-- 全部视图显示所有有效链接 - 修改为更高效的渲染 -->
          <template v-for="link in links" :key="link && link.id ? link.id : Math.random()">
            <div v-if="link && link.id" class="capsule-card-wrapper">
              <link-card
                :link="link"
                :show-category="true"
                @edit="$emit('edit', link)"
                @delete="$emit('delete', link.id)"
              />
            </div>
          </template>
          
          <!-- 没有链接时显示空状态 -->
          <div v-if="links.length === 0" class="empty-state">
            <el-empty description="没有链接" />
          </div>
        </div>
      </div>
    </template>

    <!-- 分类链接视图 - 可排序 -->
    <template v-else>
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
        <!-- 使用正确的布局容器和draggable配置 -->
        <div class="card-container">
          <draggable 
            v-model="categoryLinkMap[category]" 
            item-key="id"
            :animation="200"
            ghost-class="ghost-card"
            @end="event => onLinksSorted(event, category)"
            handle=".capsule-card"
            class="draggable-container"
            :disabled="true"
            :force-fallback="true"
          >
            <template #item="{element: link}">
              <div v-if="link && link.id" class="capsule-card-wrapper">
                <link-card
                  :key="link.id"
                  :link="link"
                  :show-category="false"
                  @edit="$emit('edit', link)"
                  @delete="$emit('delete', link.id)"
                />
              </div>
            </template>
          </draggable>
          
          <!-- 分类下没有链接时显示空状态 -->
          <div v-if="!group || group.length === 0" class="empty-state">
            <el-empty description="该分类下没有链接" />
          </div>
        </div>
      </div>
    </template>
    
    <!-- 搜索结果 -->
    <div v-if="isSearching && filteredLinks.length === 0" class="empty-state">
      <el-empty description="没有找到链接" />
    </div>
  </div>
</template>

<script>
import LinkCard from './LinkCard.vue';
import draggable from 'vuedraggable';

export default {
  name: 'LinksList',
  components: {
    LinkCard,
    draggable
  },
  props: {
    links: {
      type: Array,
      required: true
    },
    filteredLinks: {
      type: Array,
      default: () => []
    },
    groupedLinks: {
      type: Object,
      required: true
    },
    activeCategory: {
      type: String,
      default: 'all'
    },
    isSearching: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete', 'links-sorted'],
  data() {
    return {
      categoryLinkMap: {}
    };
  },
  computed: {
    // 不再使用safeLinks和safeGroupedLinks
    // 在模板中直接添加v-if检查来确保链接有效
  },
  watch: {
    // 监听分组数据变化，更新内部状态
    groupedLinks: {
      handler(newGroups) {
        if (!newGroups) {
          this.categoryLinkMap = {};
          return;
        }
        
        // 直接同步内部分类链接映射，并在遍历时过滤
        this.categoryLinkMap = {};
        Object.entries(newGroups).forEach(([category, links]) => {
          if (Array.isArray(links)) {
            // 过滤无效链接
            this.categoryLinkMap[category] = links.filter(link => link && typeof link.id !== 'undefined');
          } else {
            this.categoryLinkMap[category] = [];
          }
        });
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 某个分类内部链接排序变化
    onLinksSorted(event, category) {
      // 确保有拖拽发生且不是在搜索/过滤状态
      if (event.oldIndex !== event.newIndex && !this.isSearching) {
        console.log(`链接顺序更改: 分类=${category}, 从${event.oldIndex}移到${event.newIndex}`);
        
        const links = this.categoryLinkMap[category];
        // 确保链接数组有效
        if (!links || !Array.isArray(links)) {
          console.error('无效的链接数组:', links);
          return;
        }
        
        // 确保链接存在
        if (!links[event.newIndex]) {
          console.error('目标索引的链接不存在:', event.newIndex);
          return;
        }
        
        const updateInfo = {
          category, 
          links,
          oldIndex: event.oldIndex,
          newIndex: event.newIndex
        };
        
        this.$emit('links-sorted', updateInfo);
      }
    }
  }
}
</script>

<style scoped>
.debug-info {
  width: 100%;
  padding: 10px;
  background: #f9e9e9;
  border: 1px dashed #d66;
  color: #933;
  margin-bottom: 15px;
  border-radius: 6px;
  font-family: monospace;
}

.category-group {
  margin-bottom: 30px;
  width: 100%;
}

.category-title {
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: #4b5563;
  padding-bottom: 8px;
  border-bottom: 2px dashed #e9e5f8;
  display: flex;
  align-items: center;
  width: calc(100% - 48px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

/* 修复卡片容器为flexbox布局，实现水平排列 */
.card-container {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 16px !important;
  width: calc(100% - 48px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  min-height: 100px; /* 确保容器有最小高度 */
}

/* 确保拖拽容器也是flex布局，占满整个宽度 */
.draggable-container {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 16px !important;
  width: 100% !important;
  min-height: 60px; /* 确保拖拽容器有最小高度 */
}

/* 调整卡片包装器样式，使每个卡片占据固定宽度 */
.capsule-card-wrapper {
  flex: 0 0 calc(25% - 16px) !important;
  min-width: 200px !important;
  max-width: calc(25% - 16px) !important;
  margin-bottom: 8px !important;
  transition: transform 0.2s ease !important;
}

/* 修正拖拽效果 */
.ghost-card {
  opacity: 0.5;
  background: #f3e8ff !important;
  border: 2px dashed #d8b4fe !important;
  border-radius: 9999px;
  height: 50px;
}

/* 手机屏幕适配 */
@media (max-width: 768px) {
  .capsule-card-wrapper {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
  
  .card-container,
  .category-title {
    width: calc(100% - 24px);
  }
}

.empty-state {
  width: 100%;
  padding: 40px 0;
  text-align: center;
}
</style>
