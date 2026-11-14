"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeRule(md) {
    return function replaceListItem() {
        md.renderer.rules.list_item_open = function replaceOpen() {
            return "<li><section>";
        };
        md.renderer.rules.list_item_close = function replaceClose() {
            return "</section></li>";
        };
    };
}
exports.default = (md) => {
    md.core.ruler.push("replace-li", makeRule(md));
};
