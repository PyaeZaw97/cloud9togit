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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "../referencesModel", "./referencesWidget"], function (require, exports, async_1, errors_1, keyCodes_1, lifecycle_1, codeEditorService_1, position_1, range_1, peekView_1, nls, commands_1, configuration_1, contextkey_1, instantiation_1, keybindingsRegistry_1, listService_1, notification_1, storage_1, referencesModel_1, referencesWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferencesController = exports.ctxReferenceSearchVisible = void 0;
    exports.ctxReferenceSearchVisible = new contextkey_1.RawContextKey('referenceSearchVisible', false, nls.localize('referenceSearchVisible', "Whether reference peek is visible, like 'Peek References' or 'Peek Definition'"));
    let ReferencesController = class ReferencesController {
        constructor(_defaultTreeKeyboardSupport, _editor, contextKeyService, _editorService, _notificationService, _instantiationService, _storageService, _configurationService) {
            this._defaultTreeKeyboardSupport = _defaultTreeKeyboardSupport;
            this._editor = _editor;
            this._editorService = _editorService;
            this._notificationService = _notificationService;
            this._instantiationService = _instantiationService;
            this._storageService = _storageService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._requestIdPool = 0;
            this._ignoreModelChangeEvent = false;
            this._referenceSearchVisible = exports.ctxReferenceSearchVisible.bindTo(contextKeyService);
        }
        static get(editor) {
            return editor.getContribution(ReferencesController.ID);
        }
        dispose() {
            var _a, _b;
            this._referenceSearchVisible.reset();
            this._disposables.dispose();
            (_a = this._widget) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._model) === null || _b === void 0 ? void 0 : _b.dispose();
            this._widget = undefined;
            this._model = undefined;
        }
        toggleWidget(range, modelPromise, peekMode) {
            // close current widget and return early is position didn't change
            let widgetPosition;
            if (this._widget) {
                widgetPosition = this._widget.position;
            }
            this.closeWidget();
            if (!!widgetPosition && range.containsPosition(widgetPosition)) {
                return;
            }
            this._peekMode = peekMode;
            this._referenceSearchVisible.set(true);
            // close the widget on model/mode changes
            this._disposables.add(this._editor.onDidChangeModelLanguage(() => { this.closeWidget(); }));
            this._disposables.add(this._editor.onDidChangeModel(() => {
                if (!this._ignoreModelChangeEvent) {
                    this.closeWidget();
                }
            }));
            const storageKey = 'peekViewLayout';
            const data = referencesWidget_1.LayoutData.fromJSON(this._storageService.get(storageKey, 0 /* StorageScope.GLOBAL */, '{}'));
            this._widget = this._instantiationService.createInstance(referencesWidget_1.ReferenceWidget, this._editor, this._defaultTreeKeyboardSupport, data);
            this._widget.setTitle(nls.localize('labelLoading', "Loading..."));
            this._widget.show(range);
            this._disposables.add(this._widget.onDidClose(() => {
                modelPromise.cancel();
                if (this._widget) {
                    this._storageService.store(storageKey, JSON.stringify(this._widget.layoutData), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                    this._widget = undefined;
                }
                this.closeWidget();
            }));
            this._disposables.add(this._widget.onDidSelectReference(event => {
                let { element, kind } = event;
                if (!element) {
                    return;
                }
                switch (kind) {
                    case 'open':
                        if (event.source !== 'editor' || !this._configurationService.getValue('editor.stablePeek')) {
                            // when stable peek is configured we don't close
                            // the peek window on selecting the editor
                            this.openReference(element, false, false);
                        }
                        break;
                    case 'side':
                        this.openReference(element, true, false);
                        break;
                    case 'goto':
                        if (peekMode) {
                            this._gotoReference(element);
                        }
                        else {
                            this.openReference(element, false, true);
                        }
                        break;
                }
            }));
            const requestId = ++this._requestIdPool;
            modelPromise.then(model => {
                var _a;
                // still current request? widget still open?
                if (requestId !== this._requestIdPool || !this._widget) {
                    model.dispose();
                    return undefined;
                }
                (_a = this._model) === null || _a === void 0 ? void 0 : _a.dispose();
                this._model = model;
                // show widget
                return this._widget.setModel(this._model).then(() => {
                    if (this._widget && this._model && this._editor.hasModel()) { // might have been closed
                        // set title
                        if (!this._model.isEmpty) {
                            this._widget.setMetaTitle(nls.localize('metaTitle.N', "{0} ({1})", this._model.title, this._model.references.length));
                        }
                        else {
                            this._widget.setMetaTitle('');
                        }
                        // set 'best' selection
                        let uri = this._editor.getModel().uri;
                        let pos = new position_1.Position(range.startLineNumber, range.startColumn);
                        let selection = this._model.nearestReference(uri, pos);
                        if (selection) {
                            return this._widget.setSelection(selection).then(() => {
                                if (this._widget && this._editor.getOption(77 /* EditorOption.peekWidgetDefaultFocus */) === 'editor') {
                                    this._widget.focusOnPreviewEditor();
                                }
                            });
                        }
                    }
                    return undefined;
                });
            }, error => {
                this._notificationService.error(error);
            });
        }
        changeFocusBetweenPreviewAndReferences() {
            if (!this._widget) {
                // can be called while still resolving...
                return;
            }
            if (this._widget.isPreviewEditorFocused()) {
                this._widget.focusOnReferenceTree();
            }
            else {
                this._widget.focusOnPreviewEditor();
            }
        }
        async goToNextOrPreviousReference(fwd) {
            if (!this._editor.hasModel() || !this._model || !this._widget) {
                // can be called while still resolving...
                return;
            }
            const currentPosition = this._widget.position;
            if (!currentPosition) {
                return;
            }
            const source = this._model.nearestReference(this._editor.getModel().uri, currentPosition);
            if (!source) {
                return;
            }
            const target = this._model.nextOrPreviousReference(source, fwd);
            const editorFocus = this._editor.hasTextFocus();
            const previewEditorFocus = this._widget.isPreviewEditorFocused();
            await this._widget.setSelection(target);
            await this._gotoReference(target);
            if (editorFocus) {
                this._editor.focus();
            }
            else if (this._widget && previewEditorFocus) {
                this._widget.focusOnPreviewEditor();
            }
        }
        async revealReference(reference) {
            if (!this._editor.hasModel() || !this._model || !this._widget) {
                // can be called while still resolving...
                return;
            }
            await this._widget.revealReference(reference);
        }
        closeWidget(focusEditor = true) {
            var _a, _b;
            (_a = this._widget) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._model) === null || _b === void 0 ? void 0 : _b.dispose();
            this._referenceSearchVisible.reset();
            this._disposables.clear();
            this._widget = undefined;
            this._model = undefined;
            if (focusEditor) {
                this._editor.focus();
            }
            this._requestIdPool += 1; // Cancel pending requests
        }
        _gotoReference(ref) {
            if (this._widget) {
                this._widget.hide();
            }
            this._ignoreModelChangeEvent = true;
            const range = range_1.Range.lift(ref.range).collapseToStart();
            return this._editorService.openCodeEditor({
                resource: ref.uri,
                options: { selection: range, selectionSource: "code.jump" /* TextEditorSelectionSource.JUMP */ }
            }, this._editor).then(openedEditor => {
                var _a;
                this._ignoreModelChangeEvent = false;
                if (!openedEditor || !this._widget) {
                    // something went wrong...
                    this.closeWidget();
                    return;
                }
                if (this._editor === openedEditor) {
                    //
                    this._widget.show(range);
                    this._widget.focusOnReferenceTree();
                }
                else {
                    // we opened a different editor instance which means a different controller instance.
                    // therefore we stop with this controller and continue with the other
                    const other = ReferencesController.get(openedEditor);
                    const model = this._model.clone();
                    this.closeWidget();
                    openedEditor.focus();
                    other === null || other === void 0 ? void 0 : other.toggleWidget(range, (0, async_1.createCancelablePromise)(_ => Promise.resolve(model)), (_a = this._peekMode) !== null && _a !== void 0 ? _a : false);
                }
            }, (err) => {
                this._ignoreModelChangeEvent = false;
                (0, errors_1.onUnexpectedError)(err);
            });
        }
        openReference(ref, sideBySide, pinned) {
            // clear stage
            if (!sideBySide) {
                this.closeWidget();
            }
            const { uri, range } = ref;
            this._editorService.openCodeEditor({
                resource: uri,
                options: { selection: range, selectionSource: "code.jump" /* TextEditorSelectionSource.JUMP */, pinned }
            }, this._editor, sideBySide);
        }
    };
    ReferencesController.ID = 'editor.contrib.referencesController';
    ReferencesController = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, notification_1.INotificationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, storage_1.IStorageService),
        __param(7, configuration_1.IConfigurationService)
    ], ReferencesController);
    exports.ReferencesController = ReferencesController;
    function withController(accessor, fn) {
        const outerEditor = (0, peekView_1.getOuterEditor)(accessor);
        if (!outerEditor) {
            return;
        }
        const controller = ReferencesController.get(outerEditor);
        if (controller) {
            fn(controller);
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'togglePeekWidgetFocus',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 60 /* KeyCode.F2 */),
        when: contextkey_1.ContextKeyExpr.or(exports.ctxReferenceSearchVisible, peekView_1.PeekContext.inPeekEditor),
        handler(accessor) {
            withController(accessor, controller => {
                controller.changeFocusBetweenPreviewAndReferences();
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToNextReference',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
        primary: 62 /* KeyCode.F4 */,
        secondary: [70 /* KeyCode.F12 */],
        when: contextkey_1.ContextKeyExpr.or(exports.ctxReferenceSearchVisible, peekView_1.PeekContext.inPeekEditor),
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(true);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToPreviousReference',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
        primary: 1024 /* KeyMod.Shift */ | 62 /* KeyCode.F4 */,
        secondary: [1024 /* KeyMod.Shift */ | 70 /* KeyCode.F12 */],
        when: contextkey_1.ContextKeyExpr.or(exports.ctxReferenceSearchVisible, peekView_1.PeekContext.inPeekEditor),
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(false);
            });
        }
    });
    // commands that aren't needed anymore because there is now ContextKeyExpr.OR
    commands_1.CommandsRegistry.registerCommandAlias('goToNextReferenceFromEmbeddedEditor', 'goToNextReference');
    commands_1.CommandsRegistry.registerCommandAlias('goToPreviousReferenceFromEmbeddedEditor', 'goToPreviousReference');
    // close
    commands_1.CommandsRegistry.registerCommandAlias('closeReferenceSearchEditor', 'closeReferenceSearch');
    commands_1.CommandsRegistry.registerCommand('closeReferenceSearch', accessor => withController(accessor, controller => controller.closeWidget()));
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'closeReferenceSearch',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 101,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: contextkey_1.ContextKeyExpr.and(peekView_1.PeekContext.inPeekEditor, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek'))
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'closeReferenceSearch',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: contextkey_1.ContextKeyExpr.and(exports.ctxReferenceSearchVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek'))
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'revealReference',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        when: contextkey_1.ContextKeyExpr.and(exports.ctxReferenceSearchVisible, listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchTreeElementCanCollapse.negate(), listService_1.WorkbenchTreeElementCanExpand.negate()),
        handler(accessor) {
            var _a;
            const listService = accessor.get(listService_1.IListService);
            const focus = (_a = listService.lastFocusedList) === null || _a === void 0 ? void 0 : _a.getFocus();
            if (Array.isArray(focus) && focus[0] instanceof referencesModel_1.OneReference) {
                withController(accessor, controller => controller.revealReference(focus[0]));
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'openReferenceToSide',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        mac: {
            primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
        },
        when: contextkey_1.ContextKeyExpr.and(exports.ctxReferenceSearchVisible, listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchTreeElementCanCollapse.negate(), listService_1.WorkbenchTreeElementCanExpand.negate()),
        handler(accessor) {
            var _a;
            const listService = accessor.get(listService_1.IListService);
            const focus = (_a = listService.lastFocusedList) === null || _a === void 0 ? void 0 : _a.getFocus();
            if (Array.isArray(focus) && focus[0] instanceof referencesModel_1.OneReference) {
                withController(accessor, controller => controller.openReference(focus[0], true, true));
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand('openReference', (accessor) => {
        var _a;
        const listService = accessor.get(listService_1.IListService);
        const focus = (_a = listService.lastFocusedList) === null || _a === void 0 ? void 0 : _a.getFocus();
        if (Array.isArray(focus) && focus[0] instanceof referencesModel_1.OneReference) {
            withController(accessor, controller => controller.openReference(focus[0], false, true));
        }
    });
});
//# sourceMappingURL=referencesController.js.map