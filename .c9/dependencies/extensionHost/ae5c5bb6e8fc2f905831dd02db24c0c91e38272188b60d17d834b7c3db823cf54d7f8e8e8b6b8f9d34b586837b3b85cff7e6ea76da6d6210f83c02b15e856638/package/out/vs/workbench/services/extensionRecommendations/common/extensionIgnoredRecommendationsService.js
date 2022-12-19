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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig"], function (require, exports, arrays_1, event_1, lifecycle_1, extensions_1, storage_1, extensionRecommendations_1, workspaceExtensionsConfig_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionIgnoredRecommendationsService = void 0;
    const ignoredRecommendationsStorageKey = 'extensionsAssistant/ignored_recommendations';
    let ExtensionIgnoredRecommendationsService = class ExtensionIgnoredRecommendationsService extends lifecycle_1.Disposable {
        constructor(workspaceExtensionsConfigService, storageService) {
            super();
            this.workspaceExtensionsConfigService = workspaceExtensionsConfigService;
            this.storageService = storageService;
            this._onDidChangeIgnoredRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeIgnoredRecommendations = this._onDidChangeIgnoredRecommendations.event;
            // Global Ignored Recommendations
            this._globalIgnoredRecommendations = [];
            this._onDidChangeGlobalIgnoredRecommendation = this._register(new event_1.Emitter());
            this.onDidChangeGlobalIgnoredRecommendation = this._onDidChangeGlobalIgnoredRecommendation.event;
            // Ignored Workspace Recommendations
            this.ignoredWorkspaceRecommendations = [];
            this._globalIgnoredRecommendations = this.getCachedIgnoredRecommendations();
            this._register(this.storageService.onDidChangeValue(e => this.onDidStorageChange(e)));
            this.initIgnoredWorkspaceRecommendations();
        }
        get globalIgnoredRecommendations() { return [...this._globalIgnoredRecommendations]; }
        get ignoredRecommendations() { return (0, arrays_1.distinct)([...this.globalIgnoredRecommendations, ...this.ignoredWorkspaceRecommendations]); }
        async initIgnoredWorkspaceRecommendations() {
            this.ignoredWorkspaceRecommendations = await this.workspaceExtensionsConfigService.getUnwantedRecommendations();
            this._onDidChangeIgnoredRecommendations.fire();
            this._register(this.workspaceExtensionsConfigService.onDidChangeExtensionsConfigs(async () => {
                this.ignoredWorkspaceRecommendations = await this.workspaceExtensionsConfigService.getUnwantedRecommendations();
                this._onDidChangeIgnoredRecommendations.fire();
            }));
        }
        toggleGlobalIgnoredRecommendation(extensionId, shouldIgnore) {
            extensionId = extensionId.toLowerCase();
            const ignored = this._globalIgnoredRecommendations.indexOf(extensionId) !== -1;
            if (ignored === shouldIgnore) {
                return;
            }
            this._globalIgnoredRecommendations = shouldIgnore ? [...this._globalIgnoredRecommendations, extensionId] : this._globalIgnoredRecommendations.filter(id => id !== extensionId);
            this.storeCachedIgnoredRecommendations(this._globalIgnoredRecommendations);
            this._onDidChangeGlobalIgnoredRecommendation.fire({ extensionId, isRecommended: !shouldIgnore });
            this._onDidChangeIgnoredRecommendations.fire();
        }
        getCachedIgnoredRecommendations() {
            const ignoredRecommendations = JSON.parse(this.ignoredRecommendationsValue);
            return ignoredRecommendations.map(e => e.toLowerCase());
        }
        onDidStorageChange(e) {
            if (e.key === ignoredRecommendationsStorageKey && e.scope === 0 /* StorageScope.GLOBAL */
                && this.ignoredRecommendationsValue !== this.getStoredIgnoredRecommendationsValue() /* This checks if current window changed the value or not */) {
                this._ignoredRecommendationsValue = undefined;
                this._globalIgnoredRecommendations = this.getCachedIgnoredRecommendations();
                this._onDidChangeIgnoredRecommendations.fire();
            }
        }
        storeCachedIgnoredRecommendations(ignoredRecommendations) {
            this.ignoredRecommendationsValue = JSON.stringify(ignoredRecommendations);
        }
        get ignoredRecommendationsValue() {
            if (!this._ignoredRecommendationsValue) {
                this._ignoredRecommendationsValue = this.getStoredIgnoredRecommendationsValue();
            }
            return this._ignoredRecommendationsValue;
        }
        set ignoredRecommendationsValue(ignoredRecommendationsValue) {
            if (this.ignoredRecommendationsValue !== ignoredRecommendationsValue) {
                this._ignoredRecommendationsValue = ignoredRecommendationsValue;
                this.setStoredIgnoredRecommendationsValue(ignoredRecommendationsValue);
            }
        }
        getStoredIgnoredRecommendationsValue() {
            return this.storageService.get(ignoredRecommendationsStorageKey, 0 /* StorageScope.GLOBAL */, '[]');
        }
        setStoredIgnoredRecommendationsValue(value) {
            this.storageService.store(ignoredRecommendationsStorageKey, value, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
    };
    ExtensionIgnoredRecommendationsService = __decorate([
        __param(0, workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService),
        __param(1, storage_1.IStorageService)
    ], ExtensionIgnoredRecommendationsService);
    exports.ExtensionIgnoredRecommendationsService = ExtensionIgnoredRecommendationsService;
    (0, extensions_1.registerSingleton)(extensionRecommendations_1.IExtensionIgnoredRecommendationsService, ExtensionIgnoredRecommendationsService);
});
//# sourceMappingURL=extensionIgnoredRecommendationsService.js.map