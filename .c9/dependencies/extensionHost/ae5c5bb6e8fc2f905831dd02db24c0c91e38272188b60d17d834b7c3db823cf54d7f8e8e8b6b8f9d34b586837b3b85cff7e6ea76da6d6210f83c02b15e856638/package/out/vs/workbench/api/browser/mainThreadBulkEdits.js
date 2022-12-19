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
define(["require", "exports", "vs/editor/browser/services/bulkEditService", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/log/common/log", "vs/base/common/marshalling", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/api/browser/mainThreadNotebookDto"], function (require, exports, bulkEditService_1, extHost_protocol_1, extHostCustomers_1, log_1, marshalling_1, bulkCellEdits_1, mainThreadNotebookDto_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadBulkEdits = exports.reviveWorkspaceEditDto2 = void 0;
    function reviveWorkspaceEditDto2(data) {
        if (!(data === null || data === void 0 ? void 0 : data.edits)) {
            return [];
        }
        const result = [];
        for (let edit of (0, marshalling_1.revive)(data).edits) {
            if (edit._type === 1 /* WorkspaceEditType.File */) {
                result.push(new bulkEditService_1.ResourceFileEdit(edit.oldUri, edit.newUri, edit.options, edit.metadata));
            }
            else if (edit._type === 2 /* WorkspaceEditType.Text */) {
                result.push(new bulkEditService_1.ResourceTextEdit(edit.resource, edit.edit, edit.modelVersionId, edit.metadata));
            }
            else if (edit._type === 3 /* WorkspaceEditType.Cell */) {
                result.push(new bulkCellEdits_1.ResourceNotebookCellEdit(edit.resource, mainThreadNotebookDto_1.NotebookDto.fromCellEditOperationDto(edit.edit), edit.notebookVersionId, edit.metadata));
            }
        }
        return result;
    }
    exports.reviveWorkspaceEditDto2 = reviveWorkspaceEditDto2;
    let MainThreadBulkEdits = class MainThreadBulkEdits {
        constructor(_extHostContext, _bulkEditService, _logService) {
            this._bulkEditService = _bulkEditService;
            this._logService = _logService;
        }
        dispose() { }
        $tryApplyWorkspaceEdit(dto, undoRedoGroupId) {
            const edits = reviveWorkspaceEditDto2(dto);
            return this._bulkEditService.apply(edits, { undoRedoGroupId }).then(() => true, err => {
                this._logService.warn('IGNORING workspace edit', err);
                return false;
            });
        }
    };
    MainThreadBulkEdits = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadBulkEdits),
        __param(1, bulkEditService_1.IBulkEditService),
        __param(2, log_1.ILogService)
    ], MainThreadBulkEdits);
    exports.MainThreadBulkEdits = MainThreadBulkEdits;
});
//# sourceMappingURL=mainThreadBulkEdits.js.map