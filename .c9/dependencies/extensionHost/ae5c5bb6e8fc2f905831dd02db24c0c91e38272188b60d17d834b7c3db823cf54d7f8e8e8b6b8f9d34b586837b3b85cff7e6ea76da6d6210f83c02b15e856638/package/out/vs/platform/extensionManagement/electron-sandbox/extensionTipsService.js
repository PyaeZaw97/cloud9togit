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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/collections", "vs/base/common/event", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/extensionTipsService", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/native/electron-sandbox/native", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry"], function (require, exports, arrays_1, async_1, collections_1, event_1, path_1, platform_1, process_1, uri_1, nls_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionTipsService_1, extensionRecommendations_1, files_1, log_1, native_1, productService_1, request_1, storage_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionTipsService = void 0;
    const promptedExecutableTipsStorageKey = 'extensionTips/promptedExecutableTips';
    const lastPromptedMediumImpExeTimeStorageKey = 'extensionTips/lastPromptedMediumImpExeTime';
    let ExtensionTipsService = class ExtensionTipsService extends extensionTipsService_1.ExtensionTipsService {
        constructor(environmentService, telemetryService, extensionManagementService, storageService, nativeHostService, extensionRecommendationNotificationService, fileService, productService, requestService, logService) {
            super(fileService, productService, requestService, logService);
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.extensionManagementService = extensionManagementService;
            this.storageService = storageService;
            this.nativeHostService = nativeHostService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.highImportanceExecutableTips = new Map();
            this.mediumImportanceExecutableTips = new Map();
            this.allOtherExecutableTips = new Map();
            this.highImportanceTipsByExe = new Map();
            this.mediumImportanceTipsByExe = new Map();
            if (productService.exeBasedExtensionTips) {
                (0, collections_1.forEach)(productService.exeBasedExtensionTips, ({ key, value: exeBasedExtensionTip }) => {
                    const highImportanceRecommendations = [];
                    const mediumImportanceRecommendations = [];
                    const otherRecommendations = [];
                    (0, collections_1.forEach)(exeBasedExtensionTip.recommendations, ({ key: extensionId, value }) => {
                        if (value.important) {
                            if (exeBasedExtensionTip.important) {
                                highImportanceRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                            }
                            else {
                                mediumImportanceRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                            }
                        }
                        else {
                            otherRecommendations.push({ extensionId, extensionName: value.name, isExtensionPack: !!value.isExtensionPack });
                        }
                    });
                    if (highImportanceRecommendations.length) {
                        this.highImportanceExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: highImportanceRecommendations });
                    }
                    if (mediumImportanceRecommendations.length) {
                        this.mediumImportanceExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: mediumImportanceRecommendations });
                    }
                    if (otherRecommendations.length) {
                        this.allOtherExecutableTips.set(key, { exeFriendlyName: exeBasedExtensionTip.friendlyName, windowsPath: exeBasedExtensionTip.windowsPath, recommendations: otherRecommendations });
                    }
                });
            }
            /*
                3s has come out to be the good number to fetch and prompt important exe based recommendations
                Also fetch important exe based recommendations for reporting telemetry
            */
            (0, async_1.timeout)(3000).then(async () => {
                await this.collectTips();
                this.promptHighImportanceExeBasedTip();
                this.promptMediumImportanceExeBasedTip();
            });
        }
        async getImportantExecutableBasedTips() {
            const highImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.highImportanceExecutableTips);
            const mediumImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.mediumImportanceExecutableTips);
            return [...highImportanceExeTips, ...mediumImportanceExeTips];
        }
        getOtherExecutableBasedTips() {
            return this.getValidExecutableBasedExtensionTips(this.allOtherExecutableTips);
        }
        async collectTips() {
            const highImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.highImportanceExecutableTips);
            const mediumImportanceExeTips = await this.getValidExecutableBasedExtensionTips(this.mediumImportanceExecutableTips);
            const local = await this.extensionManagementService.getInstalled();
            this.highImportanceTipsByExe = this.groupImportantTipsByExe(highImportanceExeTips, local);
            this.mediumImportanceTipsByExe = this.groupImportantTipsByExe(mediumImportanceExeTips, local);
        }
        groupImportantTipsByExe(importantExeBasedTips, local) {
            const importantExeBasedRecommendations = new Map();
            importantExeBasedTips.forEach(tip => importantExeBasedRecommendations.set(tip.extensionId.toLowerCase(), tip));
            const { installed, uninstalled: recommendations } = this.groupByInstalled([...importantExeBasedRecommendations.keys()], local);
            /* Log installed and uninstalled exe based recommendations */
            for (const extensionId of installed) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip) {
                    this.telemetryService.publicLog2('exeExtensionRecommendations:alreadyInstalled', { extensionId, exeName: tip.exeName });
                }
            }
            for (const extensionId of recommendations) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip) {
                    this.telemetryService.publicLog2('exeExtensionRecommendations:notInstalled', { extensionId, exeName: tip.exeName });
                }
            }
            const promptedExecutableTips = this.getPromptedExecutableTips();
            const tipsByExe = new Map();
            for (const extensionId of recommendations) {
                const tip = importantExeBasedRecommendations.get(extensionId);
                if (tip && (!promptedExecutableTips[tip.exeName] || !promptedExecutableTips[tip.exeName].includes(tip.extensionId))) {
                    let tips = tipsByExe.get(tip.exeName);
                    if (!tips) {
                        tips = [];
                        tipsByExe.set(tip.exeName, tips);
                    }
                    tips.push(tip);
                }
            }
            return tipsByExe;
        }
        /**
         * High importance tips are prompted once per restart session
         */
        promptHighImportanceExeBasedTip() {
            if (this.highImportanceTipsByExe.size === 0) {
                return;
            }
            const [exeName, tips] = [...this.highImportanceTipsByExe.entries()][0];
            this.promptExeRecommendations(tips)
                .then(result => {
                switch (result) {
                    case "reacted" /* RecommendationsNotificationResult.Accepted */:
                        this.addToRecommendedExecutables(tips[0].exeName, tips);
                        break;
                    case "ignored" /* RecommendationsNotificationResult.Ignored */:
                        this.highImportanceTipsByExe.delete(exeName);
                        break;
                    case "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */: {
                        // Recommended in incompatible window. Schedule the prompt after active window change
                        const onActiveWindowChange = event_1.Event.once(event_1.Event.latch(event_1.Event.any(this.nativeHostService.onDidOpenWindow, this.nativeHostService.onDidFocusWindow)));
                        this._register(onActiveWindowChange(() => this.promptHighImportanceExeBasedTip()));
                        break;
                    }
                    case "toomany" /* RecommendationsNotificationResult.TooMany */: {
                        // Too many notifications. Schedule the prompt after one hour
                        const disposable = this._register((0, async_1.disposableTimeout)(() => { disposable.dispose(); this.promptHighImportanceExeBasedTip(); }, 60 * 60 * 1000 /* 1 hour */));
                        break;
                    }
                }
            });
        }
        /**
         * Medium importance tips are prompted once per 7 days
         */
        promptMediumImportanceExeBasedTip() {
            if (this.mediumImportanceTipsByExe.size === 0) {
                return;
            }
            const lastPromptedMediumExeTime = this.getLastPromptedMediumExeTime();
            const timeSinceLastPrompt = Date.now() - lastPromptedMediumExeTime;
            const promptInterval = 7 * 24 * 60 * 60 * 1000; // 7 Days
            if (timeSinceLastPrompt < promptInterval) {
                // Wait until interval and prompt
                const disposable = this._register((0, async_1.disposableTimeout)(() => { disposable.dispose(); this.promptMediumImportanceExeBasedTip(); }, promptInterval - timeSinceLastPrompt));
                return;
            }
            const [exeName, tips] = [...this.mediumImportanceTipsByExe.entries()][0];
            this.promptExeRecommendations(tips)
                .then(result => {
                switch (result) {
                    case "reacted" /* RecommendationsNotificationResult.Accepted */: {
                        // Accepted: Update the last prompted time and caches.
                        this.updateLastPromptedMediumExeTime(Date.now());
                        this.mediumImportanceTipsByExe.delete(exeName);
                        this.addToRecommendedExecutables(tips[0].exeName, tips);
                        // Schedule the next recommendation for next internval
                        const disposable1 = this._register((0, async_1.disposableTimeout)(() => { disposable1.dispose(); this.promptMediumImportanceExeBasedTip(); }, promptInterval));
                        break;
                    }
                    case "ignored" /* RecommendationsNotificationResult.Ignored */:
                        // Ignored: Remove from the cache and prompt next recommendation
                        this.mediumImportanceTipsByExe.delete(exeName);
                        this.promptMediumImportanceExeBasedTip();
                        break;
                    case "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */: {
                        // Recommended in incompatible window. Schedule the prompt after active window change
                        const onActiveWindowChange = event_1.Event.once(event_1.Event.latch(event_1.Event.any(this.nativeHostService.onDidOpenWindow, this.nativeHostService.onDidFocusWindow)));
                        this._register(onActiveWindowChange(() => this.promptMediumImportanceExeBasedTip()));
                        break;
                    }
                    case "toomany" /* RecommendationsNotificationResult.TooMany */: {
                        // Too many notifications. Schedule the prompt after one hour
                        const disposable2 = this._register((0, async_1.disposableTimeout)(() => { disposable2.dispose(); this.promptMediumImportanceExeBasedTip(); }, 60 * 60 * 1000 /* 1 hour */));
                        break;
                    }
                }
            });
        }
        async promptExeRecommendations(tips) {
            const installed = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            const extensionIds = tips
                .filter(tip => !tip.whenNotInstalled || tip.whenNotInstalled.every(id => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id }))))
                .map(({ extensionId }) => extensionId.toLowerCase());
            const message = (0, nls_1.localize)({ key: 'exeRecommended', comment: ['Placeholder string is the name of the software that is installed.'] }, "You have {0} installed on your system. Do you want to install the recommended extensions for it?", tips[0].exeFriendlyName);
            return this.extensionRecommendationNotificationService.promptImportantExtensionsInstallNotification(extensionIds, message, `@exe:"${tips[0].exeName}"`, 3 /* RecommendationSource.EXE */);
        }
        getLastPromptedMediumExeTime() {
            let value = this.storageService.getNumber(lastPromptedMediumImpExeTimeStorageKey, 0 /* StorageScope.GLOBAL */);
            if (!value) {
                value = Date.now();
                this.updateLastPromptedMediumExeTime(value);
            }
            return value;
        }
        updateLastPromptedMediumExeTime(value) {
            this.storageService.store(lastPromptedMediumImpExeTimeStorageKey, value, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        getPromptedExecutableTips() {
            return JSON.parse(this.storageService.get(promptedExecutableTipsStorageKey, 0 /* StorageScope.GLOBAL */, '{}'));
        }
        addToRecommendedExecutables(exeName, tips) {
            const promptedExecutableTips = this.getPromptedExecutableTips();
            promptedExecutableTips[exeName] = tips.map(({ extensionId }) => extensionId.toLowerCase());
            this.storageService.store(promptedExecutableTipsStorageKey, JSON.stringify(promptedExecutableTips), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        groupByInstalled(recommendationsToSuggest, local) {
            const installed = [], uninstalled = [];
            const installedExtensionsIds = local.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            recommendationsToSuggest.forEach(id => {
                if (installedExtensionsIds.has(id.toLowerCase())) {
                    installed.push(id);
                }
                else {
                    uninstalled.push(id);
                }
            });
            return { installed, uninstalled };
        }
        async getValidExecutableBasedExtensionTips(executableTips) {
            const result = [];
            const checkedExecutables = new Map();
            for (const exeName of executableTips.keys()) {
                const extensionTip = executableTips.get(exeName);
                if (!extensionTip || !(0, arrays_1.isNonEmptyArray)(extensionTip.recommendations)) {
                    continue;
                }
                const exePaths = [];
                if (platform_1.isWindows) {
                    if (extensionTip.windowsPath) {
                        exePaths.push(extensionTip.windowsPath.replace('%USERPROFILE%', process_1.env['USERPROFILE'])
                            .replace('%ProgramFiles(x86)%', process_1.env['ProgramFiles(x86)'])
                            .replace('%ProgramFiles%', process_1.env['ProgramFiles'])
                            .replace('%APPDATA%', process_1.env['APPDATA'])
                            .replace('%WINDIR%', process_1.env['WINDIR']));
                    }
                }
                else {
                    exePaths.push((0, path_1.join)('/usr/local/bin', exeName));
                    exePaths.push((0, path_1.join)('/usr/bin', exeName));
                    exePaths.push((0, path_1.join)(this.environmentService.userHome.fsPath, exeName));
                }
                for (const exePath of exePaths) {
                    let exists = checkedExecutables.get(exePath);
                    if (exists === undefined) {
                        exists = await this.fileService.exists(uri_1.URI.file(exePath));
                        checkedExecutables.set(exePath, exists);
                    }
                    if (exists) {
                        for (const { extensionId, extensionName, isExtensionPack, whenNotInstalled } of extensionTip.recommendations) {
                            result.push({
                                extensionId,
                                extensionName,
                                isExtensionPack,
                                exeName,
                                exeFriendlyName: extensionTip.exeFriendlyName,
                                windowsPath: extensionTip.windowsPath,
                                whenNotInstalled: whenNotInstalled
                            });
                        }
                    }
                }
            }
            return result;
        }
    };
    ExtensionTipsService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, storage_1.IStorageService),
        __param(4, native_1.INativeHostService),
        __param(5, extensionRecommendations_1.IExtensionRecommendationNotificationService),
        __param(6, files_1.IFileService),
        __param(7, productService_1.IProductService),
        __param(8, request_1.IRequestService),
        __param(9, log_1.ILogService)
    ], ExtensionTipsService);
    exports.ExtensionTipsService = ExtensionTipsService;
});
//# sourceMappingURL=extensionTipsService.js.map