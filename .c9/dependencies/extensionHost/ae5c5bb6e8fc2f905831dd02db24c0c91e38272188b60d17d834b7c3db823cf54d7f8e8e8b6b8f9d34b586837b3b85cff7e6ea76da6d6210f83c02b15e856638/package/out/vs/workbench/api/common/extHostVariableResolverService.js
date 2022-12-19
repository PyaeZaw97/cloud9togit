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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/process", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/services/configurationResolver/common/variableResolver", "./extHostConfiguration"], function (require, exports, lazy_1, lifecycle_1, path, process, instantiation_1, extHostDocumentsAndEditors_1, extHostEditorTabs_1, extHostExtensionService_1, extHostTypes_1, extHostWorkspace_1, variableResolver_1, extHostConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostVariableResolverProviderService = exports.IExtHostVariableResolverProvider = void 0;
    exports.IExtHostVariableResolverProvider = (0, instantiation_1.createDecorator)('IExtHostVariableResolverProvider');
    class ExtHostVariableResolverService extends variableResolver_1.AbstractVariableResolverService {
        constructor(extensionService, workspaceService, editorService, editorTabs, configProvider, context, homeDir) {
            function getActiveUri() {
                var _a;
                if (editorService) {
                    const activeEditor = editorService.activeEditor();
                    if (activeEditor) {
                        return activeEditor.document.uri;
                    }
                    const activeTab = (_a = editorTabs.tabGroups.all.find(group => group.isActive)) === null || _a === void 0 ? void 0 : _a.activeTab;
                    if (activeTab !== undefined) {
                        // Resolve a resource from the tab
                        if (activeTab.input instanceof extHostTypes_1.TextDiffTabInput || activeTab.input instanceof extHostTypes_1.NotebookDiffEditorTabInput) {
                            return activeTab.input.modified;
                        }
                        else if (activeTab.input instanceof extHostTypes_1.TextTabInput || activeTab.input instanceof extHostTypes_1.NotebookEditorTabInput || activeTab.input instanceof extHostTypes_1.CustomEditorTabInput) {
                            return activeTab.input.uri;
                        }
                    }
                }
                return undefined;
            }
            super({
                getFolderUri: (folderName) => {
                    const found = context.folders.filter(f => f.name === folderName);
                    if (found && found.length > 0) {
                        return found[0].uri;
                    }
                    return undefined;
                },
                getWorkspaceFolderCount: () => {
                    return context.folders.length;
                },
                getConfigurationValue: (folderUri, section) => {
                    return configProvider.getConfiguration(undefined, folderUri).get(section);
                },
                getAppRoot: () => {
                    return process.cwd();
                },
                getExecPath: () => {
                    return process.env['VSCODE_EXEC_PATH'];
                },
                getFilePath: () => {
                    const activeUri = getActiveUri();
                    if (activeUri) {
                        return path.normalize(activeUri.fsPath);
                    }
                    return undefined;
                },
                getWorkspaceFolderPathForFile: () => {
                    if (workspaceService) {
                        const activeUri = getActiveUri();
                        if (activeUri) {
                            const ws = workspaceService.getWorkspaceFolder(activeUri);
                            if (ws) {
                                return path.normalize(ws.uri.fsPath);
                            }
                        }
                    }
                    return undefined;
                },
                getSelectedText: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor && !activeEditor.selection.isEmpty) {
                            return activeEditor.document.getText(activeEditor.selection);
                        }
                    }
                    return undefined;
                },
                getLineNumber: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor) {
                            return String(activeEditor.selection.end.line + 1);
                        }
                    }
                    return undefined;
                },
                getExtension: (id) => {
                    return extensionService.getExtension(id);
                },
            }, undefined, homeDir ? Promise.resolve(homeDir) : undefined, Promise.resolve(process.env));
        }
    }
    let ExtHostVariableResolverProviderService = class ExtHostVariableResolverProviderService extends lifecycle_1.Disposable {
        constructor(extensionService, workspaceService, editorService, configurationService, editorTabs) {
            super();
            this.extensionService = extensionService;
            this.workspaceService = workspaceService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.editorTabs = editorTabs;
            this._resolver = new lazy_1.Lazy(async () => {
                const configProvider = await this.configurationService.getConfigProvider();
                const folders = await this.workspaceService.getWorkspaceFolders2() || [];
                const dynamic = { folders };
                this._register(this.workspaceService.onDidChangeWorkspace(async (e) => {
                    dynamic.folders = await this.workspaceService.getWorkspaceFolders2() || [];
                }));
                return new ExtHostVariableResolverService(this.extensionService, this.workspaceService, this.editorService, this.editorTabs, configProvider, dynamic, this.homeDir());
            });
        }
        getResolver() {
            return this._resolver.getValue();
        }
        homeDir() {
            return undefined;
        }
    };
    ExtHostVariableResolverProviderService = __decorate([
        __param(0, extHostExtensionService_1.IExtHostExtensionService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostEditorTabs_1.IExtHostEditorTabs)
    ], ExtHostVariableResolverProviderService);
    exports.ExtHostVariableResolverProviderService = ExtHostVariableResolverProviderService;
});
//# sourceMappingURL=extHostVariableResolverService.js.map