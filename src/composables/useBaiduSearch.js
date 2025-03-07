import { ref, onMounted, onBeforeUnmount } from 'vue';
import { handleOpenLink } from '../utils/linkUtils';
import { ElMessage } from 'element-plus';

/**
 * 百度搜索功能组合式API
 */
export default function useBaiduSearch() {
  const baiduQuery = ref('');
  const baiduSearchInput = ref(null);
  
  // 执行百度搜索
  const searchBaidu = () => {
    if (!baiduQuery.value.trim()) return;

    const searchTerm = baiduQuery.value.trim();
    const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`;

    try {
      // 调用增强的打开链接函数
      handleOpenLink(searchUrl);
      ElMessage({
        message: `正在搜索: ${searchTerm}`,
        type: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('百度搜索失败:', error);
      ElMessage.error('搜索请求失败，请稍后再试');
    }

    // 无论如何都清空搜索框
    baiduQuery.value = '';
  };

  // 聚焦百度搜索框
  const focusBaiduSearch = () => {
    if (baiduSearchInput.value) {
      try {
        baiduSearchInput.value.focus();
      } catch (error) {
        console.warn('聚焦搜索框失败:', error);
      }
    }
  };

  // 组件挂载时添加窗口聚焦事件
  onMounted(() => {
    window.addEventListener('focus', focusBaiduSearch);
  });

  // 组件销毁前移除事件监听器
  onBeforeUnmount(() => {
    window.removeEventListener('focus', focusBaiduSearch);
  });

  return {
    baiduQuery,
    baiduSearchInput,
    searchBaidu,
    focusBaiduSearch
  };
}
