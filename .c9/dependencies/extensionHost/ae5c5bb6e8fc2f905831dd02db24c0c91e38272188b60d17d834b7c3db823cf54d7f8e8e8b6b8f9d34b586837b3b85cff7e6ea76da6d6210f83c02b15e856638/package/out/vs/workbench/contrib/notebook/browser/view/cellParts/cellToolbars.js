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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/view/cellParts/stickyScroll"], function (require, exports, DOM, toolbar_1, async_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, editActions_1, cellActionView_1, cellPart_1, stickyScroll_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellTitleToolbarPart = exports.BetweenCellToolbar = void 0;
    let BetweenCellToolbar = class BetweenCellToolbar extends cellPart_1.CellPart {
        constructor(_notebookEditor, _titleToolbarContainer, _bottomCellToolbarContainer, instantiationService, contextMenuService, contextKeyService, menuService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._bottomCellToolbarContainer = _bottomCellToolbarContainer;
            this._betweenCellToolbar = this._register(new toolbar_1.ToolBar(this._bottomCellToolbarContainer, contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        if (this._notebookEditor.notebookOptions.getLayoutConfiguration().insertToolbarAlignment === 'center') {
                            return instantiationService.createInstance(cellActionView_1.CodiconActionViewItem, action);
                        }
                        else {
                            return instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, undefined);
                        }
                    }
                    return undefined;
                }
            }));
            const menu = this._register(menuService.createMenu(this._notebookEditor.creationOptions.menuIds.cellInsertToolbar, contextKeyService));
            const updateActions = () => {
                const actions = getCellToolbarActions(menu);
                this._betweenCellToolbar.setActions(actions.primary, actions.secondary);
            };
            this._register(menu.onDidChange(() => updateActions()));
            this._register(this._notebookEditor.notebookOptions.onDidChangeOptions((e) => {
                if (e.insertToolbarAlignment) {
                    updateActions();
                }
            }));
            updateActions();
        }
        updateContext(context) {
            this._betweenCellToolbar.context = context;
        }
        didRenderCell(element) {
            this._betweenCellToolbar.context = {
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                $mid: 12 /* MarshalledId.NotebookCellActionContext */
            };
        }
        updateInternalLayoutNow(element) {
            const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
            this._bottomCellToolbarContainer.style.transform = `translateY(${bottomToolbarOffset}px)`;
        }
    };
    BetweenCellToolbar = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService)
    ], BetweenCellToolbar);
    exports.BetweenCellToolbar = BetweenCellToolbar;
    let CellTitleToolbarPart = class CellTitleToolbarPart extends cellPart_1.CellPart {
        constructor(toolbarContainer, _rootClassDelegate, toolbarId, _notebookEditor, contextKeyService, menuService, instantiationService) {
            super();
            this.toolbarContainer = toolbarContainer;
            this._rootClassDelegate = _rootClassDelegate;
            this._notebookEditor = _notebookEditor;
            this._actionsDisposables = this._register(new lifecycle_1.DisposableStore());
            this._hasActions = false;
            this._onDidUpdateActions = this._register(new event_1.Emitter());
            this.onDidUpdateActions = this._onDidUpdateActions.event;
            this._toolbar = instantiationService.invokeFunction(accessor => createToolbar(accessor, toolbarContainer));
            this._titleMenu = this._register(menuService.createMenu(toolbarId, contextKeyService));
            this._deleteToolbar = this._register(instantiationService.invokeFunction(accessor => createToolbar(accessor, toolbarContainer, 'cell-delete-toolbar')));
            if (!this._notebookEditor.creationOptions.isReadOnly) {
                this._deleteToolbar.setActions([instantiationService.createInstance(editActions_1.DeleteCellAction)]);
            }
            this.setupChangeListeners();
        }
        get hasActions() {
            return this._hasActions;
        }
        didRenderCell(element) {
            this.cellDisposables.add((0, stickyScroll_1.registerStickyScroll)(this._notebookEditor, element, this.toolbarContainer, { extraOffset: 4, min: -14 }));
            this.updateContext({
                ui: true,
                cell: element,
                notebookEditor: this._notebookEditor,
                $mid: 12 /* MarshalledId.NotebookCellActionContext */
            });
        }
        updateContext(toolbarContext) {
            this._toolbar.context = toolbarContext;
            this._deleteToolbar.context = toolbarContext;
        }
        setupChangeListeners() {
            // #103926
            let dropdownIsVisible = false;
            let deferredUpdate;
            this.updateActions();
            this._register(this._titleMenu.onDidChange(() => {
                if (dropdownIsVisible) {
                    deferredUpdate = () => this.updateActions();
                    return;
                }
                this.updateActions();
            }));
            this._rootClassDelegate.toggle('cell-toolbar-dropdown-active', false);
            this._register(this._toolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                this._rootClassDelegate.toggle('cell-toolbar-dropdown-active', visible);
                if (deferredUpdate && !visible) {
                    this._register((0, async_1.disposableTimeout)(() => {
                        if (deferredUpdate) {
                            deferredUpdate();
                        }
                    }));
                    deferredUpdate = undefined;
                }
            }));
        }
        updateActions() {
            this._actionsDisposables.clear();
            const actions = getCellToolbarActions(this._titleMenu);
            this._actionsDisposables.add(actions.disposable);
            const hadFocus = DOM.isAncestor(document.activeElement, this._toolbar.getElement());
            this._toolbar.setActions(actions.primary, actions.secondary);
            if (hadFocus) {
                this._notebookEditor.focus();
            }
            if (actions.primary.length || actions.secondary.length) {
                this._rootClassDelegate.toggle('cell-has-toolbar-actions', true);
                this._hasActions = true;
                this._onDidUpdateActions.fire();
            }
            else {
                this._rootClassDelegate.toggle('cell-has-toolbar-actions', false);
                this._hasActions = false;
                this._onDidUpdateActions.fire();
            }
        }
    };
    CellTitleToolbarPart = __decorate([
        __param(4, contextkey_1.IContextKeyService),
        __param(5, actions_1.IMenuService),
        __param(6, instantiation_1.IInstantiationService)
    ], CellTitleToolbarPart);
    exports.CellTitleToolbarPart = CellTitleToolbarPart;
    function getCellToolbarActions(menu) {
        const primary = [];
        const secondary = [];
        const result = { primary, secondary };
        const disposable = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
        return Object.assign(Object.assign({}, result), { disposable });
    }
    function createToolbar(accessor, container, elementClass) {
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const toolbar = new toolbar_1.ToolBar(container, contextMenuService, {
            getKeyBinding: action => keybindingService.lookupKeybinding(action.id),
            actionViewItemProvider: action => {
                return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action);
            },
            renderDropdownAsChildElement: true
        });
        if (elementClass) {
            toolbar.getElement().classList.add(elementClass);
        }
        return toolbar;
    }
});
//# sourceMappingURL=cellToolbars.js.map