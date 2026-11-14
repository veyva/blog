"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MarkdownParser_1 = require("../MarkdownParser");
(0, vitest_1.describe)("MarkdownParser code block", () => {
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)("默认不输出 mac-sign 结构", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)();
        const html = parser.render("```ts\nconst a = 1;\n```");
        (0, vitest_1.expect)(html).toContain('<pre class="custom">');
        (0, vitest_1.expect)(html).not.toContain('<span class="mac-sign"');
        (0, vitest_1.expect)(html).not.toContain("<svg");
    });
    (0, vitest_1.it)("显式开启后输出无需 SVG 加载的 Mac Bar 圆点", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ showMacBar: true });
        const html = parser.render("```ts\nconst a = 1;\n```");
        (0, vitest_1.expect)(html).toContain('<pre class="custom">');
        (0, vitest_1.expect)(html).toContain('<span class="mac-sign"');
        (0, vitest_1.expect)(html).toContain("display:block;height:13px;");
        (0, vitest_1.expect)(html).not.toMatch(/class="mac-sign"[^>]*width:45px/);
        (0, vitest_1.expect)(html.match(/class="mac-dot"/g)).toHaveLength(3);
        (0, vitest_1.expect)(html.match(/width:10px;height:10px;margin-top:1.5px;/g)).toHaveLength(3);
        (0, vitest_1.expect)(html).not.toContain("<svg");
        (0, vitest_1.expect)(html).toMatch(/<pre[^>]*>\s*<span[^>]*>[\s\S]*class="mac-dot"[\s\S]*<\/span>\s*<code/i);
        (0, vitest_1.expect)(html).not.toMatch(/<code[^>]*>[\s\S]*class="mac-dot"/i);
    });
    (0, vitest_1.it)("指定 katex 渲染器时不使用 MathJax SVG", () => {
        vitest_1.vi.stubGlobal("window", {
            MathJax: {
                tex2svg: () => {
                    const container = document.createElement("div");
                    container.innerHTML = "<svg><text>mathjax</text></svg>";
                    return container;
                },
            },
        });
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("$\\boldsymbol{x}$");
        (0, vitest_1.expect)(html).toContain("katex-html");
        (0, vitest_1.expect)(html).toContain("boldsymbol");
        (0, vitest_1.expect)(html).not.toContain("<svg");
        (0, vitest_1.expect)(html).not.toContain("mathjax");
    });
    (0, vitest_1.it)("MathJax 报错输出不进入预览，退回可读原文", () => {
        vitest_1.vi.stubGlobal("window", {
            __wemdMathJaxVersion: 3,
            MathJax: {
                texReset: vitest_1.vi.fn(),
                tex2svg: () => {
                    const container = document.createElement("div");
                    container.innerHTML =
                        '<svg viewBox="0 0 100 50" data-mjx-error="Undefined control sequence"><rect width="100" height="50"></rect><text>Undefined control sequence</text></svg>';
                    return container;
                },
            },
        });
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "auto" });
        const html = parser.render("$\\ce{H2O}$");
        (0, vitest_1.expect)(html).not.toContain("data-mjx-error");
        (0, vitest_1.expect)(html).not.toContain("<rect");
        (0, vitest_1.expect)(html).toContain("katex-html");
        (0, vitest_1.expect)(html).toContain("\\ce{H2O}");
    });
});
(0, vitest_1.describe)("MarkdownParser 预览源位置", () => {
    const markdown = [
        "# 标题",
        "",
        "正文段落",
        "",
        "```ts",
        "const answer = 42;",
        "```",
        "",
        "$$",
        "x^2",
        "$$",
    ].join("\n");
    (0, vitest_1.it)("默认渲染不输出预览内部源位置属性", () => {
        const html = (0, MarkdownParser_1.createMarkdownParser)().render(markdown);
        (0, vitest_1.expect)(html).not.toContain("data-wemd-source-start");
        (0, vitest_1.expect)(html).not.toContain("data-wemd-source-end");
    });
    (0, vitest_1.it)("显式开启后为可见块输出零基、结束行独占的源位置", () => {
        const html = (0, MarkdownParser_1.createMarkdownParser)({ includeSourcePosition: true }).render(markdown);
        (0, vitest_1.expect)(html).toContain('<h1 data-wemd-source-start="0" data-wemd-source-end="1">');
        (0, vitest_1.expect)(html).toContain('<p data-wemd-source-start="2" data-wemd-source-end="3">');
        (0, vitest_1.expect)(html).toMatch(/<pre[^>]*data-wemd-source-start="4"[^>]*data-wemd-source-end="7"/);
        (0, vitest_1.expect)(html).toMatch(/class="block-equation"[^>]*data-wemd-source-start="8"[^>]*data-wemd-source-end="11"/);
    });
});
