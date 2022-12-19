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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/core/cursorColumns", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlineCompletions/browser/ghostTextModel", "vs/editor/contrib/inlineCompletions/browser/ghostTextWidget", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, lifecycle_1, strings_1, editorExtensions_1, cursorColumns_1, editorContextKeys_1, ghostTextModel_1, ghostTextWidget_1, nls, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerInlineSuggestionAction = exports.ShowPreviousInlineSuggestionAction = exports.ShowNextInlineSuggestionAction = exports.ActiveGhostTextController = exports.GhostTextController = void 0;
    let GhostTextController = class GhostTextController extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.triggeredExplicitly = false;
            this.activeController = this._register(new lifecycle_1.MutableDisposable());
            this.activeModelDidChangeEmitter = this._register(new event_1.Emitter());
            this.onActiveModelDidChange = this.activeModelDidChangeEmitter.event;
            this._register(this.editor.onDidChangeModel(() => {
                this.updateModelController();
            }));
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(106 /* EditorOption.suggest */)) {
                    this.updateModelController();
                }
                if (e.hasChanged(55 /* EditorOption.inlineSuggest */)) {
                    this.updateModelController();
                }
            }));
            this.updateModelController();
        }
        static get(editor) {
            return editor.getContribution(GhostTextController.ID);
        }
        get activeModel() {
            var _a;
            return (_a = this.activeController.value) === null || _a === void 0 ? void 0 : _a.model;
        }
        // Don't call this method when not necessary. It will recreate the activeController.
        updateModelController() {
            const suggestOptions = this.editor.getOption(106 /* EditorOption.suggest */);
            const inlineSuggestOptions = this.editor.getOption(55 /* EditorOption.inlineSuggest */);
            this.activeController.value = undefined;
            // ActiveGhostTextController is only created if one of those settings is set or if the inline completions are triggered explicitly.
            this.activeController.value =
                this.editor.hasModel() && (suggestOptions.preview || inlineSuggestOptions.enabled || this.triggeredExplicitly)
                    ? this.instantiationService.createInstance(ActiveGhostTextController, this.editor)
                    : undefined;
            this.activeModelDidChangeEmitter.fire();
        }
        shouldShowHoverAt(hoverRange) {
            var _a;
            return ((_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.shouldShowHoverAt(hoverRange)) || false;
        }
        shouldShowHoverAtViewZone(viewZoneId) {
            var _a, _b;
            return ((_b = (_a = this.activeController.value) === null || _a === void 0 ? void 0 : _a.widget) === null || _b === void 0 ? void 0 : _b.shouldShowHoverAtViewZone(viewZoneId)) || false;
        }
        trigger() {
            var _a;
            this.triggeredExplicitly = true;
            if (!this.activeController.value) {
                this.updateModelController();
            }
            (_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.triggerInlineCompletion();
        }
        commit() {
            var _a;
            (_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.commitInlineCompletion();
        }
        hide() {
            var _a;
            (_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.hideInlineCompletion();
        }
        showNextInlineCompletion() {
            var _a;
            (_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.showNextInlineCompletion();
        }
        showPreviousInlineCompletion() {
            var _a;
            (_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.showPreviousInlineCompletion();
        }
        async hasMultipleInlineCompletions() {
            var _a;
            const result = await ((_a = this.activeModel) === null || _a === void 0 ? void 0 : _a.hasMultipleInlineCompletions());
            return result !== undefined ? result : false;
        }
    };
    GhostTextController.inlineSuggestionVisible = new contextkey_1.RawContextKey('inlineSuggestionVisible', false, nls.localize('inlineSuggestionVisible', "Whether an inline suggestion is visible"));
    GhostTextController.inlineSuggestionHasIndentation = new contextkey_1.RawContextKey('inlineSuggestionHasIndentation', false, nls.localize('inlineSuggestionHasIndentation', "Whether the inline suggestion starts with whitespace"));
    GhostTextController.inlineSuggestionHasIndentationLessThanTabSize = new contextkey_1.RawContextKey('inlineSuggestionHasIndentationLessThanTabSize', true, nls.localize('inlineSuggestionHasIndentationLessThanTabSize', "Whether the inline suggestion starts with whitespace that is less than what would be inserted by tab"));
    GhostTextController.ID = 'editor.contrib.ghostTextController';
    GhostTextController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], GhostTextController);
    exports.GhostTextController = GhostTextController;
    class GhostTextContextKeys {
        constructor(contextKeyService) {
            this.contextKeyService = contextKeyService;
            this.inlineCompletionVisible = GhostTextController.inlineSuggestionVisible.bindTo(this.contextKeyService);
            this.inlineCompletionSuggestsIndentation = GhostTextController.inlineSuggestionHasIndentation.bindTo(this.contextKeyService);
            this.inlineCompletionSuggestsIndentationLessThanTabSize = GhostTextController.inlineSuggestionHasIndentationLessThanTabSize.bindTo(this.contextKeyService);
        }
    }
    /**
     * The controller for a text editor with an initialized text model.
     * Must be disposed as soon as the model detaches from the editor.
    */
    let ActiveGhostTextController = class ActiveGhostTextController extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, contextKeyService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.contextKeys = new GhostTextContextKeys(this.contextKeyService);
            this.model = this._register(this.instantiationService.createInstance(ghostTextModel_1.GhostTextModel, this.editor));
            this.widget = this._register(this.instantiationService.createInstance(ghostTextWidget_1.GhostTextWidget, this.editor, this.model));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.contextKeys.inlineCompletionVisible.set(false);
                this.contextKeys.inlineCompletionSuggestsIndentation.set(false);
                this.contextKeys.inlineCompletionSuggestsIndentationLessThanTabSize.set(true);
            }));
            this._register(this.model.onDidChange(() => {
                this.updateContextKeys();
            }));
            this.updateContextKeys();
        }
        updateContextKeys() {
            var _a;
            this.contextKeys.inlineCompletionVisible.set(((_a = this.model.activeInlineCompletionsModel) === null || _a === void 0 ? void 0 : _a.ghostText) !== undefined);
            let startsWithIndentation = false;
            let startsWithIndentationLessThanTabSize = true;
            const ghostText = this.model.inlineCompletionsModel.ghostText;
            if (!!this.model.activeInlineCompletionsModel && ghostText && ghostText.parts.length > 0) {
                const { column, lines } = ghostText.parts[0];
                const firstLine = lines[0];
                const indentationEndColumn = this.editor.getModel().getLineIndentColumn(ghostText.lineNumber);
                const inIndentation = column <= indentationEndColumn;
                if (inIndentation) {
                    let firstNonWsIdx = (0, strings_1.firstNonWhitespaceIndex)(firstLine);
                    if (firstNonWsIdx === -1) {
                        firstNonWsIdx = firstLine.length - 1;
                    }
                    startsWithIndentation = firstNonWsIdx > 0;
                    const tabSize = this.editor.getModel().getOptions().tabSize;
                    const visibleColumnIndentation = cursorColumns_1.CursorColumns.visibleColumnFromColumn(firstLine, firstNonWsIdx + 1, tabSize);
                    startsWithIndentationLessThanTabSize = visibleColumnIndentation < tabSize;
                }
            }
            this.contextKeys.inlineCompletionSuggestsIndentation.set(startsWithIndentation);
            this.contextKeys.inlineCompletionSuggestsIndentationLessThanTabSize.set(startsWithIndentationLessThanTabSize);
        }
    };
    ActiveGhostTextController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService)
    ], ActiveGhostTextController);
    exports.ActiveGhostTextController = ActiveGhostTextController;
    class ShowNextInlineSuggestionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: ShowNextInlineSuggestionAction.ID,
                label: nls.localize('action.inlineSuggest.showNext', "Show Next Inline Suggestion"),
                alias: 'Show Next Inline Suggestion',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, GhostTextController.inlineSuggestionVisible),
                kbOpts: {
                    weight: 100,
                    primary: 512 /* KeyMod.Alt */ | 89 /* KeyCode.BracketRight */,
                },
            });
        }
        async run(accessor, editor) {
            const controller = GhostTextController.get(editor);
            if (controller) {
                controller.showNextInlineCompletion();
                editor.focus();
            }
        }
    }
    exports.ShowNextInlineSuggestionAction = ShowNextInlineSuggestionAction;
    ShowNextInlineSuggestionAction.ID = 'editor.action.inlineSuggest.showNext';
    class ShowPreviousInlineSuggestionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: ShowPreviousInlineSuggestionAction.ID,
                label: nls.localize('action.inlineSuggest.showPrevious', "Show Previous Inline Suggestion"),
                alias: 'Show Previous Inline Suggestion',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, GhostTextController.inlineSuggestionVisible),
                kbOpts: {
                    weight: 100,
                    primary: 512 /* KeyMod.Alt */ | 87 /* KeyCode.BracketLeft */,
                },
            });
        }
        async run(accessor, editor) {
            const controller = GhostTextController.get(editor);
            if (controller) {
                controller.showPreviousInlineCompletion();
                editor.focus();
            }
        }
    }
    exports.ShowPreviousInlineSuggestionAction = ShowPreviousInlineSuggestionAction;
    ShowPreviousInlineSuggestionAction.ID = 'editor.action.inlineSuggest.showPrevious';
    class TriggerInlineSuggestionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inlineSuggest.trigger',
                label: nls.localize('action.inlineSuggest.trigger', "Trigger Inline Suggestion"),
                alias: 'Trigger Inline Suggestion',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        async run(accessor, editor) {
            const controller = GhostTextController.get(editor);
            if (controller) {
                controller.trigger();
            }
        }
    }
    exports.TriggerInlineSuggestionAction = TriggerInlineSuggestionAction;
});
//# sourceMappingURL=ghostTextController.js.map