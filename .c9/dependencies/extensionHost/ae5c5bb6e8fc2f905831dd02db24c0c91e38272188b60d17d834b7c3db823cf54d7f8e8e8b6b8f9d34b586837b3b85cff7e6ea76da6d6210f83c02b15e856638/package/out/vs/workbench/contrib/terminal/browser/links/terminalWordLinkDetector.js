/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, configuration_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalWordLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
    })(Constants || (Constants = {}));
    let TerminalWordLinkDetector = class TerminalWordLinkDetector {
        constructor(xterm, _configurationService) {
            this.xterm = xterm;
            this._configurationService = _configurationService;
        }
        detect(lines, startLine, endLine) {
            const links = [];
            const wordSeparators = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).wordSeparators;
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            // Parse out all words from the wrapped line
            const words = this._parseWords(text, wordSeparators);
            // Map the words to ITerminalLink objects
            for (const word of words) {
                if (word.text === '') {
                    continue;
                }
                if (word.text.length > 0 && word.text.charAt(word.text.length - 1) === ':') {
                    word.text = word.text.slice(0, -1);
                    word.endIndex--;
                }
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: word.startIndex + 1,
                    startLineNumber: 1,
                    endColumn: word.endIndex + 1,
                    endLineNumber: 1
                }, startLine);
                links.push({
                    text: word.text,
                    bufferRange,
                    type: 3 /* TerminalBuiltinLinkType.Search */
                });
            }
            return links;
        }
        _parseWords(text, separators) {
            const words = [];
            const wordSeparators = separators.split('');
            const characters = text.split('');
            let startIndex = 0;
            for (let i = 0; i < text.length; i++) {
                if (wordSeparators.includes(characters[i])) {
                    words.push({ startIndex, endIndex: i, text: text.substring(startIndex, i) });
                    startIndex = i + 1;
                }
            }
            if (startIndex < text.length) {
                words.push({ startIndex, endIndex: text.length, text: text.substring(startIndex) });
            }
            return words;
        }
    };
    TerminalWordLinkDetector.id = 'word';
    TerminalWordLinkDetector = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], TerminalWordLinkDetector);
    exports.TerminalWordLinkDetector = TerminalWordLinkDetector;
});
//# sourceMappingURL=terminalWordLinkDetector.js.map