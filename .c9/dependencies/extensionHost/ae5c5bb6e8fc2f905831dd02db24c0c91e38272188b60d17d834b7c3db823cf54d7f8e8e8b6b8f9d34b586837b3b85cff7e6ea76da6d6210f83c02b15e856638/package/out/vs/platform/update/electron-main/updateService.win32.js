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
define(["require", "exports", "child_process", "fs", "os", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/path", "vs/base/common/uri", "vs/base/node/crypto", "vs/base/node/pfs", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/files/common/files", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/update/electron-main/abstractUpdateService"], function (require, exports, child_process_1, fs, os_1, async_1, cancellation_1, decorators_1, path, uri_1, crypto_1, pfs, configuration_1, environmentMainService_1, files_1, lifecycleMainService_1, log_1, nativeHostMainService_1, productService_1, request_1, telemetry_1, update_1, abstractUpdateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Win32UpdateService = void 0;
    async function pollUntil(fn, millis = 1000) {
        while (!fn()) {
            await (0, async_1.timeout)(millis);
        }
    }
    let _updateType = undefined;
    function getUpdateType() {
        if (typeof _updateType === 'undefined') {
            _updateType = fs.existsSync(path.join(path.dirname(process.execPath), 'unins000.exe'))
                ? 0 /* UpdateType.Setup */
                : 1 /* UpdateType.Archive */;
        }
        return _updateType;
    }
    function validateUpdateModeValue(value) {
        if (value === 'none' || value === 'manual' || value === 'start' || value === 'default') {
            return value;
        }
        else {
            return undefined;
        }
    }
    let Win32UpdateService = class Win32UpdateService extends abstractUpdateService_1.AbstractUpdateService {
        constructor(lifecycleMainService, configurationService, telemetryService, environmentMainService, requestService, logService, fileService, nativeHostMainService, productService) {
            super(lifecycleMainService, configurationService, environmentMainService, requestService, logService, productService);
            this.telemetryService = telemetryService;
            this.fileService = fileService;
            this.nativeHostMainService = nativeHostMainService;
        }
        get cachePath() {
            const result = path.join((0, os_1.tmpdir)(), `vscode-update-${this.productService.target}-${process.arch}`);
            return pfs.Promises.mkdir(result, { recursive: true }).then(() => result);
        }
        async getUpdateMode() {
            if (this.productService.win32RegValueName) {
                const policyKey = `Software\\Policies\\Microsoft\\${this.productService.win32RegValueName}`;
                const [hklm, hkcu] = await Promise.all([
                    this.nativeHostMainService.windowsGetStringRegKey(undefined, 'HKEY_LOCAL_MACHINE', policyKey, 'UpdateMode').then(validateUpdateModeValue),
                    this.nativeHostMainService.windowsGetStringRegKey(undefined, 'HKEY_CURRENT_USER', policyKey, 'UpdateMode').then(validateUpdateModeValue)
                ]);
                if (hklm) {
                    this.logService.info(`update#getUpdateMode: 'UpdateMode' policy defined in 'HKLM\\${policyKey}':`, hklm);
                    return hklm;
                }
                else if (hkcu) {
                    this.logService.info(`update#getUpdateMode: 'UpdateMode' policy defined in 'HKCU\\${policyKey}':`, hkcu);
                    return hkcu;
                }
            }
            return await super.getUpdateMode();
        }
        buildUpdateFeedUrl(quality) {
            let platform = 'win32';
            if (process.arch !== 'ia32') {
                platform += `-${process.arch}`;
            }
            if (getUpdateType() === 1 /* UpdateType.Archive */) {
                platform += '-archive';
            }
            else if (this.productService.target === 'user') {
                platform += '-user';
            }
            return (0, abstractUpdateService_1.createUpdateURL)(platform, quality, this.productService);
        }
        doCheckForUpdates(context) {
            if (!this.url) {
                return;
            }
            this.setState(update_1.State.CheckingForUpdates(context));
            this.requestService.request({ url: this.url }, cancellation_1.CancellationToken.None)
                .then(request_1.asJson)
                .then(update => {
                const updateType = getUpdateType();
                if (!update || !update.url || !update.version || !update.productVersion) {
                    this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                    this.setState(update_1.State.Idle(updateType));
                    return Promise.resolve(null);
                }
                if (updateType === 1 /* UpdateType.Archive */) {
                    this.setState(update_1.State.AvailableForDownload(update));
                    return Promise.resolve(null);
                }
                this.setState(update_1.State.Downloading(update));
                return this.cleanup(update.version).then(() => {
                    return this.getUpdatePackagePath(update.version).then(updatePackagePath => {
                        return pfs.Promises.exists(updatePackagePath).then(exists => {
                            if (exists) {
                                return Promise.resolve(updatePackagePath);
                            }
                            const url = update.url;
                            const hash = update.hash;
                            const downloadPath = `${updatePackagePath}.tmp`;
                            return this.requestService.request({ url }, cancellation_1.CancellationToken.None)
                                .then(context => this.fileService.writeFile(uri_1.URI.file(downloadPath), context.stream))
                                .then(hash ? () => (0, crypto_1.checksum)(downloadPath, update.hash) : () => undefined)
                                .then(() => pfs.Promises.rename(downloadPath, updatePackagePath))
                                .then(() => updatePackagePath);
                        });
                    }).then(packagePath => {
                        const fastUpdatesEnabled = this.configurationService.getValue('update.enableWindowsBackgroundUpdates');
                        this.availableUpdate = { packagePath };
                        if (fastUpdatesEnabled && update.supportsFastUpdate) {
                            if (this.productService.target === 'user') {
                                this.doApplyUpdate();
                            }
                            else {
                                this.setState(update_1.State.Downloaded(update));
                            }
                        }
                        else {
                            this.setState(update_1.State.Ready(update));
                        }
                    });
                });
            })
                .then(undefined, err => {
                this.logService.error(err);
                this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                // only show message when explicitly checking for updates
                const message = !!context ? (err.message || err) : undefined;
                this.setState(update_1.State.Idle(getUpdateType(), message));
            });
        }
        async doDownloadUpdate(state) {
            if (state.update.url) {
                this.nativeHostMainService.openExternal(undefined, state.update.url);
            }
            this.setState(update_1.State.Idle(getUpdateType()));
        }
        async getUpdatePackagePath(version) {
            const cachePath = await this.cachePath;
            return path.join(cachePath, `CodeSetup-${this.productService.quality}-${version}.exe`);
        }
        async cleanup(exceptVersion = null) {
            const filter = exceptVersion ? (one) => !(new RegExp(`${this.productService.quality}-${exceptVersion}\\.exe$`).test(one)) : () => true;
            const cachePath = await this.cachePath;
            const versions = await pfs.Promises.readdir(cachePath);
            const promises = versions.filter(filter).map(async (one) => {
                try {
                    await pfs.Promises.unlink(path.join(cachePath, one));
                }
                catch (err) {
                    // ignore
                }
            });
            await Promise.all(promises);
        }
        async doApplyUpdate() {
            if (this.state.type !== "downloaded" /* StateType.Downloaded */ && this.state.type !== "downloading" /* StateType.Downloading */) {
                return Promise.resolve(undefined);
            }
            if (!this.availableUpdate) {
                return Promise.resolve(undefined);
            }
            const update = this.state.update;
            this.setState(update_1.State.Updating(update));
            const cachePath = await this.cachePath;
            this.availableUpdate.updateFilePath = path.join(cachePath, `CodeSetup-${this.productService.quality}-${update.version}.flag`);
            await pfs.Promises.writeFile(this.availableUpdate.updateFilePath, 'flag');
            const child = (0, child_process_1.spawn)(this.availableUpdate.packagePath, ['/verysilent', `/update="${this.availableUpdate.updateFilePath}"`, '/nocloseapplications', '/mergetasks=runcode,!desktopicon,!quicklaunchicon'], {
                detached: true,
                stdio: ['ignore', 'ignore', 'ignore'],
                windowsVerbatimArguments: true
            });
            child.once('exit', () => {
                this.availableUpdate = undefined;
                this.setState(update_1.State.Idle(getUpdateType()));
            });
            const readyMutexName = `${this.productService.win32MutexName}-ready`;
            const mutex = await new Promise((resolve_1, reject_1) => { require(['windows-mutex'], resolve_1, reject_1); });
            // poll for mutex-ready
            pollUntil(() => mutex.isActive(readyMutexName))
                .then(() => this.setState(update_1.State.Ready(update)));
        }
        doQuitAndInstall() {
            if (this.state.type !== "ready" /* StateType.Ready */ || !this.availableUpdate) {
                return;
            }
            this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
            if (this.state.update.supportsFastUpdate && this.availableUpdate.updateFilePath) {
                fs.unlinkSync(this.availableUpdate.updateFilePath);
            }
            else {
                (0, child_process_1.spawn)(this.availableUpdate.packagePath, ['/silent', '/mergetasks=runcode,!desktopicon,!quicklaunchicon'], {
                    detached: true,
                    stdio: ['ignore', 'ignore', 'ignore']
                });
            }
        }
        getUpdateType() {
            return getUpdateType();
        }
    };
    __decorate([
        decorators_1.memoize
    ], Win32UpdateService.prototype, "cachePath", null);
    Win32UpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, environmentMainService_1.IEnvironmentMainService),
        __param(4, request_1.IRequestService),
        __param(5, log_1.ILogService),
        __param(6, files_1.IFileService),
        __param(7, nativeHostMainService_1.INativeHostMainService),
        __param(8, productService_1.IProductService)
    ], Win32UpdateService);
    exports.Win32UpdateService = Win32UpdateService;
});
//# sourceMappingURL=updateService.win32.js.map