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
define(["require", "exports", "vs/base/common/glob", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/platform/label/common/label", "vs/base/common/network", "vs/workbench/contrib/notebook/common/notebookPerformance", "vs/platform/files/common/files", "vs/workbench/common/editor/resourceEditorInput", "vs/base/common/errors", "vs/base/common/buffer"], function (require, exports, glob, notebookService_1, resources_1, instantiation_1, dialogs_1, notebookEditorModelResolverService_1, label_1, network_1, notebookPerformance_1, files_1, resourceEditorInput_1, errors_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCompositeNotebookEditorInput = exports.NotebookEditorInput = void 0;
    let NotebookEditorInput = class NotebookEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
        constructor(resource, viewType, options, _notebookService, _notebookModelResolverService, _fileDialogService, _instantiationService, labelService, fileService) {
            super(resource, undefined, labelService, fileService);
            this.viewType = viewType;
            this.options = options;
            this._notebookService = _notebookService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._fileDialogService = _fileDialogService;
            this._instantiationService = _instantiationService;
            this._editorModelReference = null;
            this._defaultDirtyState = false;
            this._defaultDirtyState = !!options.startDirty;
            // Automatically resolve this input when the "wanted" model comes to life via
            // some other way. This happens only once per input and resolve disposes
            // this listener
            this._sideLoadedListener = _notebookService.onDidAddNotebookDocument(e => {
                if (e.viewType === this.viewType && e.uri.toString() === this.resource.toString()) {
                    this.resolve().catch(errors_1.onUnexpectedError);
                }
            });
        }
        static create(instantiationService, resource, viewType, options = {}) {
            return instantiationService.createInstance(NotebookEditorInput, resource, viewType, options);
        }
        dispose() {
            var _a;
            this._sideLoadedListener.dispose();
            (_a = this._editorModelReference) === null || _a === void 0 ? void 0 : _a.dispose();
            this._editorModelReference = null;
            super.dispose();
        }
        get typeId() {
            return NotebookEditorInput.ID;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            let capabilities = 0 /* EditorInputCapabilities.None */;
            if (this.resource.scheme === network_1.Schemas.untitled) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            if (this._editorModelReference) {
                if (this._editorModelReference.object.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.fileService.hasCapability(this.resource, 2048 /* FileSystemProviderCapabilities.Readonly */)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            var _a;
            if (!this.hasCapability(4 /* EditorInputCapabilities.Untitled */) || ((_a = this._editorModelReference) === null || _a === void 0 ? void 0 : _a.object.hasAssociatedFilePath())) {
                return super.getDescription(verbosity);
            }
            return undefined; // no description for untitled notebooks without associated file path
        }
        isDirty() {
            if (!this._editorModelReference) {
                return this._defaultDirtyState;
            }
            return this._editorModelReference.object.isDirty();
        }
        async save(group, options) {
            if (this._editorModelReference) {
                if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    return this.saveAs(group, options);
                }
                else {
                    await this._editorModelReference.object.save(options);
                }
                return this;
            }
            return undefined;
        }
        async saveAs(group, options) {
            if (!this._editorModelReference) {
                return undefined;
            }
            const provider = this._notebookService.getContributedNotebookType(this.viewType);
            if (!provider) {
                return undefined;
            }
            const pathCandidate = this.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? await this._suggestName(provider, this.labelService.getUriBasenameLabel(this.resource)) : this._editorModelReference.object.resource;
            let target;
            if (this._editorModelReference.object.hasAssociatedFilePath()) {
                target = pathCandidate;
            }
            else {
                target = await this._fileDialogService.pickFileToSave(pathCandidate, options === null || options === void 0 ? void 0 : options.availableFileSystems);
                if (!target) {
                    return undefined; // save cancelled
                }
            }
            if (!provider.matches(target)) {
                const patterns = provider.selectors.map(pattern => {
                    if (typeof pattern === 'string') {
                        return pattern;
                    }
                    if (glob.isRelativePattern(pattern)) {
                        return `${pattern} (base ${pattern.base})`;
                    }
                    if (pattern.exclude) {
                        return `${pattern.include} (exclude: ${pattern.exclude})`;
                    }
                    else {
                        return `${pattern.include}`;
                    }
                }).join(', ');
                throw new Error(`File name ${target} is not supported by ${provider.providerDisplayName}.\n\nPlease make sure the file name matches following patterns:\n${patterns}`);
            }
            return await this._editorModelReference.object.saveAs(target);
        }
        async _suggestName(provider, suggestedFilename) {
            // guess file extensions
            const firstSelector = provider.selectors[0];
            let selectorStr = firstSelector && typeof firstSelector === 'string' ? firstSelector : undefined;
            if (!selectorStr && firstSelector) {
                const include = firstSelector.include;
                if (typeof include === 'string') {
                    selectorStr = include;
                }
            }
            if (selectorStr) {
                const matches = /^\*\.([A-Za-z_-]*)$/.exec(selectorStr);
                if (matches && matches.length > 1) {
                    const fileExt = matches[1];
                    if (!suggestedFilename.endsWith(fileExt)) {
                        return (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), suggestedFilename + '.' + fileExt);
                    }
                }
            }
            return (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), suggestedFilename);
        }
        // called when users rename a notebook document
        async rename(group, target) {
            if (this._editorModelReference) {
                const contributedNotebookProviders = this._notebookService.getContributedNotebookTypes(target);
                if (contributedNotebookProviders.find(provider => provider.id === this._editorModelReference.object.viewType)) {
                    return this._move(group, target);
                }
            }
            return undefined;
        }
        _move(_group, newResource) {
            const editorInput = NotebookEditorInput.create(this._instantiationService, newResource, this.viewType);
            return { editor: editorInput };
        }
        async revert(_group, options) {
            if (this._editorModelReference && this._editorModelReference.object.isDirty()) {
                await this._editorModelReference.object.revert(options);
            }
        }
        async resolve() {
            if (!await this._notebookService.canResolve(this.viewType)) {
                return null;
            }
            (0, notebookPerformance_1.mark)(this.resource, 'extensionActivated');
            // we are now loading the notebook and don't need to listen to
            // "other" loading anymore
            this._sideLoadedListener.dispose();
            if (!this._editorModelReference) {
                const ref = await this._notebookModelResolverService.resolve(this.resource, this.viewType);
                if (this._editorModelReference) {
                    // Re-entrant, double resolve happened. Dispose the addition references and proceed
                    // with the truth.
                    ref.dispose();
                    return this._editorModelReference.object;
                }
                this._editorModelReference = ref;
                if (this.isDisposed()) {
                    this._editorModelReference.dispose();
                    this._editorModelReference = null;
                    return null;
                }
                this._register(this._editorModelReference.object.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                this._register(this._editorModelReference.object.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
                if (this._editorModelReference.object.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
            }
            else {
                this._editorModelReference.object.load();
            }
            if (this.options._backupId) {
                const info = await this._notebookService.withNotebookDataProvider(this._editorModelReference.object.notebook.viewType);
                if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                    throw new Error('CANNOT open file notebook with this provider');
                }
                const data = await info.serializer.dataToNotebook(buffer_1.VSBuffer.fromString(JSON.stringify({ __webview_backup: this.options._backupId })));
                this._editorModelReference.object.notebook.applyEdits([
                    {
                        editType: 1 /* CellEditType.Replace */,
                        index: 0,
                        count: this._editorModelReference.object.notebook.length,
                        cells: data.cells
                    }
                ], true, undefined, () => undefined, undefined, false);
                if (this.options._workingCopy) {
                    this.options._backupId = undefined;
                    this.options._workingCopy = undefined;
                    this.options.startDirty = undefined;
                }
            }
            return this._editorModelReference.object;
        }
        toUntyped() {
            return {
                resource: this.preferredResource,
                options: {
                    override: this.viewType
                }
            };
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof NotebookEditorInput) {
                return this.viewType === otherInput.viewType && (0, resources_1.isEqual)(this.resource, otherInput.resource);
            }
            return false;
        }
    };
    NotebookEditorInput.ID = 'workbench.input.notebook';
    NotebookEditorInput = __decorate([
        __param(3, notebookService_1.INotebookService),
        __param(4, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(5, dialogs_1.IFileDialogService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, label_1.ILabelService),
        __param(8, files_1.IFileService)
    ], NotebookEditorInput);
    exports.NotebookEditorInput = NotebookEditorInput;
    function isCompositeNotebookEditorInput(thing) {
        return !!thing
            && typeof thing === 'object'
            && Array.isArray(thing.editorInputs)
            && (thing.editorInputs.every(input => input instanceof NotebookEditorInput));
    }
    exports.isCompositeNotebookEditorInput = isCompositeNotebookEditorInput;
});
//# sourceMappingURL=notebookEditorInput.js.map