/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers"], function (require, exports, terminalLinkHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalExternalLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
    })(Constants || (Constants = {}));
    class TerminalExternalLinkDetector {
        constructor(id, xterm, _provideLinks) {
            this.id = id;
            this.xterm = xterm;
            this._provideLinks = _provideLinks;
        }
        async detect(lines, startLine, endLine) {
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            const externalLinks = await this._provideLinks(text);
            if (!externalLinks) {
                return [];
            }
            const result = externalLinks.map(link => {
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: link.startIndex + 1,
                    startLineNumber: 1,
                    endColumn: link.startIndex + link.length + 1,
                    endLineNumber: 1
                }, startLine);
                const matchingText = text.substring(link.startIndex, link.startIndex + link.length) || '';
                const l = {
                    text: matchingText,
                    label: link.label,
                    bufferRange,
                    type: { id: this.id },
                    activate: link.activate
                };
                return l;
            });
            return result;
        }
    }
    exports.TerminalExternalLinkDetector = TerminalExternalLinkDetector;
});
//# sourceMappingURL=terminalExternalLinkDetector.js.map