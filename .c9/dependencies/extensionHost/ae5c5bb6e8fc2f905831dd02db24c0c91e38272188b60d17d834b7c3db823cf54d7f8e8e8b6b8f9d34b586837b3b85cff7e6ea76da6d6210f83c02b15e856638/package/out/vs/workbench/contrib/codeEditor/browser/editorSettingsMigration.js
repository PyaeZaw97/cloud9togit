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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/editor/browser/config/migrateOptions", "vs/base/common/lifecycle"], function (require, exports, platform_1, contributions_1, workspace_1, configuration_1, migrateOptions_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let EditorSettingsMigration = class EditorSettingsMigration extends lifecycle_1.Disposable {
        constructor(_configurationService, _workspaceService) {
            super();
            this._configurationService = _configurationService;
            this._workspaceService = _workspaceService;
            this._register(this._workspaceService.onDidChangeWorkspaceFolders(async (e) => {
                for (const folder of e.added) {
                    await this._migrateEditorSettingsForFolder(folder);
                }
            }));
            this._migrateEditorSettings();
        }
        async _migrateEditorSettings() {
            await this._migrateEditorSettingsForFolder(undefined);
            for (const folder of this._workspaceService.getWorkspace().folders) {
                await this._migrateEditorSettingsForFolder(folder);
            }
        }
        async _migrateEditorSettingsForFolder(folder) {
            await Promise.all(migrateOptions_1.EditorSettingMigration.items.map(migration => this._migrateEditorSettingForFolderAndOverride(migration, { resource: folder === null || folder === void 0 ? void 0 : folder.uri })));
        }
        async _migrateEditorSettingForFolderAndOverride(migration, overrides) {
            const data = this._configurationService.inspect(`editor.${migration.key}`, overrides);
            await this._migrateEditorSettingForFolderOverrideAndTarget(migration, overrides, data, 'userValue', 1 /* ConfigurationTarget.USER */);
            await this._migrateEditorSettingForFolderOverrideAndTarget(migration, overrides, data, 'userLocalValue', 2 /* ConfigurationTarget.USER_LOCAL */);
            await this._migrateEditorSettingForFolderOverrideAndTarget(migration, overrides, data, 'userRemoteValue', 3 /* ConfigurationTarget.USER_REMOTE */);
            await this._migrateEditorSettingForFolderOverrideAndTarget(migration, overrides, data, 'workspaceFolderValue', 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            await this._migrateEditorSettingForFolderOverrideAndTarget(migration, overrides, data, 'workspaceValue', 4 /* ConfigurationTarget.WORKSPACE */);
            if (typeof overrides.overrideIdentifier === 'undefined' && typeof data.overrideIdentifiers !== 'undefined') {
                for (const overrideIdentifier of data.overrideIdentifiers) {
                    await this._migrateEditorSettingForFolderAndOverride(migration, { resource: overrides.resource, overrideIdentifier });
                }
            }
        }
        async _migrateEditorSettingForFolderOverrideAndTarget(migration, overrides, data, dataKey, target) {
            const value = data[dataKey];
            if (typeof value === 'undefined') {
                return;
            }
            const writeCalls = [];
            const read = (key) => this._configurationService.inspect(`editor.${key}`, overrides)[dataKey];
            const write = (key, value) => writeCalls.push([key, value]);
            migration.migrate(value, read, write);
            for (const [wKey, wValue] of writeCalls) {
                await this._configurationService.updateValue(`editor.${wKey}`, wValue, overrides, target);
            }
        }
    };
    EditorSettingsMigration = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], EditorSettingsMigration);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(EditorSettingsMigration, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=editorSettingsMigration.js.map