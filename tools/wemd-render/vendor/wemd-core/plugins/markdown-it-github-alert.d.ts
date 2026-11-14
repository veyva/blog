/**
 * markdown-it-github-alert
 * 解析 GitHub 风格的 Alert 语法，支持自定义标题
 *
 * 语法：
 * > [!TIP]
 * > 内容
 *
 * > [!TIP] 自定义标题
 * > 内容
 *
 * > [!TIP] 仅自定义标题（无正文也生效）
 *
 * 支持类型：NOTE, TIP, IMPORTANT, WARNING, CAUTION
 */
import type MarkdownIt from "markdown-it";
export default function markdownItGitHubAlert(md: MarkdownIt): void;
