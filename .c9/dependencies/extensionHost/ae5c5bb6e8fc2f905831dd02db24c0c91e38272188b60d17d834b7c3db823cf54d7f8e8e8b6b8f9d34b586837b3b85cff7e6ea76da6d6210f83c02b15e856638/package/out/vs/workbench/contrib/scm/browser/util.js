/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/arrays", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/dom"], function (require, exports, lifecycle_1, actions_1, menuEntryActionViewItem_1, arrays_1, actionViewItems_1, iconLabels_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActionViewItemProvider = exports.StatusBarAction = exports.collectContextMenuActions = exports.connectPrimaryMenuToInlineActionBar = exports.connectPrimaryMenu = exports.isSCMResource = exports.isSCMResourceGroup = exports.isSCMActionButton = exports.isSCMInput = exports.isSCMRepository = void 0;
    function isSCMRepository(element) {
        return !!element.provider && !!element.input;
    }
    exports.isSCMRepository = isSCMRepository;
    function isSCMInput(element) {
        return !!element.validateInput && typeof element.value === 'string';
    }
    exports.isSCMInput = isSCMInput;
    function isSCMActionButton(element) {
        return element.type === 'actionButton';
    }
    exports.isSCMActionButton = isSCMActionButton;
    function isSCMResourceGroup(element) {
        return !!element.provider && !!element.elements;
    }
    exports.isSCMResourceGroup = isSCMResourceGroup;
    function isSCMResource(element) {
        return !!element.sourceUri && isSCMResourceGroup(element.resourceGroup);
    }
    exports.isSCMResource = isSCMResource;
    const compareActions = (a, b) => a.id === b.id;
    function connectPrimaryMenu(menu, callback, primaryGroup) {
        let cachedDisposable = lifecycle_1.Disposable.None;
        let cachedPrimary = [];
        let cachedSecondary = [];
        const updateActions = () => {
            const primary = [];
            const secondary = [];
            const disposable = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, { primary, secondary }, primaryGroup);
            if ((0, arrays_1.equals)(cachedPrimary, primary, compareActions) && (0, arrays_1.equals)(cachedSecondary, secondary, compareActions)) {
                disposable.dispose();
                return;
            }
            cachedDisposable = disposable;
            cachedPrimary = primary;
            cachedSecondary = secondary;
            callback(primary, secondary);
        };
        updateActions();
        return (0, lifecycle_1.combinedDisposable)(menu.onDidChange(updateActions), (0, lifecycle_1.toDisposable)(() => cachedDisposable.dispose()));
    }
    exports.connectPrimaryMenu = connectPrimaryMenu;
    function connectPrimaryMenuToInlineActionBar(menu, actionBar) {
        return connectPrimaryMenu(menu, (primary) => {
            actionBar.clear();
            actionBar.push(primary, { icon: true, label: false });
        }, 'inline');
    }
    exports.connectPrimaryMenuToInlineActionBar = connectPrimaryMenuToInlineActionBar;
    function collectContextMenuActions(menu) {
        const primary = [];
        const actions = [];
        const disposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, { primary, secondary: actions }, 'inline');
        return [actions, disposable];
    }
    exports.collectContextMenuActions = collectContextMenuActions;
    class StatusBarAction extends actions_1.Action {
        constructor(command, commandService) {
            super(`statusbaraction{${command.id}}`, command.title, '', true);
            this.command = command;
            this.commandService = commandService;
            this.tooltip = command.tooltip || '';
        }
        run() {
            return this.commandService.executeCommand(this.command.id, ...(this.command.arguments || []));
        }
    }
    exports.StatusBarAction = StatusBarAction;
    class StatusBarActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action) {
            super(null, action, {});
        }
        updateLabel() {
            if (this.options.label && this.label) {
                (0, dom_1.reset)(this.label, ...(0, iconLabels_1.renderLabelWithIcons)(this.getAction().label));
            }
        }
    }
    function getActionViewItemProvider(instaService) {
        return action => {
            if (action instanceof StatusBarAction) {
                return new StatusBarActionViewItem(action);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(instaService, action);
        };
    }
    exports.getActionViewItemProvider = getActionViewItemProvider;
});
//# sourceMappingURL=util.js.map