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
define(["require", "exports", "vs/base/common/event", "vs/platform/native/electron-sandbox/native", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/storage/common/storage", "vs/base/common/types"], function (require, exports, event_1, native_1, extensions_1, lifecycle_1, hostColorSchemeService_1, environmentService_1, storage_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeHostColorSchemeService = void 0;
    let NativeHostColorSchemeService = class NativeHostColorSchemeService extends lifecycle_1.Disposable {
        constructor(nativeHostService, environmentService, storageService) {
            var _a;
            super();
            this.nativeHostService = nativeHostService;
            this.storageService = storageService;
            this._onDidChangeColorScheme = this._register(new event_1.Emitter());
            this.onDidChangeColorScheme = this._onDidChangeColorScheme.event;
            // register listener with the OS
            this._register(this.nativeHostService.onDidChangeColorScheme(scheme => this.update(scheme)));
            const initial = (_a = this.getStoredValue()) !== null && _a !== void 0 ? _a : environmentService.window.colorScheme;
            this.dark = initial.dark;
            this.highContrast = initial.highContrast;
            // fetch the actual value from the OS
            this.nativeHostService.getOSColorScheme().then(scheme => this.update(scheme));
        }
        getStoredValue() {
            const stored = this.storageService.get(NativeHostColorSchemeService.STORAGE_KEY, 0 /* StorageScope.GLOBAL */);
            if (stored) {
                try {
                    const scheme = JSON.parse(stored);
                    if ((0, types_1.isObject)(scheme) && (0, types_1.isBoolean)(scheme.highContrast) && (0, types_1.isBoolean)(scheme.dark)) {
                        return scheme;
                    }
                }
                catch (e) {
                    // ignore
                }
            }
            return undefined;
        }
        update({ highContrast, dark }) {
            if (dark !== this.dark || highContrast !== this.highContrast) {
                this.dark = dark;
                this.highContrast = highContrast;
                this.storageService.store(NativeHostColorSchemeService.STORAGE_KEY, JSON.stringify({ highContrast, dark }), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                this._onDidChangeColorScheme.fire();
            }
        }
    };
    NativeHostColorSchemeService.STORAGE_KEY = 'HostColorSchemeData';
    NativeHostColorSchemeService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, storage_1.IStorageService)
    ], NativeHostColorSchemeService);
    exports.NativeHostColorSchemeService = NativeHostColorSchemeService;
    (0, extensions_1.registerSingleton)(hostColorSchemeService_1.IHostColorSchemeService, NativeHostColorSchemeService, true);
});
//# sourceMappingURL=nativeHostColorSchemeService.js.map