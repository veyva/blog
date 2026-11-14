import MarkdownIt from "markdown-it";
export interface MarkdownParserOptions {
    showMacBar?: boolean;
    mathRenderer?: "auto" | "katex";
    includeSourcePosition?: boolean;
}
export declare const createMarkdownParser: (options?: MarkdownParserOptions) => MarkdownIt;
