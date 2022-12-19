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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/typeHierarchy/browser/typeHierarchyPeek", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy"], function (require, exports, cancellation_1, codicons_1, errors_1, event_1, lifecycle_1, editorExtensions_1, codeEditorService_1, range_1, peekView_1, nls_1, actions_1, contextkey_1, instantiation_1, storage_1, typeHierarchyPeek_1, typeHierarchy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasTypeHierarchyProvider = new contextkey_1.RawContextKey('editorHasTypeHierarchyProvider', false, (0, nls_1.localize)('editorHasTypeHierarchyProvider', 'Whether a type hierarchy provider is available'));
    const _ctxTypeHierarchyVisible = new contextkey_1.RawContextKey('typeHierarchyVisible', false, (0, nls_1.localize)('typeHierarchyVisible', 'Whether type hierarchy peek is currently showing'));
    const _ctxTypeHierarchyDirection = new contextkey_1.RawContextKey('typeHierarchyDirection', undefined, { type: 'string', description: (0, nls_1.localize)('typeHierarchyDirection', 'whether type hierarchy shows super types or subtypes') });
    function sanitizedDirection(candidate) {
        return candidate === "subtypes" /* TypeHierarchyDirection.Subtypes */ || candidate === "supertypes" /* TypeHierarchyDirection.Supertypes */
            ? candidate
            : "subtypes" /* TypeHierarchyDirection.Subtypes */;
    }
    let TypeHierarchyController = class TypeHierarchyController {
        constructor(_editor, _contextKeyService, _storageService, _editorService, _instantiationService) {
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._ctxHasProvider = _ctxHasTypeHierarchyProvider.bindTo(this._contextKeyService);
            this._ctxIsVisible = _ctxTypeHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxDirection = _ctxTypeHierarchyDirection.bindTo(this._contextKeyService);
            this._disposables.add(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, typeHierarchy_1.TypeHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && typeHierarchy_1.TypeHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._disposables.add(this._sessionDisposables);
        }
        static get(editor) {
            return editor.getContribution(TypeHierarchyController.Id);
        }
        dispose() {
            this._disposables.dispose();
        }
        // Peek
        async startTypeHierarchyFromEditor() {
            this._sessionDisposables.clear();
            if (!this._editor.hasModel()) {
                return;
            }
            const document = this._editor.getModel();
            const position = this._editor.getPosition();
            if (!typeHierarchy_1.TypeHierarchyProviderRegistry.has(document)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const model = typeHierarchy_1.TypeHierarchyModel.create(document, position, cts.token);
            const direction = sanitizedDirection(this._storageService.get(TypeHierarchyController._storageDirectionKey, 0 /* StorageScope.GLOBAL */, "subtypes" /* TypeHierarchyDirection.Subtypes */));
            this._showTypeHierarchyWidget(position, direction, model, cts);
        }
        _showTypeHierarchyWidget(position, direction, model, cts) {
            this._ctxIsVisible.set(true);
            this._ctxDirection.set(direction);
            event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endTypeHierarchy, this, this._sessionDisposables);
            this._widget = this._instantiationService.createInstance(typeHierarchyPeek_1.TypeHierarchyTreePeekWidget, this._editor, position, direction);
            this._widget.showLoading();
            this._sessionDisposables.add(this._widget.onDidClose(() => {
                this.endTypeHierarchy();
                this._storageService.store(TypeHierarchyController._storageDirectionKey, this._widget.direction, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
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
                    this.endTypeHierarchy();
                    return;
                }
                this._widget.showMessage((0, nls_1.localize)('error', "Failed to show type hierarchy"));
            });
        }
        async startTypeHierarchyFromTypeHierarchy() {
            var _a;
            if (!this._widget) {
                return;
            }
            const model = this._widget.getModel();
            const typeItem = this._widget.getFocused();
            if (!typeItem || !model) {
                return;
            }
            const newEditor = await this._editorService.openCodeEditor({ resource: typeItem.item.uri }, this._editor);
            if (!newEditor) {
                return;
            }
            const newModel = model.fork(typeItem.item);
            this._sessionDisposables.clear();
            (_a = TypeHierarchyController.get(newEditor)) === null || _a === void 0 ? void 0 : _a._showTypeHierarchyWidget(range_1.Range.lift(newModel.root.selectionRange).getStartPosition(), this._widget.direction, Promise.resolve(newModel), new cancellation_1.CancellationTokenSource());
        }
        showSupertypes() {
            var _a;
            (_a = this._widget) === null || _a === void 0 ? void 0 : _a.updateDirection("supertypes" /* TypeHierarchyDirection.Supertypes */);
            this._ctxDirection.set("supertypes" /* TypeHierarchyDirection.Supertypes */);
        }
        showSubtypes() {
            var _a;
            (_a = this._widget) === null || _a === void 0 ? void 0 : _a.updateDirection("subtypes" /* TypeHierarchyDirection.Subtypes */);
            this._ctxDirection.set("subtypes" /* TypeHierarchyDirection.Subtypes */);
        }
        endTypeHierarchy() {
            this._sessionDisposables.clear();
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    TypeHierarchyController.Id = 'typeHierarchy';
    TypeHierarchyController._storageDirectionKey = 'typeHierarchy/defaultDirection';
    TypeHierarchyController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], TypeHierarchyController);
    (0, editorExtensions_1.registerEditorContribution)(TypeHierarchyController.Id, TypeHierarchyController);
    // Peek
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showTypeHierarchy',
                title: { value: (0, nls_1.localize)('title', "Peek Type Hierarchy"), original: 'Peek Type Hierarchy' },
                menu: {
                    id: actions_1.MenuId.EditorContextPeek,
                    group: 'navigation',
                    order: 1000,
                    when: contextkey_1.ContextKeyExpr.and(_ctxHasTypeHierarchyProvider, peekView_1.PeekContext.notInPeekEditor),
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasTypeHierarchyProvider, peekView_1.PeekContext.notInPeekEditor)
            });
        }
        async runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = TypeHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.startTypeHierarchyFromEditor();
        }
    });
    // actions for peek widget
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showSupertypes',
                title: { value: (0, nls_1.localize)('title.supertypes', "Show Supertypes"), original: 'Show Supertypes' },
                icon: codicons_1.Codicon.typeHierarchySuper,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, _ctxTypeHierarchyDirection.isEqualTo("subtypes" /* TypeHierarchyDirection.Subtypes */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxTypeHierarchyDirection.isEqualTo("subtypes" /* TypeHierarchyDirection.Subtypes */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = TypeHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.showSupertypes();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.showSubtypes',
                title: { value: (0, nls_1.localize)('title.subtypes', "Show Subtypes"), original: 'Show Subtypes' },
                icon: codicons_1.Codicon.typeHierarchySub,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, _ctxTypeHierarchyDirection.isEqualTo("supertypes" /* TypeHierarchyDirection.Supertypes */)),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 512 /* KeyMod.Alt */ + 38 /* KeyCode.KeyH */,
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    when: _ctxTypeHierarchyDirection.isEqualTo("supertypes" /* TypeHierarchyDirection.Supertypes */),
                    order: 1,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = TypeHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.showSubtypes();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.refocusTypeHierarchy',
                title: { value: (0, nls_1.localize)('title.refocusTypeHierarchy', "Refocus Type Hierarchy"), original: 'Refocus Type Hierarchy' },
                precondition: _ctxTypeHierarchyVisible,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */
                }
            });
        }
        async runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = TypeHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.startTypeHierarchyFromTypeHierarchy();
        }
    });
    (0, actions_1.registerAction2)(class extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeTypeHierarchy',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: contextkey_1.ContextKeyExpr.and(_ctxTypeHierarchyVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                    primary: 9 /* KeyCode.Escape */
                },
                menu: {
                    id: typeHierarchyPeek_1.TypeHierarchyTreePeekWidget.TitleMenu,
                    order: 1000
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            var _a;
            return (_a = TypeHierarchyController.get(editor)) === null || _a === void 0 ? void 0 : _a.endTypeHierarchy();
        }
    });
});
//# sourceMappingURL=typeHierarchy.contribution.js.map