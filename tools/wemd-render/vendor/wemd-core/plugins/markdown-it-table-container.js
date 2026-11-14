"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeRule() {
    return function addTableContainer(state) {
        const arr = [];
        const TokenCtor = state.Token;
        for (let i = 0; i < state.tokens.length; i++) {
            const curToken = state.tokens[i];
            if (curToken.type === "table_open") {
                const tableContainerStart = new TokenCtor("html_inline", "", 0);
                tableContainerStart.content = `<section class="table-container">`;
                arr.push(tableContainerStart);
                arr.push(curToken);
            }
            else if (curToken.type === "table_close") {
                const tableContainerClose = new TokenCtor("html_inline", "", 0);
                tableContainerClose.content = `</section>`;
                arr.push(curToken);
                arr.push(tableContainerClose);
            }
            else {
                arr.push(curToken);
            }
        }
        state.tokens = arr;
    };
}
exports.default = (md) => {
    md.core.ruler.push("table-container", makeRule());
};
