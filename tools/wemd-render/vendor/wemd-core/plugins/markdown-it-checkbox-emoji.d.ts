/**
 * markdown-it 插件：将 checkbox 转换为 emoji
 * 微信公众号会过滤 <input> 标签，需要在渲染时就转为 emoji
 */
import MarkdownIt from "markdown-it";
export default function markdownItCheckboxEmoji(md: MarkdownIt): void;
