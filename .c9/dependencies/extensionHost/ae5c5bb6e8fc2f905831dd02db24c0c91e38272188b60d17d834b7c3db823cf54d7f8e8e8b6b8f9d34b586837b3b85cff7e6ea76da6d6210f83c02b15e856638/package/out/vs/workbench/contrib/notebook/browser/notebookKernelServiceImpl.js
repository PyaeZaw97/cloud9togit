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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/async"], function (require, exports, event_1, lifecycle_1, map_1, storage_1, uri_1, notebookService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookKernelService = void 0;
    class KernelInfo {
        constructor(kernel) {
            this.notebookPriorities = new map_1.ResourceMap();
            this.kernel = kernel;
            this.score = -1;
            this.time = KernelInfo._logicClock++;
        }
    }
    KernelInfo._logicClock = 0;
    class NotebookTextModelLikeId {
        static str(k) {
            return `${k.viewType}/${k.uri.toString()}`;
        }
        static obj(s) {
            const idx = s.indexOf('/');
            return {
                viewType: s.substring(0, idx),
                uri: uri_1.URI.parse(s.substring(idx + 1))
            };
        }
    }
    let NotebookKernelService = class NotebookKernelService extends lifecycle_1.Disposable {
        constructor(_notebookService, _storageService) {
            super();
            this._notebookService = _notebookService;
            this._storageService = _storageService;
            this._kernels = new Map();
            this._typeBindings = new map_1.LRUCache(100, 0.7);
            this._notebookBindings = new map_1.LRUCache(1000, 0.7);
            this._onDidChangeNotebookKernelBinding = this._register(new event_1.Emitter());
            this._onDidAddKernel = this._register(new event_1.Emitter());
            this._onDidRemoveKernel = this._register(new event_1.Emitter());
            this._onDidChangeNotebookAffinity = this._register(new event_1.Emitter());
            this.onDidChangeSelectedNotebooks = this._onDidChangeNotebookKernelBinding.event;
            this.onDidAddKernel = this._onDidAddKernel.event;
            this.onDidRemoveKernel = this._onDidRemoveKernel.event;
            this.onDidChangeNotebookAffinity = this._onDidChangeNotebookAffinity.event;
            // auto associate kernels to new notebook documents, also emit event when
            // a notebook has been closed (but don't update the memento)
            this._register(_notebookService.onDidAddNotebookDocument(this._tryAutoBindNotebook, this));
            this._register(_notebookService.onWillRemoveNotebookDocument(notebook => {
                const kernelId = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
                if (kernelId) {
                    this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel: kernelId, newKernel: undefined });
                }
            }));
            // restore from storage
            try {
                const data = JSON.parse(this._storageService.get(NotebookKernelService._storageNotebookBinding, 1 /* StorageScope.WORKSPACE */, '[]'));
                this._notebookBindings.fromJSON(data);
            }
            catch (_a) {
                // ignore
            }
            try {
                const data = JSON.parse(this._storageService.get(NotebookKernelService._storageTypeBinding, 0 /* StorageScope.GLOBAL */, '[]'));
                this._typeBindings.fromJSON(data);
            }
            catch (_b) {
                // ignore
            }
        }
        dispose() {
            this._kernels.clear();
            super.dispose();
        }
        _persistMementos() {
            var _a;
            (_a = this._persistSoonHandle) === null || _a === void 0 ? void 0 : _a.dispose();
            this._persistSoonHandle = (0, async_1.runWhenIdle)(() => {
                this._storageService.store(NotebookKernelService._storageNotebookBinding, JSON.stringify(this._notebookBindings), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                this._storageService.store(NotebookKernelService._storageTypeBinding, JSON.stringify(this._typeBindings), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            }, 100);
        }
        static _score(kernel, notebook) {
            if (kernel.viewType === '*') {
                return 5;
            }
            else if (kernel.viewType === notebook.viewType) {
                return 10;
            }
            else {
                return 0;
            }
        }
        _tryAutoBindNotebook(notebook, onlyThisKernel) {
            const id = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
            if (!id) {
                // no kernel associated
                return;
            }
            const existingKernel = this._kernels.get(id);
            if (!existingKernel || !NotebookKernelService._score(existingKernel.kernel, notebook)) {
                // associated kernel not known, not matching
                return;
            }
            if (!onlyThisKernel || existingKernel.kernel === onlyThisKernel) {
                this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel: undefined, newKernel: existingKernel.kernel.id });
            }
        }
        registerKernel(kernel) {
            if (this._kernels.has(kernel.id)) {
                throw new Error(`NOTEBOOK CONTROLLER with id '${kernel.id}' already exists`);
            }
            this._kernels.set(kernel.id, new KernelInfo(kernel));
            this._onDidAddKernel.fire(kernel);
            // auto associate the new kernel to existing notebooks it was
            // associated to in the past.
            for (const notebook of this._notebookService.getNotebookTextModels()) {
                this._tryAutoBindNotebook(notebook, kernel);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._kernels.delete(kernel.id)) {
                    this._onDidRemoveKernel.fire(kernel);
                }
                for (const [key, candidate] of Array.from(this._notebookBindings)) {
                    if (candidate === kernel.id) {
                        this._onDidChangeNotebookKernelBinding.fire({ notebook: NotebookTextModelLikeId.obj(key).uri, oldKernel: kernel.id, newKernel: undefined });
                    }
                }
            });
        }
        getMatchingKernel(notebook) {
            var _a, _b;
            // all applicable kernels
            const kernels = [];
            for (const info of this._kernels.values()) {
                const score = NotebookKernelService._score(info.kernel, notebook);
                if (score) {
                    kernels.push({
                        score,
                        kernel: info.kernel,
                        instanceAffinity: (_a = info.notebookPriorities.get(notebook.uri)) !== null && _a !== void 0 ? _a : 1 /* vscode.NotebookControllerPriority.Default */,
                        typeAffinity: this._typeBindings.get(info.kernel.viewType) === info.kernel.id ? 1 : 0
                    });
                }
            }
            kernels
                .sort((a, b) => b.instanceAffinity - a.instanceAffinity || b.typeAffinity - a.typeAffinity || a.score - b.score || a.kernel.label.localeCompare(b.kernel.label));
            const all = kernels.map(obj => obj.kernel);
            // bound kernel
            const selectedId = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
            const selected = selectedId ? (_b = this._kernels.get(selectedId)) === null || _b === void 0 ? void 0 : _b.kernel : undefined;
            const suggestions = kernels.filter(item => item.instanceAffinity > 1 && item.kernel !== selected).map(item => item.kernel);
            if (!suggestions.length && all.length) {
                suggestions.push(all[0]);
            }
            return { all, selected, suggestions };
        }
        getSelectedOrSuggestedKernel(notebook) {
            var _a;
            const info = this.getMatchingKernel(notebook);
            return (_a = info.selected) !== null && _a !== void 0 ? _a : (info.all.length === 1 ? info.all[0] : undefined);
        }
        // default kernel for notebookType
        selectKernelForNotebookType(kernel, typeId) {
            const existing = this._typeBindings.get(typeId);
            if (existing !== kernel.id) {
                this._typeBindings.set(typeId, kernel.id);
                this._persistMementos();
                this._onDidChangeNotebookAffinity.fire();
            }
        }
        // a notebook has one kernel, a kernel has N notebooks
        // notebook <-1----N-> kernel
        selectKernelForNotebook(kernel, notebook) {
            const key = NotebookTextModelLikeId.str(notebook);
            const oldKernel = this._notebookBindings.get(key);
            if (oldKernel !== (kernel === null || kernel === void 0 ? void 0 : kernel.id)) {
                if (kernel) {
                    this._notebookBindings.set(key, kernel.id);
                }
                else {
                    this._notebookBindings.delete(key);
                }
                this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel, newKernel: kernel.id });
                this._persistMementos();
            }
        }
        preselectKernelForNotebook(kernel, notebook) {
            const key = NotebookTextModelLikeId.str(notebook);
            const oldKernel = this._notebookBindings.get(key);
            if (oldKernel !== (kernel === null || kernel === void 0 ? void 0 : kernel.id)) {
                this._notebookBindings.set(key, kernel.id);
                this._persistMementos();
            }
        }
        updateKernelNotebookAffinity(kernel, notebook, preference) {
            const info = this._kernels.get(kernel.id);
            if (!info) {
                throw new Error(`UNKNOWN kernel '${kernel.id}'`);
            }
            if (preference === undefined) {
                info.notebookPriorities.delete(notebook);
            }
            else {
                info.notebookPriorities.set(notebook, preference);
            }
            this._onDidChangeNotebookAffinity.fire();
        }
    };
    NotebookKernelService._storageNotebookBinding = 'notebook.controller2NotebookBindings';
    NotebookKernelService._storageTypeBinding = 'notebook.controller2TypeBindings';
    NotebookKernelService = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, storage_1.IStorageService)
    ], NotebookKernelService);
    exports.NotebookKernelService = NotebookKernelService;
});
//# sourceMappingURL=notebookKernelServiceImpl.js.map