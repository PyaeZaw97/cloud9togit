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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/label/common/label", "vs/workbench/contrib/extensions/electron-sandbox/extensionsSlowActions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/extensions/electron-sandbox/reportExtensionIssueAction", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/native/electron-sandbox/native", "vs/platform/profiling/common/profiling", "vs/platform/clipboard/common/clipboardService"], function (require, exports, nls, actions_1, telemetry_1, instantiation_1, extensions_1, themeService_1, extensions_2, contextView_1, notification_1, contextkey_1, storage_1, label_1, extensionsSlowActions_1, environmentService_1, reportExtensionIssueAction_1, abstractRuntimeExtensionsEditor_1, buffer_1, uri_1, files_1, native_1, profiling_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveExtensionHostProfileAction = exports.StopExtensionHostProfileAction = exports.StartExtensionHostProfileAction = exports.RuntimeExtensionsEditor = exports.ProfileSessionState = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = exports.CONTEXT_PROFILE_SESSION_STATE = exports.IExtensionHostProfileService = void 0;
    exports.IExtensionHostProfileService = (0, instantiation_1.createDecorator)('extensionHostProfileService');
    exports.CONTEXT_PROFILE_SESSION_STATE = new contextkey_1.RawContextKey('profileSessionState', 'none');
    exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = new contextkey_1.RawContextKey('extensionHostProfileRecorded', false);
    var ProfileSessionState;
    (function (ProfileSessionState) {
        ProfileSessionState[ProfileSessionState["None"] = 0] = "None";
        ProfileSessionState[ProfileSessionState["Starting"] = 1] = "Starting";
        ProfileSessionState[ProfileSessionState["Running"] = 2] = "Running";
        ProfileSessionState[ProfileSessionState["Stopping"] = 3] = "Stopping";
    })(ProfileSessionState = exports.ProfileSessionState || (exports.ProfileSessionState = {}));
    let RuntimeExtensionsEditor = class RuntimeExtensionsEditor extends abstractRuntimeExtensionsEditor_1.AbstractRuntimeExtensionsEditor {
        constructor(telemetryService, themeService, contextKeyService, extensionsWorkbenchService, extensionService, notificationService, contextMenuService, instantiationService, storageService, labelService, environmentService, clipboardService, _extensionHostProfileService) {
            super(telemetryService, themeService, contextKeyService, extensionsWorkbenchService, extensionService, notificationService, contextMenuService, instantiationService, storageService, labelService, environmentService, clipboardService);
            this._extensionHostProfileService = _extensionHostProfileService;
            this._profileInfo = this._extensionHostProfileService.lastProfile;
            this._extensionsHostRecorded = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED.bindTo(contextKeyService);
            this._profileSessionState = exports.CONTEXT_PROFILE_SESSION_STATE.bindTo(contextKeyService);
            this._register(this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this._profileInfo = this._extensionHostProfileService.lastProfile;
                this._extensionsHostRecorded.set(!!this._profileInfo);
                this._updateExtensions();
            }));
            this._register(this._extensionHostProfileService.onDidChangeState(() => {
                const state = this._extensionHostProfileService.state;
                this._profileSessionState.set(ProfileSessionState[state].toLowerCase());
            }));
        }
        _getProfileInfo() {
            return this._profileInfo;
        }
        _getUnresponsiveProfile(extensionId) {
            return this._extensionHostProfileService.getUnresponsiveProfile(extensionId);
        }
        _createSlowExtensionAction(element) {
            if (element.unresponsiveProfile) {
                return this._instantiationService.createInstance(extensionsSlowActions_1.SlowExtensionAction, element.description, element.unresponsiveProfile);
            }
            return null;
        }
        _createReportExtensionIssueAction(element) {
            if (element.marketplaceInfo) {
                return this._instantiationService.createInstance(reportExtensionIssueAction_1.ReportExtensionIssueAction, {
                    description: element.description,
                    marketplaceInfo: element.marketplaceInfo,
                    status: element.status,
                    unresponsiveProfile: element.unresponsiveProfile
                });
            }
            return null;
        }
        _createSaveExtensionHostProfileAction() {
            return this._instantiationService.createInstance(SaveExtensionHostProfileAction, SaveExtensionHostProfileAction.ID, SaveExtensionHostProfileAction.LABEL);
        }
        _createProfileAction() {
            const state = this._extensionHostProfileService.state;
            const profileAction = (state === ProfileSessionState.Running
                ? this._instantiationService.createInstance(StopExtensionHostProfileAction, StopExtensionHostProfileAction.ID, StopExtensionHostProfileAction.LABEL)
                : this._instantiationService.createInstance(StartExtensionHostProfileAction, StartExtensionHostProfileAction.ID, StartExtensionHostProfileAction.LABEL));
            return profileAction;
        }
    };
    RuntimeExtensionsEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensions_2.IExtensionService),
        __param(5, notification_1.INotificationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, storage_1.IStorageService),
        __param(9, label_1.ILabelService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, clipboardService_1.IClipboardService),
        __param(12, exports.IExtensionHostProfileService)
    ], RuntimeExtensionsEditor);
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor;
    let StartExtensionHostProfileAction = class StartExtensionHostProfileAction extends actions_1.Action {
        constructor(id = StartExtensionHostProfileAction.ID, label = StartExtensionHostProfileAction.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.startProfiling();
            return Promise.resolve();
        }
    };
    StartExtensionHostProfileAction.ID = 'workbench.extensions.action.extensionHostProfile';
    StartExtensionHostProfileAction.LABEL = nls.localize('extensionHostProfileStart', "Start Extension Host Profile");
    StartExtensionHostProfileAction = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StartExtensionHostProfileAction);
    exports.StartExtensionHostProfileAction = StartExtensionHostProfileAction;
    let StopExtensionHostProfileAction = class StopExtensionHostProfileAction extends actions_1.Action {
        constructor(id = StartExtensionHostProfileAction.ID, label = StartExtensionHostProfileAction.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.stopProfiling();
            return Promise.resolve();
        }
    };
    StopExtensionHostProfileAction.ID = 'workbench.extensions.action.stopExtensionHostProfile';
    StopExtensionHostProfileAction.LABEL = nls.localize('stopExtensionHostProfileStart', "Stop Extension Host Profile");
    StopExtensionHostProfileAction = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StopExtensionHostProfileAction);
    exports.StopExtensionHostProfileAction = StopExtensionHostProfileAction;
    let SaveExtensionHostProfileAction = class SaveExtensionHostProfileAction extends actions_1.Action {
        constructor(id = SaveExtensionHostProfileAction.ID, label = SaveExtensionHostProfileAction.LABEL, _nativeHostService, _environmentService, _extensionHostProfileService, _fileService) {
            super(id, label, undefined, false);
            this._nativeHostService = _nativeHostService;
            this._environmentService = _environmentService;
            this._extensionHostProfileService = _extensionHostProfileService;
            this._fileService = _fileService;
            this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this.enabled = (this._extensionHostProfileService.lastProfile !== null);
            });
        }
        run() {
            return Promise.resolve(this._asyncRun());
        }
        async _asyncRun() {
            let picked = await this._nativeHostService.showSaveDialog({
                title: 'Save Extension Host Profile',
                buttonLabel: 'Save',
                defaultPath: `CPU-${new Date().toISOString().replace(/[\-:]/g, '')}.cpuprofile`,
                filters: [{
                        name: 'CPU Profiles',
                        extensions: ['cpuprofile', 'txt']
                    }]
            });
            if (!picked || !picked.filePath || picked.canceled) {
                return;
            }
            const profileInfo = this._extensionHostProfileService.lastProfile;
            let dataToWrite = profileInfo ? profileInfo.data : {};
            let savePath = picked.filePath;
            if (this._environmentService.isBuilt) {
                // when running from a not-development-build we remove
                // absolute filenames because we don't want to reveal anything
                // about users. We also append the `.txt` suffix to make it
                // easier to attach these files to GH issues
                dataToWrite = profiling_1.Utils.rewriteAbsolutePaths(dataToWrite, 'piiRemoved');
                savePath = savePath + '.txt';
            }
            return this._fileService.writeFile(uri_1.URI.file(savePath), buffer_1.VSBuffer.fromString(JSON.stringify(profileInfo ? profileInfo.data : {}, null, '\t')));
        }
    };
    SaveExtensionHostProfileAction.LABEL = nls.localize('saveExtensionHostProfile', "Save Extension Host Profile");
    SaveExtensionHostProfileAction.ID = 'workbench.extensions.action.saveExtensionHostProfile';
    SaveExtensionHostProfileAction = __decorate([
        __param(2, native_1.INativeHostService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, exports.IExtensionHostProfileService),
        __param(5, files_1.IFileService)
    ], SaveExtensionHostProfileAction);
    exports.SaveExtensionHostProfileAction = SaveExtensionHostProfileAction;
});
//# sourceMappingURL=runtimeExtensionsEditor.js.map