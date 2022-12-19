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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/workbench/contrib/tags/common/workspaceTags", "vs/base/common/types", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/nls"], function (require, exports, extensionManagement_1, storage_1, workspace_1, files_1, telemetry_1, arrays_1, workspaceTags_1, types_1, extensionRecommendations_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicWorkspaceRecommendations = void 0;
    const dynamicWorkspaceRecommendationsStorageKey = 'extensionsAssistant/dynamicWorkspaceRecommendations';
    const milliSecondsInADay = 1000 * 60 * 60 * 24;
    let DynamicWorkspaceRecommendations = class DynamicWorkspaceRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(extensionTipsService, workspaceTagsService, contextService, fileService, telemetryService, storageService) {
            super();
            this.extensionTipsService = extensionTipsService;
            this.workspaceTagsService = workspaceTagsService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        async doActivate() {
            await this.fetch();
            this._register(this.contextService.onDidChangeWorkbenchState(() => this._recommendations = []));
        }
        /**
         * Fetch extensions used by others on the same workspace as recommendations
         */
        async fetch() {
            this._register(this.contextService.onDidChangeWorkbenchState(() => this._recommendations = []));
            if (this._recommendations.length
                || this.contextService.getWorkbenchState() !== 2 /* WorkbenchState.FOLDER */
                || !this.fileService.hasProvider(this.contextService.getWorkspace().folders[0].uri)) {
                return;
            }
            const folder = this.contextService.getWorkspace().folders[0];
            const cachedDynamicWorkspaceRecommendations = this.getCachedDynamicWorkspaceRecommendations();
            if (cachedDynamicWorkspaceRecommendations) {
                this._recommendations = cachedDynamicWorkspaceRecommendations.map(id => this.toExtensionRecommendation(id, folder));
                this.telemetryService.publicLog2('dynamicWorkspaceRecommendations', { count: this._recommendations.length, cache: 1 });
                return;
            }
            const [hashedRemotes1, hashedRemotes2] = await Promise.all([this.workspaceTagsService.getHashedRemotesFromUri(folder.uri, false), this.workspaceTagsService.getHashedRemotesFromUri(folder.uri, true)]);
            const hashedRemotes = (hashedRemotes1 || []).concat(hashedRemotes2 || []);
            if (!hashedRemotes.length) {
                return;
            }
            const workspacesTips = await this.extensionTipsService.getAllWorkspacesTips();
            if (!workspacesTips.length) {
                return;
            }
            for (const hashedRemote of hashedRemotes) {
                const workspaceTip = workspacesTips.filter(workspaceTip => (0, arrays_1.isNonEmptyArray)(workspaceTip.remoteSet) && workspaceTip.remoteSet.indexOf(hashedRemote) > -1)[0];
                if (workspaceTip) {
                    this._recommendations = workspaceTip.recommendations.map(id => this.toExtensionRecommendation(id, folder));
                    this.storageService.store(dynamicWorkspaceRecommendationsStorageKey, JSON.stringify({ recommendations: workspaceTip.recommendations, timestamp: Date.now() }), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    this.telemetryService.publicLog2('dynamicWorkspaceRecommendations', { count: this._recommendations.length, cache: 0 });
                    return;
                }
            }
        }
        getCachedDynamicWorkspaceRecommendations() {
            try {
                const storedDynamicWorkspaceRecommendations = JSON.parse(this.storageService.get(dynamicWorkspaceRecommendationsStorageKey, 1 /* StorageScope.WORKSPACE */, '{}'));
                if ((0, arrays_1.isNonEmptyArray)(storedDynamicWorkspaceRecommendations.recommendations)
                    && (0, types_1.isNumber)(storedDynamicWorkspaceRecommendations.timestamp)
                    && storedDynamicWorkspaceRecommendations.timestamp > 0
                    && (Date.now() - storedDynamicWorkspaceRecommendations.timestamp) / milliSecondsInADay < 14) {
                    return storedDynamicWorkspaceRecommendations.recommendations;
                }
            }
            catch (e) {
                this.storageService.remove(dynamicWorkspaceRecommendationsStorageKey, 1 /* StorageScope.WORKSPACE */);
            }
            return undefined;
        }
        toExtensionRecommendation(extensionId, folder) {
            return {
                extensionId: extensionId.toLowerCase(),
                reason: {
                    reasonId: 4 /* ExtensionRecommendationReason.DynamicWorkspace */,
                    reasonText: (0, nls_1.localize)('dynamicWorkspaceRecommendation', "This extension may interest you because it's popular among users of the {0} repository.", folder.name)
                }
            };
        }
    };
    DynamicWorkspaceRecommendations = __decorate([
        __param(0, extensionManagement_1.IExtensionTipsService),
        __param(1, workspaceTags_1.IWorkspaceTagsService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, storage_1.IStorageService)
    ], DynamicWorkspaceRecommendations);
    exports.DynamicWorkspaceRecommendations = DynamicWorkspaceRecommendations;
});
//# sourceMappingURL=dynamicWorkspaceRecommendations.js.map