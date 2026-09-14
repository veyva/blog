# Astro Blog

这是一个本地写作、Git 管理、GitHub Pages 自动发布的 Astro 博客项目。

## 本地准备

1. 用 VS Code 打开这个目录：`/Users/yuhangwang/Desktop/Proj/blog`
2. 在 VS Code 扩展面板安装推荐扩展：
   - Astro
   - MDX
   - Paste Image
3. 如果 VS Code 没有 `code` 命令：在 VS Code 中按 `Cmd+Shift+P`，执行 `Shell Command: Install 'code' command in PATH`。

## 常用命令

```sh
npm run dev
npm run new -- "我的第一篇文章"
npm run build
npm run preview
```

`npm run dev` 会启动本地预览，默认地址是 `http://localhost:4321/`。

## 写文章流程

1. 新建文章：

```sh
npm run new -- "文章标题"
```

这会创建：

```text
src/content/blog/YYYY-MM-DD-文章标题.md
src/content/blog/images/YYYY-MM-DD-文章标题/
```

默认会使用文章标题生成中文文件名。例如：

```sh
npm run new -- "如何开始写博客"
```

会创建：

```text
src/content/blog/YYYY-MM-DD-如何开始写博客.md
src/content/blog/images/YYYY-MM-DD-如何开始写博客/
```

如果你想让文件名和网页地址使用英文，也可以额外传 `--slug`：

```sh
npm run new -- "如何开始写博客" --slug start-blogging
```

会创建：

```text
src/content/blog/YYYY-MM-DD-start-blogging.md
src/content/blog/images/YYYY-MM-DD-start-blogging/
```

2. 在 Markdown 文件里写正文。

文章 frontmatter 示例：

```md
---
title: "文章标题"
description: "一句话概括这篇文章。"
pubDate: 2026-09-14
updatedDate: 2026-09-14
draft: true
---
```

`draft: true` 表示草稿，本地开发环境可见，线上发布时不会出现。准备发布时改成 `draft: false`。

3. 粘贴截图。

在 VS Code 的 Markdown 编辑器里直接粘贴截图。当前配置会把图片保存到：

```text
src/content/blog/images/当前文章文件名/
```

例如当前文章文件是 `2026-09-14-如何开始写博客.md`，图片会保存在：

```text
src/content/blog/images/2026-09-14-如何开始写博客/
```

Markdown 中插入类似这样的相对路径：

```md
![截图](images/2026-09-14-如何开始写博客/screenshot.png)
```

这类相对路径会被 Astro 正确处理，部署到 GitHub Pages 项目页时也不会丢图片。

4. 本地检查：

```sh
npm run dev
```

浏览器打开 `http://localhost:4321/` 查看页面。发布前建议再跑：

```sh
npm run build
```

## 发布到 GitHub Pages

1. 在 GitHub 新建仓库，例如 `blog`。
2. 在本地添加远程仓库：

```sh
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
```

3. 确认主分支叫 `main`：

```sh
git branch -M main
```

4. 提交并推送：

```sh
git add .
git commit -m "Initial blog setup"
git push -u origin main
```

5. 在 GitHub 仓库的 `Settings -> Pages` 中，把 `Build and deployment` 的 `Source` 设为 `GitHub Actions`。

之后每次推送到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布。

## 日常发布节奏

```sh
npm run new -- "新文章标题"
npm run dev
npm run build
git status
git add .
git commit -m "Add 新文章标题"
git push
```

如果仓库名是 `blog`，发布地址通常是：

```text
https://<你的用户名>.github.io/blog/
```

如果仓库名是 `<你的用户名>.github.io`，发布地址通常是：

```text
https://<你的用户名>.github.io/
```
