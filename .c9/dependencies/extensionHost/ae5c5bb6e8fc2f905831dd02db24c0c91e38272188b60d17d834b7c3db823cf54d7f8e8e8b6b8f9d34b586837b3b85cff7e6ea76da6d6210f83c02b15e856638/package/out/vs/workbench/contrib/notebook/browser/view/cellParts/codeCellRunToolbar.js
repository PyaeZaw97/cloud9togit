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
define(["require", "exports", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkeys", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/view/cellParts/stickyScroll", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, toolbar_1, actions_1, lifecycle_1, editorContextKeys_1, nls_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, actions_2, contextkeys_1, contextView_1, instantiation_1, keybinding_1, cellPart_1, stickyScroll_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCodeCellExecutionContextKeyService = exports.RunToolbar = void 0;
    let RunToolbar = class RunToolbar extends cellPart_1.CellPart {
        constructor(notebookEditor, contextKeyService, cellContainer, runButtonContainer, menuService, keybindingService, contextMenuService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.contextKeyService = contextKeyService;
            this.cellContainer = cellContainer;
            this.runButtonContainer = runButtonContainer;
            this.menuService = menuService;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            const menu = this._register(menuService.createMenu(this.notebookEditor.creationOptions.menuIds.cellExecutePrimary, contextKeyService));
            this.createRunCellToolbar(runButtonContainer, cellContainer, contextKeyService);
            const updateActions = () => {
                const actions = this.getCellToolbarActions(menu);
                const primary = actions.primary[0]; // Only allow one primary action
                this.toolbar.setActions(primary ? [primary] : []);
            };
            updateActions();
            this._register(menu.onDidChange(updateActions));
            this._register(this.notebookEditor.notebookOptions.onDidChangeOptions(updateActions));
        }
        didRenderCell(element) {
            this.cellDisposables.add((0, stickyScroll_1.registerStickyScroll)(this.notebookEditor, element, this.runButtonContainer));
            this.toolbar.context = {
                ui: true,
                cell: element,
                notebookEditor: this.notebookEditor,
                $mid: 12 /* MarshalledId.NotebookCellActionContext */
            };
        }
        getCellToolbarActions(menu) {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
            return result;
        }
        createRunCellToolbar(container, cellContainer, contextKeyService) {
            const actionViewItemDisposables = this._register(new lifecycle_1.DisposableStore());
            const dropdownAction = this._register(new actions_1.Action('notebook.moreRunActions', (0, nls_1.localize)('notebook.moreRunActionsLabel', "More..."), 'codicon-chevron-down', true));
            const keybindingProvider = (action) => this.keybindingService.lookupKeybinding(action.id, executionContextKeyService);
            const executionContextKeyService = this._register(getCodeCellExecutionContextKeyService(contextKeyService));
            this.toolbar = this._register(new toolbar_1.ToolBar(container, this.contextMenuService, {
                getKeyBinding: keybindingProvider,
                actionViewItemProvider: _action => {
                    actionViewItemDisposables.clear();
                    const primaryMenu = actionViewItemDisposables.add(this.menuService.createMenu(this.notebookEditor.creationOptions.menuIds.cellExecutePrimary, contextKeyService));
                    const primary = this.getCellToolbarActions(primaryMenu).primary[0];
                    if (!(primary instanceof actions_2.MenuItemAction)) {
                        return undefined;
                    }
                    const menu = actionViewItemDisposables.add(this.menuService.createMenu(this.notebookEditor.creationOptions.menuIds.cellExecuteToolbar, contextKeyService));
                    const secondary = this.getCellToolbarActions(menu).secondary;
                    if (!secondary.length) {
                        return undefined;
                    }
                    const item = this.instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, primary, dropdownAction, secondary, 'notebook-cell-run-toolbar', this.contextMenuService, {
                        getKeyBinding: keybindingProvider
                    });
                    actionViewItemDisposables.add(item.onDidChangeDropdownVisibility(visible => {
                        cellContainer.classList.toggle('cell-run-toolbar-dropdown-active', visible);
                    }));
                    return item;
                },
                renderDropdownAsChildElement: true
            }));
        }
    };
    RunToolbar = __decorate([
        __param(4, actions_2.IMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, instantiation_1.IInstantiationService)
    ], RunToolbar);
    exports.RunToolbar = RunToolbar;
    function getCodeCellExecutionContextKeyService(contextKeyService) {
        // Create a fake ContextKeyService, and look up the keybindings within this context.
        const executionContextKeyService = contextKeyService.createScoped(document.createElement('div'));
        contextkeys_1.InputFocusedContext.bindTo(executionContextKeyService).set(true);
        editorContextKeys_1.EditorContextKeys.editorTextFocus.bindTo(executionContextKeyService).set(true);
        editorContextKeys_1.EditorContextKeys.focus.bindTo(executionContextKeyService).set(true);
        editorContextKeys_1.EditorContextKeys.textInputFocus.bindTo(executionContextKeyService).set(true);
        notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.bindTo(executionContextKeyService).set('idle');
        notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED.bindTo(executionContextKeyService).set(true);
        notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.bindTo(executionContextKeyService).set(true);
        notebookContextKeys_1.NOTEBOOK_CELL_TYPE.bindTo(executionContextKeyService).set('code');
        return executionContextKeyService;
    }
    exports.getCodeCellExecutionContextKeyService = getCodeCellExecutionContextKeyService;
});
//# sourceMappingURL=codeCellRunToolbar.js.map