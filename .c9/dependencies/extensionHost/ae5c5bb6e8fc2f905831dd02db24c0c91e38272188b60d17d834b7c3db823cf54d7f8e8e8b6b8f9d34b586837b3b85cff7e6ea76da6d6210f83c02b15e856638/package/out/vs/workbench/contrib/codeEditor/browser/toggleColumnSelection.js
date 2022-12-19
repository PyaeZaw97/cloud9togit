/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/selection"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, codeEditorService_1, coreCommands_1, position_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleColumnSelectionAction = void 0;
    class ToggleColumnSelectionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleColumnSelectionAction.ID,
                title: {
                    value: (0, nls_1.localize)('toggleColumnSelection', "Toggle Column Selection Mode"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miColumnSelection', comment: ['&& denotes a mnemonic'] }, "Column &&Selection Mode"),
                    original: 'Toggle Column Selection Mode'
                },
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.columnSelection', true),
                menu: {
                    id: actions_1.MenuId.MenubarSelectionMenu,
                    group: '4_config',
                    order: 2
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const oldValue = configurationService.getValue('editor.columnSelection');
            const codeEditor = this._getCodeEditor(codeEditorService);
            await configurationService.updateValue('editor.columnSelection', !oldValue);
            const newValue = configurationService.getValue('editor.columnSelection');
            if (!codeEditor || codeEditor !== this._getCodeEditor(codeEditorService) || oldValue === newValue || !codeEditor.hasModel() || typeof oldValue !== 'boolean' || typeof newValue !== 'boolean') {
                return;
            }
            const viewModel = codeEditor._getViewModel();
            if (codeEditor.getOption(18 /* EditorOption.columnSelection */)) {
                const selection = codeEditor.getSelection();
                const modelSelectionStart = new position_1.Position(selection.selectionStartLineNumber, selection.selectionStartColumn);
                const viewSelectionStart = viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelSelectionStart);
                const modelPosition = new position_1.Position(selection.positionLineNumber, selection.positionColumn);
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
                coreCommands_1.CoreNavigationCommands.MoveTo.runCoreEditorCommand(viewModel, {
                    position: modelSelectionStart,
                    viewPosition: viewSelectionStart
                });
                const visibleColumn = viewModel.cursorConfig.visibleColumnFromColumn(viewModel, viewPosition);
                coreCommands_1.CoreNavigationCommands.ColumnSelect.runCoreEditorCommand(viewModel, {
                    position: modelPosition,
                    viewPosition: viewPosition,
                    doColumnSelect: true,
                    mouseColumn: visibleColumn + 1
                });
            }
            else {
                const columnSelectData = viewModel.getCursorColumnSelectData();
                const fromViewColumn = viewModel.cursorConfig.columnFromVisibleColumn(viewModel, columnSelectData.fromViewLineNumber, columnSelectData.fromViewVisualColumn);
                const fromPosition = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(columnSelectData.fromViewLineNumber, fromViewColumn));
                const toViewColumn = viewModel.cursorConfig.columnFromVisibleColumn(viewModel, columnSelectData.toViewLineNumber, columnSelectData.toViewVisualColumn);
                const toPosition = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(columnSelectData.toViewLineNumber, toViewColumn));
                codeEditor.setSelection(new selection_1.Selection(fromPosition.lineNumber, fromPosition.column, toPosition.lineNumber, toPosition.column));
            }
        }
        _getCodeEditor(codeEditorService) {
            const codeEditor = codeEditorService.getFocusedCodeEditor();
            if (codeEditor) {
                return codeEditor;
            }
            return codeEditorService.getActiveCodeEditor();
        }
    }
    exports.ToggleColumnSelectionAction = ToggleColumnSelectionAction;
    ToggleColumnSelectionAction.ID = 'editor.action.toggleColumnSelection';
    (0, actions_1.registerAction2)(ToggleColumnSelectionAction);
});
//# sourceMappingURL=toggleColumnSelection.js.map