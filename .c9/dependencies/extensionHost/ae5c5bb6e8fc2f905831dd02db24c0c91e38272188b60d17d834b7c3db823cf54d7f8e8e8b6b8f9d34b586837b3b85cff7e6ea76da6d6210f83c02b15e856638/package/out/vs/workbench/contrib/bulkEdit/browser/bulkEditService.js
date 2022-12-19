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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/bulkEdit/browser/bulkTextEdits", "vs/workbench/contrib/bulkEdit/browser/bulkFileEdits", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/linkedList", "vs/base/common/cancellation", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/base/common/map", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configuration"], function (require, exports, nls_1, lifecycle_1, editorBrowser_1, bulkEditService_1, extensions_1, log_1, progress_1, editorService_1, instantiation_1, bulkTextEdits_1, bulkFileEdits_1, bulkCellEdits_1, undoRedo_1, linkedList_1, cancellation_1, lifecycle_2, dialogs_1, map_1, workingCopyService_1, platform_1, configurationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditService = void 0;
    let BulkEdit = class BulkEdit {
        constructor(_label, _code, _editor, _progress, _token, _edits, _undoRedoGroup, _undoRedoSource, _confirmBeforeUndo, _instaService, _logService) {
            this._label = _label;
            this._code = _code;
            this._editor = _editor;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._confirmBeforeUndo = _confirmBeforeUndo;
            this._instaService = _instaService;
            this._logService = _logService;
        }
        ariaMessage() {
            var _a;
            let otherResources = new map_1.ResourceMap();
            let textEditResources = new map_1.ResourceMap();
            let textEditCount = 0;
            for (let edit of this._edits) {
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    textEditCount += 1;
                    textEditResources.set(edit.resource, true);
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    otherResources.set((_a = edit.oldResource) !== null && _a !== void 0 ? _a : edit.newResource, true);
                }
            }
            if (this._edits.length === 0) {
                return (0, nls_1.localize)('summary.0', "Made no edits");
            }
            else if (otherResources.size === 0) {
                if (textEditCount > 1 && textEditResources.size > 1) {
                    return (0, nls_1.localize)('summary.nm', "Made {0} text edits in {1} files", textEditCount, textEditResources.size);
                }
                else {
                    return (0, nls_1.localize)('summary.n0', "Made {0} text edits in one file", textEditCount);
                }
            }
            else {
                return (0, nls_1.localize)('summary.textFiles', "Made {0} text edits in {1} files, also created or deleted {2} files", textEditCount, textEditResources.size, otherResources.size);
            }
        }
        async perform() {
            if (this._edits.length === 0) {
                return [];
            }
            const ranges = [1];
            for (let i = 1; i < this._edits.length; i++) {
                if (Object.getPrototypeOf(this._edits[i - 1]) === Object.getPrototypeOf(this._edits[i])) {
                    ranges[ranges.length - 1]++;
                }
                else {
                    ranges.push(1);
                }
            }
            // Show infinte progress when there is only 1 item since we do not know how long it takes
            const increment = this._edits.length > 1 ? 0 : undefined;
            this._progress.report({ increment, total: 100 });
            // Increment by percentage points since progress API expects that
            const progress = { report: _ => this._progress.report({ increment: 100 / this._edits.length }) };
            const resources = [];
            let index = 0;
            for (let range of ranges) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                const group = this._edits.slice(index, index + range);
                if (group[0] instanceof bulkEditService_1.ResourceFileEdit) {
                    resources.push(await this._performFileEdits(group, this._undoRedoGroup, this._undoRedoSource, this._confirmBeforeUndo, progress));
                }
                else if (group[0] instanceof bulkEditService_1.ResourceTextEdit) {
                    resources.push(await this._performTextEdits(group, this._undoRedoGroup, this._undoRedoSource, progress));
                }
                else if (group[0] instanceof bulkCellEdits_1.ResourceNotebookCellEdit) {
                    resources.push(await this._performCellEdits(group, this._undoRedoGroup, this._undoRedoSource, progress));
                }
                else {
                    console.log('UNKNOWN EDIT');
                }
                index = index + range;
            }
            return resources.flat();
        }
        async _performFileEdits(edits, undoRedoGroup, undoRedoSource, confirmBeforeUndo, progress) {
            this._logService.debug('_performFileEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkFileEdits_1.BulkFileEdits, this._label || (0, nls_1.localize)('workspaceEdit', "Workspace Edit"), this._code || 'undoredo.workspaceEdit', undoRedoGroup, undoRedoSource, confirmBeforeUndo, progress, this._token, edits);
            return await model.apply();
        }
        async _performTextEdits(edits, undoRedoGroup, undoRedoSource, progress) {
            this._logService.debug('_performTextEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkTextEdits_1.BulkTextEdits, this._label || (0, nls_1.localize)('workspaceEdit', "Workspace Edit"), this._code || 'undoredo.workspaceEdit', this._editor, undoRedoGroup, undoRedoSource, progress, this._token, edits);
            return await model.apply();
        }
        async _performCellEdits(edits, undoRedoGroup, undoRedoSource, progress) {
            this._logService.debug('_performCellEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkCellEdits_1.BulkCellEdits, undoRedoGroup, undoRedoSource, progress, this._token, edits);
            return await model.apply();
        }
    };
    BulkEdit = __decorate([
        __param(9, instantiation_1.IInstantiationService),
        __param(10, log_1.ILogService)
    ], BulkEdit);
    let BulkEditService = class BulkEditService {
        constructor(_instaService, _logService, _editorService, _lifecycleService, _dialogService, _workingCopyService, _configService) {
            this._instaService = _instaService;
            this._logService = _logService;
            this._editorService = _editorService;
            this._lifecycleService = _lifecycleService;
            this._dialogService = _dialogService;
            this._workingCopyService = _workingCopyService;
            this._configService = _configService;
            this._activeUndoRedoGroups = new linkedList_1.LinkedList();
        }
        setPreviewHandler(handler) {
            this._previewHandler = handler;
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._previewHandler === handler) {
                    this._previewHandler = undefined;
                }
            });
        }
        hasPreviewHandler() {
            return Boolean(this._previewHandler);
        }
        async apply(edits, options) {
            var _a, _b;
            if (edits.length === 0) {
                return { ariaSummary: (0, nls_1.localize)('nothing', "Made no edits") };
            }
            if (this._previewHandler && ((options === null || options === void 0 ? void 0 : options.showPreview) || edits.some(value => { var _a; return (_a = value.metadata) === null || _a === void 0 ? void 0 : _a.needsConfirmation; }))) {
                edits = await this._previewHandler(edits, options);
            }
            let codeEditor = options === null || options === void 0 ? void 0 : options.editor;
            // try to find code editor
            if (!codeEditor) {
                let candidate = this._editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(candidate)) {
                    codeEditor = candidate;
                }
            }
            if (codeEditor && codeEditor.getOption(81 /* EditorOption.readOnly */)) {
                // If the code editor is readonly still allow bulk edits to be applied #68549
                codeEditor = undefined;
            }
            // undo-redo-group: if a group id is passed then try to find it
            // in the list of active edits. otherwise (or when not found)
            // create a separate undo-redo-group
            let undoRedoGroup;
            let undoRedoGroupRemove = () => { };
            if (typeof (options === null || options === void 0 ? void 0 : options.undoRedoGroupId) === 'number') {
                for (let candidate of this._activeUndoRedoGroups) {
                    if (candidate.id === options.undoRedoGroupId) {
                        undoRedoGroup = candidate;
                        break;
                    }
                }
            }
            if (!undoRedoGroup) {
                undoRedoGroup = new undoRedo_1.UndoRedoGroup();
                undoRedoGroupRemove = this._activeUndoRedoGroups.push(undoRedoGroup);
            }
            const label = (options === null || options === void 0 ? void 0 : options.quotableLabel) || (options === null || options === void 0 ? void 0 : options.label);
            const bulkEdit = this._instaService.createInstance(BulkEdit, label, options === null || options === void 0 ? void 0 : options.code, codeEditor, (_a = options === null || options === void 0 ? void 0 : options.progress) !== null && _a !== void 0 ? _a : progress_1.Progress.None, (_b = options === null || options === void 0 ? void 0 : options.token) !== null && _b !== void 0 ? _b : cancellation_1.CancellationToken.None, edits, undoRedoGroup, options === null || options === void 0 ? void 0 : options.undoRedoSource, !!(options === null || options === void 0 ? void 0 : options.confirmBeforeUndo));
            let listener;
            try {
                listener = this._lifecycleService.onBeforeShutdown(e => e.veto(this._shouldVeto(label, e.reason), 'veto.blukEditService'));
                const resources = await bulkEdit.perform();
                // when enabled (option AND setting) loop over all dirty working copies and trigger save
                // for those that were involved in this bulk edit operation.
                if ((options === null || options === void 0 ? void 0 : options.respectAutoSaveConfig) && this._configService.getValue(autoSaveSetting) === true && resources.length > 1) {
                    await this._saveAll(resources);
                }
                return { ariaSummary: bulkEdit.ariaMessage() };
            }
            catch (err) {
                // console.log('apply FAILED');
                // console.log(err);
                this._logService.error(err);
                throw err;
            }
            finally {
                listener === null || listener === void 0 ? void 0 : listener.dispose();
                undoRedoGroupRemove();
            }
        }
        async _saveAll(resources) {
            const set = new map_1.ResourceSet(resources);
            const saves = this._workingCopyService.dirtyWorkingCopies.map(async (copy) => {
                if (set.has(copy.resource)) {
                    await copy.save();
                }
            });
            const result = await Promise.allSettled(saves);
            for (const item of result) {
                if (item.status === 'rejected') {
                    this._logService.warn(item.reason);
                }
            }
        }
        async _shouldVeto(label, reason) {
            label = label || (0, nls_1.localize)('fileOperation', "File operation");
            const reasonLabel = reason === 1 /* ShutdownReason.CLOSE */ ? (0, nls_1.localize)('closeTheWindow', "Close Window") : reason === 4 /* ShutdownReason.LOAD */ ? (0, nls_1.localize)('changeWorkspace', "Change Workspace") :
                reason === 3 /* ShutdownReason.RELOAD */ ? (0, nls_1.localize)('reloadTheWindow', "Reload Window") : (0, nls_1.localize)('quit', "Quit");
            const result = await this._dialogService.confirm({
                message: (0, nls_1.localize)('areYouSureQuiteBulkEdit', "Are you sure you want to {0}? '{1}' is in progress.", reasonLabel.toLowerCase(), label),
                primaryButton: reasonLabel
            });
            return !result.confirmed;
        }
    };
    BulkEditService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, editorService_1.IEditorService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, dialogs_1.IDialogService),
        __param(5, workingCopyService_1.IWorkingCopyService),
        __param(6, configuration_1.IConfigurationService)
    ], BulkEditService);
    exports.BulkEditService = BulkEditService;
    (0, extensions_1.registerSingleton)(bulkEditService_1.IBulkEditService, BulkEditService, true);
    const autoSaveSetting = 'files.refactoring.autoSave';
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'files',
        properties: {
            [autoSaveSetting]: {
                description: (0, nls_1.localize)('refactoring.autoSave', "Controls if files that were part of a refactoring are saved automatically"),
                default: true,
                type: 'boolean'
            }
        }
    });
});
//# sourceMappingURL=bulkEditService.js.map