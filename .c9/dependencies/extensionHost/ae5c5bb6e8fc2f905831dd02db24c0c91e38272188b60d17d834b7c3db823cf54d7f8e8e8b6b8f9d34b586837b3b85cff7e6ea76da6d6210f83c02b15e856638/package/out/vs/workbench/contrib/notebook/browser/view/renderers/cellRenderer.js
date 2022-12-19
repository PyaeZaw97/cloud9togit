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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/config/fontInfo", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/modesRegistry", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/view/cellParts/cellComments", "vs/workbench/contrib/notebook/browser/view/cellParts/cellContextKeys", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDecorations", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDnd", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDragRenderer", "vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions", "vs/workbench/contrib/notebook/browser/view/cellParts/cellExecution", "vs/workbench/contrib/notebook/browser/view/cellParts/cellFocus", "vs/workbench/contrib/notebook/browser/view/cellParts/cellFocusIndicator", "vs/workbench/contrib/notebook/browser/view/cellParts/cellProgressBar", "vs/workbench/contrib/notebook/browser/view/cellParts/cellStatusPart", "vs/workbench/contrib/notebook/browser/view/cellParts/cellToolbars", "vs/workbench/contrib/notebook/browser/view/cellParts/codeCell", "vs/workbench/contrib/notebook/browser/view/cellParts/codeCellRunToolbar", "vs/workbench/contrib/notebook/browser/view/cellParts/collapsedCellInput", "vs/workbench/contrib/notebook/browser/view/cellParts/collapsedCellOutput", "vs/workbench/contrib/notebook/browser/view/cellParts/foldedCellHint", "vs/workbench/contrib/notebook/browser/view/cellParts/markdownCell", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, browser_1, DOM, fastDomNode_1, lifecycle_1, codeEditorWidget_1, fontInfo_1, editorContextKeys_1, modesRegistry_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, cellComments_1, cellContextKeys_1, cellDecorations_1, cellDnd_1, cellDragRenderer_1, cellEditorOptions_1, cellExecution_1, cellFocus_1, cellFocusIndicator_1, cellProgressBar_1, cellStatusPart_1, cellToolbars_1, codeCell_1, codeCellRunToolbar_1, collapsedCellInput_1, collapsedCellOutput_1, foldedCellHint_1, markdownCell_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellRenderer = exports.MarkupCellRenderer = exports.NotebookCellListDelegate = void 0;
    const $ = DOM.$;
    let NotebookCellListDelegate = class NotebookCellListDelegate extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            const editorOptions = this.configurationService.getValue('editor');
            this.lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.PixelRatio.value).lineHeight;
        }
        getHeight(element) {
            return element.getHeight(this.lineHeight);
        }
        hasDynamicHeight(element) {
            return element.hasDynamicHeight();
        }
        getDynamicHeight(element) {
            return element.getDynamicHeight();
        }
        getTemplateId(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Markup) {
                return MarkupCellRenderer.TEMPLATE_ID;
            }
            else {
                return CodeCellRenderer.TEMPLATE_ID;
            }
        }
    };
    NotebookCellListDelegate = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], NotebookCellListDelegate);
    exports.NotebookCellListDelegate = NotebookCellListDelegate;
    class AbstractCellRenderer {
        constructor(instantiationService, notebookEditor, contextMenuService, menuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, language, dndController) {
            this.instantiationService = instantiationService;
            this.notebookEditor = notebookEditor;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextKeyServiceProvider = contextKeyServiceProvider;
            this.dndController = dndController;
            this.editorOptions = new cellEditorOptions_1.CellEditorOptions(this.notebookEditor.getBaseCellEditorOptions(language), this.notebookEditor.notebookOptions, configurationService);
        }
        dispose() {
            this.editorOptions.dispose();
            this.dndController = undefined;
        }
    }
    let MarkupCellRenderer = class MarkupCellRenderer extends AbstractCellRenderer {
        constructor(notebookEditor, dndController, renderedEditors, contextKeyServiceProvider, configurationService, instantiationService, contextMenuService, menuService, keybindingService, notificationService) {
            super(instantiationService, notebookEditor, contextMenuService, menuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, 'markdown', dndController);
            this.renderedEditors = renderedEditors;
        }
        get templateId() {
            return MarkupCellRenderer.TEMPLATE_ID;
        }
        renderTemplate(rootContainer) {
            rootContainer.classList.add('markdown-cell-row');
            const container = DOM.append(rootContainer, DOM.$('.cell-inner-container'));
            const templateDisposables = new lifecycle_1.DisposableStore();
            const contextKeyService = templateDisposables.add(this.contextKeyServiceProvider(container));
            const decorationContainer = DOM.append(rootContainer, $('.cell-decoration'));
            const titleToolbarContainer = DOM.append(container, $('.cell-title-toolbar'));
            const focusIndicatorTop = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-top')));
            const focusIndicatorLeft = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-left')));
            const foldingIndicator = DOM.append(focusIndicatorLeft.domNode, DOM.$('.notebook-folding-indicator'));
            const focusIndicatorRight = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-right')));
            const codeInnerContent = DOM.append(container, $('.cell.code'));
            const editorPart = DOM.append(codeInnerContent, $('.cell-editor-part'));
            const cellInputCollapsedContainer = DOM.append(codeInnerContent, $('.input-collapse-container'));
            const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
            editorPart.style.display = 'none';
            const cellCommentPartContainer = DOM.append(container, $('.cell-comment-container'));
            const innerContent = DOM.append(container, $('.cell.markdown'));
            const bottomCellContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
            const scopedInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyService]));
            const rootClassDelegate = {
                toggle: (className, force) => container.classList.toggle(className, force)
            };
            const titleToolbar = templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.CellTitleToolbarPart, titleToolbarContainer, rootClassDelegate, this.notebookEditor.creationOptions.menuIds.cellTitleToolbar, this.notebookEditor));
            const focusIndicatorBottom = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-bottom')));
            const cellParts = [
                titleToolbar,
                templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.BetweenCellToolbar, this.notebookEditor, titleToolbarContainer, bottomCellContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellStatusPart_1.CellEditorStatusBar, this.notebookEditor, container, editorPart, undefined)),
                templateDisposables.add(new cellFocusIndicator_1.CellFocusIndicator(this.notebookEditor, titleToolbar, focusIndicatorTop, focusIndicatorLeft, focusIndicatorRight, focusIndicatorBottom)),
                templateDisposables.add(new foldedCellHint_1.FoldedCellHint(this.notebookEditor, DOM.append(container, $('.notebook-folded-hint')))),
                templateDisposables.add(new cellDecorations_1.CellDecorations(rootContainer, decorationContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellComments_1.CellComments, this.notebookEditor, cellCommentPartContainer)),
                templateDisposables.add(new collapsedCellInput_1.CollapsedCellInput(this.notebookEditor, cellInputCollapsedContainer)),
                templateDisposables.add(new cellFocus_1.CellFocusPart(container, undefined, this.notebookEditor)),
                templateDisposables.add(new cellDnd_1.CellDragAndDropPart(container)),
                templateDisposables.add(scopedInstaService.createInstance(cellContextKeys_1.CellContextKeyPart, this.notebookEditor)),
            ];
            const templateData = {
                rootContainer,
                cellInputCollapsedContainer,
                instantiationService: scopedInstaService,
                container,
                cellContainer: innerContent,
                editorPart,
                editorContainer,
                foldingIndicator,
                templateDisposables,
                elementDisposables: new lifecycle_1.DisposableStore(),
                cellParts,
                toJSON: () => { return {}; }
            };
            return templateData;
        }
        renderElement(element, index, templateData, height) {
            if (!this.notebookEditor.hasModel()) {
                throw new Error('The notebook editor is not attached with view model yet.');
            }
            templateData.currentRenderedCell = element;
            templateData.currentEditor = undefined;
            templateData.editorPart.style.display = 'none';
            templateData.cellContainer.innerText = '';
            if (height === undefined) {
                return;
            }
            templateData.elementDisposables.add(templateData.instantiationService.createInstance(markdownCell_1.StatefulMarkdownCell, this.notebookEditor, element, templateData, this.renderedEditors));
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.clear();
        }
        disposeElement(_element, _index, templateData) {
            templateData.elementDisposables.clear();
        }
    };
    MarkupCellRenderer.TEMPLATE_ID = 'markdown_cell';
    MarkupCellRenderer = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, actions_1.IMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService)
    ], MarkupCellRenderer);
    exports.MarkupCellRenderer = MarkupCellRenderer;
    let CodeCellRenderer = class CodeCellRenderer extends AbstractCellRenderer {
        constructor(notebookEditor, renderedEditors, dndController, contextKeyServiceProvider, configurationService, contextMenuService, menuService, instantiationService, keybindingService, notificationService) {
            super(instantiationService, notebookEditor, contextMenuService, menuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, modesRegistry_1.PLAINTEXT_LANGUAGE_ID, dndController);
            this.renderedEditors = renderedEditors;
        }
        get templateId() {
            return CodeCellRenderer.TEMPLATE_ID;
        }
        renderTemplate(rootContainer) {
            var _a;
            rootContainer.classList.add('code-cell-row');
            const container = DOM.append(rootContainer, DOM.$('.cell-inner-container'));
            const templateDisposables = new lifecycle_1.DisposableStore();
            const contextKeyService = templateDisposables.add(this.contextKeyServiceProvider(container));
            const decorationContainer = DOM.append(rootContainer, $('.cell-decoration'));
            const focusIndicatorTop = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-top')));
            const titleToolbarContainer = DOM.append(container, $('.cell-title-toolbar'));
            // This is also the drag handle
            const focusIndicatorLeft = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-left')));
            const cellContainer = DOM.append(container, $('.cell.code'));
            const runButtonContainer = DOM.append(cellContainer, $('.run-button-container'));
            const cellInputCollapsedContainer = DOM.append(cellContainer, $('.input-collapse-container'));
            const executionOrderLabel = DOM.append(focusIndicatorLeft.domNode, $('div.execution-count-label'));
            executionOrderLabel.title = (0, nls_1.localize)('cellExecutionOrderCountLabel', 'Execution Order');
            const editorPart = DOM.append(cellContainer, $('.cell-editor-part'));
            const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
            const cellCommentPartContainer = DOM.append(container, $('.cell-comment-container'));
            // create a special context key service that set the inCompositeEditor-contextkey
            const editorContextKeyService = templateDisposables.add(this.contextKeyServiceProvider(editorPart));
            const editorInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorContextKeyService]));
            editorContextKeys_1.EditorContextKeys.inCompositeEditor.bindTo(editorContextKeyService).set(true);
            const editor = editorInstaService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, Object.assign(Object.assign({}, this.editorOptions.getDefaultValue()), { dimension: {
                    width: 0,
                    height: 0
                }, enableDropIntoEditor: true }), {
                contributions: this.notebookEditor.creationOptions.cellEditorContributions
            });
            templateDisposables.add(editor);
            const outputContainer = new fastDomNode_1.FastDomNode(DOM.append(container, $('.output')));
            const cellOutputCollapsedContainer = DOM.append(outputContainer.domNode, $('.output-collapse-container'));
            const outputShowMoreContainer = new fastDomNode_1.FastDomNode(DOM.append(container, $('.output-show-more-container')));
            const focusIndicatorRight = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-right')));
            const focusSinkElement = DOM.append(container, $('.cell-editor-focus-sink'));
            focusSinkElement.setAttribute('tabindex', '0');
            const bottomCellToolbarContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
            const focusIndicatorBottom = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-bottom')));
            const scopedInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyService]));
            const rootClassDelegate = {
                toggle: (className, force) => container.classList.toggle(className, force)
            };
            const titleToolbar = templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.CellTitleToolbarPart, titleToolbarContainer, rootClassDelegate, this.notebookEditor.creationOptions.menuIds.cellTitleToolbar, this.notebookEditor));
            const focusIndicatorPart = templateDisposables.add(new cellFocusIndicator_1.CellFocusIndicator(this.notebookEditor, titleToolbar, focusIndicatorTop, focusIndicatorLeft, focusIndicatorRight, focusIndicatorBottom));
            const cellParts = [
                focusIndicatorPart,
                titleToolbar,
                templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.BetweenCellToolbar, this.notebookEditor, titleToolbarContainer, bottomCellToolbarContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellStatusPart_1.CellEditorStatusBar, this.notebookEditor, container, editorPart, editor)),
                templateDisposables.add(scopedInstaService.createInstance(cellProgressBar_1.CellProgressBar, editorPart, cellInputCollapsedContainer)),
                templateDisposables.add(scopedInstaService.createInstance(codeCellRunToolbar_1.RunToolbar, this.notebookEditor, contextKeyService, container, runButtonContainer)),
                templateDisposables.add(new cellDecorations_1.CellDecorations(rootContainer, decorationContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellComments_1.CellComments, this.notebookEditor, cellCommentPartContainer)),
                templateDisposables.add(new cellExecution_1.CellExecutionPart(this.notebookEditor, executionOrderLabel)),
                templateDisposables.add(scopedInstaService.createInstance(collapsedCellOutput_1.CollapsedCellOutput, this.notebookEditor, cellOutputCollapsedContainer)),
                templateDisposables.add(new collapsedCellInput_1.CollapsedCellInput(this.notebookEditor, cellInputCollapsedContainer)),
                templateDisposables.add(new cellFocus_1.CellFocusPart(container, focusSinkElement, this.notebookEditor)),
                templateDisposables.add(new cellDnd_1.CellDragAndDropPart(container)),
                templateDisposables.add(scopedInstaService.createInstance(cellContextKeys_1.CellContextKeyPart, this.notebookEditor)),
            ];
            const templateData = {
                rootContainer,
                editorPart,
                cellInputCollapsedContainer,
                cellOutputCollapsedContainer,
                instantiationService: scopedInstaService,
                container,
                cellContainer,
                focusSinkElement,
                outputContainer,
                outputShowMoreContainer,
                editor,
                templateDisposables,
                elementDisposables: new lifecycle_1.DisposableStore(),
                cellParts,
                toJSON: () => { return {}; }
            };
            // focusIndicatorLeft covers the left margin area
            // code/outputFocusIndicator need to be registered as drag handlers so their click handlers don't take over
            const dragHandles = [focusIndicatorLeft.domNode, focusIndicatorPart.codeFocusIndicator.domNode, focusIndicatorPart.outputFocusIndicator.domNode];
            (_a = this.dndController) === null || _a === void 0 ? void 0 : _a.registerDragHandle(templateData, rootContainer, dragHandles, () => new cellDragRenderer_1.CodeCellDragImageRenderer().getDragImage(templateData, templateData.editor, 'code'));
            return templateData;
        }
        renderElement(element, index, templateData, height) {
            if (!this.notebookEditor.hasModel()) {
                throw new Error('The notebook editor is not attached with view model yet.');
            }
            templateData.currentRenderedCell = element;
            if (height === undefined) {
                return;
            }
            templateData.outputContainer.domNode.innerText = '';
            templateData.outputContainer.domNode.appendChild(templateData.cellOutputCollapsedContainer);
            templateData.elementDisposables.add(templateData.instantiationService.createInstance(codeCell_1.CodeCell, this.notebookEditor, element, templateData));
            this.renderedEditors.set(element, templateData.editor);
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.clear();
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
            this.renderedEditors.delete(element);
        }
    };
    CodeCellRenderer.TEMPLATE_ID = 'code_cell';
    CodeCellRenderer = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService)
    ], CodeCellRenderer);
    exports.CodeCellRenderer = CodeCellRenderer;
});
//# sourceMappingURL=cellRenderer.js.map