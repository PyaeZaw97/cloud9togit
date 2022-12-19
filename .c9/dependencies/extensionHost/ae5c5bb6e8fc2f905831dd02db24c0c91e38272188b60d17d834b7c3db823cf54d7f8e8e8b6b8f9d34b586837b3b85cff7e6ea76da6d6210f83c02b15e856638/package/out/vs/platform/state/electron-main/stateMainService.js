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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, async_1, buffer_1, path_1, resources_1, types_1, uri_1, pfs_1, environmentMainService_1, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StateMainService = exports.FileStorage = void 0;
    class FileStorage {
        constructor(storagePath, logService, fileService) {
            this.storagePath = storagePath;
            this.logService = logService;
            this.fileService = fileService;
            this.storage = Object.create(null);
            this.lastSavedStorageContents = '';
            this.flushDelayer = new async_1.ThrottledDelayer(100 /* buffer saves over a short time */);
            this.initializing = undefined;
            this.closing = undefined;
        }
        init() {
            if (!this.initializing) {
                this.initializing = this.doInit();
            }
            return this.initializing;
        }
        async doInit() {
            try {
                this.lastSavedStorageContents = (await this.fileService.readFile(this.storagePath)).value.toString();
                this.storage = JSON.parse(this.lastSavedStorageContents);
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        getItem(key, defaultValue) {
            const res = this.storage[key];
            if ((0, types_1.isUndefinedOrNull)(res)) {
                return defaultValue;
            }
            return res;
        }
        setItem(key, data) {
            this.setItems([{ key, data }]);
        }
        setItems(items) {
            let save = false;
            for (const { key, data } of items) {
                // Shortcut for data that did not change
                if (this.storage[key] === data) {
                    continue;
                }
                // Remove items when they are undefined or null
                if ((0, types_1.isUndefinedOrNull)(data)) {
                    if (!(0, types_1.isUndefined)(this.storage[key])) {
                        this.storage[key] = undefined;
                        save = true;
                    }
                }
                // Otherwise add an item
                else {
                    this.storage[key] = data;
                    save = true;
                }
            }
            if (save) {
                this.save();
            }
        }
        removeItem(key) {
            // Only update if the key is actually present (not undefined)
            if (!(0, types_1.isUndefined)(this.storage[key])) {
                this.storage[key] = undefined;
                this.save();
            }
        }
        async save(delay) {
            if (this.closing) {
                return; // already about to close
            }
            return this.flushDelayer.trigger(() => this.doSave(), delay);
        }
        async doSave() {
            if (!this.initializing) {
                return; // if we never initialized, we should not save our state
            }
            // Make sure to wait for init to finish first
            await this.initializing;
            // Return early if the database has not changed
            const serializedDatabase = JSON.stringify(this.storage, null, 4);
            if (serializedDatabase === this.lastSavedStorageContents) {
                return;
            }
            // Write to disk
            try {
                await this.fileService.writeFile(this.storagePath, buffer_1.VSBuffer.fromString(serializedDatabase));
                this.lastSavedStorageContents = serializedDatabase;
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        async close() {
            if (!this.closing) {
                this.closing = this.flushDelayer.trigger(() => this.doSave(), 0 /* as soon as possible */);
            }
            return this.closing;
        }
    }
    exports.FileStorage = FileStorage;
    let StateMainService = class StateMainService {
        constructor(environmentMainService, logService, fileService) {
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.legacyStateFilePath = uri_1.URI.file((0, path_1.join)(this.environmentMainService.userDataPath, StateMainService.STATE_FILE));
            this.stateFilePath = (0, resources_1.joinPath)(this.environmentMainService.globalStorageHome, StateMainService.STATE_FILE);
            this.fileStorage = new FileStorage(this.stateFilePath, logService, fileService);
        }
        async init() {
            try {
                // TODO@bpasero remove legacy migration eventually
                await pfs_1.Promises.move(this.legacyStateFilePath.fsPath, this.stateFilePath.fsPath);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.logService.error(error);
                }
            }
            return this.fileStorage.init();
        }
        getItem(key, defaultValue) {
            return this.fileStorage.getItem(key, defaultValue);
        }
        setItem(key, data) {
            this.fileStorage.setItem(key, data);
        }
        setItems(items) {
            this.fileStorage.setItems(items);
        }
        removeItem(key) {
            this.fileStorage.removeItem(key);
        }
        close() {
            return this.fileStorage.close();
        }
    };
    StateMainService.STATE_FILE = 'storage.json';
    StateMainService = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, log_1.ILogService),
        __param(2, files_1.IFileService)
    ], StateMainService);
    exports.StateMainService = StateMainService;
});
//# sourceMappingURL=stateMainService.js.map