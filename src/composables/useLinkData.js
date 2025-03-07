import { ref, computed } from 'vue';
import linkService from '../services/linkService';

/**
 * 链接数据管理的组合式API
 */
export default function useLinkData() {
  const links = ref([]);
  const categories = ref([]);
  const activeCategory = ref('all');
  const previousActiveCategory = ref('all');
  const categoryOrder = ref([]);
  const searchQuery = ref('');
  const filterCategory = ref('');

  // 过滤后的链接
  const filteredLinks = computed(() => {
    let result = links.value;

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.category && link.category.toLowerCase().includes(query))
      );
    }

    // 分类过滤
    if (filterCategory.value) {
      result = result.filter((link) => link.category === filterCategory.value);
    }

    return result;
  });

  // 按分类分组链接
  const groupedLinks = computed(() => {
    const groups = {};

    // 确保 links.value 是数组且不为 null/undefined
    if (Array.isArray(links.value)) {
      links.value.forEach((link) => {
        if (!link) return; // 跳过无效的链接对象
        
        const category = link.category || "未分类";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(link);
      });
    } else {
      console.error('links.value 不是一个数组:', links.value);
    }

    return groups;
  });

  // 加载链接数据 - 添加更多错误处理
  const loadLinks = async () => {
    try {
      if (!window.electronAPI || !window.electronAPI.queryDatabase) {
        console.error('electronAPI 不可用，无法加载链接');
        links.value = [];
        categories.value = [];
        return;
      }
      
      const loadedLinks = await linkService.loadLinks(categoryOrder.value);
      links.value = Array.isArray(loadedLinks) ? loadedLinks : [];
      
      if (linkService && typeof linkService.extractCategories === 'function') {
        categories.value = linkService.extractCategories(links.value);
      } else {
        // 手动提取分类
        const categoriesSet = new Set();
        links.value.forEach(link => {
          if (link && link.category) categoriesSet.add(link.category);
        });
        categories.value = Array.from(categoriesSet);
      }
    } catch (error) {
      console.error('加载链接失败:', error);
      links.value = [];
      categories.value = [];
    }
  };

  // 更新分类顺序
  const updateCategoryOrder = async (newOrder) => {
    console.log('分类顺序已更新:', newOrder);
    categoryOrder.value = newOrder;
    
    try {
      localStorage.setItem('categoryOrder', JSON.stringify(newOrder));
    } catch (error) {
      console.error('保存分类顺序失败:', error);
    }
  };

  // 保存分类选择
  const saveCategorySelection = () => {
    previousActiveCategory.value = activeCategory.value;
  };

  // 搜索和过滤处理
  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const setFilterCategory = (category) => {
    filterCategory.value = category;
  };

  return {
    // 状态
    links,
    categories,
    activeCategory,
    previousActiveCategory,
    categoryOrder,
    searchQuery,
    filterCategory,
    
    // 计算属性
    filteredLinks,
    groupedLinks,
    
    // 方法
    loadLinks,
    updateCategoryOrder,
    saveCategorySelection,
    setSearchQuery,
    setFilterCategory
  };
}
