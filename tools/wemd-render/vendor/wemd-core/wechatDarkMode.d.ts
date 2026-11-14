type ElementType = "heading" | "body" | "background" | "table" | "table-text" | "blockquote" | "blockquote-text" | "code" | "code-text" | "decorative-dark" | "vibrant-protected" | "selection" | "selection-text" | "other";
export interface DarkModeConfig {
    vibrantSaturationThreshold: number;
    vibrantLightnessRange: [number, number];
    decorativeDarkLuminanceThreshold: number;
}
export declare function convertToWeChatDarkMode(hex: string, type?: ElementType, bgRgb?: number[]): string;
declare function convertCssInternal(css: string): string;
export declare function convertCssToWeChatDarkMode(css: string): string;
export { convertCssInternal as _convertCssToWeChatDarkModeInternal };
