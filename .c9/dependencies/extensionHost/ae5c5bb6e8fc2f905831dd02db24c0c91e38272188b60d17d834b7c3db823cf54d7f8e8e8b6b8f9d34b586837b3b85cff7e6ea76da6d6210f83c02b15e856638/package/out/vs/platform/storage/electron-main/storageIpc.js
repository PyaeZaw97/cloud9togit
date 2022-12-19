/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/workspace/common/workspace"], function (require, exports, event_1, lifecycle_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageDatabaseChannel = void 0;
    class StorageDatabaseChannel extends lifecycle_1.Disposable {
        constructor(logService, storageMainService) {
            super();
            this.logService = logService;
            this.storageMainService = storageMainService;
            this._onDidChangeGlobalStorage = this._register(new event_1.Emitter());
            this.onDidChangeGlobalStorage = this._onDidChangeGlobalStorage.event;
            this.registerGlobalStorageListeners();
        }
        //#region Global Storage Change Events
        registerGlobalStorageListeners() {
            // Listen for changes in global storage to send to listeners
            // that are listening. Use a debouncer to reduce IPC traffic.
            this._register(event_1.Event.debounce(this.storageMainService.globalStorage.onDidChangeStorage, (prev, cur) => {
                if (!prev) {
                    prev = [cur];
                }
                else {
                    prev.push(cur);
                }
                return prev;
            }, StorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
                if (events.length) {
                    this._onDidChangeGlobalStorage.fire(this.serializeGlobalStorageEvents(events));
                }
            }));
        }
        serializeGlobalStorageEvents(events) {
            const changed = new Map();
            const deleted = new Set();
            events.forEach(event => {
                const existing = this.storageMainService.globalStorage.get(event.key);
                if (typeof existing === 'string') {
                    changed.set(event.key, existing);
                }
                else {
                    deleted.add(event.key);
                }
            });
            return {
                changed: Array.from(changed.entries()),
                deleted: Array.from(deleted.values())
            };
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeGlobalStorage': return this.onDidChangeGlobalStorage;
            }
            throw new Error(`Event not found: ${event}`);
        }
        //#endregion
        async call(_, command, arg) {
            const workspace = (0, workspace_1.reviveIdentifier)(arg.workspace);
            // Get storage to be ready
            const storage = await this.withStorageInitialized(workspace);
            // handle call
            switch (command) {
                case 'getItems': {
                    return Array.from(storage.items.entries());
                }
                case 'updateItems': {
                    const items = arg;
                    if (items.insert) {
                        for (const [key, value] of items.insert) {
                            storage.set(key, value);
                        }
                    }
                    if (items.delete) {
                        items.delete.forEach(key => storage.delete(key));
                    }
                    break;
                }
                default:
                    throw new Error(`Call not found: ${command}`);
            }
        }
        async withStorageInitialized(workspace) {
            const storage = workspace ? this.storageMainService.workspaceStorage(workspace) : this.storageMainService.globalStorage;
            try {
                await storage.init();
            }
            catch (error) {
                this.logService.error(`StorageIPC#init: Unable to init ${workspace ? 'workspace' : 'global'} storage due to ${error}`);
            }
            return storage;
        }
    }
    exports.StorageDatabaseChannel = StorageDatabaseChannel;
    StorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME = 100;
});
//# sourceMappingURL=storageIpc.js.map