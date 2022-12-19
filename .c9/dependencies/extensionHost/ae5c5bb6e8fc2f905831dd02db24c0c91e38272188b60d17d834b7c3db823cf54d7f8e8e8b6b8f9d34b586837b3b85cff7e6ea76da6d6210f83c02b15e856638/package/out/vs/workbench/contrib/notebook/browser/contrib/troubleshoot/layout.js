/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, lifecycle_1, actions_1, actions_2, notebookBrowser_1, notebookEditorExtensions_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TroubleshootController = void 0;
    class TroubleshootController extends lifecycle_1.Disposable {
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._cellStateListeners = [];
            this._logging = false;
            this._register(this._notebookEditor.onDidChangeModel(() => {
                this._localStore.clear();
                this._cellStateListeners.forEach(listener => listener.dispose());
                if (!this._notebookEditor.hasModel()) {
                    return;
                }
                this._updateListener();
            }));
            this._updateListener();
        }
        toggleLogging() {
            this._logging = !this._logging;
        }
        _log(cell, e) {
            if (this._logging) {
                const oldHeight = this._notebookEditor.getViewHeight(cell);
                console.log(`cell#${cell.handle}`, e, `${oldHeight} -> ${cell.layoutInfo.totalHeight}`);
            }
        }
        _updateListener() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                const cell = this._notebookEditor.cellAt(i);
                this._cellStateListeners.push(cell.onDidChangeLayout(e => {
                    this._log(cell, e);
                }));
            }
            this._localStore.add(this._notebookEditor.onDidChangeViewCells(e => {
                e.splices.reverse().forEach(splice => {
                    const [start, deleted, newCells] = splice;
                    const deletedCells = this._cellStateListeners.splice(start, deleted, ...newCells.map(cell => {
                        return cell.onDidChangeLayout((e) => {
                            this._log(cell, e);
                        });
                    }));
                    (0, lifecycle_1.dispose)(deletedCells);
                });
            }));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._cellStateListeners);
            super.dispose();
        }
    }
    exports.TroubleshootController = TroubleshootController;
    TroubleshootController.id = 'workbench.notebook.troubleshoot';
    (0, notebookEditorExtensions_1.registerNotebookContribution)(TroubleshootController.id, TroubleshootController);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLayoutTroubleshoot',
                title: 'Toggle Notebook Layout Troubleshoot',
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(TroubleshootController.id);
            controller === null || controller === void 0 ? void 0 : controller.toggleLogging();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.inspectLayout',
                title: 'Inspect Notebook Layout',
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor || !editor.hasModel()) {
                return;
            }
            for (let i = 0; i < editor.getLength(); i++) {
                const cell = editor.cellAt(i);
                console.log(`cell#${cell.handle}`, cell.layoutInfo);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.clearNotebookEdtitorTypeCache',
                title: 'Clear Notebook Editor Cache',
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            notebookService.clearEditorCache();
        }
    });
});
//# sourceMappingURL=layout.js.map