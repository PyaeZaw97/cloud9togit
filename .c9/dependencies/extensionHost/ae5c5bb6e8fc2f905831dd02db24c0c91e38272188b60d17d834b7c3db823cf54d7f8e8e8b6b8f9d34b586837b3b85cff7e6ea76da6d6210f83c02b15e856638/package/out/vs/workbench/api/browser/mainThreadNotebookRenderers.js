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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, notebookRendererMessagingService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookRenderers = void 0;
    let MainThreadNotebookRenderers = class MainThreadNotebookRenderers extends lifecycle_1.Disposable {
        constructor(extHostContext, messaging) {
            super();
            this.messaging = messaging;
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookRenderers);
            this._register(messaging.onShouldPostMessage(e => {
                this.proxy.$postRendererMessage(e.editorId, e.rendererId, e.message);
            }));
        }
        $postMessage(editorId, rendererId, message) {
            return this.messaging.receiveMessage(editorId, rendererId, message);
        }
    };
    MainThreadNotebookRenderers = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebookRenderers),
        __param(1, notebookRendererMessagingService_1.INotebookRendererMessagingService)
    ], MainThreadNotebookRenderers);
    exports.MainThreadNotebookRenderers = MainThreadNotebookRenderers;
});
//# sourceMappingURL=mainThreadNotebookRenderers.js.map