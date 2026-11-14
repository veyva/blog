import fs from "node:fs";
import { createRequire } from "node:module";
import * as cheerio from "cheerio";

const require = createRequire(import.meta.url);

const core = require("./vendor/wemd-core/index.js");
const mathjaxLoader = require("mathjax");
const {
  basicTheme,
  codeGithubTheme,
  createMarkdownParser,
  customDefaultTheme,
  processHtml,
} = core;

const FRONTMATTER_RE = /^(\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const decodeYamlScalar = (value) => {
  const text = String(value ?? "").trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
};

const firstNonEmpty = (...values) =>
  values.find((value) => String(value ?? "").trim()) ?? "";

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "true" || text === "1" || text === "yes") return true;
  if (text === "false" || text === "0" || text === "no") return false;
  return undefined;
};

const splitFrontmatter = (source) => {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { body: source, title: "", theme: "default" };

  const raw = match[2];
  const get = (key) =>
    decodeYamlScalar(
      raw.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1],
    );

  return {
    body: source.slice(match[0].length).trimStart(),
    title: get("title"),
    theme: get("theme") || "default",
    author: get("author"),
    cover: get("cover"),
    digest: firstNonEmpty(get("digest"), get("summary"), get("description")),
    contentSourceUrl: get("content_source_url") || get("contentSourceUrl"),
    showCoverPic: toBoolean(get("show_cover_pic") ?? get("showCoverPic")),
  };
};

const appendStyle = (element, declarations) => {
  const existing = element.attr("style")?.trim() || "";
  const separator = existing && !existing.endsWith(";") ? ";" : "";
  element.attr("style", `${existing}${separator}${declarations}`);
};

const isZeroSpacing = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  return normalized
    .split(/\s+/)
    .every((part) => ["0", "0px", "0%"].includes(part));
};

const parseBoxValue = (element, property, side) => {
  const explicit = element.css(`${property}-${side}`);
  if (explicit) return explicit;
  const shorthand = element.css(property);
  if (!shorthand) return "";
  const parts = shorthand.trim().split(/\s+/);
  const values =
    parts.length === 1
      ? [parts[0], parts[0], parts[0], parts[0]]
      : parts.length === 2
        ? [parts[0], parts[1], parts[0], parts[1]]
        : parts.length === 3
          ? [parts[0], parts[1], parts[2], parts[1]]
          : [parts[0], parts[1], parts[2], parts[3]];
  return values[{ top: 0, right: 1, bottom: 2, left: 3 }[side]];
};

const mergeSpacing = (existing, incoming) => {
  if (!existing || isZeroSpacing(existing)) return incoming;
  if (existing.trim().toLowerCase() === "auto") return existing;
  return `calc(${existing} + ${incoming})`;
};

const BOLDSYMBOL_COMMAND = "\\boldsymbol";

const replaceBoldSymbolWithMathbf = (latex) => {
  let output = "";
  let index = 0;

  while (index < latex.length) {
    const commandIndex = latex.indexOf(BOLDSYMBOL_COMMAND, index);
    if (commandIndex === -1) {
      output += latex.slice(index);
      break;
    }

    output += latex.slice(index, commandIndex);
    let cursor = commandIndex + BOLDSYMBOL_COMMAND.length;
    while (/\s/.test(latex[cursor] || "")) cursor += 1;

    if (latex[cursor] === "{") {
      let depth = 0;
      let end = cursor;
      for (; end < latex.length; end += 1) {
        const char = latex[end];
        if (char === "{") depth += 1;
        if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            end += 1;
            break;
          }
        }
      }

      if (depth !== 0) {
        output += latex.slice(commandIndex);
        return output;
      }

      output += `\\mathbf{${latex.slice(cursor + 1, end - 1)}}`;
      index = end;
      continue;
    }

    if (latex[cursor] === "\\") {
      const commandMatch = latex.slice(cursor).match(/^\\[a-zA-Z]+|^\\./);
      if (commandMatch) {
        output += `\\mathbf{${commandMatch[0]}}`;
        index = cursor + commandMatch[0].length;
        continue;
      }
    }

    if (latex[cursor]) {
      output += `\\mathbf{${latex[cursor]}}`;
      index = cursor + 1;
      continue;
    }

    output += BOLDSYMBOL_COMMAND;
    index = cursor;
  }

  return output;
};

const getMathJaxLatexCandidates = (latex) => {
  const mathbfLatex = replaceBoldSymbolWithMathbf(latex);
  return mathbfLatex === latex ? [latex] : [latex, mathbfLatex];
};

const isDefaultBlack = (value) =>
  ["black", "#000", "#000000", "rgb(0,0,0)", "rgba(0,0,0,1)"].includes(
    String(value ?? "").trim().toLowerCase().replace(/\s+/g, ""),
  );

const applyCurrentColor = ($, svg) => {
  const retarget = (element) => {
    const node = $(element);
    if (node.attr("data-bgcolor") !== undefined) return;

    for (const attr of ["fill", "stroke"]) {
      const value = node.attr(attr);
      if (value && isDefaultBlack(value)) {
        node.attr(attr, "currentColor");
      }
      const styleValue = node.css(attr);
      if (styleValue && isDefaultBlack(styleValue)) {
        node.css(attr, "currentColor");
      }
    }
  };

  retarget(svg[0]);
  svg.find("[fill], [stroke], [style]").each((_, element) => retarget(element));
};

const hasMathJaxError = (renderedDom) =>
  renderedDom("mjx-merror, merror, [data-mjx-error]").length > 0;

const materializeCodeLineBreaks = ($) => {
  $("pre > code").each((_, code) => {
    const element = $(code);
    const contents = element.contents().toArray();
    contents.forEach((node) => {
      if (node.type !== "text" || !/[\r\n]/.test(node.data)) return;
      const lines = node.data.split(/\r\n?|\n/);
      const replacement = [];
      lines.forEach((line, index) => {
        if (index > 0) replacement.push($("<br>")[0]);
        if (line) replacement.push({ type: "text", data: line });
      });
      $(node).replaceWith(replacement);
    });
  });
};

const normalizeInlineStylesForWechat = ($) => {
  $("[style]").each((_, element) => {
    const node = $(element);
    const textAlign = (node.css("text-align") || "").trim().toLowerCase();
    if (textAlign === "start") node.css("text-align", "left");
    if (textAlign === "end") node.css("text-align", "right");

    const fontSizeText = node.css("font-size") || "";
    const lineHeightText = (node.css("line-height") || "").trim();
    if (
      fontSizeText &&
      /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(lineHeightText) &&
      !node.is("[data-wemd-root]")
    ) {
      const fontSize = Number.parseFloat(fontSizeText);
      const multiplier = Number.parseFloat(lineHeightText);
      if (Number.isFinite(fontSize) && fontSize > 0) {
        node.css(
          "line-height",
          `${Math.round(fontSize * multiplier * 1000) / 1000}px`,
        );
      }
    }

    node.css("caret-color", "");
    if (!node.attr("style")?.trim()) node.removeAttr("style");

    if (node.is("p")) {
      const marginTop = parseBoxValue(node, "margin", "top");
      const marginRight = parseBoxValue(node, "margin", "right");
      const marginBottom = parseBoxValue(node, "margin", "bottom");
      const marginLeft = parseBoxValue(node, "margin", "left");
      if (marginTop || marginRight || marginBottom || marginLeft) {
        const declarations = (node.attr("style") || "")
          .split(";")
          .map((item) => item.trim())
          .filter(
            (item) =>
              item &&
              !/^margin(?:-(?:top|right|bottom|left))?\s*:/i.test(item),
          );
        if (marginTop) declarations.push(`margin-top: ${marginTop}`);
        if (marginRight) declarations.push(`margin-right: ${marginRight}`);
        if (marginBottom) declarations.push(`margin-bottom: ${marginBottom}`);
        if (marginLeft) declarations.push(`margin-left: ${marginLeft}`);
        node.attr("style", `${declarations.join("; ")};`);
      }
    }
  });
};

const normalizeRootForWechat = ($) => {
  const root = $("section#wemd").first();
  if (root.length === 0) return;

  const padding = {
    top: parseBoxValue(root, "padding", "top"),
    right: parseBoxValue(root, "padding", "right"),
    bottom: parseBoxValue(root, "padding", "bottom"),
    left: parseBoxValue(root, "padding", "left"),
  };
  const hasHorizontalPadding =
    !isZeroSpacing(padding.left) || !isZeroSpacing(padding.right);

  if (hasHorizontalPadding) {
    root.children().each((_, child) => {
      const node = $(child);
      const useMargin =
        /^(H[1-6]|BLOCKQUOTE|PRE|HR)$/.test(child.tagName || "") ||
        node.hasClass("callout") ||
        node.hasClass("table-container");
      if (!isZeroSpacing(padding.left)) {
        if (useMargin) {
          node.css(
            "margin-left",
            mergeSpacing(node.css("margin-left"), padding.left),
          );
        } else {
          node.css(
            "padding-left",
            mergeSpacing(node.css("padding-left"), padding.left),
          );
        }
      }
      if (!isZeroSpacing(padding.right)) {
        if (useMargin) {
          node.css(
            "margin-right",
            mergeSpacing(node.css("margin-right"), padding.right),
          );
        } else {
          node.css(
            "padding-right",
            mergeSpacing(node.css("padding-right"), padding.right),
          );
        }
      }
    });
  }

  for (const side of ["top", "right", "bottom", "left"]) {
    if (!isZeroSpacing(padding[side])) root.css(`padding-${side}`, "");
  }
  root.css("padding", "");

  const attributes = root.attr();
  const wrapper = $("<div></div>");
  Object.entries(attributes || {}).forEach(([name, value]) => {
    if (name === "id") return;
    wrapper.attr(name, value);
  });
  wrapper.attr("data-wemd-root", "");
  wrapper.html(root.html() || "");
  root.replaceWith(wrapper);
};

const isUnresolvedColorValue = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return true;
  return (
    ["inherit", "initial", "unset", "revert", "revert-layer", "currentcolor"].includes(
      normalized,
    ) ||
    normalized.includes("var(") ||
    normalized.includes("color-mix(") ||
    normalized.includes("oklch(") ||
    normalized.includes("oklab(") ||
    normalized.includes("lab(") ||
    normalized.includes("lch(")
  );
};

const hasDirectTextContent = (element) =>
  element.contents().toArray().some(
    (node) => node.type === "text" && (node.data || "").trim(),
  );

const materializeTextColorForWechat = ($) => {
  const root = $("[data-wemd-root]").first();
  if (root.length === 0) return;

  const rootColorRaw = (root.css("color") || "").trim();
  const baseColor = isUnresolvedColorValue(rootColorRaw)
    ? "#1a1a1a"
    : rootColorRaw;

  const walk = (element, inheritedColor) => {
    const node = $(element);
    const ownColorRaw = (node.css("color") || "").trim();
    const ownColor = isUnresolvedColorValue(ownColorRaw) ? null : ownColorRaw;
    const effectiveColor = ownColor || inheritedColor;

    if (hasDirectTextContent(node) && ownColor !== effectiveColor) {
      node.css("color", effectiveColor);
    }

    node.children().each((_, child) => walk(child, effectiveColor));
  };

  walk(root[0], baseColor);
};

const normalizeForWechat = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false }, false);

  materializeCodeLineBreaks($);
  $(".katex-mathml").remove();
  $('annotation[encoding="application/x-tex"]').remove();
  $("[data-latex]").removeAttr("data-latex");
  $("[data-tool]").removeAttr("data-tool");
  $(".katex, .katex-html, .base").each((_, element) => {
    appendStyle($(element), "white-space:nowrap;");
  });
  $(".katex-html, .base").each((_, element) => {
    appendStyle($(element), "display:inline-block;width:auto;min-width:0;");
  });

  $(".table-container").each((_, element) => {
    appendStyle(
      $(element),
      "overflow-x:auto;-webkit-overflow-scrolling:touch;",
    );
  });
  $(".table-container table").each((_, element) => {
    appendStyle(
      $(element),
      "border-collapse:collapse;table-layout:auto;min-width:100%;white-space:nowrap;",
    );
  });
  $(".table-container th, .table-container td").each((_, element) => {
    appendStyle(
      $(element),
      "line-height:1.4;padding:6px 8px;white-space:nowrap;text-align:center;",
    );
  });

  $(".inline-equation > svg").each((_, element) => {
    $(element).css("display", "inline-block");
    $(element).css("margin", "0");
  });
  $(".block-equation > svg").each((_, element) => {
    $(element).css("display", "block");
    $(element).css("margin", "1em auto");
  });

  normalizeInlineStylesForWechat($);
  normalizeRootForWechat($);
  materializeTextColorForWechat($);
  return $.root().html() || "";
};

const renderFormulasAsSvg = (html, MathJax) => {
  const $ = cheerio.load(html, { decodeEntities: false }, false);
  let fallbackCount = 0;
  let svgCount = 0;

  for (const element of $(
    ".inline-equation[data-latex], .block-equation[data-latex]",
  ).toArray()) {
    const node = $(element);
    const latex = node.attr("data-latex") || "";
    const display = node.hasClass("block-equation");
    if (!latex.trim()) continue;

    let replaced = false;
    for (const candidate of getMathJaxLatexCandidates(latex)) {
      try {
        if (typeof MathJax.texReset === "function") MathJax.texReset();
        const rendered = MathJax.startup.adaptor.outerHTML(
          MathJax.tex2svg(candidate, { display }),
        );
        const renderedDom = cheerio.load(
          rendered,
          { decodeEntities: false },
          false,
        );
        if (hasMathJaxError(renderedDom)) {
          throw new Error("MathJax 输出包含错误");
        }
        const svg = renderedDom("svg").first();
        if (svg.length === 0) throw new Error("MathJax did not return SVG");

        const width =
          svg.attr("width") || svg.css("width") || svg.css("min-width");
        const height = svg.attr("height") || svg.css("height");
        const hasViewBox = svg.attr("viewBox") !== undefined;
        svg.removeAttr("width");
        svg.removeAttr("height");
        svg.attr("xmlns", "http://www.w3.org/2000/svg");
        svg.css("min-width", "");
        if (width) svg.css("width", width);
        svg.css("height", hasViewBox || !height ? "auto" : height);
        svg.css("max-width", "100%");
        applyCurrentColor(renderedDom, svg);
        if (display) {
          svg.css("display", "block");
          svg.css("margin", "1em auto");
        }
        node.empty().append(renderedDom.html(svg));
        node.removeAttr("data-latex");
        svgCount += 1;
        replaced = true;
        break;
      } catch {
        // 尝试下一个候选 latex（\boldsymbol → \mathbf）
      }
    }

    if (!replaced) {
      node.text(display ? `$$${latex}$$` : `$${latex}$`);
      node.removeAttr("data-latex");
      fallbackCount += 1;
      console.warn(`Formula fallback for ${JSON.stringify(latex)}`);
    }
  }

  return {
    html: $.root().html() || "",
    fallbackCount,
    svgCount,
  };
};

export async function renderMarkdown(source) {
  const meta = splitFrontmatter(source);
  if (meta.theme !== "default") {
    console.warn(
      `Warning: source requests theme "${meta.theme}"; this tool intentionally uses WeMD's default theme.`,
    );
  }

  const parser = createMarkdownParser({
    mathRenderer: "katex",
    showMacBar: false,
  });
  const rawHtml = parser.render(meta.body);
  const MathJax = await mathjaxLoader.init({
    loader: {
      load: [
        "input/tex",
        "output/svg",
        "[tex]/color",
        "[tex]/boldsymbol",
        "[tex]/cancel",
        "[tex]/enclose",
      ],
    },
    tex: {
      packages: { "[+]": ["color", "boldsymbol", "cancel", "enclose"] },
      macros: {
        bm: ["\\boldsymbol{#1}", 1],
        sout: ["\\enclose{horizontalstrike}{#1}", 1],
      },
    },
    svg: { fontCache: "none" },
  });
  const katexCssPath = require.resolve("katex/dist/katex.min.css");
  const themeStyles = [
    basicTheme,
    customDefaultTheme,
    codeGithubTheme,
    fs.readFileSync(katexCssPath, "utf8"),
  ].join("\n");
  const themedFragment = processHtml(rawHtml, themeStyles, true, true);
  const formulas = renderFormulasAsSvg(themedFragment, MathJax);
  const fragment = normalizeForWechat(formulas.html);

  return {
    meta,
    fragment,
    formulaFallbacks: formulas.fallbackCount,
    formulaSvgs: formulas.svgCount,
  };
}

const safeTitle = (title, fallback) =>
  (title || fallback || "WeMD 排版文章").replace(/[&<>"]/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
  });

export const buildStandalonePage = ({ title, fragment }) => {
  const escapedTitle = safeTitle(title);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f5f4; color: #242a26; }
    .render-toolbar {
      position: sticky; top: 0; z-index: 10; display: flex; gap: 12px;
      align-items: center; padding: 12px 20px; background: #12241c;
      color: white; font: 14px/1.4 -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
    }
    .render-toolbar span { flex: 1; }
    .render-toolbar button {
      border: 0; border-radius: 6px; padding: 8px 14px; cursor: pointer;
      background: #d1fae5; color: #064e3b; font-weight: 700;
    }
    .render-page {
      width: min(760px, calc(100vw - 24px));
      margin: 28px auto 80px; padding: 28px; background: white;
      box-shadow: 0 8px 30px rgb(18 36 28 / 10%);
    }
    @media (max-width: 720px) {
      .render-page { margin-top: 0; padding: 18px 14px; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="render-toolbar">
    <span>WeMD 默认主题排版</span>
    <button id="copy-wechat">复制到公众号</button>
    <button id="copy-html">复制 HTML</button>
  </div>
  <main class="render-page">
    ${fragment}
  </main>
  <script>
    const getPayload = () => {
      const container = document.querySelector("[data-wemd-root]");
      if (!container) throw new Error("未找到排版内容");
      const normalized = container.cloneNode(true);
      normalized.removeAttribute("data-wemd-root");
      return {
        html: normalized.outerHTML,
        text: container.innerText || container.textContent || ""
      };
    };
    const copyRich = async () => {
      const payload = getPayload();
      let copyEventObserved = false;
      const handleCopy = () => {
        copyEventObserved = true;
      };
      document.addEventListener("copy", handleCopy, true);
      const range = document.createRange();
      range.selectNodeContents(document.querySelector("[data-wemd-root]"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      let commandSucceeded = false;
      try {
        commandSucceeded = document.execCommand("copy");
      } finally {
        document.removeEventListener("copy", handleCopy, true);
        selection.removeAllRanges();
      }
      if (commandSucceeded && copyEventObserved) return;
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([payload.html], { type: "text/html" }),
            "text/plain": new Blob([payload.text], { type: "text/plain" })
          })
        ]);
        return;
      }
      throw new Error("浏览器未写入富文本剪贴板");
    };
    document.querySelector("#copy-wechat").addEventListener("click", async () => {
      try {
        await copyRich();
        document.querySelector("#copy-wechat").textContent = "已复制，粘贴到公众号";
      } catch (error) {
        alert("复制失败：" + error.message);
      }
    });
    document.querySelector("#copy-html").addEventListener("click", async () => {
      try {
        const payload = getPayload();
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.html);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = payload.html;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }
        document.querySelector("#copy-html").textContent = "HTML 已复制";
      } catch (error) {
        alert("复制失败：" + error.message);
      }
    });
  </script>
</body>
</html>`;
};
