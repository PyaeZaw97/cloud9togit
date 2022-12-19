/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageDatabaseChannelClient = void 0;
    class BaseStorageDatabaseClient extends lifecycle_1.Disposable {
        constructor(channel, workspace) {
            super();
            this.channel = channel;
            this.workspace = workspace;
        }
        async getItems() {
            const serializableRequest = { workspace: this.workspace };
            const items = await this.channel.call('getItems', serializableRequest);
            return new Map(items);
        }
        updateItems(request) {
            const serializableRequest = { workspace: this.workspace };
            if (request.insert) {
                serializableRequest.insert = Array.from(request.insert.entries());
            }
            if (request.delete) {
                serializableRequest.delete = Array.from(request.delete.values());
            }
            return this.channel.call('updateItems', serializableRequest);
        }
    }
    class GlobalStorageDatabaseClient extends BaseStorageDatabaseClient {
        constructor(channel) {
            super(channel, undefined);
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.channel.listen('onDidChangeGlobalStorage')((e) => this.onDidChangeGlobalStorage(e)));
        }
        onDidChangeGlobalStorage(e) {
            if (Array.isArray(e.changed) || Array.isArray(e.deleted)) {
                this._onDidChangeItemsExternal.fire({
                    changed: e.changed ? new Map(e.changed) : undefined,
                    deleted: e.deleted ? new Set(e.deleted) : undefined
                });
            }
        }
        async close() {
            // The global storage database is shared across all instances so
            // we do not close it from the window. However we dispose the
            // listener for external changes because we no longer interested in it.
            this.dispose();
        }
    }
    class WorkspaceStorageDatabaseClient extends BaseStorageDatabaseClient {
        constructor(channel, workspace) {
            super(channel, workspace);
            this.onDidChangeItemsExternal = event_1.Event.None; // unsupported for workspace storage because we only ever write from one window
        }
        async close() {
            // The workspace storage database is only used in this instance
            // but we do not need to close it from here, the main process
            // can take care of that.
            this.dispose();
        }
    }
    class StorageDatabaseChannelClient extends lifecycle_1.Disposable {
        constructor(channel, workspace) {
            super();
            this.channel = channel;
            this.workspace = workspace;
            this._globalStorage = undefined;
            this._workspaceStorage = undefined;
        }
        get globalStorage() {
            if (!this._globalStorage) {
                this._globalStorage = new GlobalStorageDatabaseClient(this.channel);
            }
            return this._globalStorage;
        }
        get workspaceStorage() {
            if (!this._workspaceStorage && this.workspace) {
                this._workspaceStorage = new WorkspaceStorageDatabaseClient(this.channel, this.workspace);
            }
            return this._workspaceStorage;
        }
    }
    exports.StorageDatabaseChannelClient = StorageDatabaseChannelClient;
});
//# sourceMappingURL=storageIpc.js.map