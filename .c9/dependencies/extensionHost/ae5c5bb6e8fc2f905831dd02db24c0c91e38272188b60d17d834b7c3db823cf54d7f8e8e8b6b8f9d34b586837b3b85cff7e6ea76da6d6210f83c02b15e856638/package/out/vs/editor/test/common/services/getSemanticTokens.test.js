/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/common/services/getSemanticTokens", "vs/editor/test/common/testTextModel", "vs/editor/common/languageFeatureRegistry"], function (require, exports, assert, cancellation_1, errors_1, lifecycle_1, getSemanticTokens_1, testTextModel_1, languageFeatureRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('getSemanticTokens', () => {
        test('issue #136540: semantic highlighting flickers', async () => {
            const disposables = new lifecycle_1.DisposableStore();
            const registry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
            const provider = new class {
                getLegend() {
                    return { tokenTypes: ['test'], tokenModifiers: [] };
                }
                provideDocumentSemanticTokens(model, lastResultId, token) {
                    throw (0, errors_1.canceled)();
                }
                releaseDocumentSemanticTokens(resultId) {
                }
            };
            disposables.add(registry.register('testLang', provider));
            const textModel = disposables.add((0, testTextModel_1.createTextModel)('example', 'testLang'));
            await (0, getSemanticTokens_1.getDocumentSemanticTokens)(registry, textModel, null, null, cancellation_1.CancellationToken.None).then((res) => {
                assert.fail();
            }, (err) => {
                assert.ok(!!err);
            });
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=getSemanticTokens.test.js.map