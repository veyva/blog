"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MarkdownParser_1 = require("../MarkdownParser");
(0, vitest_1.describe)("Markdown 属性语法", () => {
    (0, vitest_1.it)("为标题和段落添加合法的 class、id 与 data 属性", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("## 本章摘要 {.chapter-title #chapter-summary data-kind=heading}\n\n这是一段摘要。 {.summary .featured #abstract data-kind=summary}");
        (0, vitest_1.expect)(html).toContain('<h2 class="chapter-title" id="chapter-summary" data-kind="heading">');
        (0, vitest_1.expect)(html).toContain('<p class="summary featured" id="abstract" data-kind="summary">这是一段摘要。</p>');
        (0, vitest_1.expect)(html).not.toContain("{.chapter-title");
        (0, vitest_1.expect)(html).not.toContain("{.summary");
    });
    (0, vitest_1.it)("将表格属性放到 table 并保留现有外层容器", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("| 指标 | 数值 |\n| --- | --- |\n| 阅读量 | 1200 |\n\n{.compact-table #metrics data-kind=statistics}");
        (0, vitest_1.expect)(html).toContain('<section class="table-container"><table');
        (0, vitest_1.expect)(html).toContain('<table class="compact-table" id="metrics" data-kind="statistics">');
        (0, vitest_1.expect)(html).not.toContain("{.compact-table");
    });
    (0, vitest_1.it)("拒绝危险属性和 WeMD 保留属性", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render('受限属性。 {.notice #wemd data-safe=yes data-tool=forged data-wemd-counter-generated=before style="color:red" onclick="alert(1)"}');
        (0, vitest_1.expect)(html).toContain('<p class="notice" data-safe="yes">受限属性。</p>');
        (0, vitest_1.expect)(html).not.toContain('id="wemd"');
        (0, vitest_1.expect)(html).not.toContain("data-tool");
        (0, vitest_1.expect)(html).not.toContain("data-wemd-");
        (0, vitest_1.expect)(html).not.toContain("style=");
        (0, vitest_1.expect)(html).not.toContain("onclick=");
    });
    (0, vitest_1.it)("不把转义语法、普通大括号和公式误解析", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("\\{.standalone}\n\n转义属性：\\{.notice}\n\n普通内容：{尚未完成}\n\n公式：$x^{2}$");
        (0, vitest_1.expect)(html).toContain("{.standalone}");
        (0, vitest_1.expect)(html).toContain("转义属性：{.notice}");
        (0, vitest_1.expect)(html).toContain("普通内容：{尚未完成}");
        (0, vitest_1.expect)(html).toContain('class="katex"');
    });
    (0, vitest_1.it)("不为代码围栏应用属性语法", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("```ts {.danger}\nconst value = 1;\n```");
        (0, vitest_1.expect)(html).toContain('<pre class="custom">');
        (0, vitest_1.expect)(html).toContain("value =");
        (0, vitest_1.expect)(html).toContain('class="hljs-number">1</span>');
        (0, vitest_1.expect)(html).not.toContain('class="danger"');
    });
    (0, vitest_1.it)("保留列表项、分隔线、表格单元格和软换行后的属性文本", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("- 列表项 {.list-item}\n\n--- {.divider}\n\n| 项目 | 状态 |\n| --- | --- |\n| 属性 | 保留 {.cell} |\n\n第一行\n{.softbreak}");
        (0, vitest_1.expect)(html).toContain("列表项 {.list-item}");
        (0, vitest_1.expect)(html).toContain("<p>--- {.divider}</p>");
        (0, vitest_1.expect)(html).toContain("保留 {.cell}");
        (0, vitest_1.expect)(html).toContain("第一行\n{.softbreak}");
        (0, vitest_1.expect)(html).not.toContain('class="list-item"');
        (0, vitest_1.expect)(html).not.toContain('class="divider"');
        (0, vitest_1.expect)(html).not.toContain('class="cell"');
        (0, vitest_1.expect)(html).not.toContain('class="softbreak"');
    });
    (0, vitest_1.it)("不改写用户原文中的私用区字符", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("私用区：\uE000原文\uE001");
        (0, vitest_1.expect)(html).toContain("\uE000原文\uE001");
    });
    (0, vitest_1.it)("允许列表内实际渲染为段落、标题和表格的元素使用属性", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("- ## 嵌套标题 {.nested-heading}\n\n  松散段落 {.nested-paragraph}\n\n  | 项目 | 状态 |\n  | --- | --- |\n  | 属性 | 生效 |\n\n  {.nested-table}");
        (0, vitest_1.expect)(html).toContain('<h2 class="nested-heading">');
        (0, vitest_1.expect)(html).toContain('<p class="nested-paragraph">松散段落</p>');
        (0, vitest_1.expect)(html).toContain('<table class="nested-table">');
        (0, vitest_1.expect)(html).not.toContain('<li class="nested-heading"');
    });
    (0, vitest_1.it)("不把松散列表首段的列表项属性重新解释为段落属性", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("- 首段 {.loose-list-item}\n\n  第二段 {.nested-paragraph}");
        (0, vitest_1.expect)(html).toContain("<p>首段 {.loose-list-item}</p>");
        (0, vitest_1.expect)(html).toContain('<p class="nested-paragraph">第二段</p>');
        (0, vitest_1.expect)(html).not.toContain('class="loose-list-item"');
    });
    (0, vitest_1.it)("为图片添加合法属性且不允许覆盖图片来源", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render('![封面](cover.png "封面标题"){.hero-image #cover data-kind=hero src=evil.png alt=evil onclick="alert(1)"}');
        (0, vitest_1.expect)(html).toContain("<figure>");
        (0, vitest_1.expect)(html).toContain('src="cover.png"');
        (0, vitest_1.expect)(html).toContain('alt="封面"');
        (0, vitest_1.expect)(html).toContain('class="hero-image"');
        (0, vitest_1.expect)(html).toContain('id="cover"');
        (0, vitest_1.expect)(html).toContain('data-kind="hero"');
        (0, vitest_1.expect)(html).not.toContain("evil.png");
        (0, vitest_1.expect)(html).not.toContain('onclick="');
        (0, vitest_1.expect)(html).not.toContain("{.hero-image");
    });
    (0, vitest_1.it)("为普通链接添加合法属性且不允许覆盖链接地址", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render('[查看详情](https://example.com){.cta-link #details data-kind=external href="https://evil.example" onclick="alert(1)"}');
        (0, vitest_1.expect)(html).toContain('href="https://example.com"');
        (0, vitest_1.expect)(html).toContain('class="cta-link"');
        (0, vitest_1.expect)(html).toContain('id="details"');
        (0, vitest_1.expect)(html).toContain('data-kind="external"');
        (0, vitest_1.expect)(html).not.toContain("evil.example");
        (0, vitest_1.expect)(html).not.toContain('onclick="');
        (0, vitest_1.expect)(html).not.toContain("{.cta-link");
    });
    (0, vitest_1.it)("链接被转换为脚注时保留无承载目标的属性文本", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render('[资料来源](https://example.com "来源说明"){.source-link}');
        (0, vitest_1.expect)(html).toContain("资料来源");
        (0, vitest_1.expect)(html).toContain("{.source-link}");
        (0, vitest_1.expect)(html).not.toContain('class="source-link"');
    });
    (0, vitest_1.it)("为现有行内格式元素添加局部属性", () => {
        const parser = (0, MarkdownParser_1.createMarkdownParser)({ mathRenderer: "katex" });
        const html = parser.render("*斜体*{.emphasis} **粗体**{.strong} ~~删除~~{.deleted} `代码`{.inline-code} ==高亮=={.marked} ++下划线++{.underlined} H~2~{.subscript} X^2^{.superscript}");
        (0, vitest_1.expect)(html).toContain('<em class="emphasis">斜体</em>');
        (0, vitest_1.expect)(html).toContain('<strong class="strong">粗体</strong>');
        (0, vitest_1.expect)(html).toContain('<s class="deleted">删除</s>');
        (0, vitest_1.expect)(html).toContain('<code class="inline-code">代码</code>');
        (0, vitest_1.expect)(html).toContain('<mark class="marked">高亮</mark>');
        (0, vitest_1.expect)(html).toContain('<u class="underlined">下划线</u>');
        (0, vitest_1.expect)(html).toContain('H<sub class="subscript">2</sub>');
        (0, vitest_1.expect)(html).toContain('X<sup class="superscript">2</sup>');
    });
});
