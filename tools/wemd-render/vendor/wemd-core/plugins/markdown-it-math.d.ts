import MarkdownIt from "markdown-it";
declare const _default: (md: MarkdownIt, options: any) => void;
export default _default;
declare global {
    interface Window {
        /** MathJax 配置版本，由 apps/web 的 mathJaxLoader 写入 */
        __wemdMathJaxVersion?: number;
        MathJax?: {
            tex2svg?: (math: string, options: {
                display: boolean;
            }) => HTMLElement;
            tex2svgPromise?: (math: string, options: {
                display: boolean;
            }) => Promise<HTMLElement>;
            texReset?: () => void;
            startup?: {
                /** 由 MathJax 在加载完成后挂载，配置阶段可以缺省 */
                defaultReady?: () => void;
                ready?: () => void;
                promise?: Promise<void>;
            };
            typesetClear?: (elements: Element[]) => void;
            typesetPromise?: (elements: Element[]) => Promise<void>;
        };
    }
}
