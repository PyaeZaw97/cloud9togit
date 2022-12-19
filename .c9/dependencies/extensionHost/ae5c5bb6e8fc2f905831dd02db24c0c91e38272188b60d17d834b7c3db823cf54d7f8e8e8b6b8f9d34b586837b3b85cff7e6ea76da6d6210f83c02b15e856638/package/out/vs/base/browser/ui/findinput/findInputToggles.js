/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/toggle/toggle", "vs/base/common/codicons", "vs/nls"], function (require, exports, toggle_1, codicons_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RegexToggle = exports.WholeWordsToggle = exports.CaseSensitiveToggle = void 0;
    const NLS_CASE_SENSITIVE_TOGGLE_LABEL = nls.localize('caseDescription', "Match Case");
    const NLS_WHOLE_WORD_TOGGLE_LABEL = nls.localize('wordsDescription', "Match Whole Word");
    const NLS_REGEX_TOGGLE_LABEL = nls.localize('regexDescription', "Use Regular Expression");
    class CaseSensitiveToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.caseSensitive,
                title: NLS_CASE_SENSITIVE_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.CaseSensitiveToggle = CaseSensitiveToggle;
    class WholeWordsToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.wholeWord,
                title: NLS_WHOLE_WORD_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.WholeWordsToggle = WholeWordsToggle;
    class RegexToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.regex,
                title: NLS_REGEX_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.RegexToggle = RegexToggle;
});
//# sourceMappingURL=findInputToggles.js.map