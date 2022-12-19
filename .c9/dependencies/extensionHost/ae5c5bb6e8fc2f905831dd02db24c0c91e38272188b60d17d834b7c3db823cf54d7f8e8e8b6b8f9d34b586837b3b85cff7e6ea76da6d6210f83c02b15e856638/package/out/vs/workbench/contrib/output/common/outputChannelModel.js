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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources", "vs/editor/common/services/editorWorker", "vs/base/common/event", "vs/base/common/async", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/workbench/services/output/common/output"], function (require, exports, instantiation_1, resources, editorWorker_1, event_1, async_1, files_1, model_1, lifecycle_1, types_1, editOperation_1, position_1, range_1, buffer_1, log_1, cancellation_1, output_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DelegatedOutputChannelModel = exports.FileOutputChannelModel = void 0;
    class OutputFileListener extends lifecycle_1.Disposable {
        constructor(file, fileService, logService) {
            super();
            this.file = file;
            this.fileService = fileService;
            this.logService = logService;
            this._onDidContentChange = new event_1.Emitter();
            this.onDidContentChange = this._onDidContentChange.event;
            this.watching = false;
            this.syncDelayer = new async_1.ThrottledDelayer(500);
        }
        watch(eTag) {
            if (!this.watching) {
                this.etag = eTag;
                this.poll();
                this.logService.trace('Started polling', this.file.toString());
                this.watching = true;
            }
        }
        poll() {
            const loop = () => this.doWatch().then(() => this.poll());
            this.syncDelayer.trigger(loop);
        }
        async doWatch() {
            const stat = await this.fileService.stat(this.file);
            if (stat.etag !== this.etag) {
                this.etag = stat.etag;
                this._onDidContentChange.fire(stat.size);
            }
        }
        unwatch() {
            if (this.watching) {
                this.syncDelayer.cancel();
                this.watching = false;
                this.logService.trace('Stopped polling', this.file.toString());
            }
        }
        dispose() {
            this.unwatch();
            super.dispose();
        }
    }
    let FileOutputChannelModel = class FileOutputChannelModel extends lifecycle_1.Disposable {
        constructor(modelUri, language, file, fileService, modelService, logService, editorWorkerService) {
            super();
            this.modelUri = modelUri;
            this.language = language;
            this.file = file;
            this.fileService = fileService;
            this.modelService = modelService;
            this.editorWorkerService = editorWorkerService;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.etag = '';
            this.loadModelPromise = null;
            this.model = null;
            this.modelUpdateInProgress = false;
            this.modelUpdateCancellationSource = this._register(new lifecycle_1.MutableDisposable());
            this.appendThrottler = this._register(new async_1.ThrottledDelayer(300));
            this.startOffset = 0;
            this.endOffset = 0;
            this.fileHandler = this._register(new OutputFileListener(this.file, this.fileService, logService));
            this._register(this.fileHandler.onDidContentChange(size => this.onDidContentChange(size)));
            this._register((0, lifecycle_1.toDisposable)(() => this.fileHandler.unwatch()));
        }
        append(message) {
            throw new Error('Not supported');
        }
        replace(message) {
            throw new Error('Not supported');
        }
        clear() {
            this.update(output_1.OutputChannelUpdateMode.Clear, this.endOffset);
        }
        update(mode, till) {
            const loadModelPromise = this.loadModelPromise ? this.loadModelPromise : Promise.resolve();
            loadModelPromise.then(() => this.doUpdate(mode, till));
        }
        loadModel() {
            this.loadModelPromise = async_1.Promises.withAsyncBody(async (c, e) => {
                try {
                    let content = '';
                    if (await this.fileService.exists(this.file)) {
                        const fileContent = await this.fileService.readFile(this.file, { position: this.startOffset });
                        this.endOffset = this.startOffset + fileContent.value.byteLength;
                        this.etag = fileContent.etag;
                        content = fileContent.value.toString();
                    }
                    else {
                        this.startOffset = 0;
                        this.endOffset = 0;
                    }
                    c(this.createModel(content));
                }
                catch (error) {
                    e(error);
                }
            });
            return this.loadModelPromise;
        }
        createModel(content) {
            if (this.model) {
                this.model.setValue(content);
            }
            else {
                this.model = this.modelService.createModel(content, this.language, this.modelUri);
                this.fileHandler.watch(this.etag);
                const disposable = this.model.onWillDispose(() => {
                    this.cancelModelUpdate();
                    this.fileHandler.unwatch();
                    this.model = null;
                    (0, lifecycle_1.dispose)(disposable);
                });
            }
            return this.model;
        }
        doUpdate(mode, till) {
            if (mode === output_1.OutputChannelUpdateMode.Clear || mode === output_1.OutputChannelUpdateMode.Replace) {
                this.startOffset = this.endOffset = (0, types_1.isNumber)(till) ? till : this.endOffset;
                this.cancelModelUpdate();
            }
            if (!this.model) {
                return;
            }
            this.modelUpdateInProgress = true;
            if (!this.modelUpdateCancellationSource.value) {
                this.modelUpdateCancellationSource.value = new cancellation_1.CancellationTokenSource();
            }
            const token = this.modelUpdateCancellationSource.value.token;
            if (mode === output_1.OutputChannelUpdateMode.Clear) {
                this.clearContent(this.model);
            }
            else if (mode === output_1.OutputChannelUpdateMode.Replace) {
                this.replacePromise = this.replaceContent(this.model, token).finally(() => this.replacePromise = undefined);
            }
            else {
                this.appendContent(this.model, token);
            }
        }
        clearContent(model) {
            this.doUpdateModel(model, [editOperation_1.EditOperation.delete(model.getFullModelRange())], buffer_1.VSBuffer.fromString(''));
        }
        async appendContent(model, token) {
            this.appendThrottler.trigger(async () => {
                /* Abort if operation is cancelled */
                if (token.isCancellationRequested) {
                    return;
                }
                /* Wait for replace to finish */
                if (this.replacePromise) {
                    try {
                        await this.replacePromise;
                    }
                    catch (e) { /* Ignore */ }
                    /* Abort if operation is cancelled */
                    if (token.isCancellationRequested) {
                        return;
                    }
                }
                /* Get content to append */
                const contentToAppend = await this.getContentToUpdate();
                /* Abort if operation is cancelled */
                if (token.isCancellationRequested) {
                    return;
                }
                /* Appned Content */
                const lastLine = model.getLineCount();
                const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
                const edits = [editOperation_1.EditOperation.insert(new position_1.Position(lastLine, lastLineMaxColumn), contentToAppend.toString())];
                this.doUpdateModel(model, edits, contentToAppend);
            });
        }
        async replaceContent(model, token) {
            /* Get content to replace */
            const contentToReplace = await this.getContentToUpdate();
            /* Abort if operation is cancelled */
            if (token.isCancellationRequested) {
                return;
            }
            /* Compute Edits */
            const edits = await this.getReplaceEdits(model, contentToReplace.toString());
            /* Abort if operation is cancelled */
            if (token.isCancellationRequested) {
                return;
            }
            /* Apply Edits */
            this.doUpdateModel(model, edits, contentToReplace);
        }
        async getReplaceEdits(model, contentToReplace) {
            if (!contentToReplace) {
                return [editOperation_1.EditOperation.delete(model.getFullModelRange())];
            }
            if (contentToReplace !== model.getValue()) {
                const edits = await this.editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: contentToReplace.toString(), range: model.getFullModelRange() }]);
                if (edits === null || edits === void 0 ? void 0 : edits.length) {
                    return edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text));
                }
            }
            return [];
        }
        doUpdateModel(model, edits, content) {
            if (edits.length) {
                model.applyEdits(edits);
            }
            this.endOffset = this.endOffset + content.byteLength;
            this.modelUpdateInProgress = false;
        }
        cancelModelUpdate() {
            if (this.modelUpdateCancellationSource.value) {
                this.modelUpdateCancellationSource.value.cancel();
            }
            this.modelUpdateCancellationSource.value = undefined;
            this.appendThrottler.cancel();
            this.replacePromise = undefined;
            this.modelUpdateInProgress = false;
        }
        async getContentToUpdate() {
            const content = await this.fileService.readFile(this.file, { position: this.endOffset });
            this.etag = content.etag;
            return content.value;
        }
        onDidContentChange(size) {
            if (this.model) {
                if (!this.modelUpdateInProgress) {
                    if ((0, types_1.isNumber)(size) && this.endOffset > size) {
                        // Reset - Content is removed
                        this.update(output_1.OutputChannelUpdateMode.Clear, 0);
                    }
                }
                this.update(output_1.OutputChannelUpdateMode.Append);
            }
        }
        isVisible() {
            return !!this.model;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    FileOutputChannelModel = __decorate([
        __param(3, files_1.IFileService),
        __param(4, model_1.IModelService),
        __param(5, log_1.ILogService),
        __param(6, editorWorker_1.IEditorWorkerService)
    ], FileOutputChannelModel);
    exports.FileOutputChannelModel = FileOutputChannelModel;
    let OutputChannelBackedByFile = class OutputChannelBackedByFile extends FileOutputChannelModel {
        constructor(id, modelUri, language, file, fileService, modelService, loggerService, logService, editorWorkerService) {
            super(modelUri, language, file, fileService, modelService, logService, editorWorkerService);
            // Donot rotate to check for the file reset
            this.logger = loggerService.createLogger(file, { always: true, donotRotate: true, donotUseFormatters: true });
            this._offset = 0;
        }
        append(message) {
            this.write(message);
            this.update(output_1.OutputChannelUpdateMode.Append);
        }
        replace(message) {
            const till = this._offset;
            this.write(message);
            this.update(output_1.OutputChannelUpdateMode.Replace, till);
        }
        write(content) {
            this._offset += buffer_1.VSBuffer.fromString(content).byteLength;
            this.logger.info(content);
            if (this.isVisible()) {
                this.logger.flush();
            }
        }
    };
    OutputChannelBackedByFile = __decorate([
        __param(4, files_1.IFileService),
        __param(5, model_1.IModelService),
        __param(6, log_1.ILoggerService),
        __param(7, log_1.ILogService),
        __param(8, editorWorker_1.IEditorWorkerService)
    ], OutputChannelBackedByFile);
    let DelegatedOutputChannelModel = class DelegatedOutputChannelModel extends lifecycle_1.Disposable {
        constructor(id, modelUri, language, outputDir, instantiationService, fileService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.outputChannelModel = this.createOutputChannelModel(id, modelUri, language, outputDir);
        }
        async createOutputChannelModel(id, modelUri, language, outputDirPromise) {
            const outputDir = await outputDirPromise;
            const file = resources.joinPath(outputDir, `${id.replace(/[\\/:\*\?"<>\|]/g, '')}.log`);
            await this.fileService.createFile(file);
            const outputChannelModel = this._register(this.instantiationService.createInstance(OutputChannelBackedByFile, id, modelUri, language, file));
            this._register(outputChannelModel.onDispose(() => this._onDispose.fire()));
            return outputChannelModel;
        }
        append(output) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.append(output));
        }
        update(mode, till) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.update(mode, till));
        }
        loadModel() {
            return this.outputChannelModel.then(outputChannelModel => outputChannelModel.loadModel());
        }
        clear() {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.clear());
        }
        replace(value) {
            this.outputChannelModel.then(outputChannelModel => outputChannelModel.replace(value));
        }
    };
    DelegatedOutputChannelModel = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, files_1.IFileService)
    ], DelegatedOutputChannelModel);
    exports.DelegatedOutputChannelModel = DelegatedOutputChannelModel;
});
//# sourceMappingURL=outputChannelModel.js.map