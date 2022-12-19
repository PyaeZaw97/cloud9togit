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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/editor/browser/services/bulkEditService", "vs/platform/progress/common/progress", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/log/common/log", "vs/platform/environment/common/environment"], function (require, exports, lifecycle_1, files_1, extHostCustomers_1, extHost_protocol_1, nls_1, workingCopyFileService_1, mainThreadBulkEdits_1, bulkEditService_1, progress_1, async_1, cancellation_1, dialogs_1, severity_1, storage_1, actions_1, log_1, environment_1) {
    "use strict";
    var MainThreadFileSystemEventService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystemEventService = void 0;
    let MainThreadFileSystemEventService = MainThreadFileSystemEventService_1 = class MainThreadFileSystemEventService {
        constructor(extHostContext, fileService, workingCopyFileService, bulkEditService, progressService, dialogService, storageService, logService, envService) {
            this._listener = new lifecycle_1.DisposableStore();
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService);
            this._listener.add(fileService.onDidFilesChange(event => {
                proxy.$onFileEvent({
                    created: event.rawAdded,
                    changed: event.rawUpdated,
                    deleted: event.rawDeleted
                });
            }));
            const fileOperationParticipant = new class {
                async participate(files, operation, undoInfo, timeout, token) {
                    if (undoInfo === null || undoInfo === void 0 ? void 0 : undoInfo.isUndoing) {
                        return;
                    }
                    const cts = new cancellation_1.CancellationTokenSource(token);
                    const timer = setTimeout(() => cts.cancel(), timeout);
                    const data = await progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: this._progressLabel(operation),
                        cancellable: true,
                        delay: Math.min(timeout / 2, 3000)
                    }, () => {
                        // race extension host event delivery against timeout AND user-cancel
                        const onWillEvent = proxy.$onWillRunFileOperation(operation, files, timeout, cts.token);
                        return (0, async_1.raceCancellation)(onWillEvent, cts.token);
                    }, () => {
                        // user-cancel
                        cts.cancel();
                    }).finally(() => {
                        cts.dispose();
                        clearTimeout(timer);
                    });
                    if (!data || data.edit.edits.length === 0) {
                        // cancelled, no reply, or no edits
                        return;
                    }
                    const needsConfirmation = data.edit.edits.some(edit => { var _a; return (_a = edit.metadata) === null || _a === void 0 ? void 0 : _a.needsConfirmation; });
                    let showPreview = storageService.getBoolean(MainThreadFileSystemEventService_1.MementoKeyAdditionalEdits, 0 /* StorageScope.GLOBAL */);
                    if (envService.extensionTestsLocationURI) {
                        // don't show dialog in tests
                        showPreview = false;
                    }
                    if (showPreview === undefined) {
                        // show a user facing message
                        let message;
                        if (data.extensionNames.length === 1) {
                            if (operation === 0 /* FileOperation.CREATE */) {
                                message = (0, nls_1.localize)('ask.1.create', "Extension '{0}' wants to make refactoring changes with this file creation", data.extensionNames[0]);
                            }
                            else if (operation === 3 /* FileOperation.COPY */) {
                                message = (0, nls_1.localize)('ask.1.copy', "Extension '{0}' wants to make refactoring changes with this file copy", data.extensionNames[0]);
                            }
                            else if (operation === 2 /* FileOperation.MOVE */) {
                                message = (0, nls_1.localize)('ask.1.move', "Extension '{0}' wants to make refactoring changes with this file move", data.extensionNames[0]);
                            }
                            else /* if (operation === FileOperation.DELETE) */ {
                                message = (0, nls_1.localize)('ask.1.delete', "Extension '{0}' wants to make refactoring changes with this file deletion", data.extensionNames[0]);
                            }
                        }
                        else {
                            if (operation === 0 /* FileOperation.CREATE */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.create', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file creation", data.extensionNames.length);
                            }
                            else if (operation === 3 /* FileOperation.COPY */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.copy', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file copy", data.extensionNames.length);
                            }
                            else if (operation === 2 /* FileOperation.MOVE */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.move', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file move", data.extensionNames.length);
                            }
                            else /* if (operation === FileOperation.DELETE) */ {
                                message = (0, nls_1.localize)({ key: 'ask.N.delete', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file deletion", data.extensionNames.length);
                            }
                        }
                        if (needsConfirmation) {
                            // edit which needs confirmation -> always show dialog
                            const answer = await dialogService.show(severity_1.default.Info, message, [(0, nls_1.localize)('preview', "Show Preview"), (0, nls_1.localize)('cancel', "Skip Changes")], { cancelId: 1 });
                            showPreview = true;
                            if (answer.choice === 1) {
                                // no changes wanted
                                return;
                            }
                        }
                        else {
                            // choice
                            const answer = await dialogService.show(severity_1.default.Info, message, [(0, nls_1.localize)('ok', "OK"), (0, nls_1.localize)('preview', "Show Preview"), (0, nls_1.localize)('cancel', "Skip Changes")], {
                                cancelId: 2,
                                checkbox: { label: (0, nls_1.localize)('again', "Don't ask again") }
                            });
                            if (answer.choice === 2) {
                                // no changes wanted, don't persist cancel option
                                return;
                            }
                            showPreview = answer.choice === 1;
                            if (answer.checkboxChecked /* && answer.choice !== 2 */) {
                                storageService.store(MainThreadFileSystemEventService_1.MementoKeyAdditionalEdits, showPreview, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                            }
                        }
                    }
                    logService.info('[onWill-handler] applying additional workspace edit from extensions', data.extensionNames);
                    await bulkEditService.apply((0, mainThreadBulkEdits_1.reviveWorkspaceEditDto2)(data.edit), { undoRedoGroupId: undoInfo === null || undoInfo === void 0 ? void 0 : undoInfo.undoRedoGroupId, showPreview });
                }
                _progressLabel(operation) {
                    switch (operation) {
                        case 0 /* FileOperation.CREATE */:
                            return (0, nls_1.localize)('msg-create', "Running 'File Create' participants...");
                        case 2 /* FileOperation.MOVE */:
                            return (0, nls_1.localize)('msg-rename', "Running 'File Rename' participants...");
                        case 3 /* FileOperation.COPY */:
                            return (0, nls_1.localize)('msg-copy', "Running 'File Copy' participants...");
                        case 1 /* FileOperation.DELETE */:
                            return (0, nls_1.localize)('msg-delete', "Running 'File Delete' participants...");
                        case 4 /* FileOperation.WRITE */:
                            return (0, nls_1.localize)('msg-write', "Running 'File Write' participants...");
                    }
                }
            };
            // BEFORE file operation
            this._listener.add(workingCopyFileService.addFileOperationParticipant(fileOperationParticipant));
            // AFTER file operation
            this._listener.add(workingCopyFileService.onDidRunWorkingCopyFileOperation(e => proxy.$onDidRunFileOperation(e.operation, e.files)));
        }
        dispose() {
            this._listener.dispose();
        }
    };
    MainThreadFileSystemEventService.MementoKeyAdditionalEdits = `file.particpants.additionalEdits`;
    MainThreadFileSystemEventService = MainThreadFileSystemEventService_1 = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, files_1.IFileService),
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, progress_1.IProgressService),
        __param(5, dialogs_1.IDialogService),
        __param(6, storage_1.IStorageService),
        __param(7, log_1.ILogService),
        __param(8, environment_1.IEnvironmentService)
    ], MainThreadFileSystemEventService);
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService;
    (0, actions_1.registerAction2)(class ResetMemento extends actions_1.Action2 {
        constructor() {
            super({
                id: 'files.participants.resetChoice',
                title: (0, nls_1.localize)('label', "Reset choice for 'File operation needs preview'"),
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove(MainThreadFileSystemEventService.MementoKeyAdditionalEdits, 0 /* StorageScope.GLOBAL */);
        }
    });
});
//# sourceMappingURL=mainThreadFileSystemEventService.js.map