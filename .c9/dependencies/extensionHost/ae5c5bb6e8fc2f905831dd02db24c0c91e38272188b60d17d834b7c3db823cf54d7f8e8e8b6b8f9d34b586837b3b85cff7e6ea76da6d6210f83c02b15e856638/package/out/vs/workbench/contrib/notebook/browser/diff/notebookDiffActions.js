/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contextkeys", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/diff/notebookTextDiffEditor", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/editor/common/editor"], function (require, exports, bulkEditService_1, nls_1, actions_1, configuration_1, contextkey_1, contextkeys_1, editorGroupColumn_1, notebookDiffEditorBrowser_1, notebookTextDiffEditor_1, notebookIcons_1, editorGroupsService_1, editorService_1, platform_1, configurationRegistry_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.switchToText',
                icon: notebookIcons_1.openAsTextIcon,
                title: { value: (0, nls_1.localize)('notebook.diff.switchToText', "Open Text Diff Editor"), original: 'Open Text Diff Editor' },
                precondition: contextkeys_1.ActiveEditorContext.isEqualTo(notebookTextDiffEditor_1.NotebookTextDiffEditor.ID),
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'navigation',
                        when: contextkeys_1.ActiveEditorContext.isEqualTo(notebookTextDiffEditor_1.NotebookTextDiffEditor.ID)
                    }]
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const activeEditor = editorService.activeEditorPane;
            if (activeEditor && activeEditor instanceof notebookTextDiffEditor_1.NotebookTextDiffEditor) {
                const diffEditorInput = activeEditor.input;
                await editorService.openEditor({
                    original: { resource: diffEditorInput.original.resource },
                    modified: { resource: diffEditorInput.resource },
                    label: diffEditorInput.getName(),
                    options: {
                        preserveFocus: false,
                        override: editor_1.EditorResolution.DISABLED
                    }
                }, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, undefined));
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.revertMetadata',
                title: (0, nls_1.localize)('notebook.diff.cell.revertMetadata', "Revert Metadata"),
                icon: notebookIcons_1.revertIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellMetadataTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
                },
                precondition: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            const original = context.cell.original;
            const modified = context.cell.modified;
            if (!original || !modified) {
                return;
            }
            modified.textModel.metadata = original.metadata;
        }
    });
    // registerAction2(class extends Action2 {
    // 	constructor() {
    // 		super(
    // 			{
    // 				id: 'notebook.diff.cell.switchOutputRenderingStyle',
    // 				title: localize('notebook.diff.cell.switchOutputRenderingStyle', "Switch Outputs Rendering"),
    // 				icon: renderOutputIcon,
    // 				f1: false,
    // 				menu: {
    // 					id: MenuId.NotebookDiffCellOutputsTitle
    // 				}
    // 			}
    // 		);
    // 	}
    // 	run(accessor: ServicesAccessor, context?: { cell: DiffElementViewModelBase }) {
    // 		if (!context) {
    // 			return;
    // 		}
    // 		context.cell.renderOutput = true;
    // 	}
    // });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.switchOutputRenderingStyleToText',
                title: (0, nls_1.localize)('notebook.diff.cell.switchOutputRenderingStyleToText', "Switch Output Rendering"),
                icon: notebookIcons_1.renderOutputIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellOutputsTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED
                }
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            context.cell.renderOutput = !context.cell.renderOutput;
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.revertOutputs',
                title: (0, nls_1.localize)('notebook.diff.cell.revertOutputs', "Revert Outputs"),
                icon: notebookIcons_1.revertIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellOutputsTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
                },
                precondition: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            const original = context.cell.original;
            const modified = context.cell.modified;
            if (!original || !modified) {
                return;
            }
            modified.textModel.spliceNotebookCellOutputs({ start: 0, deleteCount: modified.outputs.length, newOutputs: original.outputs });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.revertInput',
                title: (0, nls_1.localize)('notebook.diff.cell.revertInput', "Revert Input"),
                icon: notebookIcons_1.revertIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellInputTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT
                },
                precondition: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            const original = context.cell.original;
            const modified = context.cell.modified;
            if (!original || !modified) {
                return;
            }
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            return bulkEditService.apply([
                new bulkEditService_1.ResourceTextEdit(modified.uri, { range: modified.textModel.getFullModelRange(), text: original.textModel.getValue() }),
            ], { quotableLabel: 'Revert Notebook Cell Content Change' });
        }
    });
    class ToggleRenderAction extends actions_1.Action2 {
        constructor(id, title, precondition, toggled, order, toggleOutputs, toggleMetadata) {
            super({
                id: id,
                title,
                precondition: precondition,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'notebook',
                        when: precondition,
                        order: order,
                    }],
                toggled: toggled
            });
            this.toggleOutputs = toggleOutputs;
            this.toggleMetadata = toggleMetadata;
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            if (this.toggleOutputs !== undefined) {
                const oldValue = configurationService.getValue('notebook.diff.ignoreOutputs');
                configurationService.updateValue('notebook.diff.ignoreOutputs', !oldValue);
            }
            if (this.toggleMetadata !== undefined) {
                const oldValue = configurationService.getValue('notebook.diff.ignoreMetadata');
                configurationService.updateValue('notebook.diff.ignoreMetadata', !oldValue);
            }
        }
    }
    (0, actions_1.registerAction2)(class extends ToggleRenderAction {
        constructor() {
            super('notebook.diff.showOutputs', { value: (0, nls_1.localize)('notebook.diff.showOutputs', "Show Outputs Differences"), original: 'Show Outputs Differences' }, contextkeys_1.ActiveEditorContext.isEqualTo(notebookTextDiffEditor_1.NotebookTextDiffEditor.ID), contextkey_1.ContextKeyExpr.notEquals('config.notebook.diff.ignoreOutputs', true), 2, true, undefined);
        }
    });
    (0, actions_1.registerAction2)(class extends ToggleRenderAction {
        constructor() {
            super('notebook.diff.showMetadata', { value: (0, nls_1.localize)('notebook.diff.showMetadata', "Show Metadata Differences"), original: 'Show Metadata Differences' }, contextkeys_1.ActiveEditorContext.isEqualTo(notebookTextDiffEditor_1.NotebookTextDiffEditor.ID), contextkey_1.ContextKeyExpr.notEquals('config.notebook.diff.ignoreMetadata', true), 1, undefined, true);
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.diff.ignoreMetadata': {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('notebook.diff.ignoreMetadata', "Hide Metadata Differences")
            },
            'notebook.diff.ignoreOutputs': {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('notebook.diff.ignoreOutputs', "Hide Outputs Differences")
            },
        }
    });
});
//# sourceMappingURL=notebookDiffActions.js.map