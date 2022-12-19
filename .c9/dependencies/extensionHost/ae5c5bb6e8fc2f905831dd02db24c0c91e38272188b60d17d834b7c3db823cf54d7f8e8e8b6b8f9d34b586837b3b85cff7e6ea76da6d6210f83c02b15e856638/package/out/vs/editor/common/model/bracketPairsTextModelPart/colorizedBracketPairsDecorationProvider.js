/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, event_1, lifecycle_1, range_1, editorColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorizedBracketPairsDecorationProvider = void 0;
    class ColorizedBracketPairsDecorationProvider extends lifecycle_1.Disposable {
        constructor(textModel) {
            super();
            this.textModel = textModel;
            this.colorProvider = new ColorProvider();
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.colorizationOptions = textModel.getOptions().bracketPairColorizationOptions;
            this._register(textModel.bracketPairs.onDidChange(e => {
                this.onDidChangeEmitter.fire();
            }));
        }
        //#region TextModel events
        handleDidChangeOptions(e) {
            this.colorizationOptions = this.textModel.getOptions().bracketPairColorizationOptions;
        }
        //#endregion
        getDecorationsInRange(range, ownerId, filterOutValidation) {
            if (ownerId === undefined) {
                return [];
            }
            if (!this.colorizationOptions.enabled) {
                return [];
            }
            const result = new Array();
            const bracketsInRange = this.textModel.bracketPairs.getBracketsInRange(range);
            for (const bracket of bracketsInRange) {
                result.push({
                    id: `bracket${bracket.range.toString()}-${bracket.nestingLevel}`,
                    options: {
                        description: 'BracketPairColorization',
                        inlineClassName: this.colorProvider.getInlineClassName(bracket, this.colorizationOptions.independentColorPoolPerBracketType),
                    },
                    ownerId: 0,
                    range: bracket.range,
                });
            }
            return result;
        }
        getAllDecorations(ownerId, filterOutValidation) {
            if (ownerId === undefined) {
                return [];
            }
            if (!this.colorizationOptions.enabled) {
                return [];
            }
            return this.getDecorationsInRange(new range_1.Range(1, 1, this.textModel.getLineCount(), 1), ownerId, filterOutValidation);
        }
    }
    exports.ColorizedBracketPairsDecorationProvider = ColorizedBracketPairsDecorationProvider;
    class ColorProvider {
        constructor() {
            this.unexpectedClosingBracketClassName = 'unexpected-closing-bracket';
        }
        getInlineClassName(bracket, independentColorPoolPerBracketType) {
            if (bracket.isInvalid) {
                return this.unexpectedClosingBracketClassName;
            }
            return this.getInlineClassNameOfLevel(independentColorPoolPerBracketType ? bracket.nestingLevelOfEqualBracketType : bracket.nestingLevel);
        }
        getInlineClassNameOfLevel(level) {
            // To support a dynamic amount of colors up to 6 colors,
            // we use a number that is a lcm of all numbers from 1 to 6.
            return `bracket-highlighting-${level % 30}`;
        }
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const colors = [
            editorColorRegistry_1.editorBracketHighlightingForeground1,
            editorColorRegistry_1.editorBracketHighlightingForeground2,
            editorColorRegistry_1.editorBracketHighlightingForeground3,
            editorColorRegistry_1.editorBracketHighlightingForeground4,
            editorColorRegistry_1.editorBracketHighlightingForeground5,
            editorColorRegistry_1.editorBracketHighlightingForeground6
        ];
        const colorProvider = new ColorProvider();
        collector.addRule(`.monaco-editor .${colorProvider.unexpectedClosingBracketClassName} { color: ${theme.getColor(editorColorRegistry_1.editorBracketHighlightingUnexpectedBracketForeground)}; }`);
        const colorValues = colors
            .map(c => theme.getColor(c))
            .filter((c) => !!c)
            .filter(c => !c.isTransparent());
        for (let level = 0; level < 30; level++) {
            const color = colorValues[level % colorValues.length];
            collector.addRule(`.monaco-editor .${colorProvider.getInlineClassNameOfLevel(level)} { color: ${color}; }`);
        }
    });
});
//# sourceMappingURL=colorizedBracketPairsDecorationProvider.js.map