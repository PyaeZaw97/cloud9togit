/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/platform/telemetry/common/telemetry"], function (require, exports, uri_1, nls_1, actions_1, contextkey_1, notebookBrowser_1, notebookContextKeys_1, notebookRange_1, editorService_1, notebookEditorService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cellExecutionArgs = exports.parseMultiCellExecutionArgs = exports.getEditorFromArgsOrActivePane = exports.executeNotebookCondition = exports.NotebookCellAction = exports.NotebookMultiCellAction = exports.NotebookAction = exports.getContextFromUri = exports.getContextFromActiveEditor = exports.CellOverflowToolbarGroups = exports.CellToolbarOrder = exports.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT = exports.CELL_TITLE_OUTPUT_GROUP_ID = exports.CELL_TITLE_CELL_GROUP_ID = exports.NOTEBOOK_ACTIONS_CATEGORY = exports.SELECT_KERNEL_ID = void 0;
    // Kernel Command
    exports.SELECT_KERNEL_ID = '_notebook.selectKernel';
    exports.NOTEBOOK_ACTIONS_CATEGORY = { value: (0, nls_1.localize)('notebookActions.category', "Notebook"), original: 'Notebook' };
    exports.CELL_TITLE_CELL_GROUP_ID = 'inline/cell';
    exports.CELL_TITLE_OUTPUT_GROUP_ID = 'inline/output';
    exports.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT = 100 /* KeybindingWeight.EditorContrib */; // smaller than Suggest Widget, etc
    var CellToolbarOrder;
    (function (CellToolbarOrder) {
        CellToolbarOrder[CellToolbarOrder["EditCell"] = 0] = "EditCell";
        CellToolbarOrder[CellToolbarOrder["ExecuteAboveCells"] = 1] = "ExecuteAboveCells";
        CellToolbarOrder[CellToolbarOrder["ExecuteCellAndBelow"] = 2] = "ExecuteCellAndBelow";
        CellToolbarOrder[CellToolbarOrder["SaveCell"] = 3] = "SaveCell";
        CellToolbarOrder[CellToolbarOrder["SplitCell"] = 4] = "SplitCell";
        CellToolbarOrder[CellToolbarOrder["ClearCellOutput"] = 5] = "ClearCellOutput";
    })(CellToolbarOrder = exports.CellToolbarOrder || (exports.CellToolbarOrder = {}));
    var CellOverflowToolbarGroups;
    (function (CellOverflowToolbarGroups) {
        CellOverflowToolbarGroups["Copy"] = "1_copy";
        CellOverflowToolbarGroups["Insert"] = "2_insert";
        CellOverflowToolbarGroups["Edit"] = "3_edit";
    })(CellOverflowToolbarGroups = exports.CellOverflowToolbarGroups || (exports.CellOverflowToolbarGroups = {}));
    function getContextFromActiveEditor(editorService) {
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor || !editor.hasModel()) {
            return;
        }
        const activeCell = editor.getActiveCell();
        const selectedCells = editor.getSelectionViewModels();
        return {
            cell: activeCell,
            selectedCells,
            notebookEditor: editor
        };
    }
    exports.getContextFromActiveEditor = getContextFromActiveEditor;
    function getWidgetFromUri(accessor, uri) {
        const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
        const widget = notebookEditorService.listNotebookEditors().find(widget => widget.hasModel() && widget.textModel.uri.toString() === uri.toString());
        if (widget && widget.hasModel()) {
            return widget;
        }
        return undefined;
    }
    function getContextFromUri(accessor, context) {
        const uri = uri_1.URI.revive(context);
        if (uri) {
            const widget = getWidgetFromUri(accessor, uri);
            if (widget) {
                return {
                    notebookEditor: widget,
                };
            }
        }
        return undefined;
    }
    exports.getContextFromUri = getContextFromUri;
    class NotebookAction extends actions_1.Action2 {
        constructor(desc) {
            if (desc.f1 !== false) {
                desc.f1 = false;
                const f1Menu = {
                    id: actions_1.MenuId.CommandPalette,
                    when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
                };
                if (!desc.menu) {
                    desc.menu = [];
                }
                else if (!Array.isArray(desc.menu)) {
                    desc.menu = [desc.menu];
                }
                desc.menu = [
                    ...desc.menu,
                    f1Menu
                ];
            }
            desc.category = exports.NOTEBOOK_ACTIONS_CATEGORY;
            super(desc);
        }
        async run(accessor, context, ...additionalArgs) {
            const isFromUI = !!context;
            const from = isFromUI ? (this.isNotebookActionContext(context) ? 'notebookToolbar' : 'editorToolbar') : undefined;
            if (!this.isNotebookActionContext(context)) {
                context = this.getEditorContextFromArgsOrActive(accessor, context, ...additionalArgs);
                if (!context) {
                    return;
                }
            }
            if (from !== undefined) {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
            }
            return this.runWithContext(accessor, context);
        }
        isNotebookActionContext(context) {
            return !!context && !!context.notebookEditor;
        }
        getEditorContextFromArgsOrActive(accessor, context, ...additionalArgs) {
            return getContextFromActiveEditor(accessor.get(editorService_1.IEditorService));
        }
    }
    exports.NotebookAction = NotebookAction;
    // todo@rebornix, replace NotebookAction with this
    class NotebookMultiCellAction extends actions_1.Action2 {
        constructor(desc) {
            if (desc.f1 !== false) {
                desc.f1 = false;
                const f1Menu = {
                    id: actions_1.MenuId.CommandPalette,
                    when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
                };
                if (!desc.menu) {
                    desc.menu = [];
                }
                else if (!Array.isArray(desc.menu)) {
                    desc.menu = [desc.menu];
                }
                desc.menu = [
                    ...desc.menu,
                    f1Menu
                ];
            }
            desc.category = exports.NOTEBOOK_ACTIONS_CATEGORY;
            super(desc);
        }
        parseArgs(accessor, ...args) {
            return undefined;
        }
        isCellToolbarContext(context) {
            return !!context && !!context.notebookEditor && context.$mid === 12 /* MarshalledId.NotebookCellActionContext */;
        }
        isEditorContext(context) {
            return !!context && context.groupId !== undefined;
        }
        /**
         * The action/command args are resolved in following order
         * `run(accessor, cellToolbarContext)` from cell toolbar
         * `run(accessor, ...args)` from command service with arguments
         * `run(accessor, undefined)` from keyboard shortcuts, command palatte, etc
         */
        async run(accessor, ...additionalArgs) {
            const context = additionalArgs[0];
            const isFromCellToolbar = this.isCellToolbarContext(context);
            const isFromEditorToolbar = this.isEditorContext(context);
            const from = isFromCellToolbar ? 'cellToolbar' : (isFromEditorToolbar ? 'editorToolbar' : 'other');
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            if (isFromCellToolbar) {
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
                return this.runWithContext(accessor, context);
            }
            // handle parsed args
            const parsedArgs = this.parseArgs(accessor, ...additionalArgs);
            if (parsedArgs) {
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
                return this.runWithContext(accessor, parsedArgs);
            }
            // no parsed args, try handle active editor
            const editor = getEditorFromArgsOrActivePane(accessor);
            if (editor) {
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
                return this.runWithContext(accessor, {
                    ui: false,
                    notebookEditor: editor,
                    selectedCells: (0, notebookBrowser_1.cellRangeToViewCells)(editor, editor.getSelections())
                });
            }
        }
    }
    exports.NotebookMultiCellAction = NotebookMultiCellAction;
    class NotebookCellAction extends NotebookAction {
        isCellActionContext(context) {
            return !!context && !!context.notebookEditor && !!context.cell;
        }
        getCellContextFromArgs(accessor, context, ...additionalArgs) {
            return undefined;
        }
        async run(accessor, context, ...additionalArgs) {
            if (this.isCellActionContext(context)) {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: 'cellToolbar' });
                return this.runWithContext(accessor, context);
            }
            const contextFromArgs = this.getCellContextFromArgs(accessor, context, ...additionalArgs);
            if (contextFromArgs) {
                return this.runWithContext(accessor, contextFromArgs);
            }
            const activeEditorContext = this.getEditorContextFromArgsOrActive(accessor);
            if (this.isCellActionContext(activeEditorContext)) {
                return this.runWithContext(accessor, activeEditorContext);
            }
        }
    }
    exports.NotebookCellAction = NotebookCellAction;
    exports.executeNotebookCondition = contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.key, 0);
    function isMultiCellArgs(arg) {
        if (arg === undefined) {
            return false;
        }
        const ranges = arg.ranges;
        if (!ranges) {
            return false;
        }
        if (!Array.isArray(ranges) || ranges.some(range => !(0, notebookRange_1.isICellRange)(range))) {
            return false;
        }
        if (arg.document) {
            const uri = uri_1.URI.revive(arg.document);
            if (!uri) {
                return false;
            }
        }
        return true;
    }
    function getEditorFromArgsOrActivePane(accessor, context) {
        var _a;
        const editorFromUri = (_a = getContextFromUri(accessor, context)) === null || _a === void 0 ? void 0 : _a.notebookEditor;
        if (editorFromUri) {
            return editorFromUri;
        }
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(accessor.get(editorService_1.IEditorService).activeEditorPane);
        if (!editor || !editor.hasModel()) {
            return;
        }
        return editor;
    }
    exports.getEditorFromArgsOrActivePane = getEditorFromArgsOrActivePane;
    function parseMultiCellExecutionArgs(accessor, ...args) {
        var _a;
        const firstArg = args[0];
        if (isMultiCellArgs(firstArg)) {
            const editor = getEditorFromArgsOrActivePane(accessor, firstArg.document);
            if (!editor) {
                return;
            }
            const ranges = firstArg.ranges;
            const selectedCells = ranges.map(range => editor.getCellsInRange(range).slice(0)).flat();
            const autoReveal = firstArg.autoReveal;
            return {
                ui: false,
                notebookEditor: editor,
                selectedCells,
                autoReveal
            };
        }
        // handle legacy arguments
        if ((0, notebookRange_1.isICellRange)(firstArg)) {
            // cellRange, document
            const secondArg = args[1];
            const editor = getEditorFromArgsOrActivePane(accessor, secondArg);
            if (!editor) {
                return;
            }
            return {
                ui: false,
                notebookEditor: editor,
                selectedCells: editor.getCellsInRange(firstArg)
            };
        }
        // let's just execute the active cell
        const context = getContextFromActiveEditor(accessor.get(editorService_1.IEditorService));
        return context ? {
            ui: false,
            notebookEditor: context.notebookEditor,
            selectedCells: (_a = context.selectedCells) !== null && _a !== void 0 ? _a : []
        } : undefined;
    }
    exports.parseMultiCellExecutionArgs = parseMultiCellExecutionArgs;
    exports.cellExecutionArgs = [
        {
            isOptional: true,
            name: 'options',
            description: 'The cell range options',
            schema: {
                'type': 'object',
                'required': ['ranges'],
                'properties': {
                    'ranges': {
                        'type': 'array',
                        items: [
                            {
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
                        ]
                    },
                    'document': {
                        'type': 'object',
                        'description': 'The document uri',
                    },
                    'autoReveal': {
                        'type': 'boolean',
                        'description': 'Whether the cell should be revealed into view automatically'
                    }
                }
            }
        }
    ];
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellTitle, {
        submenu: actions_1.MenuId.NotebookCellInsert,
        title: (0, nls_1.localize)('notebookMenu.insertCell', "Insert Cell"),
        group: "2_insert" /* CellOverflowToolbarGroups.Insert */,
        when: notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        submenu: actions_1.MenuId.NotebookCellTitle,
        title: (0, nls_1.localize)('notebookMenu.cellTitle', "Notebook Cell"),
        group: "2_insert" /* CellOverflowToolbarGroups.Insert */,
        when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED
    });
});
//# sourceMappingURL=coreActions.js.map