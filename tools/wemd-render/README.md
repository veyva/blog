# WeMD Default Theme Renderer

Render a processed Markdown article to WeMD's built-in default theme and
produce:

- `wemd-output/<article>.html`: standalone preview with a one-click
  "复制到公众号" button.
- `wemd-output/<article>.fragment.html`: inline-styled rich HTML fragment.

Run from the blog repository root:

```bash
npm run wemd -- "/path/to/article.md"
```

The tool uses WeMD's MIT-licensed Markdown parser, default theme
(`basicTheme + customDefaultTheme + codeGithubTheme`), and `juice` style
inlining pipeline. Formulas are rendered by MathJax as inline SVG, matching
WeMD's copy-compatible rendering path while keeping formulas vector-based rather
than raster images.

This renderer intentionally uses the default theme regardless of the
frontmatter's `theme` field.

## Math formula compatibility

MathJax uses `fontCache: "none"`, so every formula SVG embeds its glyph paths
directly instead of referencing `<defs>`/`<use xlink:href>`. WeChat's editor
strips those cross-references, which is what caused formulas to disappear after
paste. The renderer also handles `\boldsymbol` → `\mathbf` fallback, skips
MathJax error output, and recolors black strokes to `currentColor`.

## Publish to the WeChat draft box

`publish.mjs` renders the article, uploads its images to WeChat, uploads the
cover as permanent material, and creates a draft via the official APIs.

```bash
# 1. check credentials
npm run wemd-publish -- doctor

# 2. create a draft (returns a media_id for preview)
npm run wemd-publish -- draft "/path/to/article.md" --cover "/path/to/cover.jpg"

# 3. after previewing in the WeChat back end / mobile client, publish
npm run wemd-publish -- publish "<draft_media_id>"
```

Credentials come from `WECHAT_APPID` / `WECHAT_SECRET` (or `WX_APP_ID` /
`WX_APP_SECRET`) env vars, or
`~/.config/wechat-official-publisher/config.json`:

```json
{
  "appId": "wx...",
  "appSecret": "..."
}
```

Prerequisites: the WeChat Official Account must have draft (`draft/add`) and
publish (`freepublish/submit`) permission, and the server's public IP must be in
the API whitelist.
