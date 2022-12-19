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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/workbench/services/configuration/common/jsonEditing", "vs/base/common/map"], function (require, exports, arrays_1, event_1, json_1, lifecycle_1, getIconClasses_1, files_1, extensions_1, instantiation_1, workspace_1, quickInput_1, model_1, language_1, nls_1, jsonEditing_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceExtensionsConfigService = exports.IWorkspaceExtensionsConfigService = exports.EXTENSIONS_CONFIG = void 0;
    exports.EXTENSIONS_CONFIG = '.vscode/extensions.json';
    exports.IWorkspaceExtensionsConfigService = (0, instantiation_1.createDecorator)('IWorkspaceExtensionsConfigService');
    let WorkspaceExtensionsConfigService = class WorkspaceExtensionsConfigService extends lifecycle_1.Disposable {
        constructor(workspaceContextService, fileService, quickInputService, modelService, languageService, jsonEditingService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.jsonEditingService = jsonEditingService;
            this._onDidChangeExtensionsConfigs = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsConfigs = this._onDidChangeExtensionsConfigs.event;
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(e => this._onDidChangeExtensionsConfigs.fire()));
            this._register(fileService.onDidFilesChange(e => {
                const workspace = workspaceContextService.getWorkspace();
                if ((workspace.configuration && e.affects(workspace.configuration))
                    || workspace.folders.some(folder => e.affects(folder.toResource(exports.EXTENSIONS_CONFIG)))) {
                    this._onDidChangeExtensionsConfigs.fire();
                }
            }));
        }
        async getExtensionsConfigs() {
            const workspace = this.workspaceContextService.getWorkspace();
            const result = [];
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            if (workspaceExtensionsConfigContent) {
                result.push(workspaceExtensionsConfigContent);
            }
            result.push(...await Promise.all(workspace.folders.map(workspaceFolder => this.resolveWorkspaceFolderExtensionConfig(workspaceFolder))));
            return result;
        }
        async getRecommendations() {
            const configs = await this.getExtensionsConfigs();
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(configs.map(c => c.recommendations ? c.recommendations.map(c => c.toLowerCase()) : [])));
        }
        async getUnwantedRecommendations() {
            const configs = await this.getExtensionsConfigs();
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(configs.map(c => c.unwantedRecommendations ? c.unwantedRecommendations.map(c => c.toLowerCase()) : [])));
        }
        async toggleRecommendation(extensionId) {
            var _a;
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            const workspaceFolderExtensionsConfigContents = new map_1.ResourceMap();
            await Promise.all(workspace.folders.map(async (workspaceFolder) => {
                const extensionsConfigContent = await this.resolveWorkspaceFolderExtensionConfig(workspaceFolder);
                workspaceFolderExtensionsConfigContents.set(workspaceFolder.uri, extensionsConfigContent);
            }));
            const isWorkspaceRecommended = workspaceExtensionsConfigContent && ((_a = workspaceExtensionsConfigContent.recommendations) === null || _a === void 0 ? void 0 : _a.some(r => r === extensionId));
            const recommendedWorksapceFolders = workspace.folders.filter(workspaceFolder => { var _a, _b; return (_b = (_a = workspaceFolderExtensionsConfigContents.get(workspaceFolder.uri)) === null || _a === void 0 ? void 0 : _a.recommendations) === null || _b === void 0 ? void 0 : _b.some(r => r === extensionId); });
            const isRecommended = isWorkspaceRecommended || recommendedWorksapceFolders.length > 0;
            const workspaceOrFolders = isRecommended
                ? await this.pickWorkspaceOrFolders(recommendedWorksapceFolders, isWorkspaceRecommended ? workspace : undefined, (0, nls_1.localize)('select for remove', "Remove extension recommendation from"))
                : await this.pickWorkspaceOrFolders(workspace.folders, workspace.configuration ? workspace : undefined, (0, nls_1.localize)('select for add', "Add extension recommendation to"));
            for (const workspaceOrWorkspaceFolder of workspaceOrFolders) {
                if ((0, workspace_1.isWorkspace)(workspaceOrWorkspaceFolder)) {
                    await this.addOrRemoveWorkspaceRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceExtensionsConfigContent, !isRecommended);
                }
                else {
                    await this.addOrRemoveWorkspaceFolderRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceFolderExtensionsConfigContents.get(workspaceOrWorkspaceFolder.uri), !isRecommended);
                }
            }
        }
        async toggleUnwantedRecommendation(extensionId) {
            var _a;
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            const workspaceFolderExtensionsConfigContents = new map_1.ResourceMap();
            await Promise.all(workspace.folders.map(async (workspaceFolder) => {
                const extensionsConfigContent = await this.resolveWorkspaceFolderExtensionConfig(workspaceFolder);
                workspaceFolderExtensionsConfigContents.set(workspaceFolder.uri, extensionsConfigContent);
            }));
            const isWorkspaceUnwanted = workspaceExtensionsConfigContent && ((_a = workspaceExtensionsConfigContent.unwantedRecommendations) === null || _a === void 0 ? void 0 : _a.some(r => r === extensionId));
            const unWantedWorksapceFolders = workspace.folders.filter(workspaceFolder => { var _a, _b; return (_b = (_a = workspaceFolderExtensionsConfigContents.get(workspaceFolder.uri)) === null || _a === void 0 ? void 0 : _a.unwantedRecommendations) === null || _b === void 0 ? void 0 : _b.some(r => r === extensionId); });
            const isUnwanted = isWorkspaceUnwanted || unWantedWorksapceFolders.length > 0;
            const workspaceOrFolders = isUnwanted
                ? await this.pickWorkspaceOrFolders(unWantedWorksapceFolders, isWorkspaceUnwanted ? workspace : undefined, (0, nls_1.localize)('select for remove', "Remove extension recommendation from"))
                : await this.pickWorkspaceOrFolders(workspace.folders, workspace.configuration ? workspace : undefined, (0, nls_1.localize)('select for add', "Add extension recommendation to"));
            for (const workspaceOrWorkspaceFolder of workspaceOrFolders) {
                if ((0, workspace_1.isWorkspace)(workspaceOrWorkspaceFolder)) {
                    await this.addOrRemoveWorkspaceUnwantedRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceExtensionsConfigContent, !isUnwanted);
                }
                else {
                    await this.addOrRemoveWorkspaceFolderUnwantedRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceFolderExtensionsConfigContents.get(workspaceOrWorkspaceFolder.uri), !isUnwanted);
                }
            }
        }
        async addOrRemoveWorkspaceFolderRecommendation(extensionId, workspaceFolder, extensionsConfigContent, add) {
            const values = [];
            if (add) {
                values.push({ path: ['recommendations'], value: [...extensionsConfigContent.recommendations || [], extensionId] });
                if (extensionsConfigContent.unwantedRecommendations && extensionsConfigContent.unwantedRecommendations.some(e => e === extensionId)) {
                    values.push({ path: ['unwantedRecommendations'], value: extensionsConfigContent.unwantedRecommendations.filter(e => e !== extensionId) });
                }
            }
            else if (extensionsConfigContent.recommendations) {
                values.push({ path: ['recommendations'], value: extensionsConfigContent.recommendations.filter(e => e !== extensionId) });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG), values, true);
            }
        }
        async addOrRemoveWorkspaceRecommendation(extensionId, workspace, extensionsConfigContent, add) {
            const values = [];
            if (extensionsConfigContent) {
                if (add) {
                    values.push({ path: ['extensions', 'recommendations'], value: [...extensionsConfigContent.recommendations || [], extensionId] });
                    if (extensionsConfigContent.unwantedRecommendations && extensionsConfigContent.unwantedRecommendations.some(e => e === extensionId)) {
                        values.push({ path: ['extensions', 'unwantedRecommendations'], value: extensionsConfigContent.unwantedRecommendations.filter(e => e !== extensionId) });
                    }
                }
                else if (extensionsConfigContent.recommendations) {
                    values.push({ path: ['extensions', 'recommendations'], value: extensionsConfigContent.recommendations.filter(e => e !== extensionId) });
                }
            }
            else if (add) {
                values.push({ path: ['extensions'], value: { recommendations: [extensionId] } });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspace.configuration, values, true);
            }
        }
        async addOrRemoveWorkspaceFolderUnwantedRecommendation(extensionId, workspaceFolder, extensionsConfigContent, add) {
            const values = [];
            if (add) {
                values.push({ path: ['unwantedRecommendations'], value: [...extensionsConfigContent.unwantedRecommendations || [], extensionId] });
                if (extensionsConfigContent.recommendations && extensionsConfigContent.recommendations.some(e => e === extensionId)) {
                    values.push({ path: ['recommendations'], value: extensionsConfigContent.recommendations.filter(e => e !== extensionId) });
                }
            }
            else if (extensionsConfigContent.unwantedRecommendations) {
                values.push({ path: ['unwantedRecommendations'], value: extensionsConfigContent.unwantedRecommendations.filter(e => e !== extensionId) });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG), values, true);
            }
        }
        async addOrRemoveWorkspaceUnwantedRecommendation(extensionId, workspace, extensionsConfigContent, add) {
            const values = [];
            if (extensionsConfigContent) {
                if (add) {
                    values.push({ path: ['extensions', 'unwantedRecommendations'], value: [...extensionsConfigContent.unwantedRecommendations || [], extensionId] });
                    if (extensionsConfigContent.recommendations && extensionsConfigContent.recommendations.some(e => e === extensionId)) {
                        values.push({ path: ['extensions', 'recommendations'], value: extensionsConfigContent.recommendations.filter(e => e !== extensionId) });
                    }
                }
                else if (extensionsConfigContent.unwantedRecommendations) {
                    values.push({ path: ['extensions', 'unwantedRecommendations'], value: extensionsConfigContent.unwantedRecommendations.filter(e => e !== extensionId) });
                }
            }
            else if (add) {
                values.push({ path: ['extensions'], value: { unwantedRecommendations: [extensionId] } });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspace.configuration, values, true);
            }
        }
        async pickWorkspaceOrFolders(workspaceFolders, workspace, placeHolder) {
            const workspaceOrFolders = workspace ? [...workspaceFolders, workspace] : [...workspaceFolders];
            if (workspaceOrFolders.length === 1) {
                return workspaceOrFolders;
            }
            const folderPicks = workspaceFolders.map(workspaceFolder => {
                return {
                    label: workspaceFolder.name,
                    description: (0, nls_1.localize)('workspace folder', "Workspace Folder"),
                    workspaceOrFolder: workspaceFolder,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, workspaceFolder.uri, files_1.FileKind.ROOT_FOLDER)
                };
            });
            if (workspace) {
                folderPicks.push({ type: 'separator' });
                folderPicks.push({
                    label: (0, nls_1.localize)('workspace', "Workspace"),
                    workspaceOrFolder: workspace,
                });
            }
            const result = await this.quickInputService.pick(folderPicks, { placeHolder, canPickMany: true }) || [];
            return result.map(r => r.workspaceOrFolder);
        }
        async resolveWorkspaceExtensionConfig(workspaceConfigurationResource) {
            try {
                const content = await this.fileService.readFile(workspaceConfigurationResource);
                const extensionsConfigContent = (0, json_1.parse)(content.value.toString())['extensions'];
                return extensionsConfigContent ? this.parseExtensionConfig(extensionsConfigContent) : undefined;
            }
            catch (e) { /* Ignore */ }
            return undefined;
        }
        async resolveWorkspaceFolderExtensionConfig(workspaceFolder) {
            try {
                const content = await this.fileService.readFile(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG));
                const extensionsConfigContent = (0, json_1.parse)(content.value.toString());
                return this.parseExtensionConfig(extensionsConfigContent);
            }
            catch (e) { /* ignore */ }
            return {};
        }
        parseExtensionConfig(extensionsConfigContent) {
            return {
                recommendations: (0, arrays_1.distinct)((extensionsConfigContent.recommendations || []).map(e => e.toLowerCase())),
                unwantedRecommendations: (0, arrays_1.distinct)((extensionsConfigContent.unwantedRecommendations || []).map(e => e.toLowerCase()))
            };
        }
    };
    WorkspaceExtensionsConfigService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, files_1.IFileService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService),
        __param(5, jsonEditing_1.IJSONEditingService)
    ], WorkspaceExtensionsConfigService);
    exports.WorkspaceExtensionsConfigService = WorkspaceExtensionsConfigService;
    (0, extensions_1.registerSingleton)(exports.IWorkspaceExtensionsConfigService, WorkspaceExtensionsConfigService);
});
//# sourceMappingURL=workspaceExtensionsConfig.js.map