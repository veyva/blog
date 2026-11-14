"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const themes_1 = require("../themes");
(0, vitest_1.describe)("modern editorial theme", () => {
    (0, vitest_1.it)("包含中文长文所需的关键排版层级", () => {
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#wemd h1 .content");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#wemd h2 .content");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#wemd .multiquote-1");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#wemd .callout");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#wemd table tr th");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#wemd pre code.hljs");
    });
    (0, vitest_1.it)("保持微信复制友好的静态样式约束", () => {
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("background-color: transparent");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toContain("#wemd h1 + p");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toContain("var(--");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toMatch(/position\s*:\s*(absolute|fixed|sticky)/);
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toContain("@media");
    });
    (0, vitest_1.it)("包含编辑部刊头、章节编号和橙色锚点", () => {
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("border-top: 5px solid #20221e");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("border-bottom: 3px solid #c76237");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("counter-reset: editorial-section");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("counter(editorial-section, decimal-leading-zero)");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toMatch(/#wemd h2::before\s*\{[\s\S]*?font-size:\s*32px;/);
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).toContain("#c76237");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toContain("linear-gradient");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toContain("radial-gradient");
        (0, vitest_1.expect)(themes_1.modernEditorialTheme).not.toContain("border-radius: 999px");
    });
});
