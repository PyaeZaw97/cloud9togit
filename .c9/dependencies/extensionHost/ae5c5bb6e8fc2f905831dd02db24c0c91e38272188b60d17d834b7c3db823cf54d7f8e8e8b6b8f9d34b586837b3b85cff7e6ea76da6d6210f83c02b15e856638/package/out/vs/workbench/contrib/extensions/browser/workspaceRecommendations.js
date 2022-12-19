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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/notification/common/notification", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/nls", "vs/base/common/event", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig"], function (require, exports, extensionManagement_1, arrays_1, extensionRecommendations_1, notification_1, log_1, cancellation_1, nls_1, event_1, workspaceExtensionsConfig_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceRecommendations = void 0;
    let WorkspaceRecommendations = class WorkspaceRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(workspaceExtensionsConfigService, galleryService, logService, notificationService) {
            super();
            this.workspaceExtensionsConfigService = workspaceExtensionsConfigService;
            this.galleryService = galleryService;
            this.logService = logService;
            this.notificationService = notificationService;
            this._recommendations = [];
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this._ignoredRecommendations = [];
        }
        get recommendations() { return this._recommendations; }
        get ignoredRecommendations() { return this._ignoredRecommendations; }
        async doActivate() {
            await this.fetch();
            this._register(this.workspaceExtensionsConfigService.onDidChangeExtensionsConfigs(() => this.onDidChangeExtensionsConfigs()));
        }
        /**
         * Parse all extensions.json files, fetch workspace recommendations, filter out invalid and unwanted ones
         */
        async fetch() {
            const extensionsConfigs = await this.workspaceExtensionsConfigService.getExtensionsConfigs();
            const { invalidRecommendations, message } = await this.validateExtensions(extensionsConfigs);
            if (invalidRecommendations.length) {
                this.notificationService.warn(`The ${invalidRecommendations.length} extension(s) below, in workspace recommendations have issues:\n${message}`);
            }
            this._recommendations = [];
            this._ignoredRecommendations = [];
            for (const extensionsConfig of extensionsConfigs) {
                if (extensionsConfig.unwantedRecommendations) {
                    for (const unwantedRecommendation of extensionsConfig.unwantedRecommendations) {
                        if (invalidRecommendations.indexOf(unwantedRecommendation) === -1) {
                            this._ignoredRecommendations.push(unwantedRecommendation);
                        }
                    }
                }
                if (extensionsConfig.recommendations) {
                    for (const extensionId of extensionsConfig.recommendations) {
                        if (invalidRecommendations.indexOf(extensionId) === -1) {
                            this._recommendations.push({
                                extensionId,
                                reason: {
                                    reasonId: 0 /* ExtensionRecommendationReason.Workspace */,
                                    reasonText: (0, nls_1.localize)('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
                                }
                            });
                        }
                    }
                }
            }
        }
        async validateExtensions(contents) {
            const validExtensions = [];
            const invalidExtensions = [];
            const extensionsToQuery = [];
            let message = '';
            const allRecommendations = (0, arrays_1.distinct)((0, arrays_1.flatten)(contents.map(({ recommendations }) => recommendations || [])));
            const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
            for (const extensionId of allRecommendations) {
                if (regEx.test(extensionId)) {
                    extensionsToQuery.push(extensionId);
                }
                else {
                    invalidExtensions.push(extensionId);
                    message += `${extensionId} (bad format) Expected: <provider>.<name>\n`;
                }
            }
            if (extensionsToQuery.length) {
                try {
                    const galleryExtensions = await this.galleryService.getExtensions(extensionsToQuery.map(id => ({ id })), cancellation_1.CancellationToken.None);
                    const extensions = galleryExtensions.map(extension => extension.identifier.id.toLowerCase());
                    for (const extensionId of extensionsToQuery) {
                        if (extensions.indexOf(extensionId) === -1) {
                            invalidExtensions.push(extensionId);
                            message += `${extensionId} (not found in marketplace)\n`;
                        }
                        else {
                            validExtensions.push(extensionId);
                        }
                    }
                }
                catch (e) {
                    this.logService.warn('Error querying extensions gallery', e);
                }
            }
            return { validRecommendations: validExtensions, invalidRecommendations: invalidExtensions, message };
        }
        async onDidChangeExtensionsConfigs() {
            await this.fetch();
            this._onDidChangeRecommendations.fire();
        }
    };
    WorkspaceRecommendations = __decorate([
        __param(0, workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, log_1.ILogService),
        __param(3, notification_1.INotificationService)
    ], WorkspaceRecommendations);
    exports.WorkspaceRecommendations = WorkspaceRecommendations;
});
//# sourceMappingURL=workspaceRecommendations.js.map