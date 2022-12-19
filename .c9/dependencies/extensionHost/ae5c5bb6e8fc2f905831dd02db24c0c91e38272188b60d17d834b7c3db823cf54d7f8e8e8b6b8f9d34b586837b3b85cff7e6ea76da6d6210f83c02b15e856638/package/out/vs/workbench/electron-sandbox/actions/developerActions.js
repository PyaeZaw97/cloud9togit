/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/native/electron-sandbox/native", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkeys"], function (require, exports, nls_1, native_1, editorService_1, actions_1, actions_2, environmentService_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReloadWindowWithExtensionsDisabledAction = exports.ToggleSharedProcessAction = exports.ConfigureRuntimeArgumentsAction = exports.ToggleDevToolsAction = void 0;
    class ToggleDevToolsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleDevTools',
                title: { value: (0, nls_1.localize)('toggleDevTools', "Toggle Developer Tools"), original: 'Toggle Developer Tools' },
                category: actions_2.CATEGORIES.Developer,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                    when: contextkeys_1.IsDevelopmentContext,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */ }
                },
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '5_tools',
                    order: 1
                }
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            return nativeHostService.toggleDevTools();
        }
    }
    exports.ToggleDevToolsAction = ToggleDevToolsAction;
    class ConfigureRuntimeArgumentsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.configureRuntimeArguments',
                title: { value: (0, nls_1.localize)('configureRuntimeArguments', "Configure Runtime Arguments"), original: 'Configure Runtime Arguments' },
                category: actions_2.CATEGORIES.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            await editorService.openEditor({
                resource: environmentService.argvResource,
                options: { pinned: true }
            });
        }
    }
    exports.ConfigureRuntimeArgumentsAction = ConfigureRuntimeArgumentsAction;
    class ToggleSharedProcessAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleSharedProcess',
                title: { value: (0, nls_1.localize)('toggleSharedProcess', "Toggle Shared Process"), original: 'Toggle Shared Process' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            return accessor.get(native_1.INativeHostService).toggleSharedProcessWindow();
        }
    }
    exports.ToggleSharedProcessAction = ToggleSharedProcessAction;
    class ReloadWindowWithExtensionsDisabledAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.reloadWindowWithExtensionsDisabled',
                title: { value: (0, nls_1.localize)('reloadWindowWithExtensionsDisabled', "Reload With Extensions Disabled"), original: 'Reload With Extensions Disabled' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            return accessor.get(native_1.INativeHostService).reload({ disableExtensions: true });
        }
    }
    exports.ReloadWindowWithExtensionsDisabledAction = ReloadWindowWithExtensionsDisabledAction;
});
//# sourceMappingURL=developerActions.js.map