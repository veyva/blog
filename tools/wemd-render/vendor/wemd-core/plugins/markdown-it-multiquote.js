"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeRule() {
    return function addTableContainer(state) {
        let count = 0;
        let outerQuoteToekn;
        for (let i = 0; i < state.tokens.length; i++) {
            const curToken = state.tokens[i];
            if (curToken.type === "blockquote_open") {
                if (count === 0) {
                    // 最外层 blockquote 的 token
                    outerQuoteToekn = curToken;
                }
                count++;
                continue;
            }
            if (count > 0 && outerQuoteToekn) {
                outerQuoteToekn.attrs = [["class", "multiquote-" + count]];
                count = 0;
            }
        }
    };
}
exports.default = (md) => {
    md.core.ruler.push("blockquote-class", makeRule());
};
