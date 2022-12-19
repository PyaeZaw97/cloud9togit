/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, position_1, range_1, languageConfigurationRegistry_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Bracket Pair Colorizer - getBracketPairsInRange', () => {
        function createTextModelWithColorizedBracketPairs(store, text) {
            const languageId = 'testLanguage';
            const instantiationService = (0, testTextModel_1.createModelServices)(store);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            store.add(languageConfigurationService.register(languageId, {
                colorizedBracketPairs: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            return store.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
        }
        test('Basic 1', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`{ ( [] ¹ ) [ ² { } ] () } []`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON), [
                    {
                        level: 0,
                        range: '[1,1 -> 1,2]',
                        openRange: '[1,1 -> 1,2]',
                        closeRange: '[1,23 -> 1,24]',
                    },
                    {
                        level: 1,
                        range: '[1,3 -> 1,4]',
                        openRange: '[1,3 -> 1,4]',
                        closeRange: '[1,9 -> 1,10]',
                    },
                    {
                        level: 1,
                        range: '[1,11 -> 1,12]',
                        openRange: '[1,11 -> 1,12]',
                        closeRange: '[1,18 -> 1,19]',
                    },
                ]);
            });
        });
        test('Basic 2', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`{ ( [] ¹ ²) [  { } ] () } []`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON), [
                    {
                        level: 0,
                        range: '[1,1 -> 1,2]',
                        openRange: '[1,1 -> 1,2]',
                        closeRange: '[1,23 -> 1,24]',
                    },
                    {
                        level: 1,
                        range: '[1,3 -> 1,4]',
                        openRange: '[1,3 -> 1,4]',
                        closeRange: '[1,9 -> 1,10]',
                    },
                ]);
            });
        });
        test('Basic Empty', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ ² { ( [] ) [  { } ] () } []`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON), []);
            });
        });
        test('Basic All', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ { ( [] ) [  { } ] () } [] ²`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON), [
                    {
                        level: 0,
                        range: '[1,2 -> 1,3]',
                        openRange: '[1,2 -> 1,3]',
                        closeRange: '[1,23 -> 1,24]',
                    },
                    {
                        level: 1,
                        range: '[1,4 -> 1,5]',
                        openRange: '[1,4 -> 1,5]',
                        closeRange: '[1,9 -> 1,10]',
                    },
                    {
                        level: 2,
                        range: '[1,6 -> 1,7]',
                        openRange: '[1,6 -> 1,7]',
                        closeRange: '[1,7 -> 1,8]',
                    },
                    {
                        level: 1,
                        range: '[1,11 -> 1,12]',
                        openRange: '[1,11 -> 1,12]',
                        closeRange: '[1,18 -> 1,19]',
                    },
                    {
                        level: 2,
                        range: '[1,14 -> 1,15]',
                        openRange: '[1,14 -> 1,15]',
                        closeRange: '[1,16 -> 1,17]',
                    },
                    {
                        level: 1,
                        range: '[1,20 -> 1,21]',
                        openRange: '[1,20 -> 1,21]',
                        closeRange: '[1,21 -> 1,22]',
                    },
                    {
                        level: 0,
                        range: '[1,25 -> 1,26]',
                        openRange: '[1,25 -> 1,26]',
                        closeRange: '[1,26 -> 1,27]',
                    },
                ]);
            });
        });
    });
    function bracketPairToJSON(pair) {
        var _a;
        return {
            level: pair.nestingLevel,
            range: pair.openingBracketRange.toString(),
            openRange: pair.openingBracketRange.toString(),
            closeRange: ((_a = pair.closingBracketRange) === null || _a === void 0 ? void 0 : _a.toString()) || null,
        };
    }
    class PositionOffsetTransformer {
        constructor(text) {
            this.lineStartOffsetByLineIdx = [];
            this.lineStartOffsetByLineIdx.push(0);
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\n') {
                    this.lineStartOffsetByLineIdx.push(i + 1);
                }
            }
        }
        getOffset(position) {
            return this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1;
        }
        getPosition(offset) {
            const lineNumber = this.lineStartOffsetByLineIdx.findIndex(lineStartOffset => lineStartOffset <= offset);
            return new position_1.Position(lineNumber + 1, offset - this.lineStartOffsetByLineIdx[lineNumber] + 1);
        }
    }
    class AnnotatedDocument {
        constructor(src) {
            const numbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
            let text = '';
            let offsetPositions = new Map();
            let offset = 0;
            for (let i = 0; i < src.length; i++) {
                const idx = numbers.indexOf(src[i]);
                if (idx >= 0) {
                    offsetPositions.set(idx, offset);
                }
                else {
                    text += src[i];
                    offset++;
                }
            }
            this.text = text;
            const mapper = new PositionOffsetTransformer(this.text);
            let positions = new Map();
            for (const [idx, offset] of offsetPositions.entries()) {
                positions.set(idx, mapper.getPosition(offset));
            }
            this.positions = positions;
        }
        range(start, end) {
            return range_1.Range.fromPositions(this.positions.get(start), this.positions.get(end));
        }
    }
});
//# sourceMappingURL=getBracketPairsInRange.test.js.map