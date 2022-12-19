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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/browser/coreCommands", "vs/editor/browser/editorBrowser", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/editor/common/editor", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/workbench/services/preferences/common/preferencesModels", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/editor/contrib/suggest/browser/suggestController"], function (require, exports, errors_1, event_1, json_1, lifecycle_1, network, uri_1, coreCommands_1, editorBrowser_1, model_1, language_1, resolverService_1, nls, configuration_1, configurationRegistry_1, editor_1, environment_1, extensions_1, instantiation_1, keybinding_1, label_1, notification_1, platform_1, telemetry_1, workspace_1, sideBySideEditorInput_1, textResourceEditorInput_1, jsonEditing_1, editorGroupsService_1, editorService_1, keybindingsEditorInput_1, preferences_1, preferencesEditorInput_1, preferencesModels_1, remoteAgentService_1, textEditorService_1, textfiles_1, types_1, suggestController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesService = void 0;
    const emptyEditableSettingsContent = '{\n}';
    let PreferencesService = class PreferencesService extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, textFileService, configurationService, notificationService, contextService, instantiationService, environmentService, telemetryService, textModelResolverService, keybindingService, modelService, jsonEditingService, languageService, labelService, remoteAgentService, textEditorService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.textModelResolverService = textModelResolverService;
            this.modelService = modelService;
            this.jsonEditingService = jsonEditingService;
            this.languageService = languageService;
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.textEditorService = textEditorService;
            this._onDispose = this._register(new event_1.Emitter());
            this.defaultKeybindingsResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/keybindings.json' });
            this.defaultSettingsRawResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/defaultSettings.json' });
            // The default keybindings.json updates based on keyboard layouts, so here we make sure
            // if a model has been given out we update it accordingly.
            this._register(keybindingService.onDidUpdateKeybindings(() => {
                const model = modelService.getModel(this.defaultKeybindingsResource);
                if (!model) {
                    // model has not been given out => nothing to do
                    return;
                }
                modelService.updateModel(model, (0, preferencesModels_1.defaultKeybindingsContents)(keybindingService));
            }));
        }
        get userSettingsResource() {
            return this.environmentService.settingsResource;
        }
        get workspaceSettingsResource() {
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return null;
            }
            const workspace = this.contextService.getWorkspace();
            return workspace.configuration || workspace.folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH);
        }
        get settingsEditor2Input() {
            return this.instantiationService.createInstance(preferencesEditorInput_1.SettingsEditor2Input);
        }
        getFolderSettingsResource(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            return folder ? folder.toResource(preferences_1.FOLDER_SETTINGS_PATH) : null;
        }
        resolveModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                // We opened a split json editor in this case,
                // and this half shows the default settings.
                const target = this.getConfigurationTargetFromDefaultSettingsResource(uri);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel('', languageSelection, uri));
                let defaultSettings;
                this.configurationService.onDidChangeConfiguration(e => {
                    if (e.source === 6 /* ConfigurationTarget.DEFAULT */) {
                        const model = this.modelService.getModel(uri);
                        if (!model) {
                            // model has not been given out => nothing to do
                            return;
                        }
                        defaultSettings = this.getDefaultSettings(target);
                        this.modelService.updateModel(model, defaultSettings.getContentWithoutMostCommonlyUsed(true));
                        defaultSettings._onDidChange.fire();
                    }
                });
                // Check if Default settings is already created and updated in above promise
                if (!defaultSettings) {
                    defaultSettings = this.getDefaultSettings(target);
                    this.modelService.updateModel(model, defaultSettings.getContentWithoutMostCommonlyUsed(true));
                }
                return model;
            }
            if (this.defaultSettingsRawResource.toString() === uri.toString()) {
                const defaultRawSettingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultRawSettingsEditorModel, this.getDefaultSettings(2 /* ConfigurationTarget.USER_LOCAL */));
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel(defaultRawSettingsEditorModel.content, languageSelection, uri));
                return model;
            }
            if (this.defaultKeybindingsResource.toString() === uri.toString()) {
                const defaultKeybindingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultKeybindingsEditorModel, uri);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel(defaultKeybindingsEditorModel.content, languageSelection, uri));
                return model;
            }
            return null;
        }
        async createPreferencesEditorModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                return this.createDefaultSettingsEditorModel(uri);
            }
            if (this.userSettingsResource.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(2 /* ConfigurationTarget.USER_LOCAL */, uri);
            }
            const workspaceSettingsUri = await this.getEditableSettingsURI(4 /* ConfigurationTarget.WORKSPACE */);
            if (workspaceSettingsUri && workspaceSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(4 /* ConfigurationTarget.WORKSPACE */, workspaceSettingsUri);
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const settingsUri = await this.getEditableSettingsURI(5 /* ConfigurationTarget.WORKSPACE_FOLDER */, uri);
                if (settingsUri && settingsUri.toString() === uri.toString()) {
                    return this.createEditableSettingsEditorModel(5 /* ConfigurationTarget.WORKSPACE_FOLDER */, uri);
                }
            }
            const remoteEnvironment = await this.remoteAgentService.getEnvironment();
            const remoteSettingsUri = remoteEnvironment ? remoteEnvironment.settingsPath : null;
            if (remoteSettingsUri && remoteSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(3 /* ConfigurationTarget.USER_REMOTE */, uri);
            }
            return null;
        }
        openRawDefaultSettings() {
            return this.editorService.openEditor({ resource: this.defaultSettingsRawResource });
        }
        openRawUserSettings() {
            return this.editorService.openEditor({ resource: this.userSettingsResource });
        }
        shouldOpenJsonByDefault() {
            return this.configurationService.getValue('workbench.settings.editor') === 'json';
        }
        openSettings(options = {}) {
            options = Object.assign(Object.assign({}, options), { target: 2 /* ConfigurationTarget.USER_LOCAL */ });
            if (options.query) {
                options.jsonEditor = false;
            }
            return this.open(this.userSettingsResource, options);
        }
        openLanguageSpecificSettings(languageId, options = {}) {
            var _a;
            if (this.shouldOpenJsonByDefault()) {
                options.query = undefined;
                options.revealSetting = { key: `[${languageId}]`, edit: true };
            }
            else {
                options.query = `@lang:${languageId}${options.query ? ` ${options.query}` : ''}`;
            }
            options.target = (_a = options.target) !== null && _a !== void 0 ? _a : 2 /* ConfigurationTarget.USER_LOCAL */;
            return this.open(this.userSettingsResource, options);
        }
        open(settingsResource, options) {
            var _a;
            options = Object.assign(Object.assign({}, options), { jsonEditor: (_a = options.jsonEditor) !== null && _a !== void 0 ? _a : this.shouldOpenJsonByDefault() });
            return options.jsonEditor ?
                this.openSettingsJson(settingsResource, options) :
                this.openSettings2(options);
        }
        async openSettings2(options) {
            const input = this.settingsEditor2Input;
            options = Object.assign(Object.assign({}, options), { focusSearch: true });
            await this.editorService.openEditor(input, (0, preferences_1.validateSettingsEditorOptions)(options), options.openToSide ? editorService_1.SIDE_GROUP : undefined);
            return this.editorGroupService.activeGroup.activeEditorPane;
        }
        openUserSettings(options = {}) {
            options = Object.assign(Object.assign({}, options), { target: 2 /* ConfigurationTarget.USER_LOCAL */ });
            return this.open(this.userSettingsResource, options);
        }
        async openRemoteSettings(options = {}) {
            const environment = await this.remoteAgentService.getEnvironment();
            if (environment) {
                options = Object.assign(Object.assign({}, options), { target: 3 /* ConfigurationTarget.USER_REMOTE */ });
                this.open(environment.settingsPath, options);
            }
            return undefined;
        }
        openWorkspaceSettings(options = {}) {
            if (!this.workspaceSettingsResource) {
                this.notificationService.info(nls.localize('openFolderFirst', "Open a folder or workspace first to create workspace or folder settings."));
                return Promise.reject(null);
            }
            options = Object.assign(Object.assign({}, options), { target: 4 /* ConfigurationTarget.WORKSPACE */ });
            return this.open(this.workspaceSettingsResource, options);
        }
        async openFolderSettings(options = {}) {
            options = Object.assign(Object.assign({}, options), { target: 5 /* ConfigurationTarget.WORKSPACE_FOLDER */ });
            if (!options.folderUri) {
                throw new Error(`Missing folder URI`);
            }
            const folderSettingsUri = await this.getEditableSettingsURI(5 /* ConfigurationTarget.WORKSPACE_FOLDER */, options.folderUri);
            if (!folderSettingsUri) {
                throw new Error(`Invalid folder URI - ${options.folderUri.toString()}`);
            }
            return this.open(folderSettingsUri, options);
        }
        async openGlobalKeybindingSettings(textual, options) {
            this.telemetryService.publicLog2('openKeybindings', { textual });
            options = Object.assign({ pinned: true, revealIfOpened: true }, options);
            if (textual) {
                const emptyContents = '// ' + nls.localize('emptyKeybindingsHeader', "Place your key bindings in this file to override the defaults") + '\n[\n]';
                const editableKeybindings = this.environmentService.keybindingsResource;
                const openDefaultKeybindings = !!this.configurationService.getValue('workbench.settings.openDefaultKeybindings');
                // Create as needed and open in editor
                await this.createIfNotExists(editableKeybindings, emptyContents);
                if (openDefaultKeybindings) {
                    const activeEditorGroup = this.editorGroupService.activeGroup;
                    const sideEditorGroup = this.editorGroupService.addGroup(activeEditorGroup.id, 3 /* GroupDirection.RIGHT */);
                    await Promise.all([
                        this.editorService.openEditor({ resource: this.defaultKeybindingsResource, options: { pinned: true, preserveFocus: true, revealIfOpened: true, override: editor_1.EditorResolution.DISABLED }, label: nls.localize('defaultKeybindings', "Default Keybindings"), description: '' }),
                        this.editorService.openEditor({ resource: editableKeybindings, options }, sideEditorGroup.id)
                    ]);
                }
                else {
                    await this.editorService.openEditor({ resource: editableKeybindings, options });
                }
            }
            else {
                const editor = (await this.editorService.openEditor(this.instantiationService.createInstance(keybindingsEditorInput_1.KeybindingsEditorInput), Object.assign(Object.assign({}, options), { override: editor_1.EditorResolution.DISABLED })));
                if (options.query) {
                    editor.search(options.query);
                }
            }
        }
        openDefaultKeybindingsFile() {
            return this.editorService.openEditor({ resource: this.defaultKeybindingsResource, label: nls.localize('defaultKeybindings', "Default Keybindings") });
        }
        async openSettingsJson(resource, options) {
            const group = (options === null || options === void 0 ? void 0 : options.openToSide) ? editorService_1.SIDE_GROUP : undefined;
            const editor = await this.doOpenSettingsJson(resource, options, group);
            if (editor && (options === null || options === void 0 ? void 0 : options.revealSetting)) {
                await this.revealSetting(options.revealSetting.key, !!options.revealSetting.edit, editor, resource);
            }
            return editor;
        }
        async doOpenSettingsJson(resource, options, group) {
            var _a;
            const openSplitJSON = !!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING);
            const openDefaultSettings = !!this.configurationService.getValue(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING);
            if (openSplitJSON || openDefaultSettings) {
                return this.doOpenSplitJSON(resource, options, group);
            }
            const configurationTarget = (_a = options === null || options === void 0 ? void 0 : options.target) !== null && _a !== void 0 ? _a : 1 /* ConfigurationTarget.USER */;
            const editableSettingsEditorInput = await this.getOrCreateEditableSettingsEditorInput(configurationTarget, resource);
            options = Object.assign(Object.assign({}, options), { pinned: true });
            return await this.editorService.openEditor(editableSettingsEditorInput, (0, preferences_1.validateSettingsEditorOptions)(options), group);
        }
        async doOpenSplitJSON(resource, options = {}, group) {
            var _a;
            const configurationTarget = (_a = options.target) !== null && _a !== void 0 ? _a : 1 /* ConfigurationTarget.USER */;
            await this.createSettingsIfNotExists(configurationTarget, resource);
            const preferencesEditorInput = this.createSplitJsonEditorInput(configurationTarget, resource);
            options = Object.assign(Object.assign({}, options), { pinned: true });
            return this.editorService.openEditor(preferencesEditorInput, (0, preferences_1.validateSettingsEditorOptions)(options), group);
        }
        createSplitJsonEditorInput(configurationTarget, resource) {
            const editableSettingsEditorInput = this.textEditorService.createTextEditor({ resource });
            const defaultPreferencesEditorInput = this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, this.getDefaultSettingsResource(configurationTarget), undefined, undefined, undefined, undefined);
            return this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, editableSettingsEditorInput.getName(), undefined, defaultPreferencesEditorInput, editableSettingsEditorInput);
        }
        createSettings2EditorModel() {
            return this.instantiationService.createInstance(preferencesModels_1.Settings2EditorModel, this.getDefaultSettings(2 /* ConfigurationTarget.USER_LOCAL */));
        }
        getConfigurationTargetFromDefaultSettingsResource(uri) {
            return this.isDefaultWorkspaceSettingsResource(uri) ?
                4 /* ConfigurationTarget.WORKSPACE */ :
                this.isDefaultFolderSettingsResource(uri) ?
                    5 /* ConfigurationTarget.WORKSPACE_FOLDER */ :
                    2 /* ConfigurationTarget.USER_LOCAL */;
        }
        isDefaultSettingsResource(uri) {
            return this.isDefaultUserSettingsResource(uri) || this.isDefaultWorkspaceSettingsResource(uri) || this.isDefaultFolderSettingsResource(uri);
        }
        isDefaultUserSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?settings\.json$/);
        }
        isDefaultWorkspaceSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?workspaceSettings\.json$/);
        }
        isDefaultFolderSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?resourceSettings\.json$/);
        }
        getDefaultSettingsResource(configurationTarget) {
            switch (configurationTarget) {
                case 4 /* ConfigurationTarget.WORKSPACE */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/workspaceSettings.json` });
                case 5 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/resourceSettings.json` });
            }
            return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/settings.json` });
        }
        async getOrCreateEditableSettingsEditorInput(target, resource) {
            await this.createSettingsIfNotExists(target, resource);
            return this.textEditorService.createTextEditor({ resource });
        }
        async createEditableSettingsEditorModel(configurationTarget, settingsUri) {
            const workspace = this.contextService.getWorkspace();
            if (workspace.configuration && workspace.configuration.toString() === settingsUri.toString()) {
                const reference = await this.textModelResolverService.createModelReference(settingsUri);
                return this.instantiationService.createInstance(preferencesModels_1.WorkspaceConfigurationEditorModel, reference, configurationTarget);
            }
            const reference = await this.textModelResolverService.createModelReference(settingsUri);
            return this.instantiationService.createInstance(preferencesModels_1.SettingsEditorModel, reference, configurationTarget);
        }
        async createDefaultSettingsEditorModel(defaultSettingsUri) {
            const reference = await this.textModelResolverService.createModelReference(defaultSettingsUri);
            const target = this.getConfigurationTargetFromDefaultSettingsResource(defaultSettingsUri);
            return this.instantiationService.createInstance(preferencesModels_1.DefaultSettingsEditorModel, defaultSettingsUri, reference, this.getDefaultSettings(target));
        }
        getDefaultSettings(target) {
            if (target === 4 /* ConfigurationTarget.WORKSPACE */) {
                if (!this._defaultWorkspaceSettingsContentModel) {
                    this._defaultWorkspaceSettingsContentModel = new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target);
                }
                return this._defaultWorkspaceSettingsContentModel;
            }
            if (target === 5 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                if (!this._defaultFolderSettingsContentModel) {
                    this._defaultFolderSettingsContentModel = new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target);
                }
                return this._defaultFolderSettingsContentModel;
            }
            if (!this._defaultUserSettingsContentModel) {
                this._defaultUserSettingsContentModel = new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target);
            }
            return this._defaultUserSettingsContentModel;
        }
        async getEditableSettingsURI(configurationTarget, resource) {
            switch (configurationTarget) {
                case 1 /* ConfigurationTarget.USER */:
                case 2 /* ConfigurationTarget.USER_LOCAL */:
                    return this.userSettingsResource;
                case 3 /* ConfigurationTarget.USER_REMOTE */: {
                    const remoteEnvironment = await this.remoteAgentService.getEnvironment();
                    return remoteEnvironment ? remoteEnvironment.settingsPath : null;
                }
                case 4 /* ConfigurationTarget.WORKSPACE */:
                    return this.workspaceSettingsResource;
                case 5 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    if (resource) {
                        return this.getFolderSettingsResource(resource);
                    }
            }
            return null;
        }
        async createSettingsIfNotExists(target, resource) {
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && target === 4 /* ConfigurationTarget.WORKSPACE */) {
                const workspaceConfig = this.contextService.getWorkspace().configuration;
                if (!workspaceConfig) {
                    return;
                }
                const content = await this.textFileService.read(workspaceConfig);
                if (Object.keys((0, json_1.parse)(content.value)).indexOf('settings') === -1) {
                    await this.jsonEditingService.write(resource, [{ path: ['settings'], value: {} }], true);
                }
                return undefined;
            }
            await this.createIfNotExists(resource, emptyEditableSettingsContent);
        }
        async createIfNotExists(resource, contents) {
            try {
                await this.textFileService.read(resource, { acceptTextOnly: true });
            }
            catch (error) {
                if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    try {
                        await this.textFileService.write(resource, contents);
                        return;
                    }
                    catch (error2) {
                        throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", this.labelService.getUriLabel(resource, { relative: true }), (0, errors_1.getErrorMessage)(error2)));
                    }
                }
                else {
                    throw error;
                }
            }
        }
        getMostCommonlyUsedSettings() {
            return [
                'files.autoSave',
                'editor.fontSize',
                'editor.fontFamily',
                'editor.tabSize',
                'editor.renderWhitespace',
                'editor.cursorStyle',
                'editor.multiCursorModifier',
                'editor.insertSpaces',
                'editor.wordWrap',
                'files.exclude',
                'files.associations',
                'workbench.editor.enablePreview'
            ];
        }
        async revealSetting(settingKey, edit, editor, settingsResource) {
            var _a;
            const codeEditor = editor ? (0, editorBrowser_1.getCodeEditor)(editor.getControl()) : null;
            if (!codeEditor) {
                return;
            }
            const settingsModel = await this.createPreferencesEditorModel(settingsResource);
            if (!settingsModel) {
                return;
            }
            const position = await this.getPositionToReveal(settingKey, edit, settingsModel, codeEditor);
            if (position) {
                codeEditor.setPosition(position);
                codeEditor.revealPositionNearTop(position);
                codeEditor.focus();
                if (edit) {
                    (_a = suggestController_1.SuggestController.get(codeEditor)) === null || _a === void 0 ? void 0 : _a.triggerSuggest();
                }
            }
        }
        async getPositionToReveal(settingKey, edit, settingsModel, codeEditor) {
            var _a;
            const model = codeEditor.getModel();
            if (!model) {
                return null;
            }
            const schema = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()[settingKey];
            const isOverrideProperty = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(settingKey);
            if (!schema && !isOverrideProperty) {
                return null;
            }
            let position = null;
            const type = (_a = schema === null || schema === void 0 ? void 0 : schema.type) !== null && _a !== void 0 ? _a : 'object' /* Type not defined or is an Override Identifier */;
            let setting = settingsModel.getPreference(settingKey);
            if (!setting && edit) {
                let defaultValue = (type === 'object' || type === 'array') ? this.configurationService.inspect(settingKey).defaultValue : (0, configurationRegistry_1.getDefaultValue)(type);
                defaultValue = defaultValue === undefined && isOverrideProperty ? {} : defaultValue;
                if (defaultValue !== undefined) {
                    const key = settingsModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel ? ['settings', settingKey] : [settingKey];
                    await this.jsonEditingService.write(settingsModel.uri, [{ path: key, value: defaultValue }], false);
                    setting = settingsModel.getPreference(settingKey);
                }
            }
            if (setting) {
                if (edit) {
                    if ((0, types_1.isObject)(setting.value) || (0, types_1.isArray)(setting.value)) {
                        position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.startColumn + 1 };
                        codeEditor.setPosition(position);
                        await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                        position = { lineNumber: position.lineNumber + 1, column: model.getLineMaxColumn(position.lineNumber + 1) };
                        const firstNonWhiteSpaceColumn = model.getLineFirstNonWhitespaceColumn(position.lineNumber);
                        if (firstNonWhiteSpaceColumn) {
                            // Line has some text. Insert another new line.
                            codeEditor.setPosition({ lineNumber: position.lineNumber, column: firstNonWhiteSpaceColumn });
                            await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                            position = { lineNumber: position.lineNumber, column: model.getLineMaxColumn(position.lineNumber) };
                        }
                    }
                    else {
                        position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.endColumn };
                    }
                }
                else {
                    position = { lineNumber: setting.keyRange.startLineNumber, column: setting.keyRange.startColumn };
                }
            }
            return position;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    PreferencesService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, environment_1.IEnvironmentService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, resolverService_1.ITextModelService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, model_1.IModelService),
        __param(12, jsonEditing_1.IJSONEditingService),
        __param(13, language_1.ILanguageService),
        __param(14, label_1.ILabelService),
        __param(15, remoteAgentService_1.IRemoteAgentService),
        __param(16, textEditorService_1.ITextEditorService)
    ], PreferencesService);
    exports.PreferencesService = PreferencesService;
    (0, extensions_1.registerSingleton)(preferences_1.IPreferencesService, PreferencesService);
});
//# sourceMappingURL=preferencesService.js.map