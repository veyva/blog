"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MarkdownFormatter_1 = require("../MarkdownFormatter");
const MarkdownParser_1 = require("../MarkdownParser");
const off = {
    whitespace: false,
    pangu: false,
    fullwidthPunctuation: false,
    cornerQuotes: false,
};
const only = (key) => ({
    ...off,
    [key]: true,
});
const all = {
    whitespace: true,
    pangu: true,
    fullwidthPunctuation: true,
    cornerQuotes: true,
};
function protectedTokens(markdown) {
    const collect = (tokens) => tokens.flatMap((token) => {
        const nested = token.children ? collect(token.children) : [];
        // 插件生成的任务框、label 含随机 ID，不属于作者写入的 HTML。
        if (token.type === "html_inline" && !markdown.includes(token.content)) {
            return nested;
        }
        if ([
            "code_inline",
            "fence",
            "code_block",
            "math_inline",
            "math_block",
            "html_inline",
        ].includes(token.type)) {
            return [[token.type, token.content], ...nested];
        }
        if (token.type === "footnote_ref") {
            return [[token.type, token.meta], ...nested];
        }
        if (token.type === "link_open" || token.type === "image") {
            return [
                [
                    token.type,
                    token.attrGet("href"),
                    token.attrGet("src"),
                    token.attrGet("title"),
                ],
                ...nested,
            ];
        }
        return nested;
    });
    return collect((0, MarkdownParser_1.createMarkdownParser)().parse(markdown, {}));
}
(0, vitest_1.describe)("formatMarkdown", () => {
    (0, vitest_1.it)("全部关闭时原样返回", () => {
        const text = "中文English，\u00a0 \n\n\n\n“引号”\n";
        (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(text, off)).toBe(text);
    });
    (0, vitest_1.describe)("盘古之白", () => {
        const run = (text) => (0, MarkdownFormatter_1.formatMarkdown)(text, only("pangu"));
        (0, vitest_1.it)("中文与英文、数字之间补空格", () => {
            (0, vitest_1.expect)(run("使用React开发2024年的项目")).toBe("使用 React 开发 2024 年的项目");
        });
        (0, vitest_1.it)("全角标点两侧不补空格，已有空格不重复", () => {
            (0, vitest_1.expect)(run("你好，World。Hello 世界")).toBe("你好，World。Hello 世界");
        });
        (0, vitest_1.it)("行内代码、行内公式、URL 内部不动，与中文之间补空格", () => {
            (0, vitest_1.expect)(run("用`code中文`和$x中文y$做")).toBe("用 `code中文` 和 $x中文y$ 做");
            (0, vitest_1.expect)(run("见https://a.com/x 查看")).toBe("见 https://a.com/x 查看");
        });
        (0, vitest_1.it)("裸 URL 只在空白、全角标点处截止，中文路径整段保留", () => {
            (0, vitest_1.expect)(run("见https://a.com/页面a，然后b")).toBe("见 https://a.com/页面a，然后 b");
            (0, vitest_1.expect)(run("下载https://例子.测试/文档.pdf")).toBe("下载 https://例子.测试/文档.pdf");
        });
        (0, vitest_1.it)("引用、列表里的围栏代码与缩进代码整块不动", () => {
            const quoted = '> ```js\n> const msg = "中文React";\n> ```';
            const listed = '- 步骤\n\n      ```js\n      const msg = "中文React";\n      ```';
            const indented = '正文\n\n    const msg = "中文React";';
            (0, vitest_1.expect)(run(quoted)).toBe(quoted);
            (0, vitest_1.expect)(run(listed)).toBe(listed);
            (0, vitest_1.expect)(run(indented)).toBe(indented);
        });
        (0, vitest_1.it)("跨行的行内代码整体不动", () => {
            (0, vitest_1.expect)(run("说明`中文React\ncode`结束")).toBe("说明 `中文React\ncode` 结束");
        });
        (0, vitest_1.it)("含括号的链接与图片目标、引用式链接地址不动", () => {
            (0, vitest_1.expect)(run("[文档](https://a.com/a(b)中文x)")).toBe("[文档](https://a.com/a(b)中文x)");
            (0, vitest_1.expect)(run("![截图](./images/图(1)中文x.png)")).toBe("![截图](./images/图(1)中文x.png)");
            (0, vitest_1.expect)(run("[文档][a]\n\n[a]: /中文React")).toBe("[文档][a]\n\n[a]: /中文React");
        });
        (0, vitest_1.it)("<pre>、<style> 等原样 HTML 块不动", () => {
            const html = "<pre>\n中文React\n</pre>";
            (0, vitest_1.expect)(run(html)).toBe(html);
        });
        (0, vitest_1.it)("链接目标、HTML 标签与属性内部不动，两侧也不补空格", () => {
            (0, vitest_1.expect)(run("[文档](http://a.com/中文x)和<b>中文</b>")).toBe("[文档](http://a.com/中文x)和<b>中文</b>");
            (0, vitest_1.expect)(run('<img alt="图片a" src="a中文b.png">')).toBe('<img alt="图片a" src="a中文b.png">');
        });
        (0, vitest_1.it)("不满足公式定界条件的 $ 当普通文字，不会因补空格变成公式", () => {
            // 结尾 $ 后跟数字，渲染器不认为是公式
            (0, vitest_1.expect)(run("价格$5和$10")).toBe("价格$5 和$10");
            (0, vitest_1.expect)(run("从$ 5到$ 8")).toBe("从$ 5 到$ 8");
        });
        (0, vitest_1.it)("链接文字、图片 alt 仍会格式化", () => {
            (0, vitest_1.expect)(run("[中文abc](http://x)")).toBe("[中文 abc](http://x)");
        });
        (0, vitest_1.it)("围栏代码块、公式块、front matter 整块跳过", () => {
            const text = [
                "---",
                "title: 中文abc",
                "---",
                "正文abc",
                "```js",
                "const 中文a = 1",
                "```",
                "$$",
                "x中文y",
                "$$",
                "~~~~",
                "```",
                "中文abc",
                "~~~~",
                "尾部abc",
            ].join("\n");
            (0, vitest_1.expect)(run(text)).toBe([
                "---",
                "title: 中文abc",
                "---",
                "正文 abc",
                "```js",
                "const 中文a = 1",
                "```",
                "$$",
                "x中文y",
                "$$",
                "~~~~",
                "```",
                "中文abc",
                "~~~~",
                "尾部 abc",
            ].join("\n"));
        });
        (0, vitest_1.it)("首行 --- 没有收尾时是分割线，不当 front matter", () => {
            (0, vitest_1.expect)(run("---\n中文abc")).toBe("---\n中文 abc");
        });
    });
    (0, vitest_1.describe)("全角标点", () => {
        const run = (text) => (0, MarkdownFormatter_1.formatMarkdown)(text, only("fullwidthPunctuation"));
        (0, vitest_1.it)("中文后的半角标点转全角", () => {
            (0, vitest_1.expect)(run("你好,世界;注意:小心!真的?结束.")).toBe("你好，世界；注意：小心！真的？结束。");
        });
        (0, vitest_1.it)("英文语境、域名、图片、emoji 短码、小数不动", () => {
            (0, vitest_1.expect)(run("Hello, world. 你好a.com 中文![x](y) 中文:smile: 3.14")).toBe("Hello, world. 你好a.com 中文![x](y) 中文:smile: 3.14");
        });
        (0, vitest_1.it)("括号内含中文才转全角", () => {
            (0, vitest_1.expect)(run("说明(见下文)和中文(English)")).toBe("说明（见下文）和中文(English)");
        });
        (0, vitest_1.it)("嵌套括号与括号后的标点一次转换到位", () => {
            (0, vitest_1.expect)(run("说明(中文),下一句")).toBe("说明（中文），下一句");
            (0, vitest_1.expect)(run("说明(外层(内层中文))")).toBe("说明（外层（内层中文））");
        });
    });
    (0, vitest_1.describe)("直角引号", () => {
        const run = (text) => (0, MarkdownFormatter_1.formatMarkdown)(text, only("cornerQuotes"));
        (0, vitest_1.it)("含中文的弯引号、直引号转直角引号，嵌套转双层", () => {
            (0, vitest_1.expect)(run('他说“你好‘朋友’”，她说"再见"')).toBe("他说「你好『朋友』」，她说「再见」");
        });
        (0, vitest_1.it)("纯英文引号、属性里的引号、英文缩写不动", () => {
            (0, vitest_1.expect)(run('say "hello" and don’t 中文 it’s')).toBe('say "hello" and don’t 中文 it’s');
            (0, vitest_1.expect)(run('中文{style="color:red"}')).toBe('中文{style="color:red"}');
        });
    });
    (0, vitest_1.describe)("清理空白", () => {
        const run = (text) => (0, MarkdownFormatter_1.formatMarkdown)(text, only("whitespace"));
        (0, vitest_1.it)("去零宽字符、nbsp 转空格、行尾空白、连续空行压成一行", () => {
            (0, vitest_1.expect)(run("a\u200bb\u00a0c  \t\n\n\n\n\nd")).toBe("ab c\n\nd");
        });
        (0, vitest_1.it)("行尾两个空格的硬换行保留，单个空格去掉", () => {
            (0, vitest_1.expect)(run("第一行  \n第二行 \n第三行")).toBe("第一行  \n第二行\n第三行");
        });
        (0, vitest_1.it)("全角空格缩进保留，行尾全角空格去掉", () => {
            (0, vitest_1.expect)(run("\u3000\u3000首行缩进\u3000")).toBe("\u3000\u3000首行缩进");
        });
        (0, vitest_1.it)("代码块内的空行与空白原样保留", () => {
            (0, vitest_1.expect)(run("```\na \n\n\n\nb\n```")).toBe("```\na \n\n\n\nb\n```");
        });
        (0, vitest_1.it)("行内代码、公式、链接目标里的 nbsp 与零宽字符不动", () => {
            const text = "代码`a\u00a0b\u200bc`和$a\u00a0b$和[文档](https://a.com/a\u00a0b)";
            (0, vitest_1.expect)(run(text)).toBe(text);
        });
        (0, vitest_1.it)("保持 CRLF 换行", () => {
            (0, vitest_1.expect)(run("a \r\n\r\n\r\nb")).toBe("a\r\n\r\nb");
        });
    });
    (0, vitest_1.describe)("结构与源文保护回归", () => {
        vitest_1.it.each([
            "[中文React](https://a.com/a(b(c))中文x)",
            "[中文React](https://a.com/a\\(b\\(c\\)\\)中文x)",
            "![中文React](./图(a(b(c)))中文x.png)",
            '[中文React](<https://a.com/中文x> "中文React,标题")',
        ])("保留嵌套、转义括号、尖括号和标题中的链接目标：%s", (text) => {
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe(text.replace("中文React]", "中文 React]"));
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, all)).toBe(result);
        });
        vitest_1.it.each([
            "[文档][中文React]\n\n[中文React]: /中文React",
            "> [文档][中文React]\n>\n> [中文React]: /中文React",
            "- [文档][中文React]\n\n  [中文React]: /中文React",
            '[文档][中文React]\n\n[中文React]:\n  /中文React\n  "中文React,标题"',
            "[中文React][]\n\n[中文React]: /中文React",
            "[中文React]\n\n[中文React]: /中文React",
            "![中文React][]\n\n[中文React]: /图中文React.png",
        ])("引用标识符与定义范围不改写：%s", (text) => {
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe(text);
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, all)).toBe(result);
        });
        (0, vitest_1.it)("显式引用的可见文字仍会格式化", () => {
            const text = "[中文React][标识React]\n\n[标识React]: /中文React";
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe("[中文 React][标识React]\n\n[标识React]: /中文React");
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
        });
        (0, vitest_1.it)("裸网址中的 ASCII 括号及其后中文路径不暴露给正文规则", () => {
            const text = "见https://a.com/a(b(c))中文x，然后React";
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe("见 https://a.com/a(b(c))中文x，然后 React");
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, all)).toBe(result);
        });
        (0, vitest_1.it)("跨行代码、公式及其行尾单空格保持原样", () => {
            const text = "说明`a \n中文React\u00a0b\u200bc`结束\n公式$x \n中文React$结束";
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe("说明 `a \n中文React\u00a0b\u200bc` 结束\n公式 $x \n中文React$ 结束");
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, all)).toBe(result);
        });
        vitest_1.it.each([
            '<span title="x > 中文React">正文React</span>',
            '<span\n title="x \n中文React\u00a0b\u200bc">正文React</span>',
            '<span title="x \n\n中文React">正文React</span>',
            '正文React{data-info="x } 中文React"}',
        ])("引号中的尖括号、大括号与跨行属性空白原样：%s", (text) => {
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe(text.replace("正文React", "正文 React"));
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, all)).toBe(result);
        });
        (0, vitest_1.it)("嵌在普通 HTML 容器里的原样 HTML 代码整块跳过", () => {
            const text = '<div>\n<pre>const x="中文React"; \n\n\n</pre>\n</div>';
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(text, all)).toBe(text);
        });
        (0, vitest_1.it)("正文中的原样 HTML 内容也不参与格式化", () => {
            const text = '说明React<pre>const x="中文React"; \n\n\n</pre>结束React';
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(text, all)).toBe('说明 React<pre>const x="中文React"; \n\n\n</pre>结束 React');
        });
        (0, vitest_1.it)("原文私用区字符、类似占位串和相邻字母不会碰撞", () => {
            const text = "中文\uE000`x` \uE800\uEFFF A<b>A \uE000w0\uE000";
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe(text);
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
        });
        (0, vitest_1.it)("保护数量超过 2048 时仍逐段准确还原", () => {
            const codes = Array.from({ length: 2050 }, (_, index) => `\`中文${index}\``).join(" ");
            const text = `正文${codes}结束`;
            const result = (0, MarkdownFormatter_1.formatMarkdown)(text, all);
            (0, vitest_1.expect)(result).toBe(`正文 ${codes} 结束`);
            (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
            (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, all)).toBe(result);
        });
        (0, vitest_1.it)("常用扩展语法在全部开关组合下幂等且保护内容不变", () => {
            const text = [
                "## 中文React{#标题React}",
                "",
                '- [x] 他说"中文React",用`中文React `和$x中文React$.',
                "",
                "| 中文React | [文档](https://a.com/a(b(c))中文x) |",
                "| --- | --- |",
                "| ==中文React== | ~~中文React~~ |",
                "",
                "[文档][标签React]",
                "",
                "[标签React]: /中文React",
            ].join("\n");
            for (let flags = 0; flags < 16; flags++) {
                const options = Object.fromEntries(Object.keys(off).map((key, index) => [
                    key,
                    Boolean(flags & (1 << index)),
                ]));
                const result = (0, MarkdownFormatter_1.formatMarkdown)(text, options);
                (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(result, options)).toBe(result);
                (0, vitest_1.expect)(protectedTokens(result)).toEqual(protectedTokens(text));
            }
        });
    });
    (0, vitest_1.it)("规则组合时幂等", () => {
        const all = {
            whitespace: true,
            pangu: true,
            fullwidthPunctuation: true,
            cornerQuotes: true,
        };
        const once = (0, MarkdownFormatter_1.formatMarkdown)('他说"你好",用React(很好)开发.\n\n\n结束', all);
        (0, vitest_1.expect)(once).toBe("他说「你好」，用 React（很好）开发。\n\n结束");
        (0, vitest_1.expect)((0, MarkdownFormatter_1.formatMarkdown)(once, all)).toBe(once);
    });
});
