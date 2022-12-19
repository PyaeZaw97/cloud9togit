/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dompurify/dompurify", "vs/base/common/marked/marked", "vs/base/common/network", "vs/editor/common/languages/textToHtmlTokenizer"], function (require, exports, dom_1, dompurify, marked_1, network_1, textToHtmlTokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderMarkdownDocument = exports.DEFAULT_MARKDOWN_STYLES = void 0;
    exports.DEFAULT_MARKDOWN_STYLES = `
body {
	padding: 10px 20px;
	line-height: 22px;
	max-width: 882px;
	margin: 0 auto;
}

body *:last-child {
	margin-bottom: 0;
}

img {
	max-width: 100%;
	max-height: 100%;
}

a {
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

a:focus,
input:focus,
select:focus,
textarea:focus {
	outline: 1px solid -webkit-focus-ring-color;
	outline-offset: -1px;
}

hr {
	border: 0;
	height: 2px;
	border-bottom: 2px solid;
}

h1 {
	padding-bottom: 0.3em;
	line-height: 1.2;
	border-bottom-width: 1px;
	border-bottom-style: solid;
}

h1, h2, h3 {
	font-weight: normal;
}

table {
	border-collapse: collapse;
}

table > thead > tr > th {
	text-align: left;
	border-bottom: 1px solid;
}

table > thead > tr > th,
table > thead > tr > td,
table > tbody > tr > th,
table > tbody > tr > td {
	padding: 5px 10px;
}

table > tbody > tr + tr > td {
	border-top-width: 1px;
	border-top-style: solid;
}

blockquote {
	margin: 0 7px 0 5px;
	padding: 0 16px 0 10px;
	border-left-width: 5px;
	border-left-style: solid;
}

code {
	font-family: "SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace;
}

pre code {
	font-family: var(--vscode-editor-font-family);
	font-weight: var(--vscode-editor-font-weight);
	font-size: var(--vscode-editor-font-size);
	line-height: 1.5;
}

code > div {
	padding: 16px;
	border-radius: 3px;
	overflow: auto;
}

.monaco-tokenized-source {
	white-space: pre;
}

/** Theming */

.vscode-light code > div {
	background-color: rgba(220, 220, 220, 0.4);
}

.vscode-dark code > div {
	background-color: rgba(10, 10, 10, 0.4);
}

.vscode-high-contrast code > div {
	background-color: var(--vscode-textCodeBlock-background);
}

.vscode-high-contrast h1 {
	border-color: rgb(0, 0, 0);
}

.vscode-light table > thead > tr > th {
	border-color: rgba(0, 0, 0, 0.69);
}

.vscode-dark table > thead > tr > th {
	border-color: rgba(255, 255, 255, 0.69);
}

.vscode-light h1,
.vscode-light hr,
.vscode-light table > tbody > tr + tr > td {
	border-color: rgba(0, 0, 0, 0.18);
}

.vscode-dark h1,
.vscode-dark hr,
.vscode-dark table > tbody > tr + tr > td {
	border-color: rgba(255, 255, 255, 0.18);
}

`;
    const allowedProtocols = [network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.command];
    function sanitize(documentContent, allowUnknownProtocols) {
        const hook = (0, dom_1.hookDomPurifyHrefAndSrcSanitizer)(allowedProtocols, true);
        try {
            return dompurify.sanitize(documentContent, Object.assign({
                ALLOWED_TAGS: [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'br', 'b', 'i', 'strong', 'em', 'a', 'pre', 'code', 'img', 'tt',
                    'div', 'ins', 'del', 'sup', 'sub', 'p', 'ol', 'ul', 'table', 'thead', 'tbody', 'tfoot', 'blockquote', 'dl', 'dt',
                    'dd', 'kbd', 'q', 'samp', 'var', 'hr', 'ruby', 'rt', 'rp', 'li', 'tr', 'td', 'th', 's', 'strike', 'summary', 'details',
                    'caption', 'figure', 'figcaption', 'abbr', 'bdo', 'cite', 'dfn', 'mark', 'small', 'span', 'time', 'wbr', 'checkbox', 'checklist', 'vertically-centered'
                ],
                ALLOWED_ATTR: [
                    'href', 'data-href', 'data-command', 'target', 'title', 'name', 'src', 'alt', 'class', 'id', 'role', 'tabindex', 'style', 'data-code',
                    'width', 'height', 'align', 'x-dispatch',
                    'required', 'checked', 'placeholder', 'when-checked', 'checked-on',
                ],
            }, (allowUnknownProtocols ? { ALLOW_UNKNOWN_PROTOCOLS: true } : {})));
        }
        finally {
            hook.dispose();
        }
    }
    /**
     * Renders a string of markdown as a document.
     *
     * Uses VS Code's syntax highlighting code blocks.
     */
    async function renderMarkdownDocument(text, extensionService, languageService, shouldSanitize = true, allowUnknownProtocols = false) {
        const highlight = (code, lang, callback) => {
            if (!callback) {
                return code;
            }
            if (typeof lang !== 'string') {
                callback(null, `<code>${code}</code>`);
                return '';
            }
            extensionService.whenInstalledExtensionsRegistered().then(async () => {
                const languageId = languageService.getLanguageIdByLanguageName(lang);
                const html = await (0, textToHtmlTokenizer_1.tokenizeToString)(languageService, code, languageId);
                callback(null, `<code>${html}</code>`);
            });
            return '';
        };
        return new Promise((resolve, reject) => {
            (0, marked_1.marked)(text, { highlight }, (err, value) => err ? reject(err) : resolve(value));
        }).then(raw => {
            if (shouldSanitize) {
                return sanitize(raw, allowUnknownProtocols);
            }
            else {
                return raw;
            }
        });
    }
    exports.renderMarkdownDocument = renderMarkdownDocument;
});
//# sourceMappingURL=markdownDocumentRenderer.js.map