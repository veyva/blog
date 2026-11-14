export interface FormatOptions {
    /** 去零宽字符、nbsp 转空格、行尾空白、连续空行压成一行 */
    whitespace: boolean;
    /** 中文与英文、数字之间补空格（盘古之白） */
    pangu: boolean;
    /** 中文语境下的半角标点转全角 */
    fullwidthPunctuation: boolean;
    /** 引号转直角引号「」『』 */
    cornerQuotes: boolean;
}
export declare const DEFAULT_FORMAT_OPTIONS: FormatOptions;
export declare function formatMarkdown(markdown: string, options?: FormatOptions): string;
