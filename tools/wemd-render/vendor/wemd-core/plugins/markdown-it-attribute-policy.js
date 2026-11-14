"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ATTRIBUTE_EXPRESSION = /(?:^|\s)(?:[.#][A-Za-z_][\w-]*|[A-Za-z_:][\w:.-]*\s*=)/;
const ATTRIBUTE_BLOCK = /\{([^{}\n]*)\}/g;
const ATTRIBUTE_ONLY = /^\s*\{[^{}\n]*\}\s*$/;
const HORIZONTAL_RULE_WITH_ATTRIBUTES = /^ {0,3}[-*_]{3,} ?\{/;
const SUPPORTED_BLOCK_TAGS = new Set([
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "table",
]);
const SUPPORTED_PAIRED_INLINE_TAGS = new Set([
    "a",
    "em",
    "strong",
    "s",
    "mark",
    "u",
    "sub",
    "sup",
]);
const SUPPORTED_ZERO_NESTING_TAGS = new Set(["img", "code"]);
const LIST_TOKEN_TYPES = new Set([
    "bullet_list_open",
    "bullet_list_close",
    "ordered_list_open",
    "ordered_list_close",
    "list_item_open",
    "list_item_close",
]);
const protectBraces = (value, allowAttributes, placeholders) => value.replace(ATTRIBUTE_BLOCK, (match, content, offset) => {
    const isAttribute = ATTRIBUTE_EXPRESSION.test(content);
    const isAttached = offset > 0 && !/\s/.test(value[offset - 1]);
    const shouldProtect = !isAttribute || !allowAttributes || isAttached;
    if (!shouldProtect)
        return match;
    return `${placeholders.left}${content}${placeholders.right}`;
});
const restoreBraces = (value, placeholders) => value.split(placeholders.left).join("{").split(placeholders.right).join("}");
const visitTokens = (tokens, visitor) => {
    tokens.forEach((token) => {
        visitor(token);
        if (token.children)
            visitTokens(token.children, visitor);
    });
};
const isReservedAttribute = ([name, value]) => {
    const normalizedName = name.toLowerCase();
    return ((normalizedName === "id" && value.toLowerCase() === "wemd") ||
        normalizedName === "data-tool" ||
        normalizedName.startsWith("data-wemd-"));
};
const isSupportedAttributeTarget = (token) => (token.nesting === 1 &&
    (SUPPORTED_BLOCK_TAGS.has(token.tag) ||
        SUPPORTED_PAIRED_INLINE_TAGS.has(token.tag))) ||
    (token.nesting === 0 && SUPPORTED_ZERO_NESTING_TAGS.has(token.tag));
const createPlaceholders = (state) => {
    let originalText = state.src;
    visitTokens(state.tokens, (token) => {
        originalText += token.content + token.info;
    });
    let suffix = 0;
    while (true) {
        const placeholders = {
            left: `\uE000wemd-attrs-left-${suffix}\uE001`,
            right: `\uE000wemd-attrs-right-${suffix}\uE001`,
        };
        if (!originalText.includes(placeholders.left) &&
            !originalText.includes(placeholders.right)) {
            return placeholders;
        }
        suffix += 1;
    }
};
const endsWithSoftbreakAttribute = (token) => {
    const children = token.children ?? [];
    const attribute = children.at(-1);
    return (children.at(-2)?.type === "softbreak" &&
        attribute?.type === "text" &&
        ATTRIBUTE_ONLY.test(attribute.content) &&
        ATTRIBUTE_EXPRESSION.test(attribute.content.slice(1, -1)));
};
const allowsBlockAttributes = (tokens, index) => {
    const token = tokens[index];
    const parent = tokens[index - 1];
    if (parent?.type === "heading_open")
        return true;
    if (parent?.type !== "paragraph_open")
        return false;
    if (parent.hidden)
        return false;
    if (tokens[index - 2]?.type === "wemd_list_item_open")
        return false;
    if (HORIZONTAL_RULE_WITH_ATTRIBUTES.test(token.content))
        return false;
    if (endsWithSoftbreakAttribute(token))
        return false;
    if (ATTRIBUTE_ONLY.test(token.content)) {
        return tokens[index - 2]?.type === "table_close";
    }
    return true;
};
exports.default = (md) => {
    const originalAttributes = new WeakMap();
    const originalTokenTypes = new WeakMap();
    const statePlaceholders = new WeakMap();
    md.core.ruler.before("curly_attributes", "wemd_protect_attribute_syntax", (state) => {
        const placeholders = createPlaceholders(state);
        statePlaceholders.set(state, placeholders);
        visitTokens(state.tokens, (token) => {
            originalAttributes.set(token, token.attrs ? [...token.attrs] : null);
        });
        state.tokens.forEach((token, index) => {
            if (LIST_TOKEN_TYPES.has(token.type)) {
                originalTokenTypes.set(token, token.type);
                token.type = `wemd_${token.type}`;
            }
            if (token.type === "inline") {
                const allowAttributes = allowsBlockAttributes(state.tokens, index);
                token.content = protectBraces(token.content, allowAttributes, placeholders);
                token.children?.forEach((child, index, children) => {
                    if (child.type !== "text")
                        return;
                    const previous = children[index - 1];
                    const followsSupportedInline = (previous?.nesting === -1 &&
                        SUPPORTED_PAIRED_INLINE_TAGS.has(previous.tag)) ||
                        (previous?.nesting === 0 &&
                            SUPPORTED_ZERO_NESTING_TAGS.has(previous.tag));
                    const followsInlineElement = child.content.startsWith("{") &&
                        previous !== undefined &&
                        previous.type !== "text" &&
                        previous.type !== "softbreak";
                    child.content = protectBraces(child.content, followsSupportedInline ||
                        (allowAttributes && !followsInlineElement), placeholders);
                });
            }
            else if (token.type === "fence") {
                token.info = protectBraces(token.info, false, placeholders);
            }
        });
    });
    md.core.ruler.after("curly_attributes", "wemd_attribute_policy", (state) => {
        const placeholders = statePlaceholders.get(state);
        if (!placeholders)
            return;
        visitTokens(state.tokens, (token) => {
            token.type = originalTokenTypes.get(token) ?? token.type;
            token.content = restoreBraces(token.content, placeholders);
            token.info = restoreBraces(token.info, placeholders);
            if (isSupportedAttributeTarget(token)) {
                token.attrs =
                    token.attrs?.filter((attribute) => !isReservedAttribute(attribute)) ?? null;
                return;
            }
            token.attrs = originalAttributes.get(token) ?? null;
        });
        statePlaceholders.delete(state);
    });
};
