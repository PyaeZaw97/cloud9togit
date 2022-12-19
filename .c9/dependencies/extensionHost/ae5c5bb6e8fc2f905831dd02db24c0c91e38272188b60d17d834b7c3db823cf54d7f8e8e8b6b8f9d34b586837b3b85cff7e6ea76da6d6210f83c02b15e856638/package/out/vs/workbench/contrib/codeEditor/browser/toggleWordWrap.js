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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/base/common/codicons", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, lifecycle_1, editorExtensions_1, codeEditorService_1, actions_1, contextkey_1, editorContextKeys_1, codicons_1, platform_1, contributions_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readTransientState = exports.writeTransientState = void 0;
    const transientWordWrapState = 'transientWordWrapState';
    const isWordWrapMinifiedKey = 'isWordWrapMinified';
    const isDominatedByLongLinesKey = 'isDominatedByLongLines';
    const CAN_TOGGLE_WORD_WRAP = new contextkey_1.RawContextKey('canToggleWordWrap', false, true);
    const EDITOR_WORD_WRAP = new contextkey_1.RawContextKey('editorWordWrap', false, nls.localize('editorWordWrap', 'Whether the editor is currently using word wrapping.'));
    /**
     * Store (in memory) the word wrap state for a particular model.
     */
    function writeTransientState(model, state, codeEditorService) {
        codeEditorService.setTransientModelProperty(model, transientWordWrapState, state);
    }
    exports.writeTransientState = writeTransientState;
    /**
     * Read (in memory) the word wrap state for a particular model.
     */
    function readTransientState(model, codeEditorService) {
        return codeEditorService.getTransientModelProperty(model, transientWordWrapState);
    }
    exports.readTransientState = readTransientState;
    const TOGGLE_WORD_WRAP_ID = 'editor.action.toggleWordWrap';
    class ToggleWordWrapAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TOGGLE_WORD_WRAP_ID,
                label: nls.localize('toggle.wordwrap', "View: Toggle Word Wrap"),
                alias: 'View: Toggle Word Wrap',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 512 /* KeyMod.Alt */ | 56 /* KeyCode.KeyZ */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            if (!canToggleWordWrap(codeEditorService, editor)) {
                return;
            }
            const model = editor.getModel();
            // Read the current state
            const transientState = readTransientState(model, codeEditorService);
            // Compute the new state
            let newState;
            if (transientState) {
                newState = null;
            }
            else {
                const actualWrappingInfo = editor.getOption(132 /* EditorOption.wrappingInfo */);
                const wordWrapOverride = (actualWrappingInfo.wrappingColumn === -1 ? 'on' : 'off');
                newState = { wordWrapOverride };
            }
            // Write the new state
            // (this will cause an event and the controller will apply the state)
            writeTransientState(model, newState, codeEditorService);
            // if we are in a diff editor, update the other editor (if possible)
            if (editor.getOption(54 /* EditorOption.inDiffEditor */)) {
                // this editor belongs to a diff editor
                for (const diffEditor of codeEditorService.listDiffEditors()) {
                    const originalEditor = diffEditor.getOriginalEditor();
                    const modifiedEditor = diffEditor.getModifiedEditor();
                    if (originalEditor === editor) {
                        if (canToggleWordWrap(codeEditorService, modifiedEditor)) {
                            writeTransientState(modifiedEditor.getModel(), newState, codeEditorService);
                            diffEditor.updateOptions({});
                        }
                        break;
                    }
                    if (modifiedEditor === editor) {
                        if (canToggleWordWrap(codeEditorService, originalEditor)) {
                            writeTransientState(originalEditor.getModel(), newState, codeEditorService);
                            diffEditor.updateOptions({});
                        }
                        break;
                    }
                }
            }
        }
    }
    let ToggleWordWrapController = class ToggleWordWrapController extends lifecycle_1.Disposable {
        constructor(_editor, _contextKeyService, _codeEditorService) {
            super();
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._codeEditorService = _codeEditorService;
            const options = this._editor.getOptions();
            const wrappingInfo = options.get(132 /* EditorOption.wrappingInfo */);
            const isWordWrapMinified = this._contextKeyService.createKey(isWordWrapMinifiedKey, wrappingInfo.isWordWrapMinified);
            const isDominatedByLongLines = this._contextKeyService.createKey(isDominatedByLongLinesKey, wrappingInfo.isDominatedByLongLines);
            let currentlyApplyingEditorConfig = false;
            this._register(_editor.onDidChangeConfiguration((e) => {
                if (!e.hasChanged(132 /* EditorOption.wrappingInfo */)) {
                    return;
                }
                const options = this._editor.getOptions();
                const wrappingInfo = options.get(132 /* EditorOption.wrappingInfo */);
                isWordWrapMinified.set(wrappingInfo.isWordWrapMinified);
                isDominatedByLongLines.set(wrappingInfo.isDominatedByLongLines);
                if (!currentlyApplyingEditorConfig) {
                    // I am not the cause of the word wrap getting changed
                    ensureWordWrapSettings();
                }
            }));
            this._register(_editor.onDidChangeModel((e) => {
                ensureWordWrapSettings();
            }));
            this._register(_codeEditorService.onDidChangeTransientModelProperty(() => {
                ensureWordWrapSettings();
            }));
            const ensureWordWrapSettings = () => {
                if (!canToggleWordWrap(this._codeEditorService, this._editor)) {
                    return;
                }
                const transientState = readTransientState(this._editor.getModel(), this._codeEditorService);
                // Apply the state
                try {
                    currentlyApplyingEditorConfig = true;
                    this._applyWordWrapState(transientState);
                }
                finally {
                    currentlyApplyingEditorConfig = false;
                }
            };
        }
        _applyWordWrapState(state) {
            const wordWrapOverride2 = state ? state.wordWrapOverride : 'inherit';
            this._editor.updateOptions({
                wordWrapOverride2: wordWrapOverride2
            });
        }
    };
    ToggleWordWrapController.ID = 'editor.contrib.toggleWordWrapController';
    ToggleWordWrapController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], ToggleWordWrapController);
    function canToggleWordWrap(codeEditorService, editor) {
        if (!editor) {
            return false;
        }
        if (editor.isSimpleWidget) {
            // in a simple widget...
            return false;
        }
        // Ensure correct word wrap settings
        const model = editor.getModel();
        if (!model) {
            return false;
        }
        if (model.uri.scheme === 'output') {
            // in output editor
            return false;
        }
        if (editor.getOption(54 /* EditorOption.inDiffEditor */)) {
            // this editor belongs to a diff editor
            for (const diffEditor of codeEditorService.listDiffEditors()) {
                if (diffEditor.getOriginalEditor() === editor && !diffEditor.renderSideBySide) {
                    // this editor is the left side of an inline diff editor
                    return false;
                }
            }
        }
        return true;
    }
    let EditorWordWrapContextKeyTracker = class EditorWordWrapContextKeyTracker {
        constructor(_editorService, _codeEditorService, _contextService) {
            this._editorService = _editorService;
            this._codeEditorService = _codeEditorService;
            this._contextService = _contextService;
            window.addEventListener('focus', () => this._update(), true);
            window.addEventListener('blur', () => this._update(), true);
            this._editorService.onDidActiveEditorChange(() => this._update());
            this._canToggleWordWrap = CAN_TOGGLE_WORD_WRAP.bindTo(this._contextService);
            this._editorWordWrap = EDITOR_WORD_WRAP.bindTo(this._contextService);
            this._activeEditor = null;
            this._activeEditorListener = new lifecycle_1.DisposableStore();
            this._update();
        }
        _update() {
            const activeEditor = this._codeEditorService.getFocusedCodeEditor() || this._codeEditorService.getActiveCodeEditor();
            if (this._activeEditor === activeEditor) {
                // no change
                return;
            }
            this._activeEditorListener.clear();
            this._activeEditor = activeEditor;
            if (activeEditor) {
                this._activeEditorListener.add(activeEditor.onDidChangeModel(() => this._updateFromCodeEditor()));
                this._activeEditorListener.add(activeEditor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(132 /* EditorOption.wrappingInfo */)) {
                        this._updateFromCodeEditor();
                    }
                }));
                this._updateFromCodeEditor();
            }
        }
        _updateFromCodeEditor() {
            if (!canToggleWordWrap(this._codeEditorService, this._activeEditor)) {
                return this._setValues(false, false);
            }
            else {
                const wrappingInfo = this._activeEditor.getOption(132 /* EditorOption.wrappingInfo */);
                this._setValues(true, wrappingInfo.wrappingColumn !== -1);
            }
        }
        _setValues(canToggleWordWrap, isWordWrap) {
            this._canToggleWordWrap.set(canToggleWordWrap);
            this._editorWordWrap.set(isWordWrap);
        }
    };
    EditorWordWrapContextKeyTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, contextkey_1.IContextKeyService)
    ], EditorWordWrapContextKeyTracker);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(EditorWordWrapContextKeyTracker, 2 /* LifecyclePhase.Ready */);
    (0, editorExtensions_1.registerEditorContribution)(ToggleWordWrapController.ID, ToggleWordWrapController);
    (0, editorExtensions_1.registerEditorAction)(ToggleWordWrapAction);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('unwrapMinified', "Disable wrapping for this file"),
            icon: codicons_1.Codicon.wordWrap
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.has(isWordWrapMinifiedKey))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('wrapMinified', "Enable wrapping for this file"),
            icon: codicons_1.Codicon.wordWrap
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.inDiffEditor.negate(), contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.not(isWordWrapMinifiedKey))
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '5_editor',
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize({ key: 'miToggleWordWrap', comment: ['&& denotes a mnemonic'] }, "&&Word Wrap"),
            toggled: EDITOR_WORD_WRAP,
            precondition: CAN_TOGGLE_WORD_WRAP
        },
        order: 1
    });
});
//# sourceMappingURL=toggleWordWrap.js.map