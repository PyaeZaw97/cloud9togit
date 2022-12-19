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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/contrib/smartSelect/browser/bracketSelections", "vs/editor/contrib/smartSelect/browser/wordSelections", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/base/common/types", "vs/base/common/uri"], function (require, exports, arrays, cancellation_1, errors_1, editorExtensions_1, position_1, range_1, selection_1, editorContextKeys_1, bracketSelections_1, wordSelections_1, nls, actions_1, commands_1, languageFeatures_1, resolverService_1, types_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.provideSelectionRanges = void 0;
    class SelectionRanges {
        constructor(index, ranges) {
            this.index = index;
            this.ranges = ranges;
        }
        mov(fwd) {
            let index = this.index + (fwd ? 1 : -1);
            if (index < 0 || index >= this.ranges.length) {
                return this;
            }
            const res = new SelectionRanges(index, this.ranges);
            if (res.ranges[index].equalsRange(this.ranges[this.index])) {
                // next range equals this range, retry with next-next
                return res.mov(fwd);
            }
            return res;
        }
    }
    let SmartSelectController = class SmartSelectController {
        constructor(_editor, _languageFeaturesService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._ignoreSelection = false;
        }
        static get(editor) {
            return editor.getContribution(SmartSelectController.ID);
        }
        dispose() {
            var _a;
            (_a = this._selectionListener) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        async run(forward) {
            if (!this._editor.hasModel()) {
                return;
            }
            const selections = this._editor.getSelections();
            const model = this._editor.getModel();
            if (!this._state) {
                await provideSelectionRanges(this._languageFeaturesService.selectionRangeProvider, model, selections.map(s => s.getPosition()), this._editor.getOption(102 /* EditorOption.smartSelect */), cancellation_1.CancellationToken.None).then(ranges => {
                    var _a;
                    if (!arrays.isNonEmptyArray(ranges) || ranges.length !== selections.length) {
                        // invalid result
                        return;
                    }
                    if (!this._editor.hasModel() || !arrays.equals(this._editor.getSelections(), selections, (a, b) => a.equalsSelection(b))) {
                        // invalid editor state
                        return;
                    }
                    for (let i = 0; i < ranges.length; i++) {
                        ranges[i] = ranges[i].filter(range => {
                            // filter ranges inside the selection
                            return range.containsPosition(selections[i].getStartPosition()) && range.containsPosition(selections[i].getEndPosition());
                        });
                        // prepend current selection
                        ranges[i].unshift(selections[i]);
                    }
                    this._state = ranges.map(ranges => new SelectionRanges(0, ranges));
                    // listen to caret move and forget about state
                    (_a = this._selectionListener) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._selectionListener = this._editor.onDidChangeCursorPosition(() => {
                        var _a;
                        if (!this._ignoreSelection) {
                            (_a = this._selectionListener) === null || _a === void 0 ? void 0 : _a.dispose();
                            this._state = undefined;
                        }
                    });
                });
            }
            if (!this._state) {
                // no state
                return;
            }
            this._state = this._state.map(state => state.mov(forward));
            const newSelections = this._state.map(state => selection_1.Selection.fromPositions(state.ranges[state.index].getStartPosition(), state.ranges[state.index].getEndPosition()));
            this._ignoreSelection = true;
            try {
                this._editor.setSelections(newSelections);
            }
            finally {
                this._ignoreSelection = false;
            }
        }
    };
    SmartSelectController.ID = 'editor.contrib.smartSelectController';
    SmartSelectController = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], SmartSelectController);
    class AbstractSmartSelect extends editorExtensions_1.EditorAction {
        constructor(forward, opts) {
            super(opts);
            this._forward = forward;
        }
        async run(_accessor, editor) {
            let controller = SmartSelectController.get(editor);
            if (controller) {
                await controller.run(this._forward);
            }
        }
    }
    class GrowSelectionAction extends AbstractSmartSelect {
        constructor() {
            super(true, {
                id: 'editor.action.smartSelect.expand',
                label: nls.localize('smartSelect.expand', "Expand Selection"),
                alias: 'Expand Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */,
                        secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */],
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '1_basic',
                    title: nls.localize({ key: 'miSmartSelectGrow', comment: ['&& denotes a mnemonic'] }, "&&Expand Selection"),
                    order: 2
                }
            });
        }
    }
    // renamed command id
    commands_1.CommandsRegistry.registerCommandAlias('editor.action.smartSelect.grow', 'editor.action.smartSelect.expand');
    class ShrinkSelectionAction extends AbstractSmartSelect {
        constructor() {
            super(false, {
                id: 'editor.action.smartSelect.shrink',
                label: nls.localize('smartSelect.shrink', "Shrink Selection"),
                alias: 'Shrink Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */,
                        secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */],
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '1_basic',
                    title: nls.localize({ key: 'miSmartSelectShrink', comment: ['&& denotes a mnemonic'] }, "&&Shrink Selection"),
                    order: 3
                }
            });
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(SmartSelectController.ID, SmartSelectController);
    (0, editorExtensions_1.registerEditorAction)(GrowSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(ShrinkSelectionAction);
    async function provideSelectionRanges(registry, model, positions, options, token) {
        const providers = registry.all(model)
            .concat(new wordSelections_1.WordSelectionRangeProvider()); // ALWAYS have word based selection range
        if (providers.length === 1) {
            // add word selection and bracket selection when no provider exists
            providers.unshift(new bracketSelections_1.BracketSelectionRangeProvider());
        }
        let work = [];
        let allRawRanges = [];
        for (const provider of providers) {
            work.push(Promise.resolve(provider.provideSelectionRanges(model, positions, token)).then(allProviderRanges => {
                if (arrays.isNonEmptyArray(allProviderRanges) && allProviderRanges.length === positions.length) {
                    for (let i = 0; i < positions.length; i++) {
                        if (!allRawRanges[i]) {
                            allRawRanges[i] = [];
                        }
                        for (const oneProviderRanges of allProviderRanges[i]) {
                            if (range_1.Range.isIRange(oneProviderRanges.range) && range_1.Range.containsPosition(oneProviderRanges.range, positions[i])) {
                                allRawRanges[i].push(range_1.Range.lift(oneProviderRanges.range));
                            }
                        }
                    }
                }
            }, errors_1.onUnexpectedExternalError));
        }
        await Promise.all(work);
        return allRawRanges.map(oneRawRanges => {
            if (oneRawRanges.length === 0) {
                return [];
            }
            // sort all by start/end position
            oneRawRanges.sort((a, b) => {
                if (position_1.Position.isBefore(a.getStartPosition(), b.getStartPosition())) {
                    return 1;
                }
                else if (position_1.Position.isBefore(b.getStartPosition(), a.getStartPosition())) {
                    return -1;
                }
                else if (position_1.Position.isBefore(a.getEndPosition(), b.getEndPosition())) {
                    return -1;
                }
                else if (position_1.Position.isBefore(b.getEndPosition(), a.getEndPosition())) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            // remove ranges that don't contain the former range or that are equal to the
            // former range
            let oneRanges = [];
            let last;
            for (const range of oneRawRanges) {
                if (!last || (range_1.Range.containsRange(range, last) && !range_1.Range.equalsRange(range, last))) {
                    oneRanges.push(range);
                    last = range;
                }
            }
            if (!options.selectLeadingAndTrailingWhitespace) {
                return oneRanges;
            }
            // add ranges that expand trivia at line starts and ends whenever a range
            // wraps onto the a new line
            let oneRangesWithTrivia = [oneRanges[0]];
            for (let i = 1; i < oneRanges.length; i++) {
                const prev = oneRanges[i - 1];
                const cur = oneRanges[i];
                if (cur.startLineNumber !== prev.startLineNumber || cur.endLineNumber !== prev.endLineNumber) {
                    // add line/block range without leading/failing whitespace
                    const rangeNoWhitespace = new range_1.Range(prev.startLineNumber, model.getLineFirstNonWhitespaceColumn(prev.startLineNumber), prev.endLineNumber, model.getLineLastNonWhitespaceColumn(prev.endLineNumber));
                    if (rangeNoWhitespace.containsRange(prev) && !rangeNoWhitespace.equalsRange(prev) && cur.containsRange(rangeNoWhitespace) && !cur.equalsRange(rangeNoWhitespace)) {
                        oneRangesWithTrivia.push(rangeNoWhitespace);
                    }
                    // add line/block range
                    const rangeFull = new range_1.Range(prev.startLineNumber, 1, prev.endLineNumber, model.getLineMaxColumn(prev.endLineNumber));
                    if (rangeFull.containsRange(prev) && !rangeFull.equalsRange(rangeNoWhitespace) && cur.containsRange(rangeFull) && !cur.equalsRange(rangeFull)) {
                        oneRangesWithTrivia.push(rangeFull);
                    }
                }
                oneRangesWithTrivia.push(cur);
            }
            return oneRangesWithTrivia;
        });
    }
    exports.provideSelectionRanges = provideSelectionRanges;
    commands_1.CommandsRegistry.registerCommand('_executeSelectionRangeProvider', async function (accessor, ...args) {
        const [resource, positions] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        const registry = accessor.get(languageFeatures_1.ILanguageFeaturesService).selectionRangeProvider;
        const reference = await accessor.get(resolverService_1.ITextModelService).createModelReference(resource);
        try {
            return provideSelectionRanges(registry, reference.object.textEditorModel, positions, { selectLeadingAndTrailingWhitespace: true }, cancellation_1.CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
});
//# sourceMappingURL=smartSelect.js.map