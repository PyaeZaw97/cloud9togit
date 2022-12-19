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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, async_1, lifecycle_1, accessibility_1, notebookBrowser_1, notebookEditorExtensions_1, notebookCommon_1, notebookRange_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookViewportContribution = class NotebookViewportContribution extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _notebookService, accessibilityService) {
            var _a;
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookService = _notebookService;
            this._warmupDocument = null;
            this._warmupViewport = new async_1.RunOnceScheduler(() => this._warmupViewportNow(), 200);
            this._register(this._warmupViewport);
            this._register(this._notebookEditor.onDidScroll(() => {
                this._warmupViewport.schedule();
            }));
            if (accessibilityService.isScreenReaderOptimized()) {
                this._warmupDocument = new async_1.RunOnceScheduler(() => this._warmupDocumentNow(), 200);
                this._register(this._warmupDocument);
                this._register(this._notebookEditor.onDidChangeModel(() => {
                    var _a;
                    if (this._notebookEditor.hasModel()) {
                        (_a = this._warmupDocument) === null || _a === void 0 ? void 0 : _a.schedule();
                    }
                }));
                if (this._notebookEditor.hasModel()) {
                    (_a = this._warmupDocument) === null || _a === void 0 ? void 0 : _a.schedule();
                }
            }
        }
        _warmupDocumentNow() {
            if (this._notebookEditor.hasModel()) {
                for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                    const cell = this._notebookEditor.cellAt(i);
                    if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Markup && (cell === null || cell === void 0 ? void 0 : cell.getEditState()) === notebookBrowser_1.CellEditState.Preview && !cell.isInputCollapsed) {
                        // TODO@rebornix currently we disable markdown cell rendering in webview for accessibility
                        // this._notebookEditor.createMarkupPreview(cell);
                    }
                    else if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Code) {
                        this._renderCell(cell);
                    }
                }
            }
        }
        _warmupViewportNow() {
            if (this._notebookEditor.isDisposed) {
                return;
            }
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const visibleRanges = this._notebookEditor.getVisibleRangesPlusViewportBelow();
            (0, notebookRange_1.cellRangesToIndexes)(visibleRanges).forEach(index => {
                const cell = this._notebookEditor.cellAt(index);
                if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Markup && (cell === null || cell === void 0 ? void 0 : cell.getEditState()) === notebookBrowser_1.CellEditState.Preview && !cell.isInputCollapsed) {
                    this._notebookEditor.createMarkupPreview(cell);
                }
                else if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Code) {
                    this._renderCell(cell);
                }
            });
        }
        _renderCell(viewCell) {
            if (viewCell.isOutputCollapsed) {
                return;
            }
            const outputs = viewCell.outputsViewModels;
            for (const output of outputs) {
                const [mimeTypes, pick] = output.resolveMimeTypes(this._notebookEditor.textModel, undefined);
                if (!mimeTypes.find(mimeType => mimeType.isTrusted) || mimeTypes.length === 0) {
                    continue;
                }
                const pickedMimeTypeRenderer = mimeTypes[pick];
                if (!pickedMimeTypeRenderer) {
                    return;
                }
                if (!this._notebookEditor.hasModel()) {
                    return;
                }
                const renderer = this._notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId);
                if (!renderer) {
                    return;
                }
                const result = { type: 1 /* RenderOutputType.Extension */, renderer, source: output, mimeType: pickedMimeTypeRenderer.mimeType };
                this._notebookEditor.createOutput(viewCell, result, 0);
            }
        }
    };
    NotebookViewportContribution.id = 'workbench.notebook.viewportCustomMarkdown';
    NotebookViewportContribution = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, accessibility_1.IAccessibilityService)
    ], NotebookViewportContribution);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookViewportContribution.id, NotebookViewportContribution);
});
//# sourceMappingURL=viewportCustomMarkdown.js.map