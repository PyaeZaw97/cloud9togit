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
define(["require", "exports", "vs/nls", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/common/editor", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/services/untitled/common/untitledTextEditorModel", "vs/workbench/services/textfile/common/textFileEditorModelManager", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/editor/common/model/textModel", "vs/editor/common/services/model", "vs/base/common/resources", "vs/platform/dialogs/common/dialogs", "vs/base/common/buffer", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/languages/modesRegistry", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/editor/common/services/resolverService", "vs/workbench/common/editor/textEditorModel", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/encoding", "vs/base/common/stream", "vs/editor/common/languages/language", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/decorations/common/decorations", "vs/base/common/event", "vs/base/common/codicons", "vs/platform/theme/common/colorRegistry", "vs/base/common/types"], function (require, exports, nls_1, textfiles_1, editor_1, lifecycle_1, files_1, lifecycle_2, environmentService_1, untitledTextEditorService_1, untitledTextEditorModel_1, textFileEditorModelManager_1, instantiation_1, network_1, textModel_1, model_1, resources_1, dialogs_1, buffer_1, textResourceConfiguration_1, modesRegistry_1, filesConfigurationService_1, resolverService_1, textEditorModel_1, codeEditorService_1, pathService_1, workingCopyFileService_1, uriIdentity_1, workspace_1, encoding_1, stream_1, language_1, log_1, cancellation_1, elevatedFileService_1, decorations_1, event_1, codicons_1, colorRegistry_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncodingOracle = exports.AbstractTextFileService = void 0;
    /**
     * The workbench file service implementation implements the raw file service spec and adds additional methods on top.
     */
    let AbstractTextFileService = class AbstractTextFileService extends lifecycle_2.Disposable {
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService) {
            super();
            this.fileService = fileService;
            this.untitledTextEditorService = untitledTextEditorService;
            this.lifecycleService = lifecycleService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.environmentService = environmentService;
            this.dialogService = dialogService;
            this.fileDialogService = fileDialogService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.filesConfigurationService = filesConfigurationService;
            this.textModelService = textModelService;
            this.codeEditorService = codeEditorService;
            this.pathService = pathService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.languageService = languageService;
            this.logService = logService;
            this.elevatedFileService = elevatedFileService;
            this.decorationsService = decorationsService;
            this.files = this._register(this.instantiationService.createInstance(textFileEditorModelManager_1.TextFileEditorModelManager));
            this.untitled = this.untitledTextEditorService;
            this.provideDecorations();
        }
        //#region decorations
        provideDecorations() {
            // Text file model decorations
            this.decorationsService.registerDecorationsProvider(new class extends lifecycle_2.Disposable {
                constructor(files) {
                    super();
                    this.files = files;
                    this.label = (0, nls_1.localize)('textFileModelDecorations', "Text File Model Decorations");
                    this._onDidChange = this._register(new event_1.Emitter());
                    this.onDidChange = this._onDidChange.event;
                    this.registerListeners();
                }
                registerListeners() {
                    // Creates
                    this._register(this.files.onDidResolve(({ model }) => {
                        if (model.isReadonly() || model.hasState(4 /* TextFileEditorModelState.ORPHAN */)) {
                            this._onDidChange.fire([model.resource]);
                        }
                    }));
                    // Removals: once a text file model is no longer
                    // under our control, make sure to signal this as
                    // decoration change because from this point on we
                    // have no way of updating the decoration anymore.
                    this._register(this.files.onDidRemove(modelUri => this._onDidChange.fire([modelUri])));
                    // Changes
                    this._register(this.files.onDidChangeReadonly(model => this._onDidChange.fire([model.resource])));
                    this._register(this.files.onDidChangeOrphaned(model => this._onDidChange.fire([model.resource])));
                }
                provideDecorations(uri) {
                    const model = this.files.get(uri);
                    if (!model || model.isDisposed()) {
                        return undefined;
                    }
                    const isReadonly = model.isReadonly();
                    const isOrphaned = model.hasState(4 /* TextFileEditorModelState.ORPHAN */);
                    // Readonly + Orphaned
                    if (isReadonly && isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            letter: codicons_1.Codicon.lockSmall,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('readonlyAndDeleted', "Deleted, Read Only"),
                        };
                    }
                    // Readonly
                    else if (isReadonly) {
                        return {
                            letter: codicons_1.Codicon.lockSmall,
                            tooltip: (0, nls_1.localize)('readonly', "Read Only"),
                        };
                    }
                    // Orphaned
                    else if (isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('deleted', "Deleted"),
                        };
                    }
                    return undefined;
                }
            }(this.files));
        }
        get encoding() {
            if (!this._encoding) {
                this._encoding = this._register(this.instantiationService.createInstance(EncodingOracle));
            }
            return this._encoding;
        }
        async read(resource, options) {
            const [bufferStream, decoder] = await this.doRead(resource, Object.assign(Object.assign({}, options), { 
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true }));
            return Object.assign(Object.assign({}, bufferStream), { encoding: decoder.detected.encoding || encoding_1.UTF8, value: await (0, stream_1.consumeStream)(decoder.stream, strings => strings.join('')) });
        }
        async readStream(resource, options) {
            const [bufferStream, decoder] = await this.doRead(resource, options);
            return Object.assign(Object.assign({}, bufferStream), { encoding: decoder.detected.encoding || encoding_1.UTF8, value: await (0, textModel_1.createTextBufferFactoryFromStream)(decoder.stream) });
        }
        async doRead(resource, options) {
            const cts = new cancellation_1.CancellationTokenSource();
            // read stream raw (either buffered or unbuffered)
            let bufferStream;
            if (options === null || options === void 0 ? void 0 : options.preferUnbuffered) {
                const content = await this.fileService.readFile(resource, options, cts.token);
                bufferStream = Object.assign(Object.assign({}, content), { value: (0, buffer_1.bufferToStream)(content.value) });
            }
            else {
                bufferStream = await this.fileService.readFileStream(resource, options, cts.token);
            }
            // read through encoding library
            try {
                const decoder = await this.doGetDecodedStream(resource, bufferStream.value, options);
                return [bufferStream, decoder];
            }
            catch (error) {
                // Make sure to cancel reading on error to
                // stop file service activity as soon as
                // possible. When for example a large binary
                // file is read we want to cancel the read
                // instantly.
                // Refs:
                // - https://github.com/microsoft/vscode/issues/138805
                // - https://github.com/microsoft/vscode/issues/132771
                cts.dispose(true);
                // special treatment for streams that are binary
                if (error.decodeStreamErrorKind === 1 /* DecodeStreamErrorKind.STREAM_IS_BINARY */) {
                    throw new textfiles_1.TextFileOperationError((0, nls_1.localize)('fileBinaryError', "File seems to be binary and cannot be opened as text"), 0 /* TextFileOperationResult.FILE_IS_BINARY */, options);
                }
                // re-throw any other error as it is
                else {
                    throw error;
                }
            }
        }
        async create(operations, undoInfo) {
            const operationsWithContents = await Promise.all(operations.map(async (operation) => {
                var _a;
                const contents = await this.getEncodedReadable(operation.resource, operation.value);
                return {
                    resource: operation.resource,
                    contents,
                    overwrite: (_a = operation.options) === null || _a === void 0 ? void 0 : _a.overwrite
                };
            }));
            return this.workingCopyFileService.create(operationsWithContents, cancellation_1.CancellationToken.None, undoInfo);
        }
        async write(resource, value, options) {
            const readable = await this.getEncodedReadable(resource, value, options);
            if ((options === null || options === void 0 ? void 0 : options.writeElevated) && this.elevatedFileService.isSupported(resource)) {
                return this.elevatedFileService.writeFileElevated(resource, readable, options);
            }
            return this.fileService.writeFile(resource, readable, options);
        }
        async getEncodedReadable(resource, value, options) {
            // check for encoding
            const { encoding, addBOM } = await this.encoding.getWriteEncoding(resource, options);
            // when encoding is standard skip encoding step
            if (encoding === encoding_1.UTF8 && !addBOM) {
                return typeof value === 'undefined'
                    ? undefined
                    : (0, textfiles_1.toBufferOrReadable)(value);
            }
            // otherwise create encoded readable
            value = value || '';
            const snapshot = typeof value === 'string' ? (0, textfiles_1.stringToSnapshot)(value) : value;
            return (0, encoding_1.toEncodeReadable)(snapshot, encoding, { addBOM });
        }
        async getDecodedStream(resource, value, options) {
            return (await this.doGetDecodedStream(resource, value, options)).stream;
        }
        doGetDecodedStream(resource, stream, options) {
            var _a;
            // read through encoding library
            return (0, encoding_1.toDecodeStream)(stream, {
                acceptTextOnly: (_a = options === null || options === void 0 ? void 0 : options.acceptTextOnly) !== null && _a !== void 0 ? _a : false,
                guessEncoding: (options === null || options === void 0 ? void 0 : options.autoGuessEncoding) || this.textResourceConfigurationService.getValue(resource, 'files.autoGuessEncoding'),
                overwriteEncoding: async (detectedEncoding) => {
                    const { encoding } = await this.encoding.getPreferredReadEncoding(resource, options, (0, types_1.withNullAsUndefined)(detectedEncoding));
                    return encoding;
                }
            });
        }
        //#endregion
        //#region save
        async save(resource, options) {
            // Untitled
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    let targetUri;
                    // Untitled with associated file path don't need to prompt
                    if (model.hasAssociatedFilePath) {
                        targetUri = await this.suggestSavePath(resource);
                    }
                    // Otherwise ask user
                    else {
                        targetUri = await this.fileDialogService.pickFileToSave(await this.suggestSavePath(resource), options === null || options === void 0 ? void 0 : options.availableFileSystems);
                    }
                    // Save as if target provided
                    if (targetUri) {
                        return this.saveAs(resource, targetUri, options);
                    }
                }
            }
            // File
            else {
                const model = this.files.get(resource);
                if (model) {
                    return await model.save(options) ? resource : undefined;
                }
            }
            return undefined;
        }
        async saveAs(source, target, options) {
            var _a;
            // Get to target resource
            if (!target) {
                target = await this.fileDialogService.pickFileToSave(await this.suggestSavePath((_a = options === null || options === void 0 ? void 0 : options.suggestedTarget) !== null && _a !== void 0 ? _a : source), options === null || options === void 0 ? void 0 : options.availableFileSystems);
            }
            if (!target) {
                return; // user canceled
            }
            // Just save if target is same as models own resource
            if ((0, resources_1.isEqual)(source, target)) {
                return this.save(source, Object.assign(Object.assign({}, options), { force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */ }));
            }
            // If the target is different but of same identity, we
            // move the source to the target, knowing that the
            // underlying file system cannot have both and then save.
            // However, this will only work if the source exists
            // and is not orphaned, so we need to check that too.
            if (this.fileService.hasProvider(source) && this.uriIdentityService.extUri.isEqual(source, target) && (await this.fileService.exists(source))) {
                await this.workingCopyFileService.move([{ file: { source, target } }], cancellation_1.CancellationToken.None);
                // At this point we don't know whether we have a
                // model for the source or the target URI so we
                // simply try to save with both resources.
                const success = await this.save(source, options);
                if (!success) {
                    await this.save(target, options);
                }
                return target;
            }
            // Do it
            return this.doSaveAs(source, target, options);
        }
        async doSaveAs(source, target, options) {
            let success = false;
            // If the source is an existing text file model, we can directly
            // use that model to copy the contents to the target destination
            const textFileModel = this.files.get(source);
            if (textFileModel === null || textFileModel === void 0 ? void 0 : textFileModel.isResolved()) {
                success = await this.doSaveAsTextFile(textFileModel, source, target, options);
            }
            // Otherwise if the source can be handled by the file service
            // we can simply invoke the copy() function to save as
            else if (this.fileService.hasProvider(source)) {
                await this.fileService.copy(source, target, true);
                success = true;
            }
            // Next, if the source does not seem to be a file, we try to
            // resolve a text model from the resource to get at the
            // contents and additional meta data (e.g. encoding).
            else if (this.textModelService.canHandleResource(source)) {
                const modelReference = await this.textModelService.createModelReference(source);
                try {
                    success = await this.doSaveAsTextFile(modelReference.object, source, target, options);
                }
                finally {
                    modelReference.dispose(); // free up our use of the reference
                }
            }
            // Finally we simply check if we can find a editor model that
            // would give us access to the contents.
            else {
                const textModel = this.modelService.getModel(source);
                if (textModel) {
                    success = await this.doSaveAsTextFile(textModel, source, target, options);
                }
            }
            if (!success) {
                return undefined;
            }
            // Revert the source
            await this.revert(source);
            return target;
        }
        async doSaveAsTextFile(sourceModel, source, target, options) {
            // Find source encoding if any
            let sourceModelEncoding = undefined;
            const sourceModelWithEncodingSupport = sourceModel;
            if (typeof sourceModelWithEncodingSupport.getEncoding === 'function') {
                sourceModelEncoding = sourceModelWithEncodingSupport.getEncoding();
            }
            // Prefer an existing model if it is already resolved for the given target resource
            let targetExists = false;
            let targetModel = this.files.get(target);
            if (targetModel === null || targetModel === void 0 ? void 0 : targetModel.isResolved()) {
                targetExists = true;
            }
            // Otherwise create the target file empty if it does not exist already and resolve it from there
            else {
                targetExists = await this.fileService.exists(target);
                // create target file adhoc if it does not exist yet
                if (!targetExists) {
                    await this.create([{ resource: target, value: '' }]);
                }
                try {
                    targetModel = await this.files.resolve(target, { encoding: sourceModelEncoding });
                }
                catch (error) {
                    // if the target already exists and was not created by us, it is possible
                    // that we cannot resolve the target as text model if it is binary or too
                    // large. in that case we have to delete the target file first and then
                    // re-run the operation.
                    if (targetExists) {
                        if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */ ||
                            error.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                            await this.fileService.del(target);
                            return this.doSaveAsTextFile(sourceModel, source, target, options);
                        }
                    }
                    throw error;
                }
            }
            // Confirm to overwrite if we have an untitled file with associated file where
            // the file actually exists on disk and we are instructed to save to that file
            // path. This can happen if the file was created after the untitled file was opened.
            // See https://github.com/microsoft/vscode/issues/67946
            let write;
            if (sourceModel instanceof untitledTextEditorModel_1.UntitledTextEditorModel && sourceModel.hasAssociatedFilePath && targetExists && this.uriIdentityService.extUri.isEqual(target, (0, resources_1.toLocalResource)(sourceModel.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme))) {
                write = await this.confirmOverwrite(target);
            }
            else {
                write = true;
            }
            if (!write) {
                return false;
            }
            let sourceTextModel = undefined;
            if (sourceModel instanceof textEditorModel_1.BaseTextEditorModel) {
                if (sourceModel.isResolved()) {
                    sourceTextModel = sourceModel.textEditorModel;
                }
            }
            else {
                sourceTextModel = sourceModel;
            }
            let targetTextModel = undefined;
            if (targetModel.isResolved()) {
                targetTextModel = targetModel.textEditorModel;
            }
            // take over model value, encoding and language (only if more specific) from source model
            if (sourceTextModel && targetTextModel) {
                // encoding
                targetModel.updatePreferredEncoding(sourceModelEncoding);
                // content
                this.modelService.updateModel(targetTextModel, (0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceTextModel.createSnapshot()));
                // language
                const sourceLanguageId = sourceTextModel.getLanguageId();
                const targetLanguageId = targetTextModel.getLanguageId();
                if (sourceLanguageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID && targetLanguageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                    targetTextModel.setMode(sourceLanguageId); // only use if more specific than plain/text
                }
                // transient properties
                const sourceTransientProperties = this.codeEditorService.getTransientModelProperties(sourceTextModel);
                if (sourceTransientProperties) {
                    for (const [key, value] of sourceTransientProperties) {
                        this.codeEditorService.setTransientModelProperty(targetTextModel, key, value);
                    }
                }
            }
            // set source options depending on target exists or not
            if (!(options === null || options === void 0 ? void 0 : options.source)) {
                options = Object.assign(Object.assign({}, options), { source: targetExists ? AbstractTextFileService.TEXTFILE_SAVE_REPLACE_SOURCE : AbstractTextFileService.TEXTFILE_SAVE_CREATE_SOURCE });
            }
            // save model
            return targetModel.save(options);
        }
        async confirmOverwrite(resource) {
            const confirm = {
                message: (0, nls_1.localize)('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('irreversible', "A file or folder with the name '{0}' already exists in the folder '{1}'. Replacing it will overwrite its current contents.", (0, resources_1.basename)(resource), (0, resources_1.basename)((0, resources_1.dirname)(resource))),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
            return (await this.dialogService.confirm(confirm)).confirmed;
        }
        async suggestSavePath(resource) {
            // Just take the resource as is if the file service can handle it
            if (this.fileService.hasProvider(resource)) {
                return resource;
            }
            const remoteAuthority = this.environmentService.remoteAuthority;
            const defaultFilePath = await this.fileDialogService.defaultFilePath();
            // Otherwise try to suggest a path that can be saved
            let suggestedFilename = undefined;
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    // Untitled with associated file path
                    if (model.hasAssociatedFilePath) {
                        return (0, resources_1.toLocalResource)(resource, remoteAuthority, this.pathService.defaultUriScheme);
                    }
                    // Untitled without associated file path: use name
                    // of untitled model if it is a valid path name,
                    // otherwise fallback to `basename`.
                    let untitledName = model.name;
                    if (!(await this.pathService.hasValidBasename((0, resources_1.joinPath)(defaultFilePath, untitledName), untitledName))) {
                        untitledName = (0, resources_1.basename)(resource);
                    }
                    // Add language file extension if specified
                    const languageId = model.getLanguageId();
                    if (languageId && languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                        suggestedFilename = this.suggestFilename(languageId, untitledName);
                    }
                    else {
                        suggestedFilename = untitledName;
                    }
                }
            }
            // Fallback to basename of resource
            if (!suggestedFilename) {
                suggestedFilename = (0, resources_1.basename)(resource);
            }
            // Try to place where last active file was if any
            // Otherwise fallback to user home
            return (0, resources_1.joinPath)(defaultFilePath, suggestedFilename);
        }
        suggestFilename(languageId, untitledName) {
            const languageName = this.languageService.getLanguageName(languageId);
            if (!languageName) {
                return untitledName;
            }
            const extension = this.languageService.getExtensions(languageId)[0];
            if (extension) {
                if (!untitledName.endsWith(extension)) {
                    return untitledName + extension;
                }
            }
            const filename = this.languageService.getFilenames(languageId)[0];
            return filename || untitledName;
        }
        //#endregion
        //#region revert
        async revert(resource, options) {
            // Untitled
            if (resource.scheme === network_1.Schemas.untitled) {
                const model = this.untitled.get(resource);
                if (model) {
                    return model.revert(options);
                }
            }
            // File
            else {
                const model = this.files.get(resource);
                if (model && (model.isDirty() || (options === null || options === void 0 ? void 0 : options.force))) {
                    return model.revert(options);
                }
            }
        }
        //#endregion
        //#region dirty
        isDirty(resource) {
            const model = resource.scheme === network_1.Schemas.untitled ? this.untitled.get(resource) : this.files.get(resource);
            if (model) {
                return model.isDirty();
            }
            return false;
        }
    };
    AbstractTextFileService.TEXTFILE_SAVE_CREATE_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileCreate.source', (0, nls_1.localize)('textFileCreate.source', "File Created"));
    AbstractTextFileService.TEXTFILE_SAVE_REPLACE_SOURCE = editor_1.SaveSourceRegistry.registerSource('textFileOverwrite.source', (0, nls_1.localize)('textFileOverwrite.source', "File Replaced"));
    AbstractTextFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, resolverService_1.ITextModelService),
        __param(11, codeEditorService_1.ICodeEditorService),
        __param(12, pathService_1.IPathService),
        __param(13, workingCopyFileService_1.IWorkingCopyFileService),
        __param(14, uriIdentity_1.IUriIdentityService),
        __param(15, language_1.ILanguageService),
        __param(16, log_1.ILogService),
        __param(17, elevatedFileService_1.IElevatedFileService),
        __param(18, decorations_1.IDecorationsService)
    ], AbstractTextFileService);
    exports.AbstractTextFileService = AbstractTextFileService;
    let EncodingOracle = class EncodingOracle extends lifecycle_2.Disposable {
        constructor(textResourceConfigurationService, environmentService, contextService, uriIdentityService) {
            super();
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this._encodingOverrides = this.getDefaultEncodingOverrides();
            this.registerListeners();
        }
        get encodingOverrides() { return this._encodingOverrides; }
        set encodingOverrides(value) { this._encodingOverrides = value; }
        registerListeners() {
            // Workspace Folder Change
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.encodingOverrides = this.getDefaultEncodingOverrides()));
        }
        getDefaultEncodingOverrides() {
            const defaultEncodingOverrides = [];
            // Global settings
            defaultEncodingOverrides.push({ parent: this.environmentService.userRoamingDataHome, encoding: encoding_1.UTF8 });
            // Workspace files (via extension and via untitled workspaces location)
            defaultEncodingOverrides.push({ extension: workspace_1.WORKSPACE_EXTENSION, encoding: encoding_1.UTF8 });
            defaultEncodingOverrides.push({ parent: this.environmentService.untitledWorkspacesHome, encoding: encoding_1.UTF8 });
            // Folder Settings
            this.contextService.getWorkspace().folders.forEach(folder => {
                defaultEncodingOverrides.push({ parent: (0, resources_1.joinPath)(folder.uri, '.vscode'), encoding: encoding_1.UTF8 });
            });
            return defaultEncodingOverrides;
        }
        async getWriteEncoding(resource, options) {
            const { encoding, hasBOM } = await this.getPreferredWriteEncoding(resource, options ? options.encoding : undefined);
            return { encoding, addBOM: hasBOM };
        }
        async getPreferredWriteEncoding(resource, preferredEncoding) {
            const resourceEncoding = await this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding: resourceEncoding,
                hasBOM: resourceEncoding === encoding_1.UTF16be || resourceEncoding === encoding_1.UTF16le || resourceEncoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        async getPreferredReadEncoding(resource, options, detectedEncoding) {
            let preferredEncoding;
            // Encoding passed in as option
            if (options === null || options === void 0 ? void 0 : options.encoding) {
                if (detectedEncoding === encoding_1.UTF8_with_bom && options.encoding === encoding_1.UTF8) {
                    preferredEncoding = encoding_1.UTF8_with_bom; // indicate the file has BOM if we are to resolve with UTF 8
                }
                else {
                    preferredEncoding = options.encoding; // give passed in encoding highest priority
                }
            }
            // Encoding detected
            else if (typeof detectedEncoding === 'string') {
                preferredEncoding = detectedEncoding;
            }
            // Encoding configured
            else if (this.textResourceConfigurationService.getValue(resource, 'files.encoding') === encoding_1.UTF8_with_bom) {
                preferredEncoding = encoding_1.UTF8; // if we did not detect UTF 8 BOM before, this can only be UTF 8 then
            }
            const encoding = await this.getEncodingForResource(resource, preferredEncoding);
            return {
                encoding,
                hasBOM: encoding === encoding_1.UTF16be || encoding === encoding_1.UTF16le || encoding === encoding_1.UTF8_with_bom // enforce BOM for certain encodings
            };
        }
        async getEncodingForResource(resource, preferredEncoding) {
            let fileEncoding;
            const override = this.getEncodingOverride(resource);
            if (override) {
                fileEncoding = override; // encoding override always wins
            }
            else if (preferredEncoding) {
                fileEncoding = preferredEncoding; // preferred encoding comes second
            }
            else {
                fileEncoding = this.textResourceConfigurationService.getValue(resource, 'files.encoding'); // and last we check for settings
            }
            if (fileEncoding !== encoding_1.UTF8) {
                if (!fileEncoding || !(await (0, encoding_1.encodingExists)(fileEncoding))) {
                    fileEncoding = encoding_1.UTF8; // the default is UTF-8
                }
            }
            return fileEncoding;
        }
        getEncodingOverride(resource) {
            var _a;
            if ((_a = this.encodingOverrides) === null || _a === void 0 ? void 0 : _a.length) {
                for (const override of this.encodingOverrides) {
                    // check if the resource is child of encoding override path
                    if (override.parent && this.uriIdentityService.extUri.isEqualOrParent(resource, override.parent)) {
                        return override.encoding;
                    }
                    // check if the resource extension is equal to encoding override
                    if (override.extension && (0, resources_1.extname)(resource) === `.${override.extension}`) {
                        return override.encoding;
                    }
                }
            }
            return undefined;
        }
    };
    EncodingOracle = __decorate([
        __param(0, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], EncodingOracle);
    exports.EncodingOracle = EncodingOracle;
});
//# sourceMappingURL=textFileService.js.map