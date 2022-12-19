/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons"], function (require, exports, dom, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderIcon = exports.renderLabelWithIcons = void 0;
    const labelWithIconsRegex = new RegExp(`(\\\\)?\\$\\((${codicons_1.CSSIcon.iconNameExpression}(?:${codicons_1.CSSIcon.iconModifierExpression})?)\\)`, 'g');
    function renderLabelWithIcons(text) {
        const elements = new Array();
        let match;
        let textStart = 0, textStop = 0;
        while ((match = labelWithIconsRegex.exec(text)) !== null) {
            textStop = match.index || 0;
            elements.push(text.substring(textStart, textStop));
            textStart = (match.index || 0) + match[0].length;
            const [, escaped, codicon] = match;
            elements.push(escaped ? `$(${codicon})` : renderIcon({ id: codicon }));
        }
        if (textStart < text.length) {
            elements.push(text.substring(textStart));
        }
        return elements;
    }
    exports.renderLabelWithIcons = renderLabelWithIcons;
    function renderIcon(icon) {
        const node = dom.$(`span`);
        node.classList.add(...codicons_1.CSSIcon.asClassNameArray(icon));
        return node;
    }
    exports.renderIcon = renderIcon;
});
//# sourceMappingURL=iconLabels.js.map