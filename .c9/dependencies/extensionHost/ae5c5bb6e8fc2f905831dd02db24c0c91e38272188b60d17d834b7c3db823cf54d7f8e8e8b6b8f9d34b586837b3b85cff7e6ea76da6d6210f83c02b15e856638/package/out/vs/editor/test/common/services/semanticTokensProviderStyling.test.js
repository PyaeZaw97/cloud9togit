/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/tokens/sparseMultilineTokens", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/test/common/testTextModel", "vs/platform/theme/common/themeService", "vs/editor/common/languages/language"], function (require, exports, assert, lifecycle_1, sparseMultilineTokens_1, semanticTokensProviderStyling_1, testTextModel_1, themeService_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ModelService', () => {
        let disposables;
        let instantiationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('issue #134973: invalid semantic tokens should be handled better', () => {
            const languageId = 'java';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const legend = {
                tokenTypes: ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7', 'st8', 'st9', 'st10'],
                tokenModifiers: []
            };
            instantiationService.stub(themeService_1.IThemeService, {
                getColorTheme() {
                    return {
                        getTokenStyleMetadata: (tokenType, tokenModifiers, languageId) => {
                            return {
                                foreground: parseInt(tokenType.substr(2), 10),
                                bold: undefined,
                                underline: undefined,
                                strikethrough: undefined,
                                italic: undefined
                            };
                        }
                    };
                }
            });
            const styling = instantiationService.createInstance(semanticTokensProviderStyling_1.SemanticTokensProviderStyling, legend);
            const badTokens = {
                data: new Uint32Array([
                    0, 13, 16, 1, 0,
                    1, 2, 6, 2, 0,
                    0, 7, 6, 3, 0,
                    0, 15, 8, 4, 0,
                    0, 17, 1, 5, 0,
                    0, 7, 5, 6, 0,
                    1, 12, 8, 7, 0,
                    0, 19, 5, 8, 0,
                    0, 7, 1, 9, 0,
                    0, 4294967294, 5, 10, 0
                ])
            };
            const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(badTokens, styling, languageId);
            const expected = sparseMultilineTokens_1.SparseMultilineTokens.create(1, new Uint32Array([
                0, 13, 29, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (1 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 2, 8, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (2 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 9, 15, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (3 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 24, 32, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (4 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 41, 42, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (5 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                1, 48, 53, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (6 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 12, 20, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (7 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 31, 36, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (8 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
                2, 36, 41, (16 /* MetadataConsts.SEMANTIC_USE_FOREGROUND */ | (9 << 15 /* MetadataConsts.FOREGROUND_OFFSET */)),
            ]));
            assert.deepStrictEqual(result.toString(), expected.toString());
        });
    });
});
//# sourceMappingURL=semanticTokensProviderStyling.test.js.map