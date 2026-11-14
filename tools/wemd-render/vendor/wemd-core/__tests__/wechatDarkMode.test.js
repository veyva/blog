"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const wechatDarkMode_1 = require("../wechatDarkMode");
(0, vitest_1.describe)("convertToWeChatDarkMode", () => {
    (0, vitest_1.it)("白色文字在暗色模式下保持高亮度", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#ffffff", "body");
        // 白色文字在深色背景上应保持白色或接近白色以保证可读性
        const r = parseInt(result.slice(1, 3), 16);
        (0, vitest_1.expect)(r).toBeGreaterThan(200);
    });
    (0, vitest_1.it)("白色背景在暗色模式下变暗", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#ffffff", "background");
        // 白色背景应转为深色
        const r = parseInt(result.slice(1, 3), 16);
        (0, vitest_1.expect)(r).toBeLessThan(100);
    });
    (0, vitest_1.it)("将黑色文字转为亮色", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#000000", "body");
        // 黑色文字在暗色模式下应变亮以保证可读性
        const r = parseInt(result.slice(1, 3), 16);
        (0, vitest_1.expect)(r).toBeGreaterThan(80);
    });
    (0, vitest_1.it)("彩色保持色相", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#ff0000", "body");
        // 红色转换后仍应偏红
        const r = parseInt(result.slice(1, 3), 16);
        const g = parseInt(result.slice(3, 5), 16);
        const b = parseInt(result.slice(5, 7), 16);
        (0, vitest_1.expect)(r).toBeGreaterThan(g);
        (0, vitest_1.expect)(r).toBeGreaterThan(b);
    });
    (0, vitest_1.it)("不同 ElementType 产生不同结果", () => {
        const hex = "#cccccc";
        const bodyResult = (0, wechatDarkMode_1.convertToWeChatDarkMode)(hex, "body");
        const codeResult = (0, wechatDarkMode_1.convertToWeChatDarkMode)(hex, "code");
        const headingResult = (0, wechatDarkMode_1.convertToWeChatDarkMode)(hex, "heading");
        // 不同类型的元素应有不同的暗色处理策略
        (0, vitest_1.expect)(new Set([bodyResult, codeResult, headingResult]).size).toBeGreaterThanOrEqual(2);
    });
    (0, vitest_1.it)("background 类型将亮色背景变暗", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#f5f5f5", "background");
        const r = parseInt(result.slice(1, 3), 16);
        (0, vitest_1.expect)(r).toBeLessThan(80);
    });
    (0, vitest_1.it)("无效 hex 返回原值", () => {
        (0, vitest_1.expect)((0, wechatDarkMode_1.convertToWeChatDarkMode)("not-a-color")).toBe("not-a-color");
        (0, vitest_1.expect)((0, wechatDarkMode_1.convertToWeChatDarkMode)("xyz")).toBe("xyz");
    });
    (0, vitest_1.it)("返回有效的 hex 格式", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#3366ff", "body");
        (0, vitest_1.expect)(result).toMatch(/^#[0-9a-f]{6}$/);
    });
    (0, vitest_1.it)("code-text 类型保证代码文字可读", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#333333", "code-text");
        // 深色代码文字在暗色模式下应变亮
        const r = parseInt(result.slice(1, 3), 16);
        const g = parseInt(result.slice(3, 5), 16);
        const b = parseInt(result.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        (0, vitest_1.expect)(brightness).toBeGreaterThan(60);
    });
    (0, vitest_1.it)("selection 类型处理选区颜色", () => {
        const result = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#0078d4", "selection");
        (0, vitest_1.expect)(result).toMatch(/^#[0-9a-f]{6}$/);
    });
});
(0, vitest_1.describe)("convertCssToWeChatDarkMode", () => {
    (0, vitest_1.it)("转换简单 CSS 规则中的颜色", () => {
        const css = "p { color: #000000; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("/* wemd-wechat-dark-converted */");
        (0, vitest_1.expect)(result).not.toContain("#000000");
    });
    (0, vitest_1.it)("转换 background-color", () => {
        const css = ".container { background-color: #ffffff; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).not.toContain("#ffffff");
    });
    (0, vitest_1.it)("转换 border-color", () => {
        const css = "table { border: 1px solid #dddddd; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).not.toContain("#dddddd");
    });
    (0, vitest_1.it)("处理 rgb() 颜色值", () => {
        const css = "p { color: rgb(0, 0, 0); }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).not.toContain("rgb(0, 0, 0)");
    });
    (0, vitest_1.it)("处理 rgba() 颜色值并保留 alpha", () => {
        const css = "p { color: rgba(0, 0, 0, 0.5); }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("0.5");
        (0, vitest_1.expect)(result).toContain("rgba(");
    });
    (0, vitest_1.it)("跳过 CSS 关键字颜色", () => {
        const css = "p { color: inherit; background: transparent; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("inherit");
        (0, vitest_1.expect)(result).toContain("transparent");
    });
    (0, vitest_1.it)("跳过 var() 引用", () => {
        const css = "p { color: var(--text-color); }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("var(--text-color)");
    });
    (0, vitest_1.it)("转换 gradient 内的颜色值", () => {
        const css = "div { background: linear-gradient(#fff, #000); }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        // 渐变结构保留
        (0, vitest_1.expect)(result).toContain("linear-gradient");
        // 原始颜色应被转换
        (0, vitest_1.expect)(result).not.toContain("#fff");
        (0, vitest_1.expect)(result).not.toContain("#000");
    });
    (0, vitest_1.it)("转换 gradient 内的近白色背景", () => {
        const css = "#wemd h2 { background: linear-gradient(90deg, #f0f4ff 0%, #ffffff 100%); }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("linear-gradient");
        (0, vitest_1.expect)(result).not.toContain("#f0f4ff");
        (0, vitest_1.expect)(result).not.toContain("#ffffff");
    });
    (0, vitest_1.it)("gradient 内保留 alpha hex 后缀", () => {
        const css = "div { background: linear-gradient(#ffffff00, #ffffff80); }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        // 应保留两个 stop 的 alpha 通道（8位 hex 格式）
        (0, vitest_1.expect)(result).toMatch(/#[0-9a-f]{6}00/i);
        (0, vitest_1.expect)(result).toMatch(/#[0-9a-f]{6}80/i);
    });
    (0, vitest_1.it)("近白色彩色背景暗化后保留色调", () => {
        // callout 浅色背景 perceived > 235 但有色相，暗化后应保留色调差异
        const noteResult = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#f7f9ff", "background");
        const warningResult = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#fff8ed", "background");
        // 两种 callout 背景暗化结果应不同（保留各自色调）
        (0, vitest_1.expect)(noteResult).not.toBe(warningResult);
        // 不应变成纯灰（R≈G≈B）
        const r = parseInt(noteResult.slice(1, 3), 16);
        const g = parseInt(noteResult.slice(3, 5), 16);
        const b = parseInt(noteResult.slice(5, 7), 16);
        (0, vitest_1.expect)(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("NEAR_WHITE_PERCEIVED 边界：233 不走近白分支，236 走近白分支", () => {
        // perceived ≈ 233 → 保持彩色路径，走 adjustBrightnessTo(190)
        const below = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#dfeaff", "background"); // perceived ≈ 233.1
        // perceived ≈ 236 → 命中近白分支，走暗化保留色调逻辑
        const above = (0, wechatDarkMode_1.convertToWeChatDarkMode)("#e3edff", "background"); // perceived ≈ 236.1
        const belowR = parseInt(below.slice(1, 3), 16);
        const aboveR = parseInt(above.slice(1, 3), 16);
        // 阈值以下的结果应明显亮于阈值以上的近白暗化结果
        (0, vitest_1.expect)(belowR).toBeGreaterThan(aboveR);
    });
    (0, vitest_1.it)("处理 @media 规则", () => {
        const css = "@media screen { p { color: #000; } }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("@media screen");
    });
    (0, vitest_1.it)("空 CSS 不报错", () => {
        (0, vitest_1.expect)(() => (0, wechatDarkMode_1.convertCssToWeChatDarkMode)("")).not.toThrow();
        (0, vitest_1.expect)(() => (0, wechatDarkMode_1.convertCssToWeChatDarkMode)("   ")).not.toThrow();
    });
    (0, vitest_1.it)("无颜色的 CSS 不报错", () => {
        const css = "p { font-size: 14px; margin: 10px; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("font-size");
        (0, vitest_1.expect)(result).toContain("margin");
    });
    (0, vitest_1.it)("已转换的 CSS 不重复转换", () => {
        const css = "p { color: #000; }";
        const first = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        const second = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(first);
        (0, vitest_1.expect)(second).toBe(first);
    });
    (0, vitest_1.it)("根据选择器识别元素类型", () => {
        const cssCode = "pre code.hljs { color: #333; background-color: #f8f8f8; }";
        const cssTable = "table td { color: #333; background-color: #f8f8f8; }";
        const resultCode = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(cssCode);
        const resultTable = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(cssTable);
        // 代码块和表格应有不同的暗色转换策略
        (0, vitest_1.expect)(resultCode).not.toBe(resultTable);
    });
    (0, vitest_1.it)("处理多条规则", () => {
        const css = "h1 { color: #000; } p { color: #333; } code { background: #f5f5f5; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).toContain("h1");
        (0, vitest_1.expect)(result).toContain("p{");
        (0, vitest_1.expect)(result).toContain("code");
    });
    (0, vitest_1.it)("处理 3 位短 hex", () => {
        const css = "p { color: #000; }";
        const result = (0, wechatDarkMode_1.convertCssToWeChatDarkMode)(css);
        (0, vitest_1.expect)(result).not.toContain("#000");
    });
});
(0, vitest_1.describe)("_convertCssToWeChatDarkModeInternal", () => {
    (0, vitest_1.it)("始终执行转换，不使用缓存", () => {
        const css = "p { color: #111; }";
        const result1 = (0, wechatDarkMode_1._convertCssToWeChatDarkModeInternal)(css);
        const result2 = (0, wechatDarkMode_1._convertCssToWeChatDarkModeInternal)(css);
        // 内部函数每次都重新转换
        (0, vitest_1.expect)(result1).toBe(result2);
        (0, vitest_1.expect)(result1).toContain("/* wemd-wechat-dark-converted */");
    });
});
