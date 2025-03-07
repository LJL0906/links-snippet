import { ElMessage, ElMessageBox } from "element-plus";

/**
 * 链接相关的数据库操作服务
 */
export default {
  /**
   * 从数据库加载所有链接
   * @param {Array} categoryOrder 分类顺序
   * @returns {Promise<Array>} 链接数组
   */
  async loadLinks(categoryOrder) {
    try {
      console.log('linkService.loadLinks 被调用');
      
      // 检查 API 可用性
      if (!window.electronAPI || !window.electronAPI.queryDatabase) {
        console.error('electronAPI 不可用，无法加载链接');
        return [];
      }
      
      // 读取分类排序
      try {
        if (!categoryOrder || categoryOrder.length === 0) {
          const savedOrder = localStorage.getItem('categoryOrder');
          if (savedOrder) {
            categoryOrder = JSON.parse(savedOrder);
          }
        }
      } catch (e) {
        console.log('读取分类排序失败:', e);
      }
      
      let links = [];
      try {
        // 先尝试测试查询
        const testQuery = await window.electronAPI.queryDatabase(
          "SELECT COUNT(*) as count FROM links", 
          []
        );
        console.log('数据库链接测试成功, 计数:', testQuery);
        
        // 如果测试成功，执行主查询
        links = await window.electronAPI.queryDatabase(
          "SELECT *, COALESCE(sort_order, id*1000) AS effective_order FROM links ORDER BY category, effective_order, created_at DESC",
          []
        );
      } catch (error) {
        // 如果sort_order不存在，回退到基本查询
        console.warn('排序查询失败，使用基本查询:', error);
        links = await window.electronAPI.queryDatabase(
          "SELECT * FROM links ORDER BY category, created_at DESC", 
          []
        );
      }
      
      // 验证返回的数据是否为数组
      if (!Array.isArray(links)) {
        console.error('查询返回的不是数组:', links);
        return [];
      }
      
      console.log(`加载了 ${links.length} 个链接`);
      return links;
    } catch (error) {
      console.error("加载链接失败:", error);
      ElMessage.error("加载链接失败");
      return [];
    }
  },

  /**
   * 保存链接（添加或更新）
   * @param {Object} linkData 链接数据
   * @param {boolean} isEditing 是否为编辑模式
   * @returns {Promise<boolean>} 是否成功
   */
  async saveLink(linkData, isEditing) {
    try {
      if (isEditing) {
        // 更新现有链接
        await window.electronAPI.executeDatabase(
          "UPDATE links SET title = ?, url = ?, category = ? WHERE id = ?",
          [linkData.title, linkData.url, linkData.category, linkData.id]
        );
        ElMessage.success("更新成功");
      } else {
        // 添加新链接
        await window.electronAPI.executeDatabase(
          "INSERT INTO links (title, url, category) VALUES (?, ?, ?)",
          [linkData.title, linkData.url, linkData.category]
        );
        ElMessage.success("添加成功");
      }
      return true;
    } catch (error) {
      console.error("保存链接失败:", error);
      ElMessage.error("保存链接失败");
      return false;
    }
  },

  /**
   * 删除链接
   * @param {number} id 链接ID
   * @returns {Promise<boolean>} 是否成功
   */
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
      return true;
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除链接失败:", error);
        ElMessage.error("删除链接失败");
      }
      return false;
    }
  },

  /**
   * 更新链接顺序
   * @param {Object} orderData 排序数据 {category, links, oldIndex, newIndex}
   * @returns {Promise<boolean>} 是否成功
   */
  async updateLinkOrder(orderData) {
    const { category, links, oldIndex, newIndex } = orderData;
    
    if (category === 'all') {
      console.log('全部视图不支持拖拽排序');
      return false; // 全部视图不支持拖拽排序
    }
    
    try {
      console.log('更新链接排序:', category, oldIndex, newIndex);
      
      // 获取要移动的链接
      const movedLink = links[newIndex];
      if (!movedLink || !movedLink.id) {
        console.error('无法识别要移动的链接:', movedLink);
        return false;
      }
      
      console.log('要移动的链接:', movedLink);
      
      // 计算新的排序权重
      let newWeight = 0;
      
      if (newIndex === 0) {
        // 移到最前面：确保权重比第二个项目小
        newWeight = links.length > 1 && links[1] && links[1].sort_order 
          ? links[1].sort_order - 1000 
          : 1000;
      } else if (newIndex === links.length - 1) {
        // 移到最后面：确保权重比倒数第二个项目大
        newWeight = links[newIndex-1] && links[newIndex-1].sort_order 
          ? links[newIndex-1].sort_order + 1000 
          : (links.length + 1) * 1000;
      } else {
        // 移到中间：权重取前后两项的平均值
        const prevItem = links[newIndex-1];
        const nextItem = links[newIndex+1];
        
        const prevWeight = prevItem && prevItem.sort_order ? prevItem.sort_order : (newIndex * 1000);
        const nextWeight = nextItem && nextItem.sort_order ? nextItem.sort_order : ((newIndex + 2) * 1000);
        
        newWeight = Math.floor((prevWeight + nextWeight) / 2);
      }
      
      console.log(`更新链接 ID=${movedLink.id} 的排序权重为 ${newWeight}`);
      
      // 更新数据库中的排序权重
      await window.electronAPI.executeDatabase(
        "UPDATE links SET sort_order = ? WHERE id = ?",
        [newWeight, movedLink.id]
      );
      
      // 显示更新提示
      ElMessage.success('链接顺序已更新');
      return true;
    } catch (error) {
      console.error('更新链接排序失败:', error);
      ElMessage.error('更新链接排序失败');
      return false;
    }
  },

  /**
   * 提取链接中的分类
   * @param {Array} links 链接数组
   * @returns {Array} 分类数组
   */
  extractCategories(links) {
    const categoriesSet = new Set();
    links.forEach((link) => {
      if (link.category) categoriesSet.add(link.category);
    });
    return Array.from(categoriesSet);
  }
}
