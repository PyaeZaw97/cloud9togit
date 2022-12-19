/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/objects"], function (require, exports, dom, iconLabels_1, objects) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HighlightedLabel = void 0;
    /**
     * A widget which can render a label with substring highlights, often
     * originating from a filter function like the fuzzy matcher.
     */
    class HighlightedLabel {
        /**
         * Create a new {@link HighlightedLabel}.
         *
         * @param container The parent container to append to.
         */
        constructor(container, options) {
            var _a;
            this.text = '';
            this.title = '';
            this.highlights = [];
            this.didEverRender = false;
            this.supportIcons = (_a = options === null || options === void 0 ? void 0 : options.supportIcons) !== null && _a !== void 0 ? _a : false;
            this.domNode = dom.append(container, dom.$('span.monaco-highlighted-label'));
        }
        /**
         * The label's DOM node.
         */
        get element() {
            return this.domNode;
        }
        /**
         * Set the label and highlights.
         *
         * @param text The label to display.
         * @param highlights The ranges to highlight.
         * @param title An optional title for the hover tooltip.
         * @param escapeNewLines Whether to escape new lines.
         * @returns
         */
        set(text, highlights = [], title = '', escapeNewLines) {
            if (!text) {
                text = '';
            }
            if (escapeNewLines) {
                // adjusts highlights inplace
                text = HighlightedLabel.escapeNewLines(text, highlights);
            }
            if (this.didEverRender && this.text === text && this.title === title && objects.equals(this.highlights, highlights)) {
                return;
            }
            this.text = text;
            this.title = title;
            this.highlights = highlights;
            this.render();
        }
        render() {
            const children = [];
            let pos = 0;
            for (const highlight of this.highlights) {
                if (highlight.end === highlight.start) {
                    continue;
                }
                if (pos < highlight.start) {
                    const substring = this.text.substring(pos, highlight.start);
                    children.push(dom.$('span', undefined, ...this.supportIcons ? (0, iconLabels_1.renderLabelWithIcons)(substring) : [substring]));
                    pos = highlight.end;
                }
                const substring = this.text.substring(highlight.start, highlight.end);
                const element = dom.$('span.highlight', undefined, ...this.supportIcons ? (0, iconLabels_1.renderLabelWithIcons)(substring) : [substring]);
                if (highlight.extraClasses) {
                    element.classList.add(...highlight.extraClasses);
                }
                children.push(element);
                pos = highlight.end;
            }
            if (pos < this.text.length) {
                const substring = this.text.substring(pos);
                children.push(dom.$('span', undefined, ...this.supportIcons ? (0, iconLabels_1.renderLabelWithIcons)(substring) : [substring]));
            }
            dom.reset(this.domNode, ...children);
            if (this.title) {
                this.domNode.title = this.title;
            }
            else {
                this.domNode.removeAttribute('title');
            }
            this.didEverRender = true;
        }
        static escapeNewLines(text, highlights) {
            let total = 0;
            let extra = 0;
            return text.replace(/\r\n|\r|\n/g, (match, offset) => {
                extra = match === '\r\n' ? -1 : 0;
                offset += total;
                for (const highlight of highlights) {
                    if (highlight.end <= offset) {
                        continue;
                    }
                    if (highlight.start >= offset) {
                        highlight.start += extra;
                    }
                    if (highlight.end >= offset) {
                        highlight.end += extra;
                    }
                }
                total += extra;
                return '\u23CE';
            });
        }
    }
    exports.HighlightedLabel = HighlightedLabel;
});
//# sourceMappingURL=highlightedLabel.js.map