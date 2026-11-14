#!/usr/bin/env node
/**
 * Publish a Markdown article to the WeChat Official Account draft box.
 *
 * Pipeline:
 *   1. Render Markdown with the WeMD default theme (SVG math, no external CSS).
 *   2. Upload article images to WeChat and rewrite <img src>.
 *   3. Upload the cover image as permanent material.
 *   4. Create a draft (returns media_id) or submit an existing draft for
 *      publish (requires explicit --mode publish).
 *
 * Config: WECHAT_APPID / WECHAT_SECRET env vars, or
 * ~/.config/wechat-official-publisher/config.json with appId/appSecret.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { renderMarkdown } from "./renderer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(__dirname, "../..");
const GITHUB_RAW_PREFIX = "https://raw.githubusercontent.com/veyva/blog/HEAD/";

// ── Config ────────────────────────────────────────────────────────────────

const expandHome = (filePath) => {
  if (filePath === "~") return os.homedir();
  if (filePath.startsWith("~/")) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
};

const loadConfig = () => {
  const configDir = path.join(os.homedir(), ".config", "wechat-official-publisher");
  const cacheDir = path.join(os.homedir(), ".cache", "wechat-official-publisher");
  const configPath = process.env.WECHAT_PUBLISHER_CONFIG
    ? expandHome(process.env.WECHAT_PUBLISHER_CONFIG)
    : path.join(configDir, "config.json");

  let fileConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
      console.warn(`[blog-publish] config parse failed: ${error.message}`);
    }
  }

  return {
    appId:
      process.env.WECHAT_APPID ??
      process.env.WX_APP_ID ??
      fileConfig.appId ??
      "",
    appSecret:
      process.env.WECHAT_SECRET ??
      process.env.WX_APP_SECRET ??
      fileConfig.appSecret ??
      "",
    apiBaseUrl: (
      process.env.WECHAT_API_BASE_URL ??
      fileConfig.apiBaseUrl ??
      "https://api.weixin.qq.com"
    ).replace(/\/+$/, ""),
    tokenCacheFile: expandHome(
      process.env.WECHAT_TOKEN_CACHE_FILE ??
        fileConfig.tokenCacheFile ??
        path.join(cacheDir, "token.json"),
    ),
  };
};

// ── WeChat API client ─────────────────────────────────────────────────────

const explainWeChatError = (code) => {
  switch (code) {
    case 40001:
      return "access_token invalid; check AppID/AppSecret and token cache";
    case 45004:
      return "draft content, title, digest, or embedded HTML may exceed WeChat limits";
    case 48001:
      return "API unauthorized; check account type, certification, and interface permissions";
    case 40164:
    case 61004:
      return "IP is not in WeChat API whitelist";
    default:
      return "";
  }
};

const mimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
};

class WeChatApi {
  constructor(config) {
    this.config = config;
  }

  async getAccessToken() {
    const cached = this.readToken();
    if (
      cached &&
      cached.appId === this.config.appId &&
      cached.expiresAt > Date.now() + 60_000
    ) {
      return cached.accessToken;
    }

    const response = await this.postJson("/cgi-bin/stable_token", {
      grant_type: "client_credential",
      appid: this.config.appId,
      secret: this.config.appSecret,
      force_refresh: false,
    });
    this.assertSuccess(response, "get stable token");
    if (!response.access_token || !response.expires_in) {
      throw new Error("stable_token response missing access_token or expires_in");
    }

    const payload = {
      accessToken: response.access_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      appId: this.config.appId,
    };
    fs.mkdirSync(path.dirname(this.config.tokenCacheFile), { recursive: true });
    fs.writeFileSync(this.config.tokenCacheFile, JSON.stringify(payload, null, 2));
    return payload.accessToken;
  }

  async uploadArticleImage(filePath) {
    const token = await this.getAccessToken();
    const response = await this.postMultipart(
      `/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(token)}`,
      filePath,
    );
    this.assertSuccess(response, "upload article image");
    if (!response.url) throw new Error("uploadimg response missing url");
    return response.url;
  }

  async uploadCoverImage(filePath) {
    const token = await this.getAccessToken();
    const response = await this.postMultipart(
      `/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`,
      filePath,
    );
    this.assertSuccess(response, "upload cover image");
    if (!response.media_id) throw new Error("add_material response missing media_id");
    return { mediaId: response.media_id, url: response.url };
  }

  async createDraft(payload) {
    const token = await this.getAccessToken();
    const response = await this.postJson(
      `/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`,
      payload,
    );
    this.assertSuccess(response, "create draft");
    if (!response.media_id) throw new Error("draft/add response missing media_id");
    return response.media_id;
  }

  async submitPublish(mediaId) {
    const token = await this.getAccessToken();
    const response = await this.postJson(
      `/cgi-bin/freepublish/submit?access_token=${encodeURIComponent(token)}`,
      { media_id: mediaId },
    );
    this.assertSuccess(response, "submit publish");
    if (!response.publish_id) {
      throw new Error("freepublish/submit response missing publish_id");
    }
    return response.publish_id;
  }

  readToken() {
    if (!fs.existsSync(this.config.tokenCacheFile)) return undefined;
    try {
      return JSON.parse(fs.readFileSync(this.config.tokenCacheFile, "utf8"));
    } catch {
      return undefined;
    }
  }

  async postJson(endpoint, payload) {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this.parseResponse(response);
  }

  async postMultipart(endpoint, filePath) {
    const multipart = this.buildMultipart(filePath);
    const response = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      headers: {
        "content-type": multipart.contentType,
      },
      body: multipart.body,
    });
    return this.parseResponse(response);
  }

  buildMultipart(filePath) {
    const boundary = `----blog-publish-${Date.now().toString(16)}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const filename = path.basename(filePath);
    const file = fs.readFileSync(filePath);
    const header = Buffer.from(
      [
        `--${boundary}`,
        `Content-Disposition: form-data; name="media"; filename="${filename}"`,
        `Content-Type: ${mimeType(filePath)}`,
        "",
        "",
      ].join("\r\n"),
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    return {
      body: Buffer.concat([header, file, footer]),
      contentType: `multipart/form-data; boundary=${boundary}`,
    };
  }

  async parseResponse(response) {
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(
        `WeChat response is not JSON status=${response.status} body=${text.slice(0, 300)}`,
      );
    }
    if (!response.ok) {
      throw new Error(`WeChat HTTP error status=${response.status} body=${text.slice(0, 300)}`);
    }
    return payload;
  }

  assertSuccess(payload, action) {
    if (!payload.errcode || payload.errcode === 0) return;
    const hint = explainWeChatError(payload.errcode);
    throw new Error(
      `${action} failed errcode=${payload.errcode} errmsg=${payload.errmsg ?? ""}${hint ? ` hint=${hint}` : ""}`,
    );
  }

  buildUrl(endpoint) {
    if (/^https?:\/\//.test(endpoint)) return endpoint;
    return `${this.config.apiBaseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }
}

// ── Image resolution / rewrite ────────────────────────────────────────────

const localPathForSrc = (src) => {
  if (!src.startsWith(GITHUB_RAW_PREFIX)) return null;
  const rel = decodeURIComponent(src.slice(GITHUB_RAW_PREFIX.length));
  return path.join(blogRoot, rel);
};

const downloadRemoteImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`download image failed status=${response.status} url=${url}`);
  }
  const extension = path.extname(new URL(url).pathname) || ".jpg";
  const tmpPath = path.join(
    os.tmpdir(),
    `blog-publish-${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`,
  );
  fs.writeFileSync(tmpPath, Buffer.from(await response.arrayBuffer()));
  return tmpPath;
};

const resolveImageFile = async (src, sourceDir) => {
  const local = localPathForSrc(src);
  if (local && fs.existsSync(local)) return local;
  if (/^https?:\/\//.test(src)) return downloadRemoteImage(src);
  const candidate = path.isAbsolute(src) ? src : path.join(sourceDir, src);
  if (fs.existsSync(candidate)) return candidate;
  throw new Error(`image file not found: ${src}`);
};

const rewriteImages = async (fragment, api, sourceDir) => {
  const $ = cheerio.load(fragment, { decodeEntities: false }, false);
  const images = $("img").toArray();

  for (const element of images) {
    const node = $(element);
    const src = node.attr("src");
    if (!src) continue;
    const file = await resolveImageFile(src, sourceDir);
    const url = await api.uploadArticleImage(file);
    node.attr("src", url);
    console.warn(`[blog-publish] image rewritten: ${src.slice(0, 80)} -> ${url.slice(0, 80)}`);
  }

  return { html: $.root().html() || "", imageCount: images.length };
};

// ── CLI ───────────────────────────────────────────────────────────────────

const usage = () => {
  console.error(`Usage:
  node publish.mjs doctor
  node publish.mjs draft <article.md> --cover <cover.jpg> [--out final.html]
  node publish.mjs publish <draft_media_id>
  node publish.mjs upload-image <image> [--purpose inline|cover]`);
  process.exit(1);
};

const args = process.argv.slice(2);
const [command, ...rest] = args;

const flagValue = (name) => {
  const index = rest.indexOf(`--${name}`);
  return index >= 0 ? rest[index + 1] : undefined;
};

const config = loadConfig();
const assertReady = () => {
  const missing = [];
  if (!config.appId) missing.push("WECHAT_APPID / WX_APP_ID");
  if (!config.appSecret) missing.push("WECHAT_SECRET / WX_APP_SECRET");
  if (missing.length > 0) {
    throw new Error(`WeChat config is not ready; missing ${missing.join(", ")}`);
  }
};

const run = async () => {
  if (!command || command === "doctor") {
    const missing = [];
    if (!config.appId) missing.push("WECHAT_APPID / WX_APP_ID");
    if (!config.appSecret) missing.push("WECHAT_SECRET / WX_APP_SECRET");
    console.log(
      JSON.stringify(
        {
          appIdPresent: Boolean(config.appId),
          appSecretPresent: Boolean(config.appSecret),
          apiBaseUrl: config.apiBaseUrl,
          tokenCacheFile: config.tokenCacheFile,
          readyForDraft: missing.length === 0,
          blockers: missing.map((name) => `missing ${name}`),
        },
        null,
        2,
      ),
    );
    return;
  }

  assertReady();
  const api = new WeChatApi(config);

  if (command === "upload-image") {
    const imagePath = rest[0];
    if (!imagePath) usage();
    const purpose = flagValue("purpose") ?? "inline";
    if (purpose === "cover") {
      const result = await api.uploadCoverImage(path.resolve(imagePath));
      console.log(JSON.stringify({ mediaId: result.mediaId, url: result.url }, null, 2));
    } else {
      const url = await api.uploadArticleImage(path.resolve(imagePath));
      console.log(JSON.stringify({ url }, null, 2));
    }
    return;
  }

  if (command === "publish") {
    const mediaId = rest[0];
    if (!mediaId) usage();
    const publishId = await api.submitPublish(mediaId);
    console.log(JSON.stringify({ publishId }, null, 2));
    return;
  }

  if (command === "draft") {
    const articlePath = rest[0];
    if (!articlePath) usage();
    const sourcePath = path.resolve(articlePath);
    const source = fs.readFileSync(sourcePath, "utf8");
    const result = await renderMarkdown(source);
    const sourceDir = path.dirname(sourcePath);

    const rewritten = await rewriteImages(result.fragment, api, sourceDir);

    const coverPath = flagValue("cover");
    const coverMediaId = flagValue("cover-media-id");
    if (coverPath && coverMediaId) {
      throw new Error("--cover and --cover-media-id cannot be used together");
    }
    let thumbMediaId = coverMediaId;
    if (!thumbMediaId) {
      if (!coverPath && !result.meta.cover) {
        throw new Error("draft requires a cover image: use --cover or frontmatter cover");
      }
      const resolvedCover = await resolveImageFile(
        coverPath ?? result.meta.cover,
        sourceDir,
      );
      const uploaded = await api.uploadCoverImage(resolvedCover);
      thumbMediaId = uploaded.mediaId;
    }

    const article = {
      title: result.meta.title || path.basename(sourcePath).replace(/\.md$/i, ""),
      content: rewritten.html,
      thumb_media_id: thumbMediaId,
      show_cover_pic: result.meta.showCoverPic === false ? 0 : 1,
    };
    if (result.meta.author) article.author = result.meta.author;
    if (result.meta.digest) article.digest = result.meta.digest;
    if (result.meta.contentSourceUrl) {
      article.content_source_url = result.meta.contentSourceUrl;
    }

    const mediaId = await api.createDraft({ articles: [article] });

    const outPath = flagValue("out");
    if (outPath) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, rewritten.html);
    }

    console.log(
      JSON.stringify(
        {
          mediaId,
          title: article.title,
          imageCount: rewritten.imageCount,
          formulaSvgs: result.formulaSvgs,
          formulaFallbacks: result.formulaFallbacks,
          bytes: Buffer.byteLength(rewritten.html),
        },
        null,
        2,
      ),
    );
    return;
  }

  usage();
};

run().catch((error) => {
  console.error(error.message);
  if (error.cause?.message) console.error(`cause: ${error.cause.message}`);
  process.exit(1);
});
