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
define(["require", "exports", "vs/base/common/mime", "vs/base/common/uri", "vs/editor/common/editorContextKeys", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, mime_1, uri_1, editorContextKeys_1, getIconClasses_1, model_1, language_1, nls_1, actions_1, commands_1, contextkey_1, contextkeys_1, quickInput_1, cellOperations_1, coreActions_1, notebookContextKeys_1, notebookBrowser_1, icons, notebookCommon_1, languageDetectionWorkerService_1, notebookExecutionStateService_1, notification_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeleteCellAction = void 0;
    const CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID = 'notebook.clearAllCellsOutputs';
    const EDIT_CELL_COMMAND_ID = 'notebook.cell.edit';
    const DELETE_CELL_COMMAND_ID = 'notebook.cell.delete';
    const CLEAR_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.clearOutputs';
    let DeleteCellAction = class DeleteCellAction extends actions_1.MenuItemAction {
        constructor(contextKeyService, commandService) {
            super({
                id: DELETE_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.deleteCell', "Delete Cell"),
                icon: icons.deleteCellIcon,
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true)
            }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
        }
    };
    DeleteCellAction = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService)
    ], DeleteCellAction);
    exports.DeleteCellAction = DeleteCellAction;
    (0, actions_1.registerAction2)(class EditCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EDIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.editCell', "Edit Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true)),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.toNegated(), notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    order: 0 /* CellToolbarOrder.EditCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.editIcon,
            });
        }
        async runWithContext(accessor, context) {
            if (!context.notebookEditor.hasModel() || context.notebookEditor.isReadOnly) {
                return;
            }
            context.notebookEditor.focusNotebookCell(context.cell, 'editor');
        }
    });
    const quitEditCondition = contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext);
    (0, actions_1.registerAction2)(class QuitEditCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.QUIT_EDIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.quitEdit', "Stop Editing Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    order: 3 /* CellToolbarOrder.SaveCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.stopEditIcon,
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(quitEditCondition, editorContextKeys_1.EditorContextKeys.hoverVisible.toNegated(), editorContextKeys_1.EditorContextKeys.hasNonEmptySelection.toNegated(), editorContextKeys_1.EditorContextKeys.hasMultipleSelections.toNegated()),
                        primary: 9 /* KeyCode.Escape */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT - 5
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(quitEditCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                        primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                        win: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                        },
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT - 5
                    },
                ]
            });
        }
        async runWithContext(accessor, context) {
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, notebookBrowser_1.QUIT_EDIT_CELL_COMMAND_ID);
            }
            context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
        }
    });
    (0, actions_1.registerAction2)(class DeleteCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: DELETE_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.deleteCell', "Delete Cell"),
                keybinding: {
                    primary: 20 /* KeyCode.Delete */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
                    },
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: icons.deleteCellIcon
            });
        }
        async runWithContext(accessor, context) {
            if (!context.notebookEditor.hasModel() || context.notebookEditor.isReadOnly) {
                return;
            }
            (0, cellOperations_1.runDeleteAction)(context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class ClearCellOutputsAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: CLEAR_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('clearCellOutputs', 'Clear Cell Outputs'),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), coreActions_1.executeNotebookCondition, notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON.toNegated()),
                        order: 5 /* CellToolbarOrder.ClearCellOutput */,
                        group: coreActions_1.CELL_TITLE_OUTPUT_GROUP_ID
                    },
                    {
                        id: actions_1.MenuId.NotebookOutputToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE)
                    },
                ],
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    primary: 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: icons.clearIcon
            });
        }
        async runWithContext(accessor, context) {
            var _a;
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const editor = context.notebookEditor;
            if (!editor.hasModel() || !editor.textModel.length) {
                return;
            }
            const cell = context.cell;
            const index = editor.textModel.cells.indexOf(cell.model);
            if (index < 0) {
                return;
            }
            editor.textModel.applyEdits([{ editType: 2 /* CellEditType.Output */, index, outputs: [] }], true, undefined, () => undefined, undefined, true);
            const runState = (_a = notebookExecutionStateService.getCellExecution(context.cell.uri)) === null || _a === void 0 ? void 0 : _a.state;
            if (runState !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                context.notebookEditor.textModel.applyEdits([{
                        editType: 9 /* CellEditType.PartialInternalMetadata */, index, internalMetadata: {
                            runStartTime: null,
                            runStartTimeAdjustment: null,
                            runEndTime: null,
                            executionOrder: null,
                            lastRunSuccess: null
                        }
                    }], true, undefined, () => undefined, undefined, true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ClearAllCellOutputsAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize)('clearAllCellsOutputs', 'Clear Outputs of All Cells'),
                precondition: notebookContextKeys_1.NOTEBOOK_HAS_OUTPUTS,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.and(coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 0
                    }
                ],
                icon: icons.clearIcon
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const editor = context.notebookEditor;
            if (!editor.hasModel() || !editor.textModel.length) {
                return;
            }
            editor.textModel.applyEdits(editor.textModel.cells.map((cell, index) => ({
                editType: 2 /* CellEditType.Output */, index, outputs: []
            })), true, undefined, () => undefined, undefined, true);
            const clearExecutionMetadataEdits = editor.textModel.cells.map((cell, index) => {
                var _a;
                const runState = (_a = notebookExecutionStateService.getCellExecution(cell.uri)) === null || _a === void 0 ? void 0 : _a.state;
                if (runState !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                    return {
                        editType: 9 /* CellEditType.PartialInternalMetadata */, index, internalMetadata: {
                            runStartTime: null,
                            runStartTimeAdjustment: null,
                            runEndTime: null,
                            executionOrder: null,
                            lastRunSuccess: null
                        }
                    };
                }
                else {
                    return undefined;
                }
            }).filter(edit => !!edit);
            if (clearExecutionMetadataEdits.length) {
                context.notebookEditor.textModel.applyEdits(clearExecutionMetadataEdits, true, undefined, () => undefined, undefined, true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ChangeCellLanguageAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.CHANGE_CELL_LANGUAGE,
                title: (0, nls_1.localize)('changeLanguage', 'Change Cell Language'),
                description: {
                    description: (0, nls_1.localize)('changeLanguage', 'Change Cell Language'),
                    args: [
                        {
                            name: 'range',
                            description: 'The cell range',
                            schema: {
                                'type': 'object',
                                'required': ['start', 'end'],
                                'properties': {
                                    'start': {
                                        'type': 'number'
                                    },
                                    'end': {
                                        'type': 'number'
                                    }
                                }
                            }
                        },
                        {
                            name: 'language',
                            description: 'The target cell language',
                            schema: {
                                'type': 'string'
                            }
                        }
                    ]
                }
            });
        }
        getCellContextFromArgs(accessor, context, ...additionalArgs) {
            if (!context || typeof context.start !== 'number' || typeof context.end !== 'number' || context.start >= context.end) {
                return;
            }
            const language = additionalArgs.length && typeof additionalArgs[0] === 'string' ? additionalArgs[0] : undefined;
            const activeEditorContext = this.getEditorContextFromArgsOrActive(accessor);
            if (!activeEditorContext || !activeEditorContext.notebookEditor.hasModel() || context.start >= activeEditorContext.notebookEditor.getLength()) {
                return;
            }
            // TODO@rebornix, support multiple cells
            return {
                notebookEditor: activeEditorContext.notebookEditor,
                cell: activeEditorContext.notebookEditor.cellAt(context.start),
                language
            };
        }
        async runWithContext(accessor, context) {
            if (context.language) {
                await this.setLanguage(context, context.language);
            }
            else {
                await this.showLanguagePicker(accessor, context);
            }
        }
        async showLanguagePicker(accessor, context) {
            var _a, _b;
            const topItems = [];
            const mainItems = [];
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const providerLanguages = new Set([
                ...((_b = (_a = context.notebookEditor.activeKernel) === null || _a === void 0 ? void 0 : _a.supportedLanguages) !== null && _b !== void 0 ? _b : languageService.getRegisteredLanguageIds()),
                'markdown'
            ]);
            providerLanguages.forEach(languageId => {
                let description;
                if (context.cell.cellKind === notebookCommon_1.CellKind.Markup ? (languageId === 'markdown') : (languageId === context.cell.language)) {
                    description = (0, nls_1.localize)('languageDescription', "({0}) - Current Language", languageId);
                }
                else {
                    description = (0, nls_1.localize)('languageDescriptionConfigured', "({0})", languageId);
                }
                const languageName = languageService.getLanguageName(languageId);
                if (!languageName) {
                    // Notebook has unrecognized language
                    return;
                }
                const item = {
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, this.getFakeResource(languageName, languageService)),
                    description,
                    languageId
                };
                if (languageId === 'markdown' || languageId === context.cell.language) {
                    topItems.push(item);
                }
                else {
                    mainItems.push(item);
                }
            });
            mainItems.sort((a, b) => {
                return a.description.localeCompare(b.description);
            });
            // Offer to "Auto Detect"
            const autoDetectMode = {
                label: (0, nls_1.localize)('autoDetect', "Auto Detect")
            };
            const picks = [
                autoDetectMode,
                { type: 'separator', label: (0, nls_1.localize)('languagesPicks', "languages (identifier)") },
                ...topItems,
                { type: 'separator' },
                ...mainItems
            ];
            const selection = await quickInputService.pick(picks, { placeHolder: (0, nls_1.localize)('pickLanguageToConfigure', "Select Language Mode") });
            const languageId = selection === autoDetectMode
                ? await languageDetectionService.detectLanguage(context.cell.uri)
                : selection === null || selection === void 0 ? void 0 : selection.languageId;
            if (languageId) {
                await this.setLanguage(context, languageId);
            }
        }
        async setLanguage(context, languageId) {
            await setCellToLanguage(languageId, context);
        }
        /**
         * Copied from editorStatus.ts
         */
        getFakeResource(lang, languageService) {
            let fakeResource;
            const languageId = languageService.getLanguageIdByLanguageName(lang);
            if (languageId) {
                const extensions = languageService.getExtensions(languageId);
                if (extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = languageService.getFilenames(languageId);
                    if (filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
            }
            return fakeResource;
        }
    });
    (0, actions_1.registerAction2)(class DetectCellLanguageAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.DETECT_CELL_LANGUAGE,
                title: (0, nls_1.localize)('detectLanguage', 'Accept Detected Language for Cell'),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                keybinding: { primary: 34 /* KeyCode.KeyD */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ }
            });
        }
        async runWithContext(accessor, context) {
            var _a;
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const kernel = kernelService.getSelectedOrSuggestedKernel(context.notebookEditor.textModel);
            const providerLanguages = [...(_a = kernel === null || kernel === void 0 ? void 0 : kernel.supportedLanguages) !== null && _a !== void 0 ? _a : []];
            providerLanguages.push('markdown');
            const detection = await languageDetectionService.detectLanguage(context.cell.uri, providerLanguages);
            if (detection) {
                setCellToLanguage(detection, context);
            }
            else {
                notificationService.warn((0, nls_1.localize)('noDetection', "Unable to detect cell language"));
            }
        }
    });
    async function setCellToLanguage(languageId, context) {
        var _a, _b;
        if (languageId === 'markdown' && ((_a = context.cell) === null || _a === void 0 ? void 0 : _a.language) !== 'markdown') {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Markup, { cell: context.cell, notebookEditor: context.notebookEditor, ui: true }, 'markdown', mime_1.Mimes.markdown);
            const newCell = context.notebookEditor.cellAt(idx);
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
        else if (languageId !== 'markdown' && ((_b = context.cell) === null || _b === void 0 ? void 0 : _b.cellKind) === notebookCommon_1.CellKind.Markup) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Code, { cell: context.cell, notebookEditor: context.notebookEditor, ui: true }, languageId);
        }
        else {
            const index = context.notebookEditor.textModel.cells.indexOf(context.cell.model);
            context.notebookEditor.textModel.applyEdits([{ editType: 4 /* CellEditType.CellLanguage */, index, language: languageId }], true, undefined, () => undefined, undefined, true);
        }
    }
});
//# sourceMappingURL=editActions.js.map