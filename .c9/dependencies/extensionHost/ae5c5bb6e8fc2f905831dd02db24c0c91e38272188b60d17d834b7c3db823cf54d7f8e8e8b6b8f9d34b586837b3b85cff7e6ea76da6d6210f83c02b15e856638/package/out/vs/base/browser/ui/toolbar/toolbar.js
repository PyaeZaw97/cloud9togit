/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/css!./toolbar"], function (require, exports, actionbar_1, dropdownActionViewItem_1, actions_1, codicons_1, event_1, lifecycle_1, types_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMenuAction = exports.ToolBar = void 0;
    /**
     * A widget that combines an action bar for primary actions and a dropdown for secondary actions.
     */
    class ToolBar extends lifecycle_1.Disposable {
        constructor(container, contextMenuProvider, options = { orientation: 0 /* ActionsOrientation.HORIZONTAL */ }) {
            super();
            this.submenuActionViewItems = [];
            this.hasSecondaryActions = false;
            this._onDidChangeDropdownVisibility = this._register(new event_1.EventMultiplexer());
            this.onDidChangeDropdownVisibility = this._onDidChangeDropdownVisibility.event;
            this.disposables = new lifecycle_1.DisposableStore();
            this.options = options;
            this.lookupKeybindings = typeof this.options.getKeyBinding === 'function';
            this.toggleMenuAction = this._register(new ToggleMenuAction(() => { var _a; return (_a = this.toggleMenuActionViewItem) === null || _a === void 0 ? void 0 : _a.show(); }, options.toggleMenuTitle));
            this.element = document.createElement('div');
            this.element.className = 'monaco-toolbar';
            container.appendChild(this.element);
            this.actionBar = this._register(new actionbar_1.ActionBar(this.element, {
                orientation: options.orientation,
                ariaLabel: options.ariaLabel,
                actionRunner: options.actionRunner,
                allowContextMenu: options.allowContextMenu,
                actionViewItemProvider: (action) => {
                    var _a;
                    if (action.id === ToggleMenuAction.ID) {
                        this.toggleMenuActionViewItem = new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.menuActions, contextMenuProvider, {
                            actionViewItemProvider: this.options.actionViewItemProvider,
                            actionRunner: this.actionRunner,
                            keybindingProvider: this.options.getKeyBinding,
                            classNames: codicons_1.CSSIcon.asClassNameArray((_a = options.moreIcon) !== null && _a !== void 0 ? _a : codicons_1.Codicon.toolBarMore),
                            anchorAlignmentProvider: this.options.anchorAlignmentProvider,
                            menuAsChild: !!this.options.renderDropdownAsChildElement
                        });
                        this.toggleMenuActionViewItem.setActionContext(this.actionBar.context);
                        this.disposables.add(this._onDidChangeDropdownVisibility.add(this.toggleMenuActionViewItem.onDidChangeVisibility));
                        return this.toggleMenuActionViewItem;
                    }
                    if (options.actionViewItemProvider) {
                        const result = options.actionViewItemProvider(action);
                        if (result) {
                            return result;
                        }
                    }
                    if (action instanceof actions_1.SubmenuAction) {
                        const result = new dropdownActionViewItem_1.DropdownMenuActionViewItem(action, action.actions, contextMenuProvider, {
                            actionViewItemProvider: this.options.actionViewItemProvider,
                            actionRunner: this.actionRunner,
                            keybindingProvider: this.options.getKeyBinding,
                            classNames: action.class,
                            anchorAlignmentProvider: this.options.anchorAlignmentProvider,
                            menuAsChild: !!this.options.renderDropdownAsChildElement
                        });
                        result.setActionContext(this.actionBar.context);
                        this.submenuActionViewItems.push(result);
                        this.disposables.add(this._onDidChangeDropdownVisibility.add(result.onDidChangeVisibility));
                        return result;
                    }
                    return undefined;
                }
            }));
        }
        set actionRunner(actionRunner) {
            this.actionBar.actionRunner = actionRunner;
        }
        get actionRunner() {
            return this.actionBar.actionRunner;
        }
        set context(context) {
            this.actionBar.context = context;
            if (this.toggleMenuActionViewItem) {
                this.toggleMenuActionViewItem.setActionContext(context);
            }
            for (const actionViewItem of this.submenuActionViewItems) {
                actionViewItem.setActionContext(context);
            }
        }
        getElement() {
            return this.element;
        }
        getItemsWidth() {
            let itemsWidth = 0;
            for (let i = 0; i < this.actionBar.length(); i++) {
                itemsWidth += this.actionBar.getWidth(i);
            }
            return itemsWidth;
        }
        getItemAction(index) {
            return this.actionBar.getAction(index);
        }
        getItemWidth(index) {
            return this.actionBar.getWidth(index);
        }
        getItemsLength() {
            return this.actionBar.length();
        }
        setAriaLabel(label) {
            this.actionBar.setAriaLabel(label);
        }
        setActions(primaryActions, secondaryActions) {
            this.clear();
            let primaryActionsToSet = primaryActions ? primaryActions.slice(0) : [];
            // Inject additional action to open secondary actions if present
            this.hasSecondaryActions = !!(secondaryActions && secondaryActions.length > 0);
            if (this.hasSecondaryActions && secondaryActions) {
                this.toggleMenuAction.menuActions = secondaryActions.slice(0);
                primaryActionsToSet.push(this.toggleMenuAction);
            }
            primaryActionsToSet.forEach(action => {
                this.actionBar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) });
            });
        }
        getKeybindingLabel(action) {
            var _a, _b;
            const key = this.lookupKeybindings ? (_b = (_a = this.options).getKeyBinding) === null || _b === void 0 ? void 0 : _b.call(_a, action) : undefined;
            return (0, types_1.withNullAsUndefined)(key === null || key === void 0 ? void 0 : key.getLabel());
        }
        clear() {
            this.submenuActionViewItems = [];
            this.disposables.clear();
            this.actionBar.clear();
        }
        dispose() {
            this.clear();
            super.dispose();
        }
    }
    exports.ToolBar = ToolBar;
    class ToggleMenuAction extends actions_1.Action {
        constructor(toggleDropdownMenu, title) {
            title = title || nls.localize('moreActions', "More Actions...");
            super(ToggleMenuAction.ID, title, undefined, true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        async run() {
            this.toggleDropdownMenu();
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    exports.ToggleMenuAction = ToggleMenuAction;
    ToggleMenuAction.ID = 'toolbar.toggle.more';
});
//# sourceMappingURL=toolbar.js.map