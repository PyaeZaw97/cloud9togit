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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "../common/extHost.protocol"], function (require, exports, arrays_1, errors_1, event_1, lifecycle_1, uri_1, language_1, mainThreadNotebookDto_1, extHostCustomers_1, notebookEditorService_1, notebookExecutionStateService_1, notebookKernelService_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookKernels = void 0;
    class MainThreadKernel {
        constructor(data, _languageService) {
            var _a, _b, _c, _d;
            this._languageService = _languageService;
            this.type = 0 /* NotebookKernelType.Resolved */;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.id = data.id;
            this.viewType = data.notebookType;
            this.extension = data.extensionId;
            this.implementsInterrupt = (_a = data.supportsInterrupt) !== null && _a !== void 0 ? _a : false;
            this.label = data.label;
            this.description = data.description;
            this.detail = data.detail;
            this.kind = data.kind;
            this.supportedLanguages = (0, arrays_1.isNonEmptyArray)(data.supportedLanguages) ? data.supportedLanguages : _languageService.getRegisteredLanguageIds();
            this.implementsExecutionOrder = (_b = data.supportsExecutionOrder) !== null && _b !== void 0 ? _b : false;
            this.localResourceRoot = uri_1.URI.revive(data.extensionLocation);
            this.preloads = (_d = (_c = data.preloads) === null || _c === void 0 ? void 0 : _c.map(u => ({ uri: uri_1.URI.revive(u.uri), provides: u.provides }))) !== null && _d !== void 0 ? _d : [];
        }
        get preloadUris() {
            return this.preloads.map(p => p.uri);
        }
        get preloadProvides() {
            return this.preloads.map(p => p.provides).flat();
        }
        update(data) {
            const event = Object.create(null);
            if (data.label !== undefined) {
                this.label = data.label;
                event.label = true;
            }
            if (data.description !== undefined) {
                this.description = data.description;
                event.description = true;
            }
            if (data.detail !== undefined) {
                this.detail = data.detail;
                event.detail = true;
            }
            if (data.kind !== undefined) {
                this.kind = data.kind;
                event.kind = true;
            }
            if (data.supportedLanguages !== undefined) {
                this.supportedLanguages = (0, arrays_1.isNonEmptyArray)(data.supportedLanguages) ? data.supportedLanguages : this._languageService.getRegisteredLanguageIds();
                event.supportedLanguages = true;
            }
            if (data.supportsExecutionOrder !== undefined) {
                this.implementsExecutionOrder = data.supportsExecutionOrder;
                event.hasExecutionOrder = true;
            }
            this._onDidChange.fire(event);
        }
    }
    let MainThreadNotebookKernels = class MainThreadNotebookKernels {
        constructor(extHostContext, _languageService, _notebookKernelService, _notebookExecutionStateService, notebookEditorService) {
            this._languageService = _languageService;
            this._notebookKernelService = _notebookKernelService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._editors = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._kernels = new Map();
            this._executions = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookKernels);
            notebookEditorService.listNotebookEditors().forEach(this._onEditorAdd, this);
            notebookEditorService.onDidAddNotebookEditor(this._onEditorAdd, this, this._disposables);
            notebookEditorService.onDidRemoveNotebookEditor(this._onEditorRemove, this, this._disposables);
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                // EH shut down, complete all executions started by this EH
                this._executions.forEach(e => {
                    e.complete({});
                });
            }));
            this._disposables.add(this._notebookExecutionStateService.onDidChangeCellExecution(e => {
                var _a;
                this._proxy.$cellExecutionChanged(e.notebook, e.cellHandle, (_a = e.changed) === null || _a === void 0 ? void 0 : _a.state);
            }));
        }
        dispose() {
            this._disposables.dispose();
            for (let [, registration] of this._kernels.values()) {
                registration.dispose();
            }
        }
        // --- kernel ipc
        _onEditorAdd(editor) {
            const ipcListener = editor.onDidReceiveMessage(e => {
                if (!editor.hasModel()) {
                    return;
                }
                const { selected } = this._notebookKernelService.getMatchingKernel(editor.textModel);
                if (!selected) {
                    return;
                }
                for (let [handle, candidate] of this._kernels) {
                    if (candidate[0] === selected) {
                        this._proxy.$acceptKernelMessageFromRenderer(handle, editor.getId(), e.message);
                        break;
                    }
                }
            });
            this._editors.set(editor, ipcListener);
        }
        _onEditorRemove(editor) {
            var _a;
            (_a = this._editors.get(editor)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._editors.delete(editor);
        }
        async $postMessage(handle, editorId, message) {
            const tuple = this._kernels.get(handle);
            if (!tuple) {
                throw new Error('kernel already disposed');
            }
            const [kernel] = tuple;
            let didSend = false;
            for (const [editor] of this._editors) {
                if (!editor.hasModel()) {
                    continue;
                }
                if (this._notebookKernelService.getMatchingKernel(editor.textModel).selected !== kernel) {
                    // different kernel
                    continue;
                }
                if (editorId === undefined) {
                    // all editors
                    editor.postMessage(message);
                    didSend = true;
                }
                else if (editor.getId() === editorId) {
                    // selected editors
                    editor.postMessage(message);
                    didSend = true;
                    break;
                }
            }
            return didSend;
        }
        // --- kernel adding/updating/removal
        async $addKernel(handle, data) {
            const that = this;
            const kernel = new class extends MainThreadKernel {
                async executeNotebookCellsRequest(uri, handles) {
                    await that._proxy.$executeCells(handle, uri, handles);
                }
                async cancelNotebookCellExecution(uri, handles) {
                    await that._proxy.$cancelCells(handle, uri, handles);
                }
            }(data, this._languageService);
            const listener = this._notebookKernelService.onDidChangeSelectedNotebooks(e => {
                if (e.oldKernel === kernel.id) {
                    this._proxy.$acceptNotebookAssociation(handle, e.notebook, false);
                }
                else if (e.newKernel === kernel.id) {
                    this._proxy.$acceptNotebookAssociation(handle, e.notebook, true);
                }
            });
            const registration = this._notebookKernelService.registerKernel(kernel);
            this._kernels.set(handle, [kernel, (0, lifecycle_1.combinedDisposable)(listener, registration)]);
        }
        $updateKernel(handle, data) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                tuple[0].update(data);
            }
        }
        $removeKernel(handle) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._kernels.delete(handle);
            }
        }
        $updateNotebookPriority(handle, notebook, value) {
            const tuple = this._kernels.get(handle);
            if (tuple) {
                this._notebookKernelService.updateKernelNotebookAffinity(tuple[0], uri_1.URI.revive(notebook), value);
            }
        }
        // --- execution
        $createExecution(handle, controllerId, rawUri, cellHandle) {
            const uri = uri_1.URI.revive(rawUri);
            const execution = this._notebookExecutionStateService.createCellExecution(controllerId, uri, cellHandle);
            execution.confirm();
            this._executions.set(handle, execution);
        }
        $updateExecution(handle, data) {
            const updates = data.value;
            try {
                const execution = this._executions.get(handle);
                if (execution) {
                    execution.update(updates.map(mainThreadNotebookDto_1.NotebookDto.fromCellExecuteUpdateDto));
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        $completeExecution(handle, data) {
            try {
                const execution = this._executions.get(handle);
                if (execution) {
                    execution.complete(mainThreadNotebookDto_1.NotebookDto.fromCellExecuteCompleteDto(data.value));
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
            finally {
                this._executions.delete(handle);
            }
        }
    };
    MainThreadNotebookKernels = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebookKernels),
        __param(1, language_1.ILanguageService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, notebookEditorService_1.INotebookEditorService)
    ], MainThreadNotebookKernels);
    exports.MainThreadNotebookKernels = MainThreadNotebookKernels;
});
//# sourceMappingURL=mainThreadNotebookKernels.js.map