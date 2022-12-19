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
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/extensions/common/extensionsUtil", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/log/common/log", "vs/base/common/severity", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/base/common/async"], function (require, exports, path, platform, uri_1, extensionsUtil_1, extensionsScannerService_1, log_1, severity_1, nls_1, notification_1, host_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedExtensionScanner = void 0;
    let CachedExtensionScanner = class CachedExtensionScanner {
        constructor(_notificationService, _hostService, _extensionsScannerService, _logService) {
            this._notificationService = _notificationService;
            this._hostService = _hostService;
            this._extensionsScannerService = _extensionsScannerService;
            this._logService = _logService;
            this.scannedExtensions = new Promise((resolve, reject) => {
                this._scannedExtensionsResolve = resolve;
                this._scannedExtensionsReject = reject;
            });
        }
        async scanSingleExtension(extensionPath, isBuiltin) {
            const scannedExtension = await this._extensionsScannerService.scanExistingExtension(uri_1.URI.file(path.resolve(extensionPath)), isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */, { language: platform.language });
            return scannedExtension ? (0, extensionsScannerService_1.toExtensionDescription)(scannedExtension, false) : null;
        }
        async startScanningExtensions() {
            try {
                const { system, user, development } = await this._scanInstalledExtensions();
                const r = (0, extensionsUtil_1.dedupExtensions)(system, user, development, this._logService);
                this._scannedExtensionsResolve(r);
            }
            catch (err) {
                this._scannedExtensionsReject(err);
            }
        }
        async _scanInstalledExtensions() {
            const language = platform.language;
            const builtinExtensions = this._extensionsScannerService.scanSystemExtensions({ language, useCache: true, checkControlFile: true })
                .then(scannedExtensions => scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false)));
            const userExtensions = this._extensionsScannerService.scanUserExtensions({ language, useCache: true })
                .then(scannedExtensions => scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false)));
            const developedExtensions = this._extensionsScannerService.scanExtensionsUnderDevelopment({ language })
                .then(scannedExtensions => scannedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, true)));
            return Promise.all([builtinExtensions, userExtensions, developedExtensions]).then((extensionDescriptions) => {
                const system = extensionDescriptions[0];
                const user = extensionDescriptions[1];
                const development = extensionDescriptions[2];
                const disposable = this._extensionsScannerService.onDidChangeCache(() => {
                    disposable.dispose();
                    this._notificationService.prompt(severity_1.default.Error, (0, nls_1.localize)('extensionCache.invalid', "Extensions have been modified on disk. Please reload the window."), [{
                            label: (0, nls_1.localize)('reloadWindow', "Reload Window"),
                            run: () => this._hostService.reload()
                        }]);
                });
                (0, async_1.timeout)(5000).then(() => disposable.dispose());
                return { system, user, development };
            }).then(undefined, err => {
                this._logService.error(`Error scanning installed extensions:`);
                this._logService.error(err);
                return { system: [], user: [], development: [] };
            });
        }
    };
    CachedExtensionScanner = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, host_1.IHostService),
        __param(2, extensionsScannerService_1.IExtensionsScannerService),
        __param(3, log_1.ILogService)
    ], CachedExtensionScanner);
    exports.CachedExtensionScanner = CachedExtensionScanner;
});
//# sourceMappingURL=cachedExtensionScanner.js.map