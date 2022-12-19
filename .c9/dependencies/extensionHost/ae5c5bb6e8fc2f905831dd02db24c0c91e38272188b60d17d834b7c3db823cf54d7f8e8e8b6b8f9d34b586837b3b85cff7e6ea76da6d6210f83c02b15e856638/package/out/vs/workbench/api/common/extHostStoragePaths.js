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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostInitDataService", "vs/platform/log/common/log", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/base/common/uri"], function (require, exports, instantiation_1, extHostInitDataService_1, log_1, extHostFileSystemConsumer_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStoragePaths = exports.IExtensionStoragePaths = void 0;
    exports.IExtensionStoragePaths = (0, instantiation_1.createDecorator)('IExtensionStoragePaths');
    let ExtensionStoragePaths = class ExtensionStoragePaths {
        constructor(initData, _logService, _extHostFileSystem) {
            var _a;
            this._logService = _logService;
            this._extHostFileSystem = _extHostFileSystem;
            this._workspace = (_a = initData.workspace) !== null && _a !== void 0 ? _a : undefined;
            this._environment = initData.environment;
            this.whenReady = this._getOrCreateWorkspaceStoragePath().then(value => this._value = value);
        }
        async _getWorkspaceStorageURI(storageName) {
            return uri_1.URI.joinPath(this._environment.workspaceStorageHome, storageName);
        }
        async _getOrCreateWorkspaceStoragePath() {
            var _a;
            if (!this._workspace) {
                return Promise.resolve(undefined);
            }
            const storageName = this._workspace.id;
            const storageUri = await this._getWorkspaceStorageURI(storageName);
            try {
                await this._extHostFileSystem.value.stat(storageUri);
                this._logService.trace('[ExtHostStorage] storage dir already exists', storageUri);
                return storageUri;
            }
            catch (_b) {
                // doesn't exist, that's OK
            }
            try {
                this._logService.trace('[ExtHostStorage] creating dir and metadata-file', storageUri);
                await this._extHostFileSystem.value.createDirectory(storageUri);
                await this._extHostFileSystem.value.writeFile(uri_1.URI.joinPath(storageUri, 'meta.json'), new TextEncoder().encode(JSON.stringify({
                    id: this._workspace.id,
                    configuration: (_a = uri_1.URI.revive(this._workspace.configuration)) === null || _a === void 0 ? void 0 : _a.toString(),
                    name: this._workspace.name
                }, undefined, 2)));
                return storageUri;
            }
            catch (e) {
                this._logService.error('[ExtHostStorage]', e);
                return undefined;
            }
        }
        workspaceValue(extension) {
            if (this._value) {
                return uri_1.URI.joinPath(this._value, extension.identifier.value);
            }
            return undefined;
        }
        globalValue(extension) {
            return uri_1.URI.joinPath(this._environment.globalStorageHome, extension.identifier.value.toLowerCase());
        }
        onWillDeactivateAll() {
        }
    };
    ExtensionStoragePaths = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, log_1.ILogService),
        __param(2, extHostFileSystemConsumer_1.IExtHostConsumerFileSystem)
    ], ExtensionStoragePaths);
    exports.ExtensionStoragePaths = ExtensionStoragePaths;
});
//# sourceMappingURL=extHostStoragePaths.js.map