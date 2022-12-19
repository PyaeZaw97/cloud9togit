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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/common/notebookKernelService", "../common/extHost.protocol", "vs/base/common/errors"], function (require, exports, event_1, lifecycle_1, extHostCustomers_1, notebookKernelService_1, extHost_protocol_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookProxyKernels = void 0;
    class MainThreadProxyKernel {
        constructor(data) {
            this.type = 1 /* NotebookKernelType.Proxy */;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.preloadProvides = [];
            this.supportedLanguages = [];
            this.id = data.id;
            this.viewType = data.notebookType;
            this.extension = data.extensionId;
            this.label = data.label;
            this.description = data.description;
            this.detail = data.detail;
            this.kind = data.kind;
            this.connectionState = 1 /* ProxyKernelState.Disconnected */;
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
            this._onDidChange.fire(event);
        }
    }
    let MainThreadNotebookProxyKernels = class MainThreadNotebookProxyKernels {
        constructor(extHostContext, _notebookKernelService) {
            this._notebookKernelService = _notebookKernelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._proxyKernels = new Map();
            this._proxyKernelProxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookProxyKernels);
        }
        dispose() {
            this._disposables.dispose();
            for (let [, registration] of this._proxyKernels.values()) {
                registration.dispose();
            }
        }
        // -- Proxy kernel
        async $addProxyKernel(handle, data) {
            const that = this;
            const proxyKernel = new class extends MainThreadProxyKernel {
                async resolveKernel() {
                    try {
                        this.connectionState = 3 /* ProxyKernelState.Initializing */;
                        this._onDidChange.fire({ connectionState: true });
                        const delegateKernel = await that._proxyKernelProxy.$resolveKernel(handle);
                        this.connectionState = 2 /* ProxyKernelState.Connected */;
                        this._onDidChange.fire({ connectionState: true });
                        return delegateKernel;
                    }
                    catch (err) {
                        (0, errors_1.onUnexpectedError)(err);
                        this.connectionState = 1 /* ProxyKernelState.Disconnected */;
                        this._onDidChange.fire({ connectionState: true });
                        return null;
                    }
                }
            }(data);
            const registration = this._notebookKernelService.registerKernel(proxyKernel);
            this._proxyKernels.set(handle, [proxyKernel, registration]);
        }
        $updateProxyKernel(handle, data) {
            const tuple = this._proxyKernels.get(handle);
            if (tuple) {
                tuple[0].update(data);
            }
        }
        $removeProxyKernel(handle) {
            const tuple = this._proxyKernels.get(handle);
            if (tuple) {
                tuple[1].dispose();
                this._proxyKernels.delete(handle);
            }
        }
    };
    MainThreadNotebookProxyKernels = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebookProxyKernels),
        __param(1, notebookKernelService_1.INotebookKernelService)
    ], MainThreadNotebookProxyKernels);
    exports.MainThreadNotebookProxyKernels = MainThreadNotebookProxyKernels;
});
//# sourceMappingURL=mainThreadNotebookProxyKernels.js.map