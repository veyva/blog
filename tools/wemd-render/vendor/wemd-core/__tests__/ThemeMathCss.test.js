"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const themes_1 = require("../themes");
const themes = {
    academicPaperTheme: themes_1.academicPaperTheme,
    auroraGlassTheme: themes_1.auroraGlassTheme,
    basicTheme: themes_1.basicTheme,
    bauhausTheme: themes_1.bauhausTheme,
    codeGithubTheme: themes_1.codeGithubTheme,
    customDefaultTheme: themes_1.customDefaultTheme,
    cyberpunkNeonTheme: themes_1.cyberpunkNeonTheme,
    clearGuideTheme: themes_1.clearGuideTheme,
    dataBlueprintTheme: themes_1.dataBlueprintTheme,
    easternNotesTheme: themes_1.easternNotesTheme,
    knowledgeBaseTheme: themes_1.knowledgeBaseTheme,
    luxuryGoldTheme: themes_1.luxuryGoldTheme,
    morandiForestTheme: themes_1.morandiForestTheme,
    modernEditorialTheme: themes_1.modernEditorialTheme,
    neoBrutalismTheme: themes_1.neoBrutalismTheme,
    receiptTheme: themes_1.receiptTheme,
    sunsetFilmTheme: themes_1.sunsetFilmTheme,
    templateTheme: themes_1.templateTheme,
    whitespaceGalleryTheme: themes_1.whitespaceGalleryTheme,
};
(0, vitest_1.describe)("theme math css", () => {
    (0, vitest_1.it)("不会用宽泛公式 SVG 选择器影响 KaTeX 根号内部 SVG", () => {
        for (const [name, css] of Object.entries(themes)) {
            (0, vitest_1.expect)(css, name).not.toMatch(/#wemd\s+\.block-equation\s+svg\b/);
            (0, vitest_1.expect)(css, name).not.toMatch(/#wemd\s+\.inline-equation\s+svg\b/);
            (0, vitest_1.expect)(css, name).not.toMatch(/#wemd\s+\.katex-(?:block|inline)\s+svg\b/);
        }
    });
});
