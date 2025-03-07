import { ElMessage } from "element-plus";
import { normalizeUrl } from "../utils/linkUtils";

/**
 * 数据导入导出相关的服务
 */
export default {
  /**
   * 导出数据
   */
  async exportData() {
    try {
      // 获取所有链接数据
      const links = await window.electronAPI.queryDatabase(
        "SELECT * FROM links",
        []
      );

      if (links.length === 0) {
        ElMessage.warning("没有数据可导出");
        return false;
      }

      const result = await window.electronAPI.exportData(links);

      if (result.success) {
        ElMessage.success(`数据已导出到: ${result.path}`);
        return true;
      } else {
        ElMessage.info(result.message);
        return false;
      }
    } catch (error) {
      console.error("导出数据失败:", error);
      ElMessage.error("导出数据失败");
      return false;
    }
  },

  /**
   * 导入数据操作
   * @returns {Promise<Object>} 导入结果
   */
  async importData() {
    try {
      const result = await window.electronAPI.importData();

      if (!result.success) {
        if (result.message !== "已取消导入") {
          ElMessage.error(result.message);
        }
        return { success: false };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error("导入数据失败:", error);
      ElMessage.error("导入数据失败");
      return { success: false };
    }
  },

  /**
   * 确认导入数据
   * @param {Array} importData 要导入的数据
   * @returns {Promise<boolean>} 是否导入成功
   */
  async confirmImport(importData) {
    if (!importData || importData.length === 0) {
      ElMessage.warning("没有有效的导入数据");
      return false;
    }

    try {
      // 清空当前数据
      await window.electronAPI.executeDatabase("DELETE FROM links", []);

      // 批量插入数据
      for (const link of importData) {
        await window.electronAPI.executeDatabase(
          "INSERT INTO links (id, title, url, category, created_at) VALUES (?, ?, ?, ?, ?)",
          [
            link.id,
            link.title,
            link.url,
            link.category || null,
            link.created_at || new Date().toISOString(),
          ]
        );
      }

      ElMessage.success(`成功导入 ${importData.length} 条链接`);
      return true;
    } catch (error) {
      console.error("导入数据失败:", error);
      ElMessage.error("导入数据失败");
      return false;
    }
  },

  /**
   * 批量导入操作 - 选择文件
   * @returns {Promise<Object>} 批量导入结果
   */
  async selectBulkFile() {
    try {
      const result = await window.electronAPI.readJsonFile();

      if (!result.success) {
        if (result.message !== "已取消选择") {
          ElMessage.error(result.message);
        }
        return { success: false };
      }

      // 验证数据格式
      if (!Array.isArray(result.data)) {
        ElMessage.error("无效的JSON格式，应为链接对象数组");
        return { success: false };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error("读取JSON文件失败:", error);
      ElMessage.error("读取JSON文件失败");
      return { success: false };
    }
  },

  /**
   * 确认批量导入链接
   * @param {Array} bulkData 原始批量数据
   * @param {Array} validData 有效的批量数据
   * @returns {Promise<boolean>} 是否导入成功
   */
  async confirmBulkImport(validData) {
    if (validData.length === 0) {
      ElMessage.warning("没有有效的链接数据可导入");
      return false;
    }

    try {
      // 批量插入数据
      for (const link of validData) {
        await window.electronAPI.executeDatabase(
          "INSERT INTO links (title, url, category) VALUES (?, ?, ?)",
          [link.title, link.url, link.category || null]
        );
      }

      ElMessage.success(`成功导入 ${validData.length} 条链接`);
      return true;
    } catch (error) {
      console.error("批量导入失败:", error);
      ElMessage.error("批量导入失败");
      return false;
    }
  },

  /**
   * 验证批量数据，过滤出有效数据
   * @param {Array} bulkData 批量数据
   * @param {Array} existingLinks 现有链接
   * @returns {Array} 有效的可导入数据
   */
  validateBulkData(bulkData, existingLinks) {
    if (!bulkData || bulkData.length === 0) {
      return [];
    }

    // 首先过滤出有效数据（有title和url的数据）
    const validData = bulkData.filter(
      (item) =>
        item &&
        item.title &&
        item.url &&
        typeof item.title === "string" &&
        typeof item.url === "string"
    );

    // 合并现有链接检查重复
    const existingUrls = new Set(
      existingLinks.map((link) => normalizeUrl(link.url))
    );
    const existingTitlesWithCategories = new Set(
      existingLinks.map(
        (link) =>
          `${link.title.toLowerCase()}|${(link.category || "").toLowerCase()}`
      )
    );

    // 去重
    return validData.filter((item) => {
      const normalizedUrl = normalizeUrl(item.url);
      const titleCategoryKey = `${item.title.toLowerCase()}|${(
        item.category || ""
      ).toLowerCase()}`;

      // 如果URL或者标题+分类组合已存在，则认为是重复的
      return (
        !existingUrls.has(normalizedUrl) &&
        !existingTitlesWithCategories.has(titleCategoryKey)
      );
    });
  }
}
