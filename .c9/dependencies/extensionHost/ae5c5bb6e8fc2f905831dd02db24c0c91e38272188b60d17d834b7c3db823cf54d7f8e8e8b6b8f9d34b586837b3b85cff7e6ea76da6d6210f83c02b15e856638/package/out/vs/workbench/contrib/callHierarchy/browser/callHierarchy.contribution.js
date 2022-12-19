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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/callHierarchy/browser/callHierarchyPeek", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/storage/common/storage", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/common/errors"], function (require, exports, nls_1, callHierarchy_1, cancellation_1, instantiation_1, callHierarchyPeek_1, event_1, editorExtensions_1, contextkey_1, lifecycle_1, editorContextKeys_1, peekView_1, storage_1, codeEditorService_1, range_1, actions_1, codicons_1, iconRegistry_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasCallHierarchyProvider = new contextkey_1.RawContextKey('editorHasCallHierarchyProvider', false, (0, nls_1.localize)('editorHasCallHierarchyProvider', 'Whether a call hierarchy provider is available'));
    const _ctxCallHierarchyVisible = new contextkey_1.RawContextKey('callHierarchyVisible', false, (0, nls_1.localize)('callHierarchyVisible', 'Whether call hierarchy peek is currently showing'));
    const _ctxCallHierarchyDirection = new contextkey_1.RawContextKey('callHierarchyDirection', undefined, { type: 'string', description: (0, nls_1.localize)('callHierarchyDirection', 'Whether call hierarchy shows incoming or outgoing calls') });
    function sanitizedDirection(candidate) {
        return candidate === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */ || candidate === "incomingCalls" /* CallHierarchyDirection.CallsTo */
            ? candidate
            : "incomingCalls" /* CallHierarchyDirection.CallsTo */;
    }
    let CallHierarchyController = class CallHierarchyController {
        constructor(_editor, _contextKeyService, _storageService, _editorService, _instantiationService) {
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._ctxIsVisible = _ctxCallHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxHasProvider = _ctxHasCallHierarchyProvider.bindTo(this._contextKeyService);
            this._ctxDirection = _ctxCallHierarchyDirection.bindTo(this._contextKeyService);
            this._dispoables.add(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, callHierarchy_1.CallHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && callHierarchy_1.CallHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._dispoables.add(this._sessionDisposables);
        }
        static get(editor) {
            return editor.getContribution(CallHierarchyController.Id);
        }
        dispose() {
            this._ctxHasProvider.reset();
            this._ctxIsVisible.reset();
            this._dispoables.dispose();
        }
        async startCallHierarchyFromEditor() {
            this._sessionDisposables.clear();
            if (!this._editor.hasModel()) {
                return;
            }
            const document = this._editor.getModel();
            const position = this._editor.getPosition();
            if (!callHierarchy_1.CallHierarchyProviderRegistry.has(document)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const model = callHierarchy_1.CallHierarchyModel.create(document, position, cts.token);
            const direction = sanitizedDirection(this._storageService.get(CallHierarchyController._StorageDirection, 0 /* StorageScope.GLOBAL */, "incomingCalls" /* CallHierarchyDirection.CallsTo */));
            this._showCallHierarchyWidget(position, direction, model, cts);
        }
        async startCallHierarchyFromCallHierarchy() {
            var _a;
            if (!this._widget) {
                return;
            }
            const model = this._widget.getModel();
            const call = this._widget.getFocused();
            if (!call || !model) {
                return;
            }
            const newEditor = await this._editorService.openCodeEditor({ resource: call.item.uri }, this._editor);
            if (!newEditor) {
                return;
            }
            const newModel = model.fork(call.item);
            this._sessionDisposables.clear();
            (_a = CallHierarchyController.get(newEditor)) === null || _a === void 0 ? void 0 : _a._showCallHierarchyWidget(range_1.Range.lift(newModel.root.selectionRange).getStartPosition(), this._widget.direction, Promise.resolve(newModel), new cancellation_1.CancellationTokenSource());
        }
        _showCallHierarchyWidget(position, direction, model, cts) {
            this._ctxIsVisible.set(true);
            this._ctxDirection.set(direction);
            event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endCallHierarchy, this, this._sessionDisposables);
            this._widget = this._instantiationService.createInstance(callHierarchyPeek_1.CallHierarchyTreePeekWidget, this._editor, position, direction);
            this._widget.showLoading();
            this._sessionDisposables.add(this._widget.onDidClose(() => {
                this.endCallHierarchy();
                this._storageService.store(CallHierarchyController._StorageDirection, this._widget.direction, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            }));
            this._sessionDisposables.add({ dispose() { cts.dispose(true); } });
            this._sessionDisposables.add(this._widget);
            model.then(model => {
                if (cts.token.isCancellationRequested) {
                    return; // nothing
                }
                if (model) {
                    this._sessionDisposables.add(model);
                    this._widget.showModel(model);
                }
                else {
                    this._widget.showMessage((0, nls_1.localize)('no.item', "No results"));
                }
            }).catch(err => {
                if ((0, errors_1.isCancellationError)(err)) {
                    this.endCallHierarchy();
                    return;
                }
                this._widget.showMessage((0, nls_1.localize)('error', "Failed to show call hierarchy"));
            });
        }
        showOutgoingCalls() {
            var _a;
            (_a = this._widget) === null || _a === void 0 ? void 0 : _a.updateDirection("outgoingCalls" /* CallHierarchyDirection.CallsFrom */);
            this._ctxDirection.set("outgoingCalls" /* CallHierarchyDirection.CallsFrom */);
        }
        showIncomingCalls() {
            var _a;
            (_a = this._widget) === null || _a === void 0 ? void 0 : _a.updateDirection("incomingCalls" /* CallHierarchyDirection.CallsTo */);
            this._ctxDirection.set("incomingCalls" /* CallHierarchyDirection.CallsTo */);
        }
        endCallHierarchy() {
            this._sessionDisposables.clear();
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    CallHierarchyController.Id = 'callHierarchy';
    CallHierarchyController._StorageDirection = 'callHierarchy/defaultDirection';
    CallHierarchyController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], CallHierarchyController);
    (0, editorExtensions_1.registerEditorContribution)(CallHierarchyController.Id, CallHierarchyController);
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showCallHierarchy',
                title: { value: (0, nls_1.localize)('title', "Peek Call Hierarchy"), original: 'Peek Call Hierarchy' },
                menu: {
                    id: actions_1.MenuId.EditorContextPeek,
                    group: 'navigation',
                    order: 1000,
                    when: contextkey_1.ContextKeyExpr.and(_ctxHasCallHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                },
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasCallHierarchyProvider, peekView_1.PeekContext.notInPeekEditor)
            });
        }
        async runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = CallHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.startCallHierarchyFromEditor();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showIncomingCalls',
                title: { value: (0, nls_1.localize)('title.incoming', "Show Incoming Calls"), original: 'Show Incoming Calls' },
                icon: (0, iconRegistry_1.registerIcon)('callhierarchy-incoming', codicons_1.Codicon.callIncoming, (0, nls_1.localize)('showIncomingCallsIcons', 'Icon for incoming calls in the call hierarchy view.')),
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, _ctxCallHierarchyDirection.isEqualTo("outgoingCalls" /* CallHierarchyDirection.CallsFrom */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: callHierarchyPeek_1.CallHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxCallHierarchyDirection.isEqualTo("outgoingCalls" /* CallHierarchyDirection.CallsFrom */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = CallHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.showIncomingCalls();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showOutgoingCalls',
                title: { value: (0, nls_1.localize)('title.outgoing', "Show Outgoing Calls"), original: 'Show Outgoing Calls' },
                icon: (0, iconRegistry_1.registerIcon)('callhierarchy-outgoing', codicons_1.Codicon.callOutgoing, (0, nls_1.localize)('showOutgoingCallsIcon', 'Icon for outgoing calls in the call hierarchy view.')),
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, _ctxCallHierarchyDirection.isEqualTo("incomingCalls" /* CallHierarchyDirection.CallsTo */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: callHierarchyPeek_1.CallHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxCallHierarchyDirection.isEqualTo("incomingCalls" /* CallHierarchyDirection.CallsTo */),
                    order: 1
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = CallHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.showOutgoingCalls();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.refocusCallHierarchy',
                title: { value: (0, nls_1.localize)('title.refocus', "Refocus Call Hierarchy"), original: 'Refocus Call Hierarchy' },
                precondition: _ctxCallHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */
                }
            });
        }
        async runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = CallHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.startCallHierarchyFromCallHierarchy();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeCallHierarchy',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                    primary: 9 /* KeyCode.Escape */
                },
                menu: {
                    id: callHierarchyPeek_1.CallHierarchyTreePeekWidget.TitleMenu,
                    order: 1000
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = CallHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.endCallHierarchy();
        }
    });
});
//# sourceMappingURL=callHierarchy.contribution.js.map