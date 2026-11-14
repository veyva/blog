"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modernEditorialTheme = void 0;
const modern_editorial_content_1 = require("./modern-editorial-content");
const modern_editorial_foundation_1 = require("./modern-editorial-foundation");
const modern_editorial_components_1 = require("./modern-editorial-components");
exports.modernEditorialTheme = [
    modern_editorial_foundation_1.modernEditorialFoundationTheme,
    modern_editorial_content_1.modernEditorialContentTheme,
    modern_editorial_components_1.modernEditorialComponentsTheme,
].join("\n");
