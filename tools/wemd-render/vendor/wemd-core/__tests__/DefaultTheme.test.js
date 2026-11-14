"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const themes_1 = require("../themes");
(0, vitest_1.describe)("default theme", () => {
    (0, vitest_1.it)("使用翡翠强调色并覆盖主要文章元素", () => {
        for (const selector of [
            "#wemd h1",
            "#wemd h2",
            "#wemd h3",
            "#wemd .multiquote-1",
            "#wemd ul",
            "#wemd ol",
            "#wemd figcaption",
            "#wemd pre code.hljs",
            "#wemd table",
            "#wemd .callout",
            "#wemd .footnotes-sep",
            "#wemd .block-equation > svg",
        ]) {
            (0, vitest_1.expect)(themes_1.customDefaultTheme, `缺少 ${selector}`).toContain(selector);
        }
        (0, vitest_1.expect)(themes_1.customDefaultTheme).toContain("#047857");
    });
    (0, vitest_1.it)("显式移除基础主题中链接图片说明的黑底悬浮样式", () => {
        (0, vitest_1.expect)(themes_1.customDefaultTheme).toMatch(/#wemd figure a \+ figcaption\s*\{[\s\S]*?margin-top:\s*10px;[\s\S]*?background:\s*transparent;[\s\S]*?color:\s*#606b64;/);
    });
    (0, vitest_1.it)("默认主题声明保持扁平并避免低对比度弱文字", () => {
        (0, vitest_1.expect)(themes_1.customDefaultTheme).not.toMatch(/linear-gradient|radial-gradient/i);
        (0, vitest_1.expect)(themes_1.customDefaultTheme).not.toContain("#8a9791");
        (0, vitest_1.expect)(themes_1.customDefaultTheme).not.toMatch(/opacity:\s*0\.[0-9]+/);
    });
});
