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
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, files_1, configuration_1, workingCopyFileService_1, undoRedo_1, instantiation_1, log_1, cancellation_1, arrays_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkFileEdits = void 0;
    class Noop {
        constructor() {
            this.uris = [];
        }
        async perform() { return this; }
        toString() {
            return '(noop)';
        }
    }
    class RenameEdit {
        constructor(newUri, oldUri, options) {
            this.newUri = newUri;
            this.oldUri = oldUri;
            this.options = options;
            this.type = 'rename';
        }
    }
    let RenameOperation = class RenameOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
        }
        get uris() {
            return this._edits.map(edit => [edit.newUri, edit.oldUri]).flat();
        }
        async perform(token) {
            const moves = [];
            const undoes = [];
            for (const edit of this._edits) {
                // check: not overwriting, but ignoring, and the target file exists
                const skip = edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri);
                if (!skip) {
                    moves.push({
                        file: { source: edit.oldUri, target: edit.newUri },
                        overwrite: edit.options.overwrite
                    });
                    // reverse edit
                    undoes.push(new RenameEdit(edit.oldUri, edit.newUri, edit.options));
                }
            }
            if (moves.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.move(moves, token, this._undoRedoInfo);
            return new RenameOperation(undoes, { isUndoing: true }, this._workingCopyFileService, this._fileService);
        }
        toString() {
            return `(rename ${this._edits.map(edit => `${edit.oldUri} to ${edit.newUri}`).join(', ')})`;
        }
    };
    RenameOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService)
    ], RenameOperation);
    class CopyEdit {
        constructor(newUri, oldUri, options) {
            this.newUri = newUri;
            this.oldUri = oldUri;
            this.options = options;
            this.type = 'copy';
        }
    }
    let CopyOperation = class CopyOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService, _instaService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
            this._instaService = _instaService;
        }
        get uris() {
            return this._edits.map(edit => [edit.newUri, edit.oldUri]).flat();
        }
        async perform(token) {
            // (1) create copy operations, remove noops
            const copies = [];
            for (const edit of this._edits) {
                //check: not overwriting, but ignoring, and the target file exists
                const skip = edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri);
                if (!skip) {
                    copies.push({ file: { source: edit.oldUri, target: edit.newUri }, overwrite: edit.options.overwrite });
                }
            }
            if (copies.length === 0) {
                return new Noop();
            }
            // (2) perform the actual copy and use the return stats to build undo edits
            const stats = await this._workingCopyFileService.copy(copies, token, this._undoRedoInfo);
            const undoes = [];
            for (let i = 0; i < stats.length; i++) {
                const stat = stats[i];
                const edit = this._edits[i];
                undoes.push(new DeleteEdit(stat.resource, Object.assign({ recursive: true, folder: this._edits[i].options.folder || stat.isDirectory }, edit.options), false));
            }
            return this._instaService.createInstance(DeleteOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(copy ${this._edits.map(edit => `${edit.oldUri} to ${edit.newUri}`).join(', ')})`;
        }
    };
    CopyOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService),
        __param(4, instantiation_1.IInstantiationService)
    ], CopyOperation);
    class CreateEdit {
        constructor(newUri, options, contents) {
            this.newUri = newUri;
            this.options = options;
            this.contents = contents;
            this.type = 'create';
        }
    }
    let CreateOperation = class CreateOperation {
        constructor(_edits, _undoRedoInfo, _fileService, _workingCopyFileService, _instaService, _textFileService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._fileService = _fileService;
            this._workingCopyFileService = _workingCopyFileService;
            this._instaService = _instaService;
            this._textFileService = _textFileService;
        }
        get uris() {
            return this._edits.map(edit => edit.newUri);
        }
        async perform(token) {
            const folderCreates = [];
            const fileCreates = [];
            const undoes = [];
            for (const edit of this._edits) {
                if (edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                    continue; // not overwriting, but ignoring, and the target file exists
                }
                if (edit.options.folder) {
                    folderCreates.push({ resource: edit.newUri });
                }
                else {
                    // If the contents are part of the edit they include the encoding, thus use them. Otherwise get the encoding for a new empty file.
                    const encodedReadable = typeof edit.contents !== 'undefined' ? edit.contents : await this._textFileService.getEncodedReadable(edit.newUri);
                    fileCreates.push({ resource: edit.newUri, contents: encodedReadable, overwrite: edit.options.overwrite });
                }
                undoes.push(new DeleteEdit(edit.newUri, edit.options, !edit.options.folder && !edit.contents));
            }
            if (folderCreates.length === 0 && fileCreates.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.createFolder(folderCreates, token, this._undoRedoInfo);
            await this._workingCopyFileService.create(fileCreates, token, this._undoRedoInfo);
            return this._instaService.createInstance(DeleteOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(create ${this._edits.map(edit => { var _a; return edit.options.folder ? `folder ${edit.newUri}` : `file ${edit.newUri} with ${((_a = edit.contents) === null || _a === void 0 ? void 0 : _a.byteLength) || 0} bytes`; }).join(', ')})`;
        }
    };
    CreateOperation = __decorate([
        __param(2, files_1.IFileService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, textfiles_1.ITextFileService)
    ], CreateOperation);
    class DeleteEdit {
        constructor(oldUri, options, undoesCreate) {
            this.oldUri = oldUri;
            this.options = options;
            this.undoesCreate = undoesCreate;
            this.type = 'delete';
        }
    }
    let DeleteOperation = class DeleteOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService, _configurationService, _instaService, _logService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
            this._configurationService = _configurationService;
            this._instaService = _instaService;
            this._logService = _logService;
        }
        get uris() {
            return this._edits.map(edit => edit.oldUri);
        }
        async perform(token) {
            // delete file
            const deletes = [];
            const undoes = [];
            for (const edit of this._edits) {
                let fileStat;
                try {
                    fileStat = await this._fileService.resolve(edit.oldUri, { resolveMetadata: true });
                }
                catch (err) {
                    if (!edit.options.ignoreIfNotExists) {
                        throw new Error(`${edit.oldUri} does not exist and can not be deleted`);
                    }
                    continue;
                }
                deletes.push({
                    resource: edit.oldUri,
                    recursive: edit.options.recursive,
                    useTrash: !edit.options.skipTrashBin && this._fileService.hasCapability(edit.oldUri, 4096 /* FileSystemProviderCapabilities.Trash */) && this._configurationService.getValue('files.enableTrash')
                });
                // read file contents for undo operation. when a file is too large it won't be restored
                let fileContent;
                if (!edit.undoesCreate && !edit.options.folder && !(typeof edit.options.maxSize === 'number' && fileStat.size > edit.options.maxSize)) {
                    try {
                        fileContent = await this._fileService.readFile(edit.oldUri);
                    }
                    catch (err) {
                        this._logService.critical(err);
                    }
                }
                if (fileContent !== undefined) {
                    undoes.push(new CreateEdit(edit.oldUri, edit.options, fileContent.value));
                }
            }
            if (deletes.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.delete(deletes, token, this._undoRedoInfo);
            if (undoes.length === 0) {
                return new Noop();
            }
            return this._instaService.createInstance(CreateOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(delete ${this._edits.map(edit => edit.oldUri).join(', ')})`;
        }
    };
    DeleteOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, log_1.ILogService)
    ], DeleteOperation);
    class FileUndoRedoElement {
        constructor(label, code, operations, confirmBeforeUndo) {
            this.label = label;
            this.code = code;
            this.operations = operations;
            this.confirmBeforeUndo = confirmBeforeUndo;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this.resources = operations.map(op => op.uris).flat();
        }
        async undo() {
            await this._reverse();
        }
        async redo() {
            await this._reverse();
        }
        async _reverse() {
            for (let i = 0; i < this.operations.length; i++) {
                const op = this.operations[i];
                const undo = await op.perform(cancellation_1.CancellationToken.None);
                this.operations[i] = undo;
            }
        }
        toString() {
            return this.operations.map(op => String(op)).join(', ');
        }
    }
    let BulkFileEdits = class BulkFileEdits {
        constructor(_label, _code, _undoRedoGroup, _undoRedoSource, _confirmBeforeUndo, _progress, _token, _edits, _instaService, _undoRedoService) {
            this._label = _label;
            this._code = _code;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._confirmBeforeUndo = _confirmBeforeUndo;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._instaService = _instaService;
            this._undoRedoService = _undoRedoService;
        }
        async apply() {
            var _a, _b, _c, _d, _e, _f;
            const undoOperations = [];
            const undoRedoInfo = { undoRedoGroupId: this._undoRedoGroup.id };
            const edits = [];
            for (const edit of this._edits) {
                if (edit.newResource && edit.oldResource && !((_a = edit.options) === null || _a === void 0 ? void 0 : _a.copy)) {
                    edits.push(new RenameEdit(edit.newResource, edit.oldResource, (_b = edit.options) !== null && _b !== void 0 ? _b : {}));
                }
                else if (edit.newResource && edit.oldResource && ((_c = edit.options) === null || _c === void 0 ? void 0 : _c.copy)) {
                    edits.push(new CopyEdit(edit.newResource, edit.oldResource, (_d = edit.options) !== null && _d !== void 0 ? _d : {}));
                }
                else if (!edit.newResource && edit.oldResource) {
                    edits.push(new DeleteEdit(edit.oldResource, (_e = edit.options) !== null && _e !== void 0 ? _e : {}, false));
                }
                else if (edit.newResource && !edit.oldResource) {
                    edits.push(new CreateEdit(edit.newResource, (_f = edit.options) !== null && _f !== void 0 ? _f : {}, undefined));
                }
            }
            if (edits.length === 0) {
                return [];
            }
            const groups = [];
            groups[0] = [edits[0]];
            for (let i = 1; i < edits.length; i++) {
                const edit = edits[i];
                const lastGroup = (0, arrays_1.tail)(groups);
                if (lastGroup[0].type === edit.type) {
                    lastGroup.push(edit);
                }
                else {
                    groups.push([edit]);
                }
            }
            for (let group of groups) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                let op;
                switch (group[0].type) {
                    case 'rename':
                        op = this._instaService.createInstance(RenameOperation, group, undoRedoInfo);
                        break;
                    case 'copy':
                        op = this._instaService.createInstance(CopyOperation, group, undoRedoInfo);
                        break;
                    case 'delete':
                        op = this._instaService.createInstance(DeleteOperation, group, undoRedoInfo);
                        break;
                    case 'create':
                        op = this._instaService.createInstance(CreateOperation, group, undoRedoInfo);
                        break;
                }
                if (op) {
                    const undoOp = await op.perform(this._token);
                    undoOperations.push(undoOp);
                }
                this._progress.report(undefined);
            }
            const undoRedoElement = new FileUndoRedoElement(this._label, this._code, undoOperations, this._confirmBeforeUndo);
            this._undoRedoService.pushElement(undoRedoElement, this._undoRedoGroup, this._undoRedoSource);
            return undoRedoElement.resources;
        }
    };
    BulkFileEdits = __decorate([
        __param(8, instantiation_1.IInstantiationService),
        __param(9, undoRedo_1.IUndoRedoService)
    ], BulkFileEdits);
    exports.BulkFileEdits = BulkFileEdits;
});
//# sourceMappingURL=bulkFileEdits.js.map