/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform", "vs/workbench/electron-sandbox/actions/developerActions", "vs/workbench/electron-sandbox/actions/windowActions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkeys", "vs/platform/native/electron-sandbox/native", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/electron-sandbox/actions/installActions", "vs/workbench/common/contextkeys", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/workbench/electron-sandbox/window", "vs/base/browser/dom"], function (require, exports, platform_1, nls_1, actions_1, configurationRegistry_1, platform_2, developerActions_1, windowActions_1, contextkey_1, keybindingsRegistry_1, commands_1, contextkeys_1, native_1, jsonContributionRegistry_1, installActions_1, contextkeys_2, telemetry_1, configuration_1, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Actions
    (function registerActions() {
        // Actions: Zoom
        (0, actions_1.registerAction2)(windowActions_1.ZoomInAction);
        (0, actions_1.registerAction2)(windowActions_1.ZoomOutAction);
        (0, actions_1.registerAction2)(windowActions_1.ZoomResetAction);
        // Actions: Window
        (0, actions_1.registerAction2)(windowActions_1.SwitchWindowAction);
        (0, actions_1.registerAction2)(windowActions_1.QuickSwitchWindowAction);
        (0, actions_1.registerAction2)(windowActions_1.CloseWindowAction);
        if (platform_2.isMacintosh) {
            // macOS: behave like other native apps that have documents
            // but can run without a document opened and allow to close
            // the window when the last document is closed
            // (https://github.com/microsoft/vscode/issues/126042)
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: windowActions_1.CloseWindowAction.ID,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.EditorsVisibleContext.toNegated(), contextkeys_2.SingleEditorGroupsContext),
                primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */
            });
        }
        // Actions: Install Shell Script (macOS only)
        if (platform_2.isMacintosh) {
            (0, actions_1.registerAction2)(installActions_1.InstallShellScriptAction);
            (0, actions_1.registerAction2)(installActions_1.UninstallShellScriptAction);
        }
        // Quit
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'workbench.action.quit',
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            async handler(accessor) {
                const nativeHostService = accessor.get(native_1.INativeHostService);
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
                if (confirmBeforeClose === 'always' || (confirmBeforeClose === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed)) {
                    const confirmed = await window_1.NativeWindow.confirmOnShutdown(accessor, 2 /* ShutdownReason.QUIT */);
                    if (!confirmed) {
                        return; // quit prevented by user
                    }
                }
                nativeHostService.quit();
            },
            when: undefined,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */ },
            linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */ }
        });
        // Actions: macOS Native Tabs
        if (platform_2.isMacintosh) {
            for (const command of [
                { handler: windowActions_1.NewWindowTabHandler, id: 'workbench.action.newWindowTab', title: { value: (0, nls_1.localize)('newTab', "New Window Tab"), original: 'New Window Tab' } },
                { handler: windowActions_1.ShowPreviousWindowTabHandler, id: 'workbench.action.showPreviousWindowTab', title: { value: (0, nls_1.localize)('showPreviousTab', "Show Previous Window Tab"), original: 'Show Previous Window Tab' } },
                { handler: windowActions_1.ShowNextWindowTabHandler, id: 'workbench.action.showNextWindowTab', title: { value: (0, nls_1.localize)('showNextWindowTab', "Show Next Window Tab"), original: 'Show Next Window Tab' } },
                { handler: windowActions_1.MoveWindowTabToNewWindowHandler, id: 'workbench.action.moveWindowTabToNewWindow', title: { value: (0, nls_1.localize)('moveWindowTabToNewWindow', "Move Window Tab to New Window"), original: 'Move Window Tab to New Window' } },
                { handler: windowActions_1.MergeWindowTabsHandlerHandler, id: 'workbench.action.mergeAllWindowTabs', title: { value: (0, nls_1.localize)('mergeAllWindowTabs', "Merge All Windows"), original: 'Merge All Windows' } },
                { handler: windowActions_1.ToggleWindowTabsBarHandler, id: 'workbench.action.toggleWindowTabsBar', title: { value: (0, nls_1.localize)('toggleWindowTabsBar', "Toggle Window Tabs Bar"), original: 'Toggle Window Tabs Bar' } }
            ]) {
                commands_1.CommandsRegistry.registerCommand(command.id, command.handler);
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                    command,
                    when: contextkey_1.ContextKeyExpr.equals('config.window.nativeTabs', true)
                });
            }
        }
        // Actions: Developer
        (0, actions_1.registerAction2)(developerActions_1.ReloadWindowWithExtensionsDisabledAction);
        (0, actions_1.registerAction2)(developerActions_1.ConfigureRuntimeArgumentsAction);
        (0, actions_1.registerAction2)(developerActions_1.ToggleSharedProcessAction);
        (0, actions_1.registerAction2)(developerActions_1.ToggleDevToolsAction);
    })();
    // Menu
    (function registerMenu() {
        // Quit
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
            group: 'z_Exit',
            command: {
                id: 'workbench.action.quit',
                title: (0, nls_1.localize)({ key: 'miExit', comment: ['&& denotes a mnemonic'] }, "E&&xit")
            },
            order: 1,
            when: contextkeys_1.IsMacContext.toNegated()
        });
    })();
    // Configuration
    (function registerConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        // Window
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': (0, nls_1.localize)('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.openWithoutArgumentsInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openWithoutArgumentsInNewWindow.on', "Open a new empty window."),
                        (0, nls_1.localize)('window.openWithoutArgumentsInNewWindow.off', "Focus the last active running instance.")
                    ],
                    'default': platform_2.isMacintosh ? 'off' : 'on',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('openWithoutArgumentsInNewWindow', "Controls whether a new empty window should open when starting a second instance without arguments or if the last running instance should get focus.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.restoreWindows': {
                    'type': 'string',
                    'enum': ['preserve', 'all', 'folders', 'one', 'none'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.reopenFolders.preserve', "Always reopen all windows. If a folder or workspace is opened (e.g. from the command line) it opens as a new window unless it was opened before. If files are opened they will open in one of the restored windows."),
                        (0, nls_1.localize)('window.reopenFolders.all', "Reopen all windows unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.folders', "Reopen all windows that had folders or workspaces opened unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.one', "Reopen the last active window unless a folder, workspace or file is opened (e.g. from the command line)."),
                        (0, nls_1.localize)('window.reopenFolders.none', "Never reopen a window. Unless a folder or workspace is opened (e.g. from the command line), an empty window will appear.")
                    ],
                    'default': 'all',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('restoreWindows', "Controls how windows are being reopened after starting for the first time. This setting has no effect when the application is already running.")
                },
                'window.restoreFullscreen': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('restoreFullscreen', "Controls whether a window should restore to full screen mode if it was exited in full screen mode.")
                },
                'window.zoomLevel': {
                    'type': 'number',
                    'default': 0,
                    'description': (0, nls_1.localize)('zoomLevel', "Adjust the zoom level of the window. The original size is 0 and each increment above (e.g. 1) or below (e.g. -1) represents zooming 20% larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity."),
                    ignoreSync: true
                },
                'window.newWindowDimensions': {
                    'type': 'string',
                    'enum': ['default', 'inherit', 'offset', 'maximized', 'fullscreen'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.newWindowDimensions.default', "Open new windows in the center of the screen."),
                        (0, nls_1.localize)('window.newWindowDimensions.inherit', "Open new windows with same dimension as last active one."),
                        (0, nls_1.localize)('window.newWindowDimensions.offset', "Open new windows with same dimension as last active one with an offset position."),
                        (0, nls_1.localize)('window.newWindowDimensions.maximized', "Open new windows maximized."),
                        (0, nls_1.localize)('window.newWindowDimensions.fullscreen', "Open new windows in full screen mode.")
                    ],
                    'default': 'default',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('newWindowDimensions', "Controls the dimensions of opening a new window when at least one window is already opened. Note that this setting does not have an impact on the first window that is opened. The first window will always restore the size and location as you left it before closing.")
                },
                'window.closeWhenEmpty': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('closeWhenEmpty', "Controls whether closing the last editor should also close the window. This setting only applies for windows that do not show folders.")
                },
                'window.doubleClickIconToClose': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('window.doubleClickIconToClose', "If enabled, double clicking the application icon in the title bar will close the window and the window cannot be dragged by the icon. This setting only has an effect when `#window.titleBarStyle#` is set to `custom`.")
                },
                'window.titleBarStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': platform_2.isLinux ? 'native' : 'custom',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('titleBarStyle', "Adjust the appearance of the window title bar. On Linux and Windows, this setting also affects the application and context menu appearances. Changes require a full restart to apply.")
                },
                'window.dialogStyle': {
                    'type': 'string',
                    'enum': ['native', 'custom'],
                    'default': 'native',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('dialogStyle', "Adjust the appearance of dialog windows.")
                },
                'window.nativeTabs': {
                    'type': 'boolean',
                    'default': false,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('window.nativeTabs', "Enables macOS Sierra window tabs. Note that changes require a full restart to apply and that native tabs will disable a custom title bar style if configured."),
                    'included': platform_2.isMacintosh
                },
                'window.nativeFullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('window.nativeFullScreen', "Controls if native full-screen should be used on macOS. Disable this option to prevent macOS from creating a new space when going full-screen."),
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'included': platform_2.isMacintosh
                },
                'window.clickThroughInactive': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('window.clickThroughInactive', "If enabled, clicking on an inactive window will both activate the window and trigger the element under the mouse if it is clickable. If disabled, clicking anywhere on an inactive window will activate it only and a second click is required on the element."),
                    'included': platform_2.isMacintosh
                }
            }
        });
        // Telemetry
        registry.registerConfiguration({
            'id': 'telemetry',
            'order': 110,
            title: (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
            'type': 'object',
            'properties': {
                'telemetry.enableCrashReporter': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('telemetry.enableCrashReporting', "Enable crash reports to be collected. This helps us improve stability. \nThis option requires restart to take effect."),
                    'default': true,
                    'tags': ['usesOnlineServices', 'telemetry'],
                    'markdownDeprecationMessage': (0, nls_1.localize)('enableCrashReporterDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated due to being combined into the {0} setting.", `\`#${telemetry_1.TELEMETRY_SETTING_ID}#\``),
                }
            }
        });
        // Keybinding
        registry.registerConfiguration({
            'id': 'keyboard',
            'order': 15,
            'type': 'object',
            'title': (0, nls_1.localize)('keyboardConfigurationTitle', "Keyboard"),
            'properties': {
                'keyboard.touchbar.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('touchbar.enabled', "Enables the macOS touchbar buttons on the keyboard if available."),
                    'included': platform_2.isMacintosh
                },
                'keyboard.touchbar.ignored': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'default': [],
                    'markdownDescription': (0, nls_1.localize)('touchbar.ignored', 'A set of identifiers for entries in the touchbar that should not show up (for example `workbench.action.navigateBack`).'),
                    'included': platform_2.isMacintosh
                }
            }
        });
    })();
    // JSON Schemas
    (function registerJSONSchemas() {
        const argvDefinitionFileSchemaId = 'vscode://schemas/argv';
        const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        const schema = {
            id: argvDefinitionFileSchemaId,
            allowComments: true,
            allowTrailingCommas: true,
            description: 'VSCode static command line definition file',
            type: 'object',
            additionalProperties: false,
            properties: {
                locale: {
                    type: 'string',
                    description: (0, nls_1.localize)('argv.locale', 'The display Language to use. Picking a different language requires the associated language pack to be installed.')
                },
                'disable-hardware-acceleration': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.disableHardwareAcceleration', 'Disables hardware acceleration. ONLY change this option if you encounter graphic issues.')
                },
                'disable-color-correct-rendering': {
                    type: 'boolean',
                    description: (0, nls_1.localize)('argv.disableColorCorrectRendering', 'Resolves issues around color profile selection. ONLY change this option if you encounter graphic issues.')
                },
                'force-color-profile': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('argv.forceColorProfile', 'Allows to override the color profile to use. If you experience colors appear badly, try to set this to `srgb` and restart.')
                },
                'enable-crash-reporter': {
                    type: 'boolean',
                    markdownDescription: (0, nls_1.localize)('argv.enableCrashReporter', 'Allows to disable crash reporting, should restart the app if the value is changed.')
                },
                'crash-reporter-id': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('argv.crashReporterId', 'Unique id used for correlating crash reports sent from this app instance.')
                },
                'enable-proposed-api': {
                    type: 'array',
                    description: (0, nls_1.localize)('argv.enebleProposedApi', "Enable proposed APIs for a list of extension ids (such as \`vscode.git\`). Proposed APIs are unstable and subject to breaking without warning at any time. This should only be set for extension development and testing purposes."),
                    items: {
                        type: 'string'
                    }
                },
                'log-level': {
                    type: 'string',
                    description: (0, nls_1.localize)('argv.logLevel', "Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'.")
                }
            }
        };
        if (platform_2.isLinux) {
            schema.properties['force-renderer-accessibility'] = {
                type: 'boolean',
                description: (0, nls_1.localize)('argv.force-renderer-accessibility', 'Forces the renderer to be accessible. ONLY change this if you are using a screen reader on Linux. On other platforms the renderer will automatically be accessible. This flag is automatically set if you have editor.accessibilitySupport: on.'),
            };
        }
        jsonRegistry.registerSchema(argvDefinitionFileSchemaId, schema);
    })();
});
//# sourceMappingURL=desktop.contribution.js.map