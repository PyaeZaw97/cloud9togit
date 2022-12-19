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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostNotebookKernels", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, map_1, log_1, extHost_protocol_1, extHostNotebookKernels_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookProxyKernels = void 0;
    let ExtHostNotebookProxyKernels = class ExtHostNotebookProxyKernels {
        constructor(mainContext, extHostNotebook, _logService) {
            this.extHostNotebook = extHostNotebook;
            this._logService = _logService;
            this._proxyKernelData = new Map();
            this._handlePool = 0;
            this._onDidChangeCellExecutionState = new event_1.Emitter();
            this.onDidChangeNotebookCellExecutionState = this._onDidChangeCellExecutionState.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookProxyKernels);
        }
        createNotebookProxyController(extension, id, viewType, label, handler) {
            const handle = this._handlePool++;
            let isDisposed = false;
            const commandDisposables = new lifecycle_1.DisposableStore();
            const onDidChangeSelection = new event_1.Emitter();
            const data = {
                id: (0, extHostNotebookKernels_1.createKernelId)(extension.identifier, id),
                notebookType: viewType,
                extensionId: extension.identifier,
                extensionLocation: extension.extensionLocation,
                label: label || extension.identifier.value,
            };
            let _resolveHandler = handler;
            this._proxy.$addProxyKernel(handle, data).catch(err => {
                // this can happen when a kernel with that ID is already registered
                console.log(err);
                isDisposed = true;
            });
            let tokenPool = 0;
            const _update = () => {
                if (isDisposed) {
                    return;
                }
                const myToken = ++tokenPool;
                Promise.resolve().then(() => {
                    if (myToken === tokenPool) {
                        this._proxy.$updateProxyKernel(handle, data);
                    }
                });
            };
            // notebook documents that are associated to this controller
            const associatedNotebooks = new map_1.ResourceMap();
            const controller = {
                get id() { return id; },
                get notebookType() { return data.notebookType; },
                onDidChangeSelectedNotebooks: onDidChangeSelection.event,
                get label() {
                    return data.label;
                },
                set label(value) {
                    var _a;
                    data.label = (_a = value !== null && value !== void 0 ? value : extension.displayName) !== null && _a !== void 0 ? _a : extension.name;
                    _update();
                },
                get detail() {
                    var _a;
                    return (_a = data.detail) !== null && _a !== void 0 ? _a : '';
                },
                set detail(value) {
                    data.detail = value;
                    _update();
                },
                get description() {
                    var _a;
                    return (_a = data.description) !== null && _a !== void 0 ? _a : '';
                },
                set description(value) {
                    data.description = value;
                    _update();
                },
                get kind() {
                    var _a;
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'notebookControllerKind');
                    return (_a = data.kind) !== null && _a !== void 0 ? _a : '';
                },
                set kind(value) {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'notebookControllerKind');
                    data.kind = value;
                    _update();
                },
                get resolveHandler() {
                    return _resolveHandler;
                },
                dispose: () => {
                    if (!isDisposed) {
                        this._logService.trace(`NotebookProxyController[${handle}], DISPOSED`);
                        isDisposed = true;
                        this._proxyKernelData.delete(handle);
                        commandDisposables.dispose();
                        onDidChangeSelection.dispose();
                        this._proxy.$removeProxyKernel(handle);
                    }
                }
            };
            this._proxyKernelData.set(handle, {
                extensionId: extension.identifier,
                controller,
                onDidChangeSelection,
                associatedNotebooks
            });
            return controller;
        }
        async $resolveKernel(handle) {
            const obj = this._proxyKernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return null;
            }
            const controller = await obj.controller.resolveHandler();
            if (typeof controller === 'string') {
                return controller;
            }
            else {
                return this.extHostNotebook.getIdByController(controller);
            }
        }
    };
    ExtHostNotebookProxyKernels = __decorate([
        __param(2, log_1.ILogService)
    ], ExtHostNotebookProxyKernels);
    exports.ExtHostNotebookProxyKernels = ExtHostNotebookProxyKernels;
});
//# sourceMappingURL=extHostNotebookProxyKernels.js.map