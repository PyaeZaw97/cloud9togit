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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, extHost_protocol_1, extHostRpcService_1, extHostTypeConverters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostBulkEdits = void 0;
    let ExtHostBulkEdits = class ExtHostBulkEdits {
        constructor(extHostRpc, extHostDocumentsAndEditors) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits);
            this._versionInformationProvider = {
                getTextDocumentVersion: uri => { var _a; return (_a = extHostDocumentsAndEditors.getDocument(uri)) === null || _a === void 0 ? void 0 : _a.version; },
                getNotebookDocumentVersion: () => undefined
            };
        }
        applyWorkspaceEdit(edit) {
            const dto = extHostTypeConverters_1.WorkspaceEdit.from(edit, this._versionInformationProvider);
            return this._proxy.$tryApplyWorkspaceEdit(dto);
        }
    };
    ExtHostBulkEdits = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostBulkEdits);
    exports.ExtHostBulkEdits = ExtHostBulkEdits;
});
//# sourceMappingURL=extHostBulkEdits.js.map