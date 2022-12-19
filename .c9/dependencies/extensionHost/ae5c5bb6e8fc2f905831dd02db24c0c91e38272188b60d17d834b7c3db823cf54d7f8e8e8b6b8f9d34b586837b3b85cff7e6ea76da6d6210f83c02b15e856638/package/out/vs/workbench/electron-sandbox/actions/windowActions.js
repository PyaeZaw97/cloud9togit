/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/window/electron-sandbox/window", "vs/platform/keybinding/common/keybinding", "vs/base/browser/browser", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration", "vs/platform/native/electron-sandbox/native", "vs/base/common/codicons", "vs/platform/workspace/common/workspace", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/css!./media/actions"], function (require, exports, uri_1, nls_1, window_1, keybinding_1, browser_1, files_1, model_1, language_1, quickInput_1, getIconClasses_1, configuration_1, native_1, codicons_1, workspace_1, actions_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleWindowTabsBarHandler = exports.MergeWindowTabsHandlerHandler = exports.MoveWindowTabToNewWindowHandler = exports.ShowNextWindowTabHandler = exports.ShowPreviousWindowTabHandler = exports.NewWindowTabHandler = exports.QuickSwitchWindowAction = exports.SwitchWindowAction = exports.ZoomResetAction = exports.ZoomOutAction = exports.ZoomInAction = exports.CloseWindowAction = void 0;
    class CloseWindowAction extends actions_1.Action2 {
        constructor() {
            super({
                id: CloseWindowAction.ID,
                title: {
                    value: (0, nls_1.localize)('closeWindow', "Close Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miCloseWindow', comment: ['&& denotes a mnemonic'] }, "Clos&&e Window"),
                    original: 'Close Window'
                },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */ },
                    linux: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */] },
                    win: { primary: 512 /* KeyMod.Alt */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */] }
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '6_close',
                    order: 4
                }
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            return nativeHostService.closeWindow();
        }
    }
    exports.CloseWindowAction = CloseWindowAction;
    CloseWindowAction.ID = 'workbench.action.closeWindow';
    class BaseZoomAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        async setConfiguredZoomLevel(accessor, level) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            level = Math.round(level); // when reaching smallest zoom, prevent fractional zoom levels
            if (level > BaseZoomAction.MAX_ZOOM_LEVEL || level < BaseZoomAction.MIN_ZOOM_LEVEL) {
                return; // https://github.com/microsoft/vscode/issues/48357
            }
            await configurationService.updateValue(BaseZoomAction.SETTING_KEY, level);
            (0, window_1.applyZoom)(level);
        }
    }
    BaseZoomAction.SETTING_KEY = 'window.zoomLevel';
    BaseZoomAction.MAX_ZOOM_LEVEL = 8;
    BaseZoomAction.MIN_ZOOM_LEVEL = -8;
    class ZoomInAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomIn',
                title: {
                    value: (0, nls_1.localize)('zoomIn', "Zoom In"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomIn', comment: ['&& denotes a mnemonic'] }, "&&Zoom In"),
                    original: 'Zoom In'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 81 /* KeyCode.Equal */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 81 /* KeyCode.Equal */, 2048 /* KeyMod.CtrlCmd */ | 104 /* KeyCode.NumpadAdd */]
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '3_zoom',
                    order: 1
                }
            });
        }
        run(accessor) {
            return super.setConfiguredZoomLevel(accessor, (0, browser_1.getZoomLevel)() + 1);
        }
    }
    exports.ZoomInAction = ZoomInAction;
    class ZoomOutAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomOut',
                title: {
                    value: (0, nls_1.localize)('zoomOut', "Zoom Out"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomOut', comment: ['&& denotes a mnemonic'] }, "&&Zoom Out"),
                    original: 'Zoom Out'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 83 /* KeyCode.Minus */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 83 /* KeyCode.Minus */, 2048 /* KeyMod.CtrlCmd */ | 106 /* KeyCode.NumpadSubtract */],
                    linux: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 83 /* KeyCode.Minus */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 106 /* KeyCode.NumpadSubtract */]
                    }
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '3_zoom',
                    order: 2
                }
            });
        }
        run(accessor) {
            return super.setConfiguredZoomLevel(accessor, (0, browser_1.getZoomLevel)() - 1);
        }
    }
    exports.ZoomOutAction = ZoomOutAction;
    class ZoomResetAction extends BaseZoomAction {
        constructor() {
            super({
                id: 'workbench.action.zoomReset',
                title: {
                    value: (0, nls_1.localize)('zoomReset', "Reset Zoom"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miZoomReset', comment: ['&& denotes a mnemonic'] }, "&&Reset Zoom"),
                    original: 'Reset Zoom'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Numpad0 */
                },
                menu: {
                    id: actions_1.MenuId.MenubarAppearanceMenu,
                    group: '3_zoom',
                    order: 3
                }
            });
        }
        run(accessor) {
            return super.setConfiguredZoomLevel(accessor, 0);
        }
    }
    exports.ZoomResetAction = ZoomResetAction;
    class BaseSwitchWindow extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.closeWindowAction = {
                iconClass: codicons_1.Codicon.removeClose.classNames,
                tooltip: (0, nls_1.localize)('close', "Close Window")
            };
            this.closeDirtyWindowAction = {
                iconClass: 'dirty-window ' + codicons_1.Codicon.closeDirty,
                tooltip: (0, nls_1.localize)('close', "Close Window"),
                alwaysVisible: true
            };
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const currentWindowId = nativeHostService.windowId;
            const windows = await nativeHostService.getWindows();
            const placeHolder = (0, nls_1.localize)('switchWindowPlaceHolder', "Select a window to switch to");
            const picks = windows.map(window => {
                const resource = window.filename ? uri_1.URI.file(window.filename) : (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.workspace) ? window.workspace.uri : (0, workspace_1.isWorkspaceIdentifier)(window.workspace) ? window.workspace.configPath : undefined;
                const fileKind = window.filename ? files_1.FileKind.FILE : (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.workspace) ? files_1.FileKind.FOLDER : (0, workspace_1.isWorkspaceIdentifier)(window.workspace) ? files_1.FileKind.ROOT_FOLDER : files_1.FileKind.FILE;
                return {
                    payload: window.id,
                    label: window.title,
                    ariaLabel: window.dirty ? (0, nls_1.localize)('windowDirtyAriaLabel', "{0}, window with unsaved changes", window.title) : window.title,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, fileKind),
                    description: (currentWindowId === window.id) ? (0, nls_1.localize)('current', "Current Window") : undefined,
                    buttons: currentWindowId !== window.id ? window.dirty ? [this.closeDirtyWindowAction] : [this.closeWindowAction] : undefined
                };
            });
            const autoFocusIndex = (picks.indexOf(picks.filter(pick => pick.payload === currentWindowId)[0]) + 1) % picks.length;
            const pick = await quickInputService.pick(picks, {
                contextKey: 'inWindowsPicker',
                activeItem: picks[autoFocusIndex],
                placeHolder,
                quickNavigate: this.isQuickNavigate() ? { keybindings: keybindingService.lookupKeybindings(this.desc.id) } : undefined,
                hideInput: this.isQuickNavigate(),
                onDidTriggerItemButton: async (context) => {
                    await nativeHostService.closeWindowById(context.item.payload);
                    context.removeItem();
                }
            });
            if (pick) {
                nativeHostService.focusWindow({ windowId: pick.payload });
            }
        }
    }
    class SwitchWindowAction extends BaseSwitchWindow {
        constructor() {
            super({
                id: 'workbench.action.switchWindow',
                title: { value: (0, nls_1.localize)('switchWindow', "Switch Window..."), original: 'Switch Window...' },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 53 /* KeyCode.KeyW */ }
                }
            });
        }
        isQuickNavigate() {
            return false;
        }
    }
    exports.SwitchWindowAction = SwitchWindowAction;
    class QuickSwitchWindowAction extends BaseSwitchWindow {
        constructor() {
            super({
                id: 'workbench.action.quickSwitchWindow',
                title: { value: (0, nls_1.localize)('quickSwitchWindow', "Quick Switch Window..."), original: 'Quick Switch Window...' },
                f1: true
            });
        }
        isQuickNavigate() {
            return true;
        }
    }
    exports.QuickSwitchWindowAction = QuickSwitchWindowAction;
    const NewWindowTabHandler = function (accessor) {
        return accessor.get(native_1.INativeHostService).newWindowTab();
    };
    exports.NewWindowTabHandler = NewWindowTabHandler;
    const ShowPreviousWindowTabHandler = function (accessor) {
        return accessor.get(native_1.INativeHostService).showPreviousWindowTab();
    };
    exports.ShowPreviousWindowTabHandler = ShowPreviousWindowTabHandler;
    const ShowNextWindowTabHandler = function (accessor) {
        return accessor.get(native_1.INativeHostService).showNextWindowTab();
    };
    exports.ShowNextWindowTabHandler = ShowNextWindowTabHandler;
    const MoveWindowTabToNewWindowHandler = function (accessor) {
        return accessor.get(native_1.INativeHostService).moveWindowTabToNewWindow();
    };
    exports.MoveWindowTabToNewWindowHandler = MoveWindowTabToNewWindowHandler;
    const MergeWindowTabsHandlerHandler = function (accessor) {
        return accessor.get(native_1.INativeHostService).mergeAllWindowTabs();
    };
    exports.MergeWindowTabsHandlerHandler = MergeWindowTabsHandlerHandler;
    const ToggleWindowTabsBarHandler = function (accessor) {
        return accessor.get(native_1.INativeHostService).toggleWindowTabsBar();
    };
    exports.ToggleWindowTabsBarHandler = ToggleWindowTabsBarHandler;
});
//# sourceMappingURL=windowActions.js.map