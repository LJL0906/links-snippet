# infinite-Links - 链接管理工具

这是一个简单而强大的链接管理工具，帮助您整理和快速访问常用网站。

## 功能特点

- 漂亮的胶囊形卡片界面
- 通过分类组织链接
- 支持搜索和过滤
- 一键复制链接
- 自动获取网站图标
- 数据导出备份
- 批量导入链接
- 无边框窗口设计

## 开发

### 安装依赖

```bash
npm install
npm run rebuild
```

### 开发模式

```bash
# 运行开发服务器
npm run dev

# 在另一个终端启动Electron
npm start
```

### 构建应用

```bash
# 构建生产版本
npm run make
```

### out目录免安装版可用, 安装版有问题，暂无mac版

## 数据导入格式

批量导入使用JSON格式，例如：

```json
[
  {
    "title": "链接标题1",
    "url": "https://example.com",
    "category": "分类名称"
  },
  {
    "title": "链接标题2",
    "url": "https://example2.com",
    "category": "另一个分类"
  }
]
```

## 技术栈

- Electron
- Vue 3
- Element Plus
- SQLite3

## 许可证

ISC
