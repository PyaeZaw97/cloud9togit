/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, instantiation_1, extensions_1, event_1, uri_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyService = exports.IWorkingCopyService = void 0;
    exports.IWorkingCopyService = (0, instantiation_1.createDecorator)('workingCopyService');
    class WorkingCopyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            //#region Events
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidUnregister = this._register(new event_1.Emitter());
            this.onDidUnregister = this._onDidUnregister.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._workingCopies = new Set();
            this.mapResourceToWorkingCopies = new map_1.ResourceMap();
            //#endregion
        }
        //#endregion
        //#region Registry
        get workingCopies() { return Array.from(this._workingCopies.values()); }
        registerWorkingCopy(workingCopy) {
            let workingCopiesForResource = this.mapResourceToWorkingCopies.get(workingCopy.resource);
            if (workingCopiesForResource === null || workingCopiesForResource === void 0 ? void 0 : workingCopiesForResource.has(workingCopy.typeId)) {
                throw new Error(`Cannot register more than one working copy with the same resource ${workingCopy.resource.toString()} and type ${workingCopy.typeId}.`);
            }
            // Registry (all)
            this._workingCopies.add(workingCopy);
            // Registry (type based)
            if (!workingCopiesForResource) {
                workingCopiesForResource = new Map();
                this.mapResourceToWorkingCopies.set(workingCopy.resource, workingCopiesForResource);
            }
            workingCopiesForResource.set(workingCopy.typeId, workingCopy);
            // Wire in Events
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(workingCopy.onDidChangeContent(() => this._onDidChangeContent.fire(workingCopy)));
            disposables.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            disposables.add(workingCopy.onDidSave(e => this._onDidSave.fire(Object.assign({ workingCopy }, e))));
            // Send some initial events
            this._onDidRegister.fire(workingCopy);
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this.unregisterWorkingCopy(workingCopy);
                (0, lifecycle_1.dispose)(disposables);
                // Signal as event
                this._onDidUnregister.fire(workingCopy);
            });
        }
        unregisterWorkingCopy(workingCopy) {
            // Registry (all)
            this._workingCopies.delete(workingCopy);
            // Registry (type based)
            const workingCopiesForResource = this.mapResourceToWorkingCopies.get(workingCopy.resource);
            if ((workingCopiesForResource === null || workingCopiesForResource === void 0 ? void 0 : workingCopiesForResource.delete(workingCopy.typeId)) && workingCopiesForResource.size === 0) {
                this.mapResourceToWorkingCopies.delete(workingCopy.resource);
            }
            // If copy is dirty, ensure to fire an event to signal the dirty change
            // (a disposed working copy cannot account for being dirty in our model)
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
        }
        has(resourceOrIdentifier) {
            var _a, _b;
            if (uri_1.URI.isUri(resourceOrIdentifier)) {
                return this.mapResourceToWorkingCopies.has(resourceOrIdentifier);
            }
            return (_b = (_a = this.mapResourceToWorkingCopies.get(resourceOrIdentifier.resource)) === null || _a === void 0 ? void 0 : _a.has(resourceOrIdentifier.typeId)) !== null && _b !== void 0 ? _b : false;
        }
        get(identifier) {
            var _a;
            return (_a = this.mapResourceToWorkingCopies.get(identifier.resource)) === null || _a === void 0 ? void 0 : _a.get(identifier.typeId);
        }
        getAll(resource) {
            const workingCopies = this.mapResourceToWorkingCopies.get(resource);
            if (!workingCopies) {
                return undefined;
            }
            return Array.from(workingCopies.values());
        }
        //#endregion
        //#region Dirty Tracking
        get hasDirty() {
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    return true;
                }
            }
            return false;
        }
        get dirtyCount() {
            let totalDirtyCount = 0;
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    totalDirtyCount++;
                }
            }
            return totalDirtyCount;
        }
        get dirtyWorkingCopies() {
            return this.workingCopies.filter(workingCopy => workingCopy.isDirty());
        }
        isDirty(resource, typeId) {
            var _a, _b;
            const workingCopies = this.mapResourceToWorkingCopies.get(resource);
            if (workingCopies) {
                // For a specific type
                if (typeof typeId === 'string') {
                    return (_b = (_a = workingCopies.get(typeId)) === null || _a === void 0 ? void 0 : _a.isDirty()) !== null && _b !== void 0 ? _b : false;
                }
                // Across all working copies
                else {
                    for (const [, workingCopy] of workingCopies) {
                        if (workingCopy.isDirty()) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
    exports.WorkingCopyService = WorkingCopyService;
    (0, extensions_1.registerSingleton)(exports.IWorkingCopyService, WorkingCopyService, true);
});
//# sourceMappingURL=workingCopyService.js.map