/**
 * 打开链接的处理函数
 */
import { ElMessage } from 'element-plus';

/**
 * 打开链接
 */
export function handleOpenLink(url) {
  if (!url) {
    ElMessage.error("链接地址无效");
    return;
  }

  // 确保URL格式正确
  const formattedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;

  console.log("打开链接:", formattedUrl);

  try {
    // 优先使用electronAPI
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(formattedUrl)
        .catch(err => {
          console.error("通过electronAPI打开链接失败:", err);
          // 如果失败，尝试其他方法
          tryFallbackMethods(formattedUrl);
        });
    } else {
      // 如果electronAPI不可用，尝试其他方法
      tryFallbackMethods(formattedUrl);
    }
  } catch (error) {
    console.error("打开链接初始尝试失败:", error);
    fallbackOpenLink(formattedUrl);
  }
}

/**
 * 尝试备用打开链接方法
 */
function tryFallbackMethods(url) {
  try {
    // 检查electronShell是否可用
    if (window.electronShell && typeof window.electronShell.openExternal === 'function') {
      window.electronShell.openExternal(url)
        .catch(err => {
          console.error("使用electronShell打开链接失败:", err);
          fallbackOpenLink(url);
        });
    } else {
      // 如果electronShell不可用，使用最后的备用方法
      fallbackOpenLink(url);
    }
  } catch (err) {
    console.error("备用方法尝试失败:", err);
    fallbackOpenLink(url);
  }
}

/**
 * 最后的备用链接打开方法
 */
function fallbackOpenLink(url) {
  try {
    // 使用浏览器默认方式打开
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    
    // 如果被浏览器阻止，尝试设置焦点
    if (newWindow) {
      newWindow.focus();
      ElMessage.success("已在浏览器中打开链接");
    } else {
      throw new Error("链接被浏览器拦截器阻止");
    }
  } catch (backupError) {
    console.error("所有打开链接方法均失败:", backupError);
    ElMessage.error("无法打开链接，请手动复制URL");
    
    // 最后的手段：在控制台显示URL以便用户复制
    console.log("%c手动复制此链接: ", "color: #8b5cf6; font-weight: bold", url);
  }
}

/**
 * 复制链接到剪贴板
 */
export function copyToClipboard(text) {
  // 使用传统的document.execCommand方法复制
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed"; // 避免滚动
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      ElMessage({
        message: "链接已复制到剪贴板",
        type: "success",
        duration: 1500,
      });
    } else {
      throw new Error("复制操作被拒绝");
    }
  } catch (err) {
    console.error("复制失败:", err);
    ElMessage.error("复制链接失败");
  }

  document.body.removeChild(textarea);
}

/**
 * 标准化URL以用于比较
 */
export function normalizeUrl(url) {
  if (!url) return "";

  // 确保有协议
  let normalizedUrl = url;
  if (!normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  try {
    // 解析URL
    const parsed = new URL(normalizedUrl);
    // 移除尾部斜杠，简化为小写进行比较
    return (
      (parsed.origin + parsed.pathname).replace(/\/$/, "").toLowerCase() +
      parsed.search
    );
  } catch (e) {
    return normalizedUrl.toLowerCase();
  }
}
