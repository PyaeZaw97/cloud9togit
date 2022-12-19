/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/iconLabels", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, errors_1, iconLabels_1, resources_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseHrefAndDimensions = exports.removeMarkdownEscapes = exports.escapeMarkdownSyntaxTokens = exports.markdownStringEqual = exports.isMarkdownString = exports.isEmptyMarkdownString = exports.MarkdownString = exports.MarkdownStringTextNewlineStyle = void 0;
    var MarkdownStringTextNewlineStyle;
    (function (MarkdownStringTextNewlineStyle) {
        MarkdownStringTextNewlineStyle[MarkdownStringTextNewlineStyle["Paragraph"] = 0] = "Paragraph";
        MarkdownStringTextNewlineStyle[MarkdownStringTextNewlineStyle["Break"] = 1] = "Break";
    })(MarkdownStringTextNewlineStyle = exports.MarkdownStringTextNewlineStyle || (exports.MarkdownStringTextNewlineStyle = {}));
    class MarkdownString {
        constructor(value = '', isTrustedOrOptions = false) {
            var _a, _b, _c;
            this.value = value;
            if (typeof this.value !== 'string') {
                throw (0, errors_1.illegalArgument)('value');
            }
            if (typeof isTrustedOrOptions === 'boolean') {
                this.isTrusted = isTrustedOrOptions;
                this.supportThemeIcons = false;
                this.supportHtml = false;
            }
            else {
                this.isTrusted = (_a = isTrustedOrOptions.isTrusted) !== null && _a !== void 0 ? _a : undefined;
                this.supportThemeIcons = (_b = isTrustedOrOptions.supportThemeIcons) !== null && _b !== void 0 ? _b : false;
                this.supportHtml = (_c = isTrustedOrOptions.supportHtml) !== null && _c !== void 0 ? _c : false;
            }
        }
        appendText(value, newlineStyle = 0 /* MarkdownStringTextNewlineStyle.Paragraph */) {
            this.value += escapeMarkdownSyntaxTokens(this.supportThemeIcons ? (0, iconLabels_1.escapeIcons)(value) : value)
                .replace(/([ \t]+)/g, (_match, g1) => '&nbsp;'.repeat(g1.length))
                .replace(/\>/gm, '\\>')
                .replace(/\n/g, newlineStyle === 1 /* MarkdownStringTextNewlineStyle.Break */ ? '\\\n' : '\n\n');
            return this;
        }
        appendMarkdown(value) {
            this.value += value;
            return this;
        }
        appendCodeblock(langId, code) {
            this.value += '\n```';
            this.value += langId;
            this.value += '\n';
            this.value += code;
            this.value += '\n```\n';
            return this;
        }
        appendLink(target, label, title) {
            this.value += '[';
            this.value += this._escape(label, ']');
            this.value += '](';
            this.value += this._escape(String(target), ')');
            if (title) {
                this.value += ` "${this._escape(this._escape(title, '"'), ')')}"`;
            }
            this.value += ')';
            return this;
        }
        _escape(value, ch) {
            const r = new RegExp((0, strings_1.escapeRegExpCharacters)(ch), 'g');
            return value.replace(r, (match, offset) => {
                if (value.charAt(offset - 1) !== '\\') {
                    return `\\${match}`;
                }
                else {
                    return match;
                }
            });
        }
    }
    exports.MarkdownString = MarkdownString;
    function isEmptyMarkdownString(oneOrMany) {
        if (isMarkdownString(oneOrMany)) {
            return !oneOrMany.value;
        }
        else if (Array.isArray(oneOrMany)) {
            return oneOrMany.every(isEmptyMarkdownString);
        }
        else {
            return true;
        }
    }
    exports.isEmptyMarkdownString = isEmptyMarkdownString;
    function isMarkdownString(thing) {
        if (thing instanceof MarkdownString) {
            return true;
        }
        else if (thing && typeof thing === 'object') {
            return typeof thing.value === 'string'
                && (typeof thing.isTrusted === 'boolean' || thing.isTrusted === undefined)
                && (typeof thing.supportThemeIcons === 'boolean' || thing.supportThemeIcons === undefined);
        }
        return false;
    }
    exports.isMarkdownString = isMarkdownString;
    function markdownStringEqual(a, b) {
        if (a === b) {
            return true;
        }
        else if (!a || !b) {
            return false;
        }
        else {
            return a.value === b.value
                && a.isTrusted === b.isTrusted
                && a.supportThemeIcons === b.supportThemeIcons
                && a.supportHtml === b.supportHtml
                && (a.baseUri === b.baseUri || !!a.baseUri && !!b.baseUri && (0, resources_1.isEqual)(uri_1.URI.from(a.baseUri), uri_1.URI.from(b.baseUri)));
        }
    }
    exports.markdownStringEqual = markdownStringEqual;
    function escapeMarkdownSyntaxTokens(text) {
        // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
        return text.replace(/[\\`*_{}[\]()#+\-!]/g, '\\$&');
    }
    exports.escapeMarkdownSyntaxTokens = escapeMarkdownSyntaxTokens;
    function removeMarkdownEscapes(text) {
        if (!text) {
            return text;
        }
        return text.replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1');
    }
    exports.removeMarkdownEscapes = removeMarkdownEscapes;
    function parseHrefAndDimensions(href) {
        const dimensions = [];
        const splitted = href.split('|').map(s => s.trim());
        href = splitted[0];
        const parameters = splitted[1];
        if (parameters) {
            const heightFromParams = /height=(\d+)/.exec(parameters);
            const widthFromParams = /width=(\d+)/.exec(parameters);
            const height = heightFromParams ? heightFromParams[1] : '';
            const width = widthFromParams ? widthFromParams[1] : '';
            const widthIsFinite = isFinite(parseInt(width));
            const heightIsFinite = isFinite(parseInt(height));
            if (widthIsFinite) {
                dimensions.push(`width="${width}"`);
            }
            if (heightIsFinite) {
                dimensions.push(`height="${height}"`);
            }
        }
        return { href, dimensions };
    }
    exports.parseHrefAndDimensions = parseHrefAndDimensions;
});
//# sourceMappingURL=htmlContent.js.map