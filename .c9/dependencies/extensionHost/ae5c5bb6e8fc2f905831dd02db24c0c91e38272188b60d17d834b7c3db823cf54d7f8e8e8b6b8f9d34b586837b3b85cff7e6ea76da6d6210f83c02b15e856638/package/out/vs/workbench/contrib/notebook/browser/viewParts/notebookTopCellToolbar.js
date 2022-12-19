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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView"], function (require, exports, DOM, toolbar_1, lifecycle_1, menuEntryActionViewItem_1, actions_1, contextView_1, instantiation_1, cellActionView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListTopCellToolbar = void 0;
    let ListTopCellToolbar = class ListTopCellToolbar extends lifecycle_1.Disposable {
        constructor(notebookEditor, contextKeyService, insertionIndicatorContainer, instantiationService, contextMenuService, menuService) {
            super();
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this._modelDisposables = this._register(new lifecycle_1.DisposableStore());
            this.topCellToolbar = DOM.append(insertionIndicatorContainer, DOM.$('.cell-list-top-cell-toolbar-container'));
            this.toolbar = this._register(new toolbar_1.ToolBar(this.topCellToolbar, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = this.instantiationService.createInstance(cellActionView_1.CodiconActionViewItem, action);
                        return item;
                    }
                    return undefined;
                }
            }));
            this.toolbar.context = {
                notebookEditor
            };
            this.menu = this._register(this.menuService.createMenu(this.notebookEditor.creationOptions.menuIds.cellTopInsertToolbar, contextKeyService));
            this._register(this.menu.onDidChange(() => {
                this.updateActions();
            }));
            this.updateActions();
            // update toolbar container css based on cell list length
            this._register(this.notebookEditor.onDidChangeModel(() => {
                this._modelDisposables.clear();
                if (this.notebookEditor.hasModel()) {
                    this._modelDisposables.add(this.notebookEditor.onDidChangeViewCells(() => {
                        this.updateClass();
                    }));
                    this.updateClass();
                }
            }));
            this.updateClass();
        }
        updateActions() {
            const actions = this.getCellToolbarActions(this.menu, false);
            this.toolbar.setActions(actions.primary, actions.secondary);
        }
        updateClass() {
            if (this.notebookEditor.hasModel() && this.notebookEditor.getLength() === 0) {
                this.topCellToolbar.classList.add('emptyNotebook');
            }
            else {
                this.topCellToolbar.classList.remove('emptyNotebook');
            }
        }
        getCellToolbarActions(menu, alwaysFillSecondaryActions) {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
            return result;
        }
    };
    ListTopCellToolbar = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, actions_1.IMenuService)
    ], ListTopCellToolbar);
    exports.ListTopCellToolbar = ListTopCellToolbar;
});
//# sourceMappingURL=notebookTopCellToolbar.js.map