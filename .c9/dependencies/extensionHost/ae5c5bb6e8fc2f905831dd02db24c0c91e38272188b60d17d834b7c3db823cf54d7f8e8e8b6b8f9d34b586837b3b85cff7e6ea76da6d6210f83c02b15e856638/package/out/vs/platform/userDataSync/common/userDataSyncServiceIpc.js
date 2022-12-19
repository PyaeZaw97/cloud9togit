/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, types_1, uri_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncChannelClient = exports.UserDataSyncChannel = void 0;
    class UserDataSyncChannel {
        constructor(service, logService) {
            this.service = service;
            this.logService = logService;
            this.manualSyncTasks = new Map();
            this.onManualSynchronizeResources = new event_1.Emitter();
        }
        listen(_, event) {
            switch (event) {
                // sync
                case 'onDidChangeStatus': return this.service.onDidChangeStatus;
                case 'onDidChangeConflicts': return this.service.onDidChangeConflicts;
                case 'onDidChangeLocal': return this.service.onDidChangeLocal;
                case 'onDidChangeLastSyncTime': return this.service.onDidChangeLastSyncTime;
                case 'onSyncErrors': return this.service.onSyncErrors;
                case 'onDidResetLocal': return this.service.onDidResetLocal;
                case 'onDidResetRemote': return this.service.onDidResetRemote;
                // manual sync
                case 'manualSync/onSynchronizeResources': return this.onManualSynchronizeResources.event;
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(context, command, args) {
            try {
                const result = await this._call(context, command, args);
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        async _call(context, command, args) {
            switch (command) {
                // sync
                case '_getInitialData': return Promise.resolve([this.service.status, this.service.conflicts, this.service.lastSyncTime]);
                case 'replace': return this.service.replace(uri_1.URI.revive(args[0]));
                case 'reset': return this.service.reset();
                case 'resetRemote': return this.service.resetRemote();
                case 'resetLocal': return this.service.resetLocal();
                case 'hasPreviouslySynced': return this.service.hasPreviouslySynced();
                case 'hasLocalData': return this.service.hasLocalData();
                case 'accept': return this.service.accept(args[0], uri_1.URI.revive(args[1]), args[2], args[3]);
                case 'resolveContent': return this.service.resolveContent(uri_1.URI.revive(args[0]));
                case 'getLocalSyncResourceHandles': return this.service.getLocalSyncResourceHandles(args[0]);
                case 'getRemoteSyncResourceHandles': return this.service.getRemoteSyncResourceHandles(args[0]);
                case 'getAssociatedResources': return this.service.getAssociatedResources(args[0], { created: args[1].created, uri: uri_1.URI.revive(args[1].uri) });
                case 'getMachineId': return this.service.getMachineId(args[0], { created: args[1].created, uri: uri_1.URI.revive(args[1].uri) });
                case 'createManualSyncTask': return this.createManualSyncTask();
            }
            // manual sync
            if (command.startsWith('manualSync/')) {
                const manualSyncTaskCommand = command.substring('manualSync/'.length);
                const manualSyncTaskId = args[0];
                const manualSyncTask = this.getManualSyncTask(manualSyncTaskId);
                args = args.slice(1);
                switch (manualSyncTaskCommand) {
                    case 'preview': return manualSyncTask.preview();
                    case 'accept': return manualSyncTask.accept(uri_1.URI.revive(args[0]), args[1]);
                    case 'merge': return manualSyncTask.merge(uri_1.URI.revive(args[0]));
                    case 'discard': return manualSyncTask.discard(uri_1.URI.revive(args[0]));
                    case 'discardConflicts': return manualSyncTask.discardConflicts();
                    case 'apply': return manualSyncTask.apply();
                    case 'pull': return manualSyncTask.pull();
                    case 'push': return manualSyncTask.push();
                    case 'stop': return manualSyncTask.stop();
                    case '_getStatus': return manualSyncTask.status;
                    case 'dispose': return this.disposeManualSyncTask(manualSyncTask);
                }
            }
            throw new Error('Invalid call');
        }
        getManualSyncTask(manualSyncTaskId) {
            const value = this.manualSyncTasks.get(this.createKey(manualSyncTaskId));
            if (!value) {
                throw new Error(`Manual sync taks not found: ${manualSyncTaskId}`);
            }
            return value.manualSyncTask;
        }
        async createManualSyncTask() {
            const disposables = new lifecycle_1.DisposableStore();
            const manualSyncTask = disposables.add(await this.service.createManualSyncTask());
            disposables.add(manualSyncTask.onSynchronizeResources(synchronizeResources => this.onManualSynchronizeResources.fire({ manualSyncTaskId: manualSyncTask.id, data: synchronizeResources })));
            this.manualSyncTasks.set(this.createKey(manualSyncTask.id), { manualSyncTask, disposables });
            return { id: manualSyncTask.id, manifest: manualSyncTask.manifest, status: manualSyncTask.status };
        }
        disposeManualSyncTask(manualSyncTask) {
            var _a;
            manualSyncTask.dispose();
            const key = this.createKey(manualSyncTask.id);
            (_a = this.manualSyncTasks.get(key)) === null || _a === void 0 ? void 0 : _a.disposables.dispose();
            this.manualSyncTasks.delete(key);
        }
        createKey(manualSyncTaskId) { return `manualSyncTask-${manualSyncTaskId}`; }
    }
    exports.UserDataSyncChannel = UserDataSyncChannel;
    class UserDataSyncChannelClient extends lifecycle_1.Disposable {
        constructor(userDataSyncChannel) {
            super();
            this._status = "uninitialized" /* SyncStatus.Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this.channel = {
                call(command, arg, cancellationToken) {
                    return userDataSyncChannel.call(command, arg, cancellationToken)
                        .then(null, error => { throw userDataSync_1.UserDataSyncError.toUserDataSyncError(error); });
                },
                listen(event, arg) {
                    return userDataSyncChannel.listen(event, arg);
                }
            };
            this.channel.call('_getInitialData').then(([status, conflicts, lastSyncTime]) => {
                this.updateStatus(status);
                this.updateConflicts(conflicts);
                if (lastSyncTime) {
                    this.updateLastSyncTime(lastSyncTime);
                }
                this._register(this.channel.listen('onDidChangeStatus')(status => this.updateStatus(status)));
                this._register(this.channel.listen('onDidChangeLastSyncTime')(lastSyncTime => this.updateLastSyncTime(lastSyncTime)));
            });
            this._register(this.channel.listen('onDidChangeConflicts')(conflicts => this.updateConflicts(conflicts)));
            this._register(this.channel.listen('onSyncErrors')(errors => this._onSyncErrors.fire(errors.map(([source, error]) => ([source, userDataSync_1.UserDataSyncError.toUserDataSyncError(error)])))));
        }
        get status() { return this._status; }
        get onDidChangeLocal() { return this.channel.listen('onDidChangeLocal'); }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        get onDidResetLocal() { return this.channel.listen('onDidResetLocal'); }
        get onDidResetRemote() { return this.channel.listen('onDidResetRemote'); }
        createSyncTask() {
            throw new Error('not supported');
        }
        async createManualSyncTask() {
            const { id, manifest, status } = await this.channel.call('createManualSyncTask');
            const that = this;
            const manualSyncTaskChannelClient = new ManualSyncTaskChannelClient(id, manifest, status, {
                async call(command, arg, cancellationToken) {
                    return that.channel.call(`manualSync/${command}`, [id, ...((0, types_1.isArray)(arg) ? arg : [arg])], cancellationToken);
                },
                listen(event, arg) {
                    return event_1.Event.map(event_1.Event.filter(that.channel.listen(`manualSync/${event}`, arg), e => !manualSyncTaskChannelClient.isDiposed() && e.manualSyncTaskId === id), e => e.data);
                }
            });
            return manualSyncTaskChannelClient;
        }
        replace(uri) {
            return this.channel.call('replace', [uri]);
        }
        reset() {
            return this.channel.call('reset');
        }
        resetRemote() {
            return this.channel.call('resetRemote');
        }
        resetLocal() {
            return this.channel.call('resetLocal');
        }
        hasPreviouslySynced() {
            return this.channel.call('hasPreviouslySynced');
        }
        hasLocalData() {
            return this.channel.call('hasLocalData');
        }
        accept(syncResource, resource, content, apply) {
            return this.channel.call('accept', [syncResource, resource, content, apply]);
        }
        resolveContent(resource) {
            return this.channel.call('resolveContent', [resource]);
        }
        async getLocalSyncResourceHandles(resource) {
            const handles = await this.channel.call('getLocalSyncResourceHandles', [resource]);
            return handles.map(({ created, uri }) => ({ created, uri: uri_1.URI.revive(uri) }));
        }
        async getRemoteSyncResourceHandles(resource) {
            const handles = await this.channel.call('getRemoteSyncResourceHandles', [resource]);
            return handles.map(({ created, uri }) => ({ created, uri: uri_1.URI.revive(uri) }));
        }
        async getAssociatedResources(resource, syncResourceHandle) {
            const result = await this.channel.call('getAssociatedResources', [resource, syncResourceHandle]);
            return result.map(({ resource, comparableResource }) => ({ resource: uri_1.URI.revive(resource), comparableResource: uri_1.URI.revive(comparableResource) }));
        }
        async getMachineId(resource, syncResourceHandle) {
            return this.channel.call('getMachineId', [resource, syncResourceHandle]);
        }
        async updateStatus(status) {
            this._status = status;
            this._onDidChangeStatus.fire(status);
        }
        async updateConflicts(conflicts) {
            // Revive URIs
            this._conflicts = conflicts.map(([syncResource, conflicts]) => ([
                syncResource,
                conflicts.map(r => (Object.assign(Object.assign({}, r), { localResource: uri_1.URI.revive(r.localResource), remoteResource: uri_1.URI.revive(r.remoteResource), previewResource: uri_1.URI.revive(r.previewResource) })))
            ]));
            this._onDidChangeConflicts.fire(this._conflicts);
        }
        updateLastSyncTime(lastSyncTime) {
            if (this._lastSyncTime !== lastSyncTime) {
                this._lastSyncTime = lastSyncTime;
                this._onDidChangeLastSyncTime.fire(lastSyncTime);
            }
        }
    }
    exports.UserDataSyncChannelClient = UserDataSyncChannelClient;
    class ManualSyncTaskChannelClient extends lifecycle_1.Disposable {
        constructor(id, manifest, status, manualSyncTaskChannel) {
            super();
            this.id = id;
            this.manifest = manifest;
            this._disposed = false;
            this._status = status;
            const that = this;
            this.channel = {
                async call(command, arg, cancellationToken) {
                    try {
                        const result = await manualSyncTaskChannel.call(command, arg, cancellationToken);
                        if (!that.isDiposed()) {
                            that._status = await manualSyncTaskChannel.call('_getStatus');
                        }
                        return result;
                    }
                    catch (error) {
                        throw userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                    }
                },
                listen(event, arg) {
                    return manualSyncTaskChannel.listen(event, arg);
                }
            };
        }
        get onSynchronizeResources() { return this.channel.listen('onSynchronizeResources'); }
        get status() { return this._status; }
        async preview() {
            const previews = await this.channel.call('preview');
            return this.deserializePreviews(previews);
        }
        async accept(resource, content) {
            const previews = await this.channel.call('accept', [resource, content]);
            return this.deserializePreviews(previews);
        }
        async merge(resource) {
            const previews = await this.channel.call('merge', [resource]);
            return this.deserializePreviews(previews);
        }
        async discard(resource) {
            const previews = await this.channel.call('discard', [resource]);
            return this.deserializePreviews(previews);
        }
        async discardConflicts() {
            const previews = await this.channel.call('discardConflicts');
            return this.deserializePreviews(previews);
        }
        async apply() {
            const previews = await this.channel.call('apply');
            return this.deserializePreviews(previews);
        }
        pull() {
            return this.channel.call('pull');
        }
        push() {
            return this.channel.call('push');
        }
        stop() {
            return this.channel.call('stop');
        }
        isDiposed() { return this._disposed; }
        dispose() {
            this._disposed = true;
            this.channel.call('dispose');
        }
        deserializePreviews(previews) {
            return previews.map(([syncResource, preview]) => ([
                syncResource,
                {
                    isLastSyncFromCurrentMachine: preview.isLastSyncFromCurrentMachine,
                    resourcePreviews: preview.resourcePreviews.map(r => (Object.assign(Object.assign({}, r), { localResource: uri_1.URI.revive(r.localResource), remoteResource: uri_1.URI.revive(r.remoteResource), previewResource: uri_1.URI.revive(r.previewResource), acceptedResource: uri_1.URI.revive(r.acceptedResource) })))
                }
            ]));
        }
    }
});
//# sourceMappingURL=userDataSyncServiceIpc.js.map