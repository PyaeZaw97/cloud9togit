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
define(["require", "exports", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/explorerModel", "vs/platform/files/common/files", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/browser/services/bulkEditService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/progress/common/progress", "vs/base/common/cancellation", "vs/base/common/async", "vs/workbench/services/host/browser/host"], function (require, exports, event_1, workspace_1, lifecycle_1, explorerModel_1, files_1, resources_1, configuration_1, clipboardService_1, editorService_1, uriIdentity_1, bulkEditService_1, undoRedo_1, progress_1, cancellation_1, async_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerService = exports.UNDO_REDO_SOURCE = void 0;
    exports.UNDO_REDO_SOURCE = new undoRedo_1.UndoRedoSource();
    let ExplorerService = class ExplorerService {
        constructor(fileService, configurationService, contextService, clipboardService, editorService, uriIdentityService, bulkEditService, progressService, hostService) {
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.clipboardService = clipboardService;
            this.editorService = editorService;
            this.uriIdentityService = uriIdentityService;
            this.bulkEditService = bulkEditService;
            this.progressService = progressService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.fileChangeEvents = [];
            this.config = this.configurationService.getValue('explorer');
            this.model = new explorerModel_1.ExplorerModel(this.contextService, this.uriIdentityService, this.fileService, this.configurationService);
            this.disposables.add(this.model);
            this.disposables.add(this.fileService.onDidRunOperation(e => this.onDidRunOperation(e)));
            this.onFileChangesScheduler = new async_1.RunOnceScheduler(async () => {
                const events = this.fileChangeEvents;
                this.fileChangeEvents = [];
                // Filter to the ones we care
                const types = [2 /* FileChangeType.DELETED */];
                if (this.config.sortOrder === "modified" /* SortOrder.Modified */) {
                    types.push(0 /* FileChangeType.UPDATED */);
                }
                let shouldRefresh = false;
                // For DELETED and UPDATED events go through the explorer model and check if any of the items got affected
                this.roots.forEach(r => {
                    if (this.view && !shouldRefresh) {
                        shouldRefresh = doesFileEventAffect(r, this.view, events, types);
                    }
                });
                // For ADDED events we need to go through all the events and check if the explorer is already aware of some of them
                // Or if they affect not yet resolved parts of the explorer. If that is the case we will not refresh.
                events.forEach(e => {
                    if (!shouldRefresh) {
                        for (const resource of e.rawAdded) {
                            const parent = this.model.findClosest((0, resources_1.dirname)(resource));
                            // Parent of the added resource is resolved and the explorer model is not aware of the added resource - we need to refresh
                            if (parent && !parent.getChild((0, resources_1.basename)(resource))) {
                                shouldRefresh = true;
                                break;
                            }
                        }
                    }
                });
                if (shouldRefresh) {
                    await this.refresh(false);
                }
            }, ExplorerService.EXPLORER_FILE_CHANGES_REACT_DELAY);
            this.disposables.add(this.fileService.onDidFilesChange(e => {
                this.fileChangeEvents.push(e);
                // Don't mess with the file tree while in the process of editing. #112293
                if (this.editable) {
                    return;
                }
                if (!this.onFileChangesScheduler.isScheduled()) {
                    this.onFileChangesScheduler.schedule();
                }
            }));
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue(), e)));
            this.disposables.add(event_1.Event.any(this.fileService.onDidChangeFileSystemProviderRegistrations, this.fileService.onDidChangeFileSystemProviderCapabilities)(async (e) => {
                let affected = false;
                this.model.roots.forEach(r => {
                    if (r.resource.scheme === e.scheme) {
                        affected = true;
                        r.forgetChildren();
                    }
                });
                if (affected) {
                    if (this.view) {
                        await this.view.setTreeInput();
                    }
                }
            }));
            this.disposables.add(this.model.onDidChangeRoots(() => {
                if (this.view) {
                    this.view.setTreeInput();
                }
            }));
            // Refresh explorer when window gets focus to compensate for missing file events #126817
            const skipRefreshExplorerOnWindowFocus = this.configurationService.getValue('skipRefreshExplorerOnWindowFocus');
            this.disposables.add(hostService.onDidChangeFocus(hasFocus => {
                if (!skipRefreshExplorerOnWindowFocus && hasFocus) {
                    this.refresh(false);
                }
            }));
        }
        get roots() {
            return this.model.roots;
        }
        get sortOrderConfiguration() {
            return {
                sortOrder: this.config.sortOrder,
                lexicographicOptions: this.config.sortOrderLexicographicOptions,
            };
        }
        registerView(contextProvider) {
            this.view = contextProvider;
        }
        getContext(respectMultiSelection) {
            if (!this.view) {
                return [];
            }
            const items = new Set(this.view.getContext(respectMultiSelection));
            items.forEach(item => {
                var _a;
                if (((_a = this.view) === null || _a === void 0 ? void 0 : _a.isItemCollapsed(item)) && item.nestedChildren) {
                    for (const child of item.nestedChildren) {
                        items.add(child);
                    }
                }
            });
            return [...items];
        }
        async applyBulkEdit(edit, options) {
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const promise = this.progressService.withProgress({
                location: options.progressLocation || 10 /* ProgressLocation.Window */,
                title: options.progressLabel,
                cancellable: edit.length > 1,
                delay: 500,
            }, async (progress) => {
                await this.bulkEditService.apply(edit, {
                    undoRedoSource: exports.UNDO_REDO_SOURCE,
                    label: options.undoLabel,
                    code: 'undoredo.explorerOperation',
                    progress,
                    token: cancellationTokenSource.token,
                    confirmBeforeUndo: options.confirmBeforeUndo
                });
            }, () => cancellationTokenSource.cancel());
            await this.progressService.withProgress({ location: 1 /* ProgressLocation.Explorer */, delay: 500 }, () => promise);
            cancellationTokenSource.dispose();
        }
        hasViewFocus() {
            return !!this.view && this.view.hasFocus();
        }
        // IExplorerService methods
        findClosest(resource) {
            return this.model.findClosest(resource);
        }
        findClosestRoot(resource) {
            const parentRoots = this.model.roots.filter(r => this.uriIdentityService.extUri.isEqualOrParent(resource, r.resource))
                .sort((first, second) => second.resource.path.length - first.resource.path.length);
            return parentRoots.length ? parentRoots[0] : null;
        }
        async setEditable(stat, data) {
            if (!this.view) {
                return;
            }
            if (!data) {
                this.editable = undefined;
            }
            else {
                this.editable = { stat, data };
            }
            const isEditing = this.isEditable(stat);
            await this.view.setEditable(stat, isEditing);
            if (!this.editable && this.fileChangeEvents.length && !this.onFileChangesScheduler.isScheduled()) {
                this.onFileChangesScheduler.schedule();
            }
        }
        async setToCopy(items, cut) {
            var _a;
            const previouslyCutItems = this.cutItems;
            this.cutItems = cut ? items : undefined;
            await this.clipboardService.writeResources(items.map(s => s.resource));
            (_a = this.view) === null || _a === void 0 ? void 0 : _a.itemsCopied(items, cut, previouslyCutItems);
        }
        isCut(item) {
            return !!this.cutItems && this.cutItems.some(i => this.uriIdentityService.extUri.isEqual(i.resource, item.resource));
        }
        getEditable() {
            return this.editable;
        }
        getEditableData(stat) {
            return this.editable && this.editable.stat === stat ? this.editable.data : undefined;
        }
        isEditable(stat) {
            return !!this.editable && (this.editable.stat === stat || !stat);
        }
        async select(resource, reveal) {
            if (!this.view) {
                return;
            }
            const fileStat = this.findClosest(resource);
            if (fileStat) {
                await this.view.selectResource(fileStat.resource, reveal);
                return Promise.resolve(undefined);
            }
            // Stat needs to be resolved first and then revealed
            const options = { resolveTo: [resource], resolveMetadata: this.config.sortOrder === "modified" /* SortOrder.Modified */ };
            const root = this.findClosestRoot(resource);
            if (!root) {
                return undefined;
            }
            try {
                const stat = await this.fileService.resolve(root.resource, options);
                // Convert to model
                const modelStat = explorerModel_1.ExplorerItem.create(this.fileService, this.configurationService, stat, undefined, options.resolveTo);
                // Update Input with disk Stat
                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, root);
                const item = root.find(resource);
                await this.view.refresh(true, root);
                // Select and Reveal
                await this.view.selectResource(item ? item.resource : undefined, reveal);
            }
            catch (error) {
                root.isError = true;
                await this.view.refresh(false, root);
            }
        }
        async refresh(reveal = true) {
            var _a;
            this.model.roots.forEach(r => r.forgetChildren());
            if (this.view) {
                await this.view.refresh(true);
                const resource = (_a = this.editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.resource;
                const autoReveal = this.configurationService.getValue().explorer.autoReveal;
                if (reveal && resource && autoReveal) {
                    // We did a top level refresh, reveal the active file #67118
                    this.select(resource, autoReveal);
                }
            }
        }
        // File events
        async onDidRunOperation(e) {
            // When nesting, changes to one file in a folder may impact the rendered structure
            // of all the folder's immediate children, thus a recursive refresh is needed.
            // Ideally the tree would be able to recusively refresh just one level but that does not yet exist.
            const shouldDeepRefresh = this.config.fileNesting.enabled;
            // Add
            if (e.isOperation(0 /* FileOperation.CREATE */) || e.isOperation(3 /* FileOperation.COPY */)) {
                const addedElement = e.target;
                const parentResource = (0, resources_1.dirname)(addedElement.resource);
                const parents = this.model.findAll(parentResource);
                if (parents.length) {
                    // Add the new file to its parent (Model)
                    await Promise.all(parents.map(async (p) => {
                        var _a;
                        // We have to check if the parent is resolved #29177
                        const resolveMetadata = this.config.sortOrder === `modified`;
                        if (!p.isDirectoryResolved) {
                            const stat = await this.fileService.resolve(p.resource, { resolveMetadata });
                            if (stat) {
                                const modelStat = explorerModel_1.ExplorerItem.create(this.fileService, this.configurationService, stat, p.parent);
                                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, p);
                            }
                        }
                        const childElement = explorerModel_1.ExplorerItem.create(this.fileService, this.configurationService, addedElement, p.parent);
                        // Make sure to remove any previous version of the file if any
                        p.removeChild(childElement);
                        p.addChild(childElement);
                        // Refresh the Parent (View)
                        await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(shouldDeepRefresh, p));
                    }));
                }
            }
            // Move (including Rename)
            else if (e.isOperation(2 /* FileOperation.MOVE */)) {
                const oldResource = e.resource;
                const newElement = e.target;
                const oldParentResource = (0, resources_1.dirname)(oldResource);
                const newParentResource = (0, resources_1.dirname)(newElement.resource);
                const modelElements = this.model.findAll(oldResource);
                const sameParentMove = modelElements.every(e => !e.nestedParent) && this.uriIdentityService.extUri.isEqual(oldParentResource, newParentResource);
                // Handle Rename
                if (sameParentMove) {
                    await Promise.all(modelElements.map(async (modelElement) => {
                        var _a;
                        // Rename File (Model)
                        modelElement.rename(newElement);
                        await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(shouldDeepRefresh, modelElement.parent));
                    }));
                }
                // Handle Move
                else {
                    const newParents = this.model.findAll(newParentResource);
                    if (newParents.length && modelElements.length) {
                        // Move in Model
                        await Promise.all(modelElements.map(async (modelElement, index) => {
                            var _a, _b, _c;
                            const oldParent = modelElement.parent;
                            const oldNestedParent = modelElement.nestedParent;
                            modelElement.move(newParents[index]);
                            if (oldNestedParent) {
                                await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(false, oldNestedParent));
                            }
                            await ((_b = this.view) === null || _b === void 0 ? void 0 : _b.refresh(false, oldParent));
                            await ((_c = this.view) === null || _c === void 0 ? void 0 : _c.refresh(shouldDeepRefresh, newParents[index]));
                        }));
                    }
                }
            }
            // Delete
            else if (e.isOperation(1 /* FileOperation.DELETE */)) {
                const modelElements = this.model.findAll(e.resource);
                await Promise.all(modelElements.map(async (modelElement) => {
                    var _a, _b;
                    if (modelElement.parent) {
                        // Remove Element from Parent (Model)
                        const parent = modelElement.parent;
                        parent.removeChild(modelElement);
                        const oldNestedParent = modelElement.nestedParent;
                        if (oldNestedParent) {
                            oldNestedParent.removeChild(modelElement);
                            await ((_a = this.view) === null || _a === void 0 ? void 0 : _a.refresh(false, oldNestedParent));
                        }
                        // Refresh Parent (View)
                        await ((_b = this.view) === null || _b === void 0 ? void 0 : _b.refresh(shouldDeepRefresh, parent));
                    }
                }));
            }
        }
        async onConfigurationUpdated(configuration, event) {
            var _a, _b;
            let shouldRefresh = false;
            if (event === null || event === void 0 ? void 0 : event.affectedKeys.some(x => x.startsWith('explorer.fileNesting.'))) {
                shouldRefresh = true;
            }
            const configSortOrder = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.explorer) === null || _a === void 0 ? void 0 : _a.sortOrder) || "default" /* SortOrder.Default */;
            if (this.config.sortOrder !== configSortOrder) {
                shouldRefresh = this.config.sortOrder !== undefined;
            }
            const configLexicographicOptions = ((_b = configuration === null || configuration === void 0 ? void 0 : configuration.explorer) === null || _b === void 0 ? void 0 : _b.sortOrderLexicographicOptions) || "default" /* LexicographicOptions.Default */;
            if (this.config.sortOrderLexicographicOptions !== configLexicographicOptions) {
                shouldRefresh = shouldRefresh || this.config.sortOrderLexicographicOptions !== undefined;
            }
            this.config = configuration.explorer;
            if (shouldRefresh) {
                await this.refresh();
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ExplorerService.EXPLORER_FILE_CHANGES_REACT_DELAY = 500; // delay in ms to react to file changes to give our internal events a chance to react first
    ExplorerService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, editorService_1.IEditorService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, bulkEditService_1.IBulkEditService),
        __param(7, progress_1.IProgressService),
        __param(8, host_1.IHostService)
    ], ExplorerService);
    exports.ExplorerService = ExplorerService;
    function doesFileEventAffect(item, view, events, types) {
        for (let [_name, child] of item.children) {
            if (view.isItemVisible(child)) {
                if (events.some(e => e.contains(child.resource, ...types))) {
                    return true;
                }
                if (child.isDirectory && child.isDirectoryResolved) {
                    if (doesFileEventAffect(child, view, events, types)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
});
//# sourceMappingURL=explorerService.js.map