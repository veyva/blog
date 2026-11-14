"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ThemeProcessor_1 = require("../ThemeProcessor");
(0, vitest_1.describe)("ThemeProcessor mac bar", () => {
    (0, vitest_1.it)("保留 pre 与 code 之间的 Mac Bar 圆点，并保持代码空格保护", () => {
        const html = '<pre class="custom"><span class="mac-sign" style="display:block;padding:10px 14px 0;line-height:0;"><span class="mac-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgb(237,108,96);"></span><span class="mac-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgb(247,193,81);"></span><span class="mac-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgb(100,200,86);"></span></span><code class="hljs language-ts">  const a = 1;\n    console.log(a);</code></pre>';
        const css = `
      #wemd pre.custom > .mac-sign {
        display: block;
      }
    `;
        const output = (0, ThemeProcessor_1.processHtml)(html, css, false, true);
        (0, vitest_1.expect)(output.match(/class="mac-dot"/g)).toHaveLength(3);
        (0, vitest_1.expect)(output).not.toContain("<svg");
        (0, vitest_1.expect)(output).toMatch(/<pre[^>]*>\s*<span[^>]*>[\s\S]*class="mac-dot"[\s\S]*<\/span><code/i);
        (0, vitest_1.expect)(output).not.toMatch(/<code[^>]*>[\s\S]*class="mac-dot"/i);
        (0, vitest_1.expect)(output).toContain("&nbsp;&nbsp;const a = 1;");
        (0, vitest_1.expect)(output).toContain("\n&nbsp;&nbsp;&nbsp;&nbsp;console.log(a);");
    });
});
