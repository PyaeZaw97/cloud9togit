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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/native/electron-sandbox/native", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/environment/common/environmentService", "vs/platform/window/common/window", "vs/base/common/lifecycle", "vs/platform/native/electron-sandbox/nativeHostService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, event_1, host_1, native_1, extensions_1, label_1, environmentService_1, window_1, lifecycle_1, nativeHostService_1, environmentService_2, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WorkbenchNativeHostService = class WorkbenchNativeHostService extends nativeHostService_1.NativeHostService {
        constructor(environmentService, mainProcessService) {
            super(environmentService.window.id, mainProcessService);
        }
    };
    WorkbenchNativeHostService = __decorate([
        __param(0, environmentService_2.INativeWorkbenchEnvironmentService),
        __param(1, services_1.IMainProcessService)
    ], WorkbenchNativeHostService);
    let WorkbenchHostService = class WorkbenchHostService extends lifecycle_1.Disposable {
        constructor(nativeHostService, labelService, environmentService) {
            super();
            this.nativeHostService = nativeHostService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            this._onDidChangeFocus = event_1.Event.latch(event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidFocusWindow, id => id === this.nativeHostService.windowId), () => this.hasFocus), event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidBlurWindow, id => id === this.nativeHostService.windowId), () => this.hasFocus)), undefined, this._store);
        }
        //#region Focus
        get onDidChangeFocus() { return this._onDidChangeFocus; }
        get hasFocus() {
            return document.hasFocus();
        }
        async hadLastFocus() {
            const activeWindowId = await this.nativeHostService.getActiveWindowId();
            if (typeof activeWindowId === 'undefined') {
                return false;
            }
            return activeWindowId === this.nativeHostService.windowId;
        }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        doOpenWindow(toOpen, options) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (!!remoteAuthority) {
                toOpen.forEach(openable => openable.label = openable.label || this.getRecentLabel(openable));
                if ((options === null || options === void 0 ? void 0 : options.remoteAuthority) === undefined) {
                    // set the remoteAuthority of the window the request came from.
                    // It will be used when the input is neither file nor vscode-remote.
                    options = options ? Object.assign(Object.assign({}, options), { remoteAuthority }) : { remoteAuthority };
                }
            }
            return this.nativeHostService.openWindow(toOpen, options);
        }
        getRecentLabel(openable) {
            if ((0, window_1.isFolderToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: true });
            }
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel({ id: '', configPath: openable.workspaceUri }, { verbose: true });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        doOpenEmptyWindow(options) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (!!remoteAuthority && (options === null || options === void 0 ? void 0 : options.remoteAuthority) === undefined) {
                // set the remoteAuthority of the window the request came from
                options = options ? Object.assign(Object.assign({}, options), { remoteAuthority }) : { remoteAuthority };
            }
            return this.nativeHostService.openWindow(options);
        }
        toggleFullScreen() {
            return this.nativeHostService.toggleFullScreen();
        }
        //#endregion
        //#region Lifecycle
        focus(options) {
            return this.nativeHostService.focusWindow(options);
        }
        restart() {
            return this.nativeHostService.relaunch();
        }
        reload(options) {
            return this.nativeHostService.reload(options);
        }
        close() {
            return this.nativeHostService.closeWindow();
        }
    };
    WorkbenchHostService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, label_1.ILabelService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkbenchHostService);
    (0, extensions_1.registerSingleton)(host_1.IHostService, WorkbenchHostService, true);
    (0, extensions_1.registerSingleton)(native_1.INativeHostService, WorkbenchNativeHostService, true);
});
//# sourceMappingURL=nativeHostService.js.map