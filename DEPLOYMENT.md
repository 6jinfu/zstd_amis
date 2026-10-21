# 人才发展部署说明

最新全量交接标签：`v2026.10.21-project`。产品代码基线：`v2026.10.20` / PRD V1.62。本次补齐项目材料，未修改产品功能；完整换机恢复见 `MIGRATION.md`。

## 解压后直接运行

需要 Python 3.9 或更高版本，无需安装前端依赖。在解压目录运行：

```bash
python3 serve.py
```

浏览器访问 `http://127.0.0.1:8766/`。使用其他端口：

```bash
python3 serve.py 8080
```

服务监听 `0.0.0.0`，局域网访问地址以启动日志为准。启动时自动检查本地 CSS / JS 并同步资源内容指纹；本地预览不缓存页面和资源。

## 部署到静态服务器

将整个 `app/` 目录的内容上传到网站根目录，默认文档设为 `index.html`。保持子目录和相对路径完整，不能只上传 HTML。也可以将站点根目录直接指向解压后的 `app/`。

例如 Nginx 配置：

```nginx
server {
    listen 8080;
    server_name _;
    root /var/www/talent-development/app;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
        add_header Cache-Control "no-store" always;
    }
}
```

本期资源均带内容指纹，但文件名保持不变；部署时应整体替换 `app/`，避免新旧文件混用。

## 运行数据与接入边界

- 当前交付是可交互业务原型。人才标准、评估草稿、人才池等演示数据主要保存在当前浏览器的 localStorage，不是多用户数据库。
- ZIP 包包含代码和内置示例，不包含某台浏览器中临时新增的业务记录。
- 普通原型预览无需配置 Dify。`dify/` 是工作流及接口设计；真实 AI 服务和业务后端需另行按接口文档部署。
- `mcp-apps/` 是独立的 Dify MCP 扩展，按其 README 配置；不是静态原型启动的必要依赖。

## 修改代码后的检查

```bash
python3 scripts/asset_versions.py --write
python3 scripts/asset_versions.py
python3 -m unittest discover -s tests -v
```

第一条同步内容指纹，第二条只检查；缺失资源或过期指纹会失败。测试会使用临时本地端口验证缓存行为。
