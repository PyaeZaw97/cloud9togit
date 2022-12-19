/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageService"], function (require, exports, assert, utils_1, modesRegistry_1, languageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LanguageService', () => {
        test('LanguageSelection does not leak a disposable', () => {
            const languageService = new languageService_1.LanguageService();
            (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                const languageSelection = languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                assert.strictEqual(languageSelection.languageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            });
            (0, utils_1.throwIfDisposablesAreLeaked)(() => {
                const languageSelection = languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                const listener = languageSelection.onDidChange(() => { });
                assert.strictEqual(languageSelection.languageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                listener.dispose();
            });
            languageService.dispose();
        });
    });
});
//# sourceMappingURL=languageService.test.js.map