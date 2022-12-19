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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/editor/browser/editorBrowser", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/native/electron-sandbox/native", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/timer/electron-sandbox/timerService", "vs/workbench/services/timer/browser/timerService", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/buffer", "vs/platform/workspace/common/workspaceTrust", "vs/platform/storage/common/storage", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, async_1, errors_1, editorBrowser_1, environmentService_1, lifecycle_1, productService_1, telemetry_1, update_1, native_1, files, editorService_1, timerService_1, timerService_2, files_1, uri_1, buffer_1, workspaceTrust_1, storage_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupTimings = void 0;
    let StartupTimings = class StartupTimings {
        constructor(_fileService, _timerService, _nativeHostService, _editorService, _paneCompositeService, _telemetryService, _lifecycleService, _updateService, _environmentService, _productService, _workspaceTrustService, _storageService) {
            this._fileService = _fileService;
            this._timerService = _timerService;
            this._nativeHostService = _nativeHostService;
            this._editorService = _editorService;
            this._paneCompositeService = _paneCompositeService;
            this._telemetryService = _telemetryService;
            this._lifecycleService = _lifecycleService;
            this._updateService = _updateService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._workspaceTrustService = _workspaceTrustService;
            this._storageService = _storageService;
            this._report().catch(errors_1.onUnexpectedError);
        }
        async _report() {
            const standardStartupError = await this._isStandardStartup();
            this._appendStartupTimes(standardStartupError).catch(errors_1.onUnexpectedError);
        }
        async _appendStartupTimes(standardStartupError) {
            const appendTo = this._environmentService.args['prof-append-timers'];
            if (!appendTo) {
                // nothing to do
                return;
            }
            const { sessionId } = await this._telemetryService.getTelemetryInfo();
            Promise.all([
                this._timerService.whenReady(),
                (0, async_1.timeout)(15000), // wait: cached data creation, telemetry sending
            ]).then(async () => {
                const uri = uri_1.URI.file(appendTo);
                const chunks = [];
                if (await this._fileService.exists(uri)) {
                    chunks.push((await this._fileService.readFile(uri)).value);
                }
                chunks.push(buffer_1.VSBuffer.fromString(`${this._timerService.startupMetrics.ellapsed}\t${this._productService.nameShort}\t${(this._productService.commit || '').slice(0, 10) || '0000000000'}\t${sessionId}\t${standardStartupError === undefined ? 'standard_start' : 'NO_standard_start : ' + standardStartupError}\n`));
                await this._fileService.writeFile(uri, buffer_1.VSBuffer.concat(chunks));
            }).then(() => {
                this._nativeHostService.exit(0);
            }).catch(err => {
                console.error(err);
                this._nativeHostService.exit(0);
            });
        }
        async _isStandardStartup() {
            var _a;
            // check for standard startup:
            // * new window (no reload)
            // * workspace is trusted
            // * just one window
            // * explorer viewlet visible
            // * one text editor (not multiple, not webview, welcome etc...)
            // * cached data present (not rejected, not created)
            if (this._lifecycleService.startupKind !== 1 /* StartupKind.NewWindow */) {
                return (0, lifecycle_1.StartupKindToString)(this._lifecycleService.startupKind);
            }
            if (!this._workspaceTrustService.isWorkspaceTrusted()) {
                return 'Workspace not trusted';
            }
            const windowCount = await this._nativeHostService.getWindowCount();
            if (windowCount !== 1) {
                return 'Expected window count : 1, Actual : ' + windowCount;
            }
            const activeViewlet = this._paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet || activeViewlet.getId() !== files.VIEWLET_ID) {
                return 'Explorer viewlet not visible';
            }
            const visibleEditorPanes = this._editorService.visibleEditorPanes;
            if (visibleEditorPanes.length !== 1) {
                return 'Expected text editor count : 1, Actual : ' + visibleEditorPanes.length;
            }
            if (!(0, editorBrowser_1.isCodeEditor)(visibleEditorPanes[0].getControl())) {
                return 'Active editor is not a text editor';
            }
            const activePanel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (activePanel) {
                return 'Current active panel : ' + ((_a = this._paneCompositeService.getPaneComposite(activePanel.getId(), 1 /* ViewContainerLocation.Panel */)) === null || _a === void 0 ? void 0 : _a.name);
            }
            const noCachedData = this._environmentService.args['no-cached-data'];
            if (!noCachedData && !(0, timerService_1.didUseCachedData)(this._productService, this._storageService, this._environmentService)) {
                return 'Either cache data is rejected or not created';
            }
            if (!await this._updateService.isLatestVersion()) {
                return 'Not on latest version, updates available';
            }
            return undefined;
        }
    };
    StartupTimings = __decorate([
        __param(0, files_1.IFileService),
        __param(1, timerService_2.ITimerService),
        __param(2, native_1.INativeHostService),
        __param(3, editorService_1.IEditorService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, lifecycle_1.ILifecycleService),
        __param(7, update_1.IUpdateService),
        __param(8, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(9, productService_1.IProductService),
        __param(10, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(11, storage_1.IStorageService)
    ], StartupTimings);
    exports.StartupTimings = StartupTimings;
});
//# sourceMappingURL=startupTimings.js.map