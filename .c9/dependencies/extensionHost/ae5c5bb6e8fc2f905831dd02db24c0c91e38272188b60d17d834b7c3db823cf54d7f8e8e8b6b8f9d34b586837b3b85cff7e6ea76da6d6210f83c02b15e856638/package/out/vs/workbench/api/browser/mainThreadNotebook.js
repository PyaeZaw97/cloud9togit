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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/extensions/common/proxyIdentifier", "../common/extHost.protocol", "vs/platform/log/common/log", "vs/base/common/stopwatch", "vs/platform/commands/common/commands", "vs/base/common/types"], function (require, exports, buffer_1, cancellation_1, event_1, lifecycle_1, mainThreadNotebookDto_1, extHostCustomers_1, notebookCellStatusBarService_1, notebookService_1, proxyIdentifier_1, extHost_protocol_1, log_1, stopwatch_1, commands_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebooks = void 0;
    let MainThreadNotebooks = class MainThreadNotebooks {
        constructor(extHostContext, _notebookService, _cellStatusBarService, _logService) {
            this._notebookService = _notebookService;
            this._cellStatusBarService = _cellStatusBarService;
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._notebookProviders = new Map();
            this._notebookSerializer = new Map();
            this._notebookCellStatusBarRegistrations = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
        }
        dispose() {
            this._disposables.dispose();
            // remove all notebook providers
            for (const item of this._notebookProviders.values()) {
                item.disposable.dispose();
            }
            (0, lifecycle_1.dispose)(this._notebookSerializer.values());
        }
        async $registerNotebookProvider(extension, viewType, options, data) {
            let contentOptions = Object.assign({}, options);
            const controller = {
                get options() {
                    return contentOptions;
                },
                set options(newOptions) {
                    contentOptions.transientCellMetadata = newOptions.transientCellMetadata;
                    contentOptions.transientDocumentMetadata = newOptions.transientDocumentMetadata;
                    contentOptions.transientOutputs = newOptions.transientOutputs;
                },
                open: async (uri, backupId, untitledDocumentData, token) => {
                    const data = await this._proxy.$openNotebook(viewType, uri, backupId, untitledDocumentData, token);
                    return {
                        data: mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(data.value),
                        transientOptions: contentOptions
                    };
                },
                save: async (uri, token) => {
                    return this._proxy.$saveNotebook(viewType, uri, token);
                },
                saveAs: async (uri, target, token) => {
                    return this._proxy.$saveNotebookAs(viewType, uri, target, token);
                },
                backup: async (uri, token) => {
                    return this._proxy.$backupNotebook(viewType, uri, token);
                }
            };
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(this._notebookService.registerNotebookController(viewType, extension, controller));
            if (data) {
                disposable.add(this._notebookService.registerContributedNotebookType(viewType, data));
            }
            this._notebookProviders.set(viewType, { controller, disposable });
        }
        async $updateNotebookProviderOptions(viewType, options) {
            const provider = this._notebookProviders.get(viewType);
            if (provider && options) {
                provider.controller.options = options;
                this._notebookService.listNotebookDocuments().forEach(document => {
                    if (document.viewType === viewType) {
                        document.transientOptions = provider.controller.options;
                    }
                });
            }
        }
        async $unregisterNotebookProvider(viewType) {
            const entry = this._notebookProviders.get(viewType);
            if (entry) {
                entry.disposable.dispose();
                this._notebookProviders.delete(viewType);
            }
        }
        $registerNotebookSerializer(handle, extension, viewType, options, data) {
            const registration = this._notebookService.registerNotebookSerializer(viewType, extension, {
                options,
                dataToNotebook: async (data) => {
                    const sw = new stopwatch_1.StopWatch(true);
                    const dto = await this._proxy.$dataToNotebook(handle, data, cancellation_1.CancellationToken.None);
                    const result = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(dto.value);
                    this._logService.trace('[NotebookSerializer] dataToNotebook DONE', extension.id, sw.elapsed());
                    return result;
                },
                notebookToData: (data) => {
                    const sw = new stopwatch_1.StopWatch(true);
                    const result = this._proxy.$notebookToData(handle, new proxyIdentifier_1.SerializableObjectWithBuffers(mainThreadNotebookDto_1.NotebookDto.toNotebookDataDto(data)), cancellation_1.CancellationToken.None);
                    this._logService.trace('[NotebookSerializer] notebookToData DONE', extension.id, sw.elapsed());
                    return result;
                }
            });
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registration);
            if (data) {
                disposables.add(this._notebookService.registerContributedNotebookType(viewType, data));
            }
            this._notebookSerializer.set(handle, disposables);
        }
        $unregisterNotebookSerializer(handle) {
            var _a;
            (_a = this._notebookSerializer.get(handle)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._notebookSerializer.delete(handle);
        }
        $emitCellStatusBarEvent(eventHandle) {
            const emitter = this._notebookCellStatusBarRegistrations.get(eventHandle);
            if (emitter instanceof event_1.Emitter) {
                emitter.fire(undefined);
            }
        }
        async $registerNotebookCellStatusBarItemProvider(handle, eventHandle, viewType) {
            const that = this;
            const provider = {
                async provideCellStatusBarItems(uri, index, token) {
                    var _a;
                    const result = await that._proxy.$provideNotebookCellStatusBarItems(handle, uri, index, token);
                    return {
                        items: (_a = result === null || result === void 0 ? void 0 : result.items) !== null && _a !== void 0 ? _a : [],
                        dispose() {
                            if (result) {
                                that._proxy.$releaseNotebookCellStatusBarItems(result.cacheId);
                            }
                        }
                    };
                },
                viewType
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._notebookCellStatusBarRegistrations.set(eventHandle, emitter);
                provider.onDidChangeStatusBarItems = emitter.event;
            }
            const disposable = this._cellStatusBarService.registerCellStatusBarItemProvider(provider);
            this._notebookCellStatusBarRegistrations.set(handle, disposable);
        }
        async $unregisterNotebookCellStatusBarItemProvider(handle, eventHandle) {
            const unregisterThing = (handle) => {
                var _a;
                const entry = this._notebookCellStatusBarRegistrations.get(handle);
                if (entry) {
                    (_a = this._notebookCellStatusBarRegistrations.get(handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._notebookCellStatusBarRegistrations.delete(handle);
                }
            };
            unregisterThing(handle);
            if (typeof eventHandle === 'number') {
                unregisterThing(eventHandle);
            }
        }
    };
    MainThreadNotebooks = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebook),
        __param(1, notebookService_1.INotebookService),
        __param(2, notebookCellStatusBarService_1.INotebookCellStatusBarService),
        __param(3, log_1.ILogService)
    ], MainThreadNotebooks);
    exports.MainThreadNotebooks = MainThreadNotebooks;
    commands_1.CommandsRegistry.registerCommand('_executeDataToNotebook', async (accessor, ...args) => {
        const [notebookType, bytes] = args;
        (0, types_1.assertType)(typeof notebookType === 'string', 'string');
        (0, types_1.assertType)(bytes instanceof buffer_1.VSBuffer, 'VSBuffer');
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const info = await notebookService.withNotebookDataProvider(notebookType);
        if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
            return;
        }
        const dto = await info.serializer.dataToNotebook(bytes);
        return new proxyIdentifier_1.SerializableObjectWithBuffers(mainThreadNotebookDto_1.NotebookDto.toNotebookDataDto(dto));
    });
    commands_1.CommandsRegistry.registerCommand('_executeNotebookToData', async (accessor, ...args) => {
        const [notebookType, dto] = args;
        (0, types_1.assertType)(typeof notebookType === 'string', 'string');
        (0, types_1.assertType)(typeof dto === 'object');
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const info = await notebookService.withNotebookDataProvider(notebookType);
        if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
            return;
        }
        const data = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(dto.value);
        const bytes = await info.serializer.notebookToData(data);
        return bytes;
    });
});
//# sourceMappingURL=mainThreadNotebook.js.map