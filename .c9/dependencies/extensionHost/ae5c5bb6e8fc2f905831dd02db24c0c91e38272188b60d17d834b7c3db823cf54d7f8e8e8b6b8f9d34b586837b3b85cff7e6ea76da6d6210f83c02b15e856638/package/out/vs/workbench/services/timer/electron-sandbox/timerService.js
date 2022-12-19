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
define(["require", "exports", "vs/platform/native/electron-sandbox/native", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/platform/update/common/update", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/timer/browser/timerService", "vs/platform/telemetry/common/telemetry", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, native_1, environmentService_1, workspace_1, extensions_1, update_1, lifecycle_1, editorService_1, accessibility_1, timerService_1, telemetry_1, globals_1, extensions_2, layoutService_1, productService_1, storage_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.didUseCachedData = exports.TimerService = void 0;
    let TimerService = class TimerService extends timerService_1.AbstractTimerService {
        constructor(_nativeHostService, _environmentService, lifecycleService, contextService, extensionService, updateService, paneCompositeService, editorService, accessibilityService, telemetryService, layoutService, _productService, _storageService) {
            super(lifecycleService, contextService, extensionService, updateService, paneCompositeService, editorService, accessibilityService, telemetryService, layoutService);
            this._nativeHostService = _nativeHostService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._storageService = _storageService;
            this.setPerformanceMarks('main', _environmentService.window.perfMarks);
        }
        _isInitialStartup() {
            return Boolean(this._environmentService.window.isInitialStartup);
        }
        _didUseCachedData() {
            return didUseCachedData(this._productService, this._storageService, this._environmentService);
        }
        _getWindowCount() {
            return this._nativeHostService.getWindowCount();
        }
        async _extendStartupInfo(info) {
            try {
                const [osProperties, osStatistics, virtualMachineHint] = await Promise.all([
                    this._nativeHostService.getOSProperties(),
                    this._nativeHostService.getOSStatistics(),
                    this._nativeHostService.getOSVirtualMachineHint()
                ]);
                info.totalmem = osStatistics.totalmem;
                info.freemem = osStatistics.freemem;
                info.platform = osProperties.platform;
                info.release = osProperties.release;
                info.arch = osProperties.arch;
                info.loadavg = osStatistics.loadavg;
                const processMemoryInfo = await globals_1.process.getProcessMemoryInfo();
                info.meminfo = {
                    workingSetSize: processMemoryInfo.residentSet,
                    privateBytes: processMemoryInfo.private,
                    sharedBytes: processMemoryInfo.shared
                };
                info.isVMLikelyhood = Math.round((virtualMachineHint * 100));
                const rawCpus = osProperties.cpus;
                if (rawCpus && rawCpus.length > 0) {
                    info.cpus = { count: rawCpus.length, speed: rawCpus[0].speed, model: rawCpus[0].model };
                }
            }
            catch (error) {
                // ignore, be on the safe side with these hardware method calls
            }
        }
    };
    TimerService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, extensions_1.IExtensionService),
        __param(5, update_1.IUpdateService),
        __param(6, panecomposite_1.IPaneCompositePartService),
        __param(7, editorService_1.IEditorService),
        __param(8, accessibility_1.IAccessibilityService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, layoutService_1.IWorkbenchLayoutService),
        __param(11, productService_1.IProductService),
        __param(12, storage_1.IStorageService)
    ], TimerService);
    exports.TimerService = TimerService;
    (0, extensions_2.registerSingleton)(timerService_1.ITimerService, TimerService);
    //#region cached data logic
    const lastRunningCommitStorageKey = 'perf/lastRunningCommit';
    let _didUseCachedData = undefined;
    function didUseCachedData(productService, storageService, environmentService) {
        // browser code loading: only a guess based on
        // this being the first start with the commit
        // or subsequent
        if (typeof _didUseCachedData !== 'boolean') {
            if (!environmentService.window.isCodeCaching || !productService.commit) {
                _didUseCachedData = false; // we only produce cached data whith commit and code cache path
            }
            else if (storageService.get(lastRunningCommitStorageKey, 0 /* StorageScope.GLOBAL */) === productService.commit) {
                _didUseCachedData = true; // subsequent start on same commit, assume cached data is there
            }
            else {
                storageService.store(lastRunningCommitStorageKey, productService.commit, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                _didUseCachedData = false; // first time start on commit, assume cached data is not yet there
            }
        }
        return _didUseCachedData;
    }
    exports.didUseCachedData = didUseCachedData;
});
//#endregion
//# sourceMappingURL=timerService.js.map