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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/storage/common/storage", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/base/common/codicons", "vs/platform/actions/common/actions", "./outlineViewState", "vs/workbench/services/outline/browser/outline", "vs/workbench/common/editor", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/browser/ui/tree/abstractTree", "vs/css!./outlinePane"], function (require, exports, dom, progressbar_1, async_1, lifecycle_1, map_1, nls_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, listService_1, storage_1, styler_1, themeService_1, viewPane_1, editorService_1, resources_1, views_1, opener_1, telemetry_1, codicons_1, actions_1, outlineViewState_1, outline_1, editor_1, cancellation_1, event_1, abstractTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlinePane = void 0;
    const _ctxFollowsCursor = new contextkey_1.RawContextKey('outlineFollowsCursor', false);
    const _ctxFilterOnType = new contextkey_1.RawContextKey('outlineFiltersOnType', false);
    const _ctxSortMode = new contextkey_1.RawContextKey('outlineSortMode', 0 /* OutlineSortOrder.ByPosition */);
    class OutlineTreeSorter {
        constructor(_comparator, order) {
            this._comparator = _comparator;
            this.order = order;
        }
        compare(a, b) {
            if (this.order === 2 /* OutlineSortOrder.ByKind */) {
                return this._comparator.compareByType(a, b);
            }
            else if (this.order === 1 /* OutlineSortOrder.ByName */) {
                return this._comparator.compareByName(a, b);
            }
            else {
                return this._comparator.compareByPosition(a, b);
            }
        }
    }
    let OutlinePane = class OutlinePane extends viewPane_1.ViewPane {
        constructor(options, _outlineService, _instantiationService, viewDescriptorService, _themeService, _storageService, _editorService, configurationService, keybindingService, contextKeyService, contextMenuService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, _instantiationService, openerService, themeService, telemetryService);
            this._outlineService = _outlineService;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._editorControlDisposables = new lifecycle_1.DisposableStore();
            this._editorPaneDisposables = new lifecycle_1.DisposableStore();
            this._outlineViewState = new outlineViewState_1.OutlineViewState();
            this._editorListener = new lifecycle_1.MutableDisposable();
            this._treeStates = new map_1.LRUCache(10);
            this._outlineViewState.restore(this._storageService);
            this._disposables.add(this._outlineViewState);
            contextKeyService.bufferChangeEvents(() => {
                this._ctxFollowsCursor = _ctxFollowsCursor.bindTo(contextKeyService);
                this._ctxFilterOnType = _ctxFilterOnType.bindTo(contextKeyService);
                this._ctxSortMode = _ctxSortMode.bindTo(contextKeyService);
            });
            const updateContext = () => {
                this._ctxFollowsCursor.set(this._outlineViewState.followCursor);
                this._ctxFilterOnType.set(this._outlineViewState.filterOnType);
                this._ctxSortMode.set(this._outlineViewState.sortBy);
            };
            updateContext();
            this._disposables.add(this._outlineViewState.onDidChange(updateContext));
        }
        dispose() {
            this._disposables.dispose();
            this._editorPaneDisposables.dispose();
            this._editorControlDisposables.dispose();
            this._editorListener.dispose();
            super.dispose();
        }
        focus() {
            var _a;
            (_a = this._tree) === null || _a === void 0 ? void 0 : _a.domFocus();
        }
        renderBody(container) {
            super.renderBody(container);
            this._domNode = container;
            container.classList.add('outline-pane');
            let progressContainer = dom.$('.outline-progress');
            this._message = dom.$('.outline-message');
            this._progressBar = new progressbar_1.ProgressBar(progressContainer);
            this._disposables.add((0, styler_1.attachProgressBarStyler)(this._progressBar, this._themeService));
            this._treeContainer = dom.$('.outline-tree');
            dom.append(container, progressContainer, this._message, this._treeContainer);
            this._disposables.add(this.onDidChangeBodyVisibility(visible => {
                if (!visible) {
                    // stop everything when not visible
                    this._editorListener.clear();
                    this._editorPaneDisposables.clear();
                    this._editorControlDisposables.clear();
                }
                else if (!this._editorListener.value) {
                    const event = event_1.Event.any(this._editorService.onDidActiveEditorChange, this._outlineService.onDidChange);
                    this._editorListener.value = event(() => this._handleEditorChanged(this._editorService.activeEditorPane));
                    this._handleEditorChanged(this._editorService.activeEditorPane);
                }
            }));
        }
        layoutBody(height, width) {
            var _a;
            super.layoutBody(height, width);
            (_a = this._tree) === null || _a === void 0 ? void 0 : _a.layout(height, width);
            this._treeDimensions = new dom.Dimension(width, height);
        }
        collapseAll() {
            var _a;
            (_a = this._tree) === null || _a === void 0 ? void 0 : _a.collapseAll();
        }
        get outlineViewState() {
            return this._outlineViewState;
        }
        _showMessage(message) {
            this._domNode.classList.add('message');
            this._progressBar.stop().hide();
            this._message.innerText = message;
        }
        _captureViewState() {
            if (this._tree) {
                const oldOutline = this._tree.getInput();
                if (oldOutline && oldOutline.uri) {
                    this._treeStates.set(`${oldOutline.outlineKind}/${oldOutline.uri}`, this._tree.getViewState());
                    return true;
                }
            }
            return false;
        }
        _handleEditorChanged(pane) {
            this._editorPaneDisposables.clear();
            if (pane) {
                // react to control changes from within pane (https://github.com/microsoft/vscode/issues/134008)
                this._editorPaneDisposables.add(pane.onDidChangeControl(() => {
                    this._handleEditorControlChanged(pane);
                }));
            }
            this._handleEditorControlChanged(pane);
        }
        async _handleEditorControlChanged(pane) {
            var _a, _b;
            // persist state
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(pane === null || pane === void 0 ? void 0 : pane.input);
            const didCapture = this._captureViewState();
            this._editorControlDisposables.clear();
            if (!pane || !this._outlineService.canCreateOutline(pane) || !resource) {
                return this._showMessage((0, nls_1.localize)('no-editor', "The active editor cannot provide outline information."));
            }
            let loadingMessage;
            if (!didCapture) {
                loadingMessage = new async_1.TimeoutTimer(() => {
                    this._showMessage((0, nls_1.localize)('loading', "Loading document symbols for '{0}'...", (0, resources_1.basename)(resource)));
                }, 100);
            }
            this._progressBar.infinite().show(500);
            const cts = new cancellation_1.CancellationTokenSource();
            this._editorControlDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            const newOutline = await this._outlineService.createOutline(pane, 1 /* OutlineTarget.OutlinePane */, cts.token);
            loadingMessage === null || loadingMessage === void 0 ? void 0 : loadingMessage.dispose();
            if (!newOutline) {
                return;
            }
            if (cts.token.isCancellationRequested) {
                newOutline === null || newOutline === void 0 ? void 0 : newOutline.dispose();
                return;
            }
            this._editorControlDisposables.add(newOutline);
            this._progressBar.stop().hide();
            const sorter = new OutlineTreeSorter(newOutline.config.comparator, this._outlineViewState.sortBy);
            const tree = this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'OutlinePane', this._treeContainer, newOutline.config.delegate, newOutline.config.renderers, newOutline.config.treeDataSource, Object.assign(Object.assign({}, newOutline.config.options), { sorter, expandOnDoubleClick: false, expandOnlyOnTwistieClick: true, multipleSelectionSupport: false, hideTwistiesOfChildlessElements: true, filterOnType: this._outlineViewState.filterOnType, overrideStyles: { listBackground: this.getBackgroundColor() } }));
            // update tree, listen to changes
            const updateTree = () => {
                if (newOutline.isEmpty) {
                    // no more elements
                    this._showMessage((0, nls_1.localize)('no-symbols', "No symbols found in document '{0}'", (0, resources_1.basename)(resource)));
                    this._captureViewState();
                    tree.setInput(undefined);
                }
                else if (!tree.getInput()) {
                    // first: init tree
                    this._domNode.classList.remove('message');
                    const state = this._treeStates.get(`${newOutline.outlineKind}/${resource}`);
                    tree.setInput(newOutline, state && abstractTree_1.AbstractTreeViewState.lift(state));
                }
                else {
                    // update: refresh tree
                    this._domNode.classList.remove('message');
                    tree.updateChildren();
                }
            };
            updateTree();
            this._editorControlDisposables.add(newOutline.onDidChange(updateTree));
            // feature: apply panel background to tree
            this._editorControlDisposables.add(this.viewDescriptorService.onDidChangeLocation(({ views }) => {
                if (views.some(v => v.id === this.id)) {
                    tree.updateOptions({ overrideStyles: { listBackground: this.getBackgroundColor() } });
                }
            }));
            // feature: filter on type - keep tree and menu in sync
            this._editorControlDisposables.add(tree.onDidUpdateOptions(e => this._outlineViewState.filterOnType = Boolean(e.filterOnType)));
            // feature: reveal outline selection in editor
            // on change -> reveal/select defining range
            this._editorControlDisposables.add(tree.onDidOpen(e => newOutline.reveal(e.element, e.editorOptions, e.sideBySide)));
            // feature: reveal editor selection in outline
            const revealActiveElement = () => {
                if (!this._outlineViewState.followCursor || !newOutline.activeElement) {
                    return;
                }
                let item = newOutline.activeElement;
                while (item) {
                    const top = tree.getRelativeTop(item);
                    if (top === null) {
                        // not visible -> reveal
                        tree.reveal(item, 0.5);
                    }
                    if (tree.getRelativeTop(item) !== null) {
                        tree.setFocus([item]);
                        tree.setSelection([item]);
                        break;
                    }
                    // STILL not visible -> try parent
                    item = tree.getParentElement(item);
                }
            };
            revealActiveElement();
            this._editorControlDisposables.add(newOutline.onDidChange(revealActiveElement));
            // feature: update view when user state changes
            this._editorControlDisposables.add(this._outlineViewState.onDidChange((e) => {
                this._outlineViewState.persist(this._storageService);
                if (e.filterOnType) {
                    tree.updateOptions({ filterOnType: this._outlineViewState.filterOnType });
                }
                if (e.followCursor) {
                    revealActiveElement();
                }
                if (e.sortBy) {
                    sorter.order = this._outlineViewState.sortBy;
                    tree.resort();
                }
            }));
            // feature: expand all nodes when filtering (not when finding)
            let viewState;
            this._editorControlDisposables.add(tree.onDidChangeTypeFilterPattern(pattern => {
                if (!tree.options.filterOnType) {
                    return;
                }
                if (!viewState && pattern) {
                    viewState = tree.getViewState();
                    tree.expandAll();
                }
                else if (!pattern && viewState) {
                    tree.setInput(tree.getInput(), viewState);
                    viewState = undefined;
                }
            }));
            // last: set tree property
            tree.layout((_a = this._treeDimensions) === null || _a === void 0 ? void 0 : _a.height, (_b = this._treeDimensions) === null || _b === void 0 ? void 0 : _b.width);
            this._tree = tree;
            this._editorControlDisposables.add((0, lifecycle_1.toDisposable)(() => {
                tree.dispose();
                this._tree = undefined;
            }));
        }
    };
    OutlinePane.Id = 'outline';
    OutlinePane = __decorate([
        __param(1, outline_1.IOutlineService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, editorService_1.IEditorService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, opener_1.IOpenerService),
        __param(12, themeService_1.IThemeService),
        __param(13, telemetry_1.ITelemetryService)
    ], OutlinePane);
    exports.OutlinePane = OutlinePane;
    // --- commands
    (0, actions_1.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: OutlinePane.Id,
                id: 'outline.collapse',
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
    (0, actions_1.registerAction2)(class FollowCursor extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: OutlinePane.Id,
                id: 'outline.followCursor',
                title: (0, nls_1.localize)('followCur', "Follow Cursor"),
                f1: false,
                toggled: _ctxFollowsCursor,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'config',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.equals('view', OutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.followCursor = !view.outlineViewState.followCursor;
        }
    });
    (0, actions_1.registerAction2)(class FilterOnType extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: OutlinePane.Id,
                id: 'outline.filterOnType',
                title: (0, nls_1.localize)('filterOnType', "Filter on Type"),
                f1: false,
                toggled: _ctxFilterOnType,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'config',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.equals('view', OutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.filterOnType = !view.outlineViewState.filterOnType;
        }
    });
    (0, actions_1.registerAction2)(class SortByPosition extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: OutlinePane.Id,
                id: 'outline.sortByPosition',
                title: (0, nls_1.localize)('sortByPosition', "Sort By: Position"),
                f1: false,
                toggled: _ctxSortMode.isEqualTo(0 /* OutlineSortOrder.ByPosition */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'sort',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.equals('view', OutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.sortBy = 0 /* OutlineSortOrder.ByPosition */;
        }
    });
    (0, actions_1.registerAction2)(class SortByName extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: OutlinePane.Id,
                id: 'outline.sortByName',
                title: (0, nls_1.localize)('sortByName', "Sort By: Name"),
                f1: false,
                toggled: _ctxSortMode.isEqualTo(1 /* OutlineSortOrder.ByName */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'sort',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.equals('view', OutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.sortBy = 1 /* OutlineSortOrder.ByName */;
        }
    });
    (0, actions_1.registerAction2)(class SortByKind extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: OutlinePane.Id,
                id: 'outline.sortByKind',
                title: (0, nls_1.localize)('sortByKind', "Sort By: Category"),
                f1: false,
                toggled: _ctxSortMode.isEqualTo(2 /* OutlineSortOrder.ByKind */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'sort',
                    order: 3,
                    when: contextkey_1.ContextKeyExpr.equals('view', OutlinePane.Id)
                }
            });
        }
        runInView(_accessor, view) {
            view.outlineViewState.sortBy = 2 /* OutlineSortOrder.ByKind */;
        }
    });
});
//# sourceMappingURL=outlinePane.js.map