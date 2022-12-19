/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contextkeys", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, nls_1, actions_1, configuration_1, configurationRegistry_1, contextkey_1, platform_1, contextkeys_1, coreActions_1, notebookContextKeys_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellEditorOptions = void 0;
    class CellEditorOptions extends cellPart_1.CellPart {
        constructor(base, notebookOptions, configurationService) {
            super();
            this.base = base;
            this.notebookOptions = notebookOptions;
            this.configurationService = configurationService;
            this._lineNumbers = 'inherit';
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(base.onDidChange(() => {
                this._recomputeOptions();
            }));
            this._value = this._computeEditorOptions();
        }
        updateState(element, e) {
            if (e.cellLineNumberChanged) {
                this.setLineNumbers(element.lineNumbers);
            }
        }
        _recomputeOptions() {
            this._value = this._computeEditorOptions();
            this._onDidChange.fire();
        }
        _computeEditorOptions() {
            const renderLineNumbers = this.configurationService.getValue('notebook.lineNumbers') === 'on';
            const lineNumbers = renderLineNumbers ? 'on' : 'off';
            const value = this.base.value;
            if (value.lineNumbers !== lineNumbers) {
                return Object.assign(Object.assign({}, value), { lineNumbers });
            }
            else {
                return Object.assign({}, value);
            }
        }
        getUpdatedValue(internalMetadata, cellUri) {
            const options = this.getValue(internalMetadata, cellUri);
            delete options.hover; // This is toggled by a debug editor contribution
            return options;
        }
        getValue(internalMetadata, cellUri) {
            return Object.assign(Object.assign({}, this._value), {
                padding: this.notebookOptions.computeEditorPadding(internalMetadata, cellUri)
            });
        }
        getDefaultValue() {
            return Object.assign(Object.assign({}, this._value), {
                padding: { top: 12, bottom: 12 }
            });
        }
        setLineNumbers(lineNumbers) {
            this._lineNumbers = lineNumbers;
            if (this._lineNumbers === 'inherit') {
                const renderLiNumbers = this.configurationService.getValue('notebook.lineNumbers') === 'on';
                const lineNumbers = renderLiNumbers ? 'on' : 'off';
                this._value.lineNumbers = lineNumbers;
            }
            else {
                this._value.lineNumbers = lineNumbers;
            }
            this._onDidChange.fire();
        }
    }
    exports.CellEditorOptions = CellEditorOptions;
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.lineNumbers': {
                type: 'string',
                enum: ['off', 'on'],
                default: 'off',
                markdownDescription: (0, nls_1.localize)('notebook.lineNumbers', "Controls the display of line numbers in the cell editor.")
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleLineNumberAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLineNumbers',
                title: { value: (0, nls_1.localize)('notebook.toggleLineNumbers', "Toggle Notebook Line Numbers"), original: 'Toggle Notebook Line Numbers' },
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)
                    }
                ],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.notEquals('config.notebook.lineNumbers', 'off'),
                    title: { value: (0, nls_1.localize)('notebook.showLineNumbers', "Show Notebook Line Numbers"), original: 'Show Notebook Line Numbers' },
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const renderLiNumbers = configurationService.getValue('notebook.lineNumbers') === 'on';
            if (renderLiNumbers) {
                configurationService.updateValue('notebook.lineNumbers', 'off');
            }
            else {
                configurationService.updateValue('notebook.lineNumbers', 'on');
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleActiveLineNumberAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: 'notebook.cell.toggleLineNumbers',
                title: (0, nls_1.localize)('notebook.cell.toggleLineNumbers.title', "Show Cell Line Numbers"),
                precondition: contextkeys_1.ActiveEditorContext.isEqualTo(notebookCommon_1.NOTEBOOK_EDITOR_ID),
                menu: [{
                        id: actions_1.MenuId.NotebookCellTitle,
                        group: 'View',
                        order: 1
                    }],
                toggled: contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.isEqualTo('on'), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.isEqualTo('inherit'), contextkey_1.ContextKeyExpr.equals('config.notebook.lineNumbers', 'on')))
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                this.updateCell(accessor.get(configuration_1.IConfigurationService), context.cell);
            }
            else {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                context.selectedCells.forEach(cell => {
                    this.updateCell(configurationService, cell);
                });
            }
        }
        updateCell(configurationService, cell) {
            const renderLineNumbers = configurationService.getValue('notebook.lineNumbers') === 'on';
            const cellLineNumbers = cell.lineNumbers;
            // 'on', 'inherit' 	-> 'on'
            // 'on', 'off'		-> 'off'
            // 'on', 'on'		-> 'on'
            // 'off', 'inherit'	-> 'off'
            // 'off', 'off'		-> 'off'
            // 'off', 'on'		-> 'on'
            const currentLineNumberIsOn = cellLineNumbers === 'on' || (cellLineNumbers === 'inherit' && renderLineNumbers);
            if (currentLineNumberIsOn) {
                cell.lineNumbers = 'off';
            }
            else {
                cell.lineNumbers = 'on';
            }
        }
    });
});
//# sourceMappingURL=cellEditorOptions.js.map