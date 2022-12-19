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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/contrib/codeAction/browser/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/codeeditor", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/services/languageFeatures"], function (require, exports, dom_1, actions_1, async_1, event_1, lifecycle_1, map_1, position_1, range_1, textModel_1, types_1, nls, configuration_1, configurationRegistry_1, contextView_1, instantiation_1, markers_1, platform_1, themeService_1, workspace_1, workspaceTrust_1, codeeditor_1, preferencesIcons_1, preferencesWidgets_1, environmentService_1, preferences_1, preferencesModels_1, uriIdentity_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceSettingsRenderer = exports.UserSettingsRenderer = void 0;
    let UserSettingsRenderer = class UserSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super();
            this.editor = editor;
            this.preferencesModel = preferencesModel;
            this.preferencesService = preferencesService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.modelChangeDelayer = new async_1.Delayer(200);
            this.settingHighlighter = this._register(instantiationService.createInstance(SettingHighlighter, editor));
            this.editSettingActionRenderer = this._register(this.instantiationService.createInstance(EditSettingRenderer, this.editor, this.preferencesModel, this.settingHighlighter));
            this._register(this.editSettingActionRenderer.onUpdateSetting(({ key, value, source }) => this.updatePreference(key, value, source)));
            this._register(this.editor.getModel().onDidChangeContent(() => this.modelChangeDelayer.trigger(() => this.onModelChanged())));
            this.unsupportedSettingsRenderer = this._register(instantiationService.createInstance(UnsupportedSettingsRenderer, editor, preferencesModel));
        }
        render() {
            this.editSettingActionRenderer.render(this.preferencesModel.settingsGroups, this.associatedPreferencesModel);
            this.unsupportedSettingsRenderer.render();
        }
        updatePreference(key, value, source) {
            const overrideIdentifiers = source.overrideOf ? (0, configurationRegistry_1.overrideIdentifiersFromKey)(source.overrideOf.key) : null;
            const resource = this.preferencesModel.uri;
            this.configurationService.updateValue(key, value, { overrideIdentifiers, resource }, this.preferencesModel.configurationTarget)
                .then(() => this.onSettingUpdated(source));
        }
        onModelChanged() {
            if (!this.editor.hasModel()) {
                // model could have been disposed during the delay
                return;
            }
            this.render();
        }
        onSettingUpdated(setting) {
            this.editor.focus();
            setting = this.getSetting(setting);
            if (setting) {
                // TODO:@sandy Selection range should be template range
                this.editor.setSelection(setting.valueRange);
                this.settingHighlighter.highlight(setting, true);
            }
        }
        getSetting(setting) {
            const { key, overrideOf } = setting;
            if (overrideOf) {
                const setting = this.getSetting(overrideOf);
                for (const override of setting.overrides) {
                    if (override.key === key) {
                        return override;
                    }
                }
                return undefined;
            }
            return this.preferencesModel.getPreference(key);
        }
        focusPreference(setting) {
            const s = this.getSetting(setting);
            if (s) {
                this.settingHighlighter.highlight(s, true);
                this.editor.setPosition({ lineNumber: s.keyRange.startLineNumber, column: s.keyRange.startColumn });
            }
            else {
                this.settingHighlighter.clear(true);
            }
        }
        clearFocus(setting) {
            this.settingHighlighter.clear(true);
        }
        editPreference(setting) {
            const editableSetting = this.getSetting(setting);
            return !!(editableSetting && this.editSettingActionRenderer.activateOnSetting(editableSetting));
        }
    };
    UserSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], UserSettingsRenderer);
    exports.UserSettingsRenderer = UserSettingsRenderer;
    let WorkspaceSettingsRenderer = class WorkspaceSettingsRenderer extends UserSettingsRenderer {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super(editor, preferencesModel, preferencesService, configurationService, instantiationService);
            this.workspaceConfigurationRenderer = this._register(instantiationService.createInstance(WorkspaceConfigurationRenderer, editor, preferencesModel));
        }
        render() {
            super.render();
            this.workspaceConfigurationRenderer.render();
        }
    };
    WorkspaceSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], WorkspaceSettingsRenderer);
    exports.WorkspaceSettingsRenderer = WorkspaceSettingsRenderer;
    let EditSettingRenderer = class EditSettingRenderer extends lifecycle_1.Disposable {
        constructor(editor, primarySettingsModel, settingHighlighter, instantiationService, contextMenuService) {
            super();
            this.editor = editor;
            this.primarySettingsModel = primarySettingsModel;
            this.settingHighlighter = settingHighlighter;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.settingsGroups = [];
            this._onUpdateSetting = new event_1.Emitter();
            this.onUpdateSetting = this._onUpdateSetting.event;
            this.editPreferenceWidgetForCursorPosition = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.editPreferenceWidgetForMouseMove = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.toggleEditPreferencesForMouseMoveDelayer = new async_1.Delayer(75);
            this._register(this.editPreferenceWidgetForCursorPosition.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForCursorPosition, e)));
            this._register(this.editPreferenceWidgetForMouseMove.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForMouseMove, e)));
            this._register(this.editor.onDidChangeCursorPosition(positionChangeEvent => this.onPositionChanged(positionChangeEvent)));
            this._register(this.editor.onMouseMove(mouseMoveEvent => this.onMouseMoved(mouseMoveEvent)));
            this._register(this.editor.onDidChangeConfiguration(() => this.onConfigurationChanged()));
        }
        render(settingsGroups, associatedPreferencesModel) {
            this.editPreferenceWidgetForCursorPosition.hide();
            this.editPreferenceWidgetForMouseMove.hide();
            this.settingsGroups = settingsGroups;
            this.associatedPreferencesModel = associatedPreferencesModel;
            const settings = this.getSettings(this.editor.getPosition().lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
        }
        isDefaultSettings() {
            return this.primarySettingsModel instanceof preferencesModels_1.DefaultSettingsEditorModel;
        }
        onConfigurationChanged() {
            if (!this.editor.getOption(50 /* EditorOption.glyphMargin */)) {
                this.editPreferenceWidgetForCursorPosition.hide();
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        onPositionChanged(positionChangeEvent) {
            this.editPreferenceWidgetForMouseMove.hide();
            const settings = this.getSettings(positionChangeEvent.position.lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
            else {
                this.editPreferenceWidgetForCursorPosition.hide();
            }
        }
        onMouseMoved(mouseMoveEvent) {
            const editPreferenceWidget = this.getEditPreferenceWidgetUnderMouse(mouseMoveEvent);
            if (editPreferenceWidget) {
                this.onMouseOver(editPreferenceWidget);
                return;
            }
            this.settingHighlighter.clear();
            this.toggleEditPreferencesForMouseMoveDelayer.trigger(() => this.toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent));
        }
        getEditPreferenceWidgetUnderMouse(mouseMoveEvent) {
            if (mouseMoveEvent.target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */) {
                const line = mouseMoveEvent.target.position.lineNumber;
                if (this.editPreferenceWidgetForMouseMove.getLine() === line && this.editPreferenceWidgetForMouseMove.isVisible()) {
                    return this.editPreferenceWidgetForMouseMove;
                }
                if (this.editPreferenceWidgetForCursorPosition.getLine() === line && this.editPreferenceWidgetForCursorPosition.isVisible()) {
                    return this.editPreferenceWidgetForCursorPosition;
                }
            }
            return undefined;
        }
        toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent) {
            const settings = mouseMoveEvent.target.position ? this.getSettings(mouseMoveEvent.target.position.lineNumber) : null;
            if (settings && settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForMouseMove, settings);
            }
            else {
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        showEditPreferencesWidget(editPreferencesWidget, settings) {
            const line = settings[0].valueRange.startLineNumber;
            if (this.editor.getOption(50 /* EditorOption.glyphMargin */) && this.marginFreeFromOtherDecorations(line)) {
                editPreferencesWidget.show(line, nls.localize('editTtile', "Edit"), settings);
                const editPreferenceWidgetToHide = editPreferencesWidget === this.editPreferenceWidgetForCursorPosition ? this.editPreferenceWidgetForMouseMove : this.editPreferenceWidgetForCursorPosition;
                editPreferenceWidgetToHide.hide();
            }
        }
        marginFreeFromOtherDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    if (options.glyphMarginClassName && options.glyphMarginClassName.indexOf(themeService_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon)) === -1) {
                        return false;
                    }
                }
            }
            return true;
        }
        getSettings(lineNumber) {
            const configurationMap = this.getConfigurationsMap();
            return this.getSettingsAtLineNumber(lineNumber).filter(setting => {
                const configurationNode = configurationMap[setting.key];
                if (configurationNode) {
                    if (this.isDefaultSettings()) {
                        if (setting.key === 'launch') {
                            // Do not show because of https://github.com/microsoft/vscode/issues/32593
                            return false;
                        }
                        return true;
                    }
                    if (configurationNode.type === 'boolean' || configurationNode.enum) {
                        if (this.primarySettingsModel.configurationTarget !== 5 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                            return true;
                        }
                        if (configurationNode.scope === 4 /* ConfigurationScope.RESOURCE */ || configurationNode.scope === 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        getSettingsAtLineNumber(lineNumber) {
            // index of setting, across all groups/sections
            let index = 0;
            const settings = [];
            for (const group of this.settingsGroups) {
                if (group.range.startLineNumber > lineNumber) {
                    break;
                }
                if (lineNumber >= group.range.startLineNumber && lineNumber <= group.range.endLineNumber) {
                    for (const section of group.sections) {
                        for (const setting of section.settings) {
                            if (setting.range.startLineNumber > lineNumber) {
                                break;
                            }
                            if (lineNumber >= setting.range.startLineNumber && lineNumber <= setting.range.endLineNumber) {
                                if (!this.isDefaultSettings() && setting.overrides.length) {
                                    // Only one level because override settings cannot have override settings
                                    for (const overrideSetting of setting.overrides) {
                                        if (lineNumber >= overrideSetting.range.startLineNumber && lineNumber <= overrideSetting.range.endLineNumber) {
                                            settings.push(Object.assign(Object.assign({}, overrideSetting), { index, groupId: group.id }));
                                        }
                                    }
                                }
                                else {
                                    settings.push(Object.assign(Object.assign({}, setting), { index, groupId: group.id }));
                                }
                            }
                            index++;
                        }
                    }
                }
            }
            return settings;
        }
        onMouseOver(editPreferenceWidget) {
            this.settingHighlighter.highlight(editPreferenceWidget.preferences[0]);
        }
        onEditSettingClicked(editPreferenceWidget, e) {
            dom_1.EventHelper.stop(e.event, true);
            const anchor = { x: e.event.posx, y: e.event.posy };
            const actions = this.getSettings(editPreferenceWidget.getLine()).length === 1 ? this.getActions(editPreferenceWidget.preferences[0], this.getConfigurationsMap()[editPreferenceWidget.preferences[0].key])
                : editPreferenceWidget.preferences.map(setting => new actions_1.SubmenuAction(`preferences.submenu.${setting.key}`, setting.key, this.getActions(setting, this.getConfigurationsMap()[setting.key])));
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions
            });
        }
        activateOnSetting(setting) {
            const startLine = setting.keyRange.startLineNumber;
            const settings = this.getSettings(startLine);
            if (!settings.length) {
                return false;
            }
            this.editPreferenceWidgetForMouseMove.show(startLine, '', settings);
            const actions = this.getActions(this.editPreferenceWidgetForMouseMove.preferences[0], this.getConfigurationsMap()[this.editPreferenceWidgetForMouseMove.preferences[0].key]);
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.toAbsoluteCoords(new position_1.Position(startLine, 1)),
                getActions: () => actions
            });
            return true;
        }
        toAbsoluteCoords(position) {
            const positionCoords = this.editor.getScrolledVisiblePosition(position);
            const editorCoords = (0, dom_1.getDomNodePagePosition)(this.editor.getDomNode());
            const x = editorCoords.left + positionCoords.left;
            const y = editorCoords.top + positionCoords.top + positionCoords.height;
            return { x, y: y + 10 };
        }
        getConfigurationsMap() {
            return platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        }
        getActions(setting, jsonSchema) {
            if (jsonSchema.type === 'boolean') {
                return [{
                        id: 'truthyValue',
                        label: 'true',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, true, setting)
                    }, {
                        id: 'falsyValue',
                        label: 'false',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, false, setting)
                    }];
            }
            if (jsonSchema.enum) {
                return jsonSchema.enum.map(value => {
                    return {
                        id: value,
                        label: JSON.stringify(value),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, value, setting)
                    };
                });
            }
            return this.getDefaultActions(setting);
        }
        getDefaultActions(setting) {
            if (this.isDefaultSettings()) {
                const settingInOtherModel = this.associatedPreferencesModel.getPreference(setting.key);
                return [{
                        id: 'setDefaultValue',
                        label: settingInOtherModel ? nls.localize('replaceDefaultValue', "Replace in Settings") : nls.localize('copyDefaultValue', "Copy to Settings"),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, setting.value, setting)
                    }];
            }
            return [];
        }
        updateSetting(key, value, source) {
            this._onUpdateSetting.fire({ key, value, source });
        }
    };
    EditSettingRenderer = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService)
    ], EditSettingRenderer);
    let SettingHighlighter = class SettingHighlighter extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.fixedHighlighter = this._register(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
            this.volatileHighlighter = this._register(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
        }
        highlight(setting, fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            this.fixedHighlighter.removeHighlightRange();
            const highlighter = fix ? this.fixedHighlighter : this.volatileHighlighter;
            highlighter.highlightRange({
                range: setting.valueRange,
                resource: this.editor.getModel().uri
            }, this.editor);
            this.editor.revealLineInCenterIfOutsideViewport(setting.valueRange.startLineNumber, 0 /* editorCommon.ScrollType.Smooth */);
        }
        clear(fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            if (fix) {
                this.fixedHighlighter.removeHighlightRange();
            }
        }
    };
    SettingHighlighter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], SettingHighlighter);
    let UnsupportedSettingsRenderer = class UnsupportedSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, settingsEditorModel, markerService, environmentService, configurationService, workspaceTrustManagementService, uriIdentityService, languageFeaturesService) {
            super();
            this.editor = editor;
            this.settingsEditorModel = settingsEditorModel;
            this.markerService = markerService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.uriIdentityService = uriIdentityService;
            this.renderingDelayer = new async_1.Delayer(200);
            this.codeActions = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            this._register(this.editor.getModel().onDidChangeContent(() => this.delayedRender()));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.source === 6 /* ConfigurationTarget.DEFAULT */)(() => this.delayedRender()));
            this._register(languageFeaturesService.codeActionProvider.register({ pattern: settingsEditorModel.uri.path }, this));
        }
        delayedRender() {
            this.renderingDelayer.trigger(() => this.render());
        }
        render() {
            this.codeActions.clear();
            const markerData = this.generateMarkerData();
            if (markerData.length) {
                this.markerService.changeOne('UnsupportedSettingsRenderer', this.settingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            }
        }
        async provideCodeActions(model, range, context, token) {
            const actions = [];
            const codeActionsByRange = this.codeActions.get(model.uri);
            if (codeActionsByRange) {
                for (const [codeActionsRange, codeActions] of codeActionsByRange) {
                    if (codeActionsRange.containsRange(range)) {
                        actions.push(...codeActions);
                    }
                }
            }
            return {
                actions,
                dispose: () => { }
            };
        }
        generateMarkerData() {
            const markerData = [];
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const settingsGroup of this.settingsEditorModel.settingsGroups) {
                for (const section of settingsGroup.sections) {
                    for (const setting of section.settings) {
                        const configuration = configurationRegistry[setting.key];
                        if (configuration) {
                            switch (this.settingsEditorModel.configurationTarget) {
                                case 2 /* ConfigurationTarget.USER_LOCAL */:
                                    this.handleLocalUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 3 /* ConfigurationTarget.USER_REMOTE */:
                                    this.handleRemoteUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 4 /* ConfigurationTarget.WORKSPACE */:
                                    this.handleWorkspaceConfiguration(setting, configuration, markerData);
                                    break;
                                case 5 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                                    this.handleWorkspaceFolderConfiguration(setting, configuration, markerData);
                                    break;
                            }
                        }
                        else if (!configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(setting.key)) { // Ignore override settings (language specific settings)
                            markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* MarkerTag.Unnecessary */] }, setting.range), { message: nls.localize('unknown configuration setting', "Unknown Configuration Setting") }));
                        }
                    }
                }
            }
            return markerData;
        }
        handleLocalUserConfiguration(setting, configuration, markerData) {
            if (this.environmentService.remoteAuthority && (configuration.scope === 2 /* ConfigurationScope.MACHINE */ || configuration.scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */)) {
                markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* MarkerTag.Unnecessary */] }, setting.range), { message: nls.localize('unsupportedRemoteMachineSetting', "This setting cannot be applied in this window. It will be applied when you open a local window.") }));
            }
        }
        handleRemoteUserConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
        }
        handleWorkspaceConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* ConfigurationScope.MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && configuration.restricted) {
                const marker = this.generateUntrustedSettingMarker(setting);
                markerData.push(marker);
                const codeActions = this.generateUntrustedSettingCodeActions([marker]);
                this.addCodeActions(marker, codeActions);
            }
        }
        handleWorkspaceFolderConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* ConfigurationScope.MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (configuration.scope === 3 /* ConfigurationScope.WINDOW */) {
                markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* MarkerTag.Unnecessary */] }, setting.range), { message: nls.localize('unsupportedWindowSetting', "This setting cannot be applied in this workspace. It will be applied when you open the containing workspace folder directly.") }));
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && configuration.restricted) {
                const marker = this.generateUntrustedSettingMarker(setting);
                markerData.push(marker);
                const codeActions = this.generateUntrustedSettingCodeActions([marker]);
                this.addCodeActions(marker, codeActions);
            }
        }
        generateUnsupportedApplicationSettingMarker(setting) {
            return Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* MarkerTag.Unnecessary */] }, setting.range), { message: nls.localize('unsupportedApplicationSetting', "This setting can be applied only in application user settings") });
        }
        generateUnsupportedMachineSettingMarker(setting) {
            return Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* MarkerTag.Unnecessary */] }, setting.range), { message: nls.localize('unsupportedMachineSetting', "This setting can only be applied in user settings in local window or in remote settings in remote window.") });
        }
        generateUntrustedSettingMarker(setting) {
            return Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Warning }, setting.range), { message: nls.localize('untrustedSetting', "This setting can only be applied in a trusted workspace.") });
        }
        generateUntrustedSettingCodeActions(diagnostics) {
            return [{
                    title: nls.localize('manage workspace trust', "Manage Workspace Trust"),
                    command: {
                        id: 'workbench.trust.manage',
                        title: nls.localize('manage workspace trust', "Manage Workspace Trust")
                    },
                    diagnostics,
                    kind: types_1.CodeActionKind.QuickFix.value
                }];
        }
        addCodeActions(range, codeActions) {
            let actions = this.codeActions.get(this.settingsEditorModel.uri);
            if (!actions) {
                actions = [];
                this.codeActions.set(this.settingsEditorModel.uri, actions);
            }
            actions.push([range_1.Range.lift(range), codeActions]);
        }
        dispose() {
            this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            this.codeActions.clear();
            super.dispose();
        }
    };
    UnsupportedSettingsRenderer = __decorate([
        __param(2, markers_1.IMarkerService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, languageFeatures_1.ILanguageFeaturesService)
    ], UnsupportedSettingsRenderer);
    let WorkspaceConfigurationRenderer = class WorkspaceConfigurationRenderer extends lifecycle_1.Disposable {
        constructor(editor, workspaceSettingsEditorModel, workspaceContextService, markerService) {
            super();
            this.editor = editor;
            this.workspaceSettingsEditorModel = workspaceSettingsEditorModel;
            this.workspaceContextService = workspaceContextService;
            this.markerService = markerService;
            this.decorationIds = [];
            this.renderingDelayer = new async_1.Delayer(200);
            this._register(this.editor.getModel().onDidChangeContent(() => this.renderingDelayer.trigger(() => this.render())));
        }
        render() {
            const markerData = [];
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && this.workspaceSettingsEditorModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel) {
                const ranges = [];
                for (const settingsGroup of this.workspaceSettingsEditorModel.configurationGroups) {
                    for (const section of settingsGroup.sections) {
                        for (const setting of section.settings) {
                            if (!WorkspaceConfigurationRenderer.supportedKeys.includes(setting.key)) {
                                markerData.push(Object.assign(Object.assign({ severity: markers_1.MarkerSeverity.Hint, tags: [1 /* MarkerTag.Unnecessary */] }, setting.range), { message: nls.localize('unsupportedProperty', "Unsupported Property") }));
                            }
                        }
                    }
                }
                this.decorationIds = this.editor.deltaDecorations(this.decorationIds, ranges.map(range => this.createDecoration(range)));
            }
            if (markerData.length) {
                this.markerService.changeOne('WorkspaceConfigurationRenderer', this.workspaceSettingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            }
        }
        createDecoration(range) {
            return {
                range,
                options: WorkspaceConfigurationRenderer._DIM_CONFIGURATION_
            };
        }
        dispose() {
            this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            this.decorationIds = this.editor.deltaDecorations(this.decorationIds, []);
            super.dispose();
        }
    };
    WorkspaceConfigurationRenderer.supportedKeys = ['folders', 'tasks', 'launch', 'extensions', 'settings', 'remoteAuthority', 'transient'];
    WorkspaceConfigurationRenderer._DIM_CONFIGURATION_ = textModel_1.ModelDecorationOptions.register({
        description: 'dim-configuration',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        inlineClassName: 'dim-configuration'
    });
    WorkspaceConfigurationRenderer = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, markers_1.IMarkerService)
    ], WorkspaceConfigurationRenderer);
});
//# sourceMappingURL=preferencesRenderers.js.map