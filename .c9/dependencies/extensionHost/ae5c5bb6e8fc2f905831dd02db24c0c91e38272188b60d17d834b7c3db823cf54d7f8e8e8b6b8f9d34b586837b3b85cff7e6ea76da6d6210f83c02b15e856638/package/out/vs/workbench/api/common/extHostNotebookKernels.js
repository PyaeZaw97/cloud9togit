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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/common/webview", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, lifecycle_1, map_1, uri_1, extensions_1, log_1, extHost_protocol_1, extHostCommands_1, extHostTypeConverters, extHostTypes_1, webview_1, notebookExecutionService_1, extensions_2, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createKernelId = exports.ExtHostNotebookKernels = void 0;
    let ExtHostNotebookKernels = class ExtHostNotebookKernels {
        constructor(mainContext, _initData, _extHostNotebook, _commands, _logService) {
            this._initData = _initData;
            this._extHostNotebook = _extHostNotebook;
            this._commands = _commands;
            this._logService = _logService;
            this._activeExecutions = new map_1.ResourceMap();
            this._kernelData = new Map();
            this._handlePool = 0;
            this._onDidChangeCellExecutionState = new event_1.Emitter();
            this.onDidChangeNotebookCellExecutionState = this._onDidChangeCellExecutionState.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookKernels);
            // todo@rebornix @joyceerhl: move to APICommands once stablized.
            const selectKernelApiCommand = new extHostCommands_1.ApiCommand('notebook.selectKernel', '_notebook.selectKernel', 'Trigger kernel picker for specified notebook editor widget', [
                new extHostCommands_1.ApiCommandArgument('options', 'Select kernel options', v => true, (v) => {
                    if (v && 'notebookEditor' in v && 'id' in v) {
                        const notebookEditorId = this._extHostNotebook.getIdByEditor(v.notebookEditor);
                        return {
                            id: v.id, extension: v.extension, notebookEditorId
                        };
                    }
                    else if (v && 'notebookEditor' in v) {
                        const notebookEditorId = this._extHostNotebook.getIdByEditor(v.notebookEditor);
                        if (notebookEditorId === undefined) {
                            throw new Error(`Cannot invoke 'notebook.selectKernel' for unrecognized notebook editor ${v.notebookEditor.document.uri.toString()}`);
                        }
                        return { notebookEditorId };
                    }
                    return v;
                })
            ], extHostCommands_1.ApiCommandResult.Void);
            this._commands.registerApiCommand(selectKernelApiCommand);
        }
        createNotebookController(extension, id, viewType, label, handler, preloads) {
            for (const data of this._kernelData.values()) {
                if (data.controller.id === id && extensions_1.ExtensionIdentifier.equals(extension.identifier, data.extensionId)) {
                    throw new Error(`notebook controller with id '${id}' ALREADY exist`);
                }
            }
            const handle = this._handlePool++;
            const that = this;
            this._logService.trace(`NotebookController[${handle}], CREATED by ${extension.identifier.value}, ${id}`);
            const _defaultExecutHandler = () => console.warn(`NO execute handler from notebook controller '${data.id}' of extension: '${extension.identifier}'`);
            let isDisposed = false;
            const commandDisposables = new lifecycle_1.DisposableStore();
            const onDidChangeSelection = new event_1.Emitter();
            const onDidReceiveMessage = new event_1.Emitter();
            const data = {
                id: createKernelId(extension.identifier, id),
                notebookType: viewType,
                extensionId: extension.identifier,
                extensionLocation: extension.extensionLocation,
                label: label || extension.identifier.value,
                preloads: preloads ? preloads.map(extHostTypeConverters.NotebookRendererScript.from) : []
            };
            //
            let _executeHandler = handler !== null && handler !== void 0 ? handler : _defaultExecutHandler;
            let _interruptHandler;
            this._proxy.$addKernel(handle, data).catch(err => {
                // this can happen when a kernel with that ID is already registered
                console.log(err);
                isDisposed = true;
            });
            // update: all setters write directly into the dto object
            // and trigger an update. the actual update will only happen
            // once per event loop execution
            let tokenPool = 0;
            const _update = () => {
                if (isDisposed) {
                    return;
                }
                const myToken = ++tokenPool;
                Promise.resolve().then(() => {
                    if (myToken === tokenPool) {
                        this._proxy.$updateKernel(handle, data);
                    }
                });
            };
            // notebook documents that are associated to this controller
            const associatedNotebooks = new map_1.ResourceMap();
            const controller = {
                get id() { return id; },
                get notebookType() { return data.notebookType; },
                onDidChangeSelectedNotebooks: onDidChangeSelection.event,
                get label() {
                    return data.label;
                },
                set label(value) {
                    var _a;
                    data.label = (_a = value !== null && value !== void 0 ? value : extension.displayName) !== null && _a !== void 0 ? _a : extension.name;
                    _update();
                },
                get detail() {
                    var _a;
                    return (_a = data.detail) !== null && _a !== void 0 ? _a : '';
                },
                set detail(value) {
                    data.detail = value;
                    _update();
                },
                get description() {
                    var _a;
                    return (_a = data.description) !== null && _a !== void 0 ? _a : '';
                },
                set description(value) {
                    data.description = value;
                    _update();
                },
                get kind() {
                    var _a;
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookControllerKind');
                    return (_a = data.kind) !== null && _a !== void 0 ? _a : '';
                },
                set kind(value) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookControllerKind');
                    data.kind = value;
                    _update();
                },
                get supportedLanguages() {
                    return data.supportedLanguages;
                },
                set supportedLanguages(value) {
                    data.supportedLanguages = value;
                    _update();
                },
                get supportsExecutionOrder() {
                    var _a;
                    return (_a = data.supportsExecutionOrder) !== null && _a !== void 0 ? _a : false;
                },
                set supportsExecutionOrder(value) {
                    data.supportsExecutionOrder = value;
                    _update();
                },
                get rendererScripts() {
                    return data.preloads ? data.preloads.map(extHostTypeConverters.NotebookRendererScript.to) : [];
                },
                get executeHandler() {
                    return _executeHandler;
                },
                set executeHandler(value) {
                    _executeHandler = value !== null && value !== void 0 ? value : _defaultExecutHandler;
                },
                get interruptHandler() {
                    return _interruptHandler;
                },
                set interruptHandler(value) {
                    _interruptHandler = value;
                    data.supportsInterrupt = Boolean(value);
                    _update();
                },
                createNotebookCellExecution(cell) {
                    if (isDisposed) {
                        throw new Error('notebook controller is DISPOSED');
                    }
                    if (!associatedNotebooks.has(cell.notebook.uri)) {
                        that._logService.trace(`NotebookController[${handle}] NOT associated to notebook, associated to THESE notebooks:`, Array.from(associatedNotebooks.keys()).map(u => u.toString()));
                        throw new Error(`notebook controller is NOT associated to notebook: ${cell.notebook.uri.toString()}`);
                    }
                    return that._createNotebookCellExecution(cell, createKernelId(extension.identifier, this.id));
                },
                dispose: () => {
                    if (!isDisposed) {
                        this._logService.trace(`NotebookController[${handle}], DISPOSED`);
                        isDisposed = true;
                        this._kernelData.delete(handle);
                        commandDisposables.dispose();
                        onDidChangeSelection.dispose();
                        onDidReceiveMessage.dispose();
                        this._proxy.$removeKernel(handle);
                    }
                },
                // --- priority
                updateNotebookAffinity(notebook, priority) {
                    that._proxy.$updateNotebookPriority(handle, notebook.uri, priority);
                },
                // --- ipc
                onDidReceiveMessage: onDidReceiveMessage.event,
                postMessage(message, editor) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookMessaging');
                    return that._proxy.$postMessage(handle, editor && that._extHostNotebook.getIdByEditor(editor), message);
                },
                asWebviewUri(uri) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookMessaging');
                    return (0, webview_1.asWebviewUri)(uri, that._initData.remote);
                },
            };
            this._kernelData.set(handle, {
                extensionId: extension.identifier,
                controller,
                onDidReceiveMessage,
                onDidChangeSelection,
                associatedNotebooks
            });
            return controller;
        }
        getIdByController(controller) {
            for (const [_, candidate] of this._kernelData) {
                if (candidate.controller === controller) {
                    return createKernelId(candidate.extensionId, controller.id);
                }
            }
            return null;
        }
        $acceptNotebookAssociation(handle, uri, value) {
            const obj = this._kernelData.get(handle);
            if (obj) {
                // update data structure
                const notebook = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
                if (value) {
                    obj.associatedNotebooks.set(notebook.uri, true);
                }
                else {
                    obj.associatedNotebooks.delete(notebook.uri);
                }
                this._logService.trace(`NotebookController[${handle}] ASSOCIATE notebook`, notebook.uri.toString(), value);
                // send event
                obj.onDidChangeSelection.fire({
                    selected: value,
                    notebook: notebook.apiNotebook
                });
            }
        }
        async $executeCells(handle, uri, handles) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            const cells = [];
            for (const cellHandle of handles) {
                const cell = document.getCell(cellHandle);
                if (cell) {
                    cells.push(cell.apiCell);
                }
            }
            try {
                this._logService.trace(`NotebookController[${handle}] EXECUTE cells`, document.uri.toString(), cells.length);
                await obj.controller.executeHandler.call(obj.controller, cells, document.apiNotebook, obj.controller);
            }
            catch (err) {
                //
                this._logService.error(`NotebookController[${handle}] execute cells FAILED`, err);
                console.error(err);
            }
        }
        async $cancelCells(handle, uri, handles) {
            var _a;
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            // cancel or interrupt depends on the controller. When an interrupt handler is used we
            // don't trigger the cancelation token of executions.
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            if (obj.controller.interruptHandler) {
                await obj.controller.interruptHandler.call(obj.controller, document.apiNotebook);
            }
            else {
                for (const cellHandle of handles) {
                    const cell = document.getCell(cellHandle);
                    if (cell) {
                        (_a = this._activeExecutions.get(cell.uri)) === null || _a === void 0 ? void 0 : _a.cancel();
                    }
                }
            }
        }
        $acceptKernelMessageFromRenderer(handle, editorId, message) {
            const obj = this._kernelData.get(handle);
            if (!obj) {
                // extension can dispose kernels in the meantime
                return;
            }
            const editor = this._extHostNotebook.getEditorById(editorId);
            obj.onDidReceiveMessage.fire(Object.freeze({ editor: editor.apiEditor, message }));
        }
        $cellExecutionChanged(uri, cellHandle, state) {
            const document = this._extHostNotebook.getNotebookDocument(uri_1.URI.revive(uri));
            const cell = document.getCell(cellHandle);
            if (cell) {
                this._onDidChangeCellExecutionState.fire({
                    cell: cell.apiCell,
                    state: state ? extHostTypeConverters.NotebookCellExecutionState.to(state) : extHostTypes_1.NotebookCellExecutionState.Idle
                });
            }
        }
        // ---
        _createNotebookCellExecution(cell, controllerId) {
            if (cell.index < 0) {
                throw new Error('CANNOT execute cell that has been REMOVED from notebook');
            }
            const notebook = this._extHostNotebook.getNotebookDocument(cell.notebook.uri);
            const cellObj = notebook.getCellFromApiCell(cell);
            if (!cellObj) {
                throw new Error('invalid cell');
            }
            if (this._activeExecutions.has(cellObj.uri)) {
                throw new Error(`duplicate execution for ${cellObj.uri}`);
            }
            const execution = new NotebookCellExecutionTask(controllerId, cellObj, this._proxy);
            this._activeExecutions.set(cellObj.uri, execution);
            const listener = execution.onDidChangeState(() => {
                if (execution.state === NotebookCellExecutionTaskState.Resolved) {
                    execution.dispose();
                    listener.dispose();
                    this._activeExecutions.delete(cellObj.uri);
                }
            });
            return execution.asApiObject();
        }
    };
    ExtHostNotebookKernels = __decorate([
        __param(4, log_1.ILogService)
    ], ExtHostNotebookKernels);
    exports.ExtHostNotebookKernels = ExtHostNotebookKernels;
    var NotebookCellExecutionTaskState;
    (function (NotebookCellExecutionTaskState) {
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Init"] = 0] = "Init";
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Started"] = 1] = "Started";
        NotebookCellExecutionTaskState[NotebookCellExecutionTaskState["Resolved"] = 2] = "Resolved";
    })(NotebookCellExecutionTaskState || (NotebookCellExecutionTaskState = {}));
    class NotebookCellExecutionTask extends lifecycle_1.Disposable {
        constructor(controllerId, _cell, _proxy) {
            super();
            this._cell = _cell;
            this._proxy = _proxy;
            this._handle = NotebookCellExecutionTask.HANDLE++;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._state = NotebookCellExecutionTaskState.Init;
            this._tokenSource = this._register(new cancellation_1.CancellationTokenSource());
            this._collector = new TimeoutBasedCollector(10, updates => this.update(updates));
            this._executionOrder = _cell.internalMetadata.executionOrder;
            this._proxy.$createExecution(this._handle, controllerId, this._cell.notebook.uri, this._cell.handle);
        }
        get state() { return this._state; }
        cancel() {
            this._tokenSource.cancel();
        }
        async updateSoon(update) {
            await this._collector.addItem(update);
        }
        async update(update) {
            const updates = Array.isArray(update) ? update : [update];
            return this._proxy.$updateExecution(this._handle, new proxyIdentifier_1.SerializableObjectWithBuffers(updates));
        }
        verifyStateForOutput() {
            if (this._state === NotebookCellExecutionTaskState.Init) {
                throw new Error('Must call start before modifying cell output');
            }
            if (this._state === NotebookCellExecutionTaskState.Resolved) {
                throw new Error('Cannot modify cell output after calling resolve');
            }
        }
        validateAndConvertOutputs(items) {
            return items.map(output => {
                const newOutput = extHostTypes_1.NotebookCellOutput.ensureUniqueMimeTypes(output.items, true);
                if (newOutput === output.items) {
                    return extHostTypeConverters.NotebookCellOutput.from(output);
                }
                return extHostTypeConverters.NotebookCellOutput.from({
                    items: newOutput,
                    id: output.id,
                    metadata: output.metadata
                });
            });
        }
        async updateOutputs(outputs, cell, append) {
            const outputDtos = this.validateAndConvertOutputs((0, arrays_1.asArray)(outputs));
            return this.updateSoon({
                editType: notebookExecutionService_1.CellExecutionUpdateType.Output,
                append,
                outputs: outputDtos
            });
        }
        async updateOutputItems(items, output, append) {
            items = extHostTypes_1.NotebookCellOutput.ensureUniqueMimeTypes((0, arrays_1.asArray)(items), true);
            return this.updateSoon({
                editType: notebookExecutionService_1.CellExecutionUpdateType.OutputItems,
                items: items.map(extHostTypeConverters.NotebookCellOutputItem.from),
                outputId: output.id,
                append
            });
        }
        asApiObject() {
            const that = this;
            const result = {
                get token() { return that._tokenSource.token; },
                get cell() { return that._cell.apiCell; },
                get executionOrder() { return that._executionOrder; },
                set executionOrder(v) {
                    that._executionOrder = v;
                    that.update([{
                            editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                            executionOrder: that._executionOrder
                        }]);
                },
                start(startTime) {
                    if (that._state === NotebookCellExecutionTaskState.Resolved || that._state === NotebookCellExecutionTaskState.Started) {
                        throw new Error('Cannot call start again');
                    }
                    that._state = NotebookCellExecutionTaskState.Started;
                    that._onDidChangeState.fire();
                    that.update({
                        editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                        runStartTime: startTime
                    });
                },
                end(success, endTime) {
                    if (that._state === NotebookCellExecutionTaskState.Resolved) {
                        throw new Error('Cannot call resolve twice');
                    }
                    that._state = NotebookCellExecutionTaskState.Resolved;
                    that._onDidChangeState.fire();
                    // The last update needs to be ordered correctly and applied immediately,
                    // so we use updateSoon and immediately flush.
                    that._collector.flush();
                    that._proxy.$completeExecution(that._handle, new proxyIdentifier_1.SerializableObjectWithBuffers({
                        runEndTime: endTime,
                        lastRunSuccess: success
                    }));
                },
                clearOutput(cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs([], cell, false);
                },
                appendOutput(outputs, cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs(outputs, cell, true);
                },
                replaceOutput(outputs, cell) {
                    that.verifyStateForOutput();
                    return that.updateOutputs(outputs, cell, false);
                },
                appendOutputItems(items, output) {
                    that.verifyStateForOutput();
                    return that.updateOutputItems(items, output, true);
                },
                replaceOutputItems(items, output) {
                    that.verifyStateForOutput();
                    return that.updateOutputItems(items, output, false);
                }
            };
            return Object.freeze(result);
        }
    }
    NotebookCellExecutionTask.HANDLE = 0;
    class TimeoutBasedCollector {
        constructor(delay, callback) {
            this.delay = delay;
            this.callback = callback;
            this.batch = [];
            this.startedTimer = Date.now();
        }
        addItem(item) {
            this.batch.push(item);
            if (!this.currentDeferred) {
                this.currentDeferred = new async_1.DeferredPromise();
                this.startedTimer = Date.now();
                (0, async_1.timeout)(this.delay).then(() => {
                    return this.flush();
                });
            }
            // This can be called by the extension repeatedly for a long time before the timeout is able to run.
            // Force a flush after the delay.
            if (Date.now() - this.startedTimer > this.delay) {
                return this.flush();
            }
            return this.currentDeferred.p;
        }
        flush() {
            if (this.batch.length === 0 || !this.currentDeferred) {
                return Promise.resolve();
            }
            const deferred = this.currentDeferred;
            this.currentDeferred = undefined;
            const batch = this.batch;
            this.batch = [];
            return this.callback(batch)
                .finally(() => deferred.complete());
        }
    }
    function createKernelId(extensionIdentifier, id) {
        return `${extensionIdentifier.value}/${id}`;
    }
    exports.createKernelId = createKernelId;
});
//# sourceMappingURL=extHostNotebookKernels.js.map