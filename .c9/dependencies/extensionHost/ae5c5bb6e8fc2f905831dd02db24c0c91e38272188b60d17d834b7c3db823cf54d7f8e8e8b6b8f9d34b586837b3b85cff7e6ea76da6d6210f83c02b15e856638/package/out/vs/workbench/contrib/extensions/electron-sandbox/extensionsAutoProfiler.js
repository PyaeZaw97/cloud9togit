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
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/resources", "vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor", "vs/platform/notification/common/notification", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/extensions/common/runtimeExtensionsInput", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/electron-sandbox/extensionsSlowActions", "vs/workbench/services/extensions/electron-sandbox/extensionHostProfiler", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/files/common/files", "vs/base/common/buffer", "vs/base/common/async"], function (require, exports, extensions_1, telemetry_1, lifecycle_1, log_1, cancellation_1, errors_1, resources_1, runtimeExtensionsEditor_1, notification_1, nls_1, editorService_1, runtimeExtensionsInput_1, extensions_2, instantiation_1, extensionsSlowActions_1, extensionHostProfiler_1, environmentService_1, files_1, buffer_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsAutoProfiler = void 0;
    let ExtensionsAutoProfiler = class ExtensionsAutoProfiler extends lifecycle_1.Disposable {
        constructor(_extensionService, _extensionProfileService, _telemetryService, _logService, _notificationService, _editorService, _instantiationService, _environmentServie, _fileService) {
            super();
            this._extensionService = _extensionService;
            this._extensionProfileService = _extensionProfileService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._environmentServie = _environmentServie;
            this._fileService = _fileService;
            this._blame = new Set();
            this._register(_extensionService.onDidChangeResponsiveChange(this._onDidChangeResponsiveChange, this));
        }
        async _onDidChangeResponsiveChange(event) {
            if (event.extensionHostKind !== 1 /* ExtensionHostKind.LocalProcess */) {
                return;
            }
            const port = await this._extensionService.getInspectPort(event.extensionHostId, true);
            if (!port) {
                return;
            }
            if (event.isResponsive && this._session) {
                // stop profiling when responsive again
                this._session.cancel();
                this._logService.info('UNRESPONSIVE extension host: received responsive event and cancelling profiling session');
            }
            else if (!event.isResponsive && !this._session) {
                // start profiling if not yet profiling
                const cts = new cancellation_1.CancellationTokenSource();
                this._session = cts;
                let session;
                try {
                    session = await this._instantiationService.createInstance(extensionHostProfiler_1.ExtensionHostProfiler, port).start();
                }
                catch (err) {
                    this._session = undefined;
                    // fail silent as this is often
                    // caused by another party being
                    // connected already
                    return;
                }
                this._logService.info('UNRESPONSIVE extension host: starting to profile NOW');
                // wait 5 seconds or until responsive again
                try {
                    await (0, async_1.timeout)(5e3, cts.token);
                }
                catch (_a) {
                    // can throw cancellation error. that is
                    // OK, we stop profiling and analyse the
                    // profile anyways
                }
                try {
                    // stop profiling and analyse results
                    this._processCpuProfile(await session.stop());
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    this._session = undefined;
                }
            }
        }
        async _processCpuProfile(profile) {
            let data = [];
            for (let i = 0; i < profile.ids.length; i++) {
                let id = profile.ids[i];
                let total = profile.deltas[i];
                data.push({ id, total, percentage: 0 });
            }
            // merge data by identifier
            let anchor = 0;
            data.sort((a, b) => a.id.localeCompare(b.id));
            for (let i = 1; i < data.length; i++) {
                if (data[anchor].id === data[i].id) {
                    data[anchor].total += data[i].total;
                }
                else {
                    anchor += 1;
                    data[anchor] = data[i];
                }
            }
            data = data.slice(0, anchor + 1);
            const duration = profile.endTime - profile.startTime;
            const percentage = duration / 100;
            let top;
            for (const slice of data) {
                slice.percentage = Math.round(slice.total / percentage);
                if (!top || top.percentage < slice.percentage) {
                    top = slice;
                }
            }
            if (!top) {
                return;
            }
            const extension = await this._extensionService.getExtension(top.id);
            if (!extension) {
                // not an extension => idle, gc, self?
                return;
            }
            // print message to log
            const path = (0, resources_1.joinPath)(this._environmentServie.tmpDir, `exthost-${Math.random().toString(16).slice(2, 8)}.cpuprofile`);
            await this._fileService.writeFile(path, buffer_1.VSBuffer.fromString(JSON.stringify(profile.data)));
            this._logService.warn(`UNRESPONSIVE extension host: '${top.id}' took ${top.percentage}% of ${duration / 1e3}ms, saved PROFILE here: '${path}'`, data);
            /* __GDPR__
                "exthostunresponsive" : {
                    "id" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "data": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                }
            */
            this._telemetryService.publicLog('exthostunresponsive', {
                duration,
                data,
            });
            // add to running extensions view
            this._extensionProfileService.setUnresponsiveProfile(extension.identifier, profile);
            // prompt: when really slow/greedy
            if (!(top.percentage >= 99 && top.total >= 5e6)) {
                return;
            }
            const action = await this._instantiationService.invokeFunction(extensionsSlowActions_1.createSlowExtensionAction, extension, profile);
            if (!action) {
                // cannot report issues against this extension...
                return;
            }
            // only blame once per extension, don't blame too often
            if (this._blame.has(extensions_2.ExtensionIdentifier.toKey(extension.identifier)) || this._blame.size >= 3) {
                return;
            }
            this._blame.add(extensions_2.ExtensionIdentifier.toKey(extension.identifier));
            // user-facing message when very bad...
            this._notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('unresponsive-exthost', "The extension '{0}' took a very long time to complete its last operation and it has prevented other extensions from running.", extension.displayName || extension.name), [{
                    label: (0, nls_1.localize)('show', 'Show Extensions'),
                    run: () => this._editorService.openEditor(runtimeExtensionsInput_1.RuntimeExtensionsInput.instance, { pinned: true })
                },
                action
            ], { silent: true });
        }
    };
    ExtensionsAutoProfiler = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, runtimeExtensionsEditor_1.IExtensionHostProfileService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, notification_1.INotificationService),
        __param(5, editorService_1.IEditorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(8, files_1.IFileService)
    ], ExtensionsAutoProfiler);
    exports.ExtensionsAutoProfiler = ExtensionsAutoProfiler;
});
//# sourceMappingURL=extensionsAutoProfiler.js.map