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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/editor/common/services/resolverService", "vs/workbench/contrib/files/common/files", "vs/platform/label/common/label", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/event", "vs/base/common/network", "vs/editor/common/model/textModel", "vs/workbench/services/path/common/pathService"], function (require, exports, editor_1, textResourceEditorInput_1, binaryEditorModel_1, files_1, textfiles_1, instantiation_1, lifecycle_1, resolverService_1, files_2, label_1, filesConfigurationService_1, editorService_1, resources_1, event_1, network_1, textModel_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileEditorInput = void 0;
    var ForceOpenAs;
    (function (ForceOpenAs) {
        ForceOpenAs[ForceOpenAs["None"] = 0] = "None";
        ForceOpenAs[ForceOpenAs["Text"] = 1] = "Text";
        ForceOpenAs[ForceOpenAs["Binary"] = 2] = "Binary";
    })(ForceOpenAs || (ForceOpenAs = {}));
    /**
     * A file editor input is the input type for the file editor of file system resources.
     */
    let FileEditorInput = class FileEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        constructor(resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService, textFileService, textModelResolverService, labelService, fileService, filesConfigurationService, editorService, pathService) {
            super(resource, preferredResource, editorService, textFileService, labelService, fileService);
            this.instantiationService = instantiationService;
            this.textModelResolverService = textModelResolverService;
            this.filesConfigurationService = filesConfigurationService;
            this.pathService = pathService;
            this.forceOpenAs = 0 /* ForceOpenAs.None */;
            this.model = undefined;
            this.cachedTextFileModelReference = undefined;
            this.modelListeners = this._register(new lifecycle_1.DisposableStore());
            this.model = this.textFileService.files.get(resource);
            if (preferredName) {
                this.setPreferredName(preferredName);
            }
            if (preferredDescription) {
                this.setPreferredDescription(preferredDescription);
            }
            if (preferredEncoding) {
                this.setPreferredEncoding(preferredEncoding);
            }
            if (preferredLanguageId) {
                this.setPreferredLanguageId(preferredLanguageId);
            }
            if (typeof preferredContents === 'string') {
                this.setPreferredContents(preferredContents);
            }
            // Attach to model that matches our resource once created
            this._register(this.textFileService.files.onDidCreate(model => this.onDidCreateTextFileModel(model)));
            // If a file model already exists, make sure to wire it in
            if (this.model) {
                this.registerModelListeners(this.model);
            }
        }
        get typeId() {
            return files_2.FILE_EDITOR_INPUT_ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        get capabilities() {
            let capabilities = 32 /* EditorInputCapabilities.CanSplitInGroup */;
            if (this.model) {
                if (this.model.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.fileService.hasProvider(this.resource)) {
                    if (this.fileService.hasCapability(this.resource, 2048 /* FileSystemProviderCapabilities.Readonly */)) {
                        capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                    }
                }
                else {
                    capabilities |= 4 /* EditorInputCapabilities.Untitled */;
                }
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        onDidCreateTextFileModel(model) {
            // Once the text file model is created, we keep it inside
            // the input to be able to implement some methods properly
            if ((0, resources_1.isEqual)(model.resource, this.resource)) {
                this.model = model;
                this.registerModelListeners(model);
            }
        }
        registerModelListeners(model) {
            // Clear any old
            this.modelListeners.clear();
            // re-emit some events from the model
            this.modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this.modelListeners.add(model.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
            // important: treat save errors as potential dirty change because
            // a file that is in save conflict or error will report dirty even
            // if auto save is turned on.
            this.modelListeners.add(model.onDidSaveError(() => this._onDidChangeDirty.fire()));
            // remove model association once it gets disposed
            this.modelListeners.add(event_1.Event.once(model.onWillDispose)(() => {
                this.modelListeners.clear();
                this.model = undefined;
            }));
        }
        getName() {
            return this.preferredName || super.getName();
        }
        setPreferredName(name) {
            if (!this.allowLabelOverride()) {
                return; // block for specific schemes we consider to be owning
            }
            if (this.preferredName !== name) {
                this.preferredName = name;
                this._onDidChangeLabel.fire();
            }
        }
        allowLabelOverride() {
            return this.resource.scheme !== this.pathService.defaultUriScheme &&
                this.resource.scheme !== network_1.Schemas.vscodeUserData &&
                this.resource.scheme !== network_1.Schemas.file &&
                this.resource.scheme !== network_1.Schemas.vscodeRemote;
        }
        getPreferredName() {
            return this.preferredName;
        }
        getDescription(verbosity) {
            return this.preferredDescription || super.getDescription(verbosity);
        }
        setPreferredDescription(description) {
            if (!this.allowLabelOverride()) {
                return; // block for specific schemes we consider to be owning
            }
            if (this.preferredDescription !== description) {
                this.preferredDescription = description;
                this._onDidChangeLabel.fire();
            }
        }
        getPreferredDescription() {
            return this.preferredDescription;
        }
        getEncoding() {
            if (this.model) {
                return this.model.getEncoding();
            }
            return this.preferredEncoding;
        }
        getPreferredEncoding() {
            return this.preferredEncoding;
        }
        async setEncoding(encoding, mode) {
            var _a;
            this.setPreferredEncoding(encoding);
            return (_a = this.model) === null || _a === void 0 ? void 0 : _a.setEncoding(encoding, mode);
        }
        setPreferredEncoding(encoding) {
            this.preferredEncoding = encoding;
            // encoding is a good hint to open the file as text
            this.setForceOpenAsText();
        }
        getLanguageId() {
            if (this.model) {
                return this.model.getLanguageId();
            }
            return this.preferredLanguageId;
        }
        getPreferredLanguageId() {
            return this.preferredLanguageId;
        }
        setLanguageId(languageId) {
            var _a;
            this.setPreferredLanguageId(languageId);
            (_a = this.model) === null || _a === void 0 ? void 0 : _a.setLanguageId(languageId);
        }
        setPreferredLanguageId(languageId) {
            this.preferredLanguageId = languageId;
            // languages are a good hint to open the file as text
            this.setForceOpenAsText();
        }
        setPreferredContents(contents) {
            this.preferredContents = contents;
            // contents is a good hint to open the file as text
            this.setForceOpenAsText();
        }
        setForceOpenAsText() {
            this.forceOpenAs = 1 /* ForceOpenAs.Text */;
        }
        setForceOpenAsBinary() {
            this.forceOpenAs = 2 /* ForceOpenAs.Binary */;
        }
        isDirty() {
            var _a;
            return !!((_a = this.model) === null || _a === void 0 ? void 0 : _a.isDirty());
        }
        isSaving() {
            var _a, _b, _c;
            if (((_a = this.model) === null || _a === void 0 ? void 0 : _a.hasState(0 /* TextFileEditorModelState.SAVED */)) || ((_b = this.model) === null || _b === void 0 ? void 0 : _b.hasState(3 /* TextFileEditorModelState.CONFLICT */)) || ((_c = this.model) === null || _c === void 0 ? void 0 : _c.hasState(5 /* TextFileEditorModelState.ERROR */))) {
                return false; // require the model to be dirty and not in conflict or error state
            }
            // Note: currently not checking for ModelState.PENDING_SAVE for a reason
            // because we currently miss an event for this state change on editors
            // and it could result in bad UX where an editor can be closed even though
            // it shows up as dirty and has not finished saving yet.
            if (this.filesConfigurationService.getAutoSaveMode() === 1 /* AutoSaveMode.AFTER_SHORT_DELAY */) {
                return true; // a short auto save is configured, treat this as being saved
            }
            return super.isSaving();
        }
        prefersEditorPane(editorPanes) {
            if (this.forceOpenAs === 2 /* ForceOpenAs.Binary */) {
                return editorPanes.find(editorPane => editorPane.typeId === files_2.BINARY_FILE_EDITOR_ID);
            }
            return editorPanes.find(editorPane => editorPane.typeId === files_2.TEXT_FILE_EDITOR_ID);
        }
        resolve() {
            // Resolve as binary
            if (this.forceOpenAs === 2 /* ForceOpenAs.Binary */) {
                return this.doResolveAsBinary();
            }
            // Resolve as text
            return this.doResolveAsText();
        }
        async doResolveAsText() {
            try {
                // Unset preferred contents after having applied it once
                // to prevent this property to stick. We still want future
                // `resolve` calls to fetch the contents from disk.
                const preferredContents = this.preferredContents;
                this.preferredContents = undefined;
                // Resolve resource via text file service and only allow
                // to open binary files if we are instructed so
                await this.textFileService.files.resolve(this.resource, {
                    languageId: this.preferredLanguageId,
                    encoding: this.preferredEncoding,
                    contents: typeof preferredContents === 'string' ? (0, textModel_1.createTextBufferFactory)(preferredContents) : undefined,
                    reload: { async: true },
                    allowBinary: this.forceOpenAs === 1 /* ForceOpenAs.Text */,
                    reason: 1 /* TextFileResolveReason.EDITOR */
                });
                // This is a bit ugly, because we first resolve the model and then resolve a model reference. the reason being that binary
                // or very large files do not resolve to a text file model but should be opened as binary files without text. First calling into
                // resolve() ensures we are not creating model references for these kind of resources.
                // In addition we have a bit of payload to take into account (encoding, reload) that the text resolver does not handle yet.
                if (!this.cachedTextFileModelReference) {
                    this.cachedTextFileModelReference = await this.textModelResolverService.createModelReference(this.resource);
                }
                const model = this.cachedTextFileModelReference.object;
                // It is possible that this input was disposed before the model
                // finished resolving. As such, we need to make sure to dispose
                // the model reference to not leak it.
                if (this.isDisposed()) {
                    this.disposeModelReference();
                }
                return model;
            }
            catch (error) {
                // In case of an error that indicates that the file is binary or too large, just return with the binary editor model
                if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */ ||
                    error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                    return this.doResolveAsBinary();
                }
                // Bubble any other error up
                throw error;
            }
        }
        async doResolveAsBinary() {
            const model = this.instantiationService.createInstance(binaryEditorModel_1.BinaryEditorModel, this.preferredResource, this.getName());
            await model.resolve();
            return model;
        }
        isResolved() {
            return !!this.model;
        }
        async rename(group, target) {
            return {
                editor: {
                    resource: target,
                    encoding: this.getEncoding(),
                    options: {
                        viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService)
                    }
                }
            };
        }
        toUntyped(options) {
            const untypedInput = {
                resource: this.preferredResource,
                forceFile: true,
                options: {
                    override: this.editorId
                }
            };
            if (typeof (options === null || options === void 0 ? void 0 : options.preserveViewState) === 'number') {
                untypedInput.encoding = this.getEncoding();
                untypedInput.languageId = this.getLanguageId();
                untypedInput.contents = (() => {
                    const model = this.textFileService.files.get(this.resource);
                    if (model === null || model === void 0 ? void 0 : model.isDirty()) {
                        return model.textEditorModel.getValue(); // only if dirty
                    }
                    return undefined;
                })();
                untypedInput.options = Object.assign(Object.assign({}, untypedInput.options), { viewState: (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService) });
            }
            return untypedInput;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof FileEditorInput) {
                return (0, resources_1.isEqual)(otherInput.resource, this.resource);
            }
            return false;
        }
        dispose() {
            // Model
            this.model = undefined;
            // Model reference
            this.disposeModelReference();
            super.dispose();
        }
        disposeModelReference() {
            (0, lifecycle_1.dispose)(this.cachedTextFileModelReference);
            this.cachedTextFileModelReference = undefined;
        }
    };
    FileEditorInput = __decorate([
        __param(7, instantiation_1.IInstantiationService),
        __param(8, textfiles_1.ITextFileService),
        __param(9, resolverService_1.ITextModelService),
        __param(10, label_1.ILabelService),
        __param(11, files_1.IFileService),
        __param(12, filesConfigurationService_1.IFilesConfigurationService),
        __param(13, editorService_1.IEditorService),
        __param(14, pathService_1.IPathService)
    ], FileEditorInput);
    exports.FileEditorInput = FileEditorInput;
});
//# sourceMappingURL=fileEditorInput.js.map