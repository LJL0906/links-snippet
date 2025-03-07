/**
 * 简化的文字图标生成模块
 */

/**
 * 获取链接图标 - 简化版，仅生成文字图标
 * @param {string} url - 链接地址
 * @param {string} title - 链接标题（可选）
 * @returns {string} 图标数据URL
 */
export function getFaviconUrl(url, title = "") {
  try {
    // 获取首字母：优先使用标题，其次使用域名
    let initial = "";
    
    // 1. 尝试从标题获取首字母
    if (title && typeof title === "string" && title.trim()) {
      initial = title.trim().charAt(0).toUpperCase();
    } 
    // 2. 否则从URL中提取域名并获取首字母
    else if (url) {
      const domain = getDomainFromUrl(url);
      initial = domain ? domain.replace(/^www\./, '').charAt(0).toUpperCase() : "#";
    }

    // 如果不是字母或汉字，使用#号
    if (!/[A-Za-z\u4e00-\u9fa5]/.test(initial)) {
      initial = "#";
    }

    // 生成图标
    return generateTextBasedIcon(initial, url);
  } catch (error) {
    console.error("生成图标失败:", error);
    return getDefaultIcon();
  }
}

/**
 * 根据初始字符生成文字图标
 * @param {string} initial - 初始字符
 * @param {string} url - URL用于确定颜色（可选）
 * @returns {string} 图标数据URL
 */
export function generateTextBasedIcon(initial, url = "") {
  try {
    // 颜色调色板 - 使用明亮友好的颜色
    const colors = [
      "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", 
      "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
      "#0ea5e9", "#14b8a6", "#84cc16", "#22c55e",
    ];

    // 使用URL或初始字符的字符编码计算一个一致的颜色索引
    let sum = 0;
    const str = url || initial;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    const colorIndex = sum % colors.length;
    const bgColor = colors[colorIndex];

    // 创建更精美的SVG图标
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <rect width="40" height="40" rx="8" fill="${bgColor}"/>
        <text x="50%" y="55%" text-anchor="middle" dy=".1em" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="22">
          ${initial}
        </text>
      </svg>
    `;

    // 修复: 使用安全的base64编码方法替代btoa，解决非ASCII字符问题
    return `data:image/svg+xml;base64,${safeBase64Encode(svg)}`;
  } catch (error) {
    console.error("生成文字图标失败:", error);
    return getDefaultIcon();
  }
}

/**
 * 安全的Base64编码函数，支持Unicode字符
 * @param {string} str - 要编码的字符串
 * @returns {string} Base64编码结果
 */
function safeBase64Encode(str) {
  try {
    // 使用TextEncoder将字符串转换为UTF-8字节数组
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    // 将字节数组转换为Base64字符串
    const base64 = btoa(
      Array.from(data)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
    
    return base64;
  } catch (error) {
    console.error("Base64编码失败:", error);
    
    // 备用方案：返回一个固定的安全图标编码
    return 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjOGI1Y2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MyUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMWVtIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSIyMiI+Iz08L3RleHQ+PC9zdmc+';
  }
}

/**
 * 获取默认图标
 * @returns {string} 默认图标数据URL
 */
export function getDefaultIcon() {
  // 简单的默认图标 - "?"号
  return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjOGI1Y2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MyUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMWVtIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSIyMiI+Pzwvc3ZubD48L3N2Zz4=";
}

/**
 * 从URL中提取域名
 * @param {string} url - 链接地址
 * @returns {string} 域名
 */
export function getDomainFromUrl(url) {
  try {
    // 确保URL有协议头
    if (!url.match(/^https?:\/\//i)) {
      url = "https://" + url;
    }
    // 提取域名
    return new URL(url).hostname;
  } catch (error) {
    return "";
  }
}

/**
 * 图标加载错误时的处理器
 */
export function handleImageError(event) {
  event.target.src = getDefaultIcon();
}
