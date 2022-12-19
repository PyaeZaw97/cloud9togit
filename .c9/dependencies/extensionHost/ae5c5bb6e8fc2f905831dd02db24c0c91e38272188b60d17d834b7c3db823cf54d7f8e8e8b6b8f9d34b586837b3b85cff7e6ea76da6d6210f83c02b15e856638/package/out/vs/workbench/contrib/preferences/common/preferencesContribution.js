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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/environment/common/environment", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/configuration", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, lifecycle_1, resources_1, model_1, language_1, resolverService_1, nls, configuration_1, configurationRegistry_1, environment_1, JSONContributionRegistry, platform_1, workspace_1, configuration_2, sideBySideEditorInput_1, editorResolverService_1, textEditorService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesContribution = void 0;
    const schemaRegistry = platform_1.Registry.as(JSONContributionRegistry.Extensions.JSONContribution);
    let PreferencesContribution = class PreferencesContribution {
        constructor(modelService, textModelResolverService, preferencesService, languageService, environmentService, workspaceService, configurationService, editorResolverService, textEditorService) {
            this.modelService = modelService;
            this.textModelResolverService = textModelResolverService;
            this.preferencesService = preferencesService;
            this.languageService = languageService;
            this.environmentService = environmentService;
            this.workspaceService = workspaceService;
            this.configurationService = configurationService;
            this.editorResolverService = editorResolverService;
            this.textEditorService = textEditorService;
            this.settingsListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(preferences_1.USE_SPLIT_JSON_SETTING) || e.affectsConfiguration(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING)) {
                    this.handleSettingsEditorRegistration();
                }
            });
            this.handleSettingsEditorRegistration();
            this.start();
        }
        handleSettingsEditorRegistration() {
            // dispose any old listener we had
            (0, lifecycle_1.dispose)(this.editorOpeningListener);
            // install editor opening listener unless user has disabled this
            if (!!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING) || !!this.configurationService.getValue(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING)) {
                this.editorOpeningListener = this.editorResolverService.registerEditor('**/settings.json', {
                    id: sideBySideEditorInput_1.SideBySideEditorInput.ID,
                    label: nls.localize('splitSettingsEditorLabel', "Split Settings Editor"),
                    priority: editorResolverService_1.RegisteredEditorPriority.builtin,
                }, {
                    canHandleDiff: false,
                }, ({ resource, options }) => {
                    // Global User Settings File
                    if ((0, resources_1.isEqual)(resource, this.environmentService.settingsResource)) {
                        return { editor: this.preferencesService.createSplitJsonEditorInput(2 /* ConfigurationTarget.USER_LOCAL */, resource), options };
                    }
                    // Single Folder Workspace Settings File
                    const state = this.workspaceService.getWorkbenchState();
                    if (state === 2 /* WorkbenchState.FOLDER */) {
                        const folders = this.workspaceService.getWorkspace().folders;
                        if ((0, resources_1.isEqual)(resource, folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH))) {
                            return { editor: this.preferencesService.createSplitJsonEditorInput(4 /* ConfigurationTarget.WORKSPACE */, resource), options };
                        }
                    }
                    // Multi Folder Workspace Settings File
                    else if (state === 3 /* WorkbenchState.WORKSPACE */) {
                        const folders = this.workspaceService.getWorkspace().folders;
                        for (const folder of folders) {
                            if ((0, resources_1.isEqual)(resource, folder.toResource(preferences_1.FOLDER_SETTINGS_PATH))) {
                                return { editor: this.preferencesService.createSplitJsonEditorInput(5 /* ConfigurationTarget.WORKSPACE_FOLDER */, resource), options };
                            }
                        }
                    }
                    return { editor: this.textEditorService.createTextEditor({ resource }), options };
                });
            }
        }
        start() {
            this.textModelResolverService.registerTextModelContentProvider('vscode', {
                provideTextContent: (uri) => {
                    if (uri.scheme !== 'vscode') {
                        return null;
                    }
                    if (uri.authority === 'schemas') {
                        const schemaModel = this.getSchemaModel(uri);
                        if (schemaModel) {
                            return Promise.resolve(schemaModel);
                        }
                    }
                    return Promise.resolve(this.preferencesService.resolveModel(uri));
                }
            });
        }
        getSchemaModel(uri) {
            let schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
            if (schema) {
                const modelContent = JSON.stringify(schema);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this.modelService.createModel(modelContent, languageSelection, uri);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(schemaRegistry.onDidChangeSchema(schemaUri => {
                    if (schemaUri === uri.toString()) {
                        schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
                        model.setValue(JSON.stringify(schema));
                    }
                }));
                disposables.add(model.onWillDispose(() => disposables.dispose()));
                return model;
            }
            return null;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.editorOpeningListener);
            (0, lifecycle_1.dispose)(this.settingsListener);
        }
    };
    PreferencesContribution = __decorate([
        __param(0, model_1.IModelService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, language_1.ILanguageService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, editorResolverService_1.IEditorResolverService),
        __param(8, textEditorService_1.ITextEditorService)
    ], PreferencesContribution);
    exports.PreferencesContribution = PreferencesContribution;
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    registry.registerConfiguration(Object.assign(Object.assign({}, configuration_2.workbenchConfigurationNodeBase), { 'properties': {
            'workbench.settings.enableNaturalLanguageSearch': {
                'type': 'boolean',
                'description': nls.localize('enableNaturalLanguageSettingsSearch', "Controls whether to enable the natural language search mode for settings. The natural language search is provided by a Microsoft online service."),
                'default': true,
                'scope': 3 /* ConfigurationScope.WINDOW */,
                'tags': ['usesOnlineServices']
            },
            'workbench.settings.settingsSearchTocBehavior': {
                'type': 'string',
                'enum': ['hide', 'filter'],
                'enumDescriptions': [
                    nls.localize('settingsSearchTocBehavior.hide', "Hide the Table of Contents while searching."),
                    nls.localize('settingsSearchTocBehavior.filter', "Filter the Table of Contents to just categories that have matching settings. Clicking a category will filter the results to that category."),
                ],
                'description': nls.localize('settingsSearchTocBehavior', "Controls the behavior of the settings editor Table of Contents while searching."),
                'default': 'filter',
                'scope': 3 /* ConfigurationScope.WINDOW */
            },
        } }));
});
//# sourceMappingURL=preferencesContribution.js.map