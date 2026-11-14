#!/usr/bin/env node
/**
 * Render Markdown with WeMD's built-in "default" theme and emit a standalone
 * HTML page with a one-click copy button.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStandalonePage, renderMarkdown } from "./renderer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(__dirname, "../..");

const markdownPath = process.argv[2];
if (!markdownPath) {
  console.error(
    "Usage: npm --prefix tools/wemd-render run render -- <article.md> [output.html]",
  );
  process.exit(1);
}

const sourcePath = path.resolve(markdownPath);
if (!fs.existsSync(sourcePath)) {
  console.error(`Markdown file not found: ${sourcePath}`);
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, "utf8");
const result = await renderMarkdown(source);
const baseName = path.basename(sourcePath).replace(/\.md$/i, "");

const outputPath = path.resolve(
  process.argv[3] || path.join(blogRoot, "wemd-output", `${baseName}.html`),
);
const fragmentPath = outputPath.replace(/\.html$/i, ".fragment.html");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  buildStandalonePage({
    title: result.meta.title || baseName,
    fragment: result.fragment,
  }),
);
fs.writeFileSync(fragmentPath, result.fragment);

console.log(
  JSON.stringify(
    {
      source: sourcePath,
      theme: "default",
      title: result.meta.title || baseName,
      html: outputPath,
      fragment: fragmentPath,
      bytes: Buffer.byteLength(result.fragment),
      formulaFallbacks: result.formulaFallbacks,
      formulaSvgs: result.formulaSvgs,
    },
    null,
    2,
  ),
);
