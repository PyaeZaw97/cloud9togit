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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/nls", "vs/platform/workspace/common/workspace", "vs/base/common/event"], function (require, exports, extensionManagement_1, extensionRecommendations_1, nls_1, workspace_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigBasedRecommendations = void 0;
    let ConfigBasedRecommendations = class ConfigBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(extensionTipsService, workspaceContextService) {
            super();
            this.extensionTipsService = extensionTipsService;
            this.workspaceContextService = workspaceContextService;
            this.importantTips = [];
            this.otherTips = [];
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this._otherRecommendations = [];
            this._importantRecommendations = [];
        }
        get otherRecommendations() { return this._otherRecommendations; }
        get importantRecommendations() { return this._importantRecommendations; }
        get recommendations() { return [...this.importantRecommendations, ...this.otherRecommendations]; }
        async doActivate() {
            await this.fetch();
            this._register(this.workspaceContextService.onDidChangeWorkspaceFolders(e => this.onWorkspaceFoldersChanged(e)));
        }
        async fetch() {
            const workspace = this.workspaceContextService.getWorkspace();
            const importantTips = new Map();
            const otherTips = new Map();
            for (const folder of workspace.folders) {
                const configBasedTips = await this.extensionTipsService.getConfigBasedTips(folder.uri);
                for (const tip of configBasedTips) {
                    if (tip.important) {
                        importantTips.set(tip.extensionId, tip);
                    }
                    else {
                        otherTips.set(tip.extensionId, tip);
                    }
                }
            }
            this.importantTips = [...importantTips.values()];
            this.otherTips = [...otherTips.values()].filter(tip => !importantTips.has(tip.extensionId));
            this._otherRecommendations = this.otherTips.map(tip => this.toExtensionRecommendation(tip));
            this._importantRecommendations = this.importantTips.map(tip => this.toExtensionRecommendation(tip));
        }
        async onWorkspaceFoldersChanged(event) {
            if (event.added.length) {
                const oldImportantRecommended = this.importantTips;
                await this.fetch();
                // Suggest only if at least one of the newly added recommendations was not suggested before
                if (this.importantTips.some(current => oldImportantRecommended.every(old => current.extensionId !== old.extensionId))) {
                    this._onDidChangeRecommendations.fire();
                }
            }
        }
        toExtensionRecommendation(tip) {
            return {
                extensionId: tip.extensionId,
                reason: {
                    reasonId: 3 /* ExtensionRecommendationReason.WorkspaceConfig */,
                    reasonText: (0, nls_1.localize)('exeBasedRecommendation', "This extension is recommended because of the current workspace configuration")
                },
                whenNotInstalled: tip.whenNotInstalled
            };
        }
    };
    ConfigBasedRecommendations = __decorate([
        __param(0, extensionManagement_1.IExtensionTipsService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ConfigBasedRecommendations);
    exports.ConfigBasedRecommendations = ConfigBasedRecommendations;
});
//# sourceMappingURL=configBasedRecommendations.js.map