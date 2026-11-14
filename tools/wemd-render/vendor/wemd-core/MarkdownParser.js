"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMarkdownParser = void 0;
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/markdown-it-plugins.d.ts" />
const markdown_it_1 = __importDefault(require("markdown-it"));
const markdown_it_deflist_1 = __importDefault(require("markdown-it-deflist"));
const markdown_it_implicit_figures_1 = __importDefault(require("markdown-it-implicit-figures"));
const markdown_it_table_of_contents_1 = __importDefault(require("markdown-it-table-of-contents"));
const markdown_it_ruby_1 = __importDefault(require("markdown-it-ruby"));
const markdown_it_mark_1 = __importDefault(require("markdown-it-mark"));
const markdown_it_underline_1 = __importDefault(require("./plugins/markdown-it-underline"));
const markdown_it_sub_1 = __importDefault(require("markdown-it-sub"));
const markdown_it_sup_1 = __importDefault(require("markdown-it-sup"));
const markdown_it_emoji_1 = require("markdown-it-emoji");
const markdown_it_attrs_1 = __importDefault(require("markdown-it-attrs"));
// Local plugins
const markdown_it_math_1 = __importDefault(require("./plugins/markdown-it-math"));
const markdown_it_span_1 = __importDefault(require("./plugins/markdown-it-span"));
const markdown_it_table_container_1 = __importDefault(require("./plugins/markdown-it-table-container"));
const markdown_it_linkfoot_1 = __importDefault(require("./plugins/markdown-it-linkfoot"));
const markdown_it_imageflow_1 = __importDefault(require("./plugins/markdown-it-imageflow"));
const markdown_it_multiquote_1 = __importDefault(require("./plugins/markdown-it-multiquote"));
const markdown_it_li_1 = __importDefault(require("./plugins/markdown-it-li"));
const markdown_it_github_alert_1 = __importDefault(require("./plugins/markdown-it-github-alert"));
const markdown_it_task_lists_1 = __importDefault(require("markdown-it-task-lists"));
const markdown_it_checkbox_emoji_1 = __importDefault(require("./plugins/markdown-it-checkbox-emoji"));
const markdown_it_attribute_policy_1 = __importDefault(require("./plugins/markdown-it-attribute-policy"));
const markdown_it_source_position_1 = __importDefault(require("./plugins/markdown-it-source-position"));
const langHighlight_1 = __importDefault(require("./utils/langHighlight"));
const MAC_CODE_DOTS = ["rgb(237,108,96)", "rgb(247,193,81)", "rgb(100,200,86)"]
    .map((color, index) => `<span class="mac-dot" style="display:inline-block;width:10px;height:10px;margin-top:1.5px;${index < 2 ? "margin-right:7.5px;" : ""}border-radius:50%;background:${color};"></span>`)
    .join("");
const renderMacSign = () => `<span class="mac-sign" aria-hidden="true" style="display:block;height:13px;padding:10px 14px 0;line-height:0;">${MAC_CODE_DOTS}</span>`;
const createMarkdownParser = (options = {}) => {
    const showMacBar = options.showMacBar === true;
    const markdownParser = new markdown_it_1.default({
        html: true,
        highlight: (str, lang) => {
            // Mermaid 图表：输出 pre.mermaid 让前端渲染
            if (lang === "mermaid") {
                const escaped = markdownParser.utils.escapeHtml(str);
                return `<pre class="mermaid">\n${escaped}\n</pre>\n`;
            }
            if (lang === undefined || lang === "") {
                lang = "bash";
            }
            // 加上custom则表示自定义样式，而非微信专属，避免被remove pre
            if (lang && langHighlight_1.default.getLanguage(lang)) {
                try {
                    const formatted = langHighlight_1.default.highlight(lang, str, true).value;
                    const macSign = showMacBar ? renderMacSign() : "";
                    return ('<pre class="custom">' +
                        macSign +
                        '<code class="hljs">' +
                        formatted +
                        "</code></pre>");
                }
                catch {
                    // Ignore highlight errors
                }
            }
            const macSign = showMacBar ? renderMacSign() : "";
            return ('<pre class="custom">' +
                macSign +
                '<code class="hljs">' +
                markdownParser.utils.escapeHtml(str) +
                "</code></pre>");
        },
    });
    markdownParser
        .use(markdown_it_attrs_1.default, {
        allowedAttributes: ["class", "id", /^data-[\w-]+$/],
    })
        .use(markdown_it_attribute_policy_1.default)
        .use(markdown_it_span_1.default)
        .use(markdown_it_table_container_1.default)
        .use(markdown_it_math_1.default, {
        renderer: options.mathRenderer ?? "auto",
    })
        .use(markdown_it_linkfoot_1.default)
        .use(markdown_it_table_of_contents_1.default, {
        transformLink: () => "",
        includeLevel: [2, 3],
        markerPattern: /^\[toc\]/im,
    })
        .use(markdown_it_ruby_1.default)
        .use(markdown_it_implicit_figures_1.default, { figcaption: true })
        .use(markdown_it_deflist_1.default)
        .use(markdown_it_li_1.default)
        .use(markdown_it_imageflow_1.default)
        .use(markdown_it_multiquote_1.default)
        .use(markdown_it_mark_1.default)
        .use(markdown_it_underline_1.default)
        .use(markdown_it_sub_1.default)
        .use(markdown_it_sup_1.default)
        .use(markdown_it_emoji_1.full)
        .use(markdown_it_github_alert_1.default)
        .use(markdown_it_task_lists_1.default, {
        enabled: true,
        label: true,
        labelAfter: true,
    })
        .use(markdown_it_checkbox_emoji_1.default);
    if (options.includeSourcePosition) {
        markdownParser.use(markdown_it_source_position_1.default);
    }
    return markdownParser;
};
exports.createMarkdownParser = createMarkdownParser;
