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
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/types", "vs/editor/browser/editorExtensions", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/preferences/browser/keybindingsEditor", "vs/workbench/contrib/preferences/browser/preferencesActions", "vs/workbench/contrib/preferences/browser/preferencesEditor", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/browser/settingsEditor2", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/contrib/preferences/common/preferencesContribution", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/css!./media/preferences"], function (require, exports, keyCodes_1, lifecycle_1, network_1, types_1, editorExtensions_1, suggest_1, nls, actions_1, commands_1, contextkey_1, contextkeys_1, descriptors_1, instantiation_1, keybindingsRegistry_1, label_1, platform_1, workspace_1, workspaceCommands_1, editor_1, contributions_1, editor_2, contextkeys_2, files_1, keybindingsEditor_1, preferencesActions_1, preferencesEditor_1, preferencesIcons_1, settingsEditor2_1, preferences_1, preferencesContribution_1, editorService_1, environmentService_1, extensions_1, keybindingsEditorInput_1, preferences_2, preferencesEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SETTINGS_EDITOR_COMMAND_SEARCH = 'settings.action.search';
    const SETTINGS_EDITOR_COMMAND_FOCUS_FILE = 'settings.action.focusSettingsFile';
    const SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_FROM_SEARCH = 'settings.action.focusSettingsFromSearch';
    const SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_LIST = 'settings.action.focusSettingsList';
    const SETTINGS_EDITOR_COMMAND_FOCUS_TOC = 'settings.action.focusTOC';
    const SETTINGS_EDITOR_COMMAND_FOCUS_CONTROL = 'settings.action.focusSettingControl';
    const SETTINGS_EDITOR_COMMAND_FOCUS_UP = 'settings.action.focusLevelUp';
    const SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON = 'settings.switchToJSON';
    const SETTINGS_EDITOR_COMMAND_FILTER_ONLINE = 'settings.filterByOnline';
    const SETTINGS_EDITOR_COMMAND_FILTER_TELEMETRY = 'settings.filterByTelemetry';
    const SETTINGS_EDITOR_COMMAND_FILTER_UNTRUSTED = 'settings.filterUntrusted';
    const SETTINGS_COMMAND_OPEN_SETTINGS = 'workbench.action.openSettings';
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(settingsEditor2_1.SettingsEditor2, settingsEditor2_1.SettingsEditor2.ID, nls.localize('settingsEditor2', "Settings Editor 2")), [
        new descriptors_1.SyncDescriptor(preferencesEditorInput_1.SettingsEditor2Input)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(keybindingsEditor_1.KeybindingsEditor, keybindingsEditor_1.KeybindingsEditor.ID, nls.localize('keybindingsEditor', "Keybindings Editor")), [
        new descriptors_1.SyncDescriptor(keybindingsEditorInput_1.KeybindingsEditorInput)
    ]);
    class KeybindingsEditorInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(keybindingsEditorInput_1.KeybindingsEditorInput);
        }
    }
    class SettingsEditor2InputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(input) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(preferencesEditorInput_1.SettingsEditor2Input);
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(keybindingsEditorInput_1.KeybindingsEditorInput.ID, KeybindingsEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(preferencesEditorInput_1.SettingsEditor2Input.ID, SettingsEditor2InputSerializer);
    const OPEN_SETTINGS2_ACTION_TITLE = { value: nls.localize('openSettings2', "Open Settings (UI)"), original: 'Open Settings (UI)' };
    const category = { value: nls.localize('preferences', "Preferences"), original: 'Preferences' };
    function sanitizeOpenSettingsArgs(args) {
        if (!(0, types_1.isObject)(args)) {
            args = {};
        }
        return {
            openToSide: args.openToSide,
            query: args.query
        };
    }
    let PreferencesActionsContribution = class PreferencesActionsContribution extends lifecycle_1.Disposable {
        constructor(environmentService, preferencesService, workspaceContextService, labelService, extensionService) {
            super();
            this.environmentService = environmentService;
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.labelService = labelService;
            this.extensionService = extensionService;
            this.registerSettingsActions();
            this.registerKeybindingsActions();
            this.updatePreferencesEditorMenuItem();
            this._register(workspaceContextService.onDidChangeWorkbenchState(() => this.updatePreferencesEditorMenuItem()));
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => this.updatePreferencesEditorMenuItemForWorkspaceFolders()));
        }
        registerSettingsActions() {
            const that = this;
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_COMMAND_OPEN_SETTINGS,
                        title: nls.localize('settings', "Settings"),
                        keybinding: {
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null,
                            primary: 2048 /* KeyMod.CtrlCmd */ | 82 /* KeyCode.Comma */,
                        },
                        menu: {
                            id: actions_1.MenuId.GlobalActivity,
                            group: '2_configuration',
                            order: 1
                        }
                    });
                }
                run(accessor, args) {
                    // args takes a string for backcompat
                    const opts = typeof args === 'string' ? { query: args } : sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openSettings(opts);
                }
            });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
                group: '1_settings',
                command: {
                    id: SETTINGS_COMMAND_OPEN_SETTINGS,
                    title: nls.localize({ key: 'miOpenSettings', comment: ['&& denotes a mnemonic'] }, "&&Settings")
                },
                order: 1
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openSettings2',
                        title: { value: nls.localize('openSettings2', "Open Settings (UI)"), original: 'Open Settings (UI)' },
                        category,
                        f1: true,
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openSettings(Object.assign({ jsonEditor: false }, args));
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openSettingsJson',
                        title: { value: nls.localize('openSettingsJson', "Open Settings (JSON)"), original: 'Open Settings (JSON)' },
                        category,
                        f1: true,
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openSettings(Object.assign({ jsonEditor: true }, args));
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openGlobalSettings',
                        title: { value: nls.localize('openGlobalSettings', "Open User Settings"), original: 'Open User Settings' },
                        category,
                        f1: true,
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openUserSettings(args);
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openRawDefaultSettings',
                        title: { value: nls.localize('openRawDefaultSettings', "Open Default Settings (JSON)"), original: 'Open Default Settings (JSON)' },
                        category,
                        f1: true,
                    });
                }
                run(accessor) {
                    return accessor.get(preferences_2.IPreferencesService).openRawDefaultSettings();
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: '_workbench.openUserSettingsEditor',
                        title: OPEN_SETTINGS2_ACTION_TITLE,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        menu: [{
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.ResourceContextKey.Resource.isEqualTo(that.environmentService.settingsResource.toString()), contextkey_1.ContextKeyExpr.not('isInDiffEditor')),
                                group: 'navigation',
                                order: 1
                            }]
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openUserSettings(Object.assign({ jsonEditor: false }, args));
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON,
                        title: { value: nls.localize('openSettingsJson', "Open Settings (JSON)"), original: 'Open Settings (JSON)' },
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        menu: [{
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated()),
                                group: 'navigation',
                                order: 1
                            }]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof settingsEditor2_1.SettingsEditor2) {
                        return editorPane.switchToSettingsFile();
                    }
                    return null;
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferencesActions_1.ConfigureLanguageBasedSettingsAction.ID,
                        title: preferencesActions_1.ConfigureLanguageBasedSettingsAction.LABEL,
                        category,
                        f1: true,
                    });
                }
                run(accessor) {
                    return accessor.get(instantiation_1.IInstantiationService).createInstance(preferencesActions_1.ConfigureLanguageBasedSettingsAction, preferencesActions_1.ConfigureLanguageBasedSettingsAction.ID, preferencesActions_1.ConfigureLanguageBasedSettingsAction.LABEL.value).run();
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openWorkspaceSettings',
                        title: { value: nls.localize('openWorkspaceSettings', "Open Workspace Settings"), original: 'Open Workspace Settings' },
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.notEqualsTo('empty')
                        }
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openWorkspaceSettings(args);
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openWorkspaceSettingsFile',
                        title: { value: nls.localize('openWorkspaceSettingsFile', "Open Workspace Settings (JSON)"), original: 'Open Workspace Settings (JSON)' },
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.notEqualsTo('empty')
                        }
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openWorkspaceSettings(Object.assign({ jsonEditor: true }, args));
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openFolderSettings',
                        title: { value: nls.localize('openFolderSettings', "Open Folder Settings"), original: 'Open Folder Settings' },
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.isEqualTo('workspace')
                        }
                    });
                }
                async run(accessor, args) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const preferencesService = accessor.get(preferences_2.IPreferencesService);
                    const workspaceFolder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
                    if (workspaceFolder) {
                        args = sanitizeOpenSettingsArgs(args);
                        await preferencesService.openFolderSettings(Object.assign({ folderUri: workspaceFolder.uri }, args));
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openFolderSettingsFile',
                        title: { value: nls.localize('openFolderSettingsFile', "Open Folder Settings (JSON)"), original: 'Open Folder Settings (JSON)' },
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.isEqualTo('workspace')
                        }
                    });
                }
                async run(accessor, args) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const preferencesService = accessor.get(preferences_2.IPreferencesService);
                    const workspaceFolder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
                    if (workspaceFolder) {
                        args = sanitizeOpenSettingsArgs(args);
                        await preferencesService.openFolderSettings(Object.assign({ folderUri: workspaceFolder.uri, jsonEditor: true }, args));
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: '_workbench.action.openFolderSettings',
                        title: { value: nls.localize('openFolderSettings', "Open Folder Settings"), original: 'Open Folder Settings' },
                        category,
                        menu: {
                            id: actions_1.MenuId.ExplorerContext,
                            group: '2_workspace',
                            order: 20,
                            when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext)
                        }
                    });
                }
                run(accessor, resource) {
                    return accessor.get(preferences_2.IPreferencesService).openFolderSettings({ folderUri: resource });
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FILTER_ONLINE,
                        title: nls.localize({ key: 'miOpenOnlineSettings', comment: ['&& denotes a mnemonic'] }, "&&Online Services Settings"),
                        menu: {
                            id: actions_1.MenuId.MenubarPreferencesMenu,
                            group: '1_settings',
                            order: 2,
                        }
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof settingsEditor2_1.SettingsEditor2) {
                        editorPane.focusSearch(`@tag:usesOnlineServices`);
                    }
                    else {
                        accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:usesOnlineServices' });
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FILTER_TELEMETRY,
                        title: { value: nls.localize('showTelemtrySettings', "Telemetry Settings"), original: 'Telemetry Settings' },
                        menu: {
                            id: actions_1.MenuId.MenubarPreferencesMenu,
                            group: '1_settings',
                            order: 3,
                        }
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof settingsEditor2_1.SettingsEditor2) {
                        editorPane.focusSearch('@tag:telemetry');
                    }
                    else {
                        accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:telemetry' });
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FILTER_UNTRUSTED,
                        title: { value: nls.localize('filterUntrusted', "Show untrusted workspace settings"), original: 'Show untrusted workspace settings' },
                    });
                }
                run(accessor) {
                    accessor.get(preferences_2.IPreferencesService).openWorkspaceSettings({ jsonEditor: false, query: `@tag:${preferences_1.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG}` });
                }
            });
            this.registerSettingsEditorActions();
            this.extensionService.whenInstalledExtensionsRegistered()
                .then(() => {
                const remoteAuthority = this.environmentService.remoteAuthority;
                const hostLabel = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAuthority) || remoteAuthority;
                const label = nls.localize('openRemoteSettings', "Open Remote Settings ({0})", hostLabel);
                (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.action.openRemoteSettings',
                            title: { value: label, original: `Open Remote Settings (${hostLabel})` },
                            category,
                            menu: {
                                id: actions_1.MenuId.CommandPalette,
                                when: contextkeys_2.RemoteNameContext.notEqualsTo('')
                            }
                        });
                    }
                    run(accessor, args) {
                        args = sanitizeOpenSettingsArgs(args);
                        return accessor.get(preferences_2.IPreferencesService).openRemoteSettings(args);
                    }
                });
                const jsonLabel = nls.localize('openRemoteSettingsJSON', "Open Remote Settings (JSON) ({0})", hostLabel);
                (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.action.openRemoteSettingsFile',
                            title: { value: jsonLabel, original: `Open Remote Settings (JSON) (${hostLabel})` },
                            category,
                            menu: {
                                id: actions_1.MenuId.CommandPalette,
                                when: contextkeys_2.RemoteNameContext.notEqualsTo('')
                            }
                        });
                    }
                    run(accessor, args) {
                        args = sanitizeOpenSettingsArgs(args);
                        return accessor.get(preferences_2.IPreferencesService).openRemoteSettings(Object.assign({ jsonEditor: true }, args));
                    }
                });
            });
        }
        registerSettingsEditorActions() {
            function getPreferencesEditor(accessor) {
                const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                if (activeEditorPane instanceof settingsEditor2_1.SettingsEditor2) {
                    return activeEditorPane;
                }
                return null;
            }
            function settingsEditorFocusSearch(accessor) {
                const preferencesEditor = getPreferencesEditor(accessor);
                if (preferencesEditor) {
                    preferencesEditor.focusSearch();
                }
            }
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_SEARCH,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        keybinding: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: null
                        },
                        category,
                        f1: true,
                        title: { value: nls.localize('settings.focusSearch', "Focus Settings Search"), original: 'Focus Settings Search' }
                    });
                }
                run(accessor) { settingsEditorFocusSearch(accessor); }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        keybinding: {
                            primary: 9 /* KeyCode.Escape */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS
                        },
                        category,
                        f1: true,
                        title: { value: nls.localize('settings.clearResults', "Clear Settings Search Results"), original: 'Clear Settings Search Results' }
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (preferencesEditor) {
                        preferencesEditor.clearSearchResults();
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_FILE,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS, suggest_1.Context.Visible.toNegated()),
                        keybinding: {
                            primary: 18 /* KeyCode.DownArrow */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: null
                        },
                        title: nls.localize('settings.focusFile', "Focus settings file")
                    });
                }
                run(accessor, args) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    preferencesEditor === null || preferencesEditor === void 0 ? void 0 : preferencesEditor.focusSettings();
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_FROM_SEARCH,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS, suggest_1.Context.Visible.toNegated()),
                        keybinding: {
                            primary: 18 /* KeyCode.DownArrow */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        title: nls.localize('settings.focusFile', "Focus settings file")
                    });
                }
                run(accessor, args) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    preferencesEditor === null || preferencesEditor === void 0 ? void 0 : preferencesEditor.focusSettings();
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_LIST,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_TOC_ROW_FOCUS),
                        keybinding: {
                            primary: 3 /* KeyCode.Enter */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        title: nls.localize('settings.focusSettingsList', "Focus settings list")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (preferencesEditor instanceof settingsEditor2_1.SettingsEditor2) {
                        preferencesEditor.focusSettings();
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_TOC,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        f1: true,
                        keybinding: [
                            {
                                primary: 15 /* KeyCode.LeftArrow */,
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: preferences_1.CONTEXT_SETTINGS_ROW_FOCUS
                            }
                        ],
                        category,
                        title: { value: nls.localize('settings.focusSettingsTOC', "Focus Settings Table of Contents"), original: 'Focus Settings Table of Contents' }
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (!(preferencesEditor instanceof settingsEditor2_1.SettingsEditor2)) {
                        return;
                    }
                    preferencesEditor.focusTOC();
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_CONTROL,
                        precondition: preferences_1.CONTEXT_SETTINGS_ROW_FOCUS,
                        keybinding: {
                            primary: 3 /* KeyCode.Enter */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        },
                        title: nls.localize('settings.focusSettingControl', "Focus Setting Control")
                    });
                }
                run(accessor) {
                    var _a;
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (!(preferencesEditor instanceof settingsEditor2_1.SettingsEditor2)) {
                        return;
                    }
                    if ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.classList.contains('monaco-list')) {
                        preferencesEditor.focusSettings(true);
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        keybinding: {
                            primary: 1024 /* KeyMod.Shift */ | 67 /* KeyCode.F9 */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        f1: true,
                        category,
                        title: { value: nls.localize('settings.showContextMenu', "Show Setting Context Menu"), original: 'Show Setting Context Menu' }
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (preferencesEditor instanceof settingsEditor2_1.SettingsEditor2) {
                        preferencesEditor.showContextMenu();
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_UP,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS.toNegated(), preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated()),
                        keybinding: {
                            primary: 9 /* KeyCode.Escape */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        f1: true,
                        category,
                        title: { value: nls.localize('settings.focusLevelUp', "Move Focus Up One Level"), original: 'Move Focus Up One Level' }
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (!(preferencesEditor instanceof settingsEditor2_1.SettingsEditor2)) {
                        return;
                    }
                    if (preferencesEditor.currentFocusContext === 3 /* SettingsFocusContext.SettingControl */) {
                        preferencesEditor.focusSettings();
                    }
                    else if (preferencesEditor.currentFocusContext === 2 /* SettingsFocusContext.SettingTree */) {
                        preferencesEditor.focusTOC();
                    }
                    else if (preferencesEditor.currentFocusContext === 1 /* SettingsFocusContext.TableOfContents */) {
                        preferencesEditor.focusSearch();
                    }
                }
            });
        }
        registerKeybindingsActions() {
            const that = this;
            const category = { value: nls.localize('preferences', "Preferences"), original: 'Preferences' };
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openGlobalKeybindings',
                        title: { value: nls.localize('openGlobalKeybindings', "Open Keyboard Shortcuts"), original: 'Open Keyboard Shortcuts' },
                        category,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        keybinding: {
                            when: null,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 49 /* KeyCode.KeyS */)
                        },
                        menu: [
                            { id: actions_1.MenuId.CommandPalette },
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkeys_2.ResourceContextKey.Resource.isEqualTo(that.environmentService.keybindingsResource.toString()),
                                group: 'navigation',
                                order: 1,
                            }
                        ]
                    });
                }
                run(accessor, args) {
                    const query = typeof args === 'string' ? args : undefined;
                    return accessor.get(preferences_2.IPreferencesService).openGlobalKeybindingSettings(false, { query });
                }
            });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
                command: {
                    id: 'workbench.action.openGlobalKeybindings',
                    title: { value: nls.localize('Keyboard Shortcuts', "Keyboard Shortcuts"), original: 'Keyboard Shortcuts' }
                },
                group: '2_keybindings',
                order: 1
            });
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
                command: {
                    id: 'workbench.action.openGlobalKeybindings',
                    title: { value: nls.localize('Keyboard Shortcuts', "Keyboard Shortcuts"), original: 'Keyboard Shortcuts' }
                },
                group: '2_keybindings',
                order: 1
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openDefaultKeybindingsFile',
                        title: { value: nls.localize('openDefaultKeybindingsFile', "Open Default Keyboard Shortcuts (JSON)"), original: 'Open Default Keyboard Shortcuts (JSON)' },
                        category,
                        menu: { id: actions_1.MenuId.CommandPalette }
                    });
                }
                run(accessor) {
                    return accessor.get(preferences_2.IPreferencesService).openDefaultKeybindingsFile();
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openGlobalKeybindingsFile',
                        title: { value: nls.localize('openGlobalKeybindingsFile', "Open Keyboard Shortcuts (JSON)"), original: 'Open Keyboard Shortcuts (JSON)' },
                        category,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        menu: [
                            { id: actions_1.MenuId.CommandPalette },
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: 'navigation',
                            }
                        ]
                    });
                }
                run(accessor) {
                    return accessor.get(preferences_2.IPreferencesService).openGlobalKeybindingSettings(true);
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS,
                        title: { value: nls.localize('showDefaultKeybindings', "Show Default Keybindings"), original: 'Show Default Keybindings' },
                        menu: [
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: '1_keyboard_preferences_actions'
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.search('@source:default');
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS,
                        title: { value: nls.localize('showExtensionKeybindings', "Show Extension Keybindings"), original: 'Show Extension Keybindings' },
                        menu: [
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: '1_keyboard_preferences_actions'
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.search('@source:extension');
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS,
                        title: { value: nls.localize('showUserKeybindings', "Show User Keybindings"), original: 'Show User Keybindings' },
                        menu: [
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: '1_keyboard_preferences_actions'
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.search('@source:user');
                    }
                }
            });
            (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS,
                        title: nls.localize('clear', "Clear Search Results"),
                        keybinding: {
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
                            primary: 9 /* KeyCode.Escape */,
                        }
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.clearSearchResults();
                    }
                }
            });
            this.registerKeybindingEditorActions();
        }
        registerKeybindingEditorActions() {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 3 /* KeyCode.Enter */,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.defineKeybinding(editorPane.activeKeybindingEntry, false);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_ADD,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */),
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.defineKeybinding(editorPane.activeKeybindingEntry, true);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */),
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor && editorPane.activeKeybindingEntry.keybindingItem.keybinding) {
                        editorPane.defineWhenExpression(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS, contextkeys_1.InputFocusedContext.toNegated()),
                primary: 20 /* KeyCode.Delete */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
                },
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.removeKeybinding(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.resetKeybinding(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SEARCH,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.focusSearch();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
                primary: 512 /* KeyMod.Alt */ | 41 /* KeyCode.KeyK */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 41 /* KeyCode.KeyK */ },
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.recordSearchKeys();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                primary: 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */ },
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.toggleSortByPrecedence();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.showSimilarKeybindings(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS, preferences_1.CONTEXT_WHEN_FOCUS.negate()),
                primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        await editorPane.copyKeybinding(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        await editorPane.copyKeybindingCommand(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        await editorPane.copyKeybindingCommandTitle(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
                primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.focusKeybindings();
                    }
                }
            });
        }
        updatePreferencesEditorMenuItem() {
            const commandId = '_workbench.openWorkspaceSettingsEditor';
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && !commands_1.CommandsRegistry.getCommand(commandId)) {
                commands_1.CommandsRegistry.registerCommand(commandId, () => this.preferencesService.openWorkspaceSettings({ jsonEditor: false }));
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
                    command: {
                        id: commandId,
                        title: OPEN_SETTINGS2_ACTION_TITLE,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon
                    },
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_2.ResourceContextKey.Resource.isEqualTo(this.preferencesService.workspaceSettingsResource.toString()), contextkeys_2.WorkbenchStateContext.isEqualTo('workspace'), contextkey_1.ContextKeyExpr.not('isInDiffEditor')),
                    group: 'navigation',
                    order: 1
                });
            }
            this.updatePreferencesEditorMenuItemForWorkspaceFolders();
        }
        updatePreferencesEditorMenuItemForWorkspaceFolders() {
            for (const folder of this.workspaceContextService.getWorkspace().folders) {
                const commandId = `_workbench.openFolderSettings.${folder.uri.toString()}`;
                if (!commands_1.CommandsRegistry.getCommand(commandId)) {
                    commands_1.CommandsRegistry.registerCommand(commandId, () => {
                        if (this.workspaceContextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                            return this.preferencesService.openWorkspaceSettings({ jsonEditor: false });
                        }
                        else {
                            return this.preferencesService.openFolderSettings({ folderUri: folder.uri, jsonEditor: false });
                        }
                    });
                    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
                        command: {
                            id: commandId,
                            title: OPEN_SETTINGS2_ACTION_TITLE,
                            icon: preferencesIcons_1.preferencesOpenSettingsIcon
                        },
                        when: contextkey_1.ContextKeyExpr.and(contextkeys_2.ResourceContextKey.Resource.isEqualTo(this.preferencesService.getFolderSettingsResource(folder.uri).toString()), contextkey_1.ContextKeyExpr.not('isInDiffEditor')),
                        group: 'navigation',
                        order: 1
                    });
                }
            }
        }
    };
    PreferencesActionsContribution = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, preferences_2.IPreferencesService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, label_1.ILabelService),
        __param(4, extensions_1.IExtensionService)
    ], PreferencesActionsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(PreferencesActionsContribution, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(preferencesContribution_1.PreferencesContribution, 1 /* LifecyclePhase.Starting */);
    (0, editorExtensions_1.registerEditorContribution)(preferencesEditor_1.SettingsEditorContribution.ID, preferencesEditor_1.SettingsEditorContribution);
    // Preferences menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        title: nls.localize({ key: 'miPreferences', comment: ['&& denotes a mnemonic'] }, "&&Preferences"),
        submenu: actions_1.MenuId.MenubarPreferencesMenu,
        group: '5_autosave',
        order: 2,
        when: contextkeys_1.IsMacNativeContext.toNegated() // on macOS native the preferences menu is separate under the application menu
    });
});
//# sourceMappingURL=preferences.contribution.js.map