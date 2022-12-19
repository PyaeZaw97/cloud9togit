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
define(["require", "exports", "vs/base/common/event", "vs/base/common/idGenerator", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, event_1, idGenerator_1, log_1, extHost_protocol_1, extHostRpcService_1, typeConverters) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookEditors = void 0;
    class NotebookEditorDecorationType {
        constructor(proxy, options) {
            const key = NotebookEditorDecorationType._Keys.nextId();
            proxy.$registerNotebookEditorDecorationType(key, typeConverters.NotebookDecorationRenderOptions.from(options));
            this.value = {
                key,
                dispose() {
                    proxy.$removeNotebookEditorDecorationType(key);
                }
            };
        }
    }
    NotebookEditorDecorationType._Keys = new idGenerator_1.IdGenerator('NotebookEditorDecorationType');
    let ExtHostNotebookEditors = class ExtHostNotebookEditors {
        constructor(_logService, _extHostRpc, _notebooksAndEditors) {
            this._logService = _logService;
            this._extHostRpc = _extHostRpc;
            this._notebooksAndEditors = _notebooksAndEditors;
            this._onDidChangeNotebookEditorSelection = new event_1.Emitter();
            this._onDidChangeNotebookEditorVisibleRanges = new event_1.Emitter();
            this.onDidChangeNotebookEditorSelection = this._onDidChangeNotebookEditorSelection.event;
            this.onDidChangeNotebookEditorVisibleRanges = this._onDidChangeNotebookEditorVisibleRanges.event;
        }
        createNotebookEditorDecorationType(options) {
            return new NotebookEditorDecorationType(this._extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookEditors), options).value;
        }
        $acceptEditorPropertiesChanged(id, data) {
            this._logService.debug('ExtHostNotebook#$acceptEditorPropertiesChanged', id, data);
            const editor = this._notebooksAndEditors.getEditorById(id);
            // ONE: make all state updates
            if (data.visibleRanges) {
                editor._acceptVisibleRanges(data.visibleRanges.ranges.map(typeConverters.NotebookRange.to));
            }
            if (data.selections) {
                editor._acceptSelections(data.selections.selections.map(typeConverters.NotebookRange.to));
            }
            // TWO: send all events after states have been updated
            if (data.visibleRanges) {
                this._onDidChangeNotebookEditorVisibleRanges.fire({
                    notebookEditor: editor.apiEditor,
                    visibleRanges: editor.apiEditor.visibleRanges
                });
            }
            if (data.selections) {
                this._onDidChangeNotebookEditorSelection.fire(Object.freeze({
                    notebookEditor: editor.apiEditor,
                    selections: editor.apiEditor.selections
                }));
            }
        }
        $acceptEditorViewColumns(data) {
            for (const id in data) {
                const editor = this._notebooksAndEditors.getEditorById(id);
                editor._acceptViewColumn(typeConverters.ViewColumn.to(data[id]));
            }
        }
    };
    ExtHostNotebookEditors = __decorate([
        __param(0, log_1.ILogService),
        __param(1, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostNotebookEditors);
    exports.ExtHostNotebookEditors = ExtHostNotebookEditors;
});
//# sourceMappingURL=extHostNotebookEditors.js.map