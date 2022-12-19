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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/keybindingLabels", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/css!./menuEntryActionViewItem"], function (require, exports, dom_1, keyboardEvent_1, actionViewItems_1, dropdownActionViewItem_1, actions_1, keybindingLabels_1, lifecycle_1, platform_1, nls_1, actions_2, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, storage_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createActionViewItem = exports.SubmenuEntryActionViewItem = exports.MenuEntryActionViewItem = exports.createAndFillInActionBarActions = exports.createAndFillInContextMenuActions = void 0;
    function createAndFillInContextMenuActions(menu, options, target, primaryGroup) {
        const groups = menu.getActions(options);
        const modifierKeyEmitter = dom_1.ModifierKeyEmitter.getInstance();
        const useAlternativeActions = modifierKeyEmitter.keyStatus.altKey || ((platform_1.isWindows || platform_1.isLinux) && modifierKeyEmitter.keyStatus.shiftKey);
        fillInActions(groups, target, useAlternativeActions, primaryGroup ? actionGroup => actionGroup === primaryGroup : actionGroup => actionGroup === 'navigation');
        return asDisposable(groups);
    }
    exports.createAndFillInContextMenuActions = createAndFillInContextMenuActions;
    function createAndFillInActionBarActions(menu, options, target, primaryGroup, primaryMaxCount, shouldInlineSubmenu, useSeparatorsInPrimaryActions) {
        const groups = menu.getActions(options);
        const isPrimaryAction = typeof primaryGroup === 'string' ? (actionGroup) => actionGroup === primaryGroup : primaryGroup;
        // Action bars handle alternative actions on their own so the alternative actions should be ignored
        fillInActions(groups, target, false, isPrimaryAction, primaryMaxCount, shouldInlineSubmenu, useSeparatorsInPrimaryActions);
        return asDisposable(groups);
    }
    exports.createAndFillInActionBarActions = createAndFillInActionBarActions;
    function asDisposable(groups) {
        const disposables = new lifecycle_1.DisposableStore();
        for (const [, actions] of groups) {
            for (const action of actions) {
                disposables.add(action);
            }
        }
        return disposables;
    }
    function fillInActions(groups, target, useAlternativeActions, isPrimaryAction = actionGroup => actionGroup === 'navigation', primaryMaxCount = Number.MAX_SAFE_INTEGER, shouldInlineSubmenu = () => false, useSeparatorsInPrimaryActions = false) {
        let primaryBucket;
        let secondaryBucket;
        if (Array.isArray(target)) {
            primaryBucket = target;
            secondaryBucket = target;
        }
        else {
            primaryBucket = target.primary;
            secondaryBucket = target.secondary;
        }
        const submenuInfo = new Set();
        for (const [group, actions] of groups) {
            let target;
            if (isPrimaryAction(group)) {
                target = primaryBucket;
                if (target.length > 0 && useSeparatorsInPrimaryActions) {
                    target.push(new actions_1.Separator());
                }
            }
            else {
                target = secondaryBucket;
                if (target.length > 0) {
                    target.push(new actions_1.Separator());
                }
            }
            for (let action of actions) {
                if (useAlternativeActions) {
                    action = action instanceof actions_2.MenuItemAction && action.alt ? action.alt : action;
                }
                const newLen = target.push(action);
                // keep submenu info for later inlining
                if (action instanceof actions_1.SubmenuAction) {
                    submenuInfo.add({ group, action, index: newLen - 1 });
                }
            }
        }
        // ask the outside if submenu should be inlined or not. only ask when
        // there would be enough space
        for (const { group, action, index } of submenuInfo) {
            const target = isPrimaryAction(group) ? primaryBucket : secondaryBucket;
            // inlining submenus with length 0 or 1 is easy,
            // larger submenus need to be checked with the overall limit
            const submenuActions = action.actions;
            if ((submenuActions.length <= 1 || target.length + submenuActions.length - 2 <= primaryMaxCount) && shouldInlineSubmenu(action, group, target.length)) {
                target.splice(index, 1, ...submenuActions);
            }
        }
        // overflow items from the primary group into the secondary bucket
        if (primaryBucket !== secondaryBucket && primaryBucket.length > primaryMaxCount) {
            const overflow = primaryBucket.splice(primaryMaxCount, primaryBucket.length - primaryMaxCount);
            secondaryBucket.unshift(...overflow, new actions_1.Separator());
        }
    }
    let MenuEntryActionViewItem = class MenuEntryActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(_action, options, _keybindingService, _notificationService, _contextKeyService) {
            super(undefined, _action, { icon: !!(_action.class || _action.item.icon), label: !_action.class && !_action.item.icon, draggable: options === null || options === void 0 ? void 0 : options.draggable });
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._contextKeyService = _contextKeyService;
            this._wantsAltCommand = false;
            this._itemClassDispose = this._register(new lifecycle_1.MutableDisposable());
            this._altKey = dom_1.ModifierKeyEmitter.getInstance();
        }
        get _menuItemAction() {
            return this._action;
        }
        get _commandAction() {
            return this._wantsAltCommand && this._menuItemAction.alt || this._menuItemAction;
        }
        async onClick(event) {
            event.preventDefault();
            event.stopPropagation();
            try {
                await this.actionRunner.run(this._commandAction, this._context);
            }
            catch (err) {
                this._notificationService.error(err);
            }
        }
        render(container) {
            super.render(container);
            container.classList.add('menu-entry');
            this._updateItemClass(this._menuItemAction.item);
            let mouseOver = false;
            let alternativeKeyDown = this._altKey.keyStatus.altKey || ((platform_1.isWindows || platform_1.isLinux) && this._altKey.keyStatus.shiftKey);
            const updateAltState = () => {
                var _a;
                const wantsAltCommand = mouseOver && alternativeKeyDown && !!((_a = this._commandAction.alt) === null || _a === void 0 ? void 0 : _a.enabled);
                if (wantsAltCommand !== this._wantsAltCommand) {
                    this._wantsAltCommand = wantsAltCommand;
                    this.updateLabel();
                    this.updateTooltip();
                    this.updateClass();
                }
            };
            if (this._menuItemAction.alt) {
                this._register(this._altKey.event(value => {
                    alternativeKeyDown = value.altKey || ((platform_1.isWindows || platform_1.isLinux) && value.shiftKey);
                    updateAltState();
                }));
            }
            this._register((0, dom_1.addDisposableListener)(container, 'mouseleave', _ => {
                mouseOver = false;
                updateAltState();
            }));
            this._register((0, dom_1.addDisposableListener)(container, 'mouseenter', _ => {
                mouseOver = true;
                updateAltState();
            }));
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.textContent = this._commandAction.label;
            }
        }
        updateTooltip() {
            var _a;
            if (this.label) {
                const keybinding = this._keybindingService.lookupKeybinding(this._commandAction.id, this._contextKeyService);
                const keybindingLabel = keybinding && keybinding.getLabel();
                const tooltip = this._commandAction.tooltip || this._commandAction.label;
                let title = keybindingLabel
                    ? (0, nls_1.localize)('titleAndKb', "{0} ({1})", tooltip, keybindingLabel)
                    : tooltip;
                if (!this._wantsAltCommand && ((_a = this._menuItemAction.alt) === null || _a === void 0 ? void 0 : _a.enabled)) {
                    const altTooltip = this._menuItemAction.alt.tooltip || this._menuItemAction.alt.label;
                    const altKeybinding = this._keybindingService.lookupKeybinding(this._menuItemAction.alt.id, this._contextKeyService);
                    const altKeybindingLabel = altKeybinding && altKeybinding.getLabel();
                    const altTitleSection = altKeybindingLabel
                        ? (0, nls_1.localize)('titleAndKb', "{0} ({1})", altTooltip, altKeybindingLabel)
                        : altTooltip;
                    title += `\n[${keybindingLabels_1.UILabelProvider.modifierLabels[platform_1.OS].altKey}] ${altTitleSection}`;
                }
                this.label.title = title;
                this.label.setAttribute('aria-label', title);
            }
        }
        updateClass() {
            if (this.options.icon) {
                if (this._commandAction !== this._menuItemAction) {
                    if (this._menuItemAction.alt) {
                        this._updateItemClass(this._menuItemAction.alt.item);
                    }
                }
                else if (this._menuItemAction.alt) {
                    this._updateItemClass(this._menuItemAction.item);
                }
            }
        }
        _updateItemClass(item) {
            var _a;
            this._itemClassDispose.value = undefined;
            const { element, label } = this;
            if (!element || !label) {
                return;
            }
            const icon = this._commandAction.checked && ((_a = item.toggled) === null || _a === void 0 ? void 0 : _a.icon) ? item.toggled.icon : item.icon;
            if (!icon) {
                return;
            }
            if (themeService_1.ThemeIcon.isThemeIcon(icon)) {
                // theme icons
                const iconClasses = themeService_1.ThemeIcon.asClassNameArray(icon);
                label.classList.add(...iconClasses);
                this._itemClassDispose.value = (0, lifecycle_1.toDisposable)(() => {
                    label.classList.remove(...iconClasses);
                });
            }
            else {
                // icon path/url
                if (icon.light) {
                    label.style.setProperty('--menu-entry-icon-light', (0, dom_1.asCSSUrl)(icon.light));
                }
                if (icon.dark) {
                    label.style.setProperty('--menu-entry-icon-dark', (0, dom_1.asCSSUrl)(icon.dark));
                }
                label.classList.add('icon');
                this._itemClassDispose.value = (0, lifecycle_1.toDisposable)(() => {
                    label.classList.remove('icon');
                    label.style.removeProperty('--menu-entry-icon-light');
                    label.style.removeProperty('--menu-entry-icon-dark');
                });
            }
        }
    };
    MenuEntryActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextkey_1.IContextKeyService)
    ], MenuEntryActionViewItem);
    exports.MenuEntryActionViewItem = MenuEntryActionViewItem;
    let SubmenuEntryActionViewItem = class SubmenuEntryActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, options, contextMenuService) {
            var _a, _b;
            const dropdownOptions = Object.assign({}, options !== null && options !== void 0 ? options : Object.create(null), {
                menuAsChild: (_a = options === null || options === void 0 ? void 0 : options.menuAsChild) !== null && _a !== void 0 ? _a : false,
                classNames: (_b = options === null || options === void 0 ? void 0 : options.classNames) !== null && _b !== void 0 ? _b : (themeService_1.ThemeIcon.isThemeIcon(action.item.icon) ? themeService_1.ThemeIcon.asClassName(action.item.icon) : undefined),
            });
            super(action, { getActions: () => action.actions }, contextMenuService, dropdownOptions);
        }
        render(container) {
            super.render(container);
            if (this.element) {
                container.classList.add('menu-entry');
                const { icon } = this._action.item;
                if (icon && !themeService_1.ThemeIcon.isThemeIcon(icon)) {
                    this.element.classList.add('icon');
                    if (icon.light) {
                        this.element.style.setProperty('--menu-entry-icon-light', (0, dom_1.asCSSUrl)(icon.light));
                    }
                    if (icon.dark) {
                        this.element.style.setProperty('--menu-entry-icon-dark', (0, dom_1.asCSSUrl)(icon.dark));
                    }
                }
            }
        }
    };
    SubmenuEntryActionViewItem = __decorate([
        __param(2, contextView_1.IContextMenuService)
    ], SubmenuEntryActionViewItem);
    exports.SubmenuEntryActionViewItem = SubmenuEntryActionViewItem;
    let DropdownWithDefaultActionViewItem = class DropdownWithDefaultActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(submenuAction, options, _keybindingService, _notificationService, _contextMenuService, _menuService, _instaService, _storageService) {
            var _a, _b, _c;
            super(null, submenuAction);
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._menuService = _menuService;
            this._instaService = _instaService;
            this._storageService = _storageService;
            this._container = null;
            this._storageKey = `${submenuAction.item.submenu._debugName}_lastActionId`;
            // determine default action
            let defaultAction;
            let defaultActionId = _storageService.get(this._storageKey, 1 /* StorageScope.WORKSPACE */);
            if (defaultActionId) {
                defaultAction = submenuAction.actions.find(a => defaultActionId === a.id);
            }
            if (!defaultAction) {
                defaultAction = submenuAction.actions[0];
            }
            this._defaultAction = this._instaService.createInstance(MenuEntryActionViewItem, defaultAction, undefined);
            const dropdownOptions = Object.assign({}, options !== null && options !== void 0 ? options : Object.create(null), {
                menuAsChild: (_a = options === null || options === void 0 ? void 0 : options.menuAsChild) !== null && _a !== void 0 ? _a : true,
                classNames: (_b = options === null || options === void 0 ? void 0 : options.classNames) !== null && _b !== void 0 ? _b : ['codicon', 'codicon-chevron-down'],
                actionRunner: (_c = options === null || options === void 0 ? void 0 : options.actionRunner) !== null && _c !== void 0 ? _c : new actions_1.ActionRunner()
            });
            this._dropdown = new dropdownActionViewItem_1.DropdownMenuActionViewItem(submenuAction, submenuAction.actions, this._contextMenuService, dropdownOptions);
            this._dropdown.actionRunner.onDidRun((e) => {
                if (e.action instanceof actions_2.MenuItemAction) {
                    this.update(e.action);
                }
            });
        }
        get onDidChangeDropdownVisibility() {
            return this._dropdown.onDidChangeVisibility;
        }
        update(lastAction) {
            this._storageService.store(this._storageKey, lastAction.id, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this._defaultAction.dispose();
            this._defaultAction = this._instaService.createInstance(MenuEntryActionViewItem, lastAction, undefined);
            this._defaultAction.actionRunner = new class extends actions_1.ActionRunner {
                async runAction(action, context) {
                    await action.run(undefined);
                }
            }();
            if (this._container) {
                this._defaultAction.render((0, dom_1.prepend)(this._container, (0, dom_1.$)('.action-container')));
            }
        }
        setActionContext(newContext) {
            super.setActionContext(newContext);
            this._defaultAction.setActionContext(newContext);
            this._dropdown.setActionContext(newContext);
        }
        render(container) {
            this._container = container;
            super.render(this._container);
            this._container.classList.add('monaco-dropdown-with-default');
            const primaryContainer = (0, dom_1.$)('.action-container');
            this._defaultAction.render((0, dom_1.append)(this._container, primaryContainer));
            this._register((0, dom_1.addDisposableListener)(primaryContainer, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(17 /* KeyCode.RightArrow */)) {
                    this._defaultAction.element.tabIndex = -1;
                    this._dropdown.focus();
                    event.stopPropagation();
                }
            }));
            const dropdownContainer = (0, dom_1.$)('.dropdown-action-container');
            this._dropdown.render((0, dom_1.append)(this._container, dropdownContainer));
            this._register((0, dom_1.addDisposableListener)(dropdownContainer, dom_1.EventType.KEY_DOWN, (e) => {
                var _a;
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(15 /* KeyCode.LeftArrow */)) {
                    this._defaultAction.element.tabIndex = 0;
                    this._dropdown.setFocusable(false);
                    (_a = this._defaultAction.element) === null || _a === void 0 ? void 0 : _a.focus();
                    event.stopPropagation();
                }
            }));
        }
        focus(fromRight) {
            if (fromRight) {
                this._dropdown.focus();
            }
            else {
                this._defaultAction.element.tabIndex = 0;
                this._defaultAction.element.focus();
            }
        }
        blur() {
            this._defaultAction.element.tabIndex = -1;
            this._dropdown.blur();
            this._container.blur();
        }
        setFocusable(focusable) {
            if (focusable) {
                this._defaultAction.element.tabIndex = 0;
            }
            else {
                this._defaultAction.element.tabIndex = -1;
                this._dropdown.setFocusable(false);
            }
        }
        dispose() {
            this._defaultAction.dispose();
            this._dropdown.dispose();
            super.dispose();
        }
    };
    DropdownWithDefaultActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, actions_2.IMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, storage_1.IStorageService)
    ], DropdownWithDefaultActionViewItem);
    /**
     * Creates action view items for menu actions or submenu actions.
     */
    function createActionViewItem(instaService, action, options) {
        if (action instanceof actions_2.MenuItemAction) {
            return instaService.createInstance(MenuEntryActionViewItem, action, undefined);
        }
        else if (action instanceof actions_2.SubmenuItemAction) {
            if (action.item.rememberDefaultAction) {
                return instaService.createInstance(DropdownWithDefaultActionViewItem, action, options);
            }
            else {
                return instaService.createInstance(SubmenuEntryActionViewItem, action, options);
            }
        }
        else {
            return undefined;
        }
    }
    exports.createActionViewItem = createActionViewItem;
});
//# sourceMappingURL=menuEntryActionViewItem.js.map