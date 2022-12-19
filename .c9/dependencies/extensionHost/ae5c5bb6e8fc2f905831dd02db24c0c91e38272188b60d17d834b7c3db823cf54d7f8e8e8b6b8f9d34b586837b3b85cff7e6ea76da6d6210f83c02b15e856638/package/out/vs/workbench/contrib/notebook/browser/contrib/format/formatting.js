/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/contrib/format/browser/format", "vs/editor/common/services/editorWorker", "vs/base/common/cancellation", "vs/editor/browser/services/bulkEditService", "vs/editor/common/editorContextKeys", "vs/editor/browser/editorExtensions", "vs/platform/progress/common/progress", "vs/editor/common/services/languageFeatures"], function (require, exports, actions_1, contextkey_1, nls_1, notebookContextKeys_1, notebookBrowser_1, instantiation_1, coreActions_1, editorService_1, resolverService_1, lifecycle_1, format_1, editorWorker_1, cancellation_1, bulkEditService_1, editorContextKeys_1, editorExtensions_1, progress_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // format notebook
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.format',
                title: { value: (0, nls_1.localize)('format.title', "Format Notebook"), original: 'Format Notebook' },
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated(),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                f1: true,
                menu: {
                    id: actions_1.MenuId.EditorContext,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.inCompositeEditor, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorWorkerService = accessor.get(editorWorker_1.IEditorWorkerService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const notebook = editor.textModel;
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    const ref = await textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(editorWorkerService, languageFeaturesService, model, model.getOptions(), cancellation_1.CancellationToken.None);
                    const edits = [];
                    if (formatEdits) {
                        for (let edit of formatEdits) {
                            edits.push(new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId()));
                        }
                        return edits;
                    }
                    return [];
                }));
                await bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('label', "Format Notebook"), code: 'undoredo.formatNotebook', });
            }
            finally {
                disposable.dispose();
            }
        }
    });
    // format cell
    (0, editorExtensions_1.registerEditorAction)(class FormatCellAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'notebook.formatCell',
                label: (0, nls_1.localize)('formatCell.label', "Format Cell"),
                alias: 'Format Cell',
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, editorContextKeys_1.EditorContextKeys.inCompositeEditor, editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.301
                }
            });
        }
        async run(accessor, editor) {
            if (editor.hasModel()) {
                const instaService = accessor.get(instantiation_1.IInstantiationService);
                await instaService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editor, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            }
        }
    });
});
//# sourceMappingURL=formatting.js.map