/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/workbench/api/common/cache", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/proxyIdentifier", "./extHostNotebookDocument", "./extHostNotebookEditor"], function (require, exports, buffer_1, event_1, hash_1, lifecycle_1, map_1, strings_1, types_1, uri_1, cache_1, extHost_protocol_1, extHostCommands_1, typeConverters, extHostTypes, proxyIdentifier_1, extHostNotebookDocument_1, extHostNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookController = void 0;
    class ExtHostNotebookController {
        constructor(mainContext, commands, _textDocumentsAndEditors, _textDocuments, _extensionStoragePaths) {
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._textDocuments = _textDocuments;
            this._extensionStoragePaths = _extensionStoragePaths;
            this._notebookContentProviders = new Map();
            this._notebookStatusBarItemProviders = new Map();
            this._documents = new map_1.ResourceMap();
            this._editors = new Map();
            this._onDidChangeActiveNotebookEditor = new event_1.Emitter();
            this.onDidChangeActiveNotebookEditor = this._onDidChangeActiveNotebookEditor.event;
            this._visibleNotebookEditors = [];
            this._onDidOpenNotebookDocument = new event_1.Emitter();
            this.onDidOpenNotebookDocument = this._onDidOpenNotebookDocument.event;
            this._onDidCloseNotebookDocument = new event_1.Emitter();
            this.onDidCloseNotebookDocument = this._onDidCloseNotebookDocument.event;
            this._onDidChangeVisibleNotebookEditors = new event_1.Emitter();
            this.onDidChangeVisibleNotebookEditors = this._onDidChangeVisibleNotebookEditors.event;
            this._statusBarCache = new cache_1.Cache('NotebookCellStatusBarCache');
            // --- serialize/deserialize
            this._handlePool = 0;
            this._notebookSerializer = new Map();
            this._backupIdPool = 0;
            this._notebookProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebook);
            this._notebookDocumentsProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookDocuments);
            this._notebookEditorsProxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookEditors);
            this._commandsConverter = commands.converter;
            commands.registerArgumentProcessor({
                // Serialized INotebookCellActionContext
                processArgument: (arg) => {
                    var _a;
                    if (arg && arg.$mid === 12 /* MarshalledId.NotebookCellActionContext */) {
                        const notebookUri = (_a = arg.notebookEditor) === null || _a === void 0 ? void 0 : _a.notebookUri;
                        const cellHandle = arg.cell.handle;
                        const data = this._documents.get(notebookUri);
                        const cell = data === null || data === void 0 ? void 0 : data.getCell(cellHandle);
                        if (cell) {
                            return cell.apiCell;
                        }
                    }
                    return arg;
                }
            });
            ExtHostNotebookController._registerApiCommands(commands);
        }
        get activeNotebookEditor() {
            var _a;
            return (_a = this._activeNotebookEditor) === null || _a === void 0 ? void 0 : _a.apiEditor;
        }
        get visibleNotebookEditors() {
            return this._visibleNotebookEditors.map(editor => editor.apiEditor);
        }
        getEditorById(editorId) {
            const editor = this._editors.get(editorId);
            if (!editor) {
                throw new Error(`unknown text editor: ${editorId}. known editors: ${[...this._editors.keys()]} `);
            }
            return editor;
        }
        getIdByEditor(editor) {
            for (const [id, candidate] of this._editors) {
                if (candidate.apiEditor === editor) {
                    return id;
                }
            }
            return undefined;
        }
        get notebookDocuments() {
            return [...this._documents.values()];
        }
        getNotebookDocument(uri, relaxed) {
            const result = this._documents.get(uri);
            if (!result && !relaxed) {
                throw new Error(`NO notebook document for '${uri}'`);
            }
            return result;
        }
        _getProviderData(viewType) {
            const result = this._notebookContentProviders.get(viewType);
            if (!result) {
                throw new Error(`NO provider for '${viewType}'`);
            }
            return result;
        }
        registerNotebookContentProvider(extension, viewType, provider, options, registration) {
            if ((0, strings_1.isFalsyOrWhitespace)(viewType)) {
                throw new Error(`viewType cannot be empty or just whitespace`);
            }
            if (this._notebookContentProviders.has(viewType)) {
                throw new Error(`Notebook provider for '${viewType}' already registered`);
            }
            this._notebookContentProviders.set(viewType, { extension, provider });
            let listener;
            if (provider.onDidChangeNotebookContentOptions) {
                listener = provider.onDidChangeNotebookContentOptions(() => {
                    const internalOptions = typeConverters.NotebookDocumentContentOptions.from(provider.options);
                    this._notebookProxy.$updateNotebookProviderOptions(viewType, internalOptions);
                });
            }
            this._notebookProxy.$registerNotebookProvider({ id: extension.identifier, location: extension.extensionLocation }, viewType, typeConverters.NotebookDocumentContentOptions.from(options), ExtHostNotebookController._convertNotebookRegistrationData(extension, registration));
            return new extHostTypes.Disposable(() => {
                listener === null || listener === void 0 ? void 0 : listener.dispose();
                this._notebookContentProviders.delete(viewType);
                this._notebookProxy.$unregisterNotebookProvider(viewType);
            });
        }
        static _convertNotebookRegistrationData(extension, registration) {
            if (!registration) {
                return;
            }
            const viewOptionsFilenamePattern = registration.filenamePattern
                .map(pattern => typeConverters.NotebookExclusiveDocumentPattern.from(pattern))
                .filter(pattern => pattern !== undefined);
            if (registration.filenamePattern && !viewOptionsFilenamePattern) {
                console.warn(`Notebook content provider view options file name pattern is invalid ${registration.filenamePattern}`);
                return undefined;
            }
            return {
                extension: extension.identifier,
                providerDisplayName: extension.displayName || extension.name,
                displayName: registration.displayName,
                filenamePattern: viewOptionsFilenamePattern,
                exclusive: registration.exclusive || false
            };
        }
        registerNotebookCellStatusBarItemProvider(extension, notebookType, provider) {
            const handle = ExtHostNotebookController._notebookStatusBarItemProviderHandlePool++;
            const eventHandle = typeof provider.onDidChangeCellStatusBarItems === 'function' ? ExtHostNotebookController._notebookStatusBarItemProviderHandlePool++ : undefined;
            this._notebookStatusBarItemProviders.set(handle, provider);
            this._notebookProxy.$registerNotebookCellStatusBarItemProvider(handle, eventHandle, notebookType);
            let subscription;
            if (eventHandle !== undefined) {
                subscription = provider.onDidChangeCellStatusBarItems(_ => this._notebookProxy.$emitCellStatusBarEvent(eventHandle));
            }
            return new extHostTypes.Disposable(() => {
                this._notebookStatusBarItemProviders.delete(handle);
                this._notebookProxy.$unregisterNotebookCellStatusBarItemProvider(handle, eventHandle);
                if (subscription) {
                    subscription.dispose();
                }
            });
        }
        async createNotebookDocument(options) {
            const canonicalUri = await this._notebookDocumentsProxy.$tryCreateNotebook({
                viewType: options.viewType,
                content: options.content && typeConverters.NotebookData.from(options.content)
            });
            return uri_1.URI.revive(canonicalUri);
        }
        async openNotebookDocument(uri) {
            const cached = this._documents.get(uri);
            if (cached) {
                return cached.apiNotebook;
            }
            const canonicalUri = await this._notebookDocumentsProxy.$tryOpenNotebook(uri);
            const document = this._documents.get(uri_1.URI.revive(canonicalUri));
            return (0, types_1.assertIsDefined)(document === null || document === void 0 ? void 0 : document.apiNotebook);
        }
        async showNotebookDocument(notebookOrUri, options) {
            var _a;
            if (uri_1.URI.isUri(notebookOrUri)) {
                notebookOrUri = await this.openNotebookDocument(notebookOrUri);
            }
            let resolvedOptions;
            if (typeof options === 'object') {
                resolvedOptions = {
                    position: typeConverters.ViewColumn.from(options.viewColumn),
                    preserveFocus: options.preserveFocus,
                    selections: options.selections && options.selections.map(typeConverters.NotebookRange.from),
                    pinned: typeof options.preview === 'boolean' ? !options.preview : undefined
                };
            }
            else {
                resolvedOptions = {
                    preserveFocus: false
                };
            }
            const editorId = await this._notebookEditorsProxy.$tryShowNotebookDocument(notebookOrUri.uri, notebookOrUri.notebookType, resolvedOptions);
            const editor = editorId && ((_a = this._editors.get(editorId)) === null || _a === void 0 ? void 0 : _a.apiEditor);
            if (editor) {
                return editor;
            }
            if (editorId) {
                throw new Error(`Could NOT open editor for "${notebookOrUri.uri.toString()}" because another editor opened in the meantime.`);
            }
            else {
                throw new Error(`Could NOT open editor for "${notebookOrUri.uri.toString()}".`);
            }
        }
        async $provideNotebookCellStatusBarItems(handle, uri, index, token) {
            const provider = this._notebookStatusBarItemProviders.get(handle);
            const revivedUri = uri_1.URI.revive(uri);
            const document = this._documents.get(revivedUri);
            if (!document || !provider) {
                return;
            }
            const cell = document.getCellFromIndex(index);
            if (!cell) {
                return;
            }
            const result = await provider.provideCellStatusBarItems(cell.apiCell, token);
            if (!result) {
                return undefined;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const cacheId = this._statusBarCache.add([disposables]);
            const resultArr = Array.isArray(result) ? result : [result];
            const items = resultArr.map(item => typeConverters.NotebookStatusBarItem.from(item, this._commandsConverter, disposables));
            return {
                cacheId,
                items
            };
        }
        $releaseNotebookCellStatusBarItems(cacheId) {
            this._statusBarCache.delete(cacheId);
        }
        registerNotebookSerializer(extension, viewType, serializer, options, registration) {
            if ((0, strings_1.isFalsyOrWhitespace)(viewType)) {
                throw new Error(`viewType cannot be empty or just whitespace`);
            }
            const handle = this._handlePool++;
            this._notebookSerializer.set(handle, serializer);
            this._notebookProxy.$registerNotebookSerializer(handle, { id: extension.identifier, location: extension.extensionLocation }, viewType, typeConverters.NotebookDocumentContentOptions.from(options), ExtHostNotebookController._convertNotebookRegistrationData(extension, registration));
            return (0, lifecycle_1.toDisposable)(() => {
                this._notebookProxy.$unregisterNotebookSerializer(handle);
            });
        }
        async $dataToNotebook(handle, bytes, token) {
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const data = await serializer.deserializeNotebook(bytes.buffer, token);
            return new proxyIdentifier_1.SerializableObjectWithBuffers(typeConverters.NotebookData.from(data));
        }
        async $notebookToData(handle, data, token) {
            const serializer = this._notebookSerializer.get(handle);
            if (!serializer) {
                throw new Error('NO serializer found');
            }
            const bytes = await serializer.serializeNotebook(typeConverters.NotebookData.to(data.value), token);
            return buffer_1.VSBuffer.wrap(bytes);
        }
        // --- open, save, saveAs, backup
        async $openNotebook(viewType, uri, backupId, untitledDocumentData, token) {
            var _a;
            const { provider } = this._getProviderData(viewType);
            const data = await provider.openNotebook(uri_1.URI.revive(uri), { backupId, untitledDocumentData: untitledDocumentData === null || untitledDocumentData === void 0 ? void 0 : untitledDocumentData.buffer }, token);
            return new proxyIdentifier_1.SerializableObjectWithBuffers({
                metadata: (_a = data.metadata) !== null && _a !== void 0 ? _a : Object.create(null),
                cells: data.cells.map(typeConverters.NotebookCellData.from),
            });
        }
        async $saveNotebook(viewType, uri, token) {
            const document = this.getNotebookDocument(uri_1.URI.revive(uri));
            const { provider } = this._getProviderData(viewType);
            await provider.saveNotebook(document.apiNotebook, token);
            return true;
        }
        async $saveNotebookAs(viewType, uri, target, token) {
            const document = this.getNotebookDocument(uri_1.URI.revive(uri));
            const { provider } = this._getProviderData(viewType);
            await provider.saveNotebookAs(uri_1.URI.revive(target), document.apiNotebook, token);
            return true;
        }
        async $backupNotebook(viewType, uri, cancellation) {
            var _a;
            const document = this.getNotebookDocument(uri_1.URI.revive(uri));
            const provider = this._getProviderData(viewType);
            const storagePath = (_a = this._extensionStoragePaths.workspaceValue(provider.extension)) !== null && _a !== void 0 ? _a : this._extensionStoragePaths.globalValue(provider.extension);
            const fileName = String((0, hash_1.hash)([document.uri.toString(), this._backupIdPool++]));
            const backupUri = uri_1.URI.joinPath(storagePath, fileName);
            const backup = await provider.provider.backupNotebook(document.apiNotebook, { destination: backupUri }, cancellation);
            document.updateBackup(backup);
            return backup.id;
        }
        _createExtHostEditor(document, editorId, data) {
            if (this._editors.has(editorId)) {
                throw new Error(`editor with id ALREADY EXSIST: ${editorId}`);
            }
            const editor = new extHostNotebookEditor_1.ExtHostNotebookEditor(editorId, this._notebookEditorsProxy, document, data.visibleRanges.map(typeConverters.NotebookRange.to), data.selections.map(typeConverters.NotebookRange.to), typeof data.viewColumn === 'number' ? typeConverters.ViewColumn.to(data.viewColumn) : undefined);
            this._editors.set(editorId, editor);
        }
        $acceptDocumentAndEditorsDelta(delta) {
            var _a, _b, _c;
            if (delta.value.removedDocuments) {
                for (const uri of delta.value.removedDocuments) {
                    const revivedUri = uri_1.URI.revive(uri);
                    const document = this._documents.get(revivedUri);
                    if (document) {
                        document.dispose();
                        this._documents.delete(revivedUri);
                        this._textDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ removedDocuments: document.apiNotebook.getCells().map(cell => cell.document.uri) });
                        this._onDidCloseNotebookDocument.fire(document.apiNotebook);
                    }
                    for (const editor of this._editors.values()) {
                        if (editor.notebookData.uri.toString() === revivedUri.toString()) {
                            this._editors.delete(editor.id);
                        }
                    }
                }
            }
            if (delta.value.addedDocuments) {
                const addedCellDocuments = [];
                for (const modelData of delta.value.addedDocuments) {
                    const uri = uri_1.URI.revive(modelData.uri);
                    if (this._documents.has(uri)) {
                        throw new Error(`adding EXISTING notebook ${uri} `);
                    }
                    const document = new extHostNotebookDocument_1.ExtHostNotebookDocument(this._notebookDocumentsProxy, this._textDocumentsAndEditors, this._textDocuments, uri, modelData);
                    // add cell document as vscode.TextDocument
                    addedCellDocuments.push(...modelData.cells.map(cell => extHostNotebookDocument_1.ExtHostCell.asModelAddData(document.apiNotebook, cell)));
                    (_a = this._documents.get(uri)) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._documents.set(uri, document);
                    this._textDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({ addedDocuments: addedCellDocuments });
                    this._onDidOpenNotebookDocument.fire(document.apiNotebook);
                }
            }
            if (delta.value.addedEditors) {
                for (const editorModelData of delta.value.addedEditors) {
                    if (this._editors.has(editorModelData.id)) {
                        return;
                    }
                    const revivedUri = uri_1.URI.revive(editorModelData.documentUri);
                    const document = this._documents.get(revivedUri);
                    if (document) {
                        this._createExtHostEditor(document, editorModelData.id, editorModelData);
                    }
                }
            }
            const removedEditors = [];
            if (delta.value.removedEditors) {
                for (const editorid of delta.value.removedEditors) {
                    const editor = this._editors.get(editorid);
                    if (editor) {
                        this._editors.delete(editorid);
                        if (((_b = this._activeNotebookEditor) === null || _b === void 0 ? void 0 : _b.id) === editor.id) {
                            this._activeNotebookEditor = undefined;
                        }
                        removedEditors.push(editor);
                    }
                }
            }
            if (delta.value.visibleEditors) {
                this._visibleNotebookEditors = delta.value.visibleEditors.map(id => this._editors.get(id)).filter(editor => !!editor);
                const visibleEditorsSet = new Set();
                this._visibleNotebookEditors.forEach(editor => visibleEditorsSet.add(editor.id));
                for (const editor of this._editors.values()) {
                    const newValue = visibleEditorsSet.has(editor.id);
                    editor._acceptVisibility(newValue);
                }
                this._visibleNotebookEditors = [...this._editors.values()].map(e => e).filter(e => e.visible);
                this._onDidChangeVisibleNotebookEditors.fire(this.visibleNotebookEditors);
            }
            if (delta.value.newActiveEditor === null) {
                // clear active notebook as current active editor is non-notebook editor
                this._activeNotebookEditor = undefined;
            }
            else if (delta.value.newActiveEditor) {
                this._activeNotebookEditor = this._editors.get(delta.value.newActiveEditor);
            }
            if (delta.value.newActiveEditor !== undefined) {
                this._onDidChangeActiveNotebookEditor.fire((_c = this._activeNotebookEditor) === null || _c === void 0 ? void 0 : _c.apiEditor);
            }
        }
        static _registerApiCommands(extHostCommands) {
            const notebookTypeArg = extHostCommands_1.ApiCommandArgument.String.with('notebookType', 'A notebook type');
            const commandDataToNotebook = new extHostCommands_1.ApiCommand('vscode.executeDataToNotebook', '_executeDataToNotebook', 'Invoke notebook serializer', [notebookTypeArg, new extHostCommands_1.ApiCommandArgument('data', 'Bytes to convert to data', v => v instanceof Uint8Array, v => buffer_1.VSBuffer.wrap(v))], new extHostCommands_1.ApiCommandResult('Notebook Data', data => typeConverters.NotebookData.to(data.value)));
            const commandNotebookToData = new extHostCommands_1.ApiCommand('vscode.executeNotebookToData', '_executeNotebookToData', 'Invoke notebook serializer', [notebookTypeArg, new extHostCommands_1.ApiCommandArgument('NotebookData', 'Notebook data to convert to bytes', v => true, v => new proxyIdentifier_1.SerializableObjectWithBuffers(typeConverters.NotebookData.from(v)))], new extHostCommands_1.ApiCommandResult('Bytes', dto => dto.buffer));
            extHostCommands.registerApiCommand(commandDataToNotebook);
            extHostCommands.registerApiCommand(commandNotebookToData);
        }
    }
    exports.ExtHostNotebookController = ExtHostNotebookController;
    ExtHostNotebookController._notebookStatusBarItemProviderHandlePool = 0;
});
//# sourceMappingURL=extHostNotebook.js.map