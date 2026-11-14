"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const themes_1 = require("../themes");
const themes = {
    dataBlueprintTheme: themes_1.dataBlueprintTheme,
    easternNotesTheme: themes_1.easternNotesTheme,
    clearGuideTheme: themes_1.clearGuideTheme,
    whitespaceGalleryTheme: themes_1.whitespaceGalleryTheme,
};
const requiredSelectors = [
    "#wemd h1",
    "#wemd h2",
    "#wemd h3",
    "#wemd .multiquote-1",
    "#wemd ul",
    "#wemd ol",
    "#wemd figure",
    "#wemd figcaption",
    "#wemd pre",
    "#wemd table",
    "#wemd .callout",
    "#wemd .footnotes-sep",
    "#wemd .block-equation",
    "#wemd .block-equation > svg",
    "#wemd pre.mermaid",
    "#wemd .task-list-item",
];
(0, vitest_1.describe)("scenario themes", () => {
    (0, vitest_1.it)("完整覆盖公众号文章的主要内容元素", () => {
        for (const [name, css] of Object.entries(themes)) {
            for (const selector of requiredSelectors) {
                (0, vitest_1.expect)(css, `${name} 缺少 ${selector}`).toContain(selector);
            }
        }
    });
    (0, vitest_1.it)("保持透明根背景并避开模板化视觉效果", () => {
        for (const [name, css] of Object.entries(themes)) {
            (0, vitest_1.expect)(css, name).toMatch(/#wemd\s*\{[\s\S]*?background(?:-color)?:\s*transparent;/);
            (0, vitest_1.expect)(css, name).not.toMatch(/background-clip:\s*text/i);
            (0, vitest_1.expect)(css, name).not.toMatch(/backdrop-filter/i);
            (0, vitest_1.expect)(css, name).not.toMatch(/border-left:\s*[2-9]\d*px/i);
        }
    });
    (0, vitest_1.it)("四款主题具有不同的核心视觉锚点", () => {
        (0, vitest_1.expect)(themes_1.dataBlueprintTheme).toContain("#173f7a");
        (0, vitest_1.expect)(themes_1.easternNotesTheme).toContain("#a33a2b");
        (0, vitest_1.expect)(themes_1.clearGuideTheme).toContain("#087f75");
        (0, vitest_1.expect)(themes_1.whitespaceGalleryTheme).toContain("#2b2927");
    });
    (0, vitest_1.it)("四款主题使用不同的版式语法而非同一骨架换色", () => {
        (0, vitest_1.expect)(themes_1.dataBlueprintTheme).toMatch(/#wemd h1\s*\{[\s\S]*?background:\s*#102b4e;/);
        (0, vitest_1.expect)(themes_1.dataBlueprintTheme).toContain("list-style-type: decimal-leading-zero");
        (0, vitest_1.expect)(themes_1.easternNotesTheme).toMatch(/#wemd h1\s*\{[\s\S]*?max-width:\s*7em;[\s\S]*?text-align:\s*right;/);
        (0, vitest_1.expect)(themes_1.easternNotesTheme).toMatch(/#wemd h1 \.content\s*\{[\s\S]*?max-width:\s*100%;/);
        (0, vitest_1.expect)(themes_1.easternNotesTheme).toContain("#wemd .multiquote-1::before");
        (0, vitest_1.expect)(themes_1.clearGuideTheme).toMatch(/#wemd h1\s*\{[\s\S]*?border-bottom:\s*8px solid #f0c94d;/);
        (0, vitest_1.expect)(themes_1.clearGuideTheme).toMatch(/#wemd figure\s*\{[\s\S]*?border:\s*2px solid #172b29;/);
        (0, vitest_1.expect)(themes_1.whitespaceGalleryTheme).toMatch(/#wemd h1\s*\{[\s\S]*?max-width:\s*12em;/);
        (0, vitest_1.expect)(themes_1.whitespaceGalleryTheme).toMatch(/#wemd \.multiquote-1,[\s\S]*?background:\s*#2b2927;/);
    });
    (0, vitest_1.it)("精修后的长文组件保持清晰边界与稳定换行", () => {
        for (const [name, css] of Object.entries(themes)) {
            (0, vitest_1.expect)(css, `${name} 标题缺少平衡换行`).toMatch(/#wemd h1 \.content\s*\{[\s\S]*?text-wrap:\s*balance;/);
            (0, vitest_1.expect)(css, `${name} 提示块不应继承默认大圆角`).toMatch(/#wemd \.callout\s*\{[\s\S]*?border-radius:\s*0;/);
            (0, vitest_1.expect)(css, `${name} 图片不应在分页时被拆开`).toMatch(/#wemd figure\s*\{[\s\S]*?break-inside:\s*avoid;/);
            (0, vitest_1.expect)(css, `${name} 嵌套引用不应重复挤压横向空间`).toMatch(/#wemd \.multiquote-1 \.multiquote-1\s*\{[\s\S]*?margin:\s*\d+px 0 0;/);
        }
    });
});
