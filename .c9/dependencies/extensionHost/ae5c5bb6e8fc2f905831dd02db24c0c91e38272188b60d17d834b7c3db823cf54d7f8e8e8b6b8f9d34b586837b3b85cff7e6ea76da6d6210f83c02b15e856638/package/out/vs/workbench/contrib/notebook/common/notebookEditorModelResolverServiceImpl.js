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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/log/common/log", "vs/base/common/event", "vs/workbench/services/extensions/common/extensions", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/map", "vs/workbench/services/workingCopy/common/fileWorkingCopyManager", "vs/base/common/network", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/base/common/types", "vs/base/common/cancellation"], function (require, exports, instantiation_1, uri_1, notebookCommon_1, notebookEditorModel_1, lifecycle_1, notebookService_1, log_1, event_1, extensions_1, uriIdentity_1, map_1, fileWorkingCopyManager_1, network_1, notebookProvider_1, types_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookModelResolverServiceImpl = void 0;
    let NotebookModelReferenceCollection = class NotebookModelReferenceCollection extends lifecycle_1.ReferenceCollection {
        constructor(_instantiationService, _notebookService, _logService) {
            super();
            this._instantiationService = _instantiationService;
            this._notebookService = _notebookService;
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._workingCopyManagers = new Map();
            this._modelListener = new Map();
            this._onDidSaveNotebook = new event_1.Emitter();
            this.onDidSaveNotebook = this._onDidSaveNotebook.event;
            this._onDidChangeDirty = new event_1.Emitter();
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._dirtyStates = new map_1.ResourceMap();
            this._disposables.add(_notebookService.onWillRemoveViewType(viewType => {
                const manager = this._workingCopyManagers.get(notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create(viewType));
                manager === null || manager === void 0 ? void 0 : manager.destroy().catch(err => _logService.error(err));
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._onDidSaveNotebook.dispose();
            this._onDidChangeDirty.dispose();
            (0, lifecycle_1.dispose)(this._modelListener.values());
            (0, lifecycle_1.dispose)(this._workingCopyManagers.values());
        }
        isDirty(resource) {
            var _a;
            return (_a = this._dirtyStates.get(resource)) !== null && _a !== void 0 ? _a : false;
        }
        async createReferencedObject(key, viewType, hasAssociatedFilePath) {
            const uri = uri_1.URI.parse(key);
            const info = await this._notebookService.withNotebookDataProvider(viewType);
            let result;
            if (info instanceof notebookService_1.ComplexNotebookProviderInfo) {
                const model = this._instantiationService.createInstance(notebookEditorModel_1.ComplexNotebookEditorModel, uri, viewType, info.controller);
                result = await model.load();
            }
            else if (info instanceof notebookService_1.SimpleNotebookProviderInfo) {
                const workingCopyTypeId = notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create(viewType);
                let workingCopyManager = this._workingCopyManagers.get(workingCopyTypeId);
                if (!workingCopyManager) {
                    const factory = new notebookEditorModel_1.NotebookFileWorkingCopyModelFactory(viewType, this._notebookService);
                    workingCopyManager = this._instantiationService.createInstance(fileWorkingCopyManager_1.FileWorkingCopyManager, workingCopyTypeId, factory, factory);
                    this._workingCopyManagers.set(workingCopyTypeId, workingCopyManager);
                }
                const model = this._instantiationService.createInstance(notebookEditorModel_1.SimpleNotebookEditorModel, uri, hasAssociatedFilePath, viewType, workingCopyManager);
                result = await model.load();
            }
            else {
                throw new Error(`CANNOT open ${key}, no provider found`);
            }
            // Whenever a notebook model is dirty we automatically reference it so that
            // we can ensure that at least one reference exists. That guarantees that
            // a model with unsaved changes is never disposed.
            let onDirtyAutoReference;
            this._modelListener.set(result, (0, lifecycle_1.combinedDisposable)(result.onDidSave(() => this._onDidSaveNotebook.fire(result.resource)), result.onDidChangeDirty(() => {
                const isDirty = result.isDirty();
                this._dirtyStates.set(result.resource, isDirty);
                // isDirty -> add reference
                // !isDirty -> free reference
                if (isDirty && !onDirtyAutoReference) {
                    onDirtyAutoReference = this.acquire(key, viewType);
                }
                else if (onDirtyAutoReference) {
                    onDirtyAutoReference.dispose();
                    onDirtyAutoReference = undefined;
                }
                this._onDidChangeDirty.fire(result);
            }), (0, lifecycle_1.toDisposable)(() => onDirtyAutoReference === null || onDirtyAutoReference === void 0 ? void 0 : onDirtyAutoReference.dispose())));
            return result;
        }
        destroyReferencedObject(_key, object) {
            object.then(model => {
                var _a;
                (_a = this._modelListener.get(model)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._modelListener.delete(model);
                model.dispose();
            }).catch(err => {
                this._logService.critical('FAILED to destory notebook', err);
            });
        }
    };
    NotebookModelReferenceCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookService_1.INotebookService),
        __param(2, log_1.ILogService)
    ], NotebookModelReferenceCollection);
    let NotebookModelResolverServiceImpl = class NotebookModelResolverServiceImpl {
        constructor(instantiationService, _notebookService, _extensionService, _uriIdentService) {
            this._notebookService = _notebookService;
            this._extensionService = _extensionService;
            this._uriIdentService = _uriIdentService;
            this._onWillFailWithConflict = new event_1.AsyncEmitter();
            this.onWillFailWithConflict = this._onWillFailWithConflict.event;
            this._data = instantiationService.createInstance(NotebookModelReferenceCollection);
            this.onDidSaveNotebook = this._data.onDidSaveNotebook;
            this.onDidChangeDirty = this._data.onDidChangeDirty;
        }
        dispose() {
            this._data.dispose();
        }
        isDirty(resource) {
            return this._data.isDirty(resource);
        }
        async resolve(arg0, viewType) {
            var _a, _b, _c, _d;
            let resource;
            let hasAssociatedFilePath = false;
            if (uri_1.URI.isUri(arg0)) {
                resource = arg0;
            }
            else {
                if (!arg0.untitledResource) {
                    const info = this._notebookService.getContributedNotebookType((0, types_1.assertIsDefined)(viewType));
                    if (!info) {
                        throw new Error('UNKNOWN view type: ' + viewType);
                    }
                    const suffix = (_a = notebookProvider_1.NotebookProviderInfo.possibleFileEnding(info.selectors)) !== null && _a !== void 0 ? _a : '';
                    for (let counter = 1;; counter++) {
                        const candidate = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `Untitled-${counter}${suffix}`, query: viewType });
                        if (!this._notebookService.getNotebookTextModel(candidate)) {
                            resource = candidate;
                            break;
                        }
                    }
                }
                else if (arg0.untitledResource.scheme === network_1.Schemas.untitled) {
                    resource = arg0.untitledResource;
                }
                else {
                    resource = arg0.untitledResource.with({ scheme: network_1.Schemas.untitled });
                    hasAssociatedFilePath = true;
                }
            }
            if (resource.scheme === notebookCommon_1.CellUri.scheme) {
                throw new Error(`CANNOT open a cell-uri as notebook. Tried with ${resource.toString()}`);
            }
            resource = this._uriIdentService.asCanonicalUri(resource);
            const existingViewType = (_b = this._notebookService.getNotebookTextModel(resource)) === null || _b === void 0 ? void 0 : _b.viewType;
            if (!viewType) {
                if (existingViewType) {
                    viewType = existingViewType;
                }
                else {
                    await this._extensionService.whenInstalledExtensionsRegistered();
                    const providers = this._notebookService.getContributedNotebookTypes(resource);
                    const exclusiveProvider = providers.find(provider => provider.exclusive);
                    viewType = (exclusiveProvider === null || exclusiveProvider === void 0 ? void 0 : exclusiveProvider.id) || ((_c = providers[0]) === null || _c === void 0 ? void 0 : _c.id);
                }
            }
            if (!viewType) {
                throw new Error(`Missing viewType for '${resource}'`);
            }
            if (existingViewType && existingViewType !== viewType) {
                await this._onWillFailWithConflict.fireAsync({ resource, viewType }, cancellation_1.CancellationToken.None);
                // check again, listener should have done cleanup
                const existingViewType2 = (_d = this._notebookService.getNotebookTextModel(resource)) === null || _d === void 0 ? void 0 : _d.viewType;
                if (existingViewType2 && existingViewType2 !== viewType) {
                    throw new Error(`A notebook with view type '${existingViewType2}' already exists for '${resource}', CANNOT create another notebook with view type ${viewType}`);
                }
            }
            const reference = this._data.acquire(resource.toString(), viewType, hasAssociatedFilePath);
            try {
                const model = await reference.object;
                return {
                    object: model,
                    dispose() { reference.dispose(); }
                };
            }
            catch (err) {
                reference.dispose();
                throw err;
            }
        }
    };
    NotebookModelResolverServiceImpl = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookService_1.INotebookService),
        __param(2, extensions_1.IExtensionService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], NotebookModelResolverServiceImpl);
    exports.NotebookModelResolverServiceImpl = NotebookModelResolverServiceImpl;
});
//# sourceMappingURL=notebookEditorModelResolverServiceImpl.js.map