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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/uri", "vs/workbench/services/integrity/common/integrity", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/extensions", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/checksum/common/checksumService"], function (require, exports, nls_1, severity_1, uri_1, integrity_1, lifecycle_1, productService_1, notification_1, storage_1, extensions_1, opener_1, network_1, checksumService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrityService = void 0;
    class IntegrityStorage {
        constructor(storageService) {
            this.storageService = storageService;
            this.value = this._read();
        }
        _read() {
            let jsonValue = this.storageService.get(IntegrityStorage.KEY, 0 /* StorageScope.GLOBAL */);
            if (!jsonValue) {
                return null;
            }
            try {
                return JSON.parse(jsonValue);
            }
            catch (err) {
                return null;
            }
        }
        get() {
            return this.value;
        }
        set(data) {
            this.value = data;
            this.storageService.store(IntegrityStorage.KEY, JSON.stringify(this.value), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
    }
    IntegrityStorage.KEY = 'integrityService';
    let IntegrityService = class IntegrityService {
        constructor(notificationService, storageService, lifecycleService, openerService, productService, checksumService) {
            this.notificationService = notificationService;
            this.lifecycleService = lifecycleService;
            this.openerService = openerService;
            this.productService = productService;
            this.checksumService = checksumService;
            this._storage = new IntegrityStorage(storageService);
            this._isPurePromise = this._isPure();
            this.isPure().then(r => {
                if (r.isPure) {
                    return; // all is good
                }
                this._prompt();
            });
        }
        _prompt() {
            const storedData = this._storage.get();
            if ((storedData === null || storedData === void 0 ? void 0 : storedData.dontShowPrompt) && storedData.commit === this.productService.commit) {
                return; // Do not prompt
            }
            const checksumFailMoreInfoUrl = this.productService.checksumFailMoreInfoUrl;
            const message = (0, nls_1.localize)('integrity.prompt', "Your {0} installation appears to be corrupt. Please reinstall.", this.productService.nameShort);
            if (checksumFailMoreInfoUrl) {
                this.notificationService.prompt(severity_1.default.Warning, message, [
                    {
                        label: (0, nls_1.localize)('integrity.moreInformation', "More Information"),
                        run: () => this.openerService.open(uri_1.URI.parse(checksumFailMoreInfoUrl))
                    },
                    {
                        label: (0, nls_1.localize)('integrity.dontShowAgain', "Don't Show Again"),
                        isSecondary: true,
                        run: () => this._storage.set({ dontShowPrompt: true, commit: this.productService.commit })
                    }
                ], { sticky: true });
            }
            else {
                this.notificationService.notify({
                    severity: severity_1.default.Warning,
                    message,
                    sticky: true
                });
            }
        }
        isPure() {
            return this._isPurePromise;
        }
        async _isPure() {
            const expectedChecksums = this.productService.checksums || {};
            await this.lifecycleService.when(4 /* LifecyclePhase.Eventually */);
            const allResults = await Promise.all(Object.keys(expectedChecksums).map(filename => this._resolve(filename, expectedChecksums[filename])));
            let isPure = true;
            for (let i = 0, len = allResults.length; i < len; i++) {
                if (!allResults[i].isPure) {
                    isPure = false;
                    break;
                }
            }
            return {
                isPure: isPure,
                proof: allResults
            };
        }
        async _resolve(filename, expected) {
            const fileUri = network_1.FileAccess.asFileUri(filename, require);
            try {
                const checksum = await this.checksumService.checksum(fileUri);
                return IntegrityService._createChecksumPair(fileUri, checksum, expected);
            }
            catch (error) {
                return IntegrityService._createChecksumPair(fileUri, '', expected);
            }
        }
        static _createChecksumPair(uri, actual, expected) {
            return {
                uri: uri,
                actual: actual,
                expected: expected,
                isPure: (actual === expected)
            };
        }
    };
    IntegrityService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, opener_1.IOpenerService),
        __param(4, productService_1.IProductService),
        __param(5, checksumService_1.IChecksumService)
    ], IntegrityService);
    exports.IntegrityService = IntegrityService;
    (0, extensions_1.registerSingleton)(integrity_1.IIntegrityService, IntegrityService, true);
});
//# sourceMappingURL=integrityService.js.map