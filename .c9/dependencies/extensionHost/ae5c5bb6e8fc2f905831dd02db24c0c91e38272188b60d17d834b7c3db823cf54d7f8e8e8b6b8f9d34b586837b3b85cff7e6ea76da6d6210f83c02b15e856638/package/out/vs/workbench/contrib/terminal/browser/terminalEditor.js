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
define(["require", "exports", "vs/base/browser/dom", "vs/editor/contrib/find/browser/findState", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalFindWidget", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/platform", "vs/base/browser/canIUse", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/platform/commands/common/commands", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom, findState_1, dropdownWithPrimaryActionViewItem_1, actions_1, contextkey_1, contextView_1, instantiation_1, storage_1, telemetry_1, themeService_1, editorPane_1, terminal_1, terminalFindWidget_1, terminalMenus_1, terminal_2, platform_1, canIUse_1, notification_1, terminalContextMenu_1, commands_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditor = void 0;
    const findWidgetSelector = '.simple-find-part-wrapper';
    let TerminalEditor = class TerminalEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, storageService, _terminalEditorService, _terminalProfileResolverService, _terminalService, instantiationService, _contextKeyService, _commandService, menuService, _instantiationService, _contextMenuService, _notificationService, _terminalProfileService) {
            super(terminal_1.terminalEditorId, telemetryService, themeService, storageService);
            this._terminalEditorService = _terminalEditorService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._terminalService = _terminalService;
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._instantiationService = _instantiationService;
            this._contextMenuService = _contextMenuService;
            this._notificationService = _notificationService;
            this._terminalProfileService = _terminalProfileService;
            this._editorInput = undefined;
            this._cancelContextMenu = false;
            this._findState = new findState_1.FindReplaceState();
            this._findWidget = instantiationService.createInstance(terminalFindWidget_1.TerminalFindWidget, this._findState);
            this._dropdownMenu = this._register(menuService.createMenu(actions_1.MenuId.TerminalNewDropdownContext, _contextKeyService));
            this._instanceMenu = this._register(menuService.createMenu(actions_1.MenuId.TerminalEditorInstanceContext, _contextKeyService));
            this._register(this._terminalService.onDidRequestHideFindWidget(() => this.hideFindWidget()));
        }
        get findState() { return this._findState; }
        async setInput(newInput, options, context, token) {
            var _a, _b, _c, _d;
            (_b = (_a = this._editorInput) === null || _a === void 0 ? void 0 : _a.terminalInstance) === null || _b === void 0 ? void 0 : _b.detachFromElement();
            this._editorInput = newInput;
            await super.setInput(newInput, options, context, token);
            (_c = this._editorInput.terminalInstance) === null || _c === void 0 ? void 0 : _c.attachToElement(this._overflowGuardElement);
            if (this._lastDimension) {
                this.layout(this._lastDimension);
            }
            (_d = this._editorInput.terminalInstance) === null || _d === void 0 ? void 0 : _d.setVisible(this.isVisible());
            if (this._editorInput.terminalInstance) {
                // since the editor does not monitor focus changes, for ex. between the terminal
                // panel and the editors, this is needed so that the active instance gets set
                // when focus changes between them.
                this._register(this._editorInput.terminalInstance.onDidFocus(() => this._setActiveInstance()));
                this._register(this._editorInput.terminalInstance.onDidChangeFindResults(() => this._findWidget.updateResultCount()));
                this._editorInput.setCopyLaunchConfig(this._editorInput.terminalInstance.shellLaunchConfig);
            }
        }
        clearInput() {
            var _a, _b;
            super.clearInput();
            (_b = (_a = this._editorInput) === null || _a === void 0 ? void 0 : _a.terminalInstance) === null || _b === void 0 ? void 0 : _b.detachFromElement();
            this._editorInput = undefined;
        }
        _setActiveInstance() {
            var _a;
            if (!((_a = this._editorInput) === null || _a === void 0 ? void 0 : _a.terminalInstance)) {
                return;
            }
            this._terminalEditorService.setActiveInstance(this._editorInput.terminalInstance);
        }
        focus() {
            var _a, _b;
            (_b = (_a = this._editorInput) === null || _a === void 0 ? void 0 : _a.terminalInstance) === null || _b === void 0 ? void 0 : _b.focus();
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        createEditor(parent) {
            this._editorInstanceElement = parent;
            this._overflowGuardElement = dom.$('.terminal-overflow-guard');
            this._editorInstanceElement.appendChild(this._overflowGuardElement);
            this._registerListeners();
        }
        _registerListeners() {
            if (!this._editorInstanceElement) {
                return;
            }
            this._register(dom.addDisposableListener(this._editorInstanceElement, 'mousedown', async (event) => {
                if (this._terminalEditorService.instances.length === 0) {
                    return;
                }
                if (event.which === 2 && platform_1.isLinux) {
                    // Drop selection and focus terminal on Linux to enable middle button paste when click
                    // occurs on the selection itself.
                    const terminal = this._terminalEditorService.activeInstance;
                    if (terminal) {
                        terminal.focus();
                    }
                }
                else if (event.which === 3) {
                    const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                    if (rightClickBehavior === 'nothing') {
                        if (!event.shiftKey) {
                            this._cancelContextMenu = true;
                        }
                        return;
                    }
                    else if (rightClickBehavior === 'copyPaste' || rightClickBehavior === 'paste') {
                        const terminal = this._terminalEditorService.activeInstance;
                        if (!terminal) {
                            return;
                        }
                        // copyPaste: Shift+right click should open context menu
                        if (rightClickBehavior === 'copyPaste' && event.shiftKey) {
                            (0, terminalContextMenu_1.openContextMenu)(event, this._editorInstanceElement, this._instanceMenu, this._contextMenuService);
                            return;
                        }
                        if (rightClickBehavior === 'copyPaste' && terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            if (canIUse_1.BrowserFeatures.clipboard.readText) {
                                terminal.paste();
                            }
                            else {
                                this._notificationService.info(`This browser doesn't support the clipboard.readText API needed to trigger a paste, try ${platform_1.isMacintosh ? '⌘' : 'Ctrl'}+V instead.`);
                            }
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform_1.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(this._editorInstanceElement, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this._cancelContextMenu = false;
                    return;
                }
                else if (!this._cancelContextMenu && rightClickBehavior !== 'copyPaste' && rightClickBehavior !== 'paste') {
                    if (!this._cancelContextMenu) {
                        (0, terminalContextMenu_1.openContextMenu)(event, this._editorInstanceElement, this._instanceMenu, this._contextMenuService);
                    }
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    this._cancelContextMenu = false;
                }
            }));
        }
        layout(dimension) {
            var _a, _b;
            (_b = (_a = this._editorInput) === null || _a === void 0 ? void 0 : _a.terminalInstance) === null || _b === void 0 ? void 0 : _b.layout(dimension);
            this._lastDimension = dimension;
        }
        setVisible(visible, group) {
            var _a, _b;
            super.setVisible(visible, group);
            return (_b = (_a = this._editorInput) === null || _a === void 0 ? void 0 : _a.terminalInstance) === null || _b === void 0 ? void 0 : _b.setVisible(visible);
        }
        getActionViewItem(action) {
            switch (action.id) {
                case "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */: {
                    const location = { viewColumn: editorService_1.ACTIVE_GROUP };
                    const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(location, this._terminalProfileService.availableProfiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._instantiationService, this._terminalService, this._contextKeyService, this._commandService, this._dropdownMenu);
                    const button = this._instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, actions.primaryAction, actions.dropdownAction, actions.dropdownMenuActions, actions.className, this._contextMenuService, {});
                    return button;
                }
            }
            return super.getActionViewItem(action);
        }
        _getDefaultProfileName() {
            let defaultProfileName;
            try {
                defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            }
            catch (e) {
                defaultProfileName = this._terminalProfileResolverService.defaultProfileName;
            }
            return defaultProfileName;
        }
        focusFindWidget() {
            var _a;
            if (this._overflowGuardElement && !((_a = this._overflowGuardElement) === null || _a === void 0 ? void 0 : _a.querySelector(findWidgetSelector))) {
                this._overflowGuardElement.appendChild(this._findWidget.getDomNode());
            }
            const activeInstance = this._terminalEditorService.activeInstance;
            if (activeInstance && activeInstance.hasSelection() && activeInstance.selection.indexOf('\n') === -1) {
                this._findWidget.reveal(activeInstance.selection);
            }
            else {
                this._findWidget.reveal();
            }
        }
        hideFindWidget() {
            this.focus();
            this._findWidget.hide();
        }
        showFindWidget() {
            const activeInstance = this._terminalEditorService.activeInstance;
            if (activeInstance && activeInstance.hasSelection() && activeInstance.selection.indexOf('\n') === -1) {
                this._findWidget.show(activeInstance.selection);
            }
            else {
                this._findWidget.show();
            }
        }
        getFindWidget() {
            return this._findWidget;
        }
    };
    TerminalEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, terminal_1.ITerminalEditorService),
        __param(4, terminal_2.ITerminalProfileResolverService),
        __param(5, terminal_1.ITerminalService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, commands_1.ICommandService),
        __param(9, actions_1.IMenuService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, notification_1.INotificationService),
        __param(13, terminal_2.ITerminalProfileService)
    ], TerminalEditor);
    exports.TerminalEditor = TerminalEditor;
});
//# sourceMappingURL=terminalEditor.js.map